import {
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  Model,
  Scopes,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';
import { getCreatedByUserInclude, getUpdatedByUserInclude, MstAdminUser } from '@server_1/core';
import { InputLengthEnum } from '@eatfit247-shared-lib';
import { MstState, MstCountry } from '@server_1/platform';

@Table({
  freezeTableName: true,
  modelName: 'mst_warehouses',
  schema: 'public',
  tableName: 'mst_warehouses',
})
@Scopes(() => ({
  list: {
    include: [
      getCreatedByUserInclude(false),
      getUpdatedByUserInclude(false),
      {
        model: MstState,
        as: 'state',
        required: false,
        attributes: ['stateId', 'state', 'code'],
      },
      {
        model: MstCountry,
        as: 'country',
        required: false,
        attributes: ['countryId', 'country', 'countryCode'],
      },
    ],
  },
  details: {
    include: [
      getCreatedByUserInclude(false),
      getUpdatedByUserInclude(false),
      {
        model: MstState,
        as: 'state',
        required: false,
      },
      {
        model: MstCountry,
        as: 'country',
        required: false,
      },
    ],
  },
}))
export class MstWarehouse extends Model<MstWarehouse> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    field: 'warehouse_id',
    autoIncrement: true,
  })
  declare warehouseId: number;

  @Column({
    allowNull: false,
    field: 'name',
    type: DataType.STRING(150),
  })
  declare name: string;

  @Column({
    allowNull: true,
    field: 'contact_name',
    type: DataType.STRING(150),
  })
  declare contactName: string;

  @Column({
    allowNull: true,
    field: 'email',
    type: DataType.STRING(150),
  })
  declare email: string;

  @Column({
    allowNull: true,
    field: 'phone',
    type: DataType.STRING(20),
  })
  declare phone: string;

  @Column({
    allowNull: false,
    field: 'address_line1',
    type: DataType.TEXT,
  })
  declare addressLine1: string;

  @Column({
    allowNull: true,
    field: 'address_line2',
    type: DataType.TEXT,
  })
  declare addressLine2: string | null;

  @Column({
    allowNull: false,
    field: 'city',
    type: DataType.STRING(100),
  })
  declare city: string;

  @Column({
    allowNull: false,
    field: 'state_id',
    type: DataType.INTEGER,
  })
  declare stateId: number;

  @BelongsTo(() => MstState, {
    foreignKey: 'stateId',
    targetKey: 'stateId',
    as: 'state',
  })
  declare state: MstState;

  @Column({
    allowNull: false,
    field: 'country_id',
    type: DataType.INTEGER,
  })
  declare countryId: number;

  @BelongsTo(() => MstCountry, {
    foreignKey: 'countryId',
    targetKey: 'countryId',
    as: 'country',
  })
  declare country: MstCountry;

  @Column({
    allowNull: false,
    field: 'pin_code',
    type: DataType.STRING(10),
  })
  declare pinCode: string;

  @Column({
    allowNull: true,
    field: 'latitude',
    type: DataType.DECIMAL(10, 6),
  })
  declare latitude: string | null;

  @Column({
    allowNull: true,
    field: 'longitude',
    type: DataType.DECIMAL(10, 6),
  })
  declare longitude: string | null;

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
