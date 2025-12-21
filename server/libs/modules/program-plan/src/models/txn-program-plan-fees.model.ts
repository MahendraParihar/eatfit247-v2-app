import { BelongsTo, Column, CreatedAt, DataType, Model, Scopes, Table, UpdatedAt } from 'sequelize-typescript';
import { MstAdminUser, getCreatedByUserInclude, getUpdatedByUserInclude } from '@server/common';
import { InputLengthEnum } from 'eatfit247-shared-lib';
import { MstProgramPlan } from './mst-program-plan.model';

@Table({
  freezeTableName: true,
  modelName: 'txn_program_plan_fees',
  schema: 'public',
  tableName: 'txn_program_plan_fees',
})
@Scopes(() => ({
  list: {
    include: [
      getCreatedByUserInclude(false),
      getUpdatedByUserInclude(false),
      {
        model: MstProgramPlan,
        as: 'programPlan',
        required: false,
        attributes: ['programPlanId', 'plan'],
      },
    ],
  },
  details: {
    include: [
      getCreatedByUserInclude(false),
      getUpdatedByUserInclude(false),
      {
        model: MstProgramPlan,
        as: 'programPlan',
        required: false,
        attributes: ['programPlanId', 'plan'],
      },
    ],
  },
}))
export class TxnProgramPlanFees extends Model<TxnProgramPlanFees> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    field: 'program_plan_fees_id',
    autoIncrement: true,
  })
  declare programPlanFeesId: number;
  @Column({
    allowNull: false,
    field: 'program_plan_id',
    type: DataType.INTEGER,
  })
  declare programPlanId: number;
  @Column({
    allowNull: false,
    field: 'currency_code',
    type: DataType.STRING(100),
  })
  declare currencyCode: string;
  @Column({
    allowNull: false,
    field: 'fees',
    type: DataType.DOUBLE,
  })
  declare fees: number;
  @Column({
    allowNull: false,
    defaultValue: true,
    field: 'active',
    type: DataType.BOOLEAN,
  })
  declare active: boolean;
  @BelongsTo(() => MstProgramPlan, {
    as: 'programPlan',
    foreignKey: 'programPlanId',
    targetKey: 'programPlanId',
  })
  declare programPlan: MstProgramPlan;
  @BelongsTo(() => MstAdminUser, {
    as: 'createdByUser',
    foreignKey: 'createdBy',
    targetKey: 'adminId',
  })
  declare createdByUser: MstAdminUser;
  @BelongsTo(() => MstAdminUser, {
    as: 'updatedByUser',
    foreignKey: 'updatedBy',
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
    field: 'updated_by',
    type: DataType.INTEGER,
  })
  declare updatedBy: number;
  @UpdatedAt
  @Column({
    allowNull: false,
    field: 'updated_at',
  })
  declare updatedAt: Date;
  @Column({
    allowNull: true,
    field: 'created_ip',
    type: DataType.STRING(InputLengthEnum.IP),
  })
  declare createdIp: string;
  @Column({
    allowNull: true,
    field: 'modified_ip',
    type: DataType.STRING(InputLengthEnum.IP),
  })
  declare modifiedIp: string;
}
