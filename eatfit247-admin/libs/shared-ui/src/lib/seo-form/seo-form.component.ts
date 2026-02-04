import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ICommonSEO } from '@eatfit247-shared-lib';

@Component({
  selector: 'shared-ui-seo-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule
  ],
  templateUrl: './seo-form.component.html',
  styleUrl: './seo-form.component.scss'
})
export class SeoFormComponent implements OnInit {
  @Input() formGroup!: FormGroup;

  @Input() set seo(d: ICommonSEO) {
    this._seo = d;
    this.bindSEO();
  };

  _seo!: ICommonSEO;
  seoFormGroup: FormGroup = new FormGroup({
    url: new FormControl(null)
  });

  ngOnInit(): void {
    this.formGroup.addControl('seo', this.seoFormGroup);
    this.bindSEO();
  }

  private bindSEO(): void {
    if (!this._seo) {
      return;
    }
    this.seoFormGroup.patchValue({
      url: this._seo.url,
    });
  }
}
