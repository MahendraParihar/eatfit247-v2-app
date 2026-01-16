import { Injectable } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
  IManageProduct,
  IProduct,
  IProductBenefit,
  IProductFAQ,
  IProductIngredient,
  IProductSize
} from '@eatfit247-shared-lib';

@Injectable({
  providedIn: 'root'
})
export class ProductFormService {
  constructor(private fb: FormBuilder) {}

  /**
   * Transform product data to form values for editing
   */
  transformProductToFormValues(product: IProduct): any {
    return {
      name: product.name || '',
      slug: product.slug || '',
      description: product.description || '',
      dose: product.dose || '',
      howToTake: product.howToTake || '',
      active: product.active !== undefined ? product.active : true,
      priceRange: product.priceRange ? {
        min: product.priceRange.min || 0,
        max: product.priceRange.max || 0
      } : null,
      consumptionInstructions: product.consumptionInstructions ? {
        amount: product.consumptionInstructions.amount || '',
        timing: {
          morning: product.consumptionInstructions.timing?.morning || '',
          evening: product.consumptionInstructions.timing?.evening || ''
        },
        methods: product.consumptionInstructions.methods || []
      } : null,
      sizes: product.sizes || [],
      benefits: product.benefits || [],
      precautions: product.precautions || [],
      ingredients: product.ingredients || [],
      outcomes: product.outcomes || [],
      faqs: product.faqs || [],
      videos: product.videos || []
    };
  }

  /**
   * Populate form with product data
   */
  populateForm(formGroup: FormGroup, product: IProduct): void {
    const formValues = this.transformProductToFormValues(product);
    
    // Patch basic fields
    formGroup.patchValue({
      name: formValues.name,
      slug: formValues.slug,
      description: formValues.description,
      dose: formValues.dose,
      howToTake: formValues.howToTake,
      active: formValues.active
    });

    // Patch price range
    if (formValues.priceRange) {
      formGroup.get('priceRange')?.patchValue(formValues.priceRange);
    }

    // Patch consumption instructions
    if (formValues.consumptionInstructions) {
      const consumptionGroup = formGroup.get('consumptionInstructions') as FormGroup;
      consumptionGroup.patchValue({
        amount: formValues.consumptionInstructions.amount,
        timing: formValues.consumptionInstructions.timing
      });

      // Clear and populate methods
      const methodsArray = consumptionGroup.get('methods') as FormArray;
      while (methodsArray.length !== 0) {
        methodsArray.removeAt(0);
      }
      if (formValues.consumptionInstructions.methods) {
        formValues.consumptionInstructions.methods.forEach((method: any) => {
          methodsArray.push(this.fb.control(method, Validators.required));
        });
      }
    }

    // Populate arrays
    this.populateFormArray(
      formGroup,
      'sizes',
      formValues.sizes,
      (item: IProductSize) => this.fb.group({
        value: [item.value, Validators.required],
        label: [item.label, Validators.required],
        price: [item.price, [Validators.required, Validators.min(0)]]
      })
    );

    this.populateFormArray(
      formGroup,
      'benefits',
      formValues.benefits,
      (item: string) => this.fb.control(item, Validators.required)
    );

    this.populateFormArray(
      formGroup,
      'precautions',
      formValues.precautions,
      (item: string) => this.fb.control(item, Validators.required)
    );

    this.populateFormArray(
      formGroup,
      'ingredients',
      formValues.ingredients,
      (item: IProductIngredient) => this.fb.group({
        name: [item.name, Validators.required],
        icon: [item.icon || ''],
        description: [item.description || '']
      })
    );

    this.populateFormArray(
      formGroup,
      'outcomes',
      formValues.outcomes,
      (item: IProductBenefit) => this.fb.group({
        title: [item.title, Validators.required],
        description: [item.description, Validators.required],
        icon: [item.icon || '']
      })
    );

    this.populateFormArray(
      formGroup,
      'faqs',
      formValues.faqs,
      (item: IProductFAQ) => this.fb.group({
        question: [item.question, Validators.required],
        answer: [item.answer, Validators.required]
      })
    );

    // Populate videos
    if (formValues.videos) {
      const videosArray = formGroup.get('videos') as FormArray;
      while (videosArray.length !== 0) {
        videosArray.removeAt(0);
      }
      formValues.videos.forEach((video: string) => {
        videosArray.push(this.fb.control(video));
      });
    }
  }

  /**
   * Populate a form array with data
   */
  private populateFormArray<T>(
    formGroup: FormGroup,
    controlName: string,
    data: T[],
    createControl: (item: T) => any
  ): void {
    const formArray = formGroup.get(controlName) as FormArray;
    while (formArray.length !== 0) {
      formArray.removeAt(0);
    }
    if (data && data.length > 0) {
      data.forEach(item => {
        formArray.push(createControl(item));
      });
    }
  }

  /**
   * Transform form values to product submission payload
   */
  transformFormToProductPayload(formGroup: FormGroup): IManageProduct {
    const payload: IManageProduct = {
      name: formGroup.value.name,
      slug: formGroup.value.slug,
      description: formGroup.value.description || undefined,
      priceRange: formGroup.value.priceRange,
      sizes: formGroup.value.sizes,
      benefits: formGroup.value.benefits,
      dose: formGroup.value.dose,
      howToTake: formGroup.value.howToTake,
      precautions: formGroup.value.precautions,
      ingredients: formGroup.value.ingredients,
      consumptionInstructions: formGroup.value.consumptionInstructions,
      outcomes: formGroup.value.outcomes,
      faqs: formGroup.value.faqs,
      active: formGroup.value.active
    };

    // Handle images
    const imagePathControl = formGroup.get('images');
    if (imagePathControl && imagePathControl.value) {
      const imagePathValue = imagePathControl.value;
      if (Array.isArray(imagePathValue) && imagePathValue.length > 0) {
        payload.images = imagePathValue;
      }
    }

    // Handle videos
    if (formGroup.value.videos && formGroup.value.videos.length > 0) {
      payload.videos = formGroup.value.videos.filter((v: string) => v && v.trim());
    }

    return payload;
  }
}

