//
// Wird verwendet, um die CSS-Klassen (tailwind) zu kombinieren und Konflikte zu vermeiden
//

import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
