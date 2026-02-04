import { Component, OnInit } from '@angular/core';
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
import { IDropdownItem, ITaxMaster, TaxTypeEnum, TransactionType } from '@eatfit247-shared-lib';
import { TaxMasterApiService } from '../api.service';
import { FranchiseApiService } from 'franchise';
import { ProductsApiService } from 'products';

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
export class ManageTaxMasterComponent implements OnInit {
  formGroup!: FormGroup;
  initialData!: ITaxMaster;
  isEditMode = false;
  pageTitle = 'Create Tax Rule';

  transactionTypes = Object.values(TransactionType);
  taxSystems = Object.values(TaxTypeEnum);
  franchiseOptions: IDropdownItem[] = [];
  countryOptions: IDropdownItem[] = [];
  productOptions: IDropdownItem[] = [];
  showProductDropdown = false;

  constructor(
    private readonly fb: FormBuilder,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly apiService: TaxMasterApiService,
    private readonly franchiseApiService: FranchiseApiService,
    private readonly productsApiService: ProductsApiService,
    private readonly snackBar: MatSnackBar,
  ) {}

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
      effectiveFrom: [null, Validators.required],
      effectiveTo: [null],
    });
  }

  private setupFormListeners(): void {
    // Listen to transaction type changes
    this.formGroup.get('transactionType')?.valueChanges.subscribe((transactionType) => {
      if (transactionType === TransactionType.SERVICE) {
        // Set referenceId to 1 for SERVICE
        this.formGroup.patchValue({ referenceId: 1 }, { emitEvent: false });
        this.showProductDropdown = false;
        this.formGroup.get('referenceId')?.clearValidators();
      } else if (transactionType === TransactionType.PRODUCT) {
        // Show product dropdown for PRODUCT
        this.showProductDropdown = true;
        this.formGroup.get('referenceId')?.setValidators([Validators.required]);
      } else {
        this.showProductDropdown = false;
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
        effectiveFrom: this.initialData.effectiveFrom ? new Date(this.initialData.effectiveFrom) : null,
        effectiveTo: this.initialData.effectiveTo ? new Date(this.initialData.effectiveTo) : null,
      });
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
    // Ensure referenceId is set to 1 for SERVICE transaction type
    if (formValue.transactionType === TransactionType.SERVICE) {
      formValue.referenceId = 1;
    }

    const payload: Partial<ITaxMaster> = {
      ...this.initialData,
      ...formValue,
    };

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

  onCancel(): void {
    this.router.navigate(['/tax-master']);
  }
}


