import { BelongsTo, Column, CreatedAt, DataType, Model, Scopes, Table, UpdatedAt } from 'sequelize-typescript';
import { PaymentRouteEnum } from '@eatfit247-shared-lib';
import { CommonScopes, MstAdminUser } from '@server_1/core';

@Table({
  freezeTableName: true,
  modelName: 'mst_payment_modes',
  schema: 'public',
  tableName: 'mst_payment_modes',
})
@Scopes(() => ({
  list: CommonScopes.list(),
  details: CommonScopes.details(),
}))
export class MstPaymentMode extends Model<MstPaymentMode> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    field: 'payment_mode_id',
    autoIncrement: true,
  })
  declare paymentModeId: number;

  @Column({
    allowNull: false,
    field: 'payment_mode',
    type: DataType.STRING(100),
  })
  declare paymentMode: string;
  /** Route the tax decision uses for an offline payment in this mode (roadmap 4.6) */
  @Column({ allowNull: false, defaultValue: 'DOMESTIC', field: 'payment_route', type: DataType.STRING(40) })
  declare paymentRoute: PaymentRouteEnum;

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

