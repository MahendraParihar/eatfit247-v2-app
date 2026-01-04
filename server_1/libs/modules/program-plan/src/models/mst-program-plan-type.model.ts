import { BelongsTo, Column, CreatedAt, DataType, Model, Scopes, Table, UpdatedAt } from 'sequelize-typescript';
import { CommonScopes, MstAdminUser } from '@server_1/core';

@Table({
  freezeTableName: true,
  modelName: 'mst_program_plan_types',
  schema: 'public',
  tableName: 'mst_program_plan_types',
})
@Scopes(() => ({
  list: CommonScopes.list(),
  details: CommonScopes.details(),
}))
export class MstProgramPlanType extends Model<MstProgramPlanType> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    field: 'program_plan_type_id',
    autoIncrement: true,
  })
  declare programPlanTypeId: number;

  @Column({
    allowNull: false,
    field: 'program_plan_type',
    type: DataType.STRING(100),
  })
  declare programPlanType: string;

  @Column({
    allowNull: false,
    defaultValue: true,
    field: 'active',
    type: DataType.BOOLEAN,
  })
  declare active: boolean;

  @BelongsTo(() => MstAdminUser, { as: 'createdByUser', foreignKey: 'createdBy', targetKey: 'adminId' })
  declare createdByUser: MstAdminUser;

  @BelongsTo(() => MstAdminUser, { as: 'updatedByUser', foreignKey: 'modifiedBy', targetKey: 'adminId' })
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
}

