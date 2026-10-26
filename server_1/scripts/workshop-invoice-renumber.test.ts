/**
 * Integration tests for workshop-invoice-renumber.ts (plan group 7.4), against throwaway copies
 * of a seeded database. Each test clones TEMPLATE_DB (a production-shaped copy at migration
 * 136 + 151 with no open connections), seeds three PENDING workshop invoices dated on the
 * cut-off, runs the script as a child process and checks the database. Failures are injected
 * with triggers in the clone, so the script itself has no test hooks.
 *
 *   cd server_1
 *   TEMPLATE_DB=eatfit_wi_tpl node --experimental-strip-types --test scripts/workshop-invoice-renumber.test.ts
 *
 * Expects franchise 1 = EFMUM with an S series for FY 2026-27 (the 14 Oct production copy has 1…491).
 */

import { test } from 'node:test';
import * as assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import * as path from 'node:path';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';

interface PgClient {
  connect(): Promise<void>;
  query<T>(sql: string, params?: unknown[]): Promise<{ rows: T[] }>;
  end(): Promise<void>;
}

interface PgModule {
  Client: new (config: Record<string, unknown>) => PgClient;
}

const requireFromCwd = createRequire(path.join(process.cwd(), 'package.json'));
(requireFromCwd('dotenv') as { config(): void }).config();
const { Client } = requireFromCwd('pg') as PgModule;

const TEMPLATE_DB = process.env['TEMPLATE_DB'] || 'eatfit_wi_tpl';
const SCRIPT = path.join(process.cwd(), 'scripts', 'workshop-invoice-renumber.ts');
const CUTOFF = '2026-08-11';
const PREFIX = 'EFMUM/2026-27/S/';
const outDir = mkdtempSync(path.join(tmpdir(), 'wi-renumber-'));

const connect = async (database: string): Promise<PgClient> => {
  const client = new Client({
    host: process.env['DB_HOST'],
    port: Number(process.env['DB_PORT'] || 5432),
    user: process.env['DB_USER'],
    password: process.env['DB_PASSWORD'],
    database,
  });
  await client.connect();
  return client;
};

let dbCounter = 0;
let csvCounter = 0;
async function cloneDb(): Promise<string> {
  const name = `wi_renumber_test_${process.pid}_${++dbCounter}`;
  const admin = await connect('postgres');
  await admin.query(`CREATE DATABASE ${name} TEMPLATE ${TEMPLATE_DB}`);
  await admin.end();
  return name;
}

async function dropDb(name: string): Promise<void> {
  const admin = await connect('postgres');
  await admin.query(`DROP DATABASE IF EXISTS ${name} WITH (FORCE)`);
  await admin.end();
}

/** Three PENDING workshop invoices dated on the cut-off with payment details (200/200/174 × 850). */
async function seedWorkshops(db: PgClient, overrides: Record<number, Record<string, unknown>> = {}): Promise<number[]> {
  const ids: number[] = [];
  for (const [index, qty] of [200, 200, 174].entries()) {
    const base = qty * 850;
    const tax = base * 0.18;
    const values: Record<string, unknown> = {
      franchise_id: 1,
      invoice_date: CUTOFF,
      supply_date: CUTOFF,
      bill_to_name: '<Organiser legal name>',
      bill_to_address: JSON.stringify({ postalAddress: '<Address line 1>', cityVillage: '<City>', pinCode: '400001', countryId: 96, stateId: 27, country: 'India', countryCode: 'IN', state: 'Maharashtra', stateCode: '27' }),
      bill_to_country_id: 96,
      bill_to_state_id: 27,
      place_of_supply_state_id: 27,
      description: 'Gut reset programme workshop',
      quantity: qty,
      unit_rate: 850,
      order_amount: base,
      tax_amount: tax,
      total_amount: base + tax,
      currency: 'INR',
      tax_obj: JSON.stringify({ CGST: { amount: tax / 2, taxPercentage: 9 }, SGST: { amount: tax / 2, taxPercentage: 9 } }),
      tax_type: 'GST',
      tax_mode: 'DOMESTIC_GST',
      tax_percentage: 18,
      payment_status_id: 2,
      payment_mode_id: 3,
      transaction_id: `UTR-${index + 1}`,
      payment_date: CUTOFF,
      created_by: 1,
      modified_by: 1,
      created_ip: '127.0.0.1',
      modified_ip: '127.0.0.1',
      ...(overrides[index] || {}),
    };
    const columns = Object.keys(values);
    const { rows } = await db.query<{ workshop_invoice_id: number }>(
      `INSERT INTO txn_workshop_invoices (${columns.join(', ')})
       VALUES (${columns.map((_, i) => `$${i + 1}`).join(', ')}) RETURNING workshop_invoice_id`,
      columns.map((c) => values[c]),
    );
    ids.push(rows[0].workshop_invoice_id);
  }
  return ids;
}

