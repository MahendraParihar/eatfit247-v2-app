import { inject, Injectable } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
  CommonUtil,
  IManageProduct,
  IProduct,
  IProductAdditionalInfo,
  IProductPrice,
  IProductVariant
} from '@eatfit247-shared-lib';

@Injectable({
  providedIn: 'root'
})
export class ProductFormService {
  private readonly fb = inject(FormBuilder);

  constructor() {}

  /**
   * Transform product data to form values for editing
   */
  transformProductToFormValues(product: IProduct): any {
    const additionalInfo = product.additionalInfo || {};
    return {
      name: product.name || '',
      hsnCode: product.hsnCode || '',
      imagePath: product.imagePath || [],
      variants: product.variants || [],
      active: product.active !== undefined ? product.active : true,
      additionalInfo: {
        priceRange: additionalInfo.priceRange || { min: 0, max: 0 },
        benefits: additionalInfo.benefits || [],
        description: additionalInfo.description || '',
        precautions: additionalInfo.precautions || [],
        ingredients: additionalInfo.ingredients || {
          title: '',
          description: '',
          ingredients: []
        },
        consumptionInstructions: additionalInfo.consumptionInstructions || null,
        startEndorsed: additionalInfo.startEndorsed || null
      }
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
      hsnCode: formValues.hsnCode,
      active: formValues.active
    });

    // Patch imagePath
    const imagePathArray = formGroup.get('imagePath') as FormArray;
    while (imagePathArray.length !== 0) {
      imagePathArray.removeAt(0);
    }
    if (formValues.imagePath && formValues.imagePath.length > 0) {
      formValues.imagePath.forEach((image: any) => {
        imagePathArray.push(this.fb.control(image));
      });
    }

    // Patch variants
    this.populateVariantsArray(formGroup, formValues.variants || []);

