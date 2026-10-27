import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

describe("Database Schema & Row Level Security (RLS) Verification", () => {
  const schemaPath = path.resolve(
    __dirname,
    "../../supabase/migrations/20261026000000_init_cvkerja_schema.sql"
  );
  const sqlContent = fs.readFileSync(schemaPath, "utf-8");

  const requiredTables = [
    "profiles",
    "consents",
    "cvs",
    "cv_versions",
    "orders",
    "payment_events",
    "applications",
    "google_connections",
    "job_cache",
    "ai_usage_logs",
    "rate_limits",
  ];

  it("should declare all required tables in the migration", () => {
    for (const table of requiredTables) {
      expect(sqlContent).toMatch(
        new RegExp(`CREATE\\s+TABLE\\s+(IF\\s+NOT\\s+EXISTS\\s+)?public\\.${table}`, "i")
      );
    }
  });

  it("should enable Row Level Security on EVERY table without exception", () => {
    for (const table of requiredTables) {
      expect(sqlContent).toMatch(
        new RegExp(
          `ALTER\\s+TABLE\\s+public\\.${table}\\s+ENABLE\\s+ROW\\s+LEVEL\\s+SECURITY`,
          "i"
        )
      );
    }
  });

  it("should have strict isolation policies based on auth.uid()", () => {
    // Check that user-centric tables check auth.uid() = user_id or auth.uid() = id
    expect(sqlContent).toContain("auth.uid() = id");
    expect(sqlContent).toContain("auth.uid() = user_id");
  });

  it("should NEVER log CV content into ai_usage_logs", () => {
    // Ensure ai_usage_logs columns do NOT contain cv_content or raw_text
    const aiLogsMatch = sqlContent.match(
      /CREATE\s+TABLE\s+(IF\s+NOT\s+EXISTS\s+)?public\.ai_usage_logs\s*\(([\s\S]*?)\);/i
    );
    expect(aiLogsMatch).not.toBeNull();
    const tableDefinition = aiLogsMatch![0];
    expect(tableDefinition).not.toContain("cv_text");
    expect(tableDefinition).not.toContain("content");
    expect(tableDefinition).not.toContain("prompt");
  });
});
