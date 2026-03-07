import {
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  ForeignKey,
  Model,
  Scopes,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';
import { getCreatedByUserInclude, getUpdatedByUserInclude, MstAdminUser } from '@server_1/core';
import { InputLengthEnum } from '@eatfit247-shared-lib';
import { MstWarehouse } from './mst-warehouse.model';
import { MstCourierProvider } from './mst-courier-provider.model';

@Table({
  freezeTableName: true,
  modelName: 'txn_courier_provider_warehouses',
  schema: 'public',
  tableName: 'txn_courier_provider_warehouses',
  indexes: [
    {
      unique: true,
      fields: ['warehouse_id', 'provider_id'],
      name: 'uq_courier_provider_warehouse',
    },
  ],
})
@Scopes(() => ({
  list: {
    include: [
      getCreatedByUserInclude(false),
      getUpdatedByUserInclude(false),
      {
        model: MstWarehouse,
        as: 'warehouse',
        required: false,
        attributes: ['warehouseId', 'name'],
      },
      {
        model: MstCourierProvider,
        as: 'provider',
        required: false,
        attributes: ['providerId', 'providerCode', 'providerName'],
      },
    ],
  },
  details: {
    include: [
      getCreatedByUserInclude(false),
      getUpdatedByUserInclude(false),
      {
        model: MstWarehouse,
        as: 'warehouse',
        required: false,
      },
      {
        model: MstCourierProvider,
        as: 'provider',
        required: false,
      },
    ],
  },
}))
export class TxnCourierProviderWarehouse extends Model<TxnCourierProviderWarehouse> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    field: 'courier_provider_warehouse_id',
    autoIncrement: true,
  })
  declare courierProviderWarehouseId: number;

  @ForeignKey(() => MstWarehouse)
  @Column({
    allowNull: false,
    field: 'warehouse_id',
    type: DataType.INTEGER,
  })
  declare warehouseId: number;

  @BelongsTo(() => MstWarehouse, {
    foreignKey: 'warehouseId',
    targetKey: 'warehouseId',
    as: 'warehouse',
  })
  declare warehouse: MstWarehouse;

  @ForeignKey(() => MstCourierProvider)
  @Column({
    allowNull: false,
    field: 'provider_id',
    type: DataType.INTEGER,
  })
  declare providerId: number;

  @BelongsTo(() => MstCourierProvider, {
    foreignKey: 'providerId',
    targetKey: 'providerId',
    as: 'provider',
  })
  declare provider: MstCourierProvider;

  @Column({
    allowNull: true,
    field: 'provider_warehouse_id',
    type: DataType.STRING(100),
  })
  declare providerWarehouseId: string | null;

  @Column({
    allowNull: true,
    field: 'provider_warehouse_name',
    type: DataType.STRING(150),
  })
  declare providerWarehouseName: string | null;

  @Column({
    allowNull: true,
    field: 'raw_response',
    type: DataType.JSONB,
  })
  declare rawResponse: Record<string, unknown> | null;

  @Column({
    allowNull: true,
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
}
