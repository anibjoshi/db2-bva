import type { TradeUpCatalogEntry } from '../types';

// ?? (not ||) so empty string from Docker build is respected as same-origin
const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

export interface GenerateResult {
  blob: Blob;
  warnings: string[];
}

export async function fetchTradeUpCatalog(): Promise<TradeUpCatalogEntry[]> {
  const response = await fetch(`${API_BASE_URL}/api/trade-up-catalog`);
  if (!response.ok) throw new Error('Failed to load trade-up catalog');
  return response.json();
}

export async function generateDeck(payload: Record<string, unknown>): Promise<GenerateResult> {
  const response = await fetch(`${API_BASE_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let message = 'Failed to generate deck';
    try {
      const error = await response.json();
      if (error.detail) {
        if (typeof error.detail === 'string') {
          message = error.detail;
        } else {
          message = error.detail
            .map((e: { loc: string[]; msg: string }) => `${e.loc.join('.')}: ${e.msg}`)
            .join('; ');
        }
      }
    } catch {
      // ignore parse error
    }
    throw new Error(message);
  }

  let warnings: string[] = [];
  const warningsHeader = response.headers.get('X-Bva-Warnings');
  if (warningsHeader) {
    try {
      warnings = JSON.parse(warningsHeader);
    } catch {
      // ignore
    }
  }

  const blob = await response.blob();
  return { blob, warnings };
}
