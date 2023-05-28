import { Component, Inject, OnInit } from '@angular/core';
import { BlogModel } from '../../../models/blog.model';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { StringResources } from '../../../enum/string-resources';

@Component({
  selector: 'app-preview-blog-dialog',
  templateUrl: './preview-blog-dialog.component.html',
  styleUrls: ['./preview-blog-dialog.component.scss'],
})
export class PreviewBlogDialogComponent implements OnInit {
  dialogData: BlogModel;
  stringRes = StringResources;

  constructor(public dialogRef: MatDialogRef<PreviewBlogDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: BlogModel) {
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
