import { BelongsTo, Column, CreatedAt, DataType, Model, Table, UpdatedAt } from 'sequelize-typescript';
import { MstAdminUser } from './mst-admin-user.model';
import { MstAddressType } from './mst-address-type.model';
import { MstTable } from './mst-table.model';
import { MstState } from './mst-state.model';
import { MstCountries } from './mst-countries.model';

@Table({
  modelName: 'txn_address',
  schema: 'public',
})
export class TxnAddress extends Model<TxnAddress> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    field: 'address_id',
    autoIncrement: true,
  })
  addressId: number;

  @BelongsTo(() => MstTable, {
    foreignKey: 'tableId',
    targetKey: 'tableId',
    as: 'AddressTable',
  })
  @Column({
    allowNull: false,
    field: 'table_id',
    type: DataType.INTEGER,
  })
  tableId: number;

  @Column({
    allowNull: false,
    field: 'pk_of_table',
    type: DataType.INTEGER,
  })
  pkOfTable: number;

  @BelongsTo(() => MstAddressType, {
    foreignKey: 'addressTypeId',
    targetKey: 'addressTypeId',
    as: 'AddressType',
  })
  @Column({
    allowNull: false,
    field: 'address_type_id',
    type: DataType.INTEGER,
  })
  addressTypeId: number;

  @Column({
    allowNull: false,
    field: 'postal_address',
    type: DataType.STRING(200),
  })
  postalAddress: string;

  @Column({
    allowNull: false,
    field: 'city_village',
    type: DataType.STRING(200),
  })
  cityVillage: string;

  @BelongsTo(() => MstState, {
    foreignKey: 'stateId',
    targetKey: 'stateId',
    as: 'AddressState',
  })
  @Column({
    allowNull: false,
    field: 'state_id',
    type: DataType.INTEGER,
  })
  stateId: number;

  @BelongsTo(() => MstCountries, {
    foreignKey: 'countryId',
    targetKey: 'countryId',
    as: 'AddressCountry',
  })
  @Column({
    allowNull: false,
    field: 'country_id',
    type: DataType.INTEGER,
  })
  countryId: number;

  @Column({
    allowNull: true,
    type: DataType.FLOAT,
    field: 'latitude',
  })
  latitude: number;

  @Column({
    allowNull: false,
    type: DataType.STRING(10),
    field: 'pin_code',
  })
  pinCode: string;

  @Column({
    allowNull: true,
    type: DataType.FLOAT,
    field: 'longitude',
  })
  longitude: number;

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
    allowNull: true,
    field: 'created_by',
  })
  createdBy: number;

  @CreatedAt
  @Column({
    allowNull: false,
    field: 'created_at',
  })
  createdAt: Date;

  @BelongsTo(() => MstAdminUser, {
    foreignKey: 'modifiedBy',
    targetKey: 'adminId',
    as: 'ModifiedBy',
  })
  @Column({
    allowNull: true,
    field: 'modified_by',
  })
  modifiedBy: number;

  @UpdatedAt
  @Column({
    allowNull: false,
    field: 'updated_at',
  })
  updatedAt: Date;

  @Column({
    allowNull: false,
    field: 'created_ip',
  })
  createdIp: string;

  @Column({
    allowNull: false,
    field: 'modified_ip',
  })
  modifiedIp: string;
}
