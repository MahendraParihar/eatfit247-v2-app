import { BelongsTo, Column, CreatedAt, DataType, Model, Table, UpdatedAt } from 'sequelize-typescript';
import { MstAdminUser } from './mst-admin-user.model';
import { MstProgramPlanType } from './mst-program-plan-type.model';

@Table({
  modelName: 'mst_program_plan',
  schema: 'public',
})
export class MstProgramPlan extends Model<MstProgramPlan> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    field: 'program_plan_id',
    autoIncrement: true,
  })
  programPlanId: number;

  @Column({
    allowNull: false,
    field: 'plan',
    type: DataType.STRING(100),
  })
  plan: string;

  @Column({
    allowNull: false,
    field: 'url',
    type: DataType.STRING(250),
  })
  url: string;

  @Column({
    allowNull: true,
    field: 'details',
    type: DataType.TEXT,
  })
  details: string;

  @Column({
    allowNull: true,
    field: 'image_path',
    type: DataType.JSONB,
  })
  imagePath: string;

  @Column({
    allowNull: true,
    field: 'tags',
    type: DataType.STRING(1000),
  })
  tags: string;

  @Column({
    allowNull: true,
    field: 'sequence_number',
    type: DataType.INTEGER,
  })
  sequenceNumber: number;

  @Column({
    allowNull: false,
    field: 'inr_amount',
    type: DataType.DOUBLE,
  })
  inrAmount: number;

  @Column({
    allowNull: false,
    defaultValue: 1,
    field: 'no_of_cycle',
    type: DataType.INTEGER,
  })
  noOfCycle: number;

  @Column({
    allowNull: false,
    defaultValue: 1,
    field: 'no_of_days_in_cycle',
    type: DataType.INTEGER,
  })
  noOfDaysInCycle: number;

  @Column({
    allowNull: false,
    defaultValue: true,
    field: 'is_online',
    type: DataType.BOOLEAN,
  })
  isOnline: boolean;

  @Column({
    allowNull: false,
    field: 'program_plan_type_id',
    type: DataType.INTEGER,
  })
  @BelongsTo(() => MstProgramPlanType, {
    foreignKey: 'programPlanTypeId',
    targetKey: 'programPlanTypeId',
    as: 'ProgramPlanType',
  })
  programPlanTypeId: number;

  @Column({
    allowNull: false,
    defaultValue: false,
    field: 'is_visible_on_web',
  })
  isVisibleOnWeb: boolean;

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
