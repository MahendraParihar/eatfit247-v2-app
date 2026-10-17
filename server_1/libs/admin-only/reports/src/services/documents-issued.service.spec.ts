import { Sequelize } from 'sequelize-typescript';
import { DocumentNatureEnum, IAuthUser } from '@eatfit247-shared-lib';
import { MstFranchise } from '@server_1/core';
import { TxnMember } from '@server_1/modules/member';
import { DocumentsIssuedService, IIssuedDocument, MAX_MISSING_LISTED } from './documents-issued.service';
import { FinancialYearService } from './financial-year.service';
import { DocumentSeriesUtil } from '../utils/document-series.util';

const INVOICE = DocumentNatureEnum.INVOICES_FOR_OUTWARD_SUPPLY;
const CREDIT = DocumentNatureEnum.CREDIT_NOTE;

const doc = (number: string, cancelled = false, nature = INVOICE): IIssuedDocument => ({ number, cancelled, nature });
const range = (prefix: string, fromSeq: number, toSeq: number, width: number): IIssuedDocument[] =>
  Array.from({ length: toSeq - fromSeq + 1 }, (_, i) => doc(DocumentSeriesUtil.join(prefix, fromSeq + i, width)));

describe('DocumentSeriesUtil.split (decision 13)', () => {
  it.each([
    ['EFMUM/2026-27/S/000491', 'EFMUM/2026-27/S/', 491, 6],
    ['EFMUM/EXP/2026-27/S/000007', 'EFMUM/EXP/2026-27/S/', 7, 6],
    ['EFM/2627/S/00492', 'EFM/2627/S/', 492, 5],
    ['EFM2627C00000001', 'EFM2627C', 1, 8],
    ['HCUAE/2026/CN/000004', 'HCUAE/2026/CN/', 4, 6],
    ['NO-COUNTER', 'NO-COUNTER', null, 0],
  ])('%s → %s + %s', (number, seriesKey, sequence, width) => {
    expect(DocumentSeriesUtil.split(number)).toEqual({ seriesKey, sequence, width });
  });
});

describe('DocumentsIssuedService.buildRows (GSTR-1 Table 13)', () => {
  it('A17: the old and the new format of one counter are two rows with exact from / to', () => {
    const rows = DocumentsIssuedService.buildRows([...range('EFM/2627/S/', 492, 495, 5), ...range('EFMUM/2026-27/S/', 480, 491, 6)]);
    expect(rows).toEqual([
      expect.objectContaining({ natureOfDocument: INVOICE, seriesKey: 'EFM/2627/S/', fromNumber: 'EFM/2627/S/00492', toNumber: 'EFM/2627/S/00495', totalIssued: 4, cancelled: 0, netIssued: 4, missingNumbers: [] }),
      expect.objectContaining({ natureOfDocument: INVOICE, seriesKey: 'EFMUM/2026-27/S/', fromNumber: 'EFMUM/2026-27/S/000480', toNumber: 'EFMUM/2026-27/S/000491', totalIssued: 12, netIssued: 12 }),
    ]);
  });

  it('splits S / E / P / X and puts credit notes (C and legacy CN) under Credit Note, after the invoices', () => {
    const rows = DocumentsIssuedService.buildRows([
      doc('EFM/2627/C/00001', false, CREDIT),
      doc('HCUAE/2026/CN/000004', false, CREDIT),
      doc('EFM/2627/S/00492'),
      doc('EFM/2627/E/00001'),
      doc('MEM/2627/P/00065'),
      doc('MEM/2627/X/00001'),
    ]);
    expect(rows.map((row) => [row.natureOfDocument, row.seriesKey])).toEqual([
      [INVOICE, 'EFM/2627/E/'],
      [INVOICE, 'EFM/2627/S/'],
      [INVOICE, 'MEM/2627/P/'],
      [INVOICE, 'MEM/2627/X/'],
      [CREDIT, 'EFM/2627/C/'],
      [CREDIT, 'HCUAE/2026/CN/'],
    ]);
  });

  it('A18: a cancelled number counts in Total and in Cancelled; Net = Total − Cancelled', () => {
    const [row] = DocumentsIssuedService.buildRows([doc('EFM/2627/S/00492'), doc('EFM/2627/S/00493', true), doc('EFM/2627/S/00494')]);
    expect(row).toMatchObject({ fromNumber: 'EFM/2627/S/00492', toNumber: 'EFM/2627/S/00494', totalIssued: 3, cancelled: 1, netIssued: 2, missingNumbers: [] });
  });

  it('A19: a gap inside the series is flagged with the missing numbers', () => {
    const [row] = DocumentsIssuedService.buildRows([doc('EFM/2627/S/00495'), doc('EFM/2627/S/00492'), doc('EFM/2627/S/00494')]);
    expect(row).toMatchObject({ fromNumber: 'EFM/2627/S/00492', toNumber: 'EFM/2627/S/00495', totalIssued: 3, missingNumbers: ['EFM/2627/S/00493'], missingTruncated: false });
  });

  it(`lists at most ${MAX_MISSING_LISTED} missing numbers and flags the rest`, () => {
    const [row] = DocumentsIssuedService.buildRows([doc('EFM/2627/S/00001'), doc('EFM/2627/S/00200')]);
    expect(row.missingNumbers).toHaveLength(MAX_MISSING_LISTED);
    expect(row.missingNumbers[0]).toBe('EFM/2627/S/00002');
    expect(row.missingTruncated).toBe(true);
  });

  it('returns no rows for an empty period', () => {
    expect(DocumentsIssuedService.buildRows([])).toEqual([]);
  });

  it('CSV has the portal columns, quotes where needed, and matches the rows', () => {
    const csv = DocumentsIssuedService.toCsv({
      franchiseId: 1,
      franchiseCode: 'EFMUM',
      companyName: 'EAT FIT 247',
      from: '2026-10-01',
      to: '2026-10-31',
      reportable: true,
      rows: DocumentsIssuedService.buildRows([doc('EFM/2627/S/00492'), doc('EFM/2627/S/00494', true)]),
    });
    expect(csv.split('\r\n')).toEqual([
      'Nature of document,Sr. No. From,Sr. No. To,Total number,Cancelled,Net issued,Missing numbers',
      'Invoices for outward supply,EFM/2627/S/00492,EFM/2627/S/00494,2,1,1,EFM/2627/S/00493',
      '',
    ]);
  });
});

