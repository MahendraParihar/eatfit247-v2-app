import { BelongsTo, Column, CreatedAt, DataType, HasMany, Model, Scopes, Table, UpdatedAt } from 'sequelize-typescript';
import { MstAdminUser, getCreatedByUserInclude, getUpdatedByUserInclude } from '@server/common';
import { IMediaUpload, InputLengthEnum } from 'eatfit247-shared-lib';
import { MstProgramPlanType } from './mst-program-plan-type.model';
import { TxnProgramPlanFees } from './txn-program-plan-fees.model';

@Table({
  freezeTableName: true,
  modelName: 'mst_program_plans',
  schema: 'public',
  tableName: 'mst_program_plans',
})
@Scopes(() => ({
  list: {
    include: [
      getCreatedByUserInclude(false),
      getUpdatedByUserInclude(false),
      {
        model: MstProgramPlanType,
        as: 'programPlanType',
        required: false,
        attributes: ['programPlanTypeId', 'programPlanType'],
      },
    ],
  },
  details: {
    include: [
      getCreatedByUserInclude(false),
      getUpdatedByUserInclude(false),
      {
        model: MstProgramPlanType,
        as: 'programPlanType',
        required: false,
        attributes: ['programPlanTypeId', 'programPlanType'],
      },
      {
        model: TxnProgramPlanFees,
        as: 'programPlanFees',
        required: false,
        attributes: ['programPlanFeesId', 'programPlanId', 'currencyCode', 'fees'],
      },
    ],
  },
}))
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
  imagePath: IMediaUpload[];
  @Column({
    allowNull: false,
    field: 'sequence_number',
    type: DataType.INTEGER,
  })
  sequenceNumber: number;
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
  @BelongsTo(() => MstProgramPlanType, {
    as: 'programPlanType',
    foreignKey: 'programPlanTypeId',
    targetKey: 'programPlanTypeId',
  })
  programPlanType: MstProgramPlanType;
  @Column({
    allowNull: false,
    field: 'program_plan_type_id',
    type: DataType.INTEGER,
  })
  programPlanTypeId: number;
  @Column({
    allowNull: false,
    defaultValue: true,
    field: 'is_online',
    type: DataType.BOOLEAN,
  })
  isOnline: boolean;
  @Column({
    allowNull: false,
    defaultValue: false,
    field: 'is_visible_on_web',
    type: DataType.BOOLEAN,
  })
  isVisibleOnWeb: boolean;
  @Column({
    allowNull: false,
    defaultValue: true,
    field: 'active',
    type: DataType.BOOLEAN,
  })
  active: boolean;
  @BelongsTo(() => MstAdminUser, {
    as: 'createdByUser',
    foreignKey: 'createdBy',
    targetKey: 'adminId',
  })
  createdByUser: MstAdminUser;
  @BelongsTo(() => MstAdminUser, {
    as: 'updatedByUser',
    foreignKey: 'modifiedBy',
    targetKey: 'adminId',
  })
  updatedByUser: MstAdminUser;
  @Column({
    allowNull: false,
    field: 'created_by',
    type: DataType.INTEGER,
  })
  createdBy: number;
  @CreatedAt
  @Column({
    allowNull: false,
    field: 'created_at',
  })
  declare createdAt: Date;
  @Column({
    allowNull: false,
    field: 'modified_by',
    type: DataType.INTEGER,
  })
  modifiedBy: number;
  @UpdatedAt
  @Column({
    allowNull: false,
    field: 'updated_at',
  })
  declare updatedAt: Date;
  @Column({
    allowNull: false,
    field: 'created_ip',
    type: DataType.STRING(InputLengthEnum.IP),
  })
  createdIp: string;
  @Column({
    allowNull: false,
    field: 'modified_ip',
    type: DataType.STRING(InputLengthEnum.IP),
  })
  modifiedIp: string;
  @HasMany(() => TxnProgramPlanFees, { foreignKey: 'programPlanId' })
  programPlanFees: TxnProgramPlanFees[];
}

