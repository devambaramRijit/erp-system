import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Merge Tailwind classes with conditional className building
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