    // Patch additionalInfo
    const additionalInfoGroup = formGroup.get('additionalInfo') as FormGroup;
    if (additionalInfoGroup && formValues.additionalInfo) {
      const ai = formValues.additionalInfo;
      
      // Price range
      if (ai.priceRange) {
        additionalInfoGroup.get('priceRange')?.patchValue(ai.priceRange);
      }

      // Benefits
      this.populateFormArray(
        additionalInfoGroup,
        'benefits',
        ai.benefits || [],
        (item: string) => this.fb.control(item, Validators.required)
      );

      // Description
      additionalInfoGroup.patchValue({
        description: ai.description || ''
      });

      // Precautions
      this.populateFormArray(
        additionalInfoGroup,
        'precautions',
        ai.precautions || [],
        (item: string) => this.fb.control(item, Validators.required)
      );

      // Ingredients
      if (ai.ingredients) {
        const ingredientsGroup = additionalInfoGroup.get('ingredients') as FormGroup;
        if (ingredientsGroup) {
          ingredientsGroup.patchValue({
            title: ai.ingredients.title || '',
            description: ai.ingredients.description || ''
          });
          this.populateFormArray(
            ingredientsGroup,
            'ingredients',
            ai.ingredients.ingredients || [],
            (item: any) => {
              const iconArray = this.fb.array([]);
              if (item.icon && Array.isArray(item.icon) && item.icon.length > 0) {
                item.icon.forEach((iconItem: any) => {
                  iconArray.push(this.fb.control(iconItem));
                });
              }
              return this.fb.group({
                name: [item.name, Validators.required],
                icon: iconArray,
                description: [item.description || '']
              });
            }
          );
        }
      }

      // Consumption instructions
      if (ai.consumptionInstructions) {
        const ciGroup = additionalInfoGroup.get('consumptionInstructions') as FormGroup;
        if (ciGroup) {
          ciGroup.patchValue({
            title: ai.consumptionInstructions.title || '',
            description: ai.consumptionInstructions.description || '',
            mediaDirection: ai.consumptionInstructions.mediaDirection || 'left',
            videoUrl: ai.consumptionInstructions.videoUrl || ''
          });

          // Meta data
          const metaDataGroup = ciGroup.get('metaData') as FormGroup;
          if (metaDataGroup) {
            this.populateFormArray(
              metaDataGroup,
              'howToConsume',
              ai.consumptionInstructions.metaData?.howToConsume || [],
              (item: string) => this.fb.control(item, Validators.required)
            );
          }
        }
      }

      // Star Endorsed
      if (ai.startEndorsed) {
        const startEndorsedGroup = additionalInfoGroup.get('startEndorsed') as FormGroup;
        if (startEndorsedGroup) {
          startEndorsedGroup.patchValue({
            title: ai.startEndorsed.title || '',
            description: ai.startEndorsed.description || '',
            videoUrl: ai.startEndorsed.videoUrl || ''
          });
        }
      }
    }
  }

  /**
   * Populate variants array with nested prices
   */
  private populateVariantsArray(formGroup: FormGroup, variants: IProductVariant[]): void {
    const variantsArray = formGroup.get('variants') as FormArray;
    while (variantsArray.length !== 0) {
      variantsArray.removeAt(0);
    }
    if (variants && variants.length > 0) {
      variants.forEach((variant) => {
        const pricesArray = this.fb.array<FormGroup>([]);
        if (variant.prices && variant.prices.length > 0) {
          variant.prices.forEach((price) => {
            // Convert date strings to Date objects for Material datepicker
            const validFrom = price.validFrom
              ? (typeof price.validFrom === 'string' ? new Date(price.validFrom) : price.validFrom)
              : null;
            const validTo = price.validTo
              ? (typeof price.validTo === 'string' ? new Date(price.validTo) : price.validTo)
              : null;
            
            pricesArray.push(
              this.fb.group({
                id: [price.id || 0],
                productVariantId: [price.productVariantId || 0],
                currency: [price.currency, Validators.required],
                price: [price.price, [Validators.required, Validators.min(0)]],
                active: [price.active !== undefined ? price.active : true],
                validFrom: [validFrom, Validators.required],
                validTo: [validTo],
              }),
            );
          });
        } else {
          // If variant has no prices, add at least one empty price entry to match create flow behavior
          pricesArray.push(
            this.fb.group({
              id: [0],
              productVariantId: [variant.productVariantId || 0],
              currency: ['INR', Validators.required],
              price: [0, [Validators.required, Validators.min(0)]],
              active: [true],
              validFrom: [null, Validators.required],
              validTo: [null]
            })
          );
        }
        variantsArray.push(this.fb.group({
          productVariantId: [variant.productVariantId || 0],
          productId: [variant.productId || 0],
          quantityValue: [variant.quantityValue, [Validators.required, Validators.min(0.01)]],
          quantityUnit: [variant.quantityUnit, Validators.required],
          sku: [variant.sku || ''],
          prices: pricesArray
        }));
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
    const formValue = formGroup.value;
    const additionalInfo: IProductAdditionalInfo = {};

    // Build additionalInfo from form
    if (formValue.additionalInfo) {
      const ai = formValue.additionalInfo;
      
      if (ai.priceRange) {
        additionalInfo.priceRange = ai.priceRange;
      }
      
      if (ai.benefits && ai.benefits.length > 0) {
        additionalInfo.benefits = ai.benefits;
      }

      if (ai.description) {
        additionalInfo.description = ai.description;
      }

      if (ai.precautions && ai.precautions.length > 0) {
        additionalInfo.precautions = ai.precautions;
      }
      
      if (ai.ingredients) {
        additionalInfo.ingredients = ai.ingredients;
      }
      
      if (ai.consumptionInstructions) {
        additionalInfo.consumptionInstructions = {
          title: ai.consumptionInstructions.title || '',
          description: ai.consumptionInstructions.description || '',
          mediaDirection: ai.consumptionInstructions.mediaDirection || 'left',
          metaData: {
            howToConsume: ai.consumptionInstructions.metaData?.howToConsume || []
          },
          videoUrl: ai.consumptionInstructions.videoUrl || ''
        };
      }

      if (ai.startEndorsed) {
        if (ai.startEndorsed.title || ai.startEndorsed.description || ai.startEndorsed.videoUrl) {
          additionalInfo.startEndorsed = {
            title: ai.startEndorsed.title || '',
            description: ai.startEndorsed.description || '',
            videoUrl: ai.startEndorsed.videoUrl || ''
          };
        }
      }
    }

    // Transform variants from form structure to API structure
    const variants: IProductVariant[] = [];
    if (formValue.variants && Array.isArray(formValue.variants)) {
      formValue.variants.forEach((variant: any) => {
        const prices: IProductPrice[] = [];
        if (variant.prices && Array.isArray(variant.prices)) {
          variant.prices.forEach((price: any) => {
            prices.push({
              id: price.id || 0,
              productVariantId: price.productVariantId || 0,
              currency: price.currency,
              price: price.price,
              active: price.active !== undefined ? price.active : true,
              validFrom: CommonUtil.formatDateForAPI(price.validFrom),
              validTo: CommonUtil.formatDateForAPI(price.validTo),
            });
          });
        }
        variants.push({
          productVariantId: variant.productVariantId || 0,
          productId: variant.productId || 0,
          quantityValue: variant.quantityValue,
          quantityUnit: variant.quantityUnit,
          sku: variant.sku || undefined,
          prices: prices.length > 0 ? prices : undefined
        });
      });
    }

    return <IManageProduct>{
      name: formValue.name,
      hsnCode: formValue.hsnCode,
      imagePath: formValue.imagePath || [],
      variants: variants.length > 0 ? variants : undefined,
      additionalInfo: additionalInfo,
      active: formValue.active
    };
  }
}

