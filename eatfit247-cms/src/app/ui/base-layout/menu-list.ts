import {NavItem} from "../../interfaces/nav-item";
import {NavigationPathEnum} from "../../enum/navigation-path-enum";
import {StringResources} from "../../enum/string-resources";

export let menuList: NavItem[] = [
  {title: StringResources.HOME, path: NavigationPathEnum.HOME, iconName: 'home'},
  {title: StringResources.FRANCHISE, path: NavigationPathEnum.FRANCHISE, iconName: 'storefront'},
  {title: StringResources.MEMBERS, path: NavigationPathEnum.MEMBERS, iconName: 'people'},
  // {title: StringResources.ASSESSMENT, path: NavigationPathEnum.ASSESSMENT, iconName: 'analytics'},
  {title: StringResources.RECIPES, path: NavigationPathEnum.RECIPES, iconName: 'menu_book'},
  {title: StringResources.DIET_TEMPLATE, path: NavigationPathEnum.DIET_TEMPLATE, iconName: 'newspaper'},
  {
    title: StringResources.PROGRAM_AND_PLAN,
    children:
      [
        {title: StringResources.PROGRAMS, path: NavigationPathEnum.PROGRAM, iconName: 'description'},
        {title: StringResources.PLANS, path: NavigationPathEnum.PROGRAM_PLAN, iconName: 'description'},
      ],
    iconName: 'request_quote'
  },
  {title: StringResources.POCKET_GUIDES, path: NavigationPathEnum.POCKET_GUIDES, iconName: 'auto_stories'},
  {title: StringResources.CONTACT_US, path: NavigationPathEnum.CONTACT_US, iconName: 'contact_support'},
  {title: StringResources.BLOGS, path: NavigationPathEnum.BLOGS, iconName: 'rss_feed'},
  // {title: StringResources.MEMBER_TESTIMONIAL, path: NavigationPathEnum.MEMBER_TESTIMONIAL, iconName: 'quiz'},
  {title: StringResources.ADMIN_USERS, path: NavigationPathEnum.ADMIN_USERS, iconName: 'admin_panel_settings'},
  {title: StringResources.REFERRER, path: NavigationPathEnum.REFERRER, iconName: 'settings'},
  {title: StringResources.FAQS, path: NavigationPathEnum.FAQ, iconName: 'help'},
  {title: StringResources.SETTING, path: NavigationPathEnum.SETTING, iconName: 'settings'},
  {
    title: StringResources.LOVS,
    children:
      [
        {title: StringResources.BLOOD_SUGAR, path: NavigationPathEnum.BLOOD_SUGAR, iconName: 'description'},
        {title: StringResources.EATING_HABIT, path: NavigationPathEnum.EATING_HABIT, iconName: 'description'},
        {title: StringResources.GENDER, path: NavigationPathEnum.GENDER, iconName: 'description'},
        {title: StringResources.HEALTH_PARAMETERS, path: NavigationPathEnum.HEALTH_PARAMETERS, iconName: 'description'},
        {title: StringResources.LIFESTYLE, path: NavigationPathEnum.LIFESTYLE, iconName: 'description'},
        {title: StringResources.MARITAL_STATUS, path: NavigationPathEnum.MARITAL_STATUS, iconName: 'description'},
        {title: StringResources.RELIGION, path: NavigationPathEnum.RELIGION, iconName: 'description'},
        {title: StringResources.SLEEPING_PATTERN, path: NavigationPathEnum.SLEEPING_PATTERN, iconName: 'description'},
        {
          title: StringResources.TYPE_OF_EXERCISE,
          path: NavigationPathEnum.TYPE_OF_EXERCISE,
          iconName: 'fitness_center'
        },
        {title: StringResources.URINE_OUTPUT, path: NavigationPathEnum.URINE_OUTPUT, iconName: 'description'},
        {title: StringResources.NUTRITIVE, path: NavigationPathEnum.NUTRITIVE, iconName: 'description'},
        {title: StringResources.RECIPE_CATEGORY, path: NavigationPathEnum.RECIPE_CATEGORY, iconName: 'description'},
        {title: StringResources.RECIPE_CUISINE, path: NavigationPathEnum.RECIPE_CUISINE, iconName: 'description'},
        {title: StringResources.CALL_TYPE, path: NavigationPathEnum.CALL_TYPE, iconName: 'phone_in_talk'},
        {title: StringResources.CALL_PURPOSE, path: NavigationPathEnum.CALL_PURPOSE, iconName: 'on_device_training'},
        {title: StringResources.BLOG_CATEGORY, path: NavigationPathEnum.BLOG_CATEGORY, iconName: 'description'},
        {title: StringResources.BLOG_AUTHOR, path: NavigationPathEnum.BLOG_AUTHOR, iconName: 'person_pin'},
        {title: StringResources.PROGRAM_CATEGORY, path: NavigationPathEnum.PROGRAM_CATEGORY, iconName: 'person_pin'},
        {title: StringResources.FAQ_CATEGORY, path: NavigationPathEnum.FAQ_CATEGORY, iconName: 'person_pin'},
        {title: StringResources.COUNTRY, path: NavigationPathEnum.COUNTRY, iconName: 'description'},
        {title: StringResources.STATE, path: NavigationPathEnum.STATE, iconName: 'description'},
      ],
    iconName: 'description'
  }
];
