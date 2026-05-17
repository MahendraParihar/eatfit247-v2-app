import { BelongsTo, Column, CreatedAt, DataType, Model, Scopes, Table, UpdatedAt } from 'sequelize-typescript';
import { MstAdminUser, MstFranchise, TxnContactForm } from '@server_1/core';
import { InputLengthEnum } from '@eatfit247-shared-lib';
import { MstAppointmentStatus } from './mst-appointment-status.model';
import { MstAppointmentType } from './mst-appointment-type.model';

@Table({
  freezeTableName: true,
  modelName: 'txn_appointments',
  schema: 'public',
  tableName: 'txn_appointments',
  indexes: [
    { fields: ['appointment_date'], name: 'ix_txn_appointments_date' },
    { fields: ['assigned_admin_id'], name: 'ix_txn_appointments_assigned_admin' },
    { fields: ['franchise_id'], name: 'ix_txn_appointments_franchise' },
    { fields: ['status'], name: 'ix_txn_appointments_status' },
    { fields: ['appointment_date', 'assigned_admin_id'], name: 'ix_txn_appointments_date_admin' },
  ],
})
@Scopes(() => ({
  list: {
    include: [
      {
        model: MstAdminUser,
        as: 'assignedAdmin',
        required: false,
        attributes: ['adminId', 'firstName', 'lastName', 'emailId'],
      },
      {
        model: MstAdminUser,
        as: 'bookedByAdmin',
        required: false,
        attributes: ['adminId', 'firstName', 'lastName'],
      },
      {
        model: MstFranchise,
        as: 'franchise',
        required: false,
        attributes: ['franchiseId', 'companyName'],
      },
      {
        model: MstAppointmentStatus,
        as: 'appointmentStatusRef',
        required: false,
        attributes: ['appointmentStatusId', 'appointmentStatus'],
      },
      {
        model: MstAppointmentType,
        as: 'appointmentTypeRef',
        required: false,
        attributes: ['appointmentTypeId', 'appointmentType'],
      },
    ],
  },
  details: {
    include: [
      {
        model: MstAdminUser,
        as: 'assignedAdmin',
        required: false,
        attributes: ['adminId', 'firstName', 'lastName', 'emailId', 'contactNumber'],
      },
      {
        model: MstAdminUser,
        as: 'bookedByAdmin',
        required: false,
        attributes: ['adminId', 'firstName', 'lastName'],
      },
      {
        model: MstFranchise,
        as: 'franchise',
        required: false,
        attributes: ['franchiseId', 'companyName'],
      },
      {
        model: MstAppointmentStatus,
        as: 'appointmentStatusRef',
        required: false,
        attributes: ['appointmentStatusId', 'appointmentStatus'],
      },
      {
        model: MstAppointmentType,
        as: 'appointmentTypeRef',
        required: false,
        attributes: ['appointmentTypeId', 'appointmentType'],
      },
      {
        model: TxnContactForm,
        as: 'contactForm',
        required: false,
      },
    ],
  },
}))
export class TxnAppointment extends Model<TxnAppointment> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    field: 'appointment_id',
    autoIncrement: true,
  })
  declare appointmentId: number;

  @Column({ allowNull: true, field: 'contact_form_id', type: DataType.INTEGER })
  declare contactFormId: number | null;

  @Column({ allowNull: true, field: 'member_id', type: DataType.INTEGER })
  declare memberId: number | null;

  @Column({ allowNull: false, field: 'assigned_admin_id', type: DataType.INTEGER })
  declare assignedAdminId: number;

  @Column({ allowNull: false, field: 'booked_by_admin_id', type: DataType.INTEGER })
  declare bookedByAdminId: number;

  @Column({ allowNull: false, field: 'franchise_id', type: DataType.INTEGER })
  declare franchiseId: number;

  @Column({ allowNull: false, field: 'appointment_date', type: DataType.DATEONLY })
  declare appointmentDate: string;

  @Column({ allowNull: false, field: 'start_time', type: DataType.TIME })
  declare startTime: string;

  @Column({ allowNull: false, field: 'end_time', type: DataType.TIME })
  declare endTime: string;

  @Column({ allowNull: false, field: 'status', type: DataType.INTEGER, defaultValue: 1 })
  declare status: number;

  @Column({ allowNull: false, field: 'appointment_type', type: DataType.INTEGER })
  declare appointmentType: number;

  @Column({ allowNull: true, field: 'guest_name', type: DataType.STRING(100) })
  declare guestName: string | null;

  @Column({ allowNull: true, field: 'guest_email', type: DataType.STRING(100) })
  declare guestEmail: string | null;

  @Column({ allowNull: true, field: 'guest_phone', type: DataType.STRING(25) })
  declare guestPhone: string | null;

  @Column({ allowNull: true, field: 'notes', type: DataType.TEXT })
  declare notes: string | null;

  @Column({ allowNull: true, field: 'cancellation_reason', type: DataType.STRING(500) })
  declare cancellationReason: string | null;

  @Column({ allowNull: true, field: 'google_event_id', type: DataType.STRING(255) })
  declare googleEventId: string | null;

  @Column({ allowNull: false, field: 'reminder_sent', type: DataType.BOOLEAN, defaultValue: false })
  declare reminderSent: boolean;

  @Column({ allowNull: false, field: 'active', type: DataType.BOOLEAN, defaultValue: true })
  declare active: boolean;

  @Column({ allowNull: false, field: 'created_by', type: DataType.INTEGER })
  declare createdBy: number;

  @Column({ allowNull: false, field: 'modified_by', type: DataType.INTEGER })
  declare modifiedBy: number;

  @Column({ allowNull: false, field: 'created_ip', type: DataType.STRING(InputLengthEnum.IP) })
  declare createdIp: string;

  @Column({ allowNull: false, field: 'modified_ip', type: DataType.STRING(InputLengthEnum.IP) })
  declare modifiedIp: string;

  @CreatedAt
  @Column({ allowNull: false, field: 'created_at', type: DataType.DATE, defaultValue: DataType.NOW })
  declare createdAt: Date;

  @UpdatedAt
  @Column({ allowNull: false, field: 'updated_at', type: DataType.DATE, defaultValue: DataType.NOW })
  declare updatedAt: Date;

  // Associations
  @BelongsTo(() => MstAdminUser, { foreignKey: 'assignedAdminId', targetKey: 'adminId', as: 'assignedAdmin' })
  declare assignedAdmin: MstAdminUser;

  @BelongsTo(() => MstAdminUser, { foreignKey: 'bookedByAdminId', targetKey: 'adminId', as: 'bookedByAdmin' })
  declare bookedByAdmin: MstAdminUser;

  @BelongsTo(() => MstFranchise, { foreignKey: 'franchiseId', targetKey: 'franchiseId', as: 'franchise' })
  declare franchise: MstFranchise;

  @BelongsTo(() => TxnContactForm, { foreignKey: 'contactFormId', targetKey: 'contactFormId', as: 'contactForm' })
  declare contactForm: TxnContactForm;

  @BelongsTo(() => MstAppointmentStatus, { foreignKey: 'status', targetKey: 'appointmentStatusId', as: 'appointmentStatusRef' })
  declare appointmentStatusRef: MstAppointmentStatus;

  @BelongsTo(() => MstAppointmentType, { foreignKey: 'appointmentType', targetKey: 'appointmentTypeId', as: 'appointmentTypeRef' })
  declare appointmentTypeRef: MstAppointmentType;
}
