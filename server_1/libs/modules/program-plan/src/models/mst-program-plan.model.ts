import { BelongsTo, Column, CreatedAt, DataType, HasMany, Model, Scopes, Table, UpdatedAt } from 'sequelize-typescript';
import { getCreatedByUserInclude, getUpdatedByUserInclude, MstAdminUser } from '@server_1/core';
import { IMediaUpload, InputLengthEnum } from '@eatfit247-shared-lib';
import { MstProgramPlanFees } from './mst-program-plan-fees.model';

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
    ],
  },
  details: {
    include: [
      getCreatedByUserInclude(false),
      getUpdatedByUserInclude(false),
      {
        model: MstProgramPlanFees,
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
  declare programPlanId: number;
  @Column({
    allowNull: false,
    field: 'plan',
    type: DataType.STRING(100),
  })
  declare plan: string;
  @Column({
    allowNull: false,
    field: 'url',
    type: DataType.STRING(250),
  })
  declare url: string;
  @Column({
    allowNull: true,
    field: 'details',
    type: DataType.TEXT,
  })
  declare details: string;
  @Column({
    allowNull: true,
    field: 'image_path',
    type: DataType.JSONB,
  })
  declare imagePath: IMediaUpload[];
  @Column({
    allowNull: false,
    field: 'sequence_number',
    type: DataType.INTEGER,
  })
  declare sequenceNumber: number;
  @Column({
    allowNull: false,
    defaultValue: 1,
    field: 'no_of_cycle',
    type: DataType.INTEGER,
  })
  declare noOfCycle: number;
  @Column({
    allowNull: false,
    defaultValue: 1,
    field: 'no_of_days_in_cycle',
    type: DataType.INTEGER,
  })
  declare noOfDaysInCycle: number;
  @Column({
    allowNull: false,
    defaultValue: true,
    field: 'is_online',
    type: DataType.BOOLEAN,
  })
  declare isOnline: boolean;
  @Column({
    allowNull: false,
    defaultValue: false,
    field: 'is_visible_on_web',
    type: DataType.BOOLEAN,
  })
  declare isVisibleOnWeb: boolean;
  @Column({
    allowNull: false,
    defaultValue: true,
    field: 'active',
    type: DataType.BOOLEAN,
  })
  declare active: boolean;
  @BelongsTo(() => MstAdminUser, {
    as: 'createdByUser',
    foreignKey: 'createdBy',
    targetKey: 'adminId',
  })
  declare createdByUser: MstAdminUser;
  @BelongsTo(() => MstAdminUser, {
    as: 'updatedByUser',
    foreignKey: 'modifiedBy',
    targetKey: 'adminId',
  })
  declare updatedByUser: MstAdminUser;
  @Column({
    allowNull: false,
    field: 'created_by',
    type: DataType.INTEGER,
  })
  declare createdBy: number;
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
  declare modifiedBy: number;
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
  declare createdIp: string;
  @Column({
    allowNull: false,
    field: 'modified_ip',
    type: DataType.STRING(InputLengthEnum.IP),
  })
  declare modifiedIp: string;
  @HasMany(() => MstProgramPlanFees, { foreignKey: 'programPlanId' })
  declare programPlanFees: MstProgramPlanFees[];
}

