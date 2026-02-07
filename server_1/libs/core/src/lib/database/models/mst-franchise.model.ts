import { BelongsTo, Column, CreatedAt, DataType, Model, Scopes, Table, UpdatedAt } from 'sequelize-typescript';
import { MstAdminUser } from './admin';
import { CommonScopes } from '../../utils/model-scopes.utils';
import { BusinessTypeEnum, IMediaUpload, InputLengthEnum } from '@eatfit247-shared-lib';

@Table({
  freezeTableName: true,
  modelName: 'mst_franchises',
  schema: 'public',
  tableName: 'mst_franchises',
  indexes: [
    {
      unique: true,
      fields: ['email_id'],
      name: 'ix_uq_mst_franchise_email',
    },
  ],
})
@Scopes(() => ({
  list: CommonScopes.list(),
  details: CommonScopes.details(),
}))
export class MstFranchise extends Model<MstFranchise> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    field: 'franchise_id',
    autoIncrement: true,
  })
  declare franchiseId: number;
  @Column({
    allowNull: false,
    field: 'company_name',
    type: DataType.STRING(100),
  })
  declare companyName: string;
  @Column({
    allowNull: false,
    field: 'logo',
    type: DataType.JSONB,
  })
  declare logo: IMediaUpload[];
  @Column({
    allowNull: false,
    field: 'franchise_code',
    type: DataType.STRING(10),
  })
  declare franchiseCode: string;
  @Column({
    allowNull: false,
    field: 'financial_year',
    type: DataType.INTEGER,
  })
  declare financialYear: number;
  @Column({
    allowNull: false,
    field: 'first_name',
    type: DataType.STRING(50),
  })
  declare firstName: string;
  @Column({
    allowNull: false,
    field: 'last_name',
    type: DataType.STRING(50),
  })
  declare lastName: string;
  @Column({
    allowNull: false,
    unique: true,
    field: 'email_id',
    type: DataType.STRING(100),
  })
  declare emailId: string;
  @Column({
    allowNull: false,
    field: 'alternate_email_id',
    type: DataType.STRING(100),
  })
  declare alternateEmailId: string;
  @Column({
    allowNull: false,
    field: 'contact_number',
    type: DataType.STRING(16),
  })
  declare contactNumber: string;
  @Column({
    allowNull: false,
    field: 'alternate_contact_number',
    type: DataType.STRING(16),
  })
  declare alternateContactNumber: string;
  @Column({
    allowNull: true,
    field: 'pan_number',
    type: DataType.STRING(20),
  })
  declare panNumber: string;
  @Column({
    allowNull: true,
    field: 'tan_number',
    type: DataType.STRING(20),
  })
  declare tanNumber: string;
  @Column({
    allowNull: true,
    field: 'gst_number',
    type: DataType.STRING(50),
  })
  declare gstNumber: string;
  @Column({
    allowNull: true,
    field: 'vat_number',
    type: DataType.STRING(100),
  })
  declare vatNumber: string;
  @Column({
    allowNull: true,
    field: 'lut_number',
    type: DataType.STRING(100),
  })
  declare lutNumber: string;
  @Column({
    allowNull: true,
    field: 'international_tax_mode',
    type: DataType.ENUM('EXPORT_OF_SERVICE', 'LOCAL_FOREIGN_TAX'),
  })
  declare internationalTaxMode: 'EXPORT_OF_SERVICE' | 'LOCAL_FOREIGN_TAX';
  @Column({
    allowNull: true,
    field: 'bank_account_id',
    type: DataType.STRING(100),
  })
  declare bankAccountId: string;
  @Column({
    allowNull: true,
    field: 'payment_gateway_config_id',
    type: DataType.INTEGER,
  })
  declare paymentGatewayConfigId: number;
  @Column({
    allowNull: true,
    field: 'brand_name',
    type: DataType.STRING(100),
  })
  declare brandName: string;
  @Column({
    allowNull: false,
    field: 'start_date',
    type: DataType.DATEONLY,
  })
  declare startDate: Date;
  @Column({
    allowNull: true,
    field: 'end_date',
    type: DataType.DATEONLY,
  })
  declare endDate: Date;
  @Column({
    allowNull: false,
    defaultValue: false,
    field: 'is_primary',
    type: DataType.BOOLEAN,
  })
  declare isPrimary: boolean;
  @Column({
    allowNull: false,
    defaultValue: false,
    field: 'is_default',
    type: DataType.BOOLEAN,
  })
  declare isDefault: boolean;
  @Column({
    allowNull: true,
    field: 'business_type',
    type: 'public.business_type[]' as any,
  })
  declare businessType: BusinessTypeEnum[];
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

