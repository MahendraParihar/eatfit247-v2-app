import { BelongsTo, Column, CreatedAt, DataType, Model, Scopes, Table, UpdatedAt } from 'sequelize-typescript';
import { MstAdminUser, CommonScopes } from '@server/common';
import { IMediaUpload, InputLengthEnum } from 'eatfit247-shared-lib';

@Table({
  freezeTableName: true,
  modelName: 'mst_call_types',
  schema: 'public',
  tableName: 'mst_call_types',
})
@Scopes(() => ({
  list: CommonScopes.list(),
  details: CommonScopes.details(),
}))
export class MstCallType extends Model<MstCallType> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    field: 'call_type_id',
    autoIncrement: true,
  })
  declare callTypeId: number;
  @Column({
    allowNull: false,
    field: 'call_type',
    type: DataType.STRING(50),
  })
  declare callType: string;
  @Column({
    allowNull: true,
    field: 'image_path',
    type: DataType.JSONB,
  })
  declare imagePath: IMediaUpload[];
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

