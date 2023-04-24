import { BelongsTo, Column, DataType, Model, Table } from 'sequelize-typescript';
import { TxnDietTemplate } from './txn-diet-template.model';

@Table({
  modelName: 'txn_diet_template_diet_detail',
  schema: 'public',
  timestamps: false,
  indexes: [
    {
      unique: false,
      fields: ['diet_template_id'],
      name: 'ix_txn_diet_template_diet_details_diet_template_id',
    },
  ],
})
export class TxnDietTemplateDietDetail extends Model<TxnDietTemplateDietDetail> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    field: 'diet_template_diet_detail_id',
    autoIncrement: true,
  })
  dietTemplateDietDetailId: number;

  @BelongsTo(() => TxnDietTemplate, {
    foreignKey: 'dietTemplateId',
    targetKey: 'dietTemplateId',
    as: 'DietDetailDietTemplate',
  })
  @Column({
    allowNull: false,
    field: 'diet_template_id',
    type: DataType.INTEGER,
  })
  dietTemplateId: number;

  @Column({
    allowNull: false,
    field: 'cycle_no',
    type: DataType.INTEGER,
  })
  cycleNumber: number;

  @Column({
    allowNull: true,
    field: 'day_no',
    type: DataType.INTEGER,
  })
  dayNumber: number;

  @Column({
    allowNull: false,
    field: 'diet_detail',
    type: DataType.JSONB,
  })
  dietDetail: string;
}
