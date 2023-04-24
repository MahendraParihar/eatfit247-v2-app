import { BelongsTo, Column, CreatedAt, DataType, Model, Table, UpdatedAt } from 'sequelize-typescript';
import { MstAdminUser } from './mst-admin-user.model';
import { MstFeedbackOptionType } from './mst-feedback-option-type.model';

@Table({
  modelName: 'mst_feedback_question',
  schema: 'public',
})
export class MstFeedbackQuestion extends Model<MstFeedbackQuestion> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    field: 'feedback_question_id',
    autoIncrement: true,
  })
  feedbackQuestionId: number;

  @Column({
    allowNull: false,
    field: 'feedback_question',
    type: DataType.STRING(500),
  })
  feedbackQuestion: string;

  @BelongsTo(() => MstFeedbackOptionType, {
    foreignKey: 'feedbackOptionTypeId',
    targetKey: 'feedbackOptionTypeId',
    as: 'FeedbackOptionType',
  })
  @Column({
    allowNull: false,
    field: 'feedback_option_type_id',
    type: DataType.INTEGER,
  })
  feedbackOptionTypeId: string;

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
