/**
 * One-off renumbering for the three 11 Aug 2026 workshop invoices
 * (spec: specs/features/2026-10-26-workshop-invoice, decisions 14-16, plan group 7).
 *
 * Gives the given PENDING workshop invoices the numbers right after the last invoice of the
 * franchise's SERVICE (S) series dated on or before the cut-off, and moves every later S number
 * up by the same count, in txn_member_payments and txn_workshop_invoices. Product (P) invoices
 * and other franchises/FYs are never touched. Only invoice_id changes on moved rows.
 *
 * Safe by default:
 * - Dry run unless --apply is passed. The dry run executes the same statements and then rolls
 *   back, so the printed mapping is exactly what --apply would write.
 * - Refuses (exit 2, nothing written) when: the series has a gap or duplicate (1…counter) or an
 *   unexpected number format; any invoice is missing, cancelled, already numbered, not PENDING,
 *   on another franchise, not dated on the cut-off, or lacks payment mode/reference/date; or the
 *   invoices were already renumbered (txn_invoice_renumber_log).
 * - Everything runs in one transaction that first locks the counter row, so new PAID invoices
 *   wait until it commits. Moves go through temporary values so the unique index never clashes.
 * - Every changed row is logged in txn_invoice_renumber_log under one run ID, and a CSV of
 *   old → new numbers is written (dry runs too, marked DRY RUN).
 *
 * Run from server_1 (pg and dotenv resolve from its node_modules; server_1/.env is loaded,
 * environment variables win):
 *   cd server_1
 *   node --experimental-strip-types scripts/workshop-invoice-renumber.ts \
 *     --franchise-id 1 --cutoff 2026-08-11 --invoices 11,12,13            # dry run
 *   node --experimental-strip-types scripts/workshop-invoice-renumber.ts \
 *     --franchise-id 1 --cutoff 2026-08-11 --invoices 11,12,13 --apply
 * Options: --admin-id <id> (audit columns, default 1), --csv <path>, --reason <text>.
 *
 * On the VPS, run inside admin-api (it has node_modules and the DB env):
 *   docker cp server_1/scripts/workshop-invoice-renumber.ts eatfit-admin-api:/home/app/server_1/
 *   docker exec -w /home/app/server_1 eatfit-admin-api node --experimental-strip-types workshop-invoice-renumber.ts …
 *
 * Exit codes: 0 done (or dry run OK), 2 refused by a guard, 1 unexpected error.
 */

import { createRequire } from 'node:module';
import { randomUUID } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import * as path from 'node:path';

interface PgClientConfig {
  host?: string;
  port?: number;
  user?: string;
  password?: string;
  database?: string;
}

interface PgClient {
  connect(): Promise<void>;
  query<T>(sql: string, params?: unknown[]): Promise<{ rows: T[]; rowCount: number | null }>;
  end(): Promise<void>;
}

interface PgModule {
  Client: new (config: PgClientConfig) => PgClient;
}

interface DotenvModule {
  config(): void;
}

interface Options {
  franchiseId: number;
  cutoff: string;
  invoiceIds: number[];
  apply: boolean;
  adminId: number;
  csvPath: string | null;
  reason: string;
}

interface SeriesRow {
  tableName: 'txn_member_payments' | 'txn_workshop_invoices';
  rowId: number;
  invoiceId: string;
  number: number;
  date: string | null;
}

interface Change {
  tableName: SeriesRow['tableName'];
  rowId: number;
  oldInvoiceId: string | null;
  newInvoiceId: string;
  date: string | null;
}

const MEMBER = 'txn_member_payments';
const WORKSHOP = 'txn_workshop_invoices';
const PAID = 1;
const PENDING = 2;
const NUMBER_DIGITS = 6;
const SCRIPT_IP = 'renumber-script';

/** A guard refused the run: nothing was written. */
class RefusedError extends Error {}

function refuse(message: string): never {
  throw new RefusedError(message);
}

function parseArgs(argv: string[]): Options {
  const value = (flag: string): string | undefined => {
    const index = argv.indexOf(flag);
    return index >= 0 ? argv[index + 1] : undefined;
  };
  const franchiseId = Number(value('--franchise-id'));
  const cutoff = value('--cutoff') || '';
  const invoiceIds = (value('--invoices') || '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean)
    .map(Number);
  if (!Number.isInteger(franchiseId) || franchiseId < 1) refuse('--franchise-id is required');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(cutoff)) refuse('--cutoff must be YYYY-MM-DD');
  if (invoiceIds.length === 0 || invoiceIds.some((id) => !Number.isInteger(id) || id < 1)) {
    refuse('--invoices must be a comma-separated list of workshop invoice IDs');
  }
  if (new Set(invoiceIds).size !== invoiceIds.length) refuse('--invoices has duplicates');
  return {
    franchiseId,
    cutoff,
    invoiceIds,
    apply: argv.includes('--apply'),
    adminId: Number(value('--admin-id') || 1),
    csvPath: value('--csv') || null,
    reason:
      value('--reason') ||
      `Workshop invoices dated ${cutoff} inserted into the S series (spec 2026-10-26-workshop-invoice)`,
  };
}

