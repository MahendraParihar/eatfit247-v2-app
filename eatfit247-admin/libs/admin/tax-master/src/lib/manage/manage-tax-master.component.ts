import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { InputErrorComponent, ValidationUtil } from '@shared';
import { IDropdownItem, ITaxMaster, TaxCategoryEnum, TaxTypeEnum, TransactionType } from '@eatfit247-shared-lib';
import { Subject, takeUntil } from 'rxjs';
import { TaxMasterApiService } from '../api.service';
import { FranchiseApiService } from 'franchise';
import { ProductsApiService } from 'products';
import { ProgramPlanApiService } from 'program-plan';

/** `reference_id` of a franchise's default SERVICE rule (every plan without its own rule) */
const SERVICE_DEFAULT_REFERENCE = 1;

@Component({
  selector: 'lib-manage-tax-master',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatCardModule,
    MatSnackBarModule,
    InputErrorComponent,
  ],
  templateUrl: './manage-tax-master.html',
  styleUrl: './manage-tax-master.scss',
})
export class ManageTaxMasterComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly apiService = inject(TaxMasterApiService);
  private readonly franchiseApiService = inject(FranchiseApiService);
  private readonly productsApiService = inject(ProductsApiService);
  private readonly programPlanApiService = inject(ProgramPlanApiService);
  private readonly snackBar = inject(MatSnackBar);

  formGroup!: FormGroup;
  initialData!: ITaxMaster;
  isEditMode = false;
  pageTitle = 'Create Tax Rule';
  /** Seeded by migration 144 and left inactive for the CA to switch on */
  get isStagedRule(): boolean {
    return !!this.initialData && !this.initialData.active && (this.initialData.legalBasis || '').startsWith('STAGED');
  }

  transactionTypes = Object.values(TransactionType);
  taxSystems = Object.values(TaxTypeEnum);
  /** VAT category of the rule (UAE S / Z / E / O); a 0% VAT rule must be zero-rated or exempt */
  readonly taxCategories: { value: TaxCategoryEnum; label: string }[] = [
    { value: TaxCategoryEnum.STANDARD, label: 'Standard (S)' },
    { value: TaxCategoryEnum.ZERO_RATED, label: 'Zero-rated (Z)' },
    { value: TaxCategoryEnum.EXEMPT, label: 'Exempt (E)' },
    { value: TaxCategoryEnum.OUT_OF_SCOPE, label: 'Out of scope (O)' },
  ];
  franchiseOptions: IDropdownItem[] = [];
  countryOptions: IDropdownItem[] = [];
  productOptions: IDropdownItem[] = [];
  /** Service rules: "all plans" (reference 1) or one plan (its id); a plan-specific rule wins */
  planOptions: IDropdownItem[] = [];
  showProductDropdown = false;
  showPlanDropdown = false;
  readonly serviceDefaultReference = SERVICE_DEFAULT_REFERENCE;

  async ngOnInit(): Promise<void> {
    this.buildForm();
    await this.loadMasterData();
    this.setupFormListeners();
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEditMode = true;
      this.pageTitle = 'Edit Tax Rule';
      await this.loadData(+id);
    }
  }

  private buildForm(): void {
    this.formGroup = this.fb.group({
      franchiseId: ['', Validators.required],
      countryCode: ['', [Validators.required, Validators.maxLength(3)]],
      transactionType: ['', Validators.required],
      referenceId: [null],
      taxSystem: ['', Validators.required],
      taxCode: ['', [Validators.required, Validators.maxLength(50)]],
      taxName: ['', [Validators.required, Validators.maxLength(100)]],
      taxPercent: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
      applyOn: ['SALE', [Validators.required, Validators.maxLength(20)]],
      isTaxInclusive: [false],
      taxCategory: [TaxCategoryEnum.STANDARD, Validators.required],
      hsnSacCode: ['', [Validators.pattern(/^\d{4,8}$/)]],
      legalBasis: ['', [Validators.maxLength(1000)]],
      effectiveFrom: [null, Validators.required],
      effectiveTo: [null],
    });
  }

  private setupFormListeners(): void {
    // Listen to transaction type changes
    this.formGroup.get('transactionType')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((transactionType) => {
      if (transactionType === TransactionType.SERVICE) {
        // Services: the franchise default (reference 1) unless a plan is picked. A product id must never
        // survive a PRODUCT → SERVICE switch as a "plan-specific" rule.
        this.formGroup.patchValue({ referenceId: SERVICE_DEFAULT_REFERENCE }, { emitEvent: false });
        this.showProductDropdown = false;
        this.showPlanDropdown = true;
        this.formGroup.get('referenceId')?.clearValidators();
      } else if (transactionType === TransactionType.PRODUCT) {
        // Show product dropdown for PRODUCT; the service reference (1) must not pass as product id 1
        this.formGroup.patchValue({ referenceId: null }, { emitEvent: false });
        this.showProductDropdown = true;
        this.showPlanDropdown = false;
        this.formGroup.get('referenceId')?.setValidators([Validators.required]);
      } else {
        this.showProductDropdown = false;
        this.showPlanDropdown = false;
        this.formGroup.get('referenceId')?.clearValidators();
      }
      this.formGroup.get('referenceId')?.updateValueAndValidity({ emitEvent: false });
    });
  }

  private async loadMasterData(): Promise<void> {
    try {
      // Load franchises
      this.franchiseOptions = await this.franchiseApiService.getFranchiseDropdown();

      // Fetch full country list to get country codes
      const countryList = await this.apiService.getCountryListWithCodes();
      this.countryOptions = countryList
        .map((country) => ({
          id: country.countryCode,
          label: `${country.country} (${country.countryCode})`,
          selected: false,
        }));

      // Plans for service rules: "all plans" first, then each active plan
      const planList = await this.programPlanApiService.getList({ limit: 1000, page: 0 });
      this.planOptions = [
        { id: SERVICE_DEFAULT_REFERENCE, label: 'All plans (franchise default)', selected: false },
        ...planList.tableData
          .filter((plan) => plan.active && plan.programPlanId !== SERVICE_DEFAULT_REFERENCE)
          .map((plan) => ({ id: plan.programPlanId, label: plan.plan, selected: false })),
      ];

      // Load products for dropdown
      const productList = await this.productsApiService.getList({ limit: 1000, page: 0 });
      this.productOptions = productList.tableData
        .filter((p) => p.active)
        .map((product) => ({
          id: product.productId,
          label: product.name,
          selected: false,
        }));
    } catch (error) {
      // Error toast is handled by HttpErrorInterceptor
    }
  }

  private async loadData(id: number): Promise<void> {
    try {
      this.initialData = await this.apiService.getById(id);
      const transactionType = this.initialData.transactionType;
      this.showProductDropdown = transactionType === TransactionType.PRODUCT;
      this.showPlanDropdown = transactionType === TransactionType.SERVICE;

      // emitEvent: false — the type listener would otherwise reset the stored reference
      this.formGroup.patchValue({
        franchiseId: this.initialData.franchiseId,
        countryCode: this.initialData.countryCode,
        transactionType: transactionType,
        referenceId: this.initialData.referenceId,
        taxSystem: this.initialData.taxSystem,
        taxCode: this.initialData.taxCode,
        taxName: this.initialData.taxName,
        taxPercent: this.initialData.taxPercent,
        applyOn: this.initialData.applyOn,
        isTaxInclusive: this.initialData.isTaxInclusive,
        taxCategory: this.initialData.taxCategory || TaxCategoryEnum.STANDARD,
        hsnSacCode: this.initialData.hsnSacCode || '',
        legalBasis: this.initialData.legalBasis || '',
        effectiveFrom: this.initialData.effectiveFrom ? new Date(this.initialData.effectiveFrom) : null,
        effectiveTo: this.initialData.effectiveTo ? new Date(this.initialData.effectiveTo) : null,
      }, { emitEvent: false });
      this.formGroup.get('referenceId')?.setValidators(transactionType === TransactionType.PRODUCT ? [Validators.required] : []);
      this.formGroup.get('referenceId')?.updateValueAndValidity({ emitEvent: false });
    } catch (error) {
      // Error toast is handled by HttpErrorInterceptor
      this.router.navigate(['/tax-master']);
    }
  }

  async onSubmit(): Promise<void> {
    ValidationUtil.validateAllFormFields(this.formGroup);
    if (this.formGroup.invalid) {
      this.formGroup.markAllAsTouched();
      return;
    }

    const formValue = this.formGroup.value;
    // Services without a plan use the franchise default rule (reference 1)
    if (formValue.transactionType === TransactionType.SERVICE && !formValue.referenceId) {
      formValue.referenceId = SERVICE_DEFAULT_REFERENCE;
    }
    formValue.hsnSacCode = (formValue.hsnSacCode || '').trim() || null;
    formValue.legalBasis = (formValue.legalBasis || '').trim() || null;

    // Only the form's fields: the API refuses server-owned ones (id, audit fields)
    const payload: Partial<ITaxMaster> = { ...formValue };

    try {
      if (this.isEditMode && this.initialData?.id) {
        await this.apiService.update(this.initialData.id, payload);
        this.snackBar.open('Tax rule updated successfully', 'Close', {
          duration: 3000,
        });
      } else {
        await this.apiService.create(payload);
        this.snackBar.open('Tax rule created successfully', 'Close', {
          duration: 3000,
        });
      }
      this.router.navigate(['/tax-master']);
    } catch (error) {
      // Error toast is handled by HttpErrorInterceptor
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onCancel(): void {
    this.router.navigate(['/tax-master']);
  }
}


