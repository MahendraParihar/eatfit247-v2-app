import { BelongsTo, Column, CreatedAt, DataType, Model, Scopes, Table, UpdatedAt } from 'sequelize-typescript';
import { MstAdminUser, CommonScopes } from '@server/common';
import { InputLengthEnum } from 'eatfit247-shared-lib';

@Table({
  freezeTableName: true,
  modelName: 'mst_blog_authors',
  schema: 'public',
})
@Scopes(() => ({
  list: CommonScopes.list,
  details: CommonScopes.details,
}))
export class MstBlogAuthor extends Model<MstBlogAuthor> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    field: 'blog_author_id',
    autoIncrement: true,
  })
  blogAuthorId: number;
  @Column({
    allowNull: false,
    field: 'first_name',
    type: DataType.STRING(50),
  })
  firstName: string;
  @Column({
    allowNull: false,
    field: 'last_name',
    type: DataType.STRING(50),
  })
  lastName: string;
  @Column({
    allowNull: true,
    field: 'profile_picture',
    type: DataType.JSONB,
  })
  profilePicture: string;
  @Column({
    allowNull: false,
    field: 'country_code',
    type: DataType.STRING(5),
  })
  countryCode: string;
  @Column({
    allowNull: false,
    field: 'contact_number',
    type: DataType.STRING(16),
  })
  contactNumber: string;
  @Column({
    allowNull: false,
    field: 'email_id',
    unique: true,
    validate: { isEmail: true },
    type: DataType.STRING(100),
  })
  emailId: string;
  @Column({
    allowNull: true,
    field: 'linked_url',
    type: DataType.STRING(100),
  })
  linkedUrl: string;
  @Column({
    allowNull: false,
    defaultValue: true,
    field: 'active',
  })
  active: boolean;
  @BelongsTo(() => MstAdminUser, {
    foreignKey: 'createdBy',
    targetKey: 'adminId',
    as: 'createdByUser',
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
  declare createdAt: Date;
  @BelongsTo(() => MstAdminUser, {
    foreignKey: 'modifiedBy',
    targetKey: 'adminId',
    as: 'updatedByUser',
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
  @BelongsTo(() => MstAdminUser, { as: 'createdByUser', foreignKey: 'createdBy', targetKey: 'adminUserId' })
  createdByUser: MstAdminUser;
  @BelongsTo(() => MstAdminUser, { as: 'updatedByUser', foreignKey: 'modifiedBy', targetKey: 'adminUserId' })
  updatedByUser: MstAdminUser;
}

