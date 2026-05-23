import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Editor, NgxEditorComponent, NgxEditorMenuComponent } from 'ngx-editor';
import { InputErrorComponent, UploadFormComponent, ValidationUtil } from '@shared';
import { ProductsApiService } from 'products';
import { ProductFormService } from './product-form.service';
import { FileTypeEnum, IDropdownItem, InputLengthEnum, IProduct, MediaForEnum } from '@eatfit247-shared-lib';

@Component({
  selector: 'lib-manage-product',
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
    MatTooltipModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSnackBarModule,
    FormsModule,
    NgxEditorComponent,
    NgxEditorMenuComponent,
    InputErrorComponent,
    UploadFormComponent
  ],
  templateUrl: './manage-product.html',
  styleUrl: './manage-product.scss'
})
export class ManageProduct implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private apiService = inject(ProductsApiService);
  private productFormService = inject(ProductFormService);
  private snackBar = inject(MatSnackBar);
  private formSubscriptions = new Subscription();

  private fb: FormBuilder = inject(FormBuilder);
  formGroup: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(InputLengthEnum.CHAR_2), Validators.maxLength(InputLengthEnum.CHAR_250)]],
    hsnCode: ['', [Validators.maxLength(100)]],
    imagePath: this.fb.array([]),
    variants: this.fb.array([]),
    additionalInfo: this.fb.group({
      priceRange: this.fb.group({
        min: [0, [Validators.required, Validators.min(0)]],
        max: [0, [Validators.required, Validators.min(0)]]
      }),
      benefits: this.fb.array([]),
      description: [''],
      precautions: this.fb.array([]),
      ingredients: this.fb.group({
        title: [''],
        description: [''],
        ingredients: this.fb.array([])
      }),
      consumptionInstructions: this.fb.group({
        title: [''],
        description: [''],
        mediaDirection: ['left'],
        metaData: this.fb.group({
          howToConsume: this.fb.array([])
        }),
        videoUrl: ['']
      }),
      startEndorsed: this.fb.group({
        title: [''],
        description: [''],
        videoUrl: ['']
      })
    }),
    active: [true, [Validators.required]]
  });
  initialData!: IProduct;
  isEditMode = false;
  pageTitle = 'Create Product';
  mediaFor = MediaForEnum.PRODUCT;
  mediaType = FileTypeEnum.IMAGE;
  editor: Editor | null = null;
  unitOptions: string[] = ['kg', 'gm', 'ml', 'l', 'mg', 'oz', 'lb', 'piece', 'pack', 'bottle', 'box', 'sachet'];
  currencyOptions: IDropdownItem[] = [];

  async ngOnInit(): Promise<void> {
    this.initializeEditor();
    this.setupPriceRangeAutoCalculation();
    await this.loadMasterData();
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEditMode = true;
      this.pageTitle = 'Edit Product';
      await this.loadData(+id);
      this.patchFormValues();
    } else {
      this.pageTitle = 'Create Product';
      this.addVariant();
      this.addBenefit();
      this.addPrecaution();
      this.addIngredient();
    }
  }

  private initializeEditor(): void {
    if (!this.editor) {
      this.editor = new Editor();
    }
  }

  private setupPriceRangeAutoCalculation(): void {
    // Listen to changes in variantsArray to auto-calculate price range
    this.formSubscriptions.add(
      this.variantsArray.valueChanges.subscribe(() => {
        this.calculatePriceRange();
      }),
    );
    // Listen to when variants are added/removed to set up new listeners
    this.formSubscriptions.add(
      this.variantsArray.statusChanges.subscribe(() => {
        this.setupVariantPriceListeners();
        this.calculatePriceRange();
      }),
    );
    // Set up initial listeners
    this.setupVariantPriceListeners();
  }

  private setupVariantPriceListeners(): void {
    // Set up listeners for all variant prices
    this.variantsArray.controls.forEach((variantControl) => {
      const pricesArray = variantControl.get('prices') as FormArray;
      if (pricesArray) {
        pricesArray.controls.forEach((priceControl) => {
          const priceValueControl = priceControl.get('price');
          if (priceValueControl) {
            this.formSubscriptions.add(
              priceValueControl.valueChanges.subscribe(() => {
                this.calculatePriceRange();
              }),
            );
          }
        });
        // Listen to when prices are added/removed
        this.formSubscriptions.add(
          pricesArray.statusChanges.subscribe(() => {
            this.setupVariantPriceListeners();
            this.calculatePriceRange();
          }),
        );
      }
    });
  }

  private calculatePriceRange(): void {
    const variants = this.variantsArray.value;
    if (!variants || variants.length === 0) {
      this.priceRangeGroup.patchValue({ min: 0, max: 0 }, { emitEvent: false });
      return;
    }
    const prices: number[] = [];
    variants.forEach((variant: any) => {
      if (variant.prices && Array.isArray(variant.prices)) {
        variant.prices.forEach((price: any) => {
          if (price.price !== null && price.price !== undefined && !isNaN(price.price) && price.price >= 0) {
            prices.push(price.price);
          }
        });
      }
    });
    if (prices.length === 0) {
      this.priceRangeGroup.patchValue({ min: 0, max: 0 }, { emitEvent: false });
      return;
    }
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    this.priceRangeGroup.patchValue(
      { min: minPrice, max: maxPrice },
      { emitEvent: false }
    );
  }

  private patchFormValues(): void {
    if (this.initialData) {
      this.productFormService.populateForm(this.formGroup, this.initialData);
      // Recalculate price range and set up listeners after populating form
      setTimeout(() => {
        this.setupVariantPriceListeners();
        this.calculatePriceRange();
      }, 0);
    }
  }

  async loadMasterData(): Promise<void> {
    try {
      const masterData = await this.apiService.getMasterData();
      this.currencyOptions = masterData.currencies || [];
    } catch (error) {
      // Error toast is handled by HttpErrorInterceptor
    }
  }

  async loadData(id: number): Promise<void> {
    try {
      this.initialData = await this.apiService.getById(id);
    } catch (error) {
      this.snackBar.open('Failed to load product. Please try again.', 'Close', {
        duration: 5000,
      });
      this.router.navigate(['/products']);
    }
  }

  // Variant methods
  get variantsArray(): FormArray {
    return this.formGroup.get('variants') as FormArray;
  }

  addVariant(): void {
    const variantGroup = this.fb.group({
      productVariantId: [0],
      productId: [0],
      quantityValue: [1, [Validators.required, Validators.min(0.01)]],
      quantityUnit: ['', Validators.required],
      sku: [''],
      prices: this.fb.array([])
    });
    this.variantsArray.push(variantGroup);
    // Add at least one price for the new variant
    this.addPriceToVariant(this.variantsArray.length - 1);
    // Set up listener for the new variant
    this.setupVariantPriceListeners();
    this.calculatePriceRange();
  }

  removeVariant(index: number): void {
    this.variantsArray.removeAt(index);
    this.calculatePriceRange();
  }

  getVariantFormGroup(index: number): FormGroup {
    return this.variantsArray.at(index) as FormGroup;
  }

  // Price methods for variants
  getPricesArray(variantIndex: number): FormArray {
    const variant = this.variantsArray.at(variantIndex);
    if (!variant) {
      return this.fb.array([]) as FormArray;
    }
    const pricesArray = (variant as FormGroup).get('prices') as FormArray;
    return pricesArray || (this.fb.array([]) as FormArray);
  }

  addPriceToVariant(variantIndex: number): void {
    const variant = this.variantsArray.at(variantIndex);
    if (!variant) {
      return;
    }
    const pricesArray = (variant as FormGroup).get('prices') as FormArray;
    if (!pricesArray) {
      return;
    }
    const variantId = (variant as FormGroup).get('productVariantId')?.value || 0;
    const priceGroup = this.fb.group({
      id: [0],
      productVariantId: [variantId],
      currency: ['INR', Validators.required],
      price: [0, [Validators.required, Validators.min(0)]],
      active: [true],
      validFrom: [null, Validators.required],
      validTo: [null]
    });
    pricesArray.push(priceGroup);
    // Set up listener for the new price
    this.setupVariantPriceListeners();
    this.calculatePriceRange();
  }

  removePriceFromVariant(variantIndex: number, priceIndex: number): void {
    const variant = this.variantsArray.at(variantIndex);
    if (!variant) {
      return;
    }
    const pricesArray = (variant as FormGroup).get('prices') as FormArray;
    if (!pricesArray || priceIndex < 0 || priceIndex >= pricesArray.length) {
      return;
    }
    pricesArray.removeAt(priceIndex);
    this.calculatePriceRange();
  }

  // Benefit methods
  get benefitsArray(): FormArray {
    return (this.formGroup.get('additionalInfo') as FormGroup).get('benefits') as FormArray;
  }

  addBenefit(): void {
    this.benefitsArray.push(this.fb.control('', Validators.required));
  }

  removeBenefit(index: number): void {
    this.benefitsArray.removeAt(index);
  }

  // Precaution methods
  get precautionsArray(): FormArray {
    return (this.formGroup.get('additionalInfo') as FormGroup).get('precautions') as FormArray;
  }

  addPrecaution(): void {
    this.precautionsArray.push(this.fb.control('', Validators.required));
  }

  removePrecaution(index: number): void {
    this.precautionsArray.removeAt(index);
  }

  // Ingredient methods
  get ingredientsArray(): FormArray {
    return ((this.formGroup.get('additionalInfo') as FormGroup).get('ingredients') as FormGroup).get('ingredients') as FormArray;
  }

  addIngredient(): void {
    this.ingredientsArray.push(this.fb.group({
      name: ['', Validators.required],
      icon: this.fb.array([]),
      description: ['']
    }));
  }

  removeIngredient(index: number): void {
    this.ingredientsArray.removeAt(index);
  }

  getIngredientIconArray(index: number): FormArray {
    return (this.ingredientsArray.at(index) as FormGroup).get('icon') as FormArray;
  }

  getIngredientFormGroup(index: number): FormGroup {
    return this.ingredientsArray.at(index) as FormGroup;
  }

  getIngredientUploadedMediaList(index: number): any[] {
    // Return current form state instead of initial data
    const iconArray = this.getIngredientIconArray(index);
    return iconArray ? iconArray.value : [];
  }

  // FormGroup getters
  get additionalInfoGroup(): FormGroup {
    return this.formGroup.get('additionalInfo') as FormGroup;
  }

  get priceRangeGroup(): FormGroup {
    return this.additionalInfoGroup.get('priceRange') as FormGroup;
  }

  get ingredientsGroup(): FormGroup {
    return this.additionalInfoGroup.get('ingredients') as FormGroup;
  }

  get consumptionInstructionsGroup(): FormGroup {
    return this.additionalInfoGroup.get('consumptionInstructions') as FormGroup;
  }

  get startEndorsedGroup(): FormGroup {
    return this.additionalInfoGroup.get('startEndorsed') as FormGroup;
  }

  // Consumption Instructions - How to Consume methods
  get howToConsumeArray(): FormArray {
    return (this.consumptionInstructionsGroup.get('metaData') as FormGroup).get('howToConsume') as FormArray;
  }

  addHowToConsume(): void {
    this.howToConsumeArray.push(this.fb.control('', Validators.required));
  }

  removeHowToConsume(index: number): void {
    this.howToConsumeArray.removeAt(index);
  }

  async onSubmit(): Promise<void> {
    ValidationUtil.validateAllFormFields(this.formGroup);
    if (this.formGroup.valid) {
      try {
        const formValue = this.productFormService.transformFormToProductPayload(this.formGroup);
        if (this.isEditMode && this.initialData) {
          formValue.productId = this.initialData.productId;
          await this.apiService.update(this.initialData.productId, formValue);
          this.snackBar.open('Product updated successfully', 'Close', {
            duration: 3000,
          });
        } else {
          await this.apiService.create(formValue);
          this.snackBar.open('Product created successfully', 'Close', {
            duration: 3000,
          });
        }
        this.router.navigate(['/products']);
      } catch (error) {
        // Error toast is handled by HttpErrorInterceptor
      }
    } else {
      this.formGroup.markAllAsTouched();
    }
  }

  onCancel(): void {
    this.router.navigate(['/products']);
  }

  ngOnDestroy(): void {
    this.formSubscriptions.unsubscribe();
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

