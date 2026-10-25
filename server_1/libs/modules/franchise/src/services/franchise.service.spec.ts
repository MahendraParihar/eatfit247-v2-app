import { IManageFranchise } from '@eatfit247-shared-lib';
import { AppConfigService, MstFranchise } from '@server_1/core';
import { AddressService, CountryService } from '@server_1/platform';
import { TaxRegistrationService } from '@server_1/modules/tax-engine';
import { FranchiseService } from './franchise.service';

describe('FranchiseService invoice numbering fields (compliant invoice numbering 3.4)', () => {
  let franchiseRepository: { findOne: jest.Mock; create: jest.Mock; update: jest.Mock; sequelize: { query: jest.Mock } };
  let addressService: { findByTableIdAndPk: jest.Mock; createOrUpdate: jest.Mock };
  let countryService: { fetchById: jest.Mock; findAll: jest.Mock };
  let taxRegistrationService: { assertFranchiseFormNumbers: jest.Mock; syncFromFranchiseForm: jest.Mock; gstRegisteredFranchiseIds: jest.Mock };
  let service: FranchiseService;

  const stored = (overrides: Partial<MstFranchise> = {}): MstFranchise =>
    ({ franchiseId: 1, franchiseCode: 'EFMUM', invoicePrefix: 'EFM', invoiceNumberFormat: '{PREFIX}/{FY}/{TYPE}/{SEQ5}', ...overrides }) as MstFranchise;

  const payload = (overrides: Partial<IManageFranchise> = {}): IManageFranchise =>
    ({ franchiseCode: 'EFMUM', financialYear: 4, companyName: 'EAT FIT 247', active: true, ...overrides }) as IManageFranchise;

  beforeEach(() => {
    franchiseRepository = {
      // First call: the franchise being updated; second call: the prefix clash lookup
      findOne: jest.fn(),
      create: jest.fn().mockResolvedValue({ franchiseId: 9 }),
      update: jest.fn().mockResolvedValue([1]),
      // Prefix history: no other franchise has issued numbers with the prefix
      sequelize: { query: jest.fn().mockResolvedValue([]) },
    };
    addressService = {
      findByTableIdAndPk: jest.fn().mockResolvedValue({ countryId: 101 }),
      createOrUpdate: jest.fn(),
    };
    countryService = {
      fetchById: jest.fn().mockImplementation(async (id: number) => ({ countryCode: id === 101 ? 'IN' : 'AE' })),
      findAll: jest.fn().mockResolvedValue({ tableData: [{ countryCode: 'IN', currencyCode: 'INR' }, { countryCode: 'AE', currencyCode: 'AED' }], count: 2 }),
    };
    taxRegistrationService = {
      assertFranchiseFormNumbers: jest.fn().mockResolvedValue(undefined),
      syncFromFranchiseForm: jest.fn(),
      gstRegisteredFranchiseIds: jest.fn().mockResolvedValue(new Set([1])),
    };
    service = new FranchiseService(
      franchiseRepository as unknown as typeof MstFranchise,
      {} as AppConfigService,
      addressService as unknown as AddressService,
      countryService as unknown as CountryService,
      taxRegistrationService as unknown as TaxRegistrationService,
    );
  });

  it('saves a valid prefix and template, upper-casing the prefix', async () => {
    franchiseRepository.findOne.mockResolvedValueOnce(stored()).mockResolvedValueOnce(null);
    await service.update(1, payload({ invoicePrefix: ' efm ', invoiceNumberFormat: '{PREFIX}-{FY}-{TYPE}-{SEQ5}' }), '::1', 1);
    expect(franchiseRepository.update.mock.calls[0][0]).toMatchObject({
      invoicePrefix: 'EFM',
      invoiceNumberFormat: '{PREFIX}-{FY}-{TYPE}-{SEQ5}',
    });
  });

  it('rejects a template too long for an Indian franchise with the listed errors, and saves nothing', async () => {
    franchiseRepository.findOne.mockResolvedValueOnce(stored()).mockResolvedValueOnce(null);
    await expect(
      service.update(1, payload({ invoicePrefix: 'EFMUM', invoiceNumberFormat: '{PREFIX}/{FY}/{TYPE}/{SEQ6}' }), '::1', 1),
    ).rejects.toThrow('The longest number, EFMUM/2627/S/999999, has 19 characters; Indian GST invoices allow at most 16 (Rule 46).');
    expect(franchiseRepository.update).not.toHaveBeenCalled();
  });

  it('the same template is allowed for a non-Indian franchise (country from the payload address)', async () => {
    franchiseRepository.findOne.mockResolvedValueOnce(stored()).mockResolvedValueOnce(null);
    await service.update(
      1,
      payload({
        invoicePrefix: 'HCUAE',
        invoiceNumberFormat: '{PREFIX}/{FY}/{TYPE}/{SEQ6}',
        addressObj: { countryId: 202 } as IManageFranchise['addressObj'],
      }),
      '::1',
      1,
    );
    expect(franchiseRepository.update.mock.calls[0][0]).toMatchObject({ invoicePrefix: 'HCUAE' });
  });

  it('rejects a prefix already used by another franchise as prefix or code', async () => {
    franchiseRepository.findOne.mockResolvedValueOnce(stored()).mockResolvedValueOnce({ franchiseId: 3, franchiseCode: 'MEMUM' });
    await expect(service.update(1, payload({ invoicePrefix: 'MEM' }), '::1', 1)).rejects.toThrow(
      'Prefix MEM is already used by franchise MEMUM; invoice numbers must be unique across franchises.',
    );
    expect(franchiseRepository.findOne.mock.calls[1][0].where.franchiseId).toBeDefined();
  });

  it('a payload without the numbering keys keeps the stored format (an older admin form)', async () => {
    franchiseRepository.findOne.mockResolvedValueOnce(stored()).mockResolvedValueOnce(null);
    await service.update(1, payload(), '::1', 1);
    const saved = franchiseRepository.update.mock.calls[0][0];
    expect(saved).not.toHaveProperty('invoicePrefix');
    expect(saved).not.toHaveProperty('invoiceNumberFormat');
    expect(saved).not.toHaveProperty('registrationThresholdAmount');
  });

  it('group 7: an Indian franchise cannot clear its format; a non-Indian one returns to the legacy format', async () => {
    franchiseRepository.findOne.mockResolvedValueOnce(stored());
    await expect(service.update(1, payload({ invoicePrefix: '', invoiceNumberFormat: null }), '::1', 1)).rejects.toThrow(
      'An Indian franchise needs an invoice prefix and number format',
    );
    expect(franchiseRepository.update).not.toHaveBeenCalled();

    franchiseRepository.findOne.mockResolvedValueOnce(stored({ franchiseId: 2, franchiseCode: 'HCUAE' }));
    addressService.findByTableIdAndPk.mockResolvedValueOnce({ countryId: 202 });
    await service.update(2, payload({ invoicePrefix: '', invoiceNumberFormat: null }), '::1', 1);
    expect(franchiseRepository.update.mock.calls[0][0]).toMatchObject({ invoicePrefix: null, invoiceNumberFormat: null });
  });

  it('group 7: refuses a prefix that starts numbers another franchise has issued', async () => {
    franchiseRepository.findOne.mockResolvedValueOnce(stored()).mockResolvedValueOnce(null);
    franchiseRepository.sequelize.query.mockResolvedValueOnce([{ found: 1 }]);
    await expect(service.update(1, payload({ invoicePrefix: 'EFX' }), '::1', 1)).rejects.toThrow(
      'Prefix EFX starts invoice numbers already issued by another franchise',
    );
    expect(franchiseRepository.sequelize.query.mock.calls[0][1].replacements).toEqual({ slash: 'EFX/%', dash: 'EFX-%', franchiseId: 1 });
  });

  it('group 7: with no known country the 16-character limit still applies', async () => {
    franchiseRepository.findOne.mockResolvedValueOnce(null);
    addressService.findByTableIdAndPk.mockResolvedValue(null);
    await expect(
      service.create(payload({ invoicePrefix: 'NEWFR', invoiceNumberFormat: '{PREFIX}/{FY}/{TYPE}/{SEQ6}' }), '::1', 1),
    ).rejects.toThrow('Indian GST invoices allow at most 16');
  });

  it('a template without a prefix is refused', async () => {
    franchiseRepository.findOne.mockResolvedValueOnce(stored({ invoicePrefix: null as unknown as string }));
    await expect(service.update(1, payload({ invoiceNumberFormat: '{PREFIX}/{FY}/{TYPE}/{SEQ5}' }), '::1', 1)).rejects.toThrow(
      'Prefix must be 1 to 5 capital letters or digits.',
    );
  });

  it('saves the registration threshold, and validates the format on create', async () => {
    franchiseRepository.findOne.mockResolvedValueOnce(null);
    await service.create(
      payload({
        invoicePrefix: 'NEW',
        invoiceNumberFormat: '{PREFIX}/{FY}/{TYPE}/{SEQ5}',
        registrationThresholdAmount: 4000000,
        addressObj: { countryId: 101 } as IManageFranchise['addressObj'],
      }),
      '::1',
      1,
    );
    expect(franchiseRepository.create.mock.calls[0][0]).toMatchObject({
      invoicePrefix: 'NEW',
      invoiceNumberFormat: '{PREFIX}/{FY}/{TYPE}/{SEQ5}',
      registrationThresholdAmount: 4000000,
    });
    await expect(service.create(payload({ invoicePrefix: 'NEW', invoiceNumberFormat: '{PREFIX} {TYPE}{SEQ5}' }), '::1', 1)).rejects.toThrow(
      'Only / and - may separate the tokens (found space).',
    );
  });

  describe('configurable tax treatment 4.1 / 4.3: registrations and working currency', () => {
    it('checks the GSTIN before writing, then syncs the home registration after the address', async () => {
      franchiseRepository.findOne.mockResolvedValueOnce(stored({ gstNumber: '27CSEPS5397E1Z8' })).mockResolvedValue(null);
      await service.update(1, payload({ gstNumber: '27AAPFU0939F1ZV' }), '::1', 1);
      expect(taxRegistrationService.assertFranchiseFormNumbers).toHaveBeenCalledWith(1, 'IN', expect.objectContaining({ gstNumber: '27AAPFU0939F1ZV' }), expect.objectContaining({ gstNumber: '27CSEPS5397E1Z8' }));
      // The sync compares with the column as stored before this save (group 4b)
      expect(taxRegistrationService.syncFromFranchiseForm).toHaveBeenCalledWith(1, expect.objectContaining({ gstNumber: '27AAPFU0939F1ZV' }), { gstNumber: '27CSEPS5397E1Z8', vatNumber: undefined }, 1, '::1');
      expect(taxRegistrationService.assertFranchiseFormNumbers.mock.invocationCallOrder[0]).toBeLessThan(franchiseRepository.update.mock.invocationCallOrder[0]);
    });

    it('an invalid GSTIN is refused before anything is written', async () => {
      franchiseRepository.findOne.mockResolvedValueOnce(stored()).mockResolvedValue(null);
      taxRegistrationService.assertFranchiseFormNumbers.mockRejectedValue(new Error('A GSTIN has 15 characters'));
      await expect(service.update(1, payload({ gstNumber: '456789' }), '::1', 1)).rejects.toThrow('15 characters');
      expect(franchiseRepository.update).not.toHaveBeenCalled();
      expect(taxRegistrationService.syncFromFranchiseForm).not.toHaveBeenCalled();
    });

    it('currency: saved upper-cased when sent, kept when not sent', async () => {
      franchiseRepository.findOne.mockResolvedValue(null).mockResolvedValueOnce(stored());
      await service.update(1, payload({ currencyCode: 'aed' }), '::1', 1);
      expect(franchiseRepository.update.mock.calls[0][0]).toMatchObject({ currencyCode: 'AED' });
      franchiseRepository.findOne.mockResolvedValueOnce(stored());
      await service.update(1, payload(), '::1', 1);
      expect(franchiseRepository.update.mock.calls[1][0]).not.toHaveProperty('currencyCode');
    });

    it('an omitted GSTIN / VAT field leaves the columns alone; an empty currency falls back to the country', async () => {
      franchiseRepository.findOne.mockResolvedValueOnce(stored({ gstNumber: '27CSEPS5397E1Z8' })).mockResolvedValue(null);
      await service.update(1, payload({ currencyCode: null }), '::1', 1);
      const written = franchiseRepository.update.mock.calls[0][0];
      expect(written).not.toHaveProperty('gstNumber');
      expect(written).not.toHaveProperty('vatNumber');
      expect(written).toMatchObject({ currencyCode: 'INR' });
    });

    it('a new franchise without a currency takes its address country\'s', async () => {
      franchiseRepository.findOne.mockResolvedValue(null);
      await service.create(payload({ franchiseCode: 'NEWIN', invoicePrefix: 'NIN', invoiceNumberFormat: '{PREFIX}/{FY}/{TYPE}/{SEQ5}' }), '::1', 1);
      expect(franchiseRepository.update).toHaveBeenCalledWith({ currencyCode: 'INR' }, { where: { franchiseId: 9 } });
      expect(taxRegistrationService.syncFromFranchiseForm).toHaveBeenCalledWith(9, expect.anything(), {}, 1, '::1');
    });

    it('details carry the registration-based GST flag and the currency', async () => {
      franchiseRepository.findOne.mockResolvedValue({ franchiseId: 1, currencyCode: 'INR', timeZone: 'Asia/Kolkata' });
      (franchiseRepository as unknown as { scope: jest.Mock }).scope = jest.fn().mockReturnValue({ findOne: franchiseRepository.findOne });
      await expect(service.fetchById(1)).resolves.toMatchObject({ gstRegistered: true, currencyCode: 'INR' });
    });
  });
});
