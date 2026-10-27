import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRole } from "@/lib/admin/admin-guard";
import {
  verifyEncryptionKeyHealth,
  testGeminiKey,
  validateGeminiModels,
  getKeyPoolCooldownStatus,
  decryptApiKey,
  ApiKeyStatus,
} from "@/lib/admin/api-key-manager";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export interface KeyHealthDetail {
  id: string;
  label: string;
  maskedKey: string;
  source: "db" | "env";
  status: ApiKeyStatus;
  statusCode: number;
  latencyMs: number;
  error?: string | null;
}

export interface AdminHealthResponse {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  encryption: {
    configured: boolean;
    roundtripOk: boolean;
    error?: string;
  };
  models: {
    primary: string;
    fallback: string;
    primaryAvailable: boolean;
    fallbackAvailable: boolean;
    error?: string;
  };
  keys: KeyHealthDetail[];
  pool: {
    total: number;
    active: number;
    cooldown: number;
    invalid: number;
    earliestCooldownSeconds: number;
  };
}

export async function GET(req: NextRequest) {
  // 1. Authorize: Admin only
  const admin = await verifyAdminRole(req);
  if (!admin) {
    return NextResponse.json(
      { error: "Akses ditolak: Hanya administrator yang dapat mengakses health check." },
      { status: 403 }
    );
  }

  const primaryModel = process.env.GEMINI_MODEL || "gemini-3.5-flash";
  const fallbackModel = process.env.GEMINI_FALLBACK_MODEL || "gemini-3.5-flash-lite";

  // 2. Encryption Key Round-Trip Check
  const encryptionCheck = verifyEncryptionKeyHealth();

  // 3. Collect Keys (Database + Fallback Environment Key)
  const supabase = createAdminClient();
  const { data: dbKeys, error: dbError } = await supabase
    .from("api_keys")
    .select("id, label, encrypted_key, last_four_chars, status, priority")
    .eq("provider", "gemini");

  const keysToTest: Array<{
    id: string;
    label: string;
    plainKey: string;
    maskedKey: string;
    source: "db" | "env";
  }> = [];

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

  // Include env fallback key if configured
  if (process.env.GEMINI_API_KEY) {
    const envPlain = process.env.GEMINI_API_KEY;
    const lastFour = envPlain.slice(-4);
    keysToTest.push({
      id: "env-fallback",
      label: "Environment Fallback Key",
      plainKey: envPlain,
      maskedKey: `AIza...${lastFour}`,
      source: "env",
    });
  }

  // 4. Test each key concurrently with 25s timeout
  const keyResults: KeyHealthDetail[] = [];
  let firstWorkingKey: string | null = null;

  for (const item of keysToTest) {
    if (!item.plainKey) {
      keyResults.push({
        id: item.id,
        label: item.label,
        maskedKey: item.maskedKey,
        source: item.source,
        status: "tidak_valid",
        statusCode: 400,
        latencyMs: 0,
        error: "Gagal mendekripsi kunci API dari database",
      });
      continue;
    }

    const testRes = await testGeminiKey(item.plainKey, primaryModel);
    if (testRes.success && !firstWorkingKey) {
      firstWorkingKey = item.plainKey;
    }

    keyResults.push({
      id: item.id,
      label: item.label,
      maskedKey: item.maskedKey,
      source: item.source,
      status: testRes.status,
      statusCode: testRes.statusCode,
      latencyMs: testRes.latencyMs,
      error: testRes.error || null,
    });
  }

  // 5. Validate Models Availability
  let modelValidation = {
    valid: true,
    primaryAvailable: true,
    fallbackAvailable: true,
    error: undefined as string | undefined,
  };

  if (firstWorkingKey) {
    const val = await validateGeminiModels(firstWorkingKey, primaryModel, fallbackModel);
    modelValidation = {
      valid: val.valid,
      primaryAvailable: val.primaryAvailable,
      fallbackAvailable: val.fallbackAvailable,
      error: val.error,
    };
  }

  // 6. Pool statistics
  const poolCooldown = await getKeyPoolCooldownStatus("gemini");
  const activeCount = keyResults.filter((k) => k.status === "aktif").length;
  const cooldownCount = keyResults.filter((k) => k.status === "cooldown").length;
  const invalidCount = keyResults.filter((k) => k.status === "tidak_valid").length;

  let overallStatus: "healthy" | "degraded" | "unhealthy" = "unhealthy";
  if (activeCount > 0 && encryptionCheck.healthy && modelValidation.valid) {
    overallStatus = "healthy";
  } else if (activeCount > 0 || (cooldownCount > 0 && encryptionCheck.healthy)) {
    overallStatus = "degraded";
  }

  const responseBody: AdminHealthResponse = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    encryption: {
      configured: Boolean(
        process.env.ENCRYPTION_MASTER_KEY ||
          process.env.KEY_ENCRYPTION_SECRET ||
          process.env.ENCRYPTION_KEY
      ),
      roundtripOk: encryptionCheck.healthy,
      error: encryptionCheck.error,
    },
    models: {
      primary: primaryModel,
      fallback: fallbackModel,
      primaryAvailable: modelValidation.primaryAvailable,
      fallbackAvailable: modelValidation.fallbackAvailable,
      error: modelValidation.error,
    },
    keys: keyResults,
    pool: {
      total: keyResults.length,
      active: activeCount,
      cooldown: cooldownCount,
      invalid: invalidCount,
      earliestCooldownSeconds: poolCooldown.earliestCooldownSeconds,
    },
  };

  return NextResponse.json(responseBody, {
    status: overallStatus === "healthy" ? 200 : overallStatus === "degraded" ? 200 : 503,
  });
}
