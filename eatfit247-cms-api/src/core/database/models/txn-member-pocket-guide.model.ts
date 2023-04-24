import { BelongsTo, Column, CreatedAt, DataType, Model, Table, UpdatedAt } from 'sequelize-typescript';
import { MstAdminUser } from './mst-admin-user.model';
import { TxnMember } from './txn-member.model';
import { MstPocketGuide } from './mst-pocket-guide.model';

@Table({
  modelName: 'txn_member_pocket_guide',
  schema: 'public',
  indexes: [
    {
      unique: true,
      fields: ['member_id', 'pocket_guide_id'],
      name: 'txn_member_pocket_guides_member_id_pocket_guide_id_uindex',
    },
    {
      unique: false,
      fields: ['member_id'],
      name: 'ix_txn_member_pocket_guide_member_id',
    },
  ],
})
export class TxnMemberPocketGuide extends Model<TxnMemberPocketGuide> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    field: 'member_pocket_guide_id',
    autoIncrement: true,
  })
  memberPocketGuideId: number;

  @BelongsTo(() => TxnMember, {
    foreignKey: 'memberId',
    targetKey: 'memberId',
    as: 'MemberPocketGuide',
    // uniqueKey:"fk_txn_member_pocket_guides_txn_members_id"
  })
  @Column({
    allowNull: false,
    field: 'member_id',
    type: DataType.INTEGER,
  })
  memberId: number;

  @BelongsTo(() => MstPocketGuide, {
    foreignKey: 'pocketGuideId',
    targetKey: 'pocketGuideId',
    as: 'MemberPocketGuidePocketGuide',
    // uniqueKey:"fk_txn_member_pocket_guides_mst_pocket_guides_id"
  })
  @Column({
    allowNull: false,
    field: 'pocket_guide_id',
    type: DataType.INTEGER,
  })
  pocketGuideId: number;

  @BelongsTo(() => MstAdminUser, {
    foreignKey: 'createdBy',
    targetKey: 'adminId',
    as: 'CreatedBy',
  })
  @Column({
    allowNull: true,
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
    allowNull: true,
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
