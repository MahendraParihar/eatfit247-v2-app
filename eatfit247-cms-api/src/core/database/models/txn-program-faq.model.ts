import { BelongsTo, Column, CreatedAt, DataType, Model, Table, UpdatedAt } from 'sequelize-typescript';
import { MstAdminUser } from './mst-admin-user.model';
import { MstProgram } from './mst-program.model';

@Table({
  modelName: 'txn_program_faq',
  schema: 'public',
})
export class TxnProgramFaq extends Model<TxnProgramFaq> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    field: 'program_faq_id',
    autoIncrement: true,
  })
  programFaqId: number;

  @BelongsTo(() => MstProgram, {
    foreignKey: 'programId',
    targetKey: 'programId',
    as: 'Program',
  })
  @Column({
    allowNull: false,
    field: 'program_id',
    type: DataType.INTEGER,
  })
  programId: number;

  @Column({
    allowNull: false,
    field: 'question',
    type: DataType.STRING(500),
  })
  question: string;

  @Column({
    allowNull: false,
    field: 'answer',
    type: DataType.TEXT,
  })
  answer: string;

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
