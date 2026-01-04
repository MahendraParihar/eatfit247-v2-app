import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/sequelize';
import { Sequelize, Op } from 'sequelize';
import {
  TxnMember,
  TxnMemberPayment,
  TxnMemberIssue,
  TxnMemberHealthParameterLog,
  TxnMemberDietPlan,
  TxnAssessment,
} from '../models';
import { PaymentStatusEnum } from '@eatfit247-shared-lib';
import { MemberService } from './member.service';
import { MemberPaymentService } from './member-payment.service';
import { MemberIssueService } from './member-issue.service';
import { MemberHealthParameterLogsService } from './member-health-parameter-logs.service';
import { MemberAssessmentService } from './member-assessment.service';
import { MemberDietPlanService } from './member-diet-plan.service';

@Injectable()
export class MemberDashboardService {
  constructor(
    @InjectModel(TxnMember) private readonly memberRepository: typeof TxnMember,
    @InjectModel(TxnMemberPayment)
    private readonly memberPaymentRepository: typeof TxnMemberPayment,
    @InjectModel(TxnMemberIssue)
    private readonly memberIssueRepository: typeof TxnMemberIssue,
    @InjectModel(TxnMemberHealthParameterLog)
    private readonly memberHealthParameterLogRepository: typeof TxnMemberHealthParameterLog,
    @InjectModel(TxnMemberDietPlan)
    private readonly memberDietPlanRepository: typeof TxnMemberDietPlan,
    @InjectModel(TxnAssessment)
    private readonly assessmentRepository: typeof TxnAssessment,
    private readonly memberService: MemberService,
    private readonly memberPaymentService: MemberPaymentService,
    private readonly memberIssueService: MemberIssueService,
    private readonly memberHealthParameterLogsService: MemberHealthParameterLogsService,
    private readonly memberAssessmentService: MemberAssessmentService,
    private readonly memberDietPlanService: MemberDietPlanService,
    @InjectConnection() private readonly sequelize: Sequelize,
  ) {}

  /**
   * Get dashboard summary for a member
   */
  async getDashboardSummary(memberId: number): Promise<any> {
    // Verify member exists
    const member = await this.memberRepository.findOne({
      where: { memberId },
    });
    if (!member) {
      throw new NotFoundException('Member not found');
    }

    const [
      totalPayments,
      totalPaid,
      totalPending,
      totalIssues,
      openIssues,
      totalDietPlans,
      activeDietPlans,
      totalHealthLogs,
    ] = await Promise.all([
      // Total payments count
      this.memberPaymentRepository.count({
        where: { memberId, active: true },
      }),
      // Total paid amount
      this.memberPaymentRepository.findOne({
        attributes: [
          [
            Sequelize.fn(
              'SUM',
              Sequelize.literal(
                `COALESCE((payment_obj->'user'->>'totalAmount')::numeric, (payment_obj->>'totalAmount')::numeric, 0)`,
              ),
            ),
            'total',
          ],
        ],
        where: {
          memberId,
          paymentStatusId: PaymentStatusEnum.PAID,
          active: true,
        },
        raw: true,
      }),
      // Total pending amount
      this.memberPaymentRepository.findOne({
        attributes: [
          [
            Sequelize.fn(
              'SUM',
              Sequelize.literal(
                `COALESCE((payment_obj->'user'->>'totalAmount')::numeric, (payment_obj->>'totalAmount')::numeric, 0)`,
              ),
            ),
            'total',
          ],
        ],
        where: {
          memberId,
          paymentStatusId: PaymentStatusEnum.PENDING,
          active: true,
        },
        raw: true,
      }),
      // Total issues count
      this.memberIssueRepository.count({
        where: { memberId },
      }),
      // Open issues count (all issues that are not closed/resolved)
      this.memberIssueRepository.count({
        where: {
          memberId,
        },
      }),
      // Total diet plans
      this.memberDietPlanRepository.count({
        where: { memberId, active: true },
      }),
      // Active diet plans
      this.memberDietPlanRepository.count({
        where: { memberId, active: true, isCompleted: false },
      }),
      // Total health logs
      this.memberHealthParameterLogRepository.count({
        where: { memberId },
      }),
    ]);

    return {
      member: await this.memberService.fetchById(memberId),
      payments: {
        total: totalPayments,
        totalPaid: (totalPaid as any)?.total || 0,
        totalPending: (totalPending as any)?.total || 0,
      },
      issues: {
        total: totalIssues,
        open: openIssues,
      },
      dietPlans: {
        total: totalDietPlans,
        active: activeDietPlans,
      },
      healthLogs: {
        total: totalHealthLogs,
      },
    };
  }

