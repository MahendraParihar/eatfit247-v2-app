import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { StringResources } from '../../../enum/string-resources';
import { IBlog } from 'shared-lib';

@Component({
  standalone: false,
  selector: 'app-preview-blog-dialog',
  templateUrl: './preview-blog-dialog.component.html',
  styleUrls: ['./preview-blog-dialog.component.scss']
})
export class PreviewBlogDialogComponent implements OnInit {
  dialogData: IBlog;
  stringRes = StringResources;

  constructor(public dialogRef: MatDialogRef<PreviewBlogDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: IBlog) {
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
