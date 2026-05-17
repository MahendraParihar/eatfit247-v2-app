import { Type } from '@angular/core';
import { AdminSubjectEnum } from '@eatfit247-shared-lib';

export type WidgetSize = 'full' | 'half' | 'third';

export interface WidgetConfig {
  id: string;
  title: string;
  /** Subject(s) the user must have 'read' on to see this widget */
  requiredSubjects: AdminSubjectEnum[];
  /** 'any' = at least one subject matched, 'all' = every subject must match */
  matchMode: 'any' | 'all';
  /** CSS grid sizing hint */
  size: WidgetSize;
  /** Display order — lower numbers appear first */
  order: number;
  /** Lazy loader returning the component class */
  load: () => Promise<Type<unknown>>;
}

/**
 * Central widget registry.
 * Each entry declares which permissions are required to show the widget.
 * When a new DB role is assigned subjects, matching widgets appear automatically.
 */
export const WIDGET_REGISTRY: WidgetConfig[] = [
  // ---- Business / Super Admin KPIs ----
  {
    id: 'kpi-business',
    title: 'Business Overview',
    requiredSubjects: [AdminSubjectEnum.Dashboard, AdminSubjectEnum.Member, AdminSubjectEnum.MemberPayment],
    matchMode: 'all',
    size: 'full',
    order: 10,
    load: () =>
      import('./components/kpi-card-section/kpi-card-section.component').then(
        (m) => m.KpiCardSectionComponent,
      ),
  },

  // ---- Nutritionist KPIs ----
  {
    id: 'kpi-nutritionist',
    title: 'Nutrition Overview',
    requiredSubjects: [AdminSubjectEnum.MemberDietPlan, AdminSubjectEnum.MemberAssessment],
    matchMode: 'all',
    size: 'full',
    order: 11,
    load: () =>
      import('./components/nutritionist-kpi-section/nutritionist-kpi-section.component').then(
        (m) => m.NutritionistKpiSectionComponent,
      ),
  },

  // ---- Account / Finance KPIs ----
  {
    id: 'kpi-account',
    title: 'Financial Overview',
    requiredSubjects: [AdminSubjectEnum.MemberPayment, AdminSubjectEnum.TaxMaster],
    matchMode: 'all',
    size: 'full',
    order: 12,
    load: () =>
      import('./components/account-kpi-section/account-kpi-section.component').then(
        (m) => m.AccountKpiSectionComponent,
      ),
  },

  // ---- Shipping KPIs ----
  {
    id: 'kpi-shipping',
    title: 'Shipping Overview',
    requiredSubjects: [AdminSubjectEnum.ProductOrder, AdminSubjectEnum.Shipment],
    matchMode: 'all',
    size: 'full',
    order: 13,
    load: () =>
      import('./components/shipping-kpi-section/shipping-kpi-section.component').then(
        (m) => m.ShippingKpiSectionComponent,
      ),
  },

  // ---- Franchise KPIs ----
  {
    id: 'kpi-franchise',
    title: 'Franchise Overview',
    requiredSubjects: [AdminSubjectEnum.Franchise, AdminSubjectEnum.Member],
    matchMode: 'all',
    size: 'full',
    order: 14,
    load: () =>
      import('./components/franchise-kpi-section/franchise-kpi-section.component').then(
        (m) => m.FranchiseKpiSectionComponent,
      ),
  },

  // ---- Content KPIs ----
  {
    id: 'kpi-content',
    title: 'Content Overview',
    requiredSubjects: [AdminSubjectEnum.Blog, AdminSubjectEnum.Recipe],
    matchMode: 'any',
    size: 'full',
    order: 15,
    load: () =>
      import('./components/content-kpi-section/content-kpi-section.component').then(
        (m) => m.ContentKpiSectionComponent,
      ),
  },

  // ---- Detail Widgets ----
  {
    id: 'revenue-chart',
    title: 'Revenue',
    requiredSubjects: [AdminSubjectEnum.MemberPayment],
    matchMode: 'all',
    size: 'half',
    order: 20,
    load: () =>
      import('./components/revenue-chart/revenue-chart.component').then(
        (m) => m.RevenueChartComponent,
      ),
  },
  {
    id: 'member-growth',
    title: 'Member Growth',
    requiredSubjects: [AdminSubjectEnum.Member],
    matchMode: 'all',
    size: 'half',
    order: 21,
    load: () =>
      import('./components/member-growth-chart/member-growth-chart.component').then(
        (m) => m.MemberGrowthChartComponent,
      ),
  },
  {
    id: 'upcoming-appointments',
    title: 'Upcoming Appointments',
    requiredSubjects: [AdminSubjectEnum.Appointment],
    matchMode: 'all',
    size: 'half',
    order: 22,
    load: () =>
      import('./components/upcoming-appointments/upcoming-appointments.component').then(
        (m) => m.UpcomingAppointmentsComponent,
      ),
  },
  {
    id: 'expiring-diet-plans',
    title: 'Expiring Diet Plans',
    requiredSubjects: [AdminSubjectEnum.MemberDietPlan],
    matchMode: 'all',
    size: 'half',
    order: 23,
    load: () =>
      import('./components/expiring-diet-plans/expiring-diet-plans.component').then(
        (m) => m.ExpiringDietPlansComponent,
      ),
  },
  {
    id: 'program-performance',
    title: 'Program Performance',
    requiredSubjects: [AdminSubjectEnum.Program],
    matchMode: 'all',
    size: 'half',
    order: 24,
    load: () =>
      import('./components/program-performance-chart/program-performance-chart.component').then(
        (m) => m.ProgramPerformanceChartComponent,
      ),
  },
  {
    id: 'operations-summary',
    title: 'Operations',
    requiredSubjects: [AdminSubjectEnum.MemberIssues],
    matchMode: 'all',
    size: 'half',
    order: 30,
    load: () =>
      import('./components/operations-summary/operations-summary.component').then(
        (m) => m.OperationsSummaryComponent,
      ),
  },
  {
    id: 'tax-summary',
    title: 'Tax Summary',
    requiredSubjects: [AdminSubjectEnum.TaxMaster],
    matchMode: 'all',
    size: 'half',
    order: 31,
    load: () =>
      import('./components/tax-summary/tax-summary.component').then(
        (m) => m.TaxSummaryComponent,
      ),
  },
  {
    id: 'payment-collection',
    title: 'Payment Collection',
    requiredSubjects: [AdminSubjectEnum.MemberPayment],
    matchMode: 'all',
    size: 'half',
    order: 32,
    load: () =>
      import('./components/payment-collection/payment-collection.component').then(
        (m) => m.PaymentCollectionComponent,
      ),
  },
  {
    id: 'orders-by-status',
    title: 'Orders Pipeline',
    requiredSubjects: [AdminSubjectEnum.ProductOrder],
    matchMode: 'all',
    size: 'half',
    order: 33,
    load: () =>
      import('./components/orders-by-status/orders-by-status.component').then(
        (m) => m.OrdersByStatusComponent,
      ),
  },
  {
    id: 'monthly-order-volume',
    title: 'Monthly Orders',
    requiredSubjects: [AdminSubjectEnum.Shipment],
    matchMode: 'all',
    size: 'half',
    order: 34,
    load: () =>
      import('./components/monthly-order-volume/monthly-order-volume.component').then(
        (m) => m.MonthlyOrderVolumeComponent,
      ),
  },
  {
    id: 'recent-content',
    title: 'Recent Content',
    requiredSubjects: [AdminSubjectEnum.Blog],
    matchMode: 'all',
    size: 'half',
    order: 35,
    load: () =>
      import('./components/recent-content/recent-content.component').then(
        (m) => m.RecentContentComponent,
      ),
  },

  // ---- Quick Actions (shown to all with Dashboard:read) ----
  {
    id: 'quick-actions',
    title: 'Quick Actions',
    requiredSubjects: [AdminSubjectEnum.Dashboard],
    matchMode: 'all',
    size: 'full',
    order: 100,
    load: () =>
      import('./components/quick-actions/quick-actions.component').then(
        (m) => m.QuickActionsComponent,
      ),
  },
];

/**
 * Resolve widgets visible to a user based on their permissions dictionary.
 * Multi-role users see the union of all matching widgets (de-duplicated by registry position).
 */
export function resolveWidgetsForUser(permissions: Record<string, string[]>): WidgetConfig[] {
  const hasRead = (subject: string): boolean => {
    const actions = permissions[subject];
    return !!actions && actions.includes('read');
  };

  return WIDGET_REGISTRY.filter((widget) => {
    if (widget.requiredSubjects.length === 0) return true;

    if (widget.matchMode === 'all') {
      return widget.requiredSubjects.every(hasRead);
    }
    return widget.requiredSubjects.some(hasRead);
  }).sort((a, b) => a.order - b.order);
}
