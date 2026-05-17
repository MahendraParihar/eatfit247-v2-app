import { Body, Controller, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import {
  AbilitiesGuard,
  BasicSearchDto,
  CurrentUser,
  JwtAuthGuard,
  RequestedIp,
  RequireAbility,
} from '@server_1/core';
import { AdminRbacService } from '../../services';
import { CreateAdminRoleDto, UpdatePermissionMatrixDto } from '../../dto';
import {
  AdminActionEnum,
  AdminSubjectEnum,
  IAdminRole,
  IAdminSubject,
  IAuthUser,
  IPermissionMatrix,
  ITableList,
} from '@eatfit247-shared-lib';

@Controller('admin-rbac')
@UseGuards(JwtAuthGuard, AbilitiesGuard)
export class AdminRbacController {
  constructor(private readonly service: AdminRbacService) {}

  // ─── Role CRUD ───────────────────────────────────────────────────────

  @Get('role/list')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.AdminRole)
  async listRoles(@Query() req: BasicSearchDto): Promise<ITableList<IAdminRole>> {
    return await this.service.findAllRoles(req);
  }

  @Get('role/manage/:id')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.AdminRole)
  async getRoleById(@Param('id') id: number): Promise<IAdminRole> {
    return await this.service.fetchRoleById(id);
  }

  @Post('role/manage')
  @RequireAbility(AdminActionEnum.Create, AdminSubjectEnum.AdminRole)
  async createRole(
    @Body() body: CreateAdminRoleDto,
  ): Promise<IAdminRole> {
    return await this.service.createRole(body);
  }

  @Put('role/manage/:id')
  @RequireAbility(AdminActionEnum.Update, AdminSubjectEnum.AdminRole)
  async updateRole(
    @Param('id') id: number,
    @Body() body: CreateAdminRoleDto,
  ): Promise<void> {
    await this.service.updateRole(id, body);
  }

  // ─── Subject Listing (read-only) ────────────────────────────────────

  @Get('subject/list')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.AdminRole)
  async listSubjects(): Promise<IAdminSubject[]> {
    return await this.service.findAllSubjects();
  }

  // ─── Permission Matrix ──────────────────────────────────────────────

  @Get('role/:roleId/permission-matrix')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.AdminRole)
  async getPermissionMatrix(@Param('roleId') roleId: number): Promise<IPermissionMatrix> {
    return await this.service.getPermissionMatrix(roleId);
  }

  @Put('role/:roleId/permission-matrix')
  @RequireAbility(AdminActionEnum.Update, AdminSubjectEnum.AdminRole)
  async savePermissionMatrix(
    @Param('roleId') roleId: number,
    @Body() body: UpdatePermissionMatrixDto,
    @CurrentUser() currentUser: IAuthUser,
    @RequestedIp() requestedIp: string,
  ): Promise<void> {
    await this.service.savePermissionMatrix(roleId, body, requestedIp, currentUser.adminId);
  }
}
