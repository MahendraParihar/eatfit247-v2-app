import { IAuthUser, IManageFranchise } from '@eatfit247-shared-lib';
import { FranchiseService, FranchiseTurnoverService } from '../../services';
import { CreateFranchiseDto } from '../../dto';
import { FranchiseController } from './franchise.controller';

describe('FranchiseController franchise scope (compliant invoice numbering 5b)', () => {
  let service: { fetchById: jest.Mock; update: jest.Mock; changeStatus: jest.Mock; invoiceCounters: jest.Mock };
  let turnover: { forFranchiseId: jest.Mock };
  let controller: FranchiseController;
  const scopedToEfmum = { adminId: 21, franchiseIds: [1] } as unknown as IAuthUser;
  const superAdmin = { adminId: 19, franchiseIds: [] } as unknown as IAuthUser;
  const body = { invoicePrefix: 'MEM' } as IManageFranchise as CreateFranchiseDto;

  beforeEach(() => {
    service = {
      fetchById: jest.fn().mockResolvedValue({ franchiseId: 3 }),
      update: jest.fn(),
      changeStatus: jest.fn(),
      invoiceCounters: jest.fn(),
    };
    turnover = { forFranchiseId: jest.fn() };
    controller = new FranchiseController(service as unknown as FranchiseService, turnover as unknown as FranchiseTurnoverService);
  });

  it("refuses another franchise's details, update, status, turnover and counters before the service runs", async () => {
    await expect(controller.getById(3, scopedToEfmum)).rejects.toThrow('You do not have access to this franchise.');
    await expect(controller.update(3, body, scopedToEfmum, '::1')).rejects.toThrow('You do not have access to this franchise.');
    await expect(controller.changeStatus(3, { active: false }, scopedToEfmum, '::1')).rejects.toThrow(
      'You do not have access to this franchise.',
    );
    await expect(controller.turnover(3, scopedToEfmum)).rejects.toThrow('You do not have access to this franchise.');
    await expect(controller.invoiceCounters(3, scopedToEfmum)).rejects.toThrow('You do not have access to this franchise.');
    expect(service.fetchById).not.toHaveBeenCalled();
    expect(service.update).not.toHaveBeenCalled();
    expect(service.changeStatus).not.toHaveBeenCalled();
    expect(turnover.forFranchiseId).not.toHaveBeenCalled();
    expect(service.invoiceCounters).not.toHaveBeenCalled();
  });

  it('allows the franchise in scope, and every franchise for an unscoped admin', async () => {
    await controller.update(1, body, scopedToEfmum, '::1');
    await controller.update(3, body, superAdmin, '::1');
    await controller.getById(3, superAdmin);
    expect(service.update).toHaveBeenCalledTimes(2);
    expect(service.update.mock.calls[0][0]).toBe(1);
    expect(service.fetchById).toHaveBeenCalledWith(3);
  });
});
