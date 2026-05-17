import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AdminRbacApiService } from '../api.service';
import {
  IAdminAction,
  IAdminRole,
  IAdminSubject,
  IPermissionGrant,
} from '@eatfit247-shared-lib';

@Component({
  selector: 'lib-permission-matrix',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './permission-matrix.html',
  styleUrl: './permission-matrix.scss',
})
export class PermissionMatrix implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private apiService = inject(AdminRbacApiService);

  roleId!: number;
  role!: IAdminRole;
  subjects: IAdminSubject[] = [];
  actions: IAdminAction[] = [];
  loading = false;
  saving = false;

  /** Map keyed by "subjectId_actionId" → boolean */
  grantMap = new Map<string, boolean>();

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/admin-rbac']);
      return;
    }
    this.roleId = +id;
    await this.loadData();
  }

  async loadData(): Promise<void> {
    this.loading = true;
    try {
      const [role, matrix] = await Promise.all([
        this.apiService.getById(this.roleId),
        this.apiService.getPermissionMatrix(this.roleId),
      ]);
      this.role = role;
      this.subjects = matrix.subjects;
      this.actions = matrix.actions;

      // Build grant map
      this.grantMap.clear();
      for (const subject of matrix.subjects) {
        for (const action of matrix.actions) {
          this.grantMap.set(this.key(subject.subjectId, action.actionId), false);
        }
      }
      for (const grant of matrix.grants) {
        this.grantMap.set(this.key(grant.subjectId, grant.actionId), true);
      }
    } finally {
      this.loading = false;
    }
  }

  key(subjectId: number, actionId: number): string {
    return `${subjectId}_${actionId}`;
  }

  isChecked(subjectId: number, actionId: number): boolean {
    return this.grantMap.get(this.key(subjectId, actionId)) ?? false;
  }

  toggle(subjectId: number, actionId: number): void {
    const k = this.key(subjectId, actionId);
    this.grantMap.set(k, !this.grantMap.get(k));
  }

  // ─── Select All per row (subject) ────────────────────────────────

  isRowAllChecked(subjectId: number): boolean {
    return this.actions.every((a) => this.isChecked(subjectId, a.actionId));
  }

  isRowIndeterminate(subjectId: number): boolean {
    const checked = this.actions.filter((a) => this.isChecked(subjectId, a.actionId)).length;
    return checked > 0 && checked < this.actions.length;
  }

  toggleRow(subjectId: number): void {
    const allChecked = this.isRowAllChecked(subjectId);
    for (const action of this.actions) {
      this.grantMap.set(this.key(subjectId, action.actionId), !allChecked);
    }
  }

  // ─── Select All per column (action) ──────────────────────────────

  isColumnAllChecked(actionId: number): boolean {
    return this.subjects.every((s) => this.isChecked(s.subjectId, actionId));
  }

  isColumnIndeterminate(actionId: number): boolean {
    const checked = this.subjects.filter((s) => this.isChecked(s.subjectId, actionId)).length;
    return checked > 0 && checked < this.subjects.length;
  }

  toggleColumn(actionId: number): void {
    const allChecked = this.isColumnAllChecked(actionId);
    for (const subject of this.subjects) {
      this.grantMap.set(this.key(subject.subjectId, actionId), !allChecked);
    }
  }

  // ─── Save ────────────────────────────────────────────────────────

  async onSave(): Promise<void> {
    this.saving = true;
    try {
      const grants: IPermissionGrant[] = [];
      for (const [k, v] of this.grantMap) {
        if (v) {
          const [subjectId, actionId] = k.split('_').map(Number);
          grants.push({ subjectId, actionId });
        }
      }
      await this.apiService.savePermissionMatrix(this.roleId, { grants });
      this.router.navigate(['/admin-rbac']);
    } finally {
      this.saving = false;
    }
  }

  onCancel(): void {
    this.router.navigate(['/admin-rbac']);
  }
}
