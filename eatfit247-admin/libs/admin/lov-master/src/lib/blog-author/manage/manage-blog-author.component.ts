import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { InputErrorComponent, UploadFormComponent, ValidationUtil } from '@shared';
import { BlogAuthorApiService } from '../../api.service';
import { FileTypeEnum, IBlogAuthor, IManageBlogAuthor, InputLengthEnum, MediaForEnum } from '@eatfit247-shared-lib';

@Component({
  selector: 'lib-manage-blog-author',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatCardModule,
    InputErrorComponent,
    UploadFormComponent
  ],
  templateUrl: './manage-blog-author.html',
  styleUrl: './manage-blog-author.scss'
})
export class ManageBlogAuthor implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private apiService = inject(BlogAuthorApiService);

  private fb: FormBuilder = inject(FormBuilder);
  formGroup: FormGroup = this.fb.group({
    firstName: ['', [Validators.required, Validators.minLength(InputLengthEnum.CHAR_2), Validators.maxLength(InputLengthEnum.CHAR_50)]],
    lastName: ['', [Validators.required, Validators.minLength(InputLengthEnum.CHAR_2), Validators.maxLength(InputLengthEnum.CHAR_50)]],
    emailId: ['', [Validators.required, Validators.email, Validators.maxLength(InputLengthEnum.MAX_EMAIL)]],
    countryCode: ['', [Validators.required, Validators.maxLength(InputLengthEnum.MAX_COUNTRY_CODE)]],
    contactNumber: ['', [Validators.required, Validators.minLength(InputLengthEnum.MIN_CONTACT_NUMBER), Validators.maxLength(InputLengthEnum.MAX_CONTACT_NUMBER)]],
    linkedUrl: ['', [Validators.maxLength(InputLengthEnum.CHAR_200)]],
    active: [true, [Validators.required]]
  });
  initialData!: IBlogAuthor;
  mediaFor = MediaForEnum.BLOG_AUTHOR;
  mediaType = FileTypeEnum.IMAGE;
  isEditMode = false;
  pageTitle = 'Create Blog Author';

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEditMode = true;
      this.pageTitle = 'Edit Blog Author';
      await this.loadData(+id);
    } else {
      this.pageTitle = 'Create Blog Author';
    }
    this.buildForm();
  }

  private buildForm(): void {
    this.formGroup = this.fb.group({
      firstName: [
        this.initialData?.firstName || '',
        [
          Validators.required,
          Validators.minLength(InputLengthEnum.CHAR_2),
          Validators.maxLength(InputLengthEnum.CHAR_50)
        ]
      ],
      lastName: [
        this.initialData?.lastName || '',
        [
          Validators.required,
          Validators.minLength(InputLengthEnum.CHAR_2),
          Validators.maxLength(InputLengthEnum.CHAR_50)
        ]
      ],
      emailId: [
        this.initialData?.emailId || '',
        [Validators.required, Validators.email, Validators.maxLength(InputLengthEnum.MAX_EMAIL)]
      ],
      countryCode: [
        this.initialData?.countryCode || '',
        [Validators.required, Validators.maxLength(InputLengthEnum.MAX_COUNTRY_CODE)]
      ],
      contactNumber: [
        this.initialData?.contactNumber || '',
        [
          Validators.required,
          Validators.minLength(InputLengthEnum.MIN_CONTACT_NUMBER),
          Validators.maxLength(InputLengthEnum.MAX_CONTACT_NUMBER)
        ]
      ],
      linkedUrl: [this.initialData?.linkedUrl || '', [Validators.maxLength(InputLengthEnum.CHAR_200)]],
      active: [this.initialData?.active !== undefined ? this.initialData.active : true]
    });
  }

  async loadData(id: number): Promise<void> {
    this.initialData = await this.apiService.getById(id);
  }

  async onSubmit(): Promise<void> {
    ValidationUtil.validateAllFormFields(this.formGroup);
    if (this.formGroup.valid) {
      const formValue: IManageBlogAuthor = { ...this.formGroup.value };
      const uploadFilesControl = this.formGroup.get('profilePicture');
      if (uploadFilesControl && uploadFilesControl.value && uploadFilesControl.value.length > 0) {
        formValue.profilePicture = uploadFilesControl.value;
      }
      if (!formValue.linkedUrl) {
        delete formValue.linkedUrl;
      }
      if (this.isEditMode && this.initialData) {
        formValue.blogAuthorId = this.initialData.blogAuthorId;
        await this.apiService.update(this.initialData.blogAuthorId, formValue);
      } else {
        await this.apiService.create(formValue);
      }
      this.router.navigate(['/lov-master/blog-author']);
    } else {
      this.formGroup.markAllAsTouched();
    }
  }

  onCancel(): void {
    this.router.navigate(['/lov-master/blog-author']);
  }
}
