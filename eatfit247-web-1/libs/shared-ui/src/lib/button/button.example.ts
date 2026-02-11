// Example Usage of ButtonComponent

import { Component } from '@angular/core';
import { ButtonComponent } from './button.component';

@Component({
  standalone: true,
  selector: 'app-button-example',
  imports: [ButtonComponent],
  template: `
    <div style="display: flex; flex-direction: column; gap: 16px; padding: 24px;">
      <h2>Button Component Examples</h2>

      <h3>Basic Variants</h3>
      <!-- Primary Button -->
      <app-button variant="primary" size="md" (clicked)="onClick($event)">
        Primary Button
      </app-button>

      <!-- Secondary Button -->
      <app-button variant="secondary" size="md" (clicked)="onClick($event)">
        Secondary Button
      </app-button>

      <!-- Outline Button -->
      <app-button variant="outline" size="md" (clicked)="onClick($event)">
        Outline Button
      </app-button>

      <!-- Text Button -->
      <app-button variant="text" size="md" (clicked)="onClick($event)">
        Text Button
      </app-button>

      <!-- Raised Button -->
      <app-button variant="raised" size="md" (clicked)="onClick($event)">
        Raised Button
      </app-button>

      <h3>Icon Buttons</h3>
      <!-- Icon Button -->
      <app-button variant="icon" icon="favorite" (clicked)="onClick($event)">
      </app-button>

      <!-- Icon Button with Color -->
      <app-button variant="icon" icon="favorite" color="primary" (clicked)="onClick($event)">
      </app-button>

      <app-button variant="icon" icon="delete" color="warn" (clicked)="onClick($event)">
      </app-button>

      <h3>FAB Buttons</h3>
      <!-- FAB Button -->
      <app-button variant="fab" icon="add" (clicked)="onClick($event)">
      </app-button>

      <!-- Mini FAB Button -->
      <app-button variant="mini-fab" icon="edit" (clicked)="onClick($event)">
      </app-button>

      <!-- FAB with Color -->
      <app-button variant="fab" icon="add" color="accent" (clicked)="onClick($event)">
      </app-button>

      <h3>Buttons with Icons</h3>
      <!-- Button with Start Icon -->
      <app-button variant="primary" iconStart="save" (clicked)="onClick($event)">
        Save
      </app-button>

      <!-- Button with End Icon -->
      <app-button variant="primary" iconEnd="arrow_forward" (clicked)="onClick($event)">
        Continue
      </app-button>

      <!-- Button with Both Icons -->
      <app-button variant="outline" iconStart="download" iconEnd="cloud_download" (clicked)="onClick($event)">
        Download
      </app-button>

      <h3>Size Variants</h3>
      <div style="display: flex; gap: 8px; align-items: center;">
        <app-button variant="primary" size="sm">Small</app-button>
        <app-button variant="primary" size="md">Medium</app-button>
        <app-button variant="primary" size="lg">Large</app-button>
      </div>

      <h3>Color Variants</h3>
      <div style="display: flex; gap: 8px; align-items: center;">
        <app-button variant="primary" color="primary">Primary</app-button>
        <app-button variant="primary" color="accent">Accent</app-button>
        <app-button variant="primary" color="warn">Warn</app-button>
      </div>

      <h3>States</h3>
      <!-- Disabled State -->
      <app-button variant="primary" [disabled]="true">
        Disabled Button
      </app-button>

      <!-- Loading State -->
      <app-button variant="primary" [loading]="true">
        Loading Button
      </app-button>

      <!-- Full Width -->
      <app-button variant="primary" [fullWidth]="true">
        Full Width Button
      </app-button>

      <h3>Form Buttons</h3>
      <!-- Submit Button -->
      <app-button variant="primary" type="submit" (clicked)="onSubmit($event)">
        Submit
      </app-button>

      <!-- Reset Button -->
      <app-button variant="secondary" type="reset" (clicked)="onReset($event)">
        Reset
      </app-button>

      <h3>Toggle Button</h3>
      <app-button 
        variant="primary" 
        [toggle]="true" 
        [checked]="isToggled"
        (toggleChange)="onToggleChange($event)">
        Toggle Button
      </app-button>
    </div>
  `,
})
export class ButtonExampleComponent {
  isToggled = false;

  onClick(event: Event): void {
    console.log('Button clicked', event);
  }

  onSubmit(event: Event): void {
    console.log('Form submitted', event);
  }

  onReset(event: Event): void {
    console.log('Form reset', event);
  }

  onToggleChange(checked: boolean): void {
    this.isToggled = checked;
    console.log('Toggle changed', checked);
  }
}

