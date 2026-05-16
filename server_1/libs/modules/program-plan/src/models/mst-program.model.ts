import { BelongsTo, Column, CreatedAt, DataType, Model, Scopes, Table, UpdatedAt } from 'sequelize-typescript';
import { getCreatedByUserInclude, getUpdatedByUserInclude, MstAdminUser } from '@server_1/core';
import { IMediaUpload, InputLengthEnum } from '@eatfit247-shared-lib';

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
    ],
  },
  details: {
    include: [
      getCreatedByUserInclude(false),
      getUpdatedByUserInclude(false),
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
  declare programId: number;

  @Column({
    allowNull: false,
    field: 'program',
    type: DataType.STRING(100),
  })
  declare program: string;

  @Column({
    allowNull: false,
    field: 'url',
    type: DataType.STRING(250),
  })
  declare url: string;

  @Column({
    allowNull: false,
    field: 'punch_line',
    type: DataType.STRING(250),
  })
  declare punchLine: string;

  @Column({
    allowNull: false,
    field: 'details',
    type: DataType.TEXT,
  })
  declare details: string;

  @Column({
    allowNull: false,
    field: 'image_path',
    type: DataType.JSONB,
  })
  declare imagePath: IMediaUpload[];

  @Column({
    allowNull: true,
    field: 'ideal_for',
    type: DataType.STRING(50),
  })
  declare idealFor: string;

  @Column({
    allowNull: false,
    field: 'sequence_number',
    type: DataType.INTEGER,
  })
  declare sequenceNumber: number;

  @Column({
    allowNull: false,
    defaultValue: false,
    field: 'is_special_program',
    type: DataType.BOOLEAN,
  })
  declare isSpecialProgram: boolean;

  @Column({
    allowNull: true,
    field: 'video_url',
    type: DataType.STRING(500),
  })
  declare videoUrl: string;

  @Column({
    allowNull: true,
    field: 'start_date',
    type: DataType.DATEONLY,
  })
  declare startDate: string | null;

  @Column({
    allowNull: true,
    field: 'end_date',
    type: DataType.DATEONLY,
  })
  declare endDate: string | null;

  @Column({
    allowNull: true,
    field: 'max_people_can_register',
    type: DataType.INTEGER,
  })
  declare maxPeopleCanRegister: number | null;

  @Column({
    allowNull: false,
    defaultValue: true,
    field: 'active',
    type: DataType.BOOLEAN,
  })
  declare active: boolean;

  @BelongsTo(() => MstAdminUser, { as: 'createdByUser', foreignKey: 'createdBy', targetKey: 'adminId' })
  declare createdByUser: MstAdminUser;

  @BelongsTo(() => MstAdminUser, { as: 'updatedByUser', foreignKey: 'modifiedBy', targetKey: 'adminId' })
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
