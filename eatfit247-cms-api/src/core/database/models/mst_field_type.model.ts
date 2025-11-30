import { Column, DataType, Model, Table } from 'sequelize-typescript';

@Table({
  freezeTableName: true,
  modelName: 'mst_field_types',
  schema: 'public',
})
export class MstFieldType extends Model<MstFieldType> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    field: 'field_type_id',
    autoIncrement: true,
  })
  fieldTypeId: number;

  @Column({
    allowNull: false,
    field: 'field_type',
    type: DataType.STRING(50),
  })
  fieldType: string;
}
