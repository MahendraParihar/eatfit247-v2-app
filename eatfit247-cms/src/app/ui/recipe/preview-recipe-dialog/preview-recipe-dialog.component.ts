import {Component, Inject, OnInit} from '@angular/core';
import {StringResources} from "../../../enum/string-resources";
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {RecipeModel} from "../../../models/recipe.model";

@Component({
  selector: 'app-preview-recipe-dialog',
  templateUrl: './preview-recipe-dialog.component.html',
  styleUrls: ['./preview-recipe-dialog.component.scss']
})
export class PreviewRecipeDialogComponent implements OnInit {

  dialogData: RecipeModel;
  stringRes = StringResources;

  constructor(public dialogRef: MatDialogRef<PreviewRecipeDialogComponent>,
              @Inject(MAT_DIALOG_DATA) public data: RecipeModel) {
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
