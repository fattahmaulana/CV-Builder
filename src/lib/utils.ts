import { type ClassValue, clsx } from "clsx";

/**
 * High-performance, lightweight class name combiner (under 1 KB)
 */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}
