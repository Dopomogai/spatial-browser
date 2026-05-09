/**
 * @purpose cn() Tailwind class-merge helper.
 * @why Standard tailwind + clsx pattern; avoids class conflicts on dynamic className strings.
 * @role util
 * @exports cn
 * @uses clsx, tailwind-merge
 * @stability stable
 */
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
