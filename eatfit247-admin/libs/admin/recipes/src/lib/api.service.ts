import { Injectable } from '@angular/core';
import { CrudApiService } from '@core';
import { IDropdownItem, IRecipe } from '@eatfit247-shared-lib';

@Injectable({
  providedIn: 'root',
})
export class RecipesApiService extends CrudApiService<IRecipe> {
  constructor() {
    super('/recipe');
  }

  async getMasterData(): Promise<{ recipeType: IDropdownItem[]; recipeCategory: IDropdownItem[]; recipeCuisine: IDropdownItem[] }> {
    const res = await this.httpService.get<{ recipeType: IDropdownItem[]; recipeCategory: IDropdownItem[]; recipeCuisine: IDropdownItem[] }>(
      `${this.endpoint}/recipe-master`
    );
    return res.data as { recipeType: IDropdownItem[]; recipeCategory: IDropdownItem[]; recipeCuisine: IDropdownItem[] };
  }

  async downloadRecipePdf(recipeId: number): Promise<{ buffer: string; fileName: string }> {
    const res = await this.httpService.get<{ buffer: string; fileName: string }>(
      `${this.endpoint}/download-pdf/${recipeId}`
    );
    return res.data as { buffer: string; fileName: string };
  }

  async searchDropdown(params?: any): Promise<Array<{ id: number; title: string; subtitle: string }>> {
    const res = await this.httpService.get<Array<{ id: number; title: string; subtitle: string }>>(
      `${this.endpoint}/dropdown`,
      { params }
    );
    return res.data as Array<{ id: number; title: string; subtitle: string }>;
  }
}
