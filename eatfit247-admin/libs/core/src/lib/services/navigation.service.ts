import { Injectable } from '@angular/core';
import { MenuItem, NavSection } from '../interfaces/nav-item';

const NAV_CONFIG: NavSection[] = [
  {
    label: 'Overview',
    items: [{ label: 'Dashboard', icon: 'dashboard', route: '/dashboard' }],
  },
  {
    label: 'Content',
    items: [
      { label: 'Blogs', icon: 'article', route: '/blogs' },
      { label: 'FAQ', icon: 'help', route: '/faq' },
      { label: 'Recipes', icon: 'restaurant', route: '/recipes' },
      { label: 'Pocket Guide', icon: 'menu_book', route: '/pocket-guide' },
      { label: 'Media & Press', icon: 'perm_media', route: '/media-press' },
      { label: 'Banners', icon: 'image', route: '/banners' },
      {
        label: 'Success Stories',
        icon: 'emoji_events',
        route: '/success-stories',
      },
      { label: 'Legal Pages', icon: 'gavel', route: '/legal-pages' },
      { label: 'SEO Pages', icon: 'search', route: '/seo-page' },
    ],
  },
  {
    label: 'Commerce',
    items: [
      { label: 'Members', icon: 'people', route: '/members' },
      { label: 'Programs', icon: 'fitness_center', route: '/programs' },
      { label: 'Program Plans', icon: 'payment', route: '/program-plans' },
      { label: 'Products', icon: 'inventory', route: '/products' },
      { label: 'Promo Codes', icon: 'local_offer', route: '/promo-code' },
      { label: 'Tax Master', icon: 'account_balance', route: '/tax-master' },
      {
        label: 'Diet Template',
        icon: 'restaurant_menu',
        route: '/diet-template',
      },
    ],
  },
  {
    label: 'Operations',
    items: [
      { label: 'Call Logs', icon: 'phone', route: '/call-logs' },
      { label: 'Appointments', icon: 'event', route: '/appointments' },
      { label: 'Referrer', icon: 'person_add', route: '/referrer' },
      { label: 'Franchise', icon: 'business', route: '/franchise' },
    ],
  },
  {
    label: 'Delivery',
    items: [
      {
        label: 'Courier Providers',
        icon: 'business',
        route: '/delivery/courier-providers',
      },
      {
        label: 'Courier Provider Accounts',
        icon: 'account_circle',
        route: '/delivery/courier-provider-accounts',
      },
      {
        label: 'Warehouses',
        icon: 'warehouse',
        route: '/delivery/warehouses',
      },
      {
        label: 'Courier Provider Warehouse Mapping',
        icon: 'local_shipping',
        route: '/delivery/courier-provider-warehouses',
      },
    ],
  },
  {
    label: 'Reports',
    items: [
      { label: 'Payment Report', icon: 'payment', route: '/reports/payment' },
      {
        label: 'Contact Form Report',
        icon: 'contact_mail',
        route: '/reports/contact-form',
      },
      {
        label: 'Member Product Report',
        icon: 'inventory',
        route: '/reports/member-product',
      },
      {
        label: 'Member Issues Report',
        icon: 'report_problem',
        route: '/reports/member-issues',
      },
    ],
  },
  {
    label: 'System',
    items: [
      {
        label: 'Admin Users',
        icon: 'admin_panel_settings',
        route: '/admin-user',
      },
      {
        label: 'LOV Master',
        icon: 'list',
        children: [
          { label: 'Gender', icon: 'person', route: '/lov-master/gender' },
          {
            label: 'Blood Sugar',
            icon: 'bloodtype',
            route: '/lov-master/blood-sugar',
          },
          {
            label: 'Health Issue',
            icon: 'health_and_safety',
            route: '/lov-master/health-issue',
          },
          {
            label: 'Eating Habit',
            icon: 'restaurant_menu',
            route: '/lov-master/eating-habit',
          },
          {
            label: 'Lifestyle',
            icon: 'self_improvement',
            route: '/lov-master/lifestyle',
          },
          {
            label: 'Marital Status',
            icon: 'favorite',
            route: '/lov-master/marital-status',
          },
          { label: 'Religion', icon: 'church', route: '/lov-master/religion' },
          {
            label: 'Sleeping Pattern',
            icon: 'bedtime',
            route: '/lov-master/sleeping-pattern',
          },
          {
            label: 'Type of Exercise',
            icon: 'fitness_center',
            route: '/lov-master/type-of-exercise',
          },
          {
            label: 'Urine Output',
            icon: 'water_drop',
            route: '/lov-master/urine-output',
          },
          {
            label: 'Health Parameter',
            icon: 'monitor_heart',
            route: '/lov-master/health-parameter',
          },
          {
            label: 'Health Parameter Unit',
            icon: 'straighten',
            route: '/lov-master/health-parameter-unit',
          },
          {
            label: 'Call Purpose',
            icon: 'phone_callback',
            route: '/lov-master/call-purpose',
          },
          {
            label: 'Call Log Status',
            icon: 'phone_in_talk',
            route: '/lov-master/call-log-status',
          },
          { label: 'Call Type', icon: 'call', route: '/lov-master/call-type' },
          {
            label: 'Blog Author',
            icon: 'person',
            route: '/lov-master/blog-author',
          },
          {
            label: 'Blog Category',
            icon: 'category',
            route: '/lov-master/blog-category',
          },
          {
            label: 'Blog Comments',
            icon: 'comment',
            route: '/lov-master/blog-comments',
          },
          {
            label: 'FAQ Category',
            icon: 'help_outline',
            route: '/lov-master/faq-category',
          },
          {
            label: 'Issue Category',
            icon: 'category',
            route: '/lov-master/issue-category',
          },
          {
            label: 'Issue Status',
            icon: 'flag',
            route: '/lov-master/issue-status',
          },
          {
            label: 'Program Category',
            icon: 'category',
            route: '/lov-master/program-category',
          },
          {
            label: 'Recipe Category',
            icon: 'category',
            route: '/lov-master/recipe-category',
          },
          {
            label: 'Recipe Cuisine',
            icon: 'restaurant',
            route: '/lov-master/recipe-cuisine',
          },
          {
            label: 'Recipe Type',
            icon: 'restaurant_menu',
            route: '/lov-master/recipe-type',
          },
          { label: 'Country', icon: 'public', route: '/lov-master/country' },
          { label: 'State', icon: 'map', route: '/lov-master/state' },
        ],
      },
    ],
  },
];

@Injectable({ providedIn: 'root' })
export class NavigationService {
  readonly navSections: NavSection[] = NAV_CONFIG;
}
