import { Injectable } from '@nestjs/common';
import { AbilityBuilder, createMongoAbility, MongoAbility } from '@casl/ability';
import {
  AdminActionEnum,
  AdminRoleEnum,
  AdminSubjectEnum,
  IAdminUser,
} from '@eatfit247-shared-lib';

export type AppAbility = MongoAbility<[AdminActionEnum, AdminSubjectEnum | 'all']>;

@Injectable()
export class CaslAbilityFactory {
  createForUser(user: IAdminUser): AppAbility {
    const { can, cannot, build } = new AbilityBuilder<AppAbility>(createMongoAbility);

    // SuperAdmin in any of the roles → full access, short-circuit
    if (user.roleKeys.includes(AdminRoleEnum.SuperAdmin)) {
      can(AdminActionEnum.Manage, AdminSubjectEnum.All);
      return build();
    }

    // Union: apply every assigned role's permissions
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
        case AdminRoleEnum.ProductUser:
          this.applyProductUser(can);
          break;
      }
    }

    return build();
  }

  // ─── Role builders (unchanged from before) ───────────────────────────────

  private applyFranchiseAdmin(
    can: AbilityBuilder<AppAbility>['can'],
    franchiseIds: number[],
  ): void {
    const scope = franchiseIds.length ? { franchiseId: { $in: franchiseIds } } : {};
    can(AdminActionEnum.Read, AdminSubjectEnum.Dashboard, scope);
    can(AdminActionEnum.Read, AdminSubjectEnum.Report, scope);
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
    can([AdminActionEnum.Read, AdminActionEnum.Create], AdminSubjectEnum.Program, scope);
    can([AdminActionEnum.Read, AdminActionEnum.Create], AdminSubjectEnum.ProgramPlan, scope);
    can(AdminActionEnum.Read, AdminSubjectEnum.DietTemplate);
    can(AdminActionEnum.Read, AdminSubjectEnum.Blog);
    can(AdminActionEnum.Read, AdminSubjectEnum.Recipe);
    can(AdminActionEnum.Read, AdminSubjectEnum.Product);
    can(AdminActionEnum.Read, AdminSubjectEnum.ProductOrder, scope);
    can(AdminActionEnum.Read, AdminSubjectEnum.Shipment, scope);
    can([AdminActionEnum.Read, AdminActionEnum.Update], AdminSubjectEnum.Franchise, scope);
    can(AdminActionEnum.Manage, AdminSubjectEnum.Notification, scope);
    can(AdminActionEnum.Manage, AdminSubjectEnum.GoogleCalendar, scope);
  }

  private applyNutritionist(can: AbilityBuilder<AppAbility>['can'], franchiseIds: number[]): void {
    const scope = franchiseIds.length ? { franchiseId: { $in: franchiseIds } } : {};
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
    can(AdminActionEnum.Read, AdminSubjectEnum.ProgramPlan);
    can(AdminActionEnum.Manage, AdminSubjectEnum.Recipe);
    can(AdminActionEnum.Read, AdminSubjectEnum.PocketGuide);
    can(AdminActionEnum.Manage, AdminSubjectEnum.GoogleCalendar, scope);
  }

  private applyBlogAdmin(can: AbilityBuilder<AppAbility>['can']): void {
    const contentSubjects: AdminSubjectEnum[] = [
      AdminSubjectEnum.Blog,
      AdminSubjectEnum.BlogAuthor,
      AdminSubjectEnum.BlogCategory,
      AdminSubjectEnum.Recipe,
      AdminSubjectEnum.Faq,
      AdminSubjectEnum.PressMedia,
      AdminSubjectEnum.SuccessStory,
    ];
    contentSubjects.forEach((s) => can(AdminActionEnum.Manage, s));
    can(AdminActionEnum.Read, AdminSubjectEnum.Dashboard);
    can(AdminActionEnum.Read, AdminSubjectEnum.Banner);
    can(AdminActionEnum.Read, AdminSubjectEnum.SeoPage);
  }

  private applyProductUser(can: AbilityBuilder<AppAbility>['can']): void {
    can(AdminActionEnum.Read, AdminSubjectEnum.Dashboard);
    can(AdminActionEnum.Read, AdminSubjectEnum.Product);
    can([AdminActionEnum.Read, AdminActionEnum.Update], AdminSubjectEnum.ProductOrder);
    can(AdminActionEnum.Manage, AdminSubjectEnum.Shipment);
    can(AdminActionEnum.Read, AdminSubjectEnum.DeliveryAccount);
    can([AdminActionEnum.Read, AdminActionEnum.Update], AdminSubjectEnum.PromoCode);
    can(AdminActionEnum.Read, AdminSubjectEnum.Member);
  }
}
