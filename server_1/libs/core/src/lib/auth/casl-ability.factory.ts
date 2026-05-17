import { Injectable } from '@nestjs/common';
import { AbilityBuilder, createMongoAbility, MongoAbility } from '@casl/ability';
import { AdminActionEnum, AdminRoleEnum, AdminSubjectEnum, IAuthUser } from '@eatfit247-shared-lib';

export type AppAbility = MongoAbility<[AdminActionEnum, AdminSubjectEnum | 'all']>;

type RoleScope = Record<string, unknown>;

@Injectable()
export class CaslAbilityFactory {
  createForUser(user: Pick<IAuthUser, 'roleKeys' | 'franchiseIds' | 'permissions' | 'subjectMeta'>): AppAbility {
    const { can, build } = new AbilityBuilder<AppAbility>(createMongoAbility);

    // New DB-driven path: use permissions dictionary when available
    if (user.permissions && Object.keys(user.permissions).length > 0) {
      for (const [subjectCode, actions] of Object.entries(user.permissions)) {
        const isFranchiseScoped = user.subjectMeta?.[subjectCode]?.franchiseScoped ?? false;

        for (const actionCode of actions) {
          if (isFranchiseScoped && user.franchiseIds.length > 0) {
            // Type assertion needed: CASL's string-based subjects don't carry field types,
            // but conditions are evaluated correctly at runtime via MongoQuery
            (can as Function)(actionCode, subjectCode, {
              franchiseId: { $in: user.franchiseIds },
            });
          } else {
            can(actionCode as AdminActionEnum, subjectCode as AdminSubjectEnum);
          }
        }
      }

      return build();
    }

    // Backward-compat fallback: hardcoded role-based logic (pre-migration)
    if (user.roleKeys.includes(AdminRoleEnum.SuperAdmin)) {
      can(AdminActionEnum.Manage, AdminSubjectEnum.All);
      return build();
    }

    for (const roleKey of user.roleKeys) {
      switch (roleKey) {
        case AdminRoleEnum.FranchiseAdmin:
          this.applyFranchiseAdmin(can, user.franchiseIds);
          break;
        case AdminRoleEnum.Nutritionist:
          this.applyNutritionist(can, user.franchiseIds);
          break;
        case AdminRoleEnum.BlogAdmin:
          this.applyBlogAdmin(can);
          break;
        case AdminRoleEnum.SocialContentManager:
          this.applySocialContentManager(can);
          break;
        case AdminRoleEnum.ProductUser:
          this.applyProductUser(can);
          break;
        case AdminRoleEnum.AccountUser:
          this.applyAccountUser(can);
          break;
        default:
          break;
      }
    }

    return build();
  }

  // ---- Legacy role-specific methods (kept for backward compat during migration) ----

  private scope(franchiseIds: number[]): RoleScope {
    return franchiseIds.length ? { franchiseId: { $in: franchiseIds } } : {};
  }

  private applyFranchiseAdmin(
    can: AbilityBuilder<AppAbility>['can'],
    franchiseIds: number[],
  ): void {
    const scope = this.scope(franchiseIds);
    can(AdminActionEnum.Read, AdminSubjectEnum.Dashboard, scope);
    can([AdminActionEnum.Read, AdminActionEnum.Update], AdminSubjectEnum.Report, scope);
    const memberSubjects: AdminSubjectEnum[] = [
      AdminSubjectEnum.Member,
      AdminSubjectEnum.MemberAssessment,
      AdminSubjectEnum.MemberDietPlan,
      AdminSubjectEnum.MemberHealth,
      AdminSubjectEnum.MemberIssues,
      AdminSubjectEnum.MemberCallLogs,
      AdminSubjectEnum.MemberPayment,
      AdminSubjectEnum.MemberProducts,
      AdminSubjectEnum.MemberPocketGuide,
      AdminSubjectEnum.MemberAddress,
    ];
    memberSubjects.forEach((s) => can(AdminActionEnum.Manage, s, scope));
    can(
      [AdminActionEnum.Read, AdminActionEnum.Create, AdminActionEnum.Update],
      AdminSubjectEnum.Program,
      scope,
    );
    can(
      [AdminActionEnum.Read, AdminActionEnum.Create, AdminActionEnum.Update],
      AdminSubjectEnum.ProgramPlan,
      scope,
    );
    can(AdminActionEnum.Read, AdminSubjectEnum.DietTemplate);
    can(AdminActionEnum.Read, AdminSubjectEnum.Blog);
    can(AdminActionEnum.Read, AdminSubjectEnum.Faq);
    can(AdminActionEnum.Read, AdminSubjectEnum.Recipe);
    can(AdminActionEnum.Read, AdminSubjectEnum.Product);
    can(AdminActionEnum.Read, AdminSubjectEnum.ProductOrder, scope);
    can(
      [AdminActionEnum.Read, AdminActionEnum.Create, AdminActionEnum.Update],
      AdminSubjectEnum.Shipment,
      scope,
    );
    can(AdminActionEnum.Read, AdminSubjectEnum.CourierProvider);
    can(AdminActionEnum.Read, AdminSubjectEnum.CourierProviderWarehouse);
    can(
      [AdminActionEnum.Read, AdminActionEnum.Create, AdminActionEnum.Update],
      AdminSubjectEnum.PromoCode,
      scope,
    );
    can(
      [AdminActionEnum.Read, AdminActionEnum.Create, AdminActionEnum.Update],
      AdminSubjectEnum.Franchise,
      scope,
    );
    can(AdminActionEnum.Read, AdminSubjectEnum.TaxMaster);
    can(
      [AdminActionEnum.Read, AdminActionEnum.Create, AdminActionEnum.Update],
      AdminSubjectEnum.LovMaster,
    );
    can(AdminActionEnum.Manage, AdminSubjectEnum.Notification, scope);
    can(AdminActionEnum.Manage, AdminSubjectEnum.GoogleCalendar, scope);
    can(
      [AdminActionEnum.Read, AdminActionEnum.Create, AdminActionEnum.Update],
      AdminSubjectEnum.AdminUser,
      scope,
    );
  }

