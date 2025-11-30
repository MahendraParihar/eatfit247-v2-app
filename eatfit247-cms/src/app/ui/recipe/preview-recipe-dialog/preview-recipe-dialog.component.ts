import { Component, Inject, OnInit } from '@angular/core';
import { StringResources } from '../../../enum/string-resources';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { IRecipe } from 'shared-lib';

@Component({
  standalone: false,
  selector: 'app-preview-recipe-dialog',
  templateUrl: './preview-recipe-dialog.component.html',
  styleUrls: ['./preview-recipe-dialog.component.scss']
})
export class PreviewRecipeDialogComponent implements OnInit {
  dialogData: IRecipe;
  stringRes = StringResources;

  constructor(public dialogRef: MatDialogRef<PreviewRecipeDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: IRecipe) {
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
