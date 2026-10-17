import {
  BusinessTypeEnum,
  InvoiceNumberFormatUtil,
  InvoiceSeriesEnum,
  InvoiceTypeLetter,
  RULE46_INVOICE_NUMBER,
} from '@eatfit247-shared-lib';

const TEMPLATE = '{PREFIX}/{FY}/{TYPE}/{SEQ5}';
const IN_LIMIT = { gstLimit: true };

describe('InvoiceNumberFormatUtil (compliant invoice numbering, decisions 3–6)', () => {
  describe('render', () => {
    it('EFM, April FY: EFM/2627/S/00492 (16 characters)', () => {
      const number = InvoiceNumberFormatUtil.render({
        template: TEMPLATE,
        prefix: 'EFM',
        fyStartMonth: 4,
        invoiceDate: '2026-10-17',
        typeLetter: 'S',
        sequence: 492,
      });
      expect(number).toBe('EFM/2627/S/00492');
      expect(number).toHaveLength(16);
      expect(RULE46_INVOICE_NUMBER.test(number)).toBe(true);
    });

    it('April FY boundary: 31 March belongs to the previous FY, 1 April to the next', () => {
      expect(InvoiceNumberFormatUtil.fyToken('2027-03-31', 4)).toBe('2627');
      expect(InvoiceNumberFormatUtil.fyToken('2027-04-01', 4)).toBe('2728');
      expect(InvoiceNumberFormatUtil.fyToken('2099-12-31', 4)).toBe('9900');
    });

    it('January FY renders the calendar year', () => {
      const number = InvoiceNumberFormatUtil.render({
        template: TEMPLATE,
        prefix: 'HCU',
        fyStartMonth: 1,
        invoiceDate: '2026-12-31',
        typeLetter: 'S',
        sequence: 12,
      });
      expect(number).toBe('HCU/2026/S/00012');
    });

    it('SEQ3 and SEQ8 pad to their width; 99999 still fits 16 with SEQ5', () => {
      const base = { prefix: 'EFM', fyStartMonth: 4, invoiceDate: '2026-04-01', typeLetter: 'P' };
      expect(InvoiceNumberFormatUtil.render({ ...base, template: '{PREFIX}/{FY}/{TYPE}/{SEQ3}', sequence: 7 })).toBe('EFM/2627/P/007');
      expect(InvoiceNumberFormatUtil.render({ ...base, template: '{PREFIX}{FY}{TYPE}{SEQ8}', sequence: 7 })).toBe('EFM2627P00000007');
      const max = InvoiceNumberFormatUtil.render({ ...base, template: TEMPLATE, sequence: 99999 });
      expect(max).toBe('EFM/2627/P/99999');
      expect(max.length).toBeLessThanOrEqual(16);
    });

    it('A7: every EFM and MEM number, all type letters, sequence 1…99999, satisfies Rule 46', () => {
      const failures: string[] = [];
      for (const prefix of ['EFM', 'MEM']) {
        for (const typeLetter of Object.values(InvoiceTypeLetter)) {
          for (let sequence = 1; sequence <= 99999; sequence++) {
            const number = InvoiceNumberFormatUtil.render({ template: TEMPLATE, prefix, fyStartMonth: 4, invoiceDate: '2026-10-17', typeLetter, sequence });
            if (!RULE46_INVOICE_NUMBER.test(number)) {
              failures.push(number);
            }
          }
        }
      }
      expect(failures).toEqual([]);
    });

    it('a template with - separators renders as written', () => {
      const number = InvoiceNumberFormatUtil.render({
        template: '{PREFIX}-{FY}-{TYPE}-{SEQ5}',
        prefix: 'MEM',
        fyStartMonth: 4,
        invoiceDate: '2026-07-01',
        typeLetter: 'P',
        sequence: 65,
      });
      expect(number).toBe('MEM-2627-P-00065');
    });
  });

  describe('typeLetter', () => {
    it.each([
      [BusinessTypeEnum.SERVICE, InvoiceSeriesEnum.DOMESTIC, false, InvoiceTypeLetter.DOMESTIC_SERVICE, 'S'],
      [BusinessTypeEnum.SERVICE, InvoiceSeriesEnum.EXPORT, false, InvoiceTypeLetter.EXPORT_SERVICE, 'E'],
      [BusinessTypeEnum.PRODUCT, InvoiceSeriesEnum.DOMESTIC, false, InvoiceTypeLetter.DOMESTIC_PRODUCT, 'P'],
      [BusinessTypeEnum.PRODUCT, InvoiceSeriesEnum.EXPORT, false, InvoiceTypeLetter.EXPORT_PRODUCT, 'X'],
      [BusinessTypeEnum.SERVICE, InvoiceSeriesEnum.DOMESTIC, true, InvoiceTypeLetter.CREDIT_NOTE, 'C'],
      [BusinessTypeEnum.PRODUCT, InvoiceSeriesEnum.EXPORT, true, InvoiceTypeLetter.CREDIT_NOTE, 'C'],
    ])('%s / %s / credit note %s → %s', (type, series, isCreditNote, expected, letter) => {
      expect(InvoiceNumberFormatUtil.typeLetter(type, series, isCreditNote)).toBe(expected);
      expect(expected).toBe(letter);
    });
  });

  describe('validate', () => {
    it('accepts the seeded EFM and MEM formats under the Indian limit', () => {
      expect(InvoiceNumberFormatUtil.validate(TEMPLATE, 'EFM', IN_LIMIT)).toEqual([]);
      expect(InvoiceNumberFormatUtil.validate(TEMPLATE, 'MEM', IN_LIMIT)).toEqual([]);
      expect(InvoiceNumberFormatUtil.validate('{PREFIX}-{FY}-{TYPE}-{SEQ5}', 'EFM', IN_LIMIT)).toEqual([]);
    });

    it('rejects a 6-character prefix', () => {
      const errors = InvoiceNumberFormatUtil.validate(TEMPLATE, 'EFMUM1', IN_LIMIT);
      expect(errors).toContain('Prefix must be 1 to 5 capital letters or digits.');
    });

    it('rejects a lowercase prefix', () => {
      expect(InvoiceNumberFormatUtil.validate(TEMPLATE, 'efm', IN_LIMIT)).toContain('Prefix must be 1 to 5 capital letters or digits.');
    });

    it('rejects {SEQ6} with a 5-character prefix (19 characters)', () => {
      const errors = InvoiceNumberFormatUtil.validate('{PREFIX}/{FY}/{TYPE}/{SEQ6}', 'EFMUM', IN_LIMIT);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('EFMUM/2627/S/999999');
      expect(errors[0]).toContain('19 characters');
    });

    it('rejects a 5-character prefix even with {SEQ5} (18 characters)', () => {
      expect(InvoiceNumberFormatUtil.validate(TEMPLATE, 'EFMUM', IN_LIMIT)[0]).toContain('18 characters');
    });

    it('rejects a space and an underscore as separators', () => {
      expect(InvoiceNumberFormatUtil.validate('{PREFIX}/{FY} {TYPE}/{SEQ5}', 'EFM', IN_LIMIT)).toEqual([
        'Only / and - may separate the tokens (found space).',
      ]);
      expect(InvoiceNumberFormatUtil.validate('{PREFIX}/{FY}_{TYPE}/{SEQ5}', 'EFM', IN_LIMIT)).toEqual([
        'Only / and - may separate the tokens (found "_").',
      ]);
    });

    it('rejects a leading 0 in the prefix', () => {
      expect(InvoiceNumberFormatUtil.validate(TEMPLATE, '0EF', IN_LIMIT)[0]).toContain('must start with a letter or a digit 1-9');
    });

    it('group 7: requires {FY}, so numbers never repeat when the counter restarts next FY', () => {
      expect(InvoiceNumberFormatUtil.validate('{PREFIX}/{TYPE}/{SEQ5}', 'EFM', IN_LIMIT)).toEqual(['Number format must contain {FY}.']);
      expect(InvoiceNumberFormatUtil.validate('{PREFIX}/{TYPE}/{SEQ5}', 'HCU', { gstLimit: false })).toEqual([
        'Number format must contain {FY}.',
      ]);
    });

    it('group 7: requires {PREFIX} first with a separator, so two franchises can never render the same number', () => {
      const startError = 'Number format must start with {PREFIX} followed by / or -.';
      expect(InvoiceNumberFormatUtil.validate('/{PREFIX}/{FY}/{TYPE}/{SEQ5}', 'EF', IN_LIMIT)).toEqual([startError]);
      expect(InvoiceNumberFormatUtil.validate('{FY}/{PREFIX}/{TYPE}/{SEQ5}', 'EF', IN_LIMIT)).toEqual([startError]);
      // 'EF' + SEQ glued vs 'EF00' + SEQ glued could collide; a separator after the prefix prevents it
      expect(InvoiceNumberFormatUtil.validate('{PREFIX}{FY}/{TYPE}/{SEQ5}', 'EF', IN_LIMIT)).toEqual([startError]);
    });

    it('group 7: requires {SEQn} last after a separator, so Table 13 reads the counter from the trailing digits', () => {
      const endError = 'Number format must end with {SEQn}, after a / or -.';
      expect(InvoiceNumberFormatUtil.validate('{PREFIX}/{SEQ5}/{FY}/{TYPE}', 'EF', IN_LIMIT)).toEqual([endError]);
      expect(InvoiceNumberFormatUtil.validate('{PREFIX}/{FY}/{TYPE}{SEQ5}', 'EF', IN_LIMIT)).toEqual([endError]);
      expect(InvoiceNumberFormatUtil.validate('{PREFIX}/{TYPE}/{FY}{SEQ5}', 'EF', IN_LIMIT)).toEqual([endError]);
      // A non-Indian template can't build a 17-digit trailing run either
      expect(InvoiceNumberFormatUtil.validate('{TYPE}{PREFIX}{FY}{SEQ8}', '99999', { gstLimit: false })).toEqual([
        'Number format must start with {PREFIX} followed by / or -.',
        'Number format must end with {SEQn}, after a / or -.',
      ]);
    });

    it('rejects unknown, repeated and missing tokens, and n outside 3–8', () => {
      expect(InvoiceNumberFormatUtil.validate('{PREFIX}/{YEAR}/{TYPE}/{SEQ5}', 'EFM', IN_LIMIT)).toContain(
        'Unknown token {YEAR}. Use {PREFIX}, {FY}, {TYPE} and {SEQn}.',
      );
      expect(InvoiceNumberFormatUtil.validate('{PREFIX}/{SEQ3}/{TYPE}/{SEQ4}', 'EFM', IN_LIMIT)).toContain('{SEQn} may appear only once.');
      expect(InvoiceNumberFormatUtil.validate('{PREFIX}/{FY}/{SEQ5}', 'EFM', IN_LIMIT)).toEqual(['Number format must contain {TYPE}.']);
      expect(InvoiceNumberFormatUtil.validate('{PREFIX}/{FY}/{TYPE}', 'EFM', IN_LIMIT)).toEqual(['Number format must contain {SEQn}.']);
      expect(InvoiceNumberFormatUtil.validate('EF/{FY}/{TYPE}/{SEQ5}', 'EFM', IN_LIMIT)).toContain('Number format must contain {PREFIX}.');
      expect(InvoiceNumberFormatUtil.validate('{PREFIX}/{FY}/{TYPE}/{SEQ2}', 'EFM', IN_LIMIT)).toEqual(['{SEQn} must have 3 to 8 digits.']);
      expect(InvoiceNumberFormatUtil.validate('{PREFIX}/{FY}/{TYPE}/{SEQ9}', 'EFM', IN_LIMIT)).toEqual(['{SEQn} must have 3 to 8 digits.']);
    });

    it('rejects literal text outside tokens and unmatched braces', () => {
      expect(InvoiceNumberFormatUtil.validate('{PREFIX}/INV/{FY}/{TYPE}/{SEQ5}', 'EF', IN_LIMIT)).toEqual([
        'Only / and - may separate the tokens (found "I", "N", "V").',
      ]);
      expect(InvoiceNumberFormatUtil.validate('{PREFIX}/{TYPE}/{SEQ5', 'EF', IN_LIMIT)).toContain('Number format must contain {SEQn}.');
    });

    it('rejects an empty template', () => {
      expect(InvoiceNumberFormatUtil.validate('', 'EFM', IN_LIMIT)).toEqual(['Number format is required.']);
      expect(InvoiceNumberFormatUtil.validate(null, 'EFM', IN_LIMIT)).toEqual(['Number format is required.']);
    });

    it('a non-GST franchise is not held to 16 characters, but still needs valid tokens', () => {
      expect(InvoiceNumberFormatUtil.validate('{PREFIX}/{FY}/{TYPE}/{SEQ8}', 'HCUAE', { gstLimit: false })).toEqual([]);
      expect(InvoiceNumberFormatUtil.validate('{PREFIX}/{FY}/{SEQ8}', 'HCUAE', { gstLimit: false })).toEqual([
        'Number format must contain {TYPE}.',
      ]);
    });
  });
});