interface RunResult {
  code: number | null;
  stdout: string;
  stderr: string;
  ms: number;
}

function runScript(database: string, args: string[]): Promise<RunResult> {
  const started = Date.now();
  // Keep every CSV in the temp folder, never in server_1.
  const csvArgs = args.includes('--csv') ? [] : ['--csv', path.join(outDir, `run-${++csvCounter}.csv`)];
  return new Promise((resolve) => {
    const child = spawn(process.execPath, ['--experimental-strip-types', '--no-warnings', SCRIPT, ...args, ...csvArgs], {
      cwd: process.cwd(),
      env: { ...process.env, DB_NAME: database },
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d) => (stdout += d));
    child.stderr.on('data', (d) => (stderr += d));
    child.on('close', (code) => resolve({ code, stdout, stderr, ms: Date.now() - started }));
  });
}

const baseArgs = (ids: number[], extra: string[] = []): string[] => [
  '--franchise-id', '1', '--cutoff', CUTOFF, '--invoices', ids.join(','), ...extra,
];

/** Everything the script may touch, as one comparable snapshot. */
async function snapshot(db: PgClient): Promise<string> {
  const queries = [
    `SELECT member_payment_id, invoice_id, payment_date::text, total_amount::text, tax_obj::text FROM txn_member_payments ORDER BY 1`,
    `SELECT workshop_invoice_id, invoice_id, payment_status_id, sac_code, total_amount::text FROM txn_workshop_invoices ORDER BY 1`,
    `SELECT franchise_id, invoice_type, financial_year, current_number FROM mst_invoice_sequences ORDER BY 1, 2, 3`,
    `SELECT count(*) FROM txn_invoice_renumber_log`,
  ];
  const parts: string[] = [];
  for (const sql of queries) parts.push(JSON.stringify((await db.query(sql)).rows));
  return parts.join('\n');
}

async function counter(db: PgClient): Promise<number> {
  const { rows } = await db.query<{ current_number: number }>(
    `SELECT current_number FROM mst_invoice_sequences WHERE franchise_id = 1 AND invoice_type = 'service' AND financial_year = '2026-27'`,
  );
  return Number(rows[0].current_number);
}

async function memberSeries(db: PgClient): Promise<Map<number, string>> {
  const { rows } = await db.query<{ member_payment_id: number; invoice_id: string }>(
    `SELECT member_payment_id, invoice_id FROM txn_member_payments WHERE LEFT(invoice_id, ${PREFIX.length}) = '${PREFIX}'`,
  );
  return new Map(rows.map((r) => [r.member_payment_id, r.invoice_id]));
}

async function withDb(fn: (db: PgClient, name: string) => Promise<void>): Promise<void> {
  const name = await cloneDb();
  const db = await connect(name);
  try {
    await fn(db, name);
  } finally {
    await db.end();
    await dropDb(name);
  }
}

const num = (invoiceId: string): number => Number(invoiceId.slice(PREFIX.length));

test('dry run prints N and the mapping, writes the CSV and changes nothing', async () => {
  await withDb(async (db, name) => {
    const ids = await seedWorkshops(db);
    const before = await snapshot(db);
    const csv = path.join(outDir, 'dry.csv');
    const result = await runScript(name, baseArgs(ids, ['--csv', csv]));
    assert.equal(result.code, 0, result.stderr);
    assert.match(result.stdout, /DRY RUN/);
    assert.match(result.stdout, new RegExp(`N = ${PREFIX}\\d{6}`));
    assert.match(result.stdout, /rolled back, nothing written/);
    assert.equal(await snapshot(db), before);
    const lines = readFileSync(csv, 'utf8').trim().split('\n');
    assert.match(lines[0], /DRY RUN/);
    assert.ok(lines.length > 5);
  });
});

