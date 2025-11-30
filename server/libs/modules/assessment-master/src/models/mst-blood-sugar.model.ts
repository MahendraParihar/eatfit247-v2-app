import { BelongsTo, Column, CreatedAt, DataType, Model, Scopes, Table, UpdatedAt } from 'sequelize-typescript';
import { MstAdminUser, CommonScopes } from '@server/common';
import { InputLengthEnum } from 'eatfit247-shared-lib';

@Table({
  freezeTableName: true,
  modelName: 'mst_blood_sugars',
  schema: 'public',
  tableName: 'mst_blood_sugars',
})
@Scopes(() => ({
  list: CommonScopes.list,
  details: CommonScopes.details,
}))
export class MstBloodSugar extends Model<MstBloodSugar> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    field: 'blood_sugar_id',
    autoIncrement: true,
  })
  bloodSugarId: number;

  @Column({
    allowNull: false,
    field: 'blood_sugar',
    type: DataType.STRING(50),
  })
  bloodSugar: string;

  @Column({
    allowNull: true,
    field: 'image_path',
    type: DataType.JSONB,
  })
  imagePath: string;

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

