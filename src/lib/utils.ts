import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date) {
  if (!date) return '-';
  const d = new Date(date);
  if (isNaN(d.getTime())) return String(date);
  return d.toLocaleDateString('ms-MY', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function generateUniqueId(rowNumber: number | string) {
  if (!rowNumber) return '';
  const num = parseInt(String(rowNumber));
  if (isNaN(num)) return '';
  return num.toString().padStart(5, '0');
}
