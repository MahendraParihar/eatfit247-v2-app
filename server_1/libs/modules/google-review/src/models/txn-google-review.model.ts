import { BelongsTo, Column, CreatedAt, DataType, Model, Scopes, Table, UpdatedAt } from 'sequelize-typescript';
import { getCreatedByUserInclude, getUpdatedByUserInclude, MstAdminUser } from '@server_1/core';
import { GoogleReviewEntityTypeEnum, GoogleReviewSourceEnum, InputLengthEnum } from '@eatfit247-shared-lib';

@Table({
  freezeTableName: true,
  modelName: 'txn_google_review',
  schema: 'public',
  tableName: 'txn_google_review',
})
@Scopes(() => ({
  list: {
    include: [
      getCreatedByUserInclude(false),
      getUpdatedByUserInclude(false),
      {
        attributes: ['adminId', 'firstName', 'lastName'],
        model: MstAdminUser,
        required: false,
        as: 'repliedByUser',
      },
    ],
  },
  details: {
    include: [
      getCreatedByUserInclude(false),
      getUpdatedByUserInclude(false),
      {
        attributes: ['adminId', 'firstName', 'lastName'],
        model: MstAdminUser,
        required: false,
        as: 'repliedByUser',
      },
    ],
  },
}))
export class TxnGoogleReview extends Model<TxnGoogleReview> {
  @Column({
    type: DataType.BIGINT,
    primaryKey: true,
    field: 'google_review_id',
    autoIncrement: true,
  })
  declare googleReviewId: number;

  @Column({
    allowNull: false,
    field: 'entity_type',
    type: DataType.STRING(30),
  })
  declare entityType: GoogleReviewEntityTypeEnum;

  @Column({
    allowNull: false,
    field: 'entity_id',
    type: DataType.BIGINT,
  })
  declare entityId: number;

  @Column({
    allowNull: false,
    field: 'source',
    type: DataType.STRING(20),
    defaultValue: GoogleReviewSourceEnum.Manual,
  })
  declare source: GoogleReviewSourceEnum;

  @Column({
    allowNull: true,
    field: 'google_review_id_ext',
    type: DataType.STRING(120),
  })
  declare googleReviewIdExt: string | null;

  @Column({
    allowNull: false,
    field: 'reviewer_name',
    type: DataType.STRING(150),
  })
  declare reviewerName: string;

  @Column({
    allowNull: true,
    field: 'reviewer_role',
    type: DataType.STRING(200),
  })
  declare reviewerRole: string | null;

  @Column({
    allowNull: true,
    field: 'reviewer_photo_url',
    type: DataType.STRING(500),
  })
  declare reviewerPhotoUrl: string | null;

  @Column({
    allowNull: false,
    field: 'rating',
    type: DataType.SMALLINT,
  })
  declare rating: number;

  @Column({
    allowNull: true,
    field: 'review_text',
    type: DataType.TEXT,
  })
  declare reviewText: string | null;

  @Column({
    allowNull: false,
    field: 'review_date',
    type: DataType.DATE,
  })
  declare reviewDate: Date;

  @Column({
    allowNull: false,
    field: 'language',
    type: DataType.STRING(10),
    defaultValue: 'en',
  })
  declare language: string;

  @Column({
    allowNull: true,
    field: 'admin_reply',
    type: DataType.TEXT,
  })
  declare adminReply: string | null;

  @Column({
    allowNull: true,
    field: 'admin_replied_at',
    type: DataType.DATE,
  })
  declare adminRepliedAt: Date | null;

  @Column({
    allowNull: true,
    field: 'admin_replied_by',
    type: DataType.INTEGER,
  })
  declare adminRepliedBy: number | null;

  @BelongsTo(() => MstAdminUser, {
    as: 'repliedByUser',
    foreignKey: 'adminRepliedBy',
    targetKey: 'adminId',
  })
  declare repliedByUser: MstAdminUser;

  @Column({
    allowNull: false,
    field: 'helpful_count',
    type: DataType.INTEGER,
    defaultValue: 0,
  })
  declare helpfulCount: number;

  @Column({
    allowNull: false,
    field: 'is_published',
    type: DataType.BOOLEAN,
    defaultValue: true,
  })
  declare isPublished: boolean;

  @Column({
    allowNull: false,
    field: 'display_order',
    type: DataType.INTEGER,
    defaultValue: 0,
  })
  declare displayOrder: number;

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
