import { Sequelize } from 'sequelize-typescript';
import { IFranchiseTurnover, TurnoverAlertLevel } from '@eatfit247-shared-lib';
import { MstFranchise } from '@server_1/core';
import { EmailNotificationService, MstEmailTemplate } from '@server_1/platform';
import { FranchiseTurnoverCron } from './franchise-turnover.cron';
import { FranchiseTurnoverService } from './franchise-turnover.service';

describe('FranchiseTurnoverCron (turnover warning, decision 12)', () => {
  let franchises: Array<MstFranchise & { update: jest.Mock }>;
  let turnover: IFranchiseTurnover;
  let sendEmailFromTemplate: jest.Mock;
  let cron: FranchiseTurnoverCron;

  const franchise = (overrides: Partial<MstFranchise> = {}) => {
    const row = {
      franchiseId: 3,
      franchiseCode: 'MEMUM',
      companyName: 'Mahi Enterprise',
      gstNumber: null,
      registrationThresholdAmount: 4000000,
      turnoverAlertFy: null,
      turnoverAlertLevel: null,
      ...overrides,
    } as unknown as MstFranchise & { update: jest.Mock };
    row.update = jest.fn().mockImplementation(async (values: Partial<MstFranchise>) => Object.assign(row, values));
    return row;
  };

  const at = (level: TurnoverAlertLevel, financialYear = '2026-27'): void => {
    const percent = level === TurnoverAlertLevel.RED ? 100 : level === TurnoverAlertLevel.AMBER ? 80 : 10;
    turnover = { financialYear, turnover: percent * 40000, threshold: 4000000, percent, level };
  };

  beforeEach(() => {
    franchises = [franchise()];
    at(TurnoverAlertLevel.NONE);
    sendEmailFromTemplate = jest.fn().mockResolvedValue(true);
    cron = new FranchiseTurnoverCron(
      { findAll: jest.fn().mockImplementation(async () => franchises) } as unknown as typeof MstFranchise,
      { forFranchise: jest.fn().mockImplementation(async () => turnover) } as unknown as FranchiseTurnoverService,
      {
        getNotificationTemplate: jest.fn().mockResolvedValue({ subject: 'GST registration threshold: {{franchiseName}} at {{percent}}%' } as MstEmailTemplate),
        sendEmailFromTemplate,
      } as unknown as EmailNotificationService,
      { query: jest.fn().mockResolvedValue([{ email_id: 'owner@eatfit247.test' }]) } as unknown as Sequelize,
    );
  });

  it('emails super admins when the franchise first reaches amber, and stores the level', async () => {
    at(TurnoverAlertLevel.AMBER);
    expect(await cron.run()).toBe(1);
    expect(sendEmailFromTemplate).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        to: ['owner@eatfit247.test'],
        subject: 'GST registration threshold: Mahi Enterprise at 80%',
        data: expect.objectContaining({ franchiseCode: 'MEMUM', financialYear: '2026-27', percent: '80', level: 'AMBER', threshold: '₹40,00,000.00' }),
      }),
    );
    expect(franchises[0]).toMatchObject({ turnoverAlertFy: '2026-27', turnoverAlertLevel: TurnoverAlertLevel.AMBER });
  });

  it('emails once per level: amber again sends nothing, crossing to red sends exactly one', async () => {
    franchises = [franchise({ turnoverAlertFy: '2026-27', turnoverAlertLevel: TurnoverAlertLevel.AMBER })];
    at(TurnoverAlertLevel.AMBER);
    expect(await cron.run()).toBe(0);
    expect(sendEmailFromTemplate).not.toHaveBeenCalled();
    expect(franchises[0].update).not.toHaveBeenCalled();

    at(TurnoverAlertLevel.RED);
    expect(await cron.run()).toBe(1);
    expect(await cron.run()).toBe(0);
    expect(sendEmailFromTemplate).toHaveBeenCalledTimes(1);
    expect(sendEmailFromTemplate.mock.calls[0][1].data.level).toBe('RED');
    expect(franchises[0].turnoverAlertLevel).toBe(TurnoverAlertLevel.RED);
  });

  it('a new FY restarts the level: amber in the new FY emails again after last year\'s red', async () => {
    franchises = [franchise({ turnoverAlertFy: '2025-26', turnoverAlertLevel: TurnoverAlertLevel.RED })];
    at(TurnoverAlertLevel.AMBER, '2026-27');
    expect(await cron.run()).toBe(1);
    expect(franchises[0]).toMatchObject({ turnoverAlertFy: '2026-27', turnoverAlertLevel: TurnoverAlertLevel.AMBER });
  });

  it('a new FY below amber stores the reset without an email', async () => {
    franchises = [franchise({ turnoverAlertFy: '2025-26', turnoverAlertLevel: TurnoverAlertLevel.RED })];
    at(TurnoverAlertLevel.NONE, '2026-27');
    expect(await cron.run()).toBe(0);
    expect(sendEmailFromTemplate).not.toHaveBeenCalled();
    expect(franchises[0]).toMatchObject({ turnoverAlertFy: '2026-27', turnoverAlertLevel: TurnoverAlertLevel.NONE });
  });

  it('skips a franchise with a GSTIN', async () => {
    franchises = [franchise({ gstNumber: '27AAAAA0000A1Z5' })];
    at(TurnoverAlertLevel.RED);
    expect(await cron.run()).toBe(0);
    expect(sendEmailFromTemplate).not.toHaveBeenCalled();
  });

  it('a failed email is not recorded, so the next run tries again', async () => {
    at(TurnoverAlertLevel.AMBER);
    sendEmailFromTemplate.mockResolvedValueOnce(false);
    expect(await cron.run()).toBe(0);
    expect(franchises[0].update).not.toHaveBeenCalled();
    expect(await cron.run()).toBe(1);
    expect(franchises[0].turnoverAlertLevel).toBe(TurnoverAlertLevel.AMBER);
  });
});
