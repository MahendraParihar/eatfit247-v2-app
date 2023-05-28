export enum ApiUrlEnum {
  BASE_URL = `http://localhost:3000/api/v1/`,

  MEDIA_PATH = 'http://localhost:3000/',
  BASE_IMAGE_URL = `media/images/`,
  DOWNLOAD_PATH = 'http://localhost:3000/media-files/downloads/',


  LOGIN = 'account/sign-in',
  SEND_ACTIVATION_LINK = 'account/resend-verification-link',
  SEND_FORGOT_PASSWORD_OTP = 'account/send-forgot-password-otp',
  RESET_PASSWORD = 'account/reset-password',

  ADMIN_LIST = 'admin-user/list',
  ADMIN_MANAGE = 'admin-user/manage',
  ADMIN_PROFILE_MANAGE = 'admin-user/admin-profile',
  ADMIN_MASTER_DATA = 'admin-user/master-data',
  ADMIN_UPDATE_STATUS = 'admin-user/update-status',
  ADMIN_RESET_PASSWORD = 'admin-user/reset-password',
  ADMIN_CHANGE_PASSWORD = 'admin-user/change-password',
  ADMIN_NUTRITIONIST_BY_FRANCHISE = 'admin-user/nutritionist-by-franchise',

  BLOG_AUTHOR_LIST = 'lov/blog-author/list',
  BLOG_AUTHOR_MANAGE = 'lov/blog-author/manage',
  BLOG_AUTHOR_STATUS_CHANGE = 'lov/blog-author/update-status',

  BLOG_CATEGORY_LIST = 'lov/blog-category/list',
  BLOG_CATEGORY_MANAGE = 'lov/blog-category/manage',
  BLOG_CATEGORY_STATUS_CHANGE = 'lov/blog-category/update-status',

  BLOOD_SUGAR_LIST = 'lov/blood-sugar/list',
  BLOOD_SUGAR_MANAGE = 'lov/blood-sugar/manage',
  BLOOD_SUGAR_STATUS_CHANGE = 'lov/blood-sugar/update-status',

  CALL_TYPE_LIST = 'lov/call-type/list',
  CALL_TYPE_MANAGE = 'lov/call-type/manage',
  CALL_TYPE_STATUS_CHANGE = 'lov/call-type/update-status',

  CALL_PURPOSE_LIST = 'lov/call-purpose/list',
  CALL_PURPOSE_MANAGE = 'lov/call-purpose/manage',
  CALL_PURPOSE_STATUS_CHANGE = 'lov/call-purpose/update-status',

  COUNTRY_LIST_MASTER = 'lov/country/country-list',
  COUNTRY_LIST = 'lov/country/list',
  COUNTRY_MANAGE = 'lov/country/manage',
  COUNTRY_STATUS_CHANGE = 'lov/country/update-status',

  STATE_LIST = 'lov/state/list',
  STATE_MANAGE = 'lov/state/manage',
  STATE_STATUS_CHANGE = 'lov/state/update-status',

  EATING_HABIT_LIST = 'lov/eating-habit/list',
  EATING_HABIT_MANAGE = 'lov/eating-habit/manage',
  EATING_HABIT_STATUS_CHANGE = 'lov/eating-habit/update-status',

  GENDER_LIST = 'lov/gender/list',
  GENDER_MANAGE = 'lov/gender/manage',
  GENDER_STATUS_CHANGE = 'lov/gender/update-status',

  HEALTH_PARAMETER_LIST = 'lov/health-parameter/list',
  HEALTH_PARAMETER_MANAGE = 'lov/health-parameter/manage',
  HEALTH_PARAMETER_STATUS_CHANGE = 'lov/health-parameter/update-status',

  LIFESTYLE_LIST = 'lov/lifestyle/list',
  LIFESTYLE_MANAGE = 'lov/lifestyle/manage',
  LIFESTYLE_STATUS_CHANGE = 'lov/lifestyle/update-status',

  MARITAL_STATUS_LIST = 'lov/marital-status/list',
  MARITAL_STATUS_MANAGE = 'lov/marital-status/manage',
  MARITAL_STATUS_STATUS_CHANGE = 'lov/marital-status/update-status',

  NUTRITIVE_LIST = 'lov/nutritive/list',
  NUTRITIVE_MANAGE = 'lov/nutritive/manage',
  NUTRITIVE_STATUS_CHANGE = 'lov/nutritive/update-status',

  RECIPE_CATEGORY_LIST = 'lov/recipe-category/list',
  RECIPE_CATEGORY_MANAGE = 'lov/recipe-category/manage',
  RECIPE_CATEGORY_STATUS_CHANGE = 'lov/recipe-category/update-status',

  RECIPE_CUISINE_LIST = 'lov/recipe-cuisine/list',
  RECIPE_CUISINE_MANAGE = 'lov/recipe-cuisine/manage',
  RECIPE_CUISINE_STATUS_CHANGE = 'lov/recipe-cuisine/update-status',

  RELIGION_LIST = 'lov/religion/list',
  RELIGION_MANAGE = 'lov/religion/manage',
  RELIGION_STATUS_CHANGE = 'lov/religion/update-status',

  SLEEPING_PATTERN_LIST = 'lov/sleeping-pattern/list',
  SLEEPING_PATTERN_MANAGE = 'lov/sleeping-pattern/manage',
  SLEEPING_PATTERN_STATUS_CHANGE = 'lov/sleeping-pattern/update-status',

  TYPE_OF_EXERCISE_LIST = 'lov/type-of-exercise/list',
  TYPE_OF_EXERCISE_MANAGE = 'lov/type-of-exercise/manage',
  TYPE_OF_EXERCISE_STATUS_CHANGE = 'lov/type-of-exercise/update-status',

  URINE_OUTPUT_LIST = 'lov/urine-output/list',
  URINE_OUTPUT_MANAGE = 'lov/urine-output/manage',
  URINE_OUTPUT_STATUS_CHANGE = 'lov/urine-output/update-status',

  PROGRAM_CATEGORY_LIST = 'lov/program-category/list',
  PROGRAM_CATEGORY_MANAGE = 'lov/program-category/manage',
  PROGRAM_CATEGORY_STATUS_CHANGE = 'lov/program-category/update-status',

  FAQ_CATEGORY_LIST = 'lov/faq-category/list',
  FAQ_CATEGORY_MANAGE = 'lov/faq-category/manage',
  FAQ_CATEGORY_STATUS_CHANGE = 'lov/faq-category/update-status',

  POCKET_GUIDE_LIST = 'pocket-guide/list',
  POCKET_GUIDE_MANAGE = 'pocket-guide/manage',
  POCKET_GUIDE_STATUS_CHANGE = 'pocket-guide/update-status',

  REFERRER_LIST = 'referrer/list',
  REFERRER_MANAGE = 'referrer/manage',
  REFERRER_STATUS_CHANGE = 'referrer/update-status',
  REFERRER_BY_FRANCHISE = 'referrer/referrer-by-franchise',

  BLOG_LIST = 'blog/list',
  BLOG_MANAGE = 'blog/manage',
  BLOG_STATUS_CHANGE = 'blog/update-status',
  BLOG_MASTER_DATA = 'blog/blog-master',
  BLOG_SEND_MAIL = 'blog/send-mail',

  FAQ_LIST = 'faq/list',
  FAQ_MANAGE = 'faq/manage',
  FAQ_STATUS_CHANGE = 'faq/update-status',
  FAQ_MASTER_DATA = 'faq/faq-master',

  FRANCHISE_LIST = 'franchise/list',
  FRANCHISE_MANAGE = 'franchise/manage',
  FRANCHISE_STATUS_CHANGE = 'franchise/update-status',
  FRANCHISE_DD_LIST = 'franchise/list-franchise',

  ADDRESS_MASTER = 'common/address-master',
  CONTACT_NUMBER_MASTER = 'common/contact-number-master',

  MEDIA_UPLOAD = 'common/media/upload-media',
  SEARCH_USER = 'common/search-user',

  PROGRAM_LIST = 'program/list',
  PROGRAM_MANAGE = 'program/manage',
  PROGRAM_STATUS_CHANGE = 'program/update-status',
  PROGRAM_MASTER_DATA = 'program/program-master',

  PROGRAM_PLAN_LIST = 'program-plan/list',
  PROGRAM_PLAN_MANAGE = 'program-plan/manage',
  PROGRAM_PLAN_STATUS_CHANGE = 'program-plan/update-status',
  PROGRAM_PLAN_MASTER_DATA = 'program-plan/master-data',

  RECIPE_LIST = 'recipe/list',
  RECIPE_MANAGE = 'recipe/manage',
  RECIPE_STATUS_CHANGE = 'recipe/update-status',
  RECIPE_MASTER_DATA = 'recipe/master-data',

  CONTACT_US_LIST = 'contact-us-report/list',
  CONTACT_US_MANAGE = 'contact-us-report/manage',
  CONTACT_US_STATUS_CHANGE = 'contact-us-report/update-status',
  CONTACT_US_SEND_RESPONSE = 'contact-us-report/send-response',
  CONTACT_US_SEND_MAIL = 'contact-us-report/send-mail',

  MEMBER_LIST = 'member/list',
  MEMBER_MANAGE = 'member/manage',
  MEMBER_DETAILS = 'member/detail',
  MEMBER_MASTER_DATA = 'member/master-data',
  MEMBER_UPDATE_STATUS = 'member/update-status',
  MEMBER_RESET_PASSWORD = 'member/reset-password',
  MEMBER_DASHBOARD = 'member/dashboard',

  MEMBER_ASSESSMENT_MANAGEMENT = 'member-assessment/manage',
  MEMBER_ASSESSMENT_MASTER_DATA = 'member-assessment/master-data',
  MEMBER_POCKET_GUIDE_LIST = 'member-pocket-guide/list',
  MEMBER_POCKET_GUIDE_MANAGE = 'member-pocket-guide/manage',
  MEMBER_HEALTH_ISSUE_MANAGE = 'member-health-issue/manage',
  MEMBER_HEALTH_ISSUE_LIST = 'member-health-issue/list',

  MEMBER_CALL_LOG = 'member-call-schedule/list',
  MEMBER_CALL_LOG_MANAGE = 'member-call-schedule/manage',
  MEMBER_CALL_LOG_UPDATE_STATUS = 'member-call-schedule/update-status',
  MEMBER_CALL_LOG_MASTER_DATA = 'member-call-schedule/master-data',

  MEMBER_BODY_STATS = 'member-body-stats/list',
  MEMBER_BODY_STATS_MANAGE = 'member-body-stats/manage',
  MEMBER_BODY_STATS_UPDATE_STATUS = 'member-body-stats/update-status',
  MEMBER_BODY_STATS_MASTER_DATA = 'member-body-stats/master-data',

  MEMBER_PAYMENT = 'member-payment/list',
  MEMBER_PAYMENT_MANAGE = 'member-payment/manage',
  MEMBER_PAYMENT_UPDATE_STATUS = 'member-payment/update-status',
  MEMBER_PAYMENT_MASTER_DATA = 'member-payment/master-data',
  MEMBER_PAYMENT_INVOICE_DOWNLOAD = 'member-payment/download-invoice',
  MEMBER_PAYMENT_INVOICE_SEND = 'member-payment/send-invoice',

  MEMBER_DIET_PLAN = 'member-diet-plan/list',
  MEMBER_DIET_PLAN_MANAGE = 'member-diet-plan/manage',
  MEMBER_DIET_PLAN_UPDATE_STATUS = 'member-diet-plan/update-status',
  MEMBER_DIET_PLAN_MASTER_DATA = 'member-diet-plan/master-data',
  MEMBER_DIET_PLAN_DOWNLOAD = 'member-diet-plan/download',
  MEMBER_DIET_PLAN_SEND_EMAIL = 'member-diet-plan/send-email',
  MEMBER_DIET_PLAN_TEMPLATE_UPDATE = 'member-diet-plan/update-details',
  MEMBER_DIET_PLAN_CYCLE_DELETE = 'member-diet-plan/delete-cycle',
  MEMBER_DIET_PLAN_DAY_DELETE = 'member-diet-plan/delete-day',

  MEMBER_ISSUES = 'member-issue/list',
  MEMBER_ISSUE_MANAGE = 'member-issue/manage',
  MEMBER_ISSUE_UPDATE_STATUS = 'member-issue/update-status',
  MEMBER_ISSUE_DELETE = 'member-issue/delete',
  MEMBER_ISSUE_MASTER_DATA = 'member-issue/master-data',

  DIET_TEMPLATE_LIST = 'diet-template/list',
  DIET_TEMPLATE_MANAGE = 'diet-template/manage',
  DIET_TEMPLATE_DETAILS = 'diet-template/details',
  DIET_TEMPLATE_DETAILS_UPDATE = 'diet-template/update-details',
  DIET_TEMPLATE_STATUS_CHANGE = 'diet-template/update-status',

  CONFIG_PARAMETER_LIST = 'config-parameter/list',
  CONFIG_PARAMETER_UPDATE = 'config-parameter/update',
}
