import { Component, Inject, OnInit } from '@angular/core';
import { AlertDialogDataInterface } from '../../../../interfaces/alert-dialog-data.interface';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-info-dialog',
  templateUrl: './info-dialog.component.html',
  styleUrls: ['./info-dialog.component.scss'],
})
export class InfoDialogComponent implements OnInit {
  dialogData: AlertDialogDataInterface;

  constructor(public dialogRef: MatDialogRef<InfoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AlertDialogDataInterface) {
    this.dialogData = data;
  }

  ngOnInit(): void {
  }

  onPositiveClick(): void {
    this.closeDialog(true);
  }

  closeDialog(flag: boolean) {
    this.dialogRef.close(flag);
  }
}
