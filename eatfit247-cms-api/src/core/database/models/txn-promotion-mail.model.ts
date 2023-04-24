import { BelongsTo, Column, CreatedAt, DataType, Model, Table, UpdatedAt } from 'sequelize-typescript';
import { MstAdminUser } from './mst-admin-user.model';

@Table({
  modelName: 'txn_promotion_mail',
  schema: 'public',
})
export class TxnPromotionMail extends Model<TxnPromotionMail> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    field: 'promotion_mail_id',
    autoIncrement: true,
  })
  promotionMailId: number;

  @Column({
    allowNull: false,
    field: 'title',
    type: DataType.STRING(500),
  })
  title: string;

  @Column({
    allowNull: false,
    field: 'subject',
    type: DataType.STRING(500),
  })
  subject: string;

  @Column({
    allowNull: false,
    field: 'body_text',
    type: DataType.TEXT,
  })
  bodyText: string;

  @Column({
    allowNull: false,
    field: 'file_path',
    type: DataType.STRING(200),
  })
  filePath: string;

  @Column({
    allowNull: false,
    field: 'image_path',
    type: DataType.JSONB,
  })
  imagePath: string;

  @Column({
    allowNull: false,
    field: 'attachment_file',
    type: DataType.JSONB,
  })
  attachmentFile: string;

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
