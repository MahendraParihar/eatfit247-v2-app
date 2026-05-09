import { Injectable } from '@angular/core';
import { CrudApiService } from '@core';
import { IBlog, IDropdownItem } from '@eatfit247-shared-lib';

@Injectable({
  providedIn: 'root',
})
export class BlogsApiService extends CrudApiService<IBlog> {
  constructor() {
    super('/blog');
  }

  async getMasterData(): Promise<{ blogCategory: IDropdownItem[]; blogAuthor: IDropdownItem[] }> {
    const res = await this.httpService.get<{ blogCategory: IDropdownItem[]; blogAuthor: IDropdownItem[] }>(`${this.endpoint}/blog-master`);
    return res.data as { blogCategory: IDropdownItem[]; blogAuthor: IDropdownItem[] };
  }
}
