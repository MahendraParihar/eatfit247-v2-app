import { EventEmitter2 } from '@nestjs/event-emitter';
import { Sequelize } from 'sequelize-typescript';
import { IDropdownItem } from '@eatfit247-shared-lib';
import { RecipeCategoryService, RecipeService } from '@server_1/modules/recipe';
import { DietTemplateService, TxnDietTemplateDietDetail } from '@server_1/modules/diet';
import { DietPlanPdfService } from '@server_1/platform';
import { FranchiseService } from '@server_1/modules/franchise';
import { TxnMember, TxnMemberDietDetail, TxnMemberDietPlan } from '../models';
import { MemberDietPlanService } from './member-diet-plan.service';

const recipe = (id: number, label: string, isActive = true): IDropdownItem => ({ id, label, isActive });

describe('MemberDietPlanService', () => {
  const memberDietPlanRepository = { findAndCountAll: jest.fn() };
  const memberDietPlanDetailRepository = { findAll: jest.fn() };
  const recipeCategoryService = { getRecipeCategoryList: jest.fn() };
  const recipeService = { findAll: jest.fn(), findDropdownByIds: jest.fn() };
  const dietTemplateService = { findAll: jest.fn() };

  const service = new MemberDietPlanService(
    memberDietPlanRepository as unknown as typeof TxnMemberDietPlan,
    memberDietPlanDetailRepository as unknown as typeof TxnMemberDietDetail,
    {} as typeof TxnDietTemplateDietDetail,
    {} as typeof TxnMember,
    recipeCategoryService as unknown as RecipeCategoryService,
    recipeService as unknown as RecipeService,
    dietTemplateService as unknown as DietTemplateService,
    {} as DietPlanPdfService,
    {} as FranchiseService,
    {} as Sequelize,
    {} as EventEmitter2,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    memberDietPlanRepository.findAndCountAll.mockResolvedValue({
      rows: [
        {
          memberDietPlanId: 2001,
          memberId: 1001,
          noOfCycle: 3,
          daysInCycle: 7,
          isCompleted: true,
          createdByUser: { firstName: 'Nutri', lastName: 'One' },
          updatedByUser: { firstName: 'Nutri', lastName: 'One' },
        },
      ],
      count: 1,
    });
    recipeCategoryService.getRecipeCategoryList.mockResolvedValue([
      { id: 2, label: 'Break fast' },
      { id: 4, label: 'Lunch' },
    ]);
    dietTemplateService.findAll.mockResolvedValue({ tableData: [], count: 0 });
  });

  describe('getList', () => {
    const detailRow = (cycleNo: number, dietPlan: unknown) => ({
      memberDietDetailId: cycleNo,
      memberDietPlanId: 2001,
      cycleNo,
      dayNo: null,
      type: 'CYCLE',
      startDate: '2026-09-11',
      endDate: '2026-09-17',
      dietPlan,
    });

    it('resolves every saved recipe, including ones outside the old top-200 dropdown', async () => {
      memberDietPlanDetailRepository.findAll.mockResolvedValue([
        detailRow(1, [
          { recipeCategoryId: 2, dietDetail: 'Poha', recipeIds: [1228, 81, 83] },
          { recipeCategoryId: 4, dietDetail: 'Rice', recipeIds: [1206, 'bad', 81] },
        ]),
        detailRow(2, [{ recipeCategoryId: 2, dietDetail: '', recipeIds: [124] }]),
      ]);
      recipeService.findDropdownByIds.mockResolvedValue([
        recipe(81, 'Vegetable Poha'),
        recipe(83, 'Oats Chilla'),
        recipe(124, 'Besan Chilla'),
        recipe(1206, 'Khatte Moong', false),
        recipe(1228, 'Moong Sprouts'),
      ]);

      const result = await service.getList(1001);

      expect(recipeService.findAll).not.toHaveBeenCalled();
      expect(recipeService.findDropdownByIds).toHaveBeenCalledTimes(1);
      // Unique, numeric IDs only
      expect([...recipeService.findDropdownByIds.mock.calls[0][0]].sort((a, b) => a - b)).toEqual([
        81, 83, 124, 1206, 1228,
      ]);

      const [cycle1, cycle2] = result.list[0].cyclePlans;
      const labels = (cycle: typeof cycle1, categoryId: number) =>
        cycle.dietPlans[0].dietPlan
          .find((m) => m.recipeCategoryId === categoryId)
          .recipeList.map((r) => r.label);

      // Saved order is kept; inactive recipes still show on the historical plan
      expect(labels(cycle1, 2)).toEqual(['Moong Sprouts', 'Vegetable Poha', 'Oats Chilla']);
      expect(labels(cycle1, 4)).toEqual(['Khatte Moong', 'Vegetable Poha']);
      expect(labels(cycle2, 2)).toEqual(['Besan Chilla']);
      expect(labels(cycle2, 4)).toEqual([]);
    });

    it('passes an empty ID list when no meal has recipes', async () => {
      memberDietPlanDetailRepository.findAll.mockResolvedValue([
        detailRow(1, [{ recipeCategoryId: 2, dietDetail: 'Poha', recipeIds: [] }]),
      ]);
      recipeService.findDropdownByIds.mockResolvedValue([]);

      const result = await service.getList(1001);

      expect(recipeService.findDropdownByIds).toHaveBeenCalledWith([]);
      expect(result.list[0].cyclePlans[0].dietPlans[0].dietPlan[0].recipeList).toEqual([]);
    });
  });
});
