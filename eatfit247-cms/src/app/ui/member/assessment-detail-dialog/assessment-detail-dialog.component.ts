import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { StringResources } from '../../../enum/string-resources';
import { IMemberAssessment } from 'shared-lib';

@Component({
  standalone: false,
  selector: 'app-assessment-detail-dialog',
  templateUrl: './assessment-detail-dialog.component.html',
  styleUrls: ['./assessment-detail-dialog.component.scss']
})
export class AssessmentDetailDialogComponent implements OnInit {
  assessmentObj: IMemberAssessment;
  stringRes = StringResources;

  constructor(public dialogRef: MatDialogRef<AssessmentDetailDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: IMemberAssessment) {
    this.assessmentObj = data;
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
