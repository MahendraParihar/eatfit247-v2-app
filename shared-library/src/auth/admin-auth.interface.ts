import { AdminActionEnum } from '../enum/admin-action.enum';
import { AdminSubjectEnum } from '../enum/admin-subject.enum';

/** Metadata for `@RequireAbility()` — checked by AbilitiesGuard against CASL rules. */
export interface IAbilityCheck {
  action: AdminActionEnum;
  subject: AdminSubjectEnum;
}
