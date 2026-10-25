import { DialCodeUtil, gstStateCode, IDialCodeCountry, TaxRegistrationNumberUtil, TaxTypeEnum, gstStateName } from '@eatfit247-shared-lib';

/** Configurable tax treatment, plan 2.4 (decisions 9, 10). */
describe('TaxRegistrationNumberUtil', () => {
  describe('GSTIN (format, State code, mod-36 check character)', () => {
    it.each([
      ['27CSEPS5397E1Z8', '27'], // EFMUM's GSTIN
      ['27AAPFU0939F1ZV', '27'], // GSTN's documentation sample
      ['24AAACC1206D1ZM', '24'],
    ])('accepts %s (State %s)', (gstin, state) => {
      expect(TaxRegistrationNumberUtil.checkGstin(gstin)).toEqual({ valid: true, normalized: gstin, stateCode: state, error: null });
    });

    it('returns the State in the State master\'s form: 7 for a Delhi GSTIN (07…)', () => {
      const first14 = '07CSEPS5397E1Z';
      expect(TaxRegistrationNumberUtil.checkGstin(first14 + TaxRegistrationNumberUtil.gstinCheckCharacter(first14)).stateCode).toBe('7');
      expect(gstStateCode('07')).toBe('7');
      expect(gstStateCode('27')).toBe('27');
      expect(gstStateCode('ae-du')).toBe('AE-DU');
      expect(gstStateCode('')).toBeNull();
    });

    it('normalises case, spaces and punctuation before checking', () => {
      expect(TaxRegistrationNumberUtil.checkGstin(' 27-cseps 5397e1z8 ')).toMatchObject({ valid: true, normalized: '27CSEPS5397E1Z8' });
    });

    it('refuses a wrong check character (a one-character typo)', () => {
      expect(TaxRegistrationNumberUtil.checkGstin('27CSEPS5397E1Z9')).toMatchObject({ valid: false, error: expect.stringContaining('check character') });
    });

    it('refuses a State code that does not exist, even with a matching check character', () => {
      const first14 = '40CSEPS5397E1Z';
      const gstin = first14 + TaxRegistrationNumberUtil.gstinCheckCharacter(first14);
      expect(TaxRegistrationNumberUtil.checkGstin(gstin)).toMatchObject({ valid: false, error: '40 is not a GST State code.' });
    });

    it('accepts the Other Territory code 97 when the rest is valid', () => {
      const first14 = '97CSEPS5397E1Z';
      expect(TaxRegistrationNumberUtil.checkGstin(first14 + TaxRegistrationNumberUtil.gstinCheckCharacter(first14)).valid).toBe(true);
    });

    it.each(['456789', '', '27CSEPS5397E1Z', '27CSEPS5397E0Z8', 'XXCSEPS5397E1Z8'])('refuses the malformed value "%s" (legacy data such as 456789)', (value) => {
      expect(TaxRegistrationNumberUtil.checkGstin(value)).toMatchObject({ valid: false, error: expect.stringContaining('15 characters') });
    });
  });

  describe('UAE TRN (15 digits)', () => {
    it('accepts 15 digits, with spaces or dashes', () => {
      expect(TaxRegistrationNumberUtil.checkTrn('100123456700003')).toMatchObject({ valid: true, normalized: '100123456700003' });
      expect(TaxRegistrationNumberUtil.checkTrn('100-1234-5670-0003')).toMatchObject({ valid: true, normalized: '100123456700003' });
    });

    it.each(['456789', '10012345670000', '1001234567000031', '10012345670000A'])('refuses %s', (value) => {
      expect(TaxRegistrationNumberUtil.checkTrn(value)).toMatchObject({ valid: false, error: 'A UAE TRN has 15 digits.' });
    });
  });

  describe('by billing country', () => {
    it('India checks a GSTIN, the UAE a TRN, any other country is refused', () => {
      expect(TaxRegistrationNumberUtil.checkForCountry('IN', '27CSEPS5397E1Z8').valid).toBe(true);
      expect(TaxRegistrationNumberUtil.checkForCountry('in', '100123456700003').valid).toBe(false);
      expect(TaxRegistrationNumberUtil.checkForCountry('AE', '100123456700003').valid).toBe(true);
      expect(TaxRegistrationNumberUtil.checkForCountry('AE', '27CSEPS5397E1Z8').valid).toBe(false);
      expect(TaxRegistrationNumberUtil.checkForCountry('US', '27CSEPS5397E1Z8')).toMatchObject({
        valid: false,
        error: expect.stringContaining('India (GSTIN) and the UAE (TRN) only'),
      });
    });
  });

  it('labels: GSTIN, TRN in the UAE, VAT No. elsewhere', () => {
    expect(TaxRegistrationNumberUtil.label(TaxTypeEnum.GST, 'IN')).toBe('GSTIN');
    expect(TaxRegistrationNumberUtil.label(TaxTypeEnum.VAT, 'AE')).toBe('TRN');
    expect(TaxRegistrationNumberUtil.label(TaxTypeEnum.VAT, 'GB')).toBe('VAT No.');
  });
});

describe('DialCodeUtil (evidence indicator, decision 9)', () => {
  // As stored in mst_countries
  const countries: IDialCodeCountry[] = [
    { countryCode: 'IN', country: 'India', phoneNumberCode: '+91' },
    { countryCode: 'AE', country: 'United Arab Emirates', phoneNumberCode: '+971' },
    { countryCode: 'US', country: 'United States', phoneNumberCode: '+1' },
    { countryCode: 'CA', country: 'Canada', phoneNumberCode: '+1' },
    { countryCode: 'AS', country: 'American Samoa', phoneNumberCode: '+1-684' },
    { countryCode: 'AU', country: 'Australia', phoneNumberCode: '+61' },
  ];

  it.each([
    ['+971', ['AE']],
    ['971', ['AE']],
    ['00971', ['AE']],
    ['India', ['IN']],
    ['+91', ['IN']],
    ['+1', ['CA', 'US']],
    ['+1-684', ['AS']],
    // Dial code run into the number (real member data): longest code it starts with (plan 2b.7)
    ['+9715', ['AE']],
    ['+917', ['IN']],
    ['+16845551234', ['AS']],
  ])('%s → %j', (value, expected) => {
    expect(DialCodeUtil.countryCodes(value, countries)).toEqual(expected);
  });

  it.each(['', '   ', '+999', 'Atlantis', 'Dubai', null])('unknown "%s" → none (NOT_AVAILABLE)', (value) => {
    expect(DialCodeUtil.countryCodes(value, countries)).toEqual([]);
  });

  describe('gstStateName (group 9: the place of supply names the GSTIN State)', () => {
    it('names a GST State code in either form, and nothing else', () => {
      expect(gstStateName('29')).toBe('Karnataka');
      expect(gstStateName('07')).toBe('Delhi');
      expect(gstStateName('7')).toBe('Delhi');
      expect(gstStateName('38')).toBe('Ladakh');
      expect(gstStateName('45')).toBeNull();
      expect(gstStateName(null)).toBeNull();
    });
  });
});
