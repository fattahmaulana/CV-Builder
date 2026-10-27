import { createClient } from "@/lib/supabase/server";
import { createHash } from "crypto";

export interface AdminUserContext {
  id: string;
  email: string;
  role: "admin";
  ipHash: string;
}

/**
 * Computes an anonymized SHA-256 hash of an IP address for security audit logs
 */
export function hashIpAddress(ip: string): string {
  if (!ip) return "unknown";
  return createHash("sha256").update(ip.trim()).digest("hex").slice(0, 16);
}

/**
 * Checks whether client IP is permitted if ADMIN_IP_ALLOWLIST is configured
 */
export function isIpAllowed(clientIp: string): boolean {
  const allowlist = process.env.ADMIN_IP_ALLOWLIST;
  if (!allowlist || allowlist.trim() === "") {
    return true; // No restriction if allowlist is not defined
  }

  const allowedIps = allowlist.split(",").map((ip) => ip.trim());
  return allowedIps.includes(clientIp);
}

/**
 * Server-side admin role verification.
 * Strictly verifies that the authenticated user has role = 'admin' in the profiles table.
 * Throws an error or returns null if not an authorized administrator.
 */
export async function verifyAdminRole(request?: Request): Promise<AdminUserContext | null> {
  try {
    const supabase = await createClient();

    // 1. Verify user session
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return null;
    }

    // 2. Verify IP allowlist if request is provided
    let clientIp = "127.0.0.1";
    if (request) {
      const forwarded = request.headers.get("x-forwarded-for");
      clientIp = forwarded ? forwarded.split(",")[0].trim() : "127.0.0.1";

      if (!isIpAllowed(clientIp)) {
        console.warn(`Admin access denied for IP: ${clientIp}`);
        return null;
      }
    }

    // 3. Query profiles table for role
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError || !profile || profile.role !== "admin") {
      return null;
    }

    return {
      id: user.id,
      email: user.email || "",
      role: "admin",
      ipHash: hashIpAddress(clientIp),
    };
  } catch (error) {
    console.error("verifyAdminRole error:", error);
    return null;
  }
}

/**
 * Records an immutable audit log entry into admin_audit_log
 * CRITICAL: Never logs raw API keys or secrets.
 */
export async function logAdminAction({
  userId,
  action,
  targetType,
  targetId,
  ipHash,
  details = {},
}: {
  userId: string | null;
  action: string;
  targetType: string;
  targetId?: string;
  ipHash?: string;
  details?: Record<string, unknown>;
}): Promise<void> {
  try {
    const supabase = await createClient();
    await supabase.from("admin_audit_log").insert({
      user_id: userId,
      action,
      target_type: targetType,
      target_id: targetId || null,
      ip_hash: ipHash || null,
      details: details as unknown as import("@/lib/supabase/types").Json,
    });
  } catch (err) {
    console.error("Failed to write to admin_audit_log:", err);
  }
}
