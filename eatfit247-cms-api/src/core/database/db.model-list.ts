import { LogError } from './models/log-error.model';
import { MstAdminUser } from './models/mst-admin-user.model';
import { MstAdminRole } from './models/mst-admin-role.model';
import { MstAdminRolePermission } from './models/mst-admin-role-permission.model';
import { MstBlogAuthor } from './models/mst-blog-author.model';
import { MstBlogCategory } from './models/mst-blog-category.model';
import { MstBloodSugar } from './models/mst-blood-sugar.model';
import { MstCallLogStatus } from './models/mst-call-log-status.model';
import { MstCallType } from './models/mst-call-type.model';
import { MstCallPurpose } from './models/mst-call-purpose.model';
import { MstCountries } from './models/mst-countries.model';
import { MstCurrencyConfig } from './models/mst-currency-config.model';
import { MstState } from './models/mst-state.model';
import { MstEatingHabit } from './models/mst-eating-habit.model';
import { MstFaqCategory } from './models/mst-faq-category.model';
import { MstFeedbackOptionType } from './models/mst-feedback-option-type.model';
import { MstFeedbackQuestion } from './models/mst-feedback-question.model';
import { MstFeedbackQuestionOption } from './models/mst-feedback-question-option.model';
import { MstFranchise } from './models/mst-franchise.model';
import { MstGender } from './models/mst-gender.model';
import { MstHealthIssues } from './models/mst-health-issues.model';
import { MstLegalPages } from './models/mst-legal-pages.model';
import { MstLifestyle } from './models/mst-lifestyle.model';
import { MstMaritalStatus } from './models/mst-marital-status.model';
import { MstNutritive } from './models/mst-nutritive.model';
import { MstPlanStatus } from './models/mst-plan-status.model';
import { MstPocketGuide } from './models/mst-pocket-guide.model';
import { MstProgram } from './models/mst-program.model';
import { MstProgramCategory } from './models/mst-program-category.model';
import { MstProgramPlan } from './models/mst-program-plan.model';
import { MstRecipeCategory } from './models/mst-recipe-category.model';
import { MstRecipeCuisine } from './models/mst-recipe-cuisine.model';
import { MstRecipe } from './models/mst-recipe.model';
import { MstRecipeType } from './models/mst-recipe-type.model';
import { MstRecipeCategoryMapping } from './models/mst-recipe-category-mapping.model';
import { MstRecipeCuisineMapping } from './models/mst-recipe-cuisine-mapping.model';
import { MstReferrer } from './models/mst-referrer.model';
import { MstReligion } from './models/mst-religion.model';
import { MstSleepingPattern } from './models/mst-sleeping-pattern.model';
import { MstTypeOfExercise } from './models/mst-type-of-exercise.model';
import { MstUrineOutput } from './models/mst-urine-output.model';
import { TxnAdminLastLoginDetail } from './models/txn-admin-last-login-detail.model';
import { TxnBlog } from './models/txn-blog.model';
import { TxnBlogComment } from './models/txn-blog-comment.model';
import { TxnBlogCommentResponse } from './models/txn-blog-comment-response.model';
import { TxnContactForm } from './models/txn-contact-form.model';
import { TxnFaqs } from './models/txn-faqs.model';
import { TxnMember } from './models/txn-member.model';
import { TxnProgramFaq } from './models/txn-program-faq.model';
import { TxnPromotionMail } from './models/txn-promotion-mail.model';
import { TxnSubscriber } from './models/txn-subscriber.model';
import { TxnAdminUserForgotPasswordOtp } from './models/txn-admin-user-forgot-password-otp.model';
import { MstHealthParameter } from './models/mst-health-parameter.model';
import { MstAddressType } from './models/mst-address-type.model';
import { MstTable } from './models/mst-table.model';
import { TxnAddress } from './models/txn-address.model';
import { MstProgramPlanType } from './models/mst-program-plan-type.model';
import { TxnAssessment } from './models/txn-assessment.model';
import { TxnMemberPocketGuide } from './models/txn-member-pocket-guide.model';
import { TxnMemberCallLog } from './models/txn-member-call-log.model';
import { MstHealthParameterUnit } from './models/mst-health-parameter-unit.model';
import { TxnMemberHealthParameter } from './models/txn-member-health-parameter.model';
import { TxnMemberHealthParameterLog } from './models/txn-member-health-parameter-log.model';
import { MstHealthParameterUnitMapping } from './models/mst-health-parameter-unit-mapping.model';
import { TxnMemberHealthIssue } from './models/txn-member-health-issue.model';
import { MstRecipeNutritive } from './models/mst-recipe-nutritive.model';
import { MstPaymentMode } from './models/mst-payment-mode.model';
import { TxnMemberPayment } from './models/txn-member-payment.model';
import { TxnMemberDietPlan } from './models/txn-member-diet-plan.model';
import { TxnDietTemplate } from './models/txn-diet-template.model';
import { TxnDietTemplateDietDetail } from './models/txn-diet-template-diet-detail.model';
import { MstPaymentStatus } from './models/mst-payment-status.model';
import { MstConfig } from './models/mst-config.model';
import { TxnMemberDietPlanDetail } from './models/txn-member-diet-plan-detail.model';
import { MstIssueCategory } from './models/mst-issue-category.model';
import { MstIssueStatus } from './models/mst-issue-status.model';
import { TxnMemberIssue } from './models/txn-member-issue.model';
import { TxnMemberIssueResponse } from './models/txn-member-issue-response.model';
import { MstEmailTemplate } from './models/mst-email-template.model';
import { MstFieldType } from './models/mst_field_type.model';
import { MstUserStatus } from './models/mst_user_status.model';

