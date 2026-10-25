/**
 * Enrich "April-26 and May-26 clients.csv" with data from db_data.csv: for every
 * matched client row, all db_data columns (member_id, name, email, payment, amounts,
 * invoice_id, ...) are appended after the original client columns. Unmatched rows get
 * empty db cells. Re-runnable — previously appended columns are rebuilt, not duplicated.
 *
 * Match key: first name + last name + amount (order) + tax (GST) + total (price).
 *
 * Names are normalized (lowercased, parentheticals / titles / punctuation stripped)
 * because the two files spell them differently, e.g.:
 *     clients: "Rutuja shah"   db: first="Dr.Rutuja" last="Shah ( V )"
 *     clients: "Megha Modi"    db: first="Megha"      last="Modi(V)"
 *
 * Amounts are compared numerically. The base order_amount is the strongest financial
 * signal (it matches even for international clients where GST is 0 and total differs).
 *
 * Run with:  node --experimental-strip-types scripts/add_member_id.ts
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const CLIENTS_FILE = join(SCRIPT_DIR, 'April-26 and May-26 clients.csv');
const DB_FILE = join(SCRIPT_DIR, 'db_data.csv');

// ---------- CSV helpers ----------

/** Parse CSV text into rows of string cells (handles quoted fields and commas). */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += ch;
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(field); field = '';
    } else if (ch === '\n') {
      row.push(field); field = '';
      rows.push(row); row = [];
    } else if (ch === '\r') {
      // ignore, handled by \n
    } else field += ch;
  }
  if (field !== '' || row.length > 0) { row.push(field); rows.push(row); }
  return rows;
}

