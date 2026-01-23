import { BelongsTo, Column, CreatedAt, DataType, Model, Scopes, Table, UpdatedAt } from 'sequelize-typescript';
import { getCreatedByUserInclude, getUpdatedByUserInclude, MstAdminUser } from '@server_1/core';
import { InputLengthEnum } from '@eatfit247-shared-lib';
import { MstState } from './mst-state.model';
import { MstCountry } from './mst-country.model';

@Table({
  freezeTableName: true,
  modelName: 'txn_addresses',
  schema: 'public',
  tableName: 'txn_addresses',
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
}))
export class TxnAddress extends Model<TxnAddress> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    field: 'address_id',
    autoIncrement: true,
  })
  declare addressId: number;
  @Column({
    allowNull: false,
    field: 'table_id',
    type: DataType.INTEGER,
  })
  declare tableId: number;
  @Column({
    allowNull: false,
    field: 'pk_of_table',
    type: DataType.INTEGER,
  })
  declare pkOfTable: number;
  @Column({
    allowNull: false,
    field: 'postal_address',
    type: DataType.STRING(200),
  })
  declare postalAddress: string;
  @Column({
    allowNull: true,
    field: 'city_village',
    type: DataType.STRING(200),
  })
  declare cityVillage: string;
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
    allowNull: true,
    field: 'pin_code',
    type: DataType.STRING(10),
  })
  declare pinCode: string;
  @Column({
    allowNull: true,
    field: 'latitude',
    type: DataType.STRING(50),
  })
  declare latitude: string;
  @Column({
    allowNull: true,
    field: 'longitude',
    type: DataType.STRING(50),
  })
  declare longitude: string;
  @Column({
    allowNull: false,
    defaultValue: true,
    field: 'active',
    type: DataType.BOOLEAN,
  })
  declare active: boolean;
  @Column({
    allowNull: true,
    field: 'address_name',
    type: DataType.STRING(100),
  })
  declare addressName: string;
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
