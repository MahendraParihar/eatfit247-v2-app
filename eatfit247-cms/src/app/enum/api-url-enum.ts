export class ApiUrlEnum {
  static MEDIA_PATH = "https://www.eatfit247.com:3000/";
  static BASE_URL = `${ApiUrlEnum.MEDIA_PATH}api/v1/`;
  static BASE_IMAGE_URL = `media/images/`;
  static DOWNLOAD_PATH = `${ApiUrlEnum.MEDIA_PATH}media-files/downloads/`;
  static LOGIN = "account/sign-in";
  static SEND_ACTIVATION_LINK = "account/resend-verification-link";
  static SEND_FORGOT_PASSWORD_OTP = "account/send-forgot-password-otp";
  static RESET_PASSWORD = "account/reset-password";
  static ADMIN_LIST = "admin-user/list";
  static ADMIN_MANAGE = "admin-user/manage";
  static ADMIN_PROFILE_MANAGE = "admin-user/admin-profile";
  static ADMIN_MASTER_DATA = "admin-user/master-data";
  static ADMIN_UPDATE_STATUS = "admin-user/update-status";
  static ADMIN_RESET_PASSWORD = "admin-user/reset-password";
  static ADMIN_CHANGE_PASSWORD = "admin-user/change-password";
  static ADMIN_NUTRITIONIST_BY_FRANCHISE = "admin-user/nutritionist-by-franchise";
  static BLOG_AUTHOR_LIST = "lov/blog-author/list";
  static BLOG_AUTHOR_MANAGE = "lov/blog-author/manage";
  static BLOG_AUTHOR_STATUS_CHANGE = "lov/blog-author/update-status";
  static BLOG_CATEGORY_LIST = "lov/blog-category/list";
  static BLOG_CATEGORY_MANAGE = "lov/blog-category/manage";
  static BLOG_CATEGORY_STATUS_CHANGE = "lov/blog-category/update-status";
  static BLOOD_SUGAR_LIST = "lov/blood-sugar/list";
  static BLOOD_SUGAR_MANAGE = "lov/blood-sugar/manage";
  static BLOOD_SUGAR_STATUS_CHANGE = "lov/blood-sugar/update-status";
  static CALL_TYPE_LIST = "lov/call-type/list";
  static CALL_TYPE_MANAGE = "lov/call-type/manage";
  static CALL_TYPE_STATUS_CHANGE = "lov/call-type/update-status";
  static CALL_PURPOSE_LIST = "lov/call-purpose/list";
  static CALL_PURPOSE_MANAGE = "lov/call-purpose/manage";
  static CALL_PURPOSE_STATUS_CHANGE = "lov/call-purpose/update-status";
  static COUNTRY_LIST_MASTER = "lov/country/country-list";
  static COUNTRY_LIST = "lov/country/list";
  static COUNTRY_MANAGE = "lov/country/manage";
  static COUNTRY_STATUS_CHANGE = "lov/country/update-status";
  static STATE_LIST = "lov/state/list";
  static STATE_MANAGE = "lov/state/manage";
  static STATE_STATUS_CHANGE = "lov/state/update-status";
  static EATING_HABIT_LIST = "lov/eating-habit/list";
  static EATING_HABIT_MANAGE = "lov/eating-habit/manage";
  static EATING_HABIT_STATUS_CHANGE = "lov/eating-habit/update-status";
  static GENDER_LIST = "lov/gender/list";
  static GENDER_MANAGE = "lov/gender/manage";
  static GENDER_STATUS_CHANGE = "lov/gender/update-status";
  static HEALTH_PARAMETER_LIST = "lov/health-parameter/list";
  static HEALTH_PARAMETER_MANAGE = "lov/health-parameter/manage";
  static HEALTH_PARAMETER_STATUS_CHANGE = "lov/health-parameter/update-status";
  static LIFESTYLE_LIST = "lov/lifestyle/list";
  static LIFESTYLE_MANAGE = "lov/lifestyle/manage";
  static LIFESTYLE_STATUS_CHANGE = "lov/lifestyle/update-status";
  static MARITAL_STATUS_LIST = "lov/marital-status/list";
  static MARITAL_STATUS_MANAGE = "lov/marital-status/manage";
  static MARITAL_STATUS_STATUS_CHANGE = "lov/marital-status/update-status";
  static NUTRITIVE_LIST = "lov/nutritive/list";
  static NUTRITIVE_MANAGE = "lov/nutritive/manage";
  static NUTRITIVE_STATUS_CHANGE = "lov/nutritive/update-status";
  static RECIPE_CATEGORY_LIST = "lov/recipe-category/list";
  static RECIPE_CATEGORY_MANAGE = "lov/recipe-category/manage";
  static RECIPE_CATEGORY_STATUS_CHANGE = "lov/recipe-category/update-status";
  static RECIPE_CUISINE_LIST = "lov/recipe-cuisine/list";
  static RECIPE_CUISINE_MANAGE = "lov/recipe-cuisine/manage";
  static RECIPE_CUISINE_STATUS_CHANGE = "lov/recipe-cuisine/update-status";
  static RELIGION_LIST = "lov/religion/list";
  static RELIGION_MANAGE = "lov/religion/manage";
  static RELIGION_STATUS_CHANGE = "lov/religion/update-status";
  static SLEEPING_PATTERN_LIST = "lov/sleeping-pattern/list";
  static SLEEPING_PATTERN_MANAGE = "lov/sleeping-pattern/manage";
  static SLEEPING_PATTERN_STATUS_CHANGE = "lov/sleeping-pattern/update-status";
  static TYPE_OF_EXERCISE_LIST = "lov/type-of-exercise/list";
  static TYPE_OF_EXERCISE_MANAGE = "lov/type-of-exercise/manage";
  static TYPE_OF_EXERCISE_STATUS_CHANGE = "lov/type-of-exercise/update-status";
  static URINE_OUTPUT_LIST = "lov/urine-output/list";
  static URINE_OUTPUT_MANAGE = "lov/urine-output/manage";
  static URINE_OUTPUT_STATUS_CHANGE = "lov/urine-output/update-status";
  static PROGRAM_CATEGORY_LIST = "lov/program-category/list";
  static PROGRAM_CATEGORY_MANAGE = "lov/program-category/manage";
  static PROGRAM_CATEGORY_STATUS_CHANGE = "lov/program-category/update-status";
  static FAQ_CATEGORY_LIST = "lov/faq-category/list";
  static FAQ_CATEGORY_MANAGE = "lov/faq-category/manage";
  static FAQ_CATEGORY_STATUS_CHANGE = "lov/faq-category/update-status";
  static POCKET_GUIDE_LIST = "pocket-guide/list";
  static POCKET_GUIDE_MANAGE = "pocket-guide/manage";
  static POCKET_GUIDE_STATUS_CHANGE = "pocket-guide/update-status";
  static REFERRER_LIST = "referrer/list";
  static REFERRER_MANAGE = "referrer/manage";
  static REFERRER_STATUS_CHANGE = "referrer/update-status";
  static REFERRER_BY_FRANCHISE = "referrer/referrer-by-franchise";
  static BLOG_LIST = "blog/list";
  static BLOG_MANAGE = "blog/manage";
  static BLOG_STATUS_CHANGE = "blog/update-status";
  static BLOG_MASTER_DATA = "blog/blog-master";
  static BLOG_SEND_MAIL = "blog/send-mail";
  static FAQ_LIST = "faq/list";
  static FAQ_MANAGE = "faq/manage";
  static FAQ_STATUS_CHANGE = "faq/update-status";
  static FAQ_MASTER_DATA = "faq/faq-master";
  static FRANCHISE_LIST = "franchise/list";
  static FRANCHISE_MANAGE = "franchise/manage";
  static FRANCHISE_STATUS_CHANGE = "franchise/update-status";
  static FRANCHISE_DD_LIST = "franchise/list-franchise";
  static ADDRESS_MASTER = "common/address-master";
  static CONTACT_NUMBER_MASTER = "common/contact-number-master";
  static MEDIA_UPLOAD = "common/media/upload-media";
  static SEARCH_USER = "common/search-user";
  static PROGRAM_LIST = "program/list";
  static PROGRAM_MANAGE = "program/manage";
  static PROGRAM_STATUS_CHANGE = "program/update-status";
  static PROGRAM_MASTER_DATA = "program/program-master";
  static PROGRAM_PLAN_LIST = "program-plan/list";
  static PROGRAM_PLAN_MANAGE = "program-plan/manage";
  static PROGRAM_PLAN_STATUS_CHANGE = "program-plan/update-status";
  static PROGRAM_PLAN_MASTER_DATA = "program-plan/master-data";
  static RECIPE_LIST = "recipe/list";
  static RECIPE_MANAGE = "recipe/manage";
  static RECIPE_STATUS_CHANGE = "recipe/update-status";
  static RECIPE_MASTER_DATA = "recipe/master-data";
  static CONTACT_US_LIST = "contact-us-report/list";
  static CONTACT_US_MANAGE = "contact-us-report/manage";
  static CONTACT_US_STATUS_CHANGE = "contact-us-report/update-status";
  static CONTACT_US_SEND_RESPONSE = "contact-us-report/send-response";
  static CONTACT_US_SEND_MAIL = "contact-us-report/send-mail";
  static MEMBER_LIST = "member/list";
  static MEMBER_MANAGE = "member/manage";
  static MEMBER_DETAILS = "member/detail";
  static MEMBER_MASTER_DATA = "member/master-data";
  static MEMBER_UPDATE_STATUS = "member/update-status";
  static MEMBER_RESET_PASSWORD = "member/reset-password";
  static MEMBER_DASHBOARD = "member/dashboard";
  static MEMBER_ASSESSMENT_MANAGEMENT = "member-assessment/manage";
  static MEMBER_ASSESSMENT_MASTER_DATA = "member-assessment/master-data";
  static MEMBER_POCKET_GUIDE_LIST = "member-pocket-guide/list";
  static MEMBER_POCKET_GUIDE_MANAGE = "member-pocket-guide/manage";
  static MEMBER_HEALTH_ISSUE_MANAGE = "member-health-issue/manage";
  static MEMBER_HEALTH_ISSUE_LIST = "member-health-issue/list";
  static MEMBER_CALL_LOG = "member-call-schedule/list";
  static MEMBER_CALL_LOG_MANAGE = "member-call-schedule/manage";
  static MEMBER_CALL_LOG_UPDATE_STATUS = "member-call-schedule/update-status";
  static MEMBER_CALL_LOG_MASTER_DATA = "member-call-schedule/master-data";
  static MEMBER_BODY_STATS = "member-body-stats/list";
  static MEMBER_BODY_STATS_MANAGE = "member-body-stats/manage";
  static MEMBER_BODY_STATS_UPDATE_STATUS = "member-body-stats/update-status";
  static MEMBER_BODY_STATS_MASTER_DATA = "member-body-stats/master-data";
  static MEMBER_PAYMENT = "member-payment/list";
  static MEMBER_PAYMENT_MANAGE = "member-payment/manage";
  static MEMBER_PAYMENT_UPDATE_STATUS = "member-payment/update-status";
  static MEMBER_PAYMENT_MASTER_DATA = "member-payment/master-data";
  static MEMBER_PAYMENT_INVOICE_DOWNLOAD = "member-payment/download-invoice";
  static MEMBER_PAYMENT_INVOICE_SEND = "member-payment/send-invoice";
  static MEMBER_DIET_PLAN = "member-diet-plan/list";
  static MEMBER_DIET_PLAN_MANAGE = "member-diet-plan/manage";
  static MEMBER_DIET_PLAN_UPDATE_STATUS = "member-diet-plan/update-status";
  static MEMBER_DIET_PLAN_MASTER_DATA = "member-diet-plan/master-data";
  static MEMBER_DIET_PLAN_DOWNLOAD = "member-diet-plan/download";
  static MEMBER_DIET_PLAN_SEND_EMAIL = "member-diet-plan/send-email";
  static MEMBER_DIET_PLAN_TEMPLATE_UPDATE = "member-diet-plan/update-details";
  static MEMBER_DIET_PLAN_CYCLE_DELETE = "member-diet-plan/delete-cycle";
  static MEMBER_DIET_PLAN_DAY_DELETE = "member-diet-plan/delete-day";
  static MEMBER_ISSUES = "member-issue/list";
  static MEMBER_ISSUE_MANAGE = "member-issue/manage";
  static MEMBER_ISSUE_UPDATE_STATUS = "member-issue/update-status";
  static MEMBER_ISSUE_DELETE = "member-issue/delete";
  static MEMBER_ISSUE_MASTER_DATA = "member-issue/master-data";
  static DIET_TEMPLATE_LIST = "diet-template/list";
  static DIET_TEMPLATE_MANAGE = "diet-template/manage";
  static DIET_TEMPLATE_DETAILS = "diet-template/details";
  static DIET_TEMPLATE_DETAILS_UPDATE = "diet-template/update-details";
  static DIET_TEMPLATE_STATUS_CHANGE = "diet-template/update-status";
  static CONFIG_PARAMETER_LIST = "config-parameter/list";
  static CONFIG_PARAMETER_UPDATE = "config-parameter/update";
}
