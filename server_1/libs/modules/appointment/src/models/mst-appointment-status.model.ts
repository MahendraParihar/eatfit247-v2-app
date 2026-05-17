import { BelongsTo, Column, CreatedAt, DataType, Model, Scopes, Table, UpdatedAt } from 'sequelize-typescript';
import { CommonScopes, MstAdminUser } from '@server_1/core';
import { InputLengthEnum } from '@eatfit247-shared-lib';

@Table({
  freezeTableName: true,
  modelName: 'mst_appointment_statuses',
  schema: 'public',
  tableName: 'mst_appointment_statuses',
})
@Scopes(() => ({
  list: CommonScopes.list(),
  details: CommonScopes.details(),
}))
export class MstAppointmentStatus extends Model<MstAppointmentStatus> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    field: 'appointment_status_id',
    autoIncrement: true,
  })
  declare appointmentStatusId: number;

  @Column({
    allowNull: false,
    field: 'appointment_status',
    type: DataType.STRING(InputLengthEnum.CHAR_50),
  })
  declare appointmentStatus: string;

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

  @Column({ allowNull: false, field: 'created_by', type: DataType.INTEGER })
  declare createdBy: number;

  @CreatedAt
  @Column({ allowNull: false, field: 'created_at' })
  declare createdAt: Date;

  @Column({ allowNull: false, field: 'modified_by', type: DataType.INTEGER })
  declare modifiedBy: number;

  @UpdatedAt
  @Column({ allowNull: false, field: 'updated_at' })
  declare updatedAt: Date;
}