test('apply places the invoices at N+1…N+3, moves later numbers by 3, counter +3, logs every row', async () => {
  await withDb(async (db, name) => {
    const ids = await seedWorkshops(db);
    const counterBefore = await counter(db);
    const membersBefore = await memberSeries(db);
    const { rows: dated } = await db.query<{ n: number }>(
      `SELECT MAX(RIGHT(invoice_id, 6)::int) AS n FROM txn_member_payments
        WHERE LEFT(invoice_id, ${PREFIX.length}) = '${PREFIX}' AND payment_date <= '${CUTOFF}'`,
    );
    const n = Number(dated[0].n);
    const others = `SELECT invoice_id FROM txn_member_payments WHERE invoice_id IS NOT NULL AND LEFT(invoice_id, ${PREFIX.length}) <> '${PREFIX}' ORDER BY member_payment_id`;
    const othersBefore = JSON.stringify((await db.query(others)).rows);
    const productBefore = JSON.stringify((await db.query(`SELECT * FROM txn_member_products ORDER BY 1`).catch(() => ({ rows: [] }))).rows);
    const amountsBefore = JSON.stringify((await db.query(`SELECT member_payment_id, payment_date, total_amount, tax_amount, tax_obj FROM txn_member_payments ORDER BY 1`)).rows);

    const result = await runScript(name, baseArgs(ids, ['--apply', '--csv', path.join(outDir, 'apply.csv')]));
    assert.equal(result.code, 0, result.stderr);
    assert.match(result.stdout, new RegExp(`N = ${PREFIX}${String(n).padStart(6, '0')}`));

    const { rows: workshops } = await db.query<{ workshop_invoice_id: number; invoice_id: string; payment_status_id: number; sac_code: string; total_amount: string }>(
      `SELECT workshop_invoice_id, invoice_id, payment_status_id, sac_code, total_amount::text FROM txn_workshop_invoices ORDER BY workshop_invoice_id`,
    );
    assert.deepEqual(workshops.map((w) => num(w.invoice_id)), [n + 1, n + 2, n + 3]);
    assert.deepEqual(workshops.map((w) => w.total_amount), ['200600.00', '200600.00', '174522.00']);
    assert.ok(workshops.every((w) => w.payment_status_id === 1 && w.sac_code));

    assert.equal(await counter(db), counterBefore + 3);
    const membersAfter = await memberSeries(db);
    let shiftedCount = 0;
    for (const [id, oldInvoiceId] of membersBefore) {
      const expected = num(oldInvoiceId) > n ? num(oldInvoiceId) + 3 : num(oldInvoiceId);
      if (num(oldInvoiceId) > n) shiftedCount++;
      assert.equal(num(membersAfter.get(id) as string), expected, `member payment ${id}`);
    }
    // 1…counter with no gap or duplicate across both tables
    const all = [...membersAfter.values(), ...workshops.map((w) => w.invoice_id)].map(num).sort((a, b) => a - b);
    assert.deepEqual(all, Array.from({ length: counterBefore + 3 }, (_, i) => i + 1));

    const { rows: log } = await db.query<{ runs: number; rows: number }>(
      `SELECT COUNT(DISTINCT run_id)::int AS runs, COUNT(*)::int AS rows FROM txn_invoice_renumber_log`,
    );
    assert.deepEqual(log[0], { runs: 1, rows: shiftedCount + 3 });

    // Out-of-date-order rows: numbers ≤ N stay even when dated after the cut-off.
    const { rows: lateLowNumbers } = await db.query<{ c: number }>(
      `SELECT COUNT(*)::int AS c FROM txn_member_payments
        WHERE LEFT(invoice_id, ${PREFIX.length}) = '${PREFIX}' AND payment_date > '${CUTOFF}' AND RIGHT(invoice_id, 6)::int <= ${n}`,
    );
    // The copy has such rows (e.g. 000335 dated 12 Aug sits below 000336 dated 11 Aug).
    assert.ok(lateLowNumbers[0].c > 0, 'expected out-of-date-order rows at or below N');

    assert.equal(JSON.stringify((await db.query(others)).rows), othersBefore, 'P invoices and other series unchanged');
    assert.equal(JSON.stringify((await db.query(`SELECT * FROM txn_member_products ORDER BY 1`).catch(() => ({ rows: [] }))).rows), productBefore);
    assert.equal(JSON.stringify((await db.query(`SELECT member_payment_id, payment_date, total_amount, tax_amount, tax_obj FROM txn_member_payments ORDER BY 1`)).rows), amountsBefore, 'dates, amounts and tax unchanged');

    // A second run for the same invoices is refused.
    const again = await runScript(name, baseArgs(ids, ['--apply']));
    assert.equal(again.code, 2);
    assert.match(again.stderr, /Already renumbered/);
  });
});

const preconditions: [string, Record<string, unknown>, RegExp][] = [
  ['cancelled', { active: false, cancel_reason: 'x' }, /cancelled/],
  ['not PENDING', { payment_status_id: 4 }, /not PENDING/],
  ['another franchise', { franchise_id: 2 }, /on franchise 2/],
  ['not dated on the cut-off', { invoice_date: '2026-08-12' }, /not 2026-08-11/],
  ['no payment reference', { transaction_id: null }, /payment mode, reference or date missing/],
  ['no payment mode', { payment_mode_id: null }, /payment mode, reference or date missing/],
  ['already numbered', { invoice_id: 'EFMUM/2026-27/S/999999' }, /already numbered|series is not/],
];

