import { BelongsTo, Column, CreatedAt, DataType, Model, Table, UpdatedAt } from 'sequelize-typescript';
import { MstAdminUser } from './mst-admin-user.model';
import { TxnBlog } from './txn-blog.model';
import { TxnBlogComment } from './txn-blog-comment.model';

@Table({
  modelName: 'txn_blog_comment_response',
  schema: 'public',
})
export class TxnBlogCommentResponse extends Model<TxnBlogCommentResponse> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    field: 'blog_comment_response_id',
    autoIncrement: true,
  })
  blogCommentResponseId: number;

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

  @BelongsTo(() => TxnBlogComment, {
    foreignKey: 'blogCommentId',
    targetKey: 'blogCommentId',
    as: 'BlogComment',
  })
  @Column({
    allowNull: false,
    field: 'blog_comment_id',
  })
  blogCommentId: number;

  @Column({
    allowNull: false,
    field: 'response',
    type: DataType.STRING(1000),
  })
  response: string;

  @BelongsTo(() => MstAdminUser, {
    foreignKey: 'responded_by',
    targetKey: 'adminId',
    as: 'RespondedBy',
  })
  @Column({
    allowNull: true,
    field: 'responded_by',
    type: DataType.INTEGER,
  })
  respondedBy: number;

  @Column({
    allowNull: false,
    defaultValue: true,
    field: 'active',
  })
  active: boolean;

  @CreatedAt
  @Column({
    allowNull: false,
    field: 'created_at',
  })
  createdAt: Date;

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
