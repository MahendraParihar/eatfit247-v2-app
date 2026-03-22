import { SetMetadata } from '@nestjs/common';
import { AdminActionEnum, AdminSubjectEnum, IAbilityCheck, REQUIRE_ABILITY } from '@eatfit247-shared-lib';

export const RequireAbility = (action: AdminActionEnum, subject: AdminSubjectEnum) =>
  SetMetadata(REQUIRE_ABILITY, { action, subject } as IAbilityCheck);
