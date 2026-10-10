import { Column, CreatedAt, DataType, Model, Table, UpdatedAt } from 'sequelize-typescript';

/** Letter of Undertaking register of an Indian franchise (roadmap 4.6, decision 5). */
@Table({
  freezeTableName: true,
  modelName: 'mst_franchise_luts',
  schema: 'public',
  tableName: 'mst_franchise_luts',
})
export class MstFranchiseLut extends Model<MstFranchiseLut> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'franchise_lut_id',
  })
  declare franchiseLutId: number;

  @Column({ allowNull: false, field: 'franchise_id', type: DataType.INTEGER })
  declare franchiseId: number;

  @Column({ allowNull: false, field: 'arn', type: DataType.STRING(30) })
  declare arn: string;

  @Column({ allowNull: false, field: 'financial_year', type: DataType.STRING(10) })
  declare financialYear: string;

  @Column({ allowNull: true, field: 'valid_from', type: DataType.DATEONLY })
  declare validFrom: string | null;

  @Column({ allowNull: true, field: 'valid_to', type: DataType.DATEONLY })
  declare validTo: string | null;

  @Column({ allowNull: false, defaultValue: true, field: 'active', type: DataType.BOOLEAN })
  declare active: boolean;

  @Column({ allowNull: true, field: 'created_by', type: DataType.INTEGER })
  declare createdBy: number | null;

  @Column({ allowNull: true, field: 'modified_by', type: DataType.INTEGER })
  declare modifiedBy: number | null;

  @CreatedAt
  @Column({ allowNull: false, field: 'created_at' })
  declare createdAt: Date;

  @UpdatedAt
  @Column({ allowNull: false, field: 'updated_at' })
  declare updatedAt: Date;

  @Column({ allowNull: true, field: 'created_ip', type: DataType.STRING(50) })
  declare createdIp: string | null;

  @Column({ allowNull: true, field: 'modified_ip', type: DataType.STRING(50) })
  declare modifiedIp: string | null;
}
