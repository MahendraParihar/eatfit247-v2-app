import { BelongsTo, Column, CreatedAt, DataType, Model, Scopes, Table, UpdatedAt } from 'sequelize-typescript';
import { MstAdminUser, getCreatedByUserInclude, getUpdatedByUserInclude } from '@server/common';
import { MstBlogCategory } from './mst-blog-category.model';
import { MstBlogAuthor } from './mst-blog-author.model';
import { IMediaUpload, InputLengthEnum } from 'eatfit247-shared-lib';

@Table({
  freezeTableName: true,
  modelName: 'txn_blogs',
  schema: 'public',
})
@Scopes(() => ({
  list: {
    include: [
      getCreatedByUserInclude(false),
      getUpdatedByUserInclude(false),
      {
        attributes: ['blogCategoryId', 'blogCategory', 'url'],
        model: MstBlogCategory,
        required: false,
        as: 'BlogCategory',
      },
      {
        attributes: ['blogAuthorId', 'firstName', 'lastName', 'profilePicture'],
        model: MstBlogAuthor,
        required: false,
        as: 'BlogAuthor',
      },
    ],
  },
  details: {
    include: [
      getCreatedByUserInclude(false),
      getUpdatedByUserInclude(false),
      {
        attributes: ['blogCategoryId', 'blogCategory', 'url'],
        model: MstBlogCategory,
        required: false,
        as: 'BlogCategory',
      },
      {
        attributes: ['blogAuthorId', 'firstName', 'lastName', 'profilePicture'],
        model: MstBlogAuthor,
        required: false,
        as: 'BlogAuthor',
      },
    ],
  },
}))
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
  blogCategory: MstBlogCategory;

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
  blogAuthor: MstBlogAuthor;

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
  imagePath: IMediaUpload[];
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
    field: 'tags',
    allowNull: true,
    type: DataType.ARRAY(DataType.STRING),
  })
  tags: string[];
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
    allowNull: true,
    field: 'meta_title',
    type: DataType.STRING(InputLengthEnum.CHAR_60),
  })
  metaTitle: string;
  @Column({
    allowNull: true,
    field: 'meta_description',
    type: DataType.STRING(InputLengthEnum.CHAR_160),
  })
  metaDescription: string;
  @Column({
    allowNull: false,
    defaultValue: true,
    field: 'active',
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

