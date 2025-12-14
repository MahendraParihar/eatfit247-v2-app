import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { MatChipInputEvent } from '@angular/material/chips';
import { ICommonSEO, InputLengthEnum } from '@eatfit247-shared-lib';

@Component({
  selector: 'app-seo-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatChipsModule,
    MatIconModule
  ],
  templateUrl: './seo-form.component.html',
  styleUrl: './seo-form.component.scss'
})
export class SeoFormComponent implements OnInit {
  @Input() formGroup!: FormGroup;
  @Input() seo?: ICommonSEO;
  tagsList: string[] = [];
  addOnBlur = true;
  readonly separatorKeysCodes = [ENTER, COMMA] as const;
  readonly maxMetaTitle = InputLengthEnum.CHAR_60;
  readonly maxMetaDescription = InputLengthEnum.CHAR_160;
  seoFormGroup: FormGroup = new FormGroup({
    tags: new FormControl(null),
    metaTitle: new FormControl(null, [Validators.maxLength(this.maxMetaTitle)]),
    metaDescription: new FormControl(null, [Validators.maxLength(this.maxMetaDescription)]),
    url: new FormControl(null)
  });

  ngOnInit(): void {
    this.formGroup.addControl('seo', this.seoFormGroup);
    this.bindSEO();
  }

  add(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    if (value) {
      const index = this.tagsList.indexOf(value);
      if (index >= 0) {
        event.chipInput!.clear();
        return;
      }
      this.tagsList.push(value);
      this.seoFormGroup.patchValue({ tags: this.tagsList.join(', ') });
    }
    event.chipInput!.clear();
  }

  remove(tag: string): void {
    const index = this.tagsList.indexOf(tag);
    if (index >= 0) {
      this.tagsList.splice(index, 1);
      this.seoFormGroup.patchValue({ tags: this.tagsList.join(', ') });
    }
  }

  private bindSEO(): void {
    if (!this.seo) {
      return;
    }
    this.tagsList = this.seo.tags && Array.isArray(this.seo.tags) ? this.seo.tags : [];
    this.seoFormGroup.patchValue({
      tags: this.tagsList.join(', '),
      metaTitle: this.seo.metaTitle,
      metaDescription: this.seo.metaDescription,
      url: this.seo.url
    });
  }
}
