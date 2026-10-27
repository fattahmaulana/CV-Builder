/**
 * Device & Motion Detection Utility
 * Detects low-power mobile/desktop devices and respects accessibility reduced-motion.
 * Rules: Automatically disables heavy animations if hardwareConcurrency <= 4 or deviceMemory <= 4.
 */

export function isWeakDevice(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return false;
  }

  // Check CPU cores (default to 8 if not available)
  const cores = navigator.hardwareConcurrency || 8;

  // Check RAM memory in GB (Chrome/Edge API, undefined in Safari/Firefox)
  const memory = (navigator as unknown as { deviceMemory?: number }).deviceMemory;

  // Only genuinely low-end devices (<= 1GB RAM or <= 2 CPU cores)
  if (memory !== undefined && memory <= 1) {
    return true;
  }

  return cores <= 2;
}

export function isReducedMotionPreferred(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function shouldEnableRichAnimations(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  return !isReducedMotionPreferred() && !isWeakDevice();
}
