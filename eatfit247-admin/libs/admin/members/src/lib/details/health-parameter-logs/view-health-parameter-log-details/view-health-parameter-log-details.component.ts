import { Component, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { IMemberHealthParameterLog } from '@eatfit247-shared-lib';

@Component({
  selector: 'lib-view-health-parameter-log-details',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    DatePipe,
  ],
  templateUrl: './view-health-parameter-log-details.component.html',
  styleUrl: './view-health-parameter-log-details.component.scss',
})
export class ViewHealthParameterLogDetailsComponent {
  dialogRef = inject<MatDialogRef<ViewHealthParameterLogDetailsComponent>>(MatDialogRef);
  data = inject<IMemberHealthParameterLog>(MAT_DIALOG_DATA);


  onClose(): void {
    this.dialogRef.close();
  }
}

