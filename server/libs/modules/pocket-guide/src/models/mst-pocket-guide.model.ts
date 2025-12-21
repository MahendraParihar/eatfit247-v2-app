import { BelongsTo, Column, CreatedAt, DataType, Model, Scopes, Table, UpdatedAt } from 'sequelize-typescript';
import { MstAdminUser, CommonScopes } from '@server/common';
import { IMediaUpload, InputLengthEnum } from 'eatfit247-shared-lib';

@Table({
  freezeTableName: true,
  modelName: 'mst_pocket_guides',
  schema: 'public',
  tableName: 'mst_pocket_guides',
})
@Scopes(() => ({
  list: CommonScopes.list(),
  details: CommonScopes.details(),
}))
export class MstPocketGuide extends Model<MstPocketGuide> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    field: 'pocket_guide_id',
    autoIncrement: true,
  })
  declare pocketGuideId: number;

  @Column({
    allowNull: false,
    field: 'pocket_guide',
    type: DataType.STRING(50),
  })
  declare pocketGuide: string;

  @Column({
    allowNull: false,
    field: 'file_path',
    type: DataType.JSONB,
  })
  declare filePath: IMediaUpload[];

  @Column({
    allowNull: true,
    field: 'description',
    type: DataType.TEXT,
  })
  declare description: string;

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

