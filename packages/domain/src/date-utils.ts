import { format, isValid, parse } from 'date-fns';
import type { Locale } from 'date-fns';
import { de, enUS } from 'date-fns/locale';

// ── Canonical storage format ───────────────────────────────────────────────────
// All dates are stored as YYYY-MM-DD. This is the only format used in DynamoDB,
// Zod schemas, and domain entities — it sorts lexicographically and is unambiguous.

export const ISO_DATE_FORMAT = 'yyyy-MM-dd';

// ── Locale registry ───────────────────────────────────────────────────────────
// Add entries here when new locales are required. Each locale maps to its
// ordered list of candidate input formats (most specific first).

export type SupportedLocale = 'de' | 'en';

interface LocaleConfig {
    dateFnsLocale: Locale;
    inputFormats: string[];
}

const LOCALE_CONFIGS: Record<SupportedLocale, LocaleConfig> = {
    de: {
        dateFnsLocale: de,
        // German: DD.MM.YYYY is canonical; also handle ISO coming through
        inputFormats: ['dd.MM.yyyy', 'dd.MM.yy', 'yyyy-MM-dd', 'd.M.yyyy'],
    },
    en: {
        dateFnsLocale: enUS,
        // English: ISO first, then common US/UK variants
        inputFormats: ['yyyy-MM-dd', 'MM/dd/yyyy', 'dd/MM/yyyy', 'MMMM d, yyyy', 'd MMM yyyy'],
    },
};

// ── Core parser ───────────────────────────────────────────────────────────────

/**
 * Parses a raw date string in any supported format and returns a canonical
 * ISO date string (YYYY-MM-DD), or null if parsing fails.
 *
 * @param raw    - Raw date string from OCR, API input, or user entry
 * @param locale - Source locale of the raw string (default: 'de' for German invoices)
 *
 * @example
 *   parseToIsoDate('15.03.2024')        // → '2024-03-15'  (de)
 *   parseToIsoDate('03/15/2024', 'en')  // → '2024-03-15'  (en)
 *   parseToIsoDate('2024-03-15', 'de')  // → '2024-03-15'  (ISO passthrough)
 */
export function parseToIsoDate(raw: string, locale: SupportedLocale = 'de'): string | null {
    const trimmed = raw.trim();
    if (!trimmed) return null;

    // Fast path — already ISO
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
        const d = new Date(trimmed);
        return isValid(d) ? trimmed : null;
    }

    const config = LOCALE_CONFIGS[locale];
    const referenceDate = new Date();

    for (const fmt of config.inputFormats) {
        const parsed = parse(trimmed, fmt, referenceDate, { locale: config.dateFnsLocale });
        if (isValid(parsed)) {
            return format(parsed, ISO_DATE_FORMAT);
        }
    }

    return null;
}

/**
 * Same as parseToIsoDate but throws a ValidationError on failure instead of
 * returning null. Use at API boundaries where a bad date should be a 400.
 */
export function requireIsoDate(
    raw: string,
    fieldName: string,
    locale: SupportedLocale = 'de'
): string {
    const result = parseToIsoDate(raw, locale);
    if (!result) {
        throw new Error(
            `Invalid date for field "${fieldName}": "${raw}" could not be parsed for locale "${locale}"`
        );
    }
    return result;
}

/**
 * Formats a stored ISO date string for display in a given locale.
 * Only used at the presentation layer — never stored.
 *
 * @example
 *   formatIsoDateForDisplay('2024-03-15', 'de') // → '15.03.2024'
 *   formatIsoDateForDisplay('2024-03-15', 'en') // → '03/15/2024'
 */
export function formatIsoDateForDisplay(isoDate: string, locale: SupportedLocale = 'de'): string {
    const config = LOCALE_CONFIGS[locale];
    const d = new Date(isoDate);
    if (!isValid(d)) return isoDate;
    // Use the first input format as the canonical display format for that locale
    return format(d, config.inputFormats[0]!, { locale: config.dateFnsLocale });
}
