import { createHash } from "crypto";
import { CvData } from "@/types/cv";
import { optimizeCvWithGemini, AiOptimizationResult } from "./gemini-client";
import { createClient } from "@/lib/supabase/server";

// In-memory cache map: key -> { result, timestamp }
const AI_CACHE = new Map<string, { result: AiOptimizationResult; timestamp: number }>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// In-memory sliding window rate limiter: userId -> timestamp[]
const RATE_LIMIT_MAP = new Map<string, number[]>();
const MAX_REQUESTS_PER_WINDOW = 15;
const WINDOW_DURATION_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Checks and records rate limit for a user
 */
function checkRateLimit(userId: string): { allowed: boolean; remaining: number; retryAfterSeconds: number } {
  const now = Date.now();
  const windowStart = now - WINDOW_DURATION_MS;

  const timestamps = (RATE_LIMIT_MAP.get(userId) || []).filter((t) => t > windowStart);

  if (timestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    const oldest = timestamps[0];
    const retryAfter = Math.ceil((oldest + WINDOW_DURATION_MS - now) / 1000);
    return { allowed: false, remaining: 0, retryAfterSeconds: Math.max(1, retryAfter) };
  }

  timestamps.push(now);
  RATE_LIMIT_MAP.set(userId, timestamps);

  return {
    allowed: true,
    remaining: MAX_REQUESTS_PER_WINDOW - timestamps.length,
    retryAfterSeconds: 0,
  };
}

/**
 * Computes a deterministic SHA-256 cache hash for CV & Job inputs
 */
function computeCacheKey(
  cvId: string,
  targetPosition: string,
  targetCompany: string,
  jobDescription: string,
  cv: CvData
): string {
  const content = `${cvId}:${targetPosition}:${targetCompany}:${jobDescription}:${JSON.stringify(cv.experiences)}:${cv.personalInfo.summary}:${cv.metadata.language}`;
  return createHash("sha256").update(content).digest("hex");
}

export interface ServiceOptimizationResponse {
  result: AiOptimizationResult;
  isCached: boolean;
  matchScore: number;
}

/**
 * Orchestrates AI optimization with caching, rate limiting, and audit logging
 */
export async function runCvAiOptimization(
  userId: string,
  cvId: string,
  cv: CvData,
  targetPosition: string,
  targetCompany: string,
  jobDescription: string
): Promise<ServiceOptimizationResponse> {
  // 1. Check Rate Limit
  const rateLimit = checkRateLimit(userId);
  if (!rateLimit.allowed) {
    throw new Error(
      `Batas penggunaan AI tercapai. Harap tunggu ${rateLimit.retryAfterSeconds} detik sebelum mencoba lagi.`
    );
  }

  // 2. Check Cache
  const cacheKey = computeCacheKey(cvId, targetPosition, targetCompany, jobDescription, cv);
  const cached = AI_CACHE.get(cacheKey);
  const now = Date.now();

  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return {
      result: cached.result,
      isCached: true,
      matchScore: cached.result.matchScore,
    };
  }

  // 3. Call Gemini Model
  const modelName = process.env.GEMINI_MODEL || "gemini-3.5-flash";
  let optimizationResult: AiOptimizationResult;
  let status: "SUCCESS" | "ERROR" = "SUCCESS";
  let errorMessage: string | null = null;

  try {
    optimizationResult = await optimizeCvWithGemini(
      cv,
      targetPosition,
      targetCompany,
      jobDescription
    );

    // Save to Cache
    AI_CACHE.set(cacheKey, { result: optimizationResult, timestamp: now });
  } catch (err: unknown) {
    status = "ERROR";
    errorMessage = err instanceof Error ? err.message : "Unknown error during AI processing";
    throw err;
  } finally {
    try {
      const supabase = await createClient();
      const durationMs = Date.now() - now;
      await supabase.from("ai_usage_logs").insert({
        user_id: userId,
        action_type: "OPTIMIZE_CV",
        model_used: modelName,
        duration_ms: durationMs,
        status,
      });
    } catch (logErr) {
      // Non-blocking log failure
      console.warn("Failed to record AI usage log:", logErr);
    }
  }

  return {
    result: optimizationResult,
    isCached: false,
    matchScore: optimizationResult.matchScore,
  };
}
