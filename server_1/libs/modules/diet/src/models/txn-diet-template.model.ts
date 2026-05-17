import {
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  HasMany,
  Model,
  Scopes,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';
import { getCreatedByUserInclude, getUpdatedByUserInclude, MstAdminUser } from '@server_1/core';
import { InputLengthEnum } from '@eatfit247-shared-lib';
import { TxnDietTemplateDietDetail } from './txn-diet-template-diet-detail.model';

@Table({
  freezeTableName: true,
  modelName: 'txn_diet_templates',
  schema: 'public',
  tableName: 'txn_diet_templates',
})
@Scopes(() => ({
  list: {
    include: [
      getCreatedByUserInclude(false),
      getUpdatedByUserInclude(false),
    ],
  },
  details: {
    include: [
      getCreatedByUserInclude(false),
      getUpdatedByUserInclude(false),
      {
        model: TxnDietTemplateDietDetail,
        as: 'dietDetails',
        required: false,
      },
    ],
  },
}))
export class TxnDietTemplate extends Model<TxnDietTemplate> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    field: 'diet_template_id',
    autoIncrement: true,
  })
  declare dietTemplateId: number;

  @Column({
    allowNull: false,
    field: 'diet_template',
    type: DataType.STRING(InputLengthEnum.CHAR_100),
  })
  declare dietTemplate: string;

  @Column({
    allowNull: true,
    field: 'no_of_cycle',
    type: DataType.INTEGER,
  })
  declare noOfCycle: number;

  @Column({
    allowNull: true,
    field: 'days_in_cycle',
    type: DataType.INTEGER,
  })
  declare daysInCycle: number;

  @Column({
    allowNull: true,
    field: 'program_id',
    type: DataType.INTEGER,
  })
  declare programId: number;

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

  @BelongsTo(() => MstAdminUser, {
    as: 'updatedByUser',
    foreignKey: 'modifiedBy',
    targetKey: 'adminId',
  })
  declare updatedByUser: MstAdminUser;

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

  @HasMany(() => TxnDietTemplateDietDetail, {
    foreignKey: 'dietTemplateId',
    as: 'dietDetails',
  })
  declare dietDetails: TxnDietTemplateDietDetail[];
}
