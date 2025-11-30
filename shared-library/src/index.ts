/**
 * @eatfit247/shared-library
 * Shared library for Eatfit247 applications
 * 
 * This library provides common interfaces, enums, and utilities
 * shared across eatfit247-admin and server
 */

// Export base interfaces
export * from './base.interface.js';

// Export core interfaces
export * from './core/index.js';

// Export all enums
export * from './enum/index.js';

// Export all utilities
export * from './utils/index.js';

// Export auth interfaces
export * from './auth/index.js';

// Re-export commonly used types
export type { IResponse, ITableList, ITableListFilter, IBasicSearch, IError, IStatusChange, IMediaUpload } from './core/index.js';
export type { IAuthUser, ILogin, IChangePassword, IToken, IAdminUserLogin, IForgotPasswordRequest, IResetPasswordRequest } from './auth/index.js';
export type { ICommonTable, ICommonSEO, IBaseAdminUser, IDropdownItem } from './base.interface.js';
export type { ILegalPage, ILegalPageList, IManageLegalPage, IBaseLegalPage } from './core/legal-page.interface.js';
export type { IBlog, IManageBlog, IBaseBlog, IBlogCategory, IManageBlogCategory, IBaseBlogCategory, IBlogAuthor, IManageBlogAuthor, IBaseBlogAuthor } from './core/blog.interface.js';
export type { IFaq, IManageFaq, IBaseFaq, IFaqCategory, IManageFaqCategory, IBaseFaqCategory } from './core/faq.interface.js';
export type { IPressMedia, IManagePressMedia, IBasePressMedia, PressMediaType } from './core/press-media.interface.js';
export type { IProgramCategory, IManageProgramCategory, IBaseProgramCategory } from './core/program-category.interface.js';
export type { IProgram, IManageProgram, IBaseProgram } from './core/program.interface.js';
export type { IProgramPlan, IManageProgramPlan, IBaseProgramPlan } from './core/program-plan.interface.js';
export type { IRecipe, IManageRecipe, IBaseRecipe, IRecipeCategory, IManageRecipeCategory, IBaseRecipeCategory, IRecipeCuisine, IManageRecipeCuisine, IBaseRecipeCuisine, IRecipeType, IManageRecipeType, IBaseRecipeType, IRecipeCategoryMapping, IManageRecipeCategoryMapping, IBaseRecipeCategoryMapping, IRecipeCuisineMapping, IManageRecipeCuisineMapping, IBaseRecipeCuisineMapping, IRecipeNutritive, IManageRecipeNutritive, IBaseRecipeNutritive } from './core/recipe.interface.js';
export type { IReferrer, IManageReferrer, IBaseReferrer } from './core/referrer.interface.js';
export type { IFranchise, IManageFranchise, IBaseFranchise } from './core/franchise.interface.js';
export type { IPocketGuide, IManagePocketGuide, IBasePocketGuide } from './core/pocket-guide.interface.js';
export type { ICallLogStatus, IManageCallLogStatus, IBaseCallLogStatus, ICallPurpose, IManageCallPurpose, IBaseCallPurpose, ICallType, IManageCallType, IBaseCallType } from './core/call-log.interface.js';
export type { IGender, IManageGender, IBaseGender, IBloodSugar, IManageBloodSugar, IBaseBloodSugar, IHealthIssue, IManageHealthIssue, IBaseHealthIssue, IEatingHabit, IManageEatingHabit, IBaseEatingHabit, ILifestyle, IManageLifestyle, IBaseLifestyle, IMaritalStatus, IManageMaritalStatus, IBaseMaritalStatus, IReligion, IManageReligion, IBaseReligion, ISleepingPattern, IManageSleepingPattern, IBaseSleepingPattern, ITypeOfExercise, IManageTypeOfExercise, IBaseTypeOfExercise, IUrineOutput, IManageUrineOutput, IBaseUrineOutput, IHealthParameter, IManageHealthParameter, IBaseHealthParameter } from './core/assessment-master.interface.js';
export type { ICountry, IManageCountry, IBaseCountry, IState, IManageState, IBaseState } from './core/location.interface.js';
export type { IMember, IManageMember, IBaseMember } from './core/member.interface.js';
export type { IAdminUser, IManageAdminUser, IBaseAdminUserFull, IAdminRolePermission, IManageAdminRolePermission, IBaseAdminRolePermission } from './core/admin-user.interface.js';
export type { IEmailTemplate, IManageEmailTemplate, IBaseEmailTemplate, ISendEmailParams, IEmailAttachment } from './core/email-template.interface.js';
export type { IIssueCategory, IManageIssueCategory, IBaseIssueCategory, IIssueStatus, IManageIssueStatus, IBaseIssueStatus } from './core/issue.interface.js';
export { LabelKey } from './enum/label-key.enum.js';

