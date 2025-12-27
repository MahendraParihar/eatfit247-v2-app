import { BelongsTo, Column, CreatedAt, DataType, Model, Scopes, Table, UpdatedAt } from 'sequelize-typescript';
import { MstAdminUser, getCreatedByUserInclude, getUpdatedByUserInclude, MstPocketGuide } from "@server/common";
import { TxnMember } from './txn-member.model';
import { InputLengthEnum } from 'eatfit247-shared-lib';

@Table({
  freezeTableName: true,
  modelName: 'txn_member_pocket_guides',
  schema: 'public',
  tableName: 'txn_member_pocket_guides',
  indexes: [
    {
      unique: false,
      fields: ['member_id'],
      name: 'ix_txn_member_pocket_guide_member_id',
    },
    {
      unique: true,
      fields: ['member_id', 'pocket_guide_id'],
      name: 'txn_member_pocket_guides_member_id_pocket_guide_id_uindex',
    },
  ],
})
@Scopes(() => ({
  list: {
    include: [
      getCreatedByUserInclude(false),
      getUpdatedByUserInclude(false),
      {
        model: MstPocketGuide,
        as: 'pocketGuide',
        required: false,
        attributes: ['pocketGuideId', 'pocketGuide'],
      },
    ],
  },
  details: {
    include: [
      getCreatedByUserInclude(false),
      getUpdatedByUserInclude(false),
      {
        model: MstPocketGuide,
        as: 'pocketGuide',
        required: false,
        attributes: ['pocketGuideId', 'pocketGuide', 'filePath', 'description', 'imagePath', 'active'],
      },
    ],
  },
}))
export class TxnMemberPocketGuide extends Model<TxnMemberPocketGuide> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    field: 'member_pocket_guide_id',
    autoIncrement: true,
  })
  declare memberPocketGuideId: number;

  @BelongsTo(() => TxnMember, {
    foreignKey: 'memberId',
    targetKey: 'memberId',
    as: 'member',
  })
  declare member: TxnMember;

  @Column({
    allowNull: false,
    field: 'member_id',
    type: DataType.INTEGER,
  })
  declare memberId: number;

  @Column({
    allowNull: false,
    field: 'pocket_guide_id',
    type: DataType.INTEGER,
  })
  declare pocketGuideId: number;

  @BelongsTo(() => MstPocketGuide, {
    foreignKey: 'pocketGuideId',
    targetKey: 'pocketGuideId',
    as: 'pocketGuide',
  })
  declare pocketGuide: MstPocketGuide;

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
    allowNull: true,
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
    allowNull: true,
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
