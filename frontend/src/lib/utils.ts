import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const CURRENCY_MAP: Record<string, { locale: string }> = {
  INR: { locale: "en-IN" },
  USD: { locale: "en-US" },
  EUR: { locale: "de-DE" },
  GBP: { locale: "en-GB" },
};

export function formatCurrency(amount: number, currency?: string): string {
  const curr = currency || (typeof window !== "undefined" && localStorage.getItem("currency")) || "INR";
  const config = CURRENCY_MAP[curr] || { locale: "en-IN" };
  return new Intl.NumberFormat(config.locale, {
    style: "currency",
    currency: curr,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...options,
  }).format(d);
}

export function formatDateShort(date: string | Date): string {
  return formatDate(date, { day: "2-digit", month: "2-digit", year: "2-digit" });
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

export function classNames(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}