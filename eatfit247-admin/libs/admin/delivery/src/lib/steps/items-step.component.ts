import {
  Component,
  EventEmitter,
  Input,
  Output,
  OnInit,
  OnChanges,
  SimpleChanges,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { EmptyStateComponent } from '@shared';
import { IShipment } from '@eatfit247-shared-lib';
import { IOrderItemShipmentGroup } from '../models/shipment.model';

@Component({
  selector: 'lib-items-step',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatCheckboxModule,
    EmptyStateComponent,
  ],
  templateUrl: './items-step.component.html',
  styleUrl: './items-step.component.scss',
})
export class ItemsStepComponent implements OnInit, OnChanges {
  @Input() shipmentDetails: IShipment | null = null;
  @Input() loading = false;
  @Input() formGroup!: FormGroup;
  @Input() orderItemGroups: IOrderItemShipmentGroup[] = [];
  @Output() itemsSaved = new EventEmitter<
    Array<{ memberProductOrderItemId: number; quantity: number }>
  >();

  private readonly fb = inject(FormBuilder);
  itemsFormArray!: FormArray;
  displayedColumns: string[] = [
    'select',
    'productName',
    'orderedQuantity',
  ];

  ngOnInit(): void {
    if (this.orderItemGroups.length > 0) {
      this.initializeForm();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes['orderItemGroups'] &&
      this.orderItemGroups &&
      this.orderItemGroups.length > 0
    ) {
      this.initializeForm();
    }
  }

  private initializeForm(): void {
    if (!this.formGroup || this.formGroup.get('items')) {
      return;
    }

    this.itemsFormArray = this.fb.array([]);
    this.formGroup.addControl('items', this.itemsFormArray);

    this.orderItemGroups
      .filter((group) => group.quantity > 0)
      .forEach((group) => {
        const itemGroup = this.fb.group({
          memberProductOrderItemId: [
            group.orderItem.memberProductOrderItemId,
            Validators.required,
          ],
          selected: [false],
        });
        this.itemsFormArray.push(itemGroup);
      });
  }

  getItemControl(index: number): FormGroup {
    return this.itemsFormArray.at(index) as FormGroup;
  }

  onSave(): void {
    if (this.itemsFormArray.valid) {
      const items = this.itemsFormArray.value
        .filter((item: { selected: boolean }) => item.selected)
        .map((item: { memberProductOrderItemId: number }) => {
          const group = this.orderItemGroups.find(
            (g) => g.orderItem.memberProductOrderItemId === item.memberProductOrderItemId
          );
          const quantity = group?.quantity ?? 0;
          return {
            memberProductOrderItemId: item.memberProductOrderItemId,
            quantity,
          };
        });
      this.itemsSaved.emit(items);
    } else {
      this.itemsFormArray.markAllAsTouched();
    }
  }

  hasItems(): boolean {
    return this.orderItemGroups.some((group) => group.quantity > 0);
  }

  /** Groups that have remaining quantity — used as table dataSource so row index matches form array index */
  get selectableGroups(): IOrderItemShipmentGroup[] {
    return this.orderItemGroups.filter((g) => g.quantity > 0);
  }

  hasSelection(): boolean {
    if (!this.itemsFormArray) return false;
    return this.itemsFormArray.controls.some(
      (c) => (c.get('selected')?.value ?? false) === true
    );
  }
}
