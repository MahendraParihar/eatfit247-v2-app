import { BelongsTo, Column, CreatedAt, DataType, Model, Scopes, Table, UpdatedAt } from 'sequelize-typescript';
import { MstAdminUser, getCreatedByUserInclude, getUpdatedByUserInclude } from '@server/common';
import { IMediaUpload, InputLengthEnum } from 'eatfit247-shared-lib';
import { MstProgramCategory } from './mst-program-category.model';

@Table({
  freezeTableName: true,
  modelName: 'mst_programs',
  schema: 'public',
  tableName: 'mst_programs',
})
@Scopes(() => ({
  list: {
    include: [
      getCreatedByUserInclude(false),
      getUpdatedByUserInclude(false),
      {
        model: MstProgramCategory,
        as: 'programCategory',
        required: false,
        attributes: ['programCategoryId', 'programCategory'],
      },
    ],
  },
  details: {
    include: [
      getCreatedByUserInclude(false),
      getUpdatedByUserInclude(false),
      {
        model: MstProgramCategory,
        as: 'programCategory',
        required: false,
        attributes: ['programCategoryId', 'programCategory'],
      },
    ],
  },
}))
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

  @BelongsTo(() => MstProgramCategory, { as: 'programCategory', foreignKey: 'programCategoryId', targetKey: 'programCategoryId' })
  programCategory: MstProgramCategory;

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
    allowNull: false,
    field: 'punch_line',
    type: DataType.STRING(250),
  })
  punchLine: string;

  @Column({
    allowNull: false,
    field: 'details',
    type: DataType.TEXT,
  })
  details: string;

  @Column({
    allowNull: false,
    field: 'image_path',
    type: DataType.JSONB,
  })
  imagePath: IMediaUpload[];

  @Column({
    allowNull: true,
    field: 'ideal_for',
    type: DataType.STRING(50),
  })
  idealFor: string;

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
    field: 'tags',
    allowNull: true,
    type: DataType.ARRAY(DataType.STRING),
  })
  tags: string[];

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
    type: DataType.BOOLEAN,
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

