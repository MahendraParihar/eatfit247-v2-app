import { Component, inject, OnDestroy, OnInit } from '@angular/core';
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
import { Editor, NgxEditorComponent, NgxEditorMenuComponent } from 'ngx-editor';
import { InputErrorComponent, UploadFormComponent, ValidationUtil } from '@shared';
import { ProductsApiService } from 'products';
import { ProductFormService } from './product-form.service';
import { FileTypeEnum, InputLengthEnum, IProduct, MediaForEnum } from '@eatfit247-shared-lib';

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
  private fb: FormBuilder = inject(FormBuilder);
  formGroup: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(InputLengthEnum.CHAR_2), Validators.maxLength(InputLengthEnum.CHAR_100)]],
    slug: ['', [Validators.required, Validators.minLength(InputLengthEnum.CHAR_2), Validators.maxLength(InputLengthEnum.CHAR_100)]],
    description: [''],
    priceRange: this.fb.group({
      min: [0, [Validators.required, Validators.min(0)]],
      max: [0, [Validators.required, Validators.min(0)]]
    }),
    sizes: this.fb.array([]),
    benefits: this.fb.array([]),
    dose: ['', [Validators.required, Validators.maxLength(InputLengthEnum.CHAR_200)]],
    howToTake: ['', [Validators.required]],
    precautions: this.fb.array([]),
    ingredients: this.fb.array([]),
    consumptionInstructions: this.fb.group({
      amount: ['', [Validators.required]],
      methods: this.fb.array([]),
      timing: this.fb.group({
        morning: ['', [Validators.required]],
        evening: ['', [Validators.required]]
      })
    }),
    outcomes: this.fb.array([]),
    faqs: this.fb.array([]),
    videos: this.fb.array([]),
    active: [true, [Validators.required]]
  });
  initialData!: IProduct;
  isEditMode = false;
  pageTitle = 'Create Product';
  mediaFor = MediaForEnum.PRODUCT;
  mediaType = FileTypeEnum.IMAGE;
  editor: Editor | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ProductsApiService,
    private productFormService: ProductFormService
  ) {}

  async ngOnInit(): Promise<void> {
    this.initializeEditor();
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEditMode = true;
      this.pageTitle = 'Edit Product';
      await this.loadData(+id);
    } else {
      this.pageTitle = 'Create Product';
      this.addSize();
      this.addBenefit();
      this.addPrecaution();
      this.addIngredient();
      this.addOutcome();
      this.addFAQ();
      this.addConsumptionMethod();
    }
    this.patchFormValues();
  }

  private initializeEditor(): void {
    if (!this.editor) {
      this.editor = new Editor();
    }
  }

  private patchFormValues(): void {
    if (this.initialData) {
      this.productFormService.populateForm(this.formGroup, this.initialData);
    }
  }

  async loadData(id: number): Promise<void> {
    try {
      this.initialData = await this.apiService.getById(id);
    } catch (error) {
      console.error('Error loading product:', error);
    }
  }

  // Size methods
  get sizesArray(): FormArray {
    return this.formGroup.get('sizes') as FormArray;
  }

  addSize(): void {
    this.sizesArray.push(this.fb.group({
      value: ['', Validators.required],
      label: ['', Validators.required],
      price: [0, [Validators.required, Validators.min(0)]]
    }));
  }

  removeSize(index: number): void {
    this.sizesArray.removeAt(index);
  }

  // Benefit methods
  get benefitsArray(): FormArray {
    return this.formGroup.get('benefits') as FormArray;
  }

  addBenefit(): void {
    this.benefitsArray.push(this.fb.control('', Validators.required));
  }

  removeBenefit(index: number): void {
    this.benefitsArray.removeAt(index);
  }

  // Precaution methods
  get precautionsArray(): FormArray {
    return this.formGroup.get('precautions') as FormArray;
  }

  addPrecaution(): void {
    this.precautionsArray.push(this.fb.control('', Validators.required));
  }

  removePrecaution(index: number): void {
    this.precautionsArray.removeAt(index);
  }

  // Ingredient methods
  get ingredientsArray(): FormArray {
    return this.formGroup.get('ingredients') as FormArray;
  }

  addIngredient(): void {
    this.ingredientsArray.push(this.fb.group({
      name: ['', Validators.required],
      icon: [''],
      description: ['']
    }));
  }

  removeIngredient(index: number): void {
    this.ingredientsArray.removeAt(index);
  }

  // Outcome methods
  get outcomesArray(): FormArray {
    return this.formGroup.get('outcomes') as FormArray;
  }

  addOutcome(): void {
    this.outcomesArray.push(this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      icon: ['']
    }));
  }

  removeOutcome(index: number): void {
    this.outcomesArray.removeAt(index);
  }

  // FAQ methods
  get faqsArray(): FormArray {
    return this.formGroup.get('faqs') as FormArray;
  }

  addFAQ(): void {
    this.faqsArray.push(this.fb.group({
      question: ['', Validators.required],
      answer: ['', Validators.required]
    }));
  }

  removeFAQ(index: number): void {
    this.faqsArray.removeAt(index);
  }

  // Consumption method methods
  get consumptionMethodsArray(): FormArray {
    return (this.formGroup.get('consumptionInstructions') as FormGroup).get('methods') as FormArray;
  }

  addConsumptionMethod(): void {
    this.consumptionMethodsArray.push(this.fb.control('', Validators.required));
  }

  removeConsumptionMethod(index: number): void {
    this.consumptionMethodsArray.removeAt(index);
  }

  // Video methods
  get videosArray(): FormArray {
    return this.formGroup.get('videos') as FormArray;
  }

  addVideo(): void {
    this.videosArray.push(this.fb.control(''));
  }

  removeVideo(index: number): void {
    this.videosArray.removeAt(index);
  }

  // FormGroup getters
  get priceRangeGroup(): FormGroup {
    return this.formGroup.get('priceRange') as FormGroup;
  }

  get consumptionInstructionsGroup(): FormGroup {
    return this.formGroup.get('consumptionInstructions') as FormGroup;
  }

  get consumptionInstructionsTimingGroup(): FormGroup {
    return this.consumptionInstructionsGroup.get('timing') as FormGroup;
  }

  async onSubmit(): Promise<void> {
    ValidationUtil.validateAllFormFields(this.formGroup);
    if (this.formGroup.valid) {
      const formValue = this.productFormService.transformFormToProductPayload(this.formGroup);
      if (this.isEditMode && this.initialData) {
        formValue.productId = this.initialData.productId;
        await this.apiService.update(this.initialData.productId, formValue);
      } else {
        await this.apiService.create(formValue);
      }
      this.router.navigate(['/products']);
    } else {
      this.formGroup.markAllAsTouched();
    }
  }

  onCancel(): void {
    this.router.navigate(['/products']);
  }

  ngOnDestroy(): void {
    if (this.editor) {
      try {
        this.editor.destroy();
      } catch (error) {
        console.warn('Error destroying editor:', error);
      }
      this.editor = null as any;
    }
  }
}

