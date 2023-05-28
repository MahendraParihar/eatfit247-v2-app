import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AlertDialogDataInterface } from '../../../../interfaces/alert-dialog-data.interface';
import { AlertTypeEnum } from '../../../../enum/alert-type-enum';

@Component({
  selector: 'app-dialog-alert',
  templateUrl: './dialog-alert.component.html',
  styleUrls: ['./dialog-alert.component.scss'],
})
export class DialogAlertComponent implements OnInit {
  dialogData: AlertDialogDataInterface;
  alertTypeEnum = AlertTypeEnum;

  constructor(public dialogRef: MatDialogRef<DialogAlertComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AlertDialogDataInterface) {
    this.dialogData = data;
  }

  ngOnInit(): void {
  }

  onPositiveClick(): void {
    this.closeDialog(true);
  }

  onNegativeClick(): void {
    this.closeDialog(false);
  }

  closeDialog(flag: boolean) {
    this.dialogRef.close(flag);
  }
}
