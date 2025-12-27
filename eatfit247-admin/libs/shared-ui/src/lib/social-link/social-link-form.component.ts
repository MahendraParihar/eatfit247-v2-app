import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { InputErrorComponent } from '../input-error/input-error.component';
import { ISocialLink } from '@eatfit247-shared-lib';

@Component({
  selector: 'shared-ui-social-link-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    InputErrorComponent
  ],
  templateUrl: './social-link-form.component.html',
  styleUrl: './social-link-form.component.scss'
})
export class SocialLinkFormComponent implements OnInit {
  @Input() formGroup!: FormGroup;
  @Input() socialLinks?: ISocialLink[];
  socialLinksFormArray: FormArray<FormGroup> = new FormArray<FormGroup>([]);
  commonSocialLinks = [
    { label: 'Facebook', icon: 'facebook', link: '' },
    { label: 'Twitter', icon: 'twitter', link: '' },
    { label: 'Instagram', icon: 'instagram', link: '' },
    { label: 'LinkedIn', icon: 'linkedin', link: '' },
    { label: 'YouTube', icon: 'youtube', link: '' },
    { label: 'Website', icon: 'language', link: '' }
  ];

  ngOnInit(): void {
    this.formGroup.addControl('socialLinks', this.socialLinksFormArray);
    this.initializeSocialLinks();
  }

  private initializeSocialLinks(): void {
    if (this.socialLinks && this.socialLinks.length > 0) {
      this.socialLinks.forEach((link) => {
        this.addSocialLink(link.label, link.link, link.icon);
      });
    } else {
      // Initialize with common social links
      this.commonSocialLinks.forEach((link) => {
        this.addSocialLink(link.label, link.link, link.icon);
      });
    }
  }

  private addSocialLink(label: string, link: string, icon: string): void {
    const linkGroup = new FormGroup({
      label: new FormControl(label, [Validators.required]),
      link: new FormControl(link, [Validators.pattern(/^https?:\/\/.+/)]),
      icon: new FormControl(icon)
    });
    this.socialLinksFormArray.push(linkGroup);
  }

  getSocialLinksControls(): FormGroup[] {
    return this.socialLinksFormArray.controls as FormGroup[];
  }
}
