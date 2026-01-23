import { Injectable } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
  IManageProduct,
  IProduct,
  IProductAdditionalInfo,
  IProductFee
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
    const additionalInfo = product.additionalInfo || {};
    return {
      name: product.name || '',
      hsnCode: product.hsnCode || '',
      imagePath: product.imagePath || [],
      fees: product.fees || [],
      active: product.active !== undefined ? product.active : true,
      additionalInfo: {
        priceRange: additionalInfo.priceRange || { min: 0, max: 0 },
        benefits: additionalInfo.benefits || [],
        dose: additionalInfo.dose || '',
        howToTake: additionalInfo.howToTake || '',
        precautions: additionalInfo.precautions || [],
        ingredients: additionalInfo.ingredients || {
          title: '',
          description: '',
          ingredients: []
        },
        consumptionInstructions: additionalInfo.consumptionInstructions || null,
        outcomes: additionalInfo.outcomes || {
          title: '',
          description: '',
          outcome: []
        },
        feature: additionalInfo.feature || null,
        report: additionalInfo.report || null,
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

    // Patch fees
    this.populateFormArray(
      formGroup,
      'fees',
      formValues.fees,
      (item: IProductFee) => this.fb.group({
        price: [item.price, [Validators.required, Validators.min(0)]],
        currency: [item.currency, Validators.required],
        quantity: [item.quantity, [Validators.required, Validators.min(0)]],
        unit: [item.unit, Validators.required]
      })
    );

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

      // Dose and howToTake
      additionalInfoGroup.patchValue({
        dose: ai.dose || '',
        howToTake: ai.howToTake || ''
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

      // Outcomes
      if (ai.outcomes) {
        const outcomesGroup = additionalInfoGroup.get('outcomes') as FormGroup;
        if (outcomesGroup) {
          outcomesGroup.patchValue({
            title: ai.outcomes.title || '',
            description: ai.outcomes.description || ''
          });
          this.populateFormArray(
            outcomesGroup,
            'outcome',
            ai.outcomes.outcome || [],
            (item: any) => {
              const iconArray = this.fb.array([]);
              if (item.icon && Array.isArray(item.icon) && item.icon.length > 0) {
                item.icon.forEach((iconItem: any) => {
                  iconArray.push(this.fb.control(iconItem));
                });
              }
              return this.fb.group({
                title: [item.title, Validators.required],
                description: [item.description, Validators.required],
                icon: iconArray
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
            mediaDirection: ai.consumptionInstructions.mediaDirection || 'left'
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
            this.populateFormArray(
              metaDataGroup,
              'whenToConsume',
              ai.consumptionInstructions.metaData?.whenToConsume || [],
              (item: string) => this.fb.control(item, Validators.required)
            );
          }

          // Media data
          const mediaDataGroup = ciGroup.get('mediaData') as FormGroup;
          if (mediaDataGroup) {
            mediaDataGroup.patchValue({
              mediaType: ai.consumptionInstructions.mediaData?.mediaType || 'image'
            });
            const mediaLinkArray = mediaDataGroup.get('mediaLink') as FormArray;
            while (mediaLinkArray.length !== 0) {
              mediaLinkArray.removeAt(0);
            }
            if (ai.consumptionInstructions.mediaData?.mediaLink && ai.consumptionInstructions.mediaData.mediaLink.length > 0) {
              ai.consumptionInstructions.mediaData.mediaLink.forEach((media: any) => {
                mediaLinkArray.push(this.fb.control(media));
              });
            }
          }
        }
      }

      // Feature
      if (ai.feature) {
        const featureGroup = additionalInfoGroup.get('feature') as FormGroup;
        if (featureGroup) {
          featureGroup.patchValue({
            title: ai.feature.title || '',
            description: ai.feature.description || '',
            tagLine: ai.feature.tagLine || ''
          });
          
          // Feature images
          const imagesArray = featureGroup.get('images') as FormArray;
          while (imagesArray.length !== 0) {
            imagesArray.removeAt(0);
          }
          if (ai.feature.images && ai.feature.images.length > 0) {
            ai.feature.images.forEach((image: any) => {
              imagesArray.push(this.fb.control(image));
            });
          }

          // Feature list
          this.populateFormArray(
            featureGroup,
            'feature',
            ai.feature.feature || [],
            (item: string) => this.fb.control(item, Validators.required)
          );
        }
      }

      // Report
      if (ai.report) {
        const reportGroup = additionalInfoGroup.get('report') as FormGroup;
        if (reportGroup) {
          reportGroup.patchValue({
            title: ai.report.title || '',
            description: ai.report.description || '',
            mediaDirection: ai.report.mediaDirection || 'left'
          });

          // Media data
          const mediaDataGroup = reportGroup.get('mediaData') as FormGroup;
          if (mediaDataGroup) {
            mediaDataGroup.patchValue({
              mediaType: ai.report.mediaData?.mediaType || 'image'
            });
            const mediaLinkArray = mediaDataGroup.get('mediaLink') as FormArray;
            while (mediaLinkArray.length !== 0) {
              mediaLinkArray.removeAt(0);
            }
            if (ai.report.mediaData?.mediaLink && ai.report.mediaData.mediaLink.length > 0) {
              ai.report.mediaData.mediaLink.forEach((media: any) => {
                mediaLinkArray.push(this.fb.control(media));
              });
            }
          }
        }
      }

      // Star Endorsed
      if (ai.startEndorsed) {
        const startEndorsedGroup = additionalInfoGroup.get('startEndorsed') as FormGroup;
        if (startEndorsedGroup) {
          startEndorsedGroup.patchValue({
            title: ai.startEndorsed.title || '',
            description: ai.startEndorsed.description || ''
          });

          // Media data
          const mediaDataGroup = startEndorsedGroup.get('mediaData') as FormGroup;
          if (mediaDataGroup) {
            mediaDataGroup.patchValue({
              mediaType: ai.startEndorsed.mediaData?.mediaType || 'image'
            });
            const mediaLinkArray = mediaDataGroup.get('mediaLink') as FormArray;
            while (mediaLinkArray.length !== 0) {
              mediaLinkArray.removeAt(0);
            }
            if (ai.startEndorsed.mediaData?.mediaLink && ai.startEndorsed.mediaData.mediaLink.length > 0) {
              ai.startEndorsed.mediaData.mediaLink.forEach((media: any) => {
                mediaLinkArray.push(this.fb.control(media));
              });
            }
          }
        }
      }
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
      
      if (ai.dose) {
        additionalInfo.dose = ai.dose;
      }
      
      if (ai.howToTake) {
        additionalInfo.howToTake = ai.howToTake;
      }
      
      if (ai.precautions && ai.precautions.length > 0) {
        additionalInfo.precautions = ai.precautions;
      }
      
      if (ai.ingredients) {
        additionalInfo.ingredients = ai.ingredients;
      }
      
      if (ai.consumptionInstructions) {
        additionalInfo.consumptionInstructions = ai.consumptionInstructions;
      }
      
      if (ai.outcomes) {
        // Only include outcomes if it has meaningful data
        if (ai.outcomes.title || ai.outcomes.description || (ai.outcomes.outcome && ai.outcomes.outcome.length > 0)) {
          additionalInfo.outcomes = {
            title: ai.outcomes.title || '',
            description: ai.outcomes.description || '',
            outcome: ai.outcomes.outcome && ai.outcomes.outcome.length > 0 ? ai.outcomes.outcome : undefined
          };
        }
      }
      
      if (ai.feature) {
        additionalInfo.feature = ai.feature;
      }
      
      if (ai.report) {
        // Only include report if it has meaningful data, excluding metaData
        if (ai.report.title || ai.report.description || (ai.report.mediaData?.mediaLink && ai.report.mediaData.mediaLink.length > 0)) {
          additionalInfo.report = {
            title: ai.report.title || '',
            description: ai.report.description || '',
            mediaDirection: ai.report.mediaDirection || 'left',
            mediaData: {
              mediaType: ai.report.mediaData?.mediaType || 'image',
              mediaLink: ai.report.mediaData?.mediaLink || []
            }
          };
        }
      }
      
      if (ai.startEndorsed) {
        // Only include startEndorsed if it has meaningful data
        if (ai.startEndorsed.title || ai.startEndorsed.description || (ai.startEndorsed.mediaData?.mediaLink && ai.startEndorsed.mediaData.mediaLink.length > 0)) {
          additionalInfo.startEndorsed = {
            title: ai.startEndorsed.title || '',
            description: ai.startEndorsed.description || '',
            mediaData: {
              mediaType: ai.startEndorsed.mediaData?.mediaType || 'image',
              mediaLink: ai.startEndorsed.mediaData?.mediaLink || []
            }
          };
        }
      }
    }

    const payload: IManageProduct = {
      name: formValue.name,
      hsnCode: formValue.hsnCode,
      imagePath: formValue.imagePath || [],
      fees: formValue.fees || [],
      additionalInfo: additionalInfo,
      active: formValue.active
    };

    return payload;
  }
}

