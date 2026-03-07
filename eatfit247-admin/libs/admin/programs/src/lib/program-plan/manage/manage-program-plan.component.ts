import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { Editor, NgxEditorComponent, NgxEditorMenuComponent } from 'ngx-editor';
import { InputErrorComponent, UploadFormComponent, ValidationUtil } from '@shared';
import { ProgramPlanApiService } from '../../program-plan-api.service';
import {
  FileTypeEnum,
  IDropdownItem,
  IManageProgramPlan,
  InputLengthEnum,
  IProgramPlan,
  MediaForEnum
} from '@eatfit247-shared-lib';

@Component({
  selector: 'lib-manage-program-plan',
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
    MatCheckboxModule,
    FormsModule,
    NgxEditorComponent,
    NgxEditorMenuComponent,
    InputErrorComponent,
    UploadFormComponent
  ],
  templateUrl: './manage-program-plan.html',
  styleUrl: './manage-program-plan.scss'
})
export class ManageProgramPlan implements OnInit, OnDestroy {
  private fb: FormBuilder = inject(FormBuilder);
  formGroup: FormGroup = this.fb.group({
    plan: ['', [Validators.required, Validators.minLength(InputLengthEnum.CHAR_2), Validators.maxLength(InputLengthEnum.CHAR_100)]],
    programPlanTypeId: ['', [Validators.required]],
    details: [''],
    sequenceNumber: [0, [Validators.required, Validators.min(0)]],
    inrAmount: [0, [Validators.required, Validators.min(0)]],
    noOfCycle: [1, [Validators.required, Validators.min(1)]],
    noOfDaysInCycle: [1, [Validators.required, Validators.min(1)]],
    isOnline: [true, [Validators.required]],
    isVisibleOnWeb: [false, [Validators.required]],
    active: [true, [Validators.required]]
  });
  initialData!: IProgramPlan;
  isEditMode = false;
  pageTitle = 'Create Program Plan';
  programPlanTypeOptions: IDropdownItem[] = [];
  mediaFor = MediaForEnum.PROGRAM;
  mediaType = FileTypeEnum.IMAGE;
  editor: Editor | null = null;

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private apiService = inject(ProgramPlanApiService);

  async ngOnInit(): Promise<void> {
    this.initializeEditor();
    await this.loadMasterData();
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEditMode = true;
      this.pageTitle = 'Edit Program Plan';
      await this.loadData(+id);
    } else {
      this.pageTitle = 'Create Program Plan';
    }
    this.buildForm();
  }

  private initializeEditor(): void {
    if (!this.editor) {
      this.editor = new Editor();
    }
  }

  private buildForm(): void {
    this.formGroup = this.fb.group({
      plan: [
        this.initialData?.plan || '',
        [
          Validators.required,
          Validators.minLength(InputLengthEnum.CHAR_2),
          Validators.maxLength(InputLengthEnum.CHAR_100)
        ]
      ],
      programPlanTypeId: [
        this.initialData?.programPlanTypeId || '',
        [Validators.required]
      ],
      details: [
        this.initialData?.details || '',
        []
      ],
      sequenceNumber: [
        this.initialData?.sequenceNumber || 0,
        [Validators.required, Validators.min(0)]
      ],
      inrAmount: [
        this.initialData?.inrAmount || 0,
        [Validators.required, Validators.min(0)]
      ],
      noOfCycle: [
        this.initialData?.noOfCycle || 1,
        [Validators.required, Validators.min(1)]
      ],
      noOfDaysInCycle: [
        this.initialData?.noOfDaysInCycle || 1,
        [Validators.required, Validators.min(1)]
      ],
      isOnline: [
        this.initialData?.isOnline !== undefined ? this.initialData.isOnline : true,
        [Validators.required]
      ],
      isVisibleOnWeb: [
        this.initialData?.isVisibleOnWeb !== undefined ? this.initialData.isVisibleOnWeb : false,
        [Validators.required]
      ],
      active: [
        this.initialData?.active !== undefined ? this.initialData.active : true,
        [Validators.required]
      ]
    });
  }

  async loadMasterData(): Promise<void> {
    try {
      const masterData = await this.apiService.getMasterData();
      this.programPlanTypeOptions = masterData.programPlanType || [];
    } catch (error) {
      // Error toast is handled by HttpErrorInterceptor
    }
  }

  async loadData(id: number): Promise<void> {
    try {
      this.initialData = await this.apiService.getById(id);
    } catch (error) {
      // Error toast is handled by HttpErrorInterceptor
    }
  }

  async onSubmit(): Promise<void> {
    ValidationUtil.validateAllFormFields(this.formGroup);
    if (this.formGroup.valid) {
      const formValue: IManageProgramPlan = { ...this.formGroup.value };

      // Handle imagePath from upload form
      if (this.formGroup.get('imagePath')) {
        const imagePathValue = this.formGroup.get('imagePath')?.value;
        formValue.imagePath = imagePathValue && imagePathValue.length > 0 ? imagePathValue : undefined;
      }

      if (this.isEditMode && this.initialData) {
        formValue.programPlanId = this.initialData.programPlanId;
        await this.apiService.update(this.initialData.programPlanId, formValue);
      } else {
        await this.apiService.create(formValue);
      }
      this.router.navigate(['/program-plans']);
    } else {
      this.formGroup.markAllAsTouched();
    }
  }

  onCancel(): void {
    this.router.navigate(['/program-plans']);
  }

  ngOnDestroy(): void {
    if (this.editor) {
      try {
        this.editor.destroy();
      } catch (error) {
        // Ignore destroy errors
      }
      this.editor = null as any;
    }
  }
}