/** Same rule as InvoiceSequenceService.getFinancialYear: "2026-27", or "2026" for a January start. */
function financialYear(date: string, fyStartMonth: number): string {
  const [year, month] = date.split('-').map(Number);
  const start = !fyStartMonth || fyStartMonth < 1 || fyStartMonth > 12 ? 1 : fyStartMonth;
  const startYear = month >= start ? year : year - 1;
  return start === 1 ? `${startYear}` : `${startYear}-${String(startYear + 1).slice(-2)}`;
}

const formatNumber = (prefix: string, n: number): string => `${prefix}${String(n).padStart(NUMBER_DIGITS, '0')}`;

async function loadSeries(client: PgClient, franchiseId: number, prefix: string): Promise<SeriesRow[]> {
  const { rows } = await client.query<{ table_name: SeriesRow['tableName']; row_id: number; invoice_id: string; d: string | null }>(
    `SELECT '${MEMBER}' AS table_name, member_payment_id AS row_id, invoice_id, payment_date::text AS d
       FROM ${MEMBER}
      WHERE franchise_id = $1 AND LEFT(invoice_id, LENGTH($2)) = $2
     UNION ALL
     SELECT '${WORKSHOP}', workshop_invoice_id, invoice_id, invoice_date::text
       FROM ${WORKSHOP}
      WHERE franchise_id = $1 AND LEFT(invoice_id, LENGTH($2)) = $2`,
    [franchiseId, prefix],
  );
  return rows.map((row) => {
    const suffix = row.invoice_id.slice(prefix.length);
    if (!new RegExp(`^\\d{${NUMBER_DIGITS}}$`).test(suffix)) {
      refuse(`${row.table_name} ${row.row_id} has an unexpected invoice number: ${row.invoice_id}`);
    }
    return { tableName: row.table_name, rowId: row.row_id, invoiceId: row.invoice_id, number: Number(suffix), date: row.d };
  });
}

/** The series must be exactly 1…counter: no gap, no duplicate, nothing above the counter. */
function checkSeries(rows: SeriesRow[], counter: number, when: string): void {
  const seen = new Map<number, SeriesRow>();
  for (const row of rows) {
    const other = seen.get(row.number);
    if (other) {
      refuse(`${when}: duplicate number ${row.invoiceId} (${other.tableName} ${other.rowId}, ${row.tableName} ${row.rowId})`);
    }
    seen.set(row.number, row);
  }
  const missing: number[] = [];
  for (let n = 1; n <= counter; n++) {
    if (!seen.has(n)) missing.push(n);
  }
  const above = rows.filter((row) => row.number > counter || row.number < 1);
  if (missing.length > 0 || above.length > 0) {
    refuse(
      `${when}: the series is not 1…${counter}` +
        (missing.length ? `; missing ${missing.slice(0, 10).join(', ')}${missing.length > 10 ? ' …' : ''}` : '') +
        (above.length ? `; outside the counter: ${above.map((r) => r.invoiceId).join(', ')}` : ''),
    );
  }
}

