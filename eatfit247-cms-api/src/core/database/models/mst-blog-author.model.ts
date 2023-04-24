import { BelongsTo, Column, CreatedAt, DataType, Model, Table, UpdatedAt } from 'sequelize-typescript';
import { MstAdminUser } from './mst-admin-user.model';

@Table({
  modelName: 'mst_blog_author',
  schema: 'public',
})
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
