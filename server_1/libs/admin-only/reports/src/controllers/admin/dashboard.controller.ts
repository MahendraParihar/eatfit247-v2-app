import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AbilitiesGuard, CurrentUser, JwtAuthGuard, RequireAbility } from '@server_1/core';
import {
  AdminActionEnum,
  AdminSubjectEnum,
  IAccountKpis,
  IAuthUser,
  IContentKpis,
  IDashboardKpis,
  IEngagementData,
  IExpiringDietPlan,
  IFranchiseKpis,
  IMemberGrowthData,
  INutritionistKpis,
  IOperationsSnapshot,
  IOrdersByStatus,
  IPaymentCollectionStatus,
  IProgramPerformanceData,
  IRecentContentActivity,
  IRevenueData,
  IShippingKpis,
  ITaxSummary,
  IUpcomingAppointment,
} from '@eatfit247-shared-lib';
import { DashboardService } from '../../services';

@Controller('reports/dashboard')
@UseGuards(JwtAuthGuard, AbilitiesGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  // ---- Existing (Business / SuperAdmin) ----

  @Get('kpis')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.Dashboard)
  async getKpis(): Promise<IDashboardKpis> {
    return await this.dashboardService.getKpis();
  }

  @Get('revenue')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.Dashboard)
  async getRevenueData(): Promise<IRevenueData> {
    return await this.dashboardService.getRevenueData();
  }

  @Get('members')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.Dashboard)
  async getMemberGrowthData(
    @Query('period') period: 'weekly' | 'monthly' = 'monthly',
  ): Promise<IMemberGrowthData> {
    return await this.dashboardService.getMemberGrowthData(period);
  }

  @Get('programs')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.Dashboard)
  async getProgramPerformanceData(): Promise<IProgramPerformanceData[]> {
    return await this.dashboardService.getProgramPerformanceData();
  }

  @Get('tasks')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.Dashboard)
  async getOperationsSnapshot(): Promise<IOperationsSnapshot> {
    return await this.dashboardService.getOperationsSnapshot();
  }

  @Get('engagement')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.Dashboard)
  async getEngagementData(): Promise<IEngagementData> {
    return await this.dashboardService.getEngagementData();
  }

  // ---- Nutritionist ----

  @Get('nutritionist-kpis')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.Dashboard)
  async getNutritionistKpis(
    @CurrentUser() user: IAuthUser,
  ): Promise<INutritionistKpis> {
    return await this.dashboardService.getNutritionistKpis(user.adminId, user.franchiseIds);
  }

  @Get('upcoming-appointments')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.Appointment)
  async getUpcomingAppointments(
    @CurrentUser() user: IAuthUser,
  ): Promise<IUpcomingAppointment[]> {
    return await this.dashboardService.getUpcomingAppointments(user.adminId, user.franchiseIds);
  }

  @Get('expiring-diet-plans')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.MemberDietPlan)
  async getExpiringDietPlans(
    @CurrentUser() user: IAuthUser,
  ): Promise<IExpiringDietPlan[]> {
    return await this.dashboardService.getExpiringDietPlans(user.adminId, user.franchiseIds);
  }

  // ---- Finance / Account ----

  @Get('account-kpis')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.Dashboard)
  async getAccountKpis(): Promise<IAccountKpis> {
    return await this.dashboardService.getAccountKpis();
  }

  @Get('tax-summary')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.TaxMaster)
  async getTaxSummary(): Promise<ITaxSummary> {
    return await this.dashboardService.getTaxSummary();
  }

  @Get('payment-collection')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.MemberPayment)
  async getPaymentCollectionStatus(): Promise<IPaymentCollectionStatus> {
    return await this.dashboardService.getPaymentCollectionStatus();
  }

  // ---- Shipping / Product ----

  @Get('shipping-kpis')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.Dashboard)
  async getShippingKpis(): Promise<IShippingKpis> {
    return await this.dashboardService.getShippingKpis();
  }

  @Get('orders-by-status')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.ProductOrder)
  async getOrdersByStatus(): Promise<IOrdersByStatus[]> {
    return await this.dashboardService.getOrdersByStatus();
  }

  @Get('monthly-order-volume')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.Shipment)
  async getMonthlyOrderVolume(): Promise<{ data: { month: string; orders: number }[] }> {
    return await this.dashboardService.getMonthlyOrderVolume();
  }

  // ---- Franchise ----

  @Get('franchise-kpis')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.Dashboard)
  async getFranchiseKpis(
    @CurrentUser() user: IAuthUser,
  ): Promise<IFranchiseKpis> {
    return await this.dashboardService.getFranchiseKpis(user.franchiseIds);
  }

  // ---- Content ----

  @Get('content-kpis')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.Dashboard)
  async getContentKpis(): Promise<IContentKpis> {
    return await this.dashboardService.getContentKpis();
  }

  @Get('recent-content')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.Blog)
  async getRecentContentActivity(): Promise<IRecentContentActivity[]> {
    return await this.dashboardService.getRecentContentActivity();
  }
}
