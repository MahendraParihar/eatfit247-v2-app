import { Order } from 'sequelize';
import { IBasicSearch } from '@eatfit247-shared-lib';

/**
 * Maps admin table sort query params ({@link IBasicSearch}) to Sequelize `order` options.
 * Only fields present in the allowlist are applied; unknown fields fall back to `defaultOrder`.
 */
export class TableListSortUtil {
  static resolveDirection(searchDto: IBasicSearch): 'ASC' | 'DESC' {
    const raw = (searchDto.sortDirection ?? searchDto.sortOrder ?? 'asc').toString().toLowerCase().trim();
    return raw === 'desc' ? 'DESC' : 'ASC';
  }

  static resolveField(searchDto: IBasicSearch): string | undefined {
    const raw = (searchDto.sortField ?? searchDto.sortBy)?.trim();
    return raw || undefined;
  }

  static orderFromAllowlist(searchDto: IBasicSearch, allowed: ReadonlySet<string>, defaultOrder: Order): Order {
    const field = TableListSortUtil.resolveField(searchDto);
    if (!field || !allowed.has(field)) {
      return defaultOrder;
    }
    return [[field, TableListSortUtil.resolveDirection(searchDto)]];
  }
}
