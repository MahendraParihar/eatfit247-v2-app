import { IDietPlanDetail, IMemberDietDetail } from '@eatfit247-shared-lib';
import { DietPlanPdfService } from './diet-plan-pdf.service';

type TemplateRenderer = {
  getTemplateHtml(templateName: string, data: Record<string, unknown>): Promise<string>;
};

const meal = (
  recipeCategory: string,
  dietDetail: string | null,
  recipeList: { id: number; label: string }[],
): IDietPlanDetail =>
  ({
    recipeCategoryId: recipeCategory.length,
    recipeCategory,
    dietDetail,
    recipeIds: recipeList.map((r) => r.id),
    recipeList,
  }) as unknown as IDietPlanDetail;

/** Collapses the rendered Details cell of the meal row to plain text. */
const rowText = (html: string, recipeCategory: string): string | null => {
  const match = html.match(new RegExp(`<td>${recipeCategory}</td>\\s*<td>([\\s\\S]*?)</td>`));
  return match ? match[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : null;
};

describe('DietPlanPdfService diet-plan template', () => {
  const service = new DietPlanPdfService() as unknown as TemplateRenderer;

  const render = (dietPlan: IDietPlanDetail[]) =>
    service.getTemplateHtml('diet-plan', {
      memberName: 'Test Member',
      cycleNo: 1,
      diet: { dietPlan } as IMemberDietDetail,
      recipes: [],
    });

  it('lists recipe names under a meal that has only recipes', async () => {
    const html = await render([meal('Mid Morning', '', [{ id: 578, label: 'Mint and Spinach Soup' }])]);
    expect(rowText(html, 'Mid Morning')).toBe('Recipe: Mint and Spinach Soup');
  });

  it('lists recipe names after the detail text of a meal', async () => {
    const html = await render([
      meal('Lunch', '<p>100 ml bowl cooked rice</p>', [
        { id: 1, label: 'Fish curry' },
        { id: 2, label: 'Khatte Moong' },
      ]),
    ]);
    expect(rowText(html, 'Lunch')).toBe('100 ml bowl cooked rice Recipes: Fish curry, Khatte Moong');
  });

  it('keeps the detail text alone when a meal has no recipes', async () => {
    const html = await render([meal('On Rising', '1 tbsp coriander seeds', [])]);
    expect(rowText(html, 'On Rising')).toBe('1 tbsp coriander seeds');
  });

  it('skips a meal with neither detail nor recipes', async () => {
    const html = await render([meal('Evening', null, [])]);
    expect(rowText(html, 'Evening')).toBeNull();
  });
});