  private applyNutritionist(can: AbilityBuilder<AppAbility>['can'], franchiseIds: number[]): void {
    const scope = this.scope(franchiseIds);
    can(AdminActionEnum.Read, AdminSubjectEnum.Dashboard, scope);
    const memberSubjects: AdminSubjectEnum[] = [
      AdminSubjectEnum.Member,
      AdminSubjectEnum.MemberAssessment,
      AdminSubjectEnum.MemberDietPlan,
      AdminSubjectEnum.MemberHealth,
      AdminSubjectEnum.MemberIssues,
      AdminSubjectEnum.MemberCallLogs,
      AdminSubjectEnum.MemberPayment,
      AdminSubjectEnum.MemberProducts,
      AdminSubjectEnum.MemberPocketGuide,
      AdminSubjectEnum.MemberAddress,
    ];
    memberSubjects.forEach((s) => can(AdminActionEnum.Manage, s, scope));
    can(AdminActionEnum.Read, AdminSubjectEnum.DietTemplate);
    can(AdminActionEnum.Read, AdminSubjectEnum.Program);
    can(AdminActionEnum.Read, AdminSubjectEnum.ProgramPlan);
    can(AdminActionEnum.Manage, AdminSubjectEnum.Recipe);
    can(AdminActionEnum.Read, AdminSubjectEnum.PocketGuide);
    can(AdminActionEnum.Read, AdminSubjectEnum.TaxMaster);
    can(
      [AdminActionEnum.Read, AdminActionEnum.Create, AdminActionEnum.Update],
      AdminSubjectEnum.LovMaster,
    );
    can(AdminActionEnum.Manage, AdminSubjectEnum.GoogleCalendar, scope);
  }

  private applyBlogAdmin(can: AbilityBuilder<AppAbility>['can']): void {
    const contentSubjects: AdminSubjectEnum[] = [
      AdminSubjectEnum.Blog,
      AdminSubjectEnum.BlogAuthor,
      AdminSubjectEnum.BlogCategory,
      AdminSubjectEnum.PressMedia,
      AdminSubjectEnum.SuccessStory,
      AdminSubjectEnum.Faq,
      AdminSubjectEnum.Banner,
      AdminSubjectEnum.SeoPage,
    ];
    contentSubjects.forEach((s) => can(AdminActionEnum.Manage, s));
    can(AdminActionEnum.Read, AdminSubjectEnum.Dashboard);
    can(AdminActionEnum.Read, AdminSubjectEnum.TaxMaster);
    can(AdminActionEnum.Manage, AdminSubjectEnum.LovMaster);
  }

  private applySocialContentManager(can: AbilityBuilder<AppAbility>['can']): void {
    this.applyBlogAdmin(can);
    can(AdminActionEnum.Manage, AdminSubjectEnum.Referrer);
  }

  private applyProductUser(can: AbilityBuilder<AppAbility>['can']): void {
    can(AdminActionEnum.Read, AdminSubjectEnum.Dashboard);
    can(AdminActionEnum.Read, AdminSubjectEnum.Report);
    can(AdminActionEnum.Read, AdminSubjectEnum.TaxMaster);
    can(AdminActionEnum.Manage, AdminSubjectEnum.LovMaster);
    can(AdminActionEnum.Read, AdminSubjectEnum.Product);
    can([AdminActionEnum.Read, AdminActionEnum.Update], AdminSubjectEnum.ProductOrder);
    can(AdminActionEnum.Manage, AdminSubjectEnum.Shipment);
    can(AdminActionEnum.Manage, AdminSubjectEnum.CourierProviderAccount);
    can(AdminActionEnum.Manage, AdminSubjectEnum.CourierProvider);
    can(AdminActionEnum.Manage, AdminSubjectEnum.CourierProviderWarehouse);
    can(
      [AdminActionEnum.Read, AdminActionEnum.Create, AdminActionEnum.Update],
      AdminSubjectEnum.PromoCode,
    );
    can(AdminActionEnum.Read, AdminSubjectEnum.Member);
  }

  private applyAccountUser(can: AbilityBuilder<AppAbility>['can']): void {
    can(AdminActionEnum.Read, AdminSubjectEnum.Dashboard);
    can(AdminActionEnum.Read, AdminSubjectEnum.Report);
    can(AdminActionEnum.Read, AdminSubjectEnum.TaxMaster);
    can(AdminActionEnum.Read, AdminSubjectEnum.LovMaster);
    can(AdminActionEnum.Read, AdminSubjectEnum.MemberPayment);
  }
}
