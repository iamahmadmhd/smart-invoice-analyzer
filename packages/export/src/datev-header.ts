import { ExportBatch } from '@smart-invoice-analyzer/contracts';

// ── DATEV EXTF 7.0 header spec ────────────────────────────────────────────────
// Line 1: metadata header (31 fixed fields, semicolon-separated)
// Line 2: column headers

const DATEV_FORMAT_IDENTIFIER = 'EXTF';
const DATEV_VERSION = '700'; // EXTF version 7.0.0
const DATEV_DATA_CATEGORY = '21'; // 21 = Buchungsstapel (posting batch)
const DATEV_FORMAT_NAME = 'Buchungsstapel';

export function buildDatevHeader(batch: ExportBatch, rowCount: number): string {
    const now = new Date();
    const createdDate = formatDatevTimestamp(now);

    // Period in YYYYMM format
    const periodStart = batch.periodStart.replace(/-/g, '').slice(0, 6); // YYYYMM
    const periodEnd = batch.periodEnd.replace(/-/g, '').slice(0, 6);

    // Fiscal year start — always Jan 1 of the export year
    const fiscalYearStart = `${batch.periodStart.slice(0, 4)}0101`;

    // ── Header line (line 1) ──────────────────────────────────────────────────
    // Fields that are blank are represented as empty segments between semicolons
    const headerFields = [
        DATEV_FORMAT_IDENTIFIER, // 1  Format identifier
        DATEV_VERSION, // 2  Version
        DATEV_DATA_CATEGORY, // 3  Data category
        DATEV_FORMAT_NAME, // 4  Format name
        '', // 5  Format version (blank = latest)
        createdDate, // 6  Created timestamp YYYYMMDDHHMMSSFFF
        '', // 7  Imported (blank)
        '', // 8  Origin (blank)
        '', // 9  Exported by (blank)
        '', // 10 Imported by (blank)
        batch.beraternummer, // 11 Beraternummer
        batch.mandantennummer, // 12 Mandantennummer
        fiscalYearStart, // 13 WJ-Beginn (fiscal year start YYYYMMDD)
        String(batch.sachkontenlaenge), // 14 Sachkontenlänge
        periodStart, // 15 Datum von YYYYMM
        periodEnd, // 16 Datum bis YYYYMM
        '', // 17 Bezeichnung (optional label)
        '', // 18 Diktatkürzel
        '1', // 19 Buchungstyp: 1 = Finanzbuchführung
        '0', // 20 Rechnungslegungszweck: 0 = keine Angabe
        '0', // 21 Festschreibung: 0 = nicht festgeschrieben
        'EUR', // 22 WKZ (Währungskennzeichen)
        '', // 23 Derivatskennzeichen
        '', // 24 SKR
        batch.sachkontenrahmen, // 25 Branchengruppenkennzeichen (SKR03/SKR04)
        '', // 26 Anwendungsinformation
        '', // 27 Verarbeitungskennzeichen
        '', // 28 Zugelassene Bewegungsarten
        String(rowCount), // 29 Anzahl Datensätze
        '', // 30 Passwort
        '', // 31 Anwendungsversion
    ];

    const headerLine = headerFields.join(';');

    // ── Column header line (line 2) ───────────────────────────────────────────
    const columns = [
        'Umsatz (ohne Soll/Haben-Kz)',
        'Soll/Haben-Kennzeichen',
        'WKZ Umsatz',
        'Kurs',
        'Basis-Umsatz',
        'WKZ Basis-Umsatz',
        'Konto',
        'Gegenkonto (ohne BU-Schlüssel)',
        'BU-Schlüssel',
        'Belegdatum',
        'Belegfeld 1',
        'Belegfeld 2',
        'Skonto',
        'Buchungstext',
        'Postensperre',
        'Diverse Adressnummer',
        'Geschäftspartnerbank',
        'Sachverhalt',
        'Zinssperre',
        'Beleglink',
        'Beleginfo - Art 1',
        'Beleginfo - Inhalt 1',
    ];

    const columnLine = columns.join(';');

    return `${headerLine}\n${columnLine}\n`;
}

// ── Timestamp helper ──────────────────────────────────────────────────────────

function formatDatevTimestamp(date: Date): string {
    // YYYYMMDDHHMMSSFFF
    const pad = (n: number, len = 2) => String(n).padStart(len, '0');
    return [
        date.getFullYear(),
        pad(date.getMonth() + 1),
        pad(date.getDate()),
        pad(date.getHours()),
        pad(date.getMinutes()),
        pad(date.getSeconds()),
        pad(date.getMilliseconds(), 3),
    ].join('');
}
