import { BelongsTo, Column, CreatedAt, DataType, Model, Scopes, Table, UpdatedAt } from 'sequelize-typescript';
import { MstAdminUser, CommonScopes } from '@server/common';
import { InputLengthEnum, TaxTypeEnum } from 'eatfit247-shared-lib';

@Table({
  freezeTableName: true,
  modelName: 'mst_countries',
  schema: 'public',
  tableName: 'mst_countries',
})
@Scopes(() => ({
  list: CommonScopes.list(),
  details: CommonScopes.details(),
}))
export class MstCountry extends Model<MstCountry> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    field: 'country_id',
    autoIncrement: true,
  })
  declare countryId: number;

  @Column({
    allowNull: false,
    field: 'country',
    type: DataType.STRING(100),
  })
  declare country: string;

  @Column({
    allowNull: true,
    field: 'country_code',
    type: DataType.STRING(5),
  })
  declare countryCode: string;

  @Column({
    allowNull: true,
    field: 'phone_number_code',
    type: DataType.STRING(5),
  })
  declare phoneNumberCode: string;

  @Column({
    allowNull: false,
    defaultValue: TaxTypeEnum.NONE,
    field: 'tax_type',
    type: DataType.STRING(20),
  })
  declare taxType: TaxTypeEnum;

  @Column({
    allowNull: false,
    defaultValue: 0,
    field: 'default_tax_percentage',
    type: DataType.DECIMAL(5, 2),
  })
  declare defaultTaxPercentage: number;

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

