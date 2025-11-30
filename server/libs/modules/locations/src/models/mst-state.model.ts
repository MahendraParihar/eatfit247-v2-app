import { BelongsTo, Column, CreatedAt, DataType, Model, Scopes, Table, UpdatedAt } from 'sequelize-typescript';
import { MstAdminUser, getCreatedByUserInclude, getUpdatedByUserInclude } from '@server/common';
import { InputLengthEnum } from 'eatfit247-shared-lib';
import { MstCountry } from './mst-country.model';

@Table({
  freezeTableName: true,
  modelName: 'mst_states',
  schema: 'public',
  tableName: 'mst_states',
})
@Scopes(() => ({
  list: {
    include: [
      getCreatedByUserInclude(false),
      getUpdatedByUserInclude(false),
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
        model: MstCountry,
        as: 'country',
        required: false,
        attributes: ['countryId', 'country', 'countryCode'],
      },
    ],
  },
}))
export class MstState extends Model<MstState> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    field: 'state_id',
    autoIncrement: true,
  })
  stateId: number;

  @Column({
    allowNull: false,
    field: 'state',
    type: DataType.STRING(100),
  })
  state: string;

  @Column({
    allowNull: false,
    field: 'code',
    type: DataType.STRING(10),
  })
  code: string;

  @BelongsTo(() => MstCountry, {
    foreignKey: 'countryId',
    targetKey: 'countryId',
    as: 'country',
  })
  country: MstCountry;

  @Column({
    allowNull: false,
    field: 'country_id',
    type: DataType.INTEGER,
  })
  countryId: number;

  @Column({
    allowNull: false,
    defaultValue: true,
    field: 'active',
    type: DataType.BOOLEAN,
  })
  active: boolean;

  @BelongsTo(() => MstAdminUser, { as: 'createdByUser', foreignKey: 'createdBy', targetKey: 'adminId' })
  createdByUser: MstAdminUser;

  @BelongsTo(() => MstAdminUser, { as: 'updatedByUser', foreignKey: 'modifiedBy', targetKey: 'adminId' })
  updatedByUser: MstAdminUser;

  @Column({
    allowNull: false,
    field: 'created_by',
    type: DataType.INTEGER,
  })
  createdBy: number;

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
  modifiedBy: number;

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
  createdIp: string;

  @Column({
    allowNull: false,
    field: 'modified_ip',
    type: DataType.STRING(InputLengthEnum.IP),
  })
  modifiedIp: string;
}

