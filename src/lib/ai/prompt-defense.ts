/**
 * Prompt Injection Defense & Input Guardrails
 * Protects server-side LLM calls against prompt jailbreaks, delimiter escape attacks,
 * and malicious command injection via Job Descriptions or CV inputs.
 */

const SUSPICIOUS_INJECTION_PATTERNS = [
  /ignore\s+(?:all\s+)?(?:previous|prior|above)\s+(?:instructions|prompts|rules)/i,
  /(?:output|reveal|show|print|dump|read)?\s*(?:the\s+)?(?:entire\s+)?system\s+prompt/i,
  /<\|(?:im_start|im_end|system|user|assistant)\|>/i,
  /reveal\s+(?:all\s+)?(?:internal|hidden|system)\s+instructions/i,
  /you\s+are\s+now\s+(?:in\s+developer\s+mode|dan|an\s+unrestricted\s+ai)/i,
  /bypass\s+(?:all\s+)?(?:safety|content)\s+filters/i,
  /\bexec\s*\(/i,
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
];

export interface GuardrailResult {
  sanitized: string;
  hasSuspiciousPatterns: boolean;
  warnings: string[];
}

/**
 * Sanitizes untrusted job descriptions by enforcing length boundaries,
 * neutralizing tag breakouts, and logging prompt injection attempts.
 */
export function sanitizeUntrustedInput(
  rawInput: string,
  maxLength: number = 8000
): GuardrailResult {
  if (!rawInput || typeof rawInput !== "string") {
    return { sanitized: "", hasSuspiciousPatterns: false, warnings: [] };
  }

  const warnings: string[] = [];
  let hasSuspiciousPatterns = false;

  // 1. Enforce length cap
  let text = rawInput.trim();
  if (text.length > maxLength) {
    text = text.slice(0, maxLength);
    warnings.push(`Input melebihi batas dan dipotong menjadi ${maxLength} karakter.`);
  }

  // 2. Detect suspicious jailbreak patterns
  for (const pattern of SUSPICIOUS_INJECTION_PATTERNS) {
    if (pattern.test(text)) {
      hasSuspiciousPatterns = true;
      warnings.push(`Pola instruksi manipulatif terdeteksi dan dinetralisir.`);
      // Neutralize the command without breaking sentence context
      text = text.replace(pattern, "[TEKS_TIDAK_VALID_DIHAPUS]");
    }
  }

  // 3. Prevent boundary delimiter tag breakout (escape XML-style tags used in prompts)
  text = text
    .replace(/<\/?(?:job_description|cv_candidate_data|system_directive|prompt_instruction)[^>]*>/gi, "");

  // 4. Strip dangerous HTML script tags
  text = text.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");

  return {
    sanitized: text,
    hasSuspiciousPatterns,
    warnings,
  };
}
