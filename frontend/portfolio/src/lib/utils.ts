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

/** 원티드식 재직 기간: "2021.08 - 재직 중 (5년 3개월)". 시작·끝 달을 모두 센다. */
export function formatTenure(start: string, end: string | null, today: Date = new Date()): string {
  const [sy, sm] = start.split("-").map(Number);
  const [ey, em] = end ? end.split("-").map(Number) : [today.getFullYear(), today.getMonth() + 1];
  const months = (ey - sy) * 12 + (em - sm) + 1;
  const length = [Math.floor(months / 12) && `${Math.floor(months / 12)}년`, months % 12 && `${months % 12}개월`]
    .filter(Boolean)
    .join(" ");
  return `${formatMonth(start)} - ${end ? formatMonth(end) : "재직 중"}${length ? ` (${length})` : ""}`;
}
