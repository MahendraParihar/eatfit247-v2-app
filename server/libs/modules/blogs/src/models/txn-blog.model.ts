import { BelongsTo, Column, CreatedAt, DataType, Model, Scopes, Table, UpdatedAt } from 'sequelize-typescript';
import { MstAdminUser, getCreatedByUserInclude, getUpdatedByUserInclude } from '@server/common';
import { MstBlogCategory, MstBlogAuthor } from '@server/common';
import { IMediaUpload, InputLengthEnum } from '@eatfit247-shared-lib';

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
        as: 'blogCategory',
      },
      {
        attributes: ['blogAuthorId', 'firstName', 'lastName', 'profilePicture'],
        model: MstBlogAuthor,
        required: false,
        as: 'blogAuthor',
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
        as: 'blogCategory',
      },
      {
        attributes: ['blogAuthorId', 'firstName', 'lastName', 'profilePicture'],
        model: MstBlogAuthor,
        required: false,
        as: 'blogAuthor',
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
  declare blogId: number;
  @BelongsTo(() => MstBlogCategory, {
    foreignKey: 'blogCategoryId',
    targetKey: 'blogCategoryId',
    as: 'blogCategory',
  })
  declare blogCategory: MstBlogCategory;

  @Column({
    allowNull: false,
    field: 'blog_category_id',
    type: DataType.INTEGER,
  })
  declare blogCategoryId: number;

  @BelongsTo(() => MstBlogAuthor, {
    foreignKey: 'blogAuthorId',
    targetKey: 'blogAuthorId',
    as: 'blogAuthor',
  })
  declare blogAuthor: MstBlogAuthor;

  @Column({
    allowNull: false,
    field: 'blog_author_id',
    type: DataType.INTEGER,
  })
  declare blogAuthorId: number;
  @Column({
    allowNull: false,
    field: 'title',
    type: DataType.STRING(100),
  })
  declare title: string;
  @Column({
    allowNull: false,
    field: 'description',
    type: DataType.TEXT,
  })
  declare description: string;
  @Column({
    allowNull: false,
    field: 'image_path',
    type: DataType.JSONB,
  })
  declare imagePath: IMediaUpload[];
  @Column({
    allowNull: false,
    type: DataType.BOOLEAN,
    defaultValue: false,
    field: 'is_published',
  })
  declare isPublished: boolean;
  @Column({
    allowNull: false,
    type: DataType.BOOLEAN,
    defaultValue: false,
    field: 'is_comment_allow',
  })
  declare isCommentAllow: boolean;
  @Column({
    allowNull: false,
    type: DataType.BOOLEAN,
    defaultValue: false,
    field: 'is_mail_sent_to_subscriber',
  })
  declare isMailSentToSubscriber: boolean;
  @Column({
    allowNull: false,
    type: DataType.INTEGER,
    defaultValue: 0,
    field: 'visited_count',
  })
  declare visitedCount: number;
  @Column({
    allowNull: false,
    type: DataType.INTEGER,
    defaultValue: 0,
    field: 'share_count',
  })
  declare shareCount: number;
  @Column({
    field: 'tags',
    allowNull: true,
    type: DataType.ARRAY(DataType.STRING),
  })
  declare tags: string[];
  @Column({
    allowNull: false,
    type: DataType.STRING(250),
    defaultValue: null,
    field: 'url',
  })
  declare url: string;
  @Column({
    allowNull: false,
    field: 'written_at',
    type: DataType.DATEONLY,
  })
  declare writtenAt: Date;
  @Column({
    allowNull: true,
    field: 'meta_title',
    type: DataType.STRING(InputLengthEnum.CHAR_60),
  })
  declare metaTitle: string;
  @Column({
    allowNull: true,
    field: 'meta_description',
    type: DataType.STRING(InputLengthEnum.CHAR_160),
  })
  declare metaDescription: string;
  @Column({
    allowNull: false,
    defaultValue: true,
    field: 'active',
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

