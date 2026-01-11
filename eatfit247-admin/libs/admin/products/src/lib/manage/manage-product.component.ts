import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { NgxEditorComponent, NgxEditorMenuComponent, Editor } from 'ngx-editor';
import { FormsModule } from '@angular/forms';
import { InputErrorComponent, UploadFormComponent, ValidationUtil } from '@shared';
import { ProductsApiService } from '../api.service';
import {
  IProduct,
  IManageProduct,
  IProductSize,
  IProductIngredient,
  IProductBenefit,
  IProductFAQ,
  InputLengthEnum,
  FileTypeEnum,
  MediaForEnum
} from '@eatfit247-shared-lib';

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
    private apiService: ProductsApiService
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
      this.formGroup.patchValue({
        name: this.initialData.name || '',
        slug: this.initialData.slug || '',
        description: this.initialData.description || '',
        dose: this.initialData.dose || '',
        howToTake: this.initialData.howToTake || '',
        active: this.initialData.active !== undefined ? this.initialData.active : true
      });

      if (this.initialData.priceRange) {
        this.formGroup.get('priceRange')?.patchValue({
          min: this.initialData.priceRange.min || 0,
          max: this.initialData.priceRange.max || 0
        });
      }

      if (this.initialData.consumptionInstructions) {
        const consumptionGroup = this.formGroup.get('consumptionInstructions') as FormGroup;
        consumptionGroup.patchValue({
          amount: this.initialData.consumptionInstructions.amount || '',
          timing: {
            morning: this.initialData.consumptionInstructions.timing?.morning || '',
            evening: this.initialData.consumptionInstructions.timing?.evening || ''
          }
        });

        // Clear and populate methods
        const methodsArray = consumptionGroup.get('methods') as FormArray;
        while (methodsArray.length !== 0) {
          methodsArray.removeAt(0);
        }
        if (this.initialData.consumptionInstructions.methods) {
          this.initialData.consumptionInstructions.methods.forEach(method => {
            methodsArray.push(this.fb.control(method, Validators.required));
          });
        }
      }

      // Populate arrays
      this.populateFormArray('sizes', this.initialData.sizes, (item: IProductSize) => 
        this.fb.group({
          value: [item.value, Validators.required],
          label: [item.label, Validators.required],
          price: [item.price, [Validators.required, Validators.min(0)]]
        })
      );

      this.populateFormArray('benefits', this.initialData.benefits, (item: string) => 
        this.fb.control(item, Validators.required)
      );

      this.populateFormArray('precautions', this.initialData.precautions, (item: string) => 
        this.fb.control(item, Validators.required)
      );

      this.populateFormArray('ingredients', this.initialData.ingredients, (item: IProductIngredient) => 
        this.fb.group({
          name: [item.name, Validators.required],
          icon: [item.icon || ''],
          description: [item.description || '']
        })
      );

      this.populateFormArray('outcomes', this.initialData.outcomes, (item: IProductBenefit) => 
        this.fb.group({
          title: [item.title, Validators.required],
          description: [item.description, Validators.required],
          icon: [item.icon || '']
        })
      );

      this.populateFormArray('faqs', this.initialData.faqs, (item: IProductFAQ) => 
        this.fb.group({
          question: [item.question, Validators.required],
          answer: [item.answer, Validators.required]
        })
      );

      if (this.initialData.videos) {
        const videosArray = this.formGroup.get('videos') as FormArray;
        while (videosArray.length !== 0) {
          videosArray.removeAt(0);
        }
        this.initialData.videos.forEach(video => {
          videosArray.push(this.fb.control(video));
        });
      }
    }
  }

  private populateFormArray<T>(controlName: string, data: T[], createControl: (item: T) => any): void {
    const formArray = this.formGroup.get(controlName) as FormArray;
    while (formArray.length !== 0) {
      formArray.removeAt(0);
    }
    if (data && data.length > 0) {
      data.forEach(item => {
        formArray.push(createControl(item));
      });
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
      const formValue: IManageProduct = {
        name: this.formGroup.value.name,
        slug: this.formGroup.value.slug,
        description: this.formGroup.value.description || undefined,
        priceRange: this.formGroup.value.priceRange,
        sizes: this.formGroup.value.sizes,
        benefits: this.formGroup.value.benefits,
        dose: this.formGroup.value.dose,
        howToTake: this.formGroup.value.howToTake,
        precautions: this.formGroup.value.precautions,
        ingredients: this.formGroup.value.ingredients,
        consumptionInstructions: this.formGroup.value.consumptionInstructions,
        outcomes: this.formGroup.value.outcomes,
        faqs: this.formGroup.value.faqs,
        active: this.formGroup.value.active
      };

      // Handle images
      const imagePathControl = this.formGroup.get('images');
      if (imagePathControl && imagePathControl.value) {
        const imagePathValue = imagePathControl.value;
        if (Array.isArray(imagePathValue) && imagePathValue.length > 0) {
          formValue.images = imagePathValue;
        }
      }

      // Handle videos
      if (this.formGroup.value.videos && this.formGroup.value.videos.length > 0) {
        formValue.videos = this.formGroup.value.videos.filter((v: string) => v && v.trim());
      }

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

