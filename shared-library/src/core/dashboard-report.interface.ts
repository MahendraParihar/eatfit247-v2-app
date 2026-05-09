/**
 * Dashboard Report Interfaces
 * Shared interfaces for dashboard reporting across frontend and backend
 */

export interface IDashboardKpis {
  totalMembers: number;
  newMembers: number;
  monthlyRevenue: number;
  pendingPayments: number;
  dietPlansSent: number;
  openIssues: number;
  trends?: {
    totalMembers?: number;
    newMembers?: number;
    monthlyRevenue?: number;
    pendingPayments?: number;
    dietPlansSent?: number;
    openIssues?: number;
  };
}

export interface IRevenueDataPoint {
  month: string;
  revenue: number;
  paid: number;
  pending: number;
}

export interface IRevenueData {
  lineChart: IRevenueDataPoint[];
  barChart: IRevenueDataPoint[];
}

export interface IMemberGrowthDataPoint {
  period: string;
  newMembers: number;
  activeMembers: number;
}

export interface IMemberGrowthData {
  data: IMemberGrowthDataPoint[];
  period: 'weekly' | 'monthly';
}

export interface IProgramPerformanceData {
  programName: string;
  enrollment: number;
  percentage: number;
}

export interface IOperationsSnapshot {
  todaysCalls: number;
  pendingAssessments: number;
  openMemberIssues: number;
  unreadIssueResponses: number;
}

export interface IEngagementData {
  dietPlansSent: number;
  dietPlansPending: number;
  assessmentCompletionPercent: number;
  avgHealthLogsPerMember: number;
}

// ---- Nutritionist Dashboard Widgets ----

export interface INutritionistKpis {
  myClientsTotal: number;
  myClientsActive: number;
  dietPlansDueToday: number;
  pendingAssessments: number;
  expiringDietPlans: number;
  trends?: {
    myClientsActive?: number;
    dietPlansDueToday?: number;
    pendingAssessments?: number;
  };
}

export interface IUpcomingAppointment {
  appointmentId: number;
  memberName: string;
  dateTime: string;
  type: string;
  status: string;
}

export interface IExpiringDietPlan {
  memberId: number;
  memberName: string;
  planName: string;
  expiryDate: string;
  daysRemaining: number;
}

// ---- Finance Dashboard Widgets ----

export interface IAccountKpis {
  monthlyRevenue: number;
  pendingPayments: number;
  collectedPayments: number;
  gstLiability: number;
  trends?: {
    monthlyRevenue?: number;
    pendingPayments?: number;
    collectedPayments?: number;
  };
}

export interface ITaxSummary {
  totalTaxable: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalGst: number;
  period: string;
}

export interface IPaymentCollectionStatus {
  paid: number;
  pending: number;
  overdue: number;
  total: number;
}

// ---- Shipping Dashboard Widgets ----

export interface IShippingKpis {
  newOrders: number;
  pendingShipments: number;
  inTransit: number;
  delivered: number;
  monthlyOrderVolume: number;
  trends?: {
    newOrders?: number;
    delivered?: number;
  };
}

export interface IOrdersByStatus {
  status: string;
  count: number;
  percentage: number;
}

// ---- Franchise Dashboard Widgets ----

export interface IFranchiseKpis {
  franchiseRevenue: number;
  franchiseMemberCount: number;
  franchiseActivePlans: number;
  trends?: {
    franchiseRevenue?: number;
    franchiseMemberCount?: number;
  };
}

// ---- Content Dashboard Widgets ----

export interface IContentKpis {
  publishedPosts: number;
  pendingReviews: number;
  totalRecipes: number;
  totalFaqs: number;
  trends?: {
    publishedPosts?: number;
    pendingReviews?: number;
  };
}

export interface IRecentContentActivity {
  id: number;
  title: string;
  type: 'blog' | 'recipe' | 'faq' | 'success_story';
  action: 'created' | 'updated' | 'published';
  date: string;
  author: string;
}

