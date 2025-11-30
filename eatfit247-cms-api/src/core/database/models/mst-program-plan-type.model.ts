import { BelongsTo, Column, CreatedAt, DataType, Model, Table, UpdatedAt } from 'sequelize-typescript';
import { MstAdminUser } from './mst-admin-user.model';

@Table({
  freezeTableName: true,
  modelName: 'mst_program_plan_types',
  schema: 'public',
})
export class MstProgramPlanType extends Model<MstProgramPlanType> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    field: 'program_plan_type_id',
    autoIncrement: true,
  })
  programPlanTypeId: number;

  @Column({
    allowNull: false,
    field: 'program_plan_type',
    type: DataType.STRING(100),
  })
  programPlanType: string;

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
  declare createdAt: Date;

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
  declare updatedAt: Date;
}
