import { ForbiddenException } from '@nestjs/common';
import { IAuthUser } from '@eatfit247-shared-lib';

/**
 * Franchise scope of the tax setup (configurable tax treatment, decision 14 as amended by group 3b): a super
 * admin (a role with grant_all_on_new_subject) reaches every franchise whatever their mapping; every other
 * admin reaches only their mapped franchises, and an unmapped admin none.
 */
export class TaxFranchiseScope {
  /** The franchise ids an admin may see, or null for all of them. */
  static franchiseIds(user: IAuthUser): number[] | null {
    return user.allFranchises ? null : (user.franchiseIds ?? []);
  }

  static assertAccess(franchiseId: number, user: IAuthUser): void {
    if (!user.allFranchises && !(user.franchiseIds ?? []).includes(Number(franchiseId))) {
      throw new ForbiddenException('You do not have access to this franchise.');
    }
  }
}
