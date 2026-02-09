import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { OrganizationsService } from './organizations.service';
import {
  UpdateOrganizationDto,
  OrganizationResponseDto,
  CreateTaxRateDto,
  UpdateTaxRateDto,
  TaxRateResponseDto,
  UpdateNumberSequenceDto,
  NumberSequenceResponseDto,
} from './dto';
import { CurrentUser, Roles, RequirePermissions, AuditEntity } from '@/common/decorators';

@ApiTags('Organizations')
@ApiBearerAuth()
@AuditEntity('Organization')
@Controller('organizations')
export class OrganizationsController {
  constructor(private organizationsService: OrganizationsService) {}

  @Get('current')
  @RequirePermissions('organizations:view')
  @ApiOperation({ summary: 'Get current organization profile' })
  @ApiResponse({ status: 200, type: OrganizationResponseDto })
  async getCurrent(@CurrentUser('organizationId') orgId: string) {
    const org = await this.organizationsService.getOrganization(orgId);
    return { data: org };
  }

  @Put('current')
  @Roles('Administrator')
  @RequirePermissions('organizations:edit')
  @ApiOperation({ summary: 'Update current organization profile' })
  @ApiResponse({ status: 200, type: OrganizationResponseDto })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async updateCurrent(
    @CurrentUser('organizationId') orgId: string,
    @Body() dto: UpdateOrganizationDto,
  ) {
    const org = await this.organizationsService.updateOrganization(orgId, dto);
    return { data: org };
  }
}

@ApiTags('Settings')
@ApiBearerAuth()
@AuditEntity('Settings')
@Controller('settings')
export class SettingsController {
  constructor(private organizationsService: OrganizationsService) {}

  // Tax Rates
  @Get('tax-rates')
  @RequirePermissions('organizations:view')
  @ApiOperation({ summary: 'Get all tax rates' })
  @ApiResponse({ status: 200, type: [TaxRateResponseDto] })
  async getTaxRates(@CurrentUser('organizationId') orgId: string) {
    const taxRates = await this.organizationsService.getTaxRates(orgId);
    return { data: taxRates };
  }

  @Post('tax-rates')
  @Roles('Administrator')
  @RequirePermissions('organizations:edit')
  @ApiOperation({ summary: 'Create a new tax rate' })
  @ApiResponse({ status: 201, type: TaxRateResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async createTaxRate(
    @CurrentUser('organizationId') orgId: string,
    @Body() dto: CreateTaxRateDto,
  ) {
    const taxRate = await this.organizationsService.createTaxRate(orgId, dto);
    return { data: taxRate };
  }

  @Put('tax-rates/:id')
  @Roles('Administrator')
  @RequirePermissions('organizations:edit')
  @ApiOperation({ summary: 'Update a tax rate' })
  @ApiResponse({ status: 200, type: TaxRateResponseDto })
  @ApiResponse({ status: 404, description: 'Not found' })
  async updateTaxRate(
    @CurrentUser('organizationId') orgId: string,
    @Param('id') id: string,
    @Body() dto: UpdateTaxRateDto,
  ) {
    const taxRate = await this.organizationsService.updateTaxRate(orgId, id, dto);
    return { data: taxRate };
  }

  @Delete('tax-rates/:id')
  @Roles('Administrator')
  @RequirePermissions('organizations:edit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a tax rate' })
  @ApiResponse({ status: 200, description: 'Tax rate deleted' })
  @ApiResponse({ status: 400, description: 'Tax rate in use' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async deleteTaxRate(
    @CurrentUser('organizationId') orgId: string,
    @Param('id') id: string,
  ) {
    await this.organizationsService.deleteTaxRate(orgId, id);
    return { data: { message: 'Tax rate deleted successfully' } };
  }

  // Number Sequences
  @Get('number-sequences')
  @RequirePermissions('organizations:view')
  @ApiOperation({ summary: 'Get all number sequences' })
  @ApiResponse({ status: 200, type: [NumberSequenceResponseDto] })
  async getNumberSequences(@CurrentUser('organizationId') orgId: string) {
    const sequences = await this.organizationsService.getNumberSequences(orgId);
    return { data: sequences };
  }

  @Put('number-sequences/:documentType')
  @Roles('Administrator')
  @RequirePermissions('organizations:edit')
  @ApiOperation({ summary: 'Update a number sequence' })
  @ApiResponse({ status: 200, type: NumberSequenceResponseDto })
  @ApiResponse({ status: 404, description: 'Not found' })
  async updateNumberSequence(
    @CurrentUser('organizationId') orgId: string,
    @Param('documentType') documentType: string,
    @Body() dto: UpdateNumberSequenceDto,
  ) {
    const sequence = await this.organizationsService.updateNumberSequence(
      orgId,
      documentType,
      dto,
    );
    return { data: sequence };
  }
}
