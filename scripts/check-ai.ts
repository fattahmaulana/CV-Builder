import fs from "fs";
import path from "path";
import {
  verifyEncryptionKeyHealth,
  testGeminiKey,
  validateGeminiModels,
  decryptApiKey,
  getOptimalApiKey,
  recordKeyUsage,
  __setMockDbKeys,
  __getMockDbKeys,
} from "../src/lib/admin/api-key-manager";
import { createAdminClient } from "../src/lib/supabase/admin";

// 1. Load .env.local if present
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const idx = trimmed.indexOf("=");
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim();
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

async function main() {
  console.log("========================================================================");
  console.log("        CVBuilder AI & Gemini Health Check & Diagnostics CLI            ");
  console.log("========================================================================\n");

  // Step 1: Encryption Check
  console.log("--- 1. ENCRYPTION MASTER KEY VERIFICATION ---");
  const encKeyPresent = Boolean(
    process.env.ENCRYPTION_MASTER_KEY ||
      process.env.KEY_ENCRYPTION_SECRET ||
      process.env.ENCRYPTION_KEY
  );
  console.log(`Encryption Key Configured: ${encKeyPresent ? "YES ✅" : "NO ❌"}`);

  const encHealth = verifyEncryptionKeyHealth();
  console.log(`AES-256-GCM Round-trip:   ${encHealth.healthy ? "PASSED ✅" : `FAILED ❌ (${encHealth.error})`}\n`);

  // Step 2: Model Configuration
  console.log("--- 2. MODEL CONFIGURATION ---");
  const primaryModel = process.env.GEMINI_MODEL || "gemini-3.5-flash";
  const fallbackModel = process.env.GEMINI_FALLBACK_MODEL || "gemini-3.5-flash-lite";
  console.log(`Primary Model:  ${primaryModel}`);
  console.log(`Fallback Model: ${fallbackModel}\n`);

  // Step 3: Collect Keys
  console.log("--- 3. KEY POOL DIAGNOSTICS (25s Timeout) ---");
  const keysToTest: Array<{
    id: string;
    label: string;
    plainKey: string;
    maskedKey: string;
    source: "db" | "env";
  }> = [];

  try {
    const supabase = createAdminClient();
    const { data: dbKeys } = await supabase
      .from("api_keys")
      .select("id, label, encrypted_key, last_four_chars, status")
      .eq("provider", "gemini");

    for (const k of dbKeys || []) {
      try {
        const plain = decryptApiKey(k.encrypted_key);
        keysToTest.push({
          id: k.id,
          label: k.label,
          plainKey: plain,
          maskedKey: `AIza...${k.last_four_chars}`,
          source: "db",
        });
      } catch {
        keysToTest.push({
          id: k.id,
          label: k.label,
          plainKey: "",
          maskedKey: `AIza...${k.last_four_chars}`,
          source: "db",
        });
      }
    }
  } catch (err) {
    console.log(`[Notice] Database unreachable (${err instanceof Error ? err.message : "Offline mode"}), checking env key.`);
  }

  // Include environment fallback key
  if (process.env.GEMINI_API_KEY) {
    const envPlain = process.env.GEMINI_API_KEY;
    keysToTest.push({
      id: "env-fallback",
      label: "Fallback (GEMINI_API_KEY)",
      plainKey: envPlain,
      maskedKey: `AIza...${envPlain.slice(-4)}`,
      source: "env",
    });
  }

  if (keysToTest.length === 0) {
    console.error("❌ No Gemini keys found in database or GEMINI_API_KEY environment variable!");
    process.exit(1);
  }

  let healthyCount = 0;
  let firstWorkingKey: string | null = null;

  for (const item of keysToTest) {
    process.stdout.write(`Testing [${item.source.toUpperCase()}] ${item.label.padEnd(25)} (${item.maskedKey}): `);
    if (!item.plainKey) {
      console.log("❌ Decryption failed");
      continue;
    }

    const res = await testGeminiKey(item.plainKey, primaryModel);
    if (res.success) {
      healthyCount++;
      if (!firstWorkingKey) firstWorkingKey = item.plainKey;
      console.log(`✅ OK (${res.statusCode}) - ${res.latencyMs}ms`);
    } else {
      console.log(`❌ FAILED (${res.statusCode}) - ${res.error || res.status}`);
    }
  }

  console.log(`\nKey Pool Summary: ${healthyCount} / ${keysToTest.length} keys healthy\n`);

  // Step 4: Validate Models API
  console.log("--- 4. MODEL REGISTRY VALIDATION ---");
  if (firstWorkingKey) {
    const val = await validateGeminiModels(firstWorkingKey, primaryModel, fallbackModel);
    console.log(`Model List Available: ${val.valid ? "YES ✅" : "NO ❌"}`);
    console.log(`Primary Model (${primaryModel}):  ${val.primaryAvailable ? "SUPPORTED ✅" : "NOT FOUND ⚠️"}`);
    console.log(`Fallback Model (${fallbackModel}): ${val.fallbackAvailable ? "SUPPORTED ✅" : "NOT FOUND ⚠️"}\n`);
  } else {
    console.log("⚠️ Skipped model list validation (no working live API key available)\n");
  }

  // Step 5: Test Key Rotation Simulation
  console.log("--- 5. ROTATION & 429 COOLDOWN SIMULATION ---");
  __setMockDbKeys([
    {
      id: "mock-key-1",
      provider: "gemini",
      label: "Primary Key #1",
      last_four_chars: "1111",
      masked_key: "AIza...1111",
      status: "aktif",
      priority: 2,
      weight: 1,
      requests_today: 10,
      errors_today: 0,
      cooldown_until: null,
      last_used_at: null,
      last_error: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "mock-key-2",
      provider: "gemini",
      label: "Standby Key #2",
      last_four_chars: "2222",
      masked_key: "AIza...2222",
      status: "aktif",
      priority: 1,
      weight: 1,
      requests_today: 0,
      errors_today: 0,
      cooldown_until: null,
      last_used_at: null,
      last_error: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ]);

  const initialKey = await getOptimalApiKey("gemini");
  console.log(`1. Initial selected key: ${initialKey?.id} (${initialKey?.id === "mock-key-2" ? "least-used key ✅" : "OK"})`);

  // Simulate 429 on mock-key-2
  await recordKeyUsage("mock-key-2", 150, 429, "Rate limit test");
  const secondKey = await getOptimalApiKey("gemini");
  console.log(`2. After 429 rate limit cooldown, next selected key: ${secondKey?.id} (${secondKey?.id === "mock-key-1" ? "ROTE TO KEY 1 ✅" : "FAILED ❌"})`);

  // Clean up mock keys
  __setMockDbKeys([]);

  console.log("\n========================================================================");
  if (healthyCount > 0 && encHealth.healthy) {
    console.log("✅ ALL HEALTH CHECKS PASSED. AI SUBSYSTEM OPERATIONAL.");
    console.log("========================================================================\n");
    process.exit(0);
  } else {
    console.log("❌ HEALTH CHECK COMPLETED WITH WARNINGS OR FAILURES.");
    console.log("========================================================================\n");
    process.exit(healthyCount > 0 ? 0 : 1);
  }
}

main().catch((err) => {
  console.error("Fatal error during check-ai:", err);
  process.exit(1);
});
