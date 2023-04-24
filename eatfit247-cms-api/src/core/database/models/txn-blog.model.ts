import { BelongsTo, Column, CreatedAt, DataType, Model, Table, UpdatedAt } from 'sequelize-typescript';
import { MstAdminUser } from './mst-admin-user.model';
import { MstBlogCategory } from './mst-blog-category.model';
import { MstBlogAuthor } from './mst-blog-author.model';

@Table({
  modelName: 'txn_blogs',
  schema: 'public',
})
export class TxnBlog extends Model<TxnBlog> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    field: 'blog_id',
    autoIncrement: true,
  })
  blogId: number;

  @BelongsTo(() => MstBlogCategory, {
    foreignKey: 'blogCategoryId',
    targetKey: 'blogCategoryId',
    as: 'BlogCategory',
  })
  @Column({
    allowNull: false,
    field: 'blog_category_id',
    type: DataType.INTEGER,
  })
  blogCategoryId: number;

  @BelongsTo(() => MstBlogAuthor, {
    foreignKey: 'blogAuthorId',
    targetKey: 'blogAuthorId',
    as: 'BlogAuthor',
  })
  @Column({
    allowNull: false,
    field: 'blog_author_id',
    type: DataType.INTEGER,
  })
  blogAuthorId: number;

  @Column({
    allowNull: false,
    field: 'title',
    type: DataType.STRING(100),
  })
  title: string;

  @Column({
    allowNull: false,
    field: 'description',
    type: DataType.TEXT,
  })
  description: string;

  @Column({
    allowNull: false,
    field: 'image_path',
    type: DataType.JSONB,
  })
  imagePath: string;

  @Column({
    allowNull: false,
    type: DataType.BOOLEAN,
    defaultValue: false,
    field: 'is_published',
  })
  isPublished: boolean;

  @Column({
    allowNull: false,
    type: DataType.BOOLEAN,
    defaultValue: false,
    field: 'is_comment_allow',
  })
  isCommentAllow: boolean;

  @Column({
    allowNull: false,
    type: DataType.BOOLEAN,
    defaultValue: false,
    field: 'is_mail_sent_to_subscriber',
  })
  isMailSentToSubscriber: boolean;

  @Column({
    allowNull: false,
    type: DataType.INTEGER,
    defaultValue: 0,
    field: 'visited_count',
  })
  visitedCount: number;

  @Column({
    allowNull: false,
    type: DataType.INTEGER,
    defaultValue: 0,
    field: 'share_count',
  })
  shareCount: number;

  @Column({
    allowNull: false,
    type: DataType.STRING(1000),
    defaultValue: null,
    field: 'tags',
  })
  tags: string;

  @Column({
    allowNull: false,
    type: DataType.STRING(250),
    defaultValue: null,
    field: 'url',
  })
  url: string;

  @Column({
    allowNull: false,
    field: 'written_at',
    type: DataType.DATEONLY,
  })
  writtenAt: Date;

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