async function run(client: PgClient, options: Options): Promise<void> {
  const runId = randomUUID();
  const mode = options.apply ? 'APPLY' : 'DRY RUN';
  const k = options.invoiceIds.length;

  await client.query('BEGIN');
  try {
    await client.query(`SET LOCAL lock_timeout = '15s'`);

    const { rows: franchises } = await client.query<{ franchise_code: string; financial_year: number }>(
      'SELECT franchise_code, financial_year FROM mst_franchises WHERE franchise_id = $1',
      [options.franchiseId],
    );
    if (franchises.length !== 1) refuse(`Franchise ${options.franchiseId} not found`);
    const { franchise_code: code, financial_year: fyStartMonth } = franchises[0];
    const fy = financialYear(options.cutoff, fyStartMonth);
    const prefix = `${code}/${fy}/S/`;

    // 1. Lock the counter row: new S numbers for this franchise and FY wait until we commit.
    const { rows: counters } = await client.query<{ id: string; current_number: number }>(
      `SELECT id, current_number FROM mst_invoice_sequences
        WHERE franchise_id = $1 AND invoice_type = 'service' AND financial_year = $2
        FOR UPDATE`,
      [options.franchiseId, fy],
    );
    if (counters.length !== 1) {
      refuse(`Expected one SERVICE counter row for franchise ${options.franchiseId} FY ${fy}, found ${counters.length}`);
    }
    const counterId = counters[0].id;
    const counterBefore = Number(counters[0].current_number);

    // 2. Never twice for the same invoices.
    const { rows: logged } = await client.query<{ row_id: number }>(
      `SELECT DISTINCT row_id FROM txn_invoice_renumber_log WHERE table_name = $1 AND row_id = ANY($2::int[])`,
      [WORKSHOP, options.invoiceIds],
    );
    if (logged.length > 0) {
      refuse(`Already renumbered (txn_invoice_renumber_log): workshop invoice ${logged.map((r) => r.row_id).join(', ')}`);
    }

    // 3. The workshop invoices to place.
    const { rows: workshops } = await client.query<{
      workshop_invoice_id: number;
      franchise_id: number;
      invoice_id: string | null;
      invoice_date: string;
      payment_status_id: number;
      payment_mode_id: number | null;
      transaction_id: string | null;
      payment_date: string | null;
      active: boolean;
      total_amount: string;
    }>(
      `SELECT workshop_invoice_id, franchise_id, invoice_id, invoice_date::text, payment_status_id, payment_mode_id,
              transaction_id, payment_date::text, active, total_amount::text
         FROM ${WORKSHOP} WHERE workshop_invoice_id = ANY($1::int[])
          FOR UPDATE`,
      [options.invoiceIds],
    );
    for (const id of options.invoiceIds) {
      const row = workshops.find((w) => w.workshop_invoice_id === id);
      if (!row) refuse(`Workshop invoice ${id} not found`);
      const problems: string[] = [];
      if (!row.active) problems.push('cancelled');
      if (row.franchise_id !== options.franchiseId) problems.push(`on franchise ${row.franchise_id}`);
      if (row.invoice_id) problems.push(`already numbered ${row.invoice_id}`);
      if (row.payment_status_id !== PENDING) problems.push(`status ${row.payment_status_id}, not PENDING`);
      if (row.invoice_date !== options.cutoff) problems.push(`dated ${row.invoice_date}, not ${options.cutoff}`);
      if (!row.payment_mode_id || !row.transaction_id?.trim() || !row.payment_date) {
        problems.push('payment mode, reference or date missing');
      }
      if (problems.length) refuse(`Workshop invoice ${id}: ${problems.join('; ')}`);
    }

    const { rows: sacRows } = await client.query<{ config_value: string | null }>(
      `SELECT config_value FROM mst_configs WHERE config_name = 'DIET_SAC_CODE'`,
    );
    const sacCode = sacRows[0]?.config_value?.trim();
    if (!sacCode) refuse('mst_configs DIET_SAC_CODE is not set');

    // 4. The series before: 1…counter, then N = highest number dated on or before the cut-off.
    const before = await loadSeries(client, options.franchiseId, prefix);
    checkSeries(before, counterBefore, 'Before');
    const undated = before.filter((row) => !row.date);
    if (undated.length) refuse(`Issued invoices without a date: ${undated.map((r) => r.invoiceId).join(', ')}`);
    const n = before.filter((row) => (row.date as string) <= options.cutoff).reduce((max, row) => Math.max(max, row.number), 0);
    const shifted = before.filter((row) => row.number > n).sort((a, b) => b.number - a.number);

    // 5. Move every number above N up by k: first to unique temporary values, then to the final ones.
    const temp = `#${runId.slice(0, 8)}`;
    for (const table of [MEMBER, WORKSHOP] as const) {
      const ids = shifted.filter((row) => row.tableName === table).map((row) => row.rowId);
      if (!ids.length) continue;
      const pk = table === MEMBER ? 'member_payment_id' : 'workshop_invoice_id';
      await client.query(`UPDATE ${table} SET invoice_id = invoice_id || $1 WHERE ${pk} = ANY($2::int[])`, [temp, ids]);
    }
    const changes: Change[] = [];
    for (const row of shifted) {
      const pk = row.tableName === MEMBER ? 'member_payment_id' : 'workshop_invoice_id';
      const newInvoiceId = formatNumber(prefix, row.number + k);
      const result = await client.query(`UPDATE ${row.tableName} SET invoice_id = $1 WHERE ${pk} = $2 AND invoice_id = $3`, [
        newInvoiceId,
        row.rowId,
        row.invoiceId + temp,
      ]);
      if (result.rowCount !== 1) throw new Error(`${row.tableName} ${row.rowId} changed during the run`);
      changes.push({ tableName: row.tableName, rowId: row.rowId, oldInvoiceId: row.invoiceId, newInvoiceId, date: row.date });
    }
    changes.reverse(); // ascending by old number for the report

    // 6. N+1…N+k to the workshop invoices, in the given order; they become PAID with the SAC (decision 9).
    const placed: Change[] = [];
    for (const [index, id] of options.invoiceIds.entries()) {
      const newInvoiceId = formatNumber(prefix, n + 1 + index);
      await client.query(
        `UPDATE ${WORKSHOP}
            SET invoice_id = $1, payment_status_id = $2, sac_code = $3,
                modified_by = $4, modified_ip = $5, updated_at = CURRENT_TIMESTAMP
          WHERE workshop_invoice_id = $6`,
        [newInvoiceId, PAID, sacCode, options.adminId, SCRIPT_IP, id],
      );
      placed.push({ tableName: WORKSHOP, rowId: id, oldInvoiceId: null, newInvoiceId, date: options.cutoff });
    }

    // 7. Counter + k.
    await client.query('UPDATE mst_invoice_sequences SET current_number = current_number + $1 WHERE id = $2', [k, counterId]);

    // 8. Log every change under one run ID (decision 16).
    for (const change of [...placed, ...changes]) {
      await client.query(
        `INSERT INTO txn_invoice_renumber_log
           (run_id, table_name, row_id, old_invoice_id, new_invoice_id, reason,
            created_by, modified_by, created_ip, modified_ip)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $7, $8, $8)`,
        [runId, change.tableName, change.rowId, change.oldInvoiceId, change.newInvoiceId, options.reason, options.adminId, SCRIPT_IP],
      );
    }

    // 9. The series after: 1…counter+k, with the workshop invoices at N+1…N+k.
    const after = await loadSeries(client, options.franchiseId, prefix);
    checkSeries(after, counterBefore + k, 'After');
    if (after.length !== before.length + k) throw new Error(`After: expected ${before.length + k} invoices, found ${after.length}`);
    for (const change of placed) {
      if (!after.some((row) => row.tableName === WORKSHOP && row.rowId === change.rowId && row.invoiceId === change.newInvoiceId)) {
        throw new Error(`After: workshop invoice ${change.rowId} is not ${change.newInvoiceId}`);
      }
    }

    if (options.apply) {
      await client.query('COMMIT');
    } else {
      await client.query('ROLLBACK');
    }

    // Report
    const csvPath =
      options.csvPath || path.join(process.cwd(), `workshop-invoice-renumber-${options.apply ? 'apply' : 'dry-run'}-${runId}.csv`);
    const csv = [
      `# ${mode} run ${runId}; franchise ${code} FY ${fy}; cut-off ${options.cutoff}; N=${formatNumber(prefix, n)}; counter ${counterBefore} -> ${counterBefore + k}`,
      'run_id,mode,table_name,row_id,date,old_invoice_id,new_invoice_id',
      ...[...placed, ...changes].map((c) =>
        [runId, mode, c.tableName, c.rowId, c.date ?? '', c.oldInvoiceId ?? '', c.newInvoiceId].join(','),
      ),
    ].join('\n');
    writeFileSync(csvPath, `${csv}\n`);

    console.log(`${mode} — run ${runId}`);
    console.log(`Series ${prefix} · cut-off ${options.cutoff} · counter ${counterBefore} → ${counterBefore + k}`);
    console.log(`N = ${n ? formatNumber(prefix, n) : 'none (no invoice on or before the cut-off)'}`);
    for (const c of placed) {
      const w = workshops.find((row) => row.workshop_invoice_id === c.rowId);
      console.log(`  workshop invoice ${c.rowId} (total ${w?.total_amount}) → ${c.newInvoiceId} (PAID)`);
    }
    console.log(`${changes.length} later invoice(s) move up by ${k}:`);
    for (const c of changes) {
      console.log(`  ${c.oldInvoiceId} → ${c.newInvoiceId}  (${c.tableName} ${c.rowId}, ${c.date})`);
    }
    console.log(`CSV: ${csvPath}`);
    console.log(options.apply ? 'Committed.' : 'Dry run: rolled back, nothing written. Re-run with --apply to commit.');
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined);
    throw error;
  }
}

async function main(): Promise<void> {
  const requireFromCwd = createRequire(path.join(process.cwd(), 'package.json'));
  (requireFromCwd('dotenv') as DotenvModule).config();
  const env = (key: string, required = true): string => {
    const value = process.env[key];
    if (!value && required) throw new Error(`${key} is not set`);
    return value || '';
  };
  const options = parseArgs(process.argv.slice(2));
  const { Client } = requireFromCwd('pg') as PgModule;
  const client = new Client({
    host: env('DB_HOST'),
    port: Number(env('DB_PORT', false) || 5432),
    user: env('DB_USER'),
    password: env('DB_PASSWORD', false),
    database: env('DB_NAME'),
  });
  await client.connect();
  try {
    await run(client, options);
  } finally {
    await client.end();
  }
}

main().then(
  () => process.exit(0),
  (error: Error) => {
    if (error instanceof RefusedError) {
      console.error(`REFUSED (nothing written): ${error.message}`);
      process.exit(2);
    }
    console.error(`FAILED (rolled back): ${error.message}`);
    process.exit(1);
  },
);
