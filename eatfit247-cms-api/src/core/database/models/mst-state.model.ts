import { BelongsTo, Column, CreatedAt, DataType, Model, Table, UpdatedAt } from 'sequelize-typescript';
import { MstAdminUser } from './mst-admin-user.model';
import { MstCountries } from './mst-countries.model';

@Table({
  modelName: 'mst_state',
  schema: 'public',
})
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

  @BelongsTo(() => MstCountries, {
    foreignKey: 'countryId',
    targetKey: 'countryId',
    as: 'Country',
  })
  @Column({
    allowNull: true,
    field: 'country_id',
    type: DataType.INTEGER,
  })
  countryId: number;

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
  createdAt: Date;

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