  /**
   * Get health progress for a member
   */
  async getHealthProgress(memberId: number): Promise<any> {
    // Verify member exists
    const member = await this.memberRepository.findOne({
      where: { memberId },
    });
    if (!member) {
      throw new NotFoundException('Member not found');
    }

    const [healthLogs, assessment] = await Promise.all([
      this.memberHealthParameterLogsService.findByMemberId(memberId),
      this.memberAssessmentService.findByMemberId(memberId),
    ]);

    // Get latest health logs grouped by parameter
    const latestLogs = healthLogs.reduce((acc: any, log: any) => {
      const paramId = log.healthParameterId;
      if (!acc[paramId] || new Date(log.logDate) > new Date(acc[paramId].logDate)) {
        acc[paramId] = log;
      }
      return acc;
    }, {});

    return {
      assessment,
      latestHealthLogs: Object.values(latestLogs),
      totalLogs: healthLogs.length,
      recentLogs: healthLogs.slice(0, 10), // Last 10 logs
    };
  }

  /**
   * Get engagement metrics for a member
   */
  async getEngagement(memberId: number): Promise<any> {
    // Verify member exists
    const member = await this.memberRepository.findOne({
      where: { memberId },
    });
    if (!member) {
      throw new NotFoundException('Member not found');
    }

    const [assessment, healthLogs, dietPlans] = await Promise.all([
      this.memberAssessmentService.findByMemberId(memberId),
      this.memberHealthParameterLogsService.findByMemberId(memberId),
      this.memberDietPlanService.getList(memberId),
    ]);

    // Calculate assessment completion rate
    const assessmentCompletion = assessment ? 100 : 0;

    // Calculate health log frequency (logs in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentLogs = healthLogs.filter(
      (log: any) => new Date(log.logDate) >= thirtyDaysAgo,
    );
    const healthLogFrequency = Math.min((recentLogs.length / 30) * 100, 100);

    // Calculate diet plan engagement
    const activePlans = dietPlans.list?.filter((plan: any) => plan.active && !plan.isCompleted) || [];
    const dietPlanEngagement = activePlans.length > 0 ? 100 : 0;

    return {
      assessment: {
        completed: !!assessment,
        completionRate: assessmentCompletion,
      },
      healthLogs: {
        total: healthLogs.length,
        recent: recentLogs.length,
        frequency: Math.round(healthLogFrequency),
      },
      dietPlans: {
        total: dietPlans.count || 0,
        active: activePlans.length,
        engagement: dietPlanEngagement,
      },
      assessmentCompletion,
      healthLogFrequency: Math.round(healthLogFrequency),
    };
  }

  /**
   * Get payments summary for a member
   */
  async getPaymentsSummary(memberId: number): Promise<any> {
    // Verify member exists
    const member = await this.memberRepository.findOne({
      where: { memberId },
    });
    if (!member) {
      throw new NotFoundException('Member not found');
    }

    const payments = await this.memberPaymentService.findAll(memberId);

    const summary = payments.tableData.reduce(
      (acc: any, payment: any) => {
        const amount =
          payment.paymentObj?.user?.totalAmount ||
          payment.paymentObj?.totalAmount ||
          0;

        if (payment.paymentStatusId === PaymentStatusEnum.PAID) {
          acc.totalPaid += amount;
          acc.paidCount += 1;
        } else if (payment.paymentStatusId === PaymentStatusEnum.PENDING) {
          acc.totalPending += amount;
          acc.pendingCount += 1;
        }

        return acc;
      },
      {
        totalPaid: 0,
        totalPending: 0,
        paidCount: 0,
        pendingCount: 0,
      },
    );

    return {
      summary,
      recentPayments: payments.tableData.slice(0, 5), // Last 5 payments
      totalPayments: payments.count,
    };
  }

  /**
   * Get issues summary for a member
   */
  async getIssuesSummary(memberId: number): Promise<any> {
    // Verify member exists
    const member = await this.memberRepository.findOne({
      where: { memberId },
    });
    if (!member) {
      throw new NotFoundException('Member not found');
    }

    const issues = await this.memberIssueService.findByMemberId(memberId);

    const summary = issues.reduce(
      (acc: any, issue: any) => {
        acc.total += 1;
        const statusName = issue.issueStatus?.issueStatus?.toLowerCase() || '';
        if (statusName.includes('closed') || statusName.includes('resolved') || statusName.includes('solved')) {
          acc.resolved += 1;
        } else {
          acc.open += 1;
        }
        return acc;
      },
      {
        total: 0,
        open: 0,
        resolved: 0,
      },
    );

    return {
      summary,
      recentIssues: issues.slice(0, 5), // Last 5 issues
      totalIssues: issues.length,
    };
  }
}

