import { Component, inject, OnChanges, OnInit, signal, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { GoogleCalendarApiService } from '../google-calendar-api.service';
import { IAdminUser } from '@eatfit247-shared-lib';

@Component({
  selector: 'lib-calendar-integration',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatSnackBarModule
  ],
  templateUrl: './calendar-integration.component.html',
  styleUrl: './calendar-integration.component.scss'
})
export class CalendarIntegrationComponent implements OnInit, OnChanges {
  private googleCalendarApiService = inject(GoogleCalendarApiService);
  private snackBar = inject(MatSnackBar);
  isConnected = signal(false);
  connecting = signal(false);
  googleCalendarEmail = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    await this.extractQueryParameters();
    await this.checkGoogleCalendarStatus();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['adminUserData'] && changes['adminUserData'].currentValue) {
      this.checkConnectionStatus(changes['adminUserData'].currentValue);
    }
  }

  private async extractQueryParameters(): Promise<void> {
    const urlParams = new URLSearchParams(window.location.search);
    const calendarStatus = urlParams.get('calendar');
    // If redirected from a backend callback with success/error status
    if (calendarStatus === 'connected') {
      window.history.replaceState({}, '', '/setting');
      await this.checkGoogleCalendarStatus();
    } else if (calendarStatus === 'error') {
      window.history.replaceState({}, '', '/setting');
    }
  }

  private async checkGoogleCalendarStatus(): Promise<void> {
    try {
      const status = await this.googleCalendarApiService.getStatus();
      this.isConnected.set(status.connected);
      if (status.connected && status.email) {
        this.googleCalendarEmail.set(status.email);
      } else {
        this.googleCalendarEmail.set(null);
      }
    } catch (error) {
      this.isConnected.set(false);
      this.googleCalendarEmail.set(null);
    }
  }

  private checkConnectionStatus(adminUser: IAdminUser): void {
    // Check if Google Calendar is connected by checking googleCalendarEmail
    if (adminUser.googleCalendarEmail) {
      this.isConnected.set(true);
      this.googleCalendarEmail.set(adminUser.googleCalendarEmail);
    } else {
      this.isConnected.set(false);
      this.googleCalendarEmail.set(null);
    }
  }

  async connectGoogleCalendar(): Promise<void> {
    this.connecting.set(true);
    try {
      const response = await this.googleCalendarApiService.connect();
      if (response.redirectUrl) {
        // Reset connecting before redirect to prevent stuck loading state
        // if user navigates back or redirect fails
        this.connecting.set(false);
        window.location.href = response.redirectUrl;
      } else {
        this.connecting.set(false);
      }
    } catch (error) {
      this.snackBar.open('Failed to connect Google Calendar. Please try again.', 'Close', {
        duration: 5000,
      });
      this.connecting.set(false);
    }
  }

  async disconnectGoogleCalendar(): Promise<void> {
    await this.googleCalendarApiService.disconnect();
    this.isConnected.set(false);
    this.googleCalendarEmail.set(null);
  }
}
