export enum NavigationPathEnum {
  HOME = '/',

  LOGIN = 'auth/login',
  RESET_PASSWORD = 'auth/reset-password',

  ADMIN_USERS = 'admin-user/list',
  ADMIN_MANAGE = 'admin-user/manage',
  ADMIN_CHANGE_PASSWORD = 'admin-user/setting/change-password',
  ADMIN_EDIT_PROFILE = 'admin-user/setting/edit-profile',
  ADMIN_SETTING = 'admin-user/setting',

  MEMBERS = 'member/list',
  MEMBERS_MANAGE = 'member/manage',
  MEMBERS_DETAIL = 'member/detail',
  ASSESSMENT = '',
  MEMBER_HOME = 'member/detail/:id',
  ASSESSMENT_MANAGE = 'member/detail/:id/assessment-manage',
  MEMBER_PAYMENT_HISTORY = 'member/detail/:id/payment-history',
  MEMBER_ISSUES = 'member/detail/:id/issues',
  MEMBER_CALL_SCHEDULE = 'member/detail/:id/call-schedule',
  MEMBER_HEALTH_ISSUE = 'member/detail/:id/health-issue',
  MEMBER_POCKET_GUIDE = 'member/detail/:id/pocket-guide',
  MEMBER_BODY_STATS = 'member/detail/:id/body-stats',
  MEMBER_DIET_PLAN = 'member/detail/:id/diet-plan',
  MEMBER_DIET_PLAN_DETAIL = 'member/detail/:id/diet-plan-detail/:dietId/:cycleNo',
  MEMBER_DIET_PLAN_DETAIL_DAY = 'member/detail/:id/diet-plan-detail/:dietId/:cycleNo/:dayNo',

  RECIPES = 'recipe/recipe-list',
  RECIPES_MANAGE = 'recipe/recipe-manage',

  DIET_TEMPLATE = 'diet-template/list',
  DIET_TEMPLATE_MANAGE = 'diet-template/manage',
  DIET_TEMPLATE_DETAILS = 'diet-template/detail',

  SPECIAL_PLANS = 'special-plan/list',
  SPECIAL_PLANS_MANAGE = 'special-plan/manage',

  PROGRAM = 'program-and-plan/program-list',
  PROGRAM_MANAGE = 'program-and-plan/program-manage',
  PROGRAM_PLAN = 'program-and-plan/plan-list',
  PROGRAM_PLAN_MANAGE = 'program-and-plan/plan-manage',

  POCKET_GUIDES = 'pocket-guide/pocket-guide-list',
  POCKET_GUIDES_MANAGE = 'pocket-guide/pocket-guide-manage',

  CONTACT_US = 'report/contact-us-report',

  BLOGS = 'blogs/list',
  BLOGS_MANAGE = 'blogs/manage',

  MEMBER_TESTIMONIAL = 'member-testimonial/list',
  MEMBER_TESTIMONIAL_MANAGE = 'member-testimonial/manage',

  REFERRER = 'referrer/list',
  REFERRER_MANAGE = 'referrer/manage',
  REFERRER_DETAIL = 'referrer/detail',

  BLOOD_SUGAR = 'lov/blood-sugar-list',
  BLOOD_SUGAR_MANAGE = 'lov/blood-sugar-manage',
  EATING_HABIT = 'lov/eating-habit-list',
  EATING_HABIT_MANAGE = 'lov/eating-habit-manage',
  GENDER = 'lov/gender-list',
  GENDER_MANAGE = 'lov/gender-manage',
  HEALTH_PARAMETERS = 'lov/health-parameter-list',
  HEALTH_PARAMETERS_MANAGE = 'lov/health-parameter-manage',
  LIFESTYLE = 'lov/lifestyle-list',
  LIFESTYLE_MANAGE = 'lov/lifestyle-manage',
  MARITAL_STATUS = 'lov/marital-status-list',
  MARITAL_STATUS_MANAGE = 'lov/marital-status-manage',
  RELIGION = 'lov/religion-list',
  RELIGION_MANAGE = 'lov/religion-manage',
  SLEEPING_PATTERN = 'lov/sleeping-pattern-list',
  SLEEPING_PATTERN_MANAGE = 'lov/sleeping-pattern-manage',
  TYPE_OF_EXERCISE = 'lov/type-of-exercise-list',
  TYPE_OF_EXERCISE_MANAGE = 'lov/type-of-exercise-manage',

  NUTRITIVE = 'lov/nutritive-list',
  NUTRITIVE_MANAGE = 'lov/nutritive-manage',
  RECIPE_CATEGORY = 'lov/recipe-category-list',
  RECIPE_CATEGORY_MANAGE = 'lov/recipe-category-manage',
  RECIPE_CUISINE = 'lov/recipe-cuisine-list',
  RECIPE_CUISINE_MANAGE = 'lov/recipe-cuisine-manage',

  CALL_TYPE = 'lov/call-type-list',
  CALL_TYPE_MANAGE = 'lov/call-type-manage',
  CALL_PURPOSE = 'lov/call-purpose-list',
  CALL_PURPOSE_MANAGE = 'lov/call-purpose-manage',

  URINE_OUTPUT = 'lov/urine-output-list',
  URINE_OUTPUT_MANAGE = 'lov/urine-output-manage',

  PROGRAM_CATEGORY = 'lov/program-category-list',
  PROGRAM_CATEGORY_MANAGE = 'lov/program-category-manage',

  FAQ_CATEGORY = 'lov/faq-category-list',
  FAQ_CATEGORY_MANAGE = 'lov/faq-category-manage',

  COUNTRY = 'lov/country-list',
  COUNTRY_MANAGE = 'lov/country-manage',
  STATE = 'lov/state-list',
  STATE_MANAGE = 'lov/state-manage',

  BLOG_CATEGORY = 'lov/blog-category-list',
  BLOG_CATEGORY_MANAGE = 'lov/blog-category-manage',
  BLOG_AUTHOR = 'lov/blog-author-list',
  BLOG_AUTHOR_MANAGE = 'lov/blog-author-manage',

  FAQ = 'faq/faq-list',
  FAQ_MANAGE = 'faq/faq-manage',

  FRANCHISE = 'franchise/list',
  FRANCHISE_MANAGE = 'franchise/manage',
  FRANCHISE_DETAIL = 'franchise/detail',

  SETTING = 'settings',
  SETTING_MANAGE = '',
}
