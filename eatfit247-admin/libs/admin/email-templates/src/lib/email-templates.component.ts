import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatSlideToggleChange, MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { LoaderComponent } from '@shared';
import { PermissionService } from '@core';
import { AdminActionEnum, AdminSubjectEnum, IEmailTemplateSwitch, IUpdateEmailTemplateSwitch } from '@eatfit247-shared-lib';
import { EmailTemplatesApiService } from './api.service';

type TemplateSwitch = keyof IUpdateEmailTemplateSwitch;

/** Account emails: switching them off stops password resets and new-account emails from going out. */
const ACCOUNT_TEMPLATES = new Set([
  'admin_forgot_password',
  'admin_success_password',
  'admin_welcome',
  'member_reset_password',
  'member_success_password',
]);

/**
 * Email Templates (configurable tax treatment, decision 18): switch each template on or off, and its email and its
 * WhatsApp message. Content is not edited here. Global platform settings (`EmailTemplate`); without Update the
 * switches are read-only.
 */
@Component({
  selector: 'lib-email-templates',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatTableModule, MatSlideToggleModule, MatTooltipModule, MatIconModule, MatSnackBarModule, LoaderComponent],
  templateUrl: './email-templates.component.html',
  styleUrl: './email-templates.component.scss',
})
export class EmailTemplatesComponent implements OnInit {
  private readonly api = inject(EmailTemplatesApiService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly permissionService = inject(PermissionService);

  readonly loading = signal(true);
  readonly templates = signal<IEmailTemplateSwitch[]>([]);
  /** The switch being saved, as `id:switch` */
  readonly saving = signal<string | null>(null);
  readonly canUpdate = computed(() =>
    this.permissionService.hasPermission(AdminSubjectEnum.EmailTemplate, AdminActionEnum.Update),
  );
  readonly displayedColumns = ['template', 'subject', 'active', 'sendEmailNotification', 'sendWhatsappNotification'];

  ngOnInit(): void {
    this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    try {
      this.templates.set(await this.api.list());
    } catch {
      // The error toast comes from HttpErrorInterceptor
    } finally {
      this.loading.set(false);
    }
  }

  /** `member_welcome` → "Member welcome" */
  label(templateName: string): string {
    const words = templateName.replace(/_/g, ' ');
    return words.charAt(0).toUpperCase() + words.slice(1);
  }

  isAccountTemplate(templateName: string): boolean {
    return ACCOUNT_TEMPLATES.has(templateName);
  }

  isSaving(template: IEmailTemplateSwitch, field: TemplateSwitch): boolean {
    return this.saving() === `${template.emailTemplateId}:${field}`;
  }

  async toggle(template: IEmailTemplateSwitch, field: TemplateSwitch, event: MatSlideToggleChange): Promise<void> {
    this.saving.set(`${template.emailTemplateId}:${field}`);
    try {
      const saved = await this.api.update(template.emailTemplateId, { [field]: event.checked });
      this.templates.update((rows) => rows.map((row) => (row.emailTemplateId === saved.emailTemplateId ? saved : row)));
      this.snackBar.open(`${this.label(template.templateName)}: saved`, 'Close', { duration: 2500 });
    } catch {
      // Put the switch back: the save failed (the error toast comes from HttpErrorInterceptor)
      event.source.checked = !event.checked;
    } finally {
      this.saving.set(null);
    }
  }
}
