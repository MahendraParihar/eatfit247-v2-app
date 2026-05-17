import { Injectable, inject } from '@angular/core';
import { HttpService } from '@core';
import { ITableList } from '@eatfit247-shared-lib';

export interface IAppointment {
  appointmentId: number;
  contactFormId: number | null;
  memberId: number | null;
  assignedAdminId: number;
  bookedByAdminId: number;
  franchiseId: number;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  status: number;
  appointmentType: number;
  guestName: string | null;
  guestEmail: string | null;
  guestPhone: string | null;
  notes: string | null;
  cancellationReason: string | null;
  googleEventId: string | null;
  active: boolean;
  createdBy: number;
  modifiedBy: number;
  createdAt: string;
  updatedAt: string;
  assignedAdmin?: { adminId: number; firstName: string; lastName: string; emailId: string };
  bookedByAdmin?: { adminId: number; firstName: string; lastName: string };
  franchise?: { franchiseId: number; franchise: string };
  appointmentStatusRef?: { appointmentStatusId: number; appointmentStatus: string };
  appointmentTypeRef?: { appointmentTypeId: number; appointmentType: string };
}

export interface ICreateAppointment {
  assignedAdminId: number;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  appointmentType: number;
  contactFormId?: number;
  memberId?: number;
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
  notes?: string;
}

export interface IUpdateAppointment {
  appointmentDate?: string;
  startTime?: string;
  endTime?: string;
  status?: number;
  cancellationReason?: string;
  notes?: string;
}

export interface INutritionist {
  adminId: number;
  firstName: string;
  lastName: string;
  emailId: string;
  hasGoogleCalendar: boolean;
}

export interface ITimeSlot {
  start: string;
  end: string;
  available: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class AppointmentApiService {
  private httpService = inject(HttpService);
  private readonly endpoint = '/appointment';

  async getList(params?: Record<string, unknown>): Promise<ITableList<IAppointment>> {
    const res = await this.httpService.get<ITableList<IAppointment>>(`${this.endpoint}/list`, { params });
    return res.data as ITableList<IAppointment>;
  }

  async getById(id: number): Promise<IAppointment> {
    const res = await this.httpService.get<IAppointment>(`${this.endpoint}/manage/${id}`);
    return res.data as IAppointment;
  }

  async create(data: ICreateAppointment): Promise<void> {
    await this.httpService.post<void>(`${this.endpoint}/manage`, data);
  }

  async update(id: number, data: IUpdateAppointment): Promise<void> {
    await this.httpService.put<void>(`${this.endpoint}/manage/${id}`, data);
  }

  async delete(id: number): Promise<void> {
    await this.httpService.delete<void>(`${this.endpoint}/manage/${id}`);
  }

  async getNutritionists(): Promise<INutritionist[]> {
    const res = await this.httpService.get<INutritionist[]>(`${this.endpoint}/availability/nutritionists`);
    return res.data as INutritionist[];
  }

  async getSlots(nutritionistId: number, fromDate: string, toDate: string): Promise<ITimeSlot[]> {
    const res = await this.httpService.get<ITimeSlot[]>(
      `${this.endpoint}/availability/slots/${nutritionistId}`,
      { params: { fromDate, toDate } }
    );
    return res.data as ITimeSlot[];
  }
}
