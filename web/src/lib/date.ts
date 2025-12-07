export function formatDateUTC(iso: string | Date, opts?: Intl.DateTimeFormatOptions, locale = 'es-ES') {
    const d = typeof iso === 'string' ? new Date(iso) : iso;
    return new Intl.DateTimeFormat(locale, { timeZone: 'UTC', ...opts }).format(d);
}
