import { BelongsTo, Column, DataType, Model, Table } from 'sequelize-typescript';
import { TxnDietTemplate } from './txn-diet-template.model';
import { IDietPlanDetail } from '@eatfit247-shared-lib';

@Table({
  freezeTableName: true,
  modelName: 'txn_diet_template_diet_details',
  schema: 'public',
  tableName: 'txn_diet_template_diet_details',
  timestamps: false,
})
export class TxnDietTemplateDietDetail extends Model<TxnDietTemplateDietDetail> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    field: 'diet_template_diet_detail_id',
    autoIncrement: true,
  })
  declare dietTemplateDietDetailId: number;

  @BelongsTo(() => TxnDietTemplate, {
    foreignKey: 'dietTemplateId',
    targetKey: 'dietTemplateId',
    as: 'dietTemplate',
  })
  declare dietTemplate: TxnDietTemplate;

  @Column({
    allowNull: false,
    field: 'diet_template_id',
    type: DataType.INTEGER,
  })
  declare dietTemplateId: number;

  @Column({
    allowNull: false,
    field: 'cycle_no',
    type: DataType.INTEGER,
  })
  declare cycleNo: number;

  @Column({
    allowNull: true,
    field: 'day_no',
    type: DataType.INTEGER,
  })
  declare dayNo: number;

  @Column({
    allowNull: false,
    field: 'diet_detail',
    type: DataType.JSONB,
  })
  declare dietDetail: IDietPlanDetail[];
}