describe('DocumentsIssuedService.report', () => {
  let query: jest.Mock;
  let franchiseFindOne: jest.Mock;
  let service: DocumentsIssuedService;
  const superAdmin = { adminId: 1, franchiseIds: [] } as unknown as IAuthUser;
  const dubaiAdmin = { adminId: 7, franchiseIds: [2] } as unknown as IAuthUser;

  beforeEach(() => {
    query = jest.fn().mockResolvedValue([
      { kind: 'INVOICE', number: 'EFMUM/2026-27/S/000491', cancelled: false },
      { kind: 'INVOICE', number: 'EFM/2627/S/00492', cancelled: true },
      { kind: 'CREDIT_NOTE', number: 'EFM/2627/C/00001', cancelled: false },
    ]);
    franchiseFindOne = jest.fn().mockResolvedValue({
      franchiseId: 1,
      franchiseCode: 'EFMUM',
      companyName: 'EAT FIT 247',
      gstNumber: '27AAAAA0000A1Z5',
      timeZone: 'Asia/Kolkata',
    });
    service = new DocumentsIssuedService(
      new FinancialYearService({ findOne: franchiseFindOne } as unknown as typeof MstFranchise, {} as typeof TxnMember),
      { query } as unknown as Sequelize,
    );
  });

  it('reads the franchise\'s three tables for the period, dating legacy rows by payment date', async () => {
    const report = await service.report(superAdmin, 1, '2026-10-01', '2026-10-31');
    expect(report).toMatchObject({ franchiseId: 1, franchiseCode: 'EFMUM', reportable: true, from: '2026-10-01', to: '2026-10-31' });
    expect(report.rows.map((row) => [row.natureOfDocument, row.fromNumber, row.cancelled])).toEqual([
      [INVOICE, 'EFM/2627/S/00492', 1],
      [INVOICE, 'EFMUM/2026-27/S/000491', 0],
      [CREDIT, 'EFM/2627/C/00001', 0],
    ]);
    const [sql, options] = query.mock.calls[0];
    expect(options.replacements).toEqual({ franchiseId: 1, from: '2026-10-01', to: '2026-10-31', timeZone: 'Asia/Kolkata', paid: 1 });
    expect(sql.match(/franchise_id = :franchiseId/g)).toHaveLength(3);
    expect(sql).toContain('COALESCE(p.invoice_date, p.payment_date)');
    expect(sql).toContain('COALESCE(m.invoice_date, (m.payment_date AT TIME ZONE :timeZone)::date)');
    expect(sql).toContain('c.credit_note_date BETWEEN');
    expect(sql).toContain('p.active = false OR p.payment_status_id <> :paid');
  });

  it('accepts a month and a quarter, refuses a reversed or over-long period', async () => {
    await service.report(superAdmin, 1, '2026-10-01', '2026-10-31');
    await service.report(superAdmin, 1, '2026-07-01', '2026-09-30');
    expect(query.mock.calls[1][1].replacements).toMatchObject({ from: '2026-07-01', to: '2026-09-30' });
    await expect(service.report(superAdmin, 1, '2026-10-31', '2026-10-01')).rejects.toThrow('ends before it starts');
    await expect(service.report(superAdmin, 1, '2026-04-01', '2027-04-02')).rejects.toThrow('at most 366 days');
    await expect(service.report(superAdmin, 1, '2026-10-1', '2026-10-31')).rejects.toThrow('YYYY-MM-DD');
  });

  it('another franchise\'s admin is refused before any row is read', async () => {
    await expect(service.report(dubaiAdmin, 1, '2026-10-01', '2026-10-31')).rejects.toThrow('You do not have access to this franchise.');
    expect(query).not.toHaveBeenCalled();
  });

  it('a franchise without a GSTIN is marked not reportable', async () => {
    franchiseFindOne.mockResolvedValue({ franchiseId: 3, franchiseCode: 'MEMUM', companyName: 'Mahi Enterprise', gstNumber: null, timeZone: 'Asia/Kolkata' });
    expect((await service.report(superAdmin, 3, '2026-10-01', '2026-10-31')).reportable).toBe(false);
  });
});
