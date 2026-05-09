import { Column, CreatedAt, DataType, Model, Table } from 'sequelize-typescript';

@Table({
  freezeTableName: true,
  modelName: 'mst_admin_subjects',
  schema: 'public',
  tableName: 'mst_admin_subjects',
  timestamps: false,
})
export class MstAdminSubject extends Model<MstAdminSubject> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    field: 'subject_id',
    autoIncrement: true,
  })
  declare subjectId: number;

  @Column({
    allowNull: false,
    field: 'subject_code',
    type: DataType.STRING(100),
    unique: true,
  })
  declare subjectCode: string;

  @Column({
    allowNull: false,
    field: 'subject_name',
    type: DataType.STRING(100),
  })
  declare subjectName: string;

  @Column({
    allowNull: false,
    field: 'franchise_scoped',
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  declare franchiseScoped: boolean;

  @Column({
    allowNull: false,
    field: 'active',
    type: DataType.BOOLEAN,
    defaultValue: true,
  })
  declare active: boolean;

  @CreatedAt
  @Column({
    allowNull: false,
    field: 'created_at',
  })
  declare createdAt: Date;
}
