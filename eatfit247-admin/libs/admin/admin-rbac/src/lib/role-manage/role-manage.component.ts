import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { InputErrorComponent, ValidationUtil } from '@shared';
import { AdminRbacApiService } from '../api.service';
import { IAdminRole, IManageAdminRole, InputLengthEnum } from '@eatfit247-shared-lib';

@Component({
  selector: 'lib-role-manage',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatCheckboxModule,
    InputErrorComponent,
  ],
  templateUrl: './role-manage.html',
  styleUrl: './role-manage.scss',
})
export class RoleManage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private apiService = inject(AdminRbacApiService);
  private fb = inject(FormBuilder);

  formGroup!: FormGroup;
  initialData!: IAdminRole;
  isEditMode = false;
  pageTitle = 'Create Role';

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEditMode = true;
      this.pageTitle = 'Edit Role';
      await this.loadData(+id);
    }
    this.buildForm();
  }

  private buildForm(): void {
    this.formGroup = this.fb.group({
      role: [
        this.initialData?.role || '',
        [Validators.required, Validators.minLength(InputLengthEnum.CHAR_2), Validators.maxLength(InputLengthEnum.CHAR_50)],
      ],
      roleCode: [
        this.initialData?.roleCode || '',
        [Validators.required, Validators.minLength(InputLengthEnum.CHAR_2), Validators.maxLength(InputLengthEnum.CHAR_100)],
      ],
      grantAllOnNewSubject: [this.initialData?.grantAllOnNewSubject ?? false],
    });
  }

  async loadData(id: number): Promise<void> {
    this.initialData = await this.apiService.getById(id);
  }

  async onSubmit(): Promise<void> {
    ValidationUtil.validateAllFormFields(this.formGroup);
    if (this.formGroup.valid) {
      const formValue: IManageAdminRole = { ...this.formGroup.value };
      if (this.isEditMode && this.initialData) {
        await this.apiService.update(this.initialData.roleId, formValue);
      } else {
        await this.apiService.create(formValue);
      }
      this.router.navigate(['/admin-rbac']);
    } else {
      this.formGroup.markAllAsTouched();
    }
  }

  onCancel(): void {
    this.router.navigate(['/admin-rbac']);
  }
}