for (const [label, override, message] of preconditions) {
  test(`refuses when an invoice is ${label}`, async () => {
    await withDb(async (db, name) => {
      const ids = await seedWorkshops(db, { 1: override });
      const before = await snapshot(db);
      const result = await runScript(name, baseArgs(ids, ['--apply']));
      assert.equal(result.code, 2, result.stdout + result.stderr);
      assert.match(result.stderr, message);
      assert.equal(await snapshot(db), before);
    });
  });
}

test('refuses a missing invoice ID', async () => {
  await withDb(async (db, name) => {
    const ids = await seedWorkshops(db);
    const result = await runScript(name, baseArgs([ids[0], ids[1], 999999], ['--apply']));
    assert.equal(result.code, 2);
    assert.match(result.stderr, /999999 not found/);
  });
});

test('refuses a series with a gap', async () => {
  await withDb(async (db, name) => {
    const ids = await seedWorkshops(db);
    await db.query(`UPDATE txn_member_payments SET invoice_id = '${PREFIX}000900' WHERE invoice_id = '${PREFIX}000400'`);
    const before = await snapshot(db);
    const result = await runScript(name, baseArgs(ids, ['--apply']));
    assert.equal(result.code, 2);
    assert.match(result.stderr, /missing 400/);
    assert.equal(await snapshot(db), before);
  });
});

test('refuses a series with a duplicate across the two tables', async () => {
  await withDb(async (db, name) => {
    const ids = await seedWorkshops(db);
    // An issued workshop invoice that reuses a member payment's number.
    await seedWorkshops(db, { 0: { invoice_id: `${PREFIX}000010`, payment_status_id: 1 } });
    const before = await snapshot(db);
    const result = await runScript(name, baseArgs(ids, ['--apply']));
    assert.equal(result.code, 2);
    assert.match(result.stderr, /duplicate number .*000010/);
    assert.equal(await snapshot(db), before);
  });
});

test('an error part-way through rolls everything back', async () => {
  await withDb(async (db, name) => {
    const ids = await seedWorkshops(db);
    await db.query(`
      CREATE FUNCTION test_fail_log() RETURNS trigger AS $$
      BEGIN
        IF (SELECT COUNT(*) FROM txn_invoice_renumber_log) >= 5 THEN
          RAISE EXCEPTION 'injected failure';
        END IF;
        RETURN NEW;
      END $$ LANGUAGE plpgsql;
      CREATE TRIGGER test_fail_log BEFORE INSERT ON txn_invoice_renumber_log
        FOR EACH ROW EXECUTE FUNCTION test_fail_log();`);
    const before = await snapshot(db);
    const result = await runScript(name, baseArgs(ids, ['--apply']));
    assert.equal(result.code, 1);
    assert.match(result.stderr, /injected failure/);
    assert.equal(await snapshot(db), before);
  });
});

test('a concurrent member PAID waits for the run and then takes the next number', async () => {
  await withDb(async (db, name) => {
    const ids = await seedWorkshops(db);
    const counterBefore = await counter(db);
    // Hold the script's transaction open for ~3 s after it has locked the counter.
    await db.query(`
      CREATE FUNCTION test_slow_log() RETURNS trigger AS $$
      BEGIN
        IF (SELECT COUNT(*) FROM txn_invoice_renumber_log) = 0 THEN PERFORM pg_sleep(3); END IF;
        RETURN NEW;
      END $$ LANGUAGE plpgsql;
      CREATE TRIGGER test_slow_log BEFORE INSERT ON txn_invoice_renumber_log
        FOR EACH ROW EXECUTE FUNCTION test_slow_log();`);
    const script = runScript(name, baseArgs(ids, ['--apply']));
    await new Promise((r) => setTimeout(r, 1500));
    // Same statements InvoiceSequenceService.generateInvoiceNumber runs for a member payment.
    const other = await connect(name);
    const started = Date.now();
    await other.query('BEGIN');
    const { rows } = await other.query<{ current_number: number }>(
      `SELECT current_number FROM mst_invoice_sequences
        WHERE franchise_id = 1 AND invoice_type = 'service' AND financial_year = '2026-27' FOR UPDATE`,
    );
    const waited = Date.now() - started;
    const next = Number(rows[0].current_number) + 1;
    await other.query(
      `UPDATE mst_invoice_sequences SET current_number = $1 WHERE franchise_id = 1 AND invoice_type = 'service' AND financial_year = '2026-27'`,
      [next],
    );
    await other.query('COMMIT');
    await other.end();
    const result = await script;
    assert.equal(result.code, 0, result.stderr);
    assert.ok(waited >= 1000, `the concurrent transaction waited only ${waited} ms`);
    assert.equal(next, counterBefore + 4);
    assert.equal(await counter(db), counterBefore + 4);
  });
});
