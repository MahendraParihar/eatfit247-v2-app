import { Injectable } from '@angular/core';
import { ApiBaseService, HttpService } from '@core';
import { ITableList, IRecipe, IDropdownItem, IResponse } from '@eatfit247-shared-lib';

@Injectable({
  providedIn: 'root',
})
export class RecipesApiService extends ApiBaseService {
  private readonly endpoint = '/recipe';

  constructor(httpService: HttpService) {
    super(httpService);
  }

  async getList(params?: any): Promise<ITableList<IRecipe>> {
    const res = await this.httpService.get<IResponse<ITableList<IRecipe>>>(`${this.endpoint}/list`, { params });
    return res.data as ITableList<IRecipe>;
  }

  async getById(id: number): Promise<IRecipe> {
    const res = await this.httpService.get<IResponse<IRecipe>>(`${this.endpoint}/manage/${id}`);
    return res.data as IRecipe;
  }

  async create(data: any): Promise<void> {
    return await this.httpService.post<void>(`${this.endpoint}/manage`, data);
  }

  async update(id: number, data: any): Promise<void> {
    return await this.httpService.put<void>(`${this.endpoint}/manage/${id}`, data);
  }

  async updateStatus(id: number, active: boolean): Promise<void> {
    return await this.httpService.patch<void>(`${this.endpoint}/update-status/${id}`, { active });
  }

  async getMasterData(): Promise<{ recipeType: IDropdownItem[]; recipeCategory: IDropdownItem[]; recipeCuisine: IDropdownItem[] }> {
    const res = await this.httpService.get<IResponse<{ recipeType: IDropdownItem[]; recipeCategory: IDropdownItem[]; recipeCuisine: IDropdownItem[] }>>(
      `${this.endpoint}/recipe-master`
    );
    return res.data as { recipeType: IDropdownItem[]; recipeCategory: IDropdownItem[]; recipeCuisine: IDropdownItem[] };
  }
}
