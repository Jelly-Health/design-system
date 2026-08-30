import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge class names, with later Tailwind utilities winning over earlier ones.
 *
 * Lives in the package rather than in each app so a component shipped from here
 * and a component written in an app resolve conflicts the same way.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