export const ModelList = [
  LogError,
  MstAdminUser,
  MstAdminRole,
  MstAddressType,
  MstTable,
  MstAdminRolePermission,
  MstBlogAuthor,
  MstBlogCategory,
  MstBloodSugar,
  MstCallLogStatus,
  MstCallType,
  MstCallPurpose,
  MstCountries,
  MstState,
  MstCurrencyConfig,
  MstConfig,
  MstEatingHabit,
  MstEmailTemplate,
  MstFaqCategory,
  MstFeedbackOptionType,
  MstFeedbackQuestion,
  MstFeedbackQuestionOption,
  MstFieldType,
  MstFranchise,
  MstGender,
  MstHealthIssues,
  MstHealthParameter,
  MstIssueCategory,
  MstIssueStatus,
  MstLegalPages,
  MstLifestyle,
  MstMaritalStatus,
  MstNutritive,
  MstHealthParameterUnit,
  MstHealthParameterUnitMapping,
  MstPlanStatus,
  MstPocketGuide,
  MstProgram,
  MstProgramCategory,
  MstProgramPlan,
  MstProgramPlanType,
  MstRecipeCategory,
  MstRecipeCuisine,
  MstRecipe,
  MstRecipeType,
  MstRecipeCategoryMapping,
  MstRecipeCuisineMapping,
  MstReferrer,
  MstReligion,
  MstSleepingPattern,
  MstTypeOfExercise,
  MstUrineOutput,
  MstUserStatus,
  TxnAddress,
  TxnAdminLastLoginDetail,
  TxnBlog,
  TxnBlogComment,
  TxnBlogCommentResponse,
  TxnContactForm,
  TxnFaqs,
  TxnMember,
  TxnAssessment,
  TxnProgramFaq,
  TxnPromotionMail,
  TxnSubscriber,
  TxnAdminUserForgotPasswordOtp,
  TxnMemberPocketGuide,
  TxnMemberCallLog,
  TxnMemberHealthParameterLog,
  TxnMemberHealthParameter,
  TxnMemberHealthIssue,
  MstRecipeNutritive,
  MstPaymentMode,
  TxnMemberPayment,
  TxnMemberDietPlan,
  TxnDietTemplate,
  TxnDietTemplateDietDetail,
  MstPaymentStatus,
  TxnMemberDietPlanDetail,
  TxnMemberIssue,
  TxnMemberIssueResponse,
];
