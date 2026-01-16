import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, Sequelize } from 'sequelize';
import { TxnMember, TxnMemberDietPlan, TxnMemberIssue, TxnMemberPayment } from '@server_1/modules/member';
import {
  PaymentStatusEnum,
  IDashboardKpis,
  IRevenueData,
  IMemberGrowthData,
  IProgramPerformanceData,
  IOperationsSnapshot,
  IEngagementData,
} from '@eatfit247-shared-lib';
import moment from 'moment';

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(TxnMember)
    private readonly memberRepository: typeof TxnMember,
    @InjectModel(TxnMemberPayment)
    private readonly memberPaymentRepository: typeof TxnMemberPayment,
    @InjectModel(TxnMemberDietPlan)
    private readonly memberDietPlanRepository: typeof TxnMemberDietPlan,
    @InjectModel(TxnMemberIssue)
    private readonly memberIssueRepository: typeof TxnMemberIssue,
  ) {}

  /**
   * Get dashboard KPIs
   */
  async getKpis(): Promise<IDashboardKpis> {
    const now = moment();
    const startOfMonth = now.clone().startOf('month').toDate();
    const startOfLastMonth = now.clone().subtract(1, 'month').startOf('month').toDate();
    const endOfLastMonth = now.clone().subtract(1, 'month').endOf('month').toDate();

    // Get current month data
    const [
      totalMembers,
      newMembers,
      monthlyRevenue,
      pendingPayments,
      dietPlansSent,
      openIssues,
    ] = await Promise.all([
      // Total active members
      this.memberRepository.count({
        where: { active: true },
      }),
      // New members this month
      this.memberRepository.count({
        where: {
          active: true,
          createdAt: {
            [Op.gte]: startOfMonth,
          },
        },
      }),
      // Monthly revenue (sum of paid payments this month)
      // Extract totalAmount from JSONB paymentObj (checks user.totalAmount first, then totalAmount)
      (async () => {
        const result = await this.memberPaymentRepository.findOne({
          attributes: [
            [
              Sequelize.fn(
                'SUM',
                Sequelize.literal(
                  `COALESCE((payment_obj->'user'->>'totalAmount')::numeric, (payment_obj->>'totalAmount')::numeric, 0)`
                )
              ),
              'total',
            ],
          ],
          where: {
            paymentStatusId: PaymentStatusEnum.PAID,
            paymentDate: {
              [Op.gte]: startOfMonth,
            },
            active: true,
          },
          raw: true,
        });
        return (result as any)?.total || 0;
      })(),
      // Pending payments (sum of pending payment amounts)
      // Extract totalAmount from JSONB paymentObj (checks user.totalAmount first, then totalAmount)
      (async () => {
        const result = await this.memberPaymentRepository.findOne({
          attributes: [
            [
              Sequelize.fn(
                'SUM',
                Sequelize.literal(
                  `COALESCE((payment_obj->'user'->>'totalAmount')::numeric, (payment_obj->>'totalAmount')::numeric, 0)`
                )
              ),
              'total',
            ],
          ],
          where: {
            paymentStatusId: PaymentStatusEnum.PENDING,
            active: true,
          },
          raw: true,
        });
        return (result as any)?.total || 0;
      })(),
      // Diet plans sent (count of diet plans)
      this.memberDietPlanRepository.count({
        where: { active: true },
      }),
      // Open issues (count of issues)
      // Note: TxnMemberIssue doesn't have an active field, so we count all issues
      this.memberIssueRepository.count({
        where: {
          // Assuming open issues are those that are not in a closed/resolved status
          // You may need to adjust this based on your issue status enum
        },
      }),
    ]);

    // Get last month data for trends
    const [
      lastMonthTotalMembers,
      lastMonthNewMembers,
      lastMonthRevenue,
      lastMonthPendingPayments,
      lastMonthDietPlansSent,
      lastMonthOpenIssues,
    ] = await Promise.all([
      this.memberRepository.count({
        where: {
          active: true,
          createdAt: {
            [Op.lte]: endOfLastMonth,
          },
        },
      }),
      this.memberRepository.count({
        where: {
          active: true,
          createdAt: {
            [Op.gte]: startOfLastMonth,
            [Op.lte]: endOfLastMonth,
          },
        },
      }),
      // Extract totalAmount from JSONB paymentObj (checks user.totalAmount first, then totalAmount)
      (async () => {
        const result = await this.memberPaymentRepository.findOne({
          attributes: [
            [
              Sequelize.fn(
                'SUM',
                Sequelize.literal(
                  `COALESCE((payment_obj->'user'->>'totalAmount')::numeric, (payment_obj->>'totalAmount')::numeric, 0)`
                )
              ),
              'total',
            ],
          ],
          where: {
            paymentStatusId: PaymentStatusEnum.PAID,
            paymentDate: {
              [Op.gte]: startOfLastMonth,
              [Op.lte]: endOfLastMonth,
            },
            active: true,
          },
          raw: true,
        });
        return (result as any)?.total || 0;
      })(),
      // Extract totalAmount from JSONB paymentObj (checks user.totalAmount first, then totalAmount)
      (async () => {
        const result = await this.memberPaymentRepository.findOne({
          attributes: [
            [
              Sequelize.fn(
                'SUM',
                Sequelize.literal(
                  `COALESCE((payment_obj->'user'->>'totalAmount')::numeric, (payment_obj->>'totalAmount')::numeric, 0)`
                )
              ),
              'total',
            ],
          ],
          where: {
            paymentStatusId: PaymentStatusEnum.PENDING,
            active: true,
            createdAt: {
              [Op.lte]: endOfLastMonth,
            },
          },
          raw: true,
        });
        return (result as any)?.total || 0;
      })(),
      this.memberDietPlanRepository.count({
        where: {
          active: true,
          createdAt: {
            [Op.lte]: endOfLastMonth,
          },
        },
      }),
      // Note: TxnMemberIssue doesn't have an active field
      this.memberIssueRepository.count({
        where: {
          createdAt: {
            [Op.lte]: endOfLastMonth,
          },
        },
      }),
    ]);

    // Calculate trends (difference from last month)
    const trends = {
      totalMembers: totalMembers - lastMonthTotalMembers,
      newMembers: newMembers - lastMonthNewMembers,
      monthlyRevenue: monthlyRevenue - lastMonthRevenue,
      pendingPayments: pendingPayments - lastMonthPendingPayments,
      dietPlansSent: dietPlansSent - lastMonthDietPlansSent,
      openIssues: openIssues - lastMonthOpenIssues,
    };

    return {
      totalMembers,
      newMembers,
      monthlyRevenue: monthlyRevenue || 0,
      pendingPayments: pendingPayments || 0,
      dietPlansSent,
      openIssues,
      trends,
    };
  }

  /**
   * Get revenue data for charts
   */
  async getRevenueData(): Promise<IRevenueData> {
    // TODO: Implement actual database queries for revenue data
    const data: IRevenueData = {
      lineChart: [],
      barChart: [],
    };
    return data;
  }

  /**
   * Get member growth data
   */
  async getMemberGrowthData(period: 'weekly' | 'monthly' = 'monthly'): Promise<IMemberGrowthData> {
    // TODO: Implement actual database queries for member growth
    const data: IMemberGrowthData = {
      data: [],
      period,
    };
    return data;
  }

  /**
   * Get program performance data
   */
  async getProgramPerformanceData(): Promise<IProgramPerformanceData[]> {
    // TODO: Implement actual database queries for program performance
    return [];
  }

  /**
   * Get operations snapshot
   */
  async getOperationsSnapshot(): Promise<IOperationsSnapshot> {
    // TODO: Implement actual database queries for operations snapshot
    const data: IOperationsSnapshot = {
      todaysCalls: 0,
      pendingAssessments: 0,
      openMemberIssues: 0,
      unreadIssueResponses: 0,
    };
    return data;
  }

  /**
   * Get engagement data
   */
  async getEngagementData(): Promise<IEngagementData> {
    // TODO: Implement actual database queries for engagement data
    const data: IEngagementData = {
      dietPlansSent: 0,
      dietPlansPending: 0,
      assessmentCompletionPercent: 0,
      avgHealthLogsPerMember: 0,
    };
    return data;
  }
}
