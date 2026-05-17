import { Route } from '@angular/router';
import { AppointmentList } from './appointment.component';
import { ManageAppointment } from './manage/manage-appointment.component';

export const appointmentRoutes: Route[] = [
  { path: '', component: AppointmentList, title: 'Appointments' },
  { path: 'new', component: ManageAppointment, title: 'Book Appointment' },
  { path: 'edit/:id', component: ManageAppointment, title: 'Edit Appointment' },
];
