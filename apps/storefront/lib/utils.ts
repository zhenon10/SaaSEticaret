import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(amount: number, currency = 'TRY') {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency }).format(amount);
}

export function formatDate(dateString: string) {
  return new Intl.DateTimeFormat('tr-TR', {
    year: 'numeric', month: 'long', day: 'numeric',
  }).format(new Date(dateString));
}
