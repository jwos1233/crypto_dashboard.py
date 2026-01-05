import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatPercentage(value: number): string {
  return `${(value * 100).toFixed(2)}%`;
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function getQuadrantColor(quadrant: string): string {
  const colors: Record<string, string> = {
    Q1: '#22c55e', // green
    Q2: '#f97316', // orange
    Q3: '#ef4444', // red
    Q4: '#3b82f6', // blue
  };
  return colors[quadrant] || '#6b7280';
}

export function getQuadrantName(quadrant: string): string {
  const names: Record<string, string> = {
    Q1: 'Goldilocks',
    Q2: 'Reflation',
    Q3: 'Stagflation',
    Q4: 'Deflation',
  };
  return names[quadrant] || quadrant;
}

export function getSignalColor(signal: string): string {
  const colors: Record<string, string> = {
    BULLISH: '#22c55e',
    NEUTRAL: '#eab308',
    BEARISH: '#ef4444',
  };
  return colors[signal.toUpperCase()] || '#6b7280';
}
