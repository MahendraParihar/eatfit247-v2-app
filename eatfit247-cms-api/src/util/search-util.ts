import { IBasicSearch } from '@eatfit247-common/lib';
import { Op } from 'sequelize';

export class SearchUtil {
  public static filterDateRange(fromDate: Date | null, toDate: Date | null) {
    let filterCondition = null;
    if (fromDate && toDate) {
      filterCondition = { [Op.gte]: fromDate, [Op.lte]: toDate };
    } else if (fromDate) {
      filterCondition = { [Op.gte]: fromDate };
    } else if (toDate) {
      filterCondition = { [Op.lte]: toDate };
    }
    return filterCondition;
  }

  public static filterBasicSearch(
    searchDto: IBasicSearch,
    nameField: string,
    activeField: string = 'active',
    createdAtField: string = 'createdAt',
  ) {
    const whereCondition: any = {};
    if (searchDto.name) {
      whereCondition[nameField] = { [Op.iLike]: `%${searchDto.name}%` };
    }
    if (searchDto.active) {
      whereCondition[activeField] = searchDto.active;
    }
    const dateFilter = SearchUtil.filterDateRange(searchDto.createdFrom, searchDto.createdTo);
    if (dateFilter) {
      whereCondition[createdAtField] = dateFilter;
    }
    return whereCondition;
  }
}
