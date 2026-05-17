import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { Editor, NgxEditorComponent, NgxEditorMenuComponent } from 'ngx-editor';
import {
  AlertDialogComponent,
  AlertDialogData,
  InputErrorComponent,
  SeoFormComponent,
  UploadFormComponent,
  ValidationUtil,
} from '@shared';
import { ProgramPlanMasters, ProgramsApiService } from '../api.service';
import {
  CommonUtil,
  FileTypeEnum,
  IDropdownItem,
  IManageProgram,
  IManageProgramPlan,
  InputLengthEnum,
  IProgram,
  MediaForEnum,
} from '@eatfit247-shared-lib';

@Component({
  selector: 'lib-manage-program',
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
    MatDatepickerModule,
    MatNativeDateModule,
    MatSnackBarModule,
    MatDialogModule,
    FormsModule,
    NgxEditorComponent,
    NgxEditorMenuComponent,
    InputErrorComponent,
    UploadFormComponent,
    SeoFormComponent,
  ],
  templateUrl: './manage-program.html',
  styleUrl: './manage-program.scss',
})
export class ManageProgram implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private apiService = inject(ProgramsApiService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  private fb: FormBuilder = inject(FormBuilder);
  formGroup: FormGroup = this.fb.group({
    program: ['', [Validators.required, Validators.minLength(InputLengthEnum.CHAR_2), Validators.maxLength(InputLengthEnum.CHAR_100)]],
    punchLine: ['', [Validators.required, Validators.maxLength(InputLengthEnum.CHAR_250)]],
    details: ['', [Validators.required]],
    idealFor: ['', [Validators.maxLength(InputLengthEnum.CHAR_50)]],
    sequenceNumber: [0, [Validators.required, Validators.min(0)]],
    isSpecialProgram: [false, [Validators.required]],
    startDate: [null as Date | null],
    endDate: [null as Date | null],
    maxPeopleCanRegister: [null as number | null, [Validators.min(0)]],
    videoUrl: ['', [Validators.maxLength(InputLengthEnum.CHAR_500)]],
    active: [true, [Validators.required]],
    programPlan: this.buildProgramPlanGroup(),
  });
  initialData!: IProgram;
  isEditMode = false;
  pageTitle = 'Create Program';
  mediaFor = MediaForEnum.PROGRAM;
  mediaType = FileTypeEnum.IMAGE;
  editor: Editor | null = null;
  currencies: IDropdownItem[] = [];
  private urlManuallyEdited = false;

  async ngOnInit(): Promise<void> {
    this.initializeEditor();
    await this.loadMasters();
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEditMode = true;
      this.pageTitle = 'Edit Program';
      await this.loadData(+id);
    } else {
      this.pageTitle = 'Create Program';
    }
    this.patchFormValues();
    this.applySpecialProgramValidators(this.formGroup.get('isSpecialProgram')?.value);
    this.setupUrlAutoFill();
    this.setupPlanNameAutoFill();
    this.formGroup.get('isSpecialProgram')?.valueChanges.subscribe((isSpecial: boolean) => {
      this.applySpecialProgramValidators(isSpecial);
      if (!isSpecial) {
        this.formGroup.patchValue({
          startDate: null,
          endDate: null,
          maxPeopleCanRegister: null,
        }, { emitEvent: false });
        this.resetProgramPlanGroup();
      }
    });
  }

  private async loadMasters(): Promise<void> {
    try {
      const masters: ProgramPlanMasters = await this.apiService.getProgramPlanMasters();
      this.currencies = masters.currencies || [];
    } catch {
      this.currencies = [];
    }
  }

  private buildProgramPlanGroup(): FormGroup {
    return this.fb.group({
      plan: ['', [Validators.minLength(InputLengthEnum.CHAR_2), Validators.maxLength(InputLengthEnum.CHAR_100)]],
      details: [''],
      sequenceNumber: [0, [Validators.min(0)]],
      noOfCycle: [1, [Validators.min(1)]],
      noOfDaysInCycle: [1, [Validators.min(1)]],
      isOnline: [true],
      isVisibleOnWeb: [true],
      active: [true],
      programPlanFees: this.fb.array([this.buildFeeRow()]),
    });
  }

  private buildFeeRow(currencyCode: string | null = null, fees: number | null = null): FormGroup {
    return this.fb.group({
      currencyCode: [currencyCode],
      fees: [fees, [Validators.min(0)]],
    });
  }

  get programPlanGroup(): FormGroup {
    return this.formGroup.get('programPlan') as FormGroup;
  }

  get programPlanFees(): FormArray {
    return this.programPlanGroup.get('programPlanFees') as FormArray;
  }

  addFeeRow(): void {
    this.programPlanFees.push(this.buildFeeRow());
  }

  async removeFeeRow(index: number): Promise<void> {
    if (this.programPlanFees.length <= 1) {
      return;
    }
    const row = this.programPlanFees.at(index)?.value;
    const hasData = row && (row.currencyCode || (row.fees !== null && row.fees !== undefined && row.fees !== ''));
    if (hasData) {
      const confirmed = await this.confirm({
        title: 'Remove fee row?',
        message: 'This will remove the fee row from this plan. Continue?',
        positiveBtnTxt: 'Remove',
        negativeBtnTxt: 'Cancel',
        alertType: 'warning',
      });
      if (!confirmed) {
        return;
      }
    }
    this.programPlanFees.removeAt(index);
  }

  private resetProgramPlanGroup(): void {
    while (this.programPlanFees.length > 0) {
      this.programPlanFees.removeAt(0);
    }
    this.programPlanGroup.reset(
      {
        plan: '',
        details: '',
        sequenceNumber: 0,
        noOfCycle: 1,
        noOfDaysInCycle: 1,
        isOnline: true,
        isVisibleOnWeb: true,
        active: true,
      },
      { emitEvent: false },
    );
    this.programPlanFees.push(this.buildFeeRow());
  }

  private patchProgramPlanGroup(plan: IManageProgramPlan): void {
    this.programPlanGroup.patchValue(
      {
        plan: plan.plan || '',
        details: plan.details || '',
        sequenceNumber: plan.sequenceNumber ?? 0,
        noOfCycle: plan.noOfCycle ?? 1,
        noOfDaysInCycle: plan.noOfDaysInCycle ?? 1,
        isOnline: plan.isOnline ?? true,
        isVisibleOnWeb: plan.isVisibleOnWeb ?? true,
        active: plan.active ?? true,
      },
      { emitEvent: false },
    );
    while (this.programPlanFees.length > 0) {
      this.programPlanFees.removeAt(0);
    }
    const fees = Array.isArray(plan.programPlanFees) && plan.programPlanFees.length > 0
      ? plan.programPlanFees
      : [{ currencyCode: '', fees: 0 }];
    for (const f of fees) {
      this.programPlanFees.push(this.buildFeeRow(f.currencyCode, f.fees));
    }
  }

  private setupPlanNameAutoFill(): void {
    const planControl = this.programPlanGroup.get('plan');
    const programControl = this.formGroup.get('program');
    if (!planControl || !programControl) {
      return;
    }
    if (programControl.value) {
      planControl.setValue(programControl.value, { emitEvent: false });
    }
    programControl.valueChanges.subscribe((name: string) => {
      planControl.setValue(name || '', { emitEvent: false });
    });
  }

  private setupUrlAutoFill(): void {
    // The SEO sub-form is registered in SeoFormComponent.ngOnInit (child runs after parent),
    // so defer until the child has attached the 'seo' control.
    Promise.resolve().then(() => {
      const urlControl = this.formGroup.get('seo.url');
      if (!urlControl) {
        return;
      }
      // In edit mode, treat an existing URL as user-owned — don't overwrite it.
      if (this.isEditMode && urlControl.value) {
        this.urlManuallyEdited = true;
      }
      urlControl.valueChanges.subscribe((value: string | null) => {
        const programVal = this.formGroup.get('program')?.value || '';
        const expectedSlug = CommonUtil.slugify(programVal);
        // Mark as manually edited unless the change came from us (matches current slug).
        if ((value || '') !== expectedSlug) {
          this.urlManuallyEdited = true;
        }
      });
      this.formGroup.get('program')?.valueChanges.subscribe((name: string) => {
        if (this.urlManuallyEdited) {
          return;
        }
        urlControl.setValue(CommonUtil.slugify(name || ''), { emitEvent: false });
      });
    });
  }

  private applySpecialProgramValidators(isSpecial: boolean): void {
    const startDate = this.formGroup.get('startDate');
    const endDate = this.formGroup.get('endDate');
    const maxPeople = this.formGroup.get('maxPeopleCanRegister');
    if (isSpecial) {
      startDate?.setValidators([Validators.required]);
      endDate?.setValidators([Validators.required]);
      maxPeople?.setValidators([Validators.required, Validators.min(1)]);
    } else {
      startDate?.clearValidators();
      endDate?.clearValidators();
      maxPeople?.clearValidators();
    }
    startDate?.updateValueAndValidity({ emitEvent: false });
    endDate?.updateValueAndValidity({ emitEvent: false });
    maxPeople?.updateValueAndValidity({ emitEvent: false });
    this.applyProgramPlanValidators(isSpecial);
  }

  private applyProgramPlanValidators(isSpecial: boolean): void {
    const required: Array<{ name: string; validators: any[] }> = [
      { name: 'plan', validators: [Validators.required, Validators.minLength(InputLengthEnum.CHAR_2), Validators.maxLength(InputLengthEnum.CHAR_100)] },
      { name: 'noOfCycle', validators: [Validators.required, Validators.min(1)] },
      { name: 'noOfDaysInCycle', validators: [Validators.required, Validators.min(1)] },
    ];
    for (const f of required) {
      const ctrl = this.programPlanGroup.get(f.name);
      if (!ctrl) {
        continue;
      }
      if (isSpecial) {
        ctrl.setValidators(f.validators);
      } else {
        ctrl.clearValidators();
      }
      ctrl.updateValueAndValidity({ emitEvent: false });
    }
    for (const row of this.programPlanFees.controls) {
      this.applyFeeRowValidators(row as FormGroup, isSpecial);
    }
  }

  private applyFeeRowValidators(row: FormGroup, isSpecial: boolean): void {
    const cur = row.get('currencyCode');
    const amt = row.get('fees');
    if (isSpecial) {
      cur?.setValidators([Validators.required]);
      amt?.setValidators([Validators.required, Validators.min(0)]);
    } else {
      cur?.clearValidators();
      amt?.clearValidators();
    }
    cur?.updateValueAndValidity({ emitEvent: false });
    amt?.updateValueAndValidity({ emitEvent: false });
  }

  private initializeEditor(): void {
    if (!this.editor) {
      this.editor = new Editor();
    }
  }

  private patchFormValues(): void {
    if (this.initialData) {
      this.formGroup.patchValue({
        program: this.initialData.program || '',
        punchLine: this.initialData.punchLine || '',
        details: this.initialData.details || '',
        idealFor: this.initialData.idealFor || '',
        sequenceNumber: this.initialData.sequenceNumber || 0,
        isSpecialProgram: this.initialData.isSpecialProgram !== undefined ? this.initialData.isSpecialProgram : false,
        startDate: this.initialData.startDate ? new Date(this.initialData.startDate as string) : null,
        endDate: this.initialData.endDate ? new Date(this.initialData.endDate as string) : null,
        maxPeopleCanRegister: this.initialData.maxPeopleCanRegister ?? null,
        videoUrl: this.initialData.videoUrl || '',
        active: this.initialData.active !== undefined ? this.initialData.active : true,
      });
      if (this.initialData.programPlan) {
        this.patchProgramPlanGroup(this.initialData.programPlan as IManageProgramPlan);
      }
    }
  }

  async loadData(id: number): Promise<void> {
    try {
      this.initialData = await this.apiService.getById(id);
    } catch (error) {
      this.snackBar.open('Failed to load program. Please try again.', 'Close', {
        duration: 5000,
      });
      this.router.navigate(['/programs']);
    }
  }

  async onSubmit(): Promise<void> {
    ValidationUtil.validateAllFormFields(this.formGroup);
    if (!this.formGroup.valid) {
      this.formGroup.markAllAsTouched();
      return;
    }

    const raw = this.formGroup.value;
    const wasSpecialWithPlan = Boolean(
      this.isEditMode && this.initialData?.isSpecialProgram && this.initialData?.programPlanId,
    );
    const isTurningOff = wasSpecialWithPlan && !raw.isSpecialProgram;
    if (isTurningOff) {
      const confirmed = await this.confirm({
        title: 'Unlink and deactivate plan?',
        message:
          'This program is currently tagged to a program plan. Saving will unlink it and mark the plan as inactive. Continue?',
        positiveBtnTxt: 'Yes, unlink',
        negativeBtnTxt: 'Cancel',
        alertType: 'warning',
      });
      if (!confirmed) {
        return;
      }
    }

    const formValue: IManageProgram = {
      program: raw.program,
      punchLine: raw.punchLine,
      details: raw.details,
      idealFor: raw.idealFor,
      sequenceNumber: raw.sequenceNumber,
      isSpecialProgram: raw.isSpecialProgram,
      videoUrl: raw.videoUrl,
      startDate: raw.startDate,
      endDate: raw.endDate,
      maxPeopleCanRegister: raw.maxPeopleCanRegister,
      active: raw.active,
      seo: { url: '' },
    };
    const seoControl = this.formGroup.get('seo');
    if (seoControl && seoControl.value) {
      formValue.seo = seoControl.value;
    }
    const imagePathControl = this.formGroup.get('imagePath');
    if (imagePathControl) {
      const imagePathValue = imagePathControl.value;
      if (Array.isArray(imagePathValue) && imagePathValue.length > 0) {
        formValue.imagePath = imagePathValue;
      } else {
        formValue.imagePath = undefined;
      }
    } else {
      formValue.imagePath = undefined;
    }
    if (!formValue.idealFor) {
      delete formValue.idealFor;
    }
    if (!formValue.videoUrl) {
      delete formValue.videoUrl;
    }
    if (formValue.isSpecialProgram) {
      formValue.startDate = this.toIsoDate(formValue.startDate);
      formValue.endDate = this.toIsoDate(formValue.endDate);
      formValue.maxPeopleCanRegister = formValue.maxPeopleCanRegister ?? null;
      formValue.programPlan = this.collectProgramPlanPayload();
    } else {
      formValue.startDate = null;
      formValue.endDate = null;
      formValue.maxPeopleCanRegister = null;
    }

    try {
      if (this.isEditMode && this.initialData) {
        formValue.programId = this.initialData.programId;
        await this.apiService.update(this.initialData.programId, formValue);
        this.snackBar.open('Program updated successfully', 'Close', { duration: 3000 });
      } else {
        await this.apiService.create(formValue);
        this.snackBar.open('Program created successfully', 'Close', { duration: 3000 });
      }
      this.router.navigate(['/programs']);
    } catch (error) {
      // Error toast is handled by HttpErrorInterceptor
    }
  }

  private collectProgramPlanPayload(): IManageProgramPlan {
    const v = this.programPlanGroup.value;
    const fees = (v.programPlanFees || [])
      .filter((f: { currencyCode: string | null; fees: number | null }) => f && f.currencyCode && f.fees !== null && f.fees !== undefined)
      .map((f: { currencyCode: string; fees: number }) => ({
        currencyCode: f.currencyCode,
        fees: Number(f.fees),
      }));
    return {
      plan: v.plan,
      details: v.details || undefined,
      sequenceNumber: v.sequenceNumber,
      noOfCycle: v.noOfCycle,
      noOfDaysInCycle: v.noOfDaysInCycle,
      isOnline: v.isOnline,
      isVisibleOnWeb: v.isVisibleOnWeb,
      programPlanFees: fees,
      active: v.active !== undefined ? v.active : true,
    };
  }

  onCancel(): void {
    this.router.navigate(['/programs']);
  }

  private toIsoDate(value: unknown): string | null {
    if (!value) {
      return null;
    }
    const d = value instanceof Date ? value : new Date(value as string);
    if (isNaN(d.getTime())) {
      return null;
    }
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  private async confirm(data: AlertDialogData): Promise<boolean> {
    const ref = this.dialog.open(AlertDialogComponent, {
      data,
      width: '420px',
      disableClose: true,
    });
    const result = await firstValueFrom(ref.afterClosed());
    return Boolean(result);
  }

  controlIsInvalid(ctrl: AbstractControl | null): boolean {
    return !!ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched);
  }

  ngOnDestroy(): void {
    if (this.editor) {
      try {
        this.editor.destroy();
      } catch {
        // Ignore destroy errors
      }
      this.editor = null as any;
    }
  }
}
