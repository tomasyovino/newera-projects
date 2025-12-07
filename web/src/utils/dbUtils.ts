import type { LocalizedString } from '@/lib/types';

export function ls(es?: string | null, en?: string | null): LocalizedString {
    const _es = (es ?? '').toString();
    const _en = (en ?? '').toString();

    return {
        es: _es || _en || '',
        en: _en || _es || '',
    };
}

export function nowIso(): string {
    return new Date().toISOString();
}

export function boolToInt(v: boolean | undefined | null): 0 | 1 {
    return v ? 1 : 0;
}

export function intToBool(v: unknown): boolean {
    return v === 1 || v === '1' || v === true;
}

export function parseJson<T = unknown>(raw: unknown, fallback: T): T {
    if (typeof raw !== 'string') return fallback;
    try { return JSON.parse(raw) as T; } catch { return fallback; }
}

export function parseJsonArray<T = unknown>(raw: unknown, fallback: T[] = []): T[] {
    const parsed = parseJson<T[] | unknown>(raw, fallback);
    return Array.isArray(parsed) ? parsed as T[] : fallback;
}

export function isNil(v: unknown): v is null | undefined {
    return v === null || v === undefined;
}