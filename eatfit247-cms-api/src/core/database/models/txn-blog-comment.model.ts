import { BelongsTo, Column, CreatedAt, DataType, Model, Table, UpdatedAt } from 'sequelize-typescript';
import { MstAdminUser } from './mst-admin-user.model';
import { TxnBlog } from './txn-blog.model';

@Table({
  modelName: 'txn_blog_comment',
  schema: 'public',
})
export class TxnBlogComment extends Model<TxnBlogComment> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    field: 'blog_comment_id',
    autoIncrement: true,
  })
  blogCommentId: number;

  @BelongsTo(() => TxnBlog, {
    foreignKey: 'blogId',
    targetKey: 'blogId',
    as: 'Blog',
  })
  @Column({
    allowNull: false,
    field: 'blog_id',
  })
  blogId: number;

  @Column({
    allowNull: false,
    field: 'comment',
    type: DataType.STRING(1000),
  })
  comment: string;

  @Column({
    allowNull: false,
    field: 'commented_by_name',
    type: DataType.STRING(100),
  })
  commentedByName: string;

  @Column({
    allowNull: false,
    field: 'commented_by_email_id',
    validate: { isEmail: true },
    type: DataType.STRING(100),
  })
  commentedByEmailId: string;

  @Column({
    allowNull: false,
    defaultValue: true,
    field: 'active',
  })
  active: boolean;

  @Column({
    allowNull: false,
    defaultValue: true,
    field: 'is_mail_sent',
    type: DataType.BOOLEAN,
  })
  isMailSent: boolean;

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
