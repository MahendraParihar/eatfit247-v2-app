import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {MemberAssessmentModel} from "../../../models/member.model";
import {StringResources} from "../../../enum/string-resources";

@Component({
  selector: 'app-assessment-detail-dialog',
  templateUrl: './assessment-detail-dialog.component.html',
  styleUrls: ['./assessment-detail-dialog.component.scss']
})
export class AssessmentDetailDialogComponent implements OnInit {

  assessmentObj: MemberAssessmentModel;
  stringRes = StringResources;

  constructor(public dialogRef: MatDialogRef<AssessmentDetailDialogComponent>,
              @Inject(MAT_DIALOG_DATA) public data: MemberAssessmentModel) {
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
