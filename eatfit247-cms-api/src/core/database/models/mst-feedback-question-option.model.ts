import { BelongsTo, Column, CreatedAt, DataType, Model, Table, UpdatedAt } from 'sequelize-typescript';
import { MstAdminUser } from './mst-admin-user.model';
import { MstFeedbackQuestion } from './mst-feedback-question.model';

@Table({
  modelName: 'mst_feedback_question_option',
  schema: 'public',
})
export class MstFeedbackQuestionOption extends Model<MstFeedbackQuestionOption> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    field: 'feedback_question_option_id',
    autoIncrement: true,
  })
  feedbackQuestionOptionId: number;

  @Column({
    allowNull: false,
    field: 'feedback_question_option',
    type: DataType.STRING(50),
  })
  feedbackQuestionOption: string;

  @BelongsTo(() => MstFeedbackQuestion, {
    foreignKey: 'feedbackQuestionId',
    targetKey: 'feedbackQuestionId',
    as: 'FeedbackQuestion',
  })
  @Column({
    allowNull: false,
    field: 'feedback_question_id',
    type: DataType.INTEGER,
  })
  feedbackQuestionId: string;

  @Column({
    allowNull: false,
    defaultValue: true,
    field: 'active',
  })
  active: boolean;

  @BelongsTo(() => MstAdminUser, {
    foreignKey: 'createdBy',
    targetKey: 'adminId',
    as: 'CreatedBy',
  })
  @Column({
    allowNull: false,
    field: 'created_by',
  })
  createdBy: number;

  @CreatedAt
  @Column({
    allowNull: false,
    field: 'created_at',
  })
  createdAt: Date;

  @BelongsTo(() => MstAdminUser, {
    foreignKey: 'modifiedBy',
    targetKey: 'adminId',
    as: 'ModifiedBy',
  })
  @Column({
    allowNull: false,
    field: 'modified_by',
  })
  modifiedBy: number;

  @UpdatedAt
  @Column({
    allowNull: false,
    field: 'updated_at',
  })
  updatedAt: Date;

  @Column({
    allowNull: false,
    field: 'created_ip',
  })
  createdIp: string;

  @Column({
    allowNull: false,
    field: 'modified_ip',
  })
  modifiedIp: string;
}
