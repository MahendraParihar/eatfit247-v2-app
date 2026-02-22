import { Component, EventEmitter, Input, Output, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
} from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { InputErrorComponent, EmptyStateComponent } from '@shared';
import { IShipmentDetails } from '@eatfit247-shared-lib';
import { IOrderItem } from '../models/shipment.model';

@Component({
  selector: 'lib-items-step',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTableModule,
    InputErrorComponent,
    EmptyStateComponent,
  ],
  templateUrl: './items-step.component.html',
  styleUrl: './items-step.component.scss',
})
export class ItemsStepComponent implements OnInit {
  @Input() shipmentDetails: IShipmentDetails | null = null;
  @Input() loading = false;
  @Input() formGroup!: FormGroup;
  @Output() itemsSaved = new EventEmitter<Array<{ memberProductOrderItemId: number; quantity: number }>>();

  private readonly fb = inject(FormBuilder);
  itemsFormArray!: FormArray;
  displayedColumns: string[] = ['productName', 'orderedQuantity', 'remainingQuantity', 'quantity'];

  ngOnInit(): void {
    if (this.shipmentDetails?.orderItems) {
      this.initializeForm();
    }
  }

  private initializeForm(): void {
    this.itemsFormArray = this.fb.array([]);
    this.formGroup.addControl('items', this.itemsFormArray);

    if (this.shipmentDetails?.orderItems) {
      this.shipmentDetails.orderItems.forEach((item) => {
        const itemGroup = this.fb.group({
          memberProductOrderItemId: [this.getOrderItemId(item), Validators.required],
          quantity: [
            0,
            [
              Validators.required,
              Validators.min(1),
              (control: AbstractControl) => this.validateQuantity(control, item),
            ],
          ],
        });
        this.itemsFormArray.push(itemGroup);
      });
    }
  }

  private getOrderItemId(item: IOrderItem | { productName: string; quantity: number }): number {
    if ('memberProductOrderItemId' in item) {
      return item.memberProductOrderItemId;
    }
    return 0;
  }

  private validateQuantity(control: AbstractControl, item: IOrderItem | { productName: string; quantity: number }): { [key: string]: boolean } | null {
    const value = control.value;
    const remaining = 'remainingQuantity' in item ? item.remainingQuantity : item.quantity;
    if (value > remaining) {
      return { maxQuantity: true };
    }
    return null;
  }

  getItemControl(index: number): FormGroup {
    return this.itemsFormArray.at(index) as FormGroup;
  }

  getOrderItem(index: number): IOrderItem | { productName: string; quantity: number } {
    return this.shipmentDetails?.orderItems?.[index] || { productName: '', quantity: 0 };
  }

  getRemainingQuantity(item: IOrderItem | { productName: string; quantity: number }): number {
    return 'remainingQuantity' in item ? item.remainingQuantity : item.quantity;
  }

  onSave(): void {
    if (this.itemsFormArray.valid) {
      const items = this.itemsFormArray.value
        .filter((item: { quantity: number }) => item.quantity > 0)
        .map((item: { memberProductOrderItemId: number; quantity: number }) => ({
          memberProductOrderItemId: item.memberProductOrderItemId,
          quantity: item.quantity,
        }));
      this.itemsSaved.emit(items);
    } else {
      this.itemsFormArray.markAllAsTouched();
    }
  }

  hasItems(): boolean {
    return (this.shipmentDetails?.orderItems?.length || 0) > 0;
  }
}