/** Serialize rows back to CSV, quoting only when needed. */
function toCsv(rows: string[][]): string {
  const esc = (c: string) =>
    /[",\n]/.test(c) ? `"${c.replace(/"/g, '""')}"` : c;
  return rows.map((r) => r.map(esc).join(',')).join('\r\n') + '\r\n';
}

function stripBom(s: string): string {
  return s.charCodeAt(0) === 0xfeff ? s.slice(1) : s;
}

// ---------- Normalization ----------

function normName(s: string): string {
  return s
    .toLowerCase()
    .replace(/\(.*?\)/g, ' ')   // remove ( ... ) notes / suffixes
    .replace(/\bdr\.?\b/g, ' ') // remove "Dr" / "Dr." title
    .replace(/[^a-z\s]/g, ' ')  // keep letters and spaces only
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenSet(s: string): Set<string> {
  return new Set(normName(s).split(' ').filter(Boolean));
}

function toAmount(s: string): number | null {
  if (s == null) return null;
  const t = s.trim().replace(/,/g, '');
  if (t === '') return null;
  const n = Number(t);
  return Number.isNaN(n) ? null : Math.round(n * 100) / 100;
}

function amountsEqual(a: number | null, b: number | null): boolean {
  return a != null && b != null && Math.abs(a - b) < 0.01;
}

/** Levenshtein edit distance between two tokens. */
function editDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  let curr = new Array<number>(n + 1);
  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      curr[j] = Math.min(
        prev[j] + 1,
        curr[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
    [prev, curr] = [curr, prev];
  }
  return prev[n];
}

/**
 * Two name tokens are "the same" if they're identical or a close spelling
 * variant (e.g. Hemali/Hemmali, Rachana/Rachna, Pandya/Pandey). Kept
 * conservative — short tokens are compared exactly to avoid false hits.
 */
function tokenSimilar(a: string, b: string): boolean {
  if (a === b) return true;
  if (Math.abs(a.length - b.length) > 2) return false;
  const minLen = Math.min(a.length, b.length);
  if (minLen < 4) return false;
  const maxDist = minLen >= 10 ? 3 : minLen >= 7 ? 2 : 1;
  return editDistance(a, b) <= maxDist;
}

/** Count client tokens that have a similar (fuzzy) token in the db name. */
function fuzzyOverlap(a: Set<string>, b: Set<string>): number {
  let n = 0;
  for (const x of a) {
    for (const y of b) {
      if (tokenSimilar(x, y)) { n++; break; }
    }
  }
  return n;
}

/** True if any token in `a` is similar to any token in `b`. */
function fuzzyIntersects(a: Set<string>, b: Set<string>): boolean {
  for (const x of a) for (const y of b) if (tokenSimilar(x, y)) return true;
  return false;
}

// ---------- Data model ----------

interface DbRow {
  memberId: string;
  first: string;
  last: string;
  nameTokens: Set<string>;
  firstTokens: Set<string>;
  order: number | null;
  tax: number | null;
  total: number | null;
  invoiceId: string;
  raw: string[]; // full row aligned to the db header (padded to header length)
}

interface DbData {
  header: string[];
  rows: DbRow[];
}

function loadDb(): DbData {
  const rows = parseCsv(stripBom(readFileSync(DB_FILE, 'utf8')));
  const header = rows[0];
  const idx = (name: string) => header.indexOf(name);
  const iMember = idx('member_id');
  const iFirst = idx('first_name');
  const iLast = idx('last_name');
  const iOrder = idx('order_amount');
  const iTax = idx('tax_amount');
  const iTotal = idx('total_amount');
  const iInvoice = idx('invoice_id');

  const out: DbRow[] = [];
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (row.length < header.length) continue;
    const first = (row[iFirst] ?? '').trim();
    const last = (row[iLast] ?? '').trim();
    // Normalize the raw row to exactly header.length cells.
    const raw = header.map((_, i) => row[i] ?? '');
    out.push({
      memberId: (row[iMember] ?? '').trim(),
      first,
      last,
      nameTokens: tokenSet(`${first} ${last}`),
      firstTokens: tokenSet(first),
      order: toAmount(row[iOrder]),
      tax: toAmount(row[iTax]),
      total: toAmount(row[iTotal]),
      invoiceId: (row[iInvoice] ?? '').trim(),
      raw,
    });
  }
  return { header, rows: out };
}

// ---------- Matching ----------

/** 0..1 similarity: fraction of client name tokens present in the db name (fuzzy). */
function nameScore(clientTokens: Set<string>, db: DbRow): number {
  if (clientTokens.size === 0 || db.nameTokens.size === 0) return 0;
  const inter = fuzzyOverlap(clientTokens, db.nameTokens);
  return inter / Math.max(clientTokens.size, db.nameTokens.size);
}

/** Financial confidence: order match is the base signal, tax/total add confidence. */
function finScore(
  amount: number | null, tax: number | null, total: number | null, db: DbRow,
): number {
  let s = 0;
  if (amountsEqual(amount, db.order)) s += 2;
  if (amountsEqual(tax, db.tax)) s += 1;
  if (amountsEqual(total, db.total)) s += 1;
  return s;
}

function bestMatch(
  clientTokens: Set<string>,
  amount: number | null, tax: number | null, total: number | null,
  dbRows: DbRow[],
): { db: DbRow | null; ns: number; fs: number } {
  let best: DbRow | null = null;
  let bestNs = 0;
  let bestFs = 0;
  for (const db of dbRows) {
    const ns = nameScore(clientTokens, db);
    if (ns === 0) continue;
    // Client first name must appear in the db name (guards against pure
    // last-name collisions), unless the overall name match is essentially exact.
    const firstOk = fuzzyIntersects(clientTokens, db.firstTokens) || ns >= 0.99;
    if (!firstOk) continue;
    const fs = finScore(amount, tax, total, db);
    // Rank: name similarity first (identity), then financial agreement.
    if (best === null || ns > bestNs || (ns === bestNs && fs > bestFs)) {
      best = db; bestNs = ns; bestFs = fs;
    }
  }
  return { db: best, ns: bestNs, fs: bestFs };
}

// ---------- Main ----------

function main(): void {
  const db = loadDb();
  const dbColSet = new Set(db.header);
  const emptyDb = db.header.map(() => '');

  const clientRows = parseCsv(stripBom(readFileSync(CLIENTS_FILE, 'utf8')));
  const header = clientRows[0];
  const nameIdx = header.indexOf('Name');
  const amountIdx = header.indexOf('Amount');
  const gstIdx = header.indexOf('GST -18%');
  const totalIdx = header.indexOf('Total');

  // Base = the original client columns only. Drop anything we appended on a
  // previous run (the full db columns, or a stray 'member_id' from an earlier
  // version) so re-runs stay idempotent. Matched db columns are appended after.
  const baseIdxs = header
    .map((h, i) => (dbColSet.has(h) ? -1 : i))
    .filter((i) => i !== -1);
  const outHeader = [...baseIdxs.map((i) => header[i]), ...db.header];

  const outRows: string[][] = [outHeader];
  const used = new Map<string, string>();
  const unmatched: string[] = [];
  const review: string[] = [];
  let matched = 0;
  let dataRows = 0;

  for (let r = 1; r < clientRows.length; r++) {
    const row = clientRows[r];
    const base = baseIdxs.map((i) => row[i] ?? '');
    if (row.length <= nameIdx || (row[nameIdx] ?? '').trim() === '') {
      // preserve blank / trailing rows; no db data
      outRows.push([...base, ...emptyDb]);
      continue;
    }
    dataRows++;
    const name = row[nameIdx];
    const amount = toAmount(row[amountIdx]);
    const tax = toAmount(row[gstIdx]);
    const total = toAmount(row[totalIdx]);
    const ctoks = tokenSet(name);

    const { db: match, ns, fs } = bestMatch(ctoks, amount, tax, total, db.rows);

    let dbCells = emptyDb;
    // Accept when the name is a solid match AND at least the base order amount
    // agrees (fs >= 2), OR the name match is essentially exact.
    if (match && ns >= 0.5 && (fs >= 2 || ns >= 0.99)) {
      dbCells = match.raw;
      matched++;
      if (fs < 2 || ns < 0.6) {
        review.push(`  ${JSON.stringify(name)} -> ${match.memberId} [${match.first} ${match.last}] name=${ns.toFixed(2)} fin=${fs}`);
      }
      if (used.has(match.memberId)) {
        review.push(`  DUPLICATE ${match.memberId}: "${used.get(match.memberId)}" & ${JSON.stringify(name)}`);
      }
      used.set(match.memberId, name);
    } else {
      unmatched.push(name);
    }

    outRows.push([...base, ...dbCells]);
  }

  writeFileSync(CLIENTS_FILE, '﻿' + toCsv(outRows), 'utf8');

  console.log(`Total client rows : ${dataRows}`);
  console.log(`Matched           : ${matched}`);
  console.log(`Unmatched         : ${unmatched.length}`);
  if (unmatched.length) {
    console.log('\n--- UNMATCHED (no member_id) ---');
    for (const n of unmatched) console.log(`  ${n}`);
  }
  if (review.length) {
    console.log('\n--- REVIEW (weak / duplicate matches) ---');
    for (const line of review) console.log(line);
  }
}

main();