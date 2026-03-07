import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { IMemberCallLog } from '@eatfit247-shared-lib';

const CallTypeEnum = {
  GOOGLE_MEET: 5,
  ZOOM_CALL: 6,
};

@Component({
  selector: 'lib-view-call-log-details',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
  ],
  templateUrl: './view-call-log-details.component.html',
  styleUrl: './view-call-log-details.component.scss',
})
export class ViewCallLogDetailsComponent {
  dialogRef = inject<MatDialogRef<ViewCallLogDetailsComponent>>(MatDialogRef);
  data = inject<IMemberCallLog>(MAT_DIALOG_DATA);


  onClose(): void {
    this.dialogRef.close();
  }

  getNutritionistName(): string {
    if (this.data.nutritionist) {
      return `${this.data.nutritionist.firstName || ''} ${this.data.nutritionist.lastName || ''}`.trim() || 'N/A';
    }
    return 'N/A';
  }

  getNutritionistEmail(): string | null {
    if (this.data.nutritionist && 'emailId' in this.data.nutritionist) {
      return (this.data.nutritionist as any).emailId || null;
    }
    return null;
  }

  hasNutritionistEmail(): boolean {
    return this.getNutritionistEmail() !== null;
  }

  getMeetingLink(): string {
    return this.data.meetingLink || 'N/A';
  }

  hasMeetingLink(): boolean {
    return !!this.data.meetingLink;
  }

  isGoogleMeet(): boolean {
    return this.data.callTypeId === CallTypeEnum.GOOGLE_MEET;
  }

  isZoomCall(): boolean {
    return this.data.callTypeId === CallTypeEnum.ZOOM_CALL;
  }

  getGoogleMeetLink(): string | null {
    if (this.isGoogleMeet() && this.data.detail?.google?.hangoutLink) {
      return this.data.detail.google.hangoutLink;
    }
    return null;
  }

  hasGoogleMeetLink(): boolean {
    return this.getGoogleMeetLink() !== null;
  }

  getGoogleCalendarLink(): string | null {
    if (this.isGoogleMeet() && this.data.detail?.google?.htmlLink) {
      return this.data.detail.google.htmlLink;
    }
    return null;
  }

  hasGoogleCalendarLink(): boolean {
    return this.getGoogleCalendarLink() !== null;
  }

  getZoomLink(): string | null {
    if (this.isZoomCall() && this.data.detail?.zoom?.join_url) {
      return this.data.detail.zoom.join_url;
    }
    return null;
  }

  hasZoomLink(): boolean {
    return this.getZoomLink() !== null;
  }
}

