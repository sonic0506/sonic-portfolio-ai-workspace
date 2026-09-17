import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** "2024-03-01" → "2024.03" */
export function formatMonth(date: string | null): string {
  return date ? date.slice(0, 7).replace("-", ".") : "";
}

export function formatPeriod(start: string | null, end: string | null): string {
  return `${formatMonth(start)} ~ ${end ? formatMonth(end) : "진행 중"}`;
}
