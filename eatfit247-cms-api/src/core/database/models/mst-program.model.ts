import { BelongsTo, Column, CreatedAt, DataType, Model, Table, UpdatedAt } from 'sequelize-typescript';
import { MstAdminUser } from './mst-admin-user.model';
import { MstProgramCategory } from './mst-program-category.model';

@Table({
  modelName: 'mst_program',
  schema: 'public',
})
export class MstProgram extends Model<MstProgram> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    field: 'program_id',
    autoIncrement: true,
  })
  programId: number;

  @Column({
    allowNull: false,
    field: 'program',
    type: DataType.STRING(100),
  })
  program: string;

  @BelongsTo(() => MstProgramCategory, {
    foreignKey: 'programCategoryId',
    targetKey: 'programCategoryId',
    as: 'ProgramCategory',
  })
  @Column({
    allowNull: false,
    field: 'program_category_id',
    type: DataType.INTEGER,
  })
  programCategoryId: number;

  @Column({
    allowNull: false,
    field: 'url',
    type: DataType.STRING(250),
  })
  url: string;

  @Column({
    allowNull: true,
    field: 'punch_line',
    type: DataType.STRING(250),
  })
  punchLine: string;

  @Column({
    allowNull: true,
    field: 'details',
    type: DataType.TEXT,
  })
  details: string;

  @Column({
    allowNull: true,
    field: 'ideal_for',
    type: DataType.STRING(50),
  })
  idealFor: string;

  @Column({
    allowNull: true,
    field: 'image_path',
    type: DataType.JSONB,
    defaultValue: null,
  })
  imagePath: string;

  @Column({
    allowNull: false,
    field: 'sequence_number',
    type: DataType.INTEGER,
  })
  sequenceNumber: number;

  @Column({
    allowNull: false,
    defaultValue: false,
    field: 'is_special_program',
    type: DataType.BOOLEAN,
  })
  isSpecialProgram: boolean;

  @Column({
    allowNull: true,
    field: 'video_url',
    type: DataType.STRING(500),
  })
  videoUrl: string;

  @Column({
    allowNull: true,
    field: 'tags',
    type: DataType.STRING(1000),
  })
  tags: string;

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
