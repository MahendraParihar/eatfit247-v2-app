import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../core/services/theme.service';
import {
  ContainerComponent,
  SectionComponent,
  ButtonComponent,
} from '@shared-ui';

@Component({
  selector: 'app-design-system-demo',
  standalone: true,
  imports: [
    CommonModule,
    ContainerComponent,
    SectionComponent,
    ButtonComponent,
  ],
  template: `
    <app-section>
      <app-container>
        <div class="demo-header">
          <h1 class="heading-1">Design System Demo</h1>
          <app-button
            variant="primary"
            size="md"
            (clicked)="themeService.toggleTheme()"
          >
            Toggle {{ themeService.currentTheme() === 'light' ? 'Dark' : 'Light' }} Mode
          </app-button>
        </div>

        <div class="demo-section">
          <h2 class="heading-2">Typography</h2>
          <div class="typography-demo">
            <h1 class="heading-1">Heading 1 - Bold</h1>
            <h2 class="heading-2">Heading 2 - Bold</h2>
            <h3 class="heading-3">Heading 3 - Bold</h3>
            <h4 class="heading-4">Heading 4 - Semibold</h4>
            <h5 class="heading-5">Heading 5 - Semibold</h5>
            <p class="body-b1">Body B1 - Bold 16px</p>
            <p class="body-b2">Body B2 - Semibold 16px</p>
            <p class="body-b3">Body B3 - Regular 16px</p>
            <p class="body-b4">Body B4 - Bold 14px</p>
            <p class="body-b5">Body B5 - Semibold 14px</p>
            <p class="body-b6">Body B6 - Regular 14px</p>
            <p class="button-text">Button Text - Medium 16px</p>
          </div>
        </div>

        <div class="demo-section">
          <h2 class="heading-2">Color Tokens</h2>
          <div class="color-grid">
            <div class="color-card">
              <div class="color-swatch" style="background-color: var(--color-primary)"></div>
              <p class="body-b3">Primary</p>
            </div>
            <div class="color-card">
              <div class="color-swatch" style="background-color: var(--color-primary-hover)"></div>
              <p class="body-b3">Primary Hover</p>
            </div>
            <div class="color-card">
              <div class="color-swatch" style="background-color: var(--color-text-primary)"></div>
              <p class="body-b3">Text Primary</p>
            </div>
            <div class="color-card">
              <div class="color-swatch" style="background-color: var(--color-text-secondary)"></div>
              <p class="body-b3">Text Secondary</p>
            </div>
            <div class="color-card">
              <div class="color-swatch" style="background-color: var(--color-surface-page)"></div>
              <p class="body-b3">Surface Page</p>
            </div>
            <div class="color-card">
              <div class="color-swatch" style="background-color: var(--color-surface-card); border: 1px solid var(--color-border)"></div>
              <p class="body-b3">Surface Card</p>
            </div>
            <div class="color-card">
              <div class="color-swatch" style="background-color: var(--color-border)"></div>
              <p class="body-b3">Border</p>
            </div>
          </div>
        </div>

        <div class="demo-section">
          <h2 class="heading-2">Spacing System</h2>
          <div class="spacing-demo">
            <div class="spacing-item" style="margin-bottom: var(--space-1)">
              <span class="body-b3">Space 1 (4px)</span>
            </div>
            <div class="spacing-item" style="margin-bottom: var(--space-2)">
              <span class="body-b3">Space 2 (8px)</span>
            </div>
            <div class="spacing-item" style="margin-bottom: var(--space-3)">
              <span class="body-b3">Space 3 (12px)</span>
            </div>
            <div class="spacing-item" style="margin-bottom: var(--space-4)">
              <span class="body-b3">Space 4 (16px)</span>
            </div>
            <div class="spacing-item" style="margin-bottom: var(--space-5)">
              <span class="body-b3">Space 5 (24px)</span>
            </div>
            <div class="spacing-item" style="margin-bottom: var(--space-6)">
              <span class="body-b3">Space 6 (32px)</span>
            </div>
            <div class="spacing-item" style="margin-bottom: var(--space-7)">
              <span class="body-b3">Space 7 (40px)</span>
            </div>
            <div class="spacing-item" style="margin-bottom: var(--space-8)">
              <span class="body-b3">Space 8 (48px)</span>
            </div>
            <div class="spacing-item" style="margin-bottom: var(--space-9)">
              <span class="body-b3">Space 9 (64px)</span>
            </div>
          </div>
        </div>

        <div class="demo-section">
          <h2 class="heading-2">Grid Layout</h2>
          <div class="layout-grid layout-grid--2">
            <div class="grid-item">
              <p class="body-b3">Grid Item 1</p>
            </div>
            <div class="grid-item">
              <p class="body-b3">Grid Item 2</p>
            </div>
            <div class="grid-item">
              <p class="body-b3">Grid Item 3</p>
            </div>
            <div class="grid-item">
              <p class="body-b3">Grid Item 4</p>
            </div>
          </div>
        </div>

        <div class="demo-section">
          <h2 class="heading-2">Button Component</h2>
          <div class="button-demo">
            <div class="button-group">
              <h3 class="heading-3">Variants</h3>
              <div class="button-row">
                <app-button variant="primary" size="md" (clicked)="onButtonClick($event)">
                  Primary
                </app-button>
                <app-button variant="secondary" size="md" (clicked)="onButtonClick($event)">
                  Secondary
                </app-button>
                <app-button variant="outline" size="md" (clicked)="onButtonClick($event)">
                  Outline
                </app-button>
                <app-button variant="text" size="md" (clicked)="onButtonClick($event)">
                  Text
                </app-button>
              </div>
            </div>

            <div class="button-group">
              <h3 class="heading-3">Sizes</h3>
              <div class="button-row">
                <app-button variant="primary" size="sm" (clicked)="onButtonClick($event)">
                  Small
                </app-button>
                <app-button variant="primary" size="md" (clicked)="onButtonClick($event)">
                  Medium
                </app-button>
                <app-button variant="primary" size="lg" (clicked)="onButtonClick($event)">
                  Large
                </app-button>
              </div>
            </div>

            <div class="button-group">
              <h3 class="heading-3">States</h3>
              <div class="button-row">
                <app-button variant="primary" size="md" (clicked)="onButtonClick($event)">
                  Default
                </app-button>
                <app-button variant="primary" size="md" [disabled]="true">
                  Disabled
                </app-button>
                <app-button variant="primary" size="md" [loading]="isLoading" (clicked)="onButtonClick($event)">
                  Loading
                </app-button>
              </div>
            </div>

            <div class="button-group">
              <h3 class="heading-3">Full Width</h3>
              <div class="button-row">
                <app-button variant="primary" size="md" [fullWidth]="true" (clicked)="onButtonClick($event)">
                  Full Width Button
                </app-button>
              </div>
            </div>

            <div class="button-group">
              <h3 class="heading-3">Button Types</h3>
              <div class="button-row">
                <app-button variant="primary" size="md" type="button" (clicked)="onButtonClick($event)">
                  Button
                </app-button>
                <app-button variant="primary" size="md" type="submit" (clicked)="onSubmit($event)">
                  Submit
                </app-button>
                <app-button variant="secondary" size="md" type="reset" (clicked)="onReset($event)">
                  Reset
                </app-button>
              </div>
            </div>
          </div>
        </div>

        <div class="demo-section">
          <h2 class="heading-2">Responsive Layout</h2>
          <p class="body-b3">
            This page demonstrates the complete design system with fluid typography,
            spacing, colors, and responsive grid layouts. Resize your browser to see
            the responsive behavior.
          </p>
        </div>
      </app-container>
    </app-section>
  `,
  styleUrl: './design-system-demo.component.scss',
})
export class DesignSystemDemoComponent {
  readonly themeService = inject(ThemeService);
  isLoading = false;

  onButtonClick(event: Event): void {
    console.log('Button clicked', event);
  }

  onSubmit(event: Event): void {
    console.log('Form submitted', event);
    this.isLoading = true;
    setTimeout(() => {
      this.isLoading = false;
    }, 2000);
  }

  onReset(event: Event): void {
    console.log('Form reset', event);
  }
}

