import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { VendorsService } from './vendors.service';
import {
  CreateVendorDto,
  UpdateVendorDto,
  VendorResponseDto,
  CreateVendorAddressDto,
  UpdateVendorAddressDto,
  CreateVendorContactDto,
  UpdateVendorContactDto,
  VendorAddressResponseDto,
  VendorContactResponseDto,
  VendorItemPricingDto,
  VendorItemResponseDto,
} from './dto';
import { CurrentUser, RequirePermissions, AuditEntity } from '@/common/decorators';

@ApiTags('Vendors')
@ApiBearerAuth()
@AuditEntity('Vendor')
@Controller('vendors')
export class VendorsController {
  constructor(private vendorsService: VendorsService) {}

  @Post()
  @RequirePermissions('vendors:create')
  @ApiOperation({ summary: 'Create a new vendor' })
  @ApiResponse({ status: 201, type: VendorResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async create(
    @CurrentUser('organizationId') orgId: string,
    @Body() dto: CreateVendorDto,
  ) {
    const vendor = await this.vendorsService.create(orgId, dto);
    return { data: vendor };
  }

  @Get()
  @RequirePermissions('vendors:view')
  @ApiOperation({ summary: 'List all vendors' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'Vendors list' })
  async findAll(
    @CurrentUser('organizationId') orgId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('isActive') isActive?: boolean,
  ) {
    return this.vendorsService.findAll(orgId, {
      page,
      limit,
      search,
      isActive,
    });
  }

  @Get('code/:code')
  @RequirePermissions('vendors:view')
  @ApiOperation({ summary: 'Get vendor by code' })
  @ApiResponse({ status: 200, type: VendorResponseDto })
  @ApiResponse({ status: 404, description: 'Vendor not found' })
  async findByCode(
    @CurrentUser('organizationId') orgId: string,
    @Param('code') code: string,
  ) {
    const vendor = await this.vendorsService.findByCode(orgId, code);
    return { data: vendor };
  }

  @Get(':id')
  @RequirePermissions('vendors:view')
  @ApiOperation({ summary: 'Get vendor by ID' })
  @ApiResponse({ status: 200, type: VendorResponseDto })
  @ApiResponse({ status: 404, description: 'Vendor not found' })
  async findOne(
    @CurrentUser('organizationId') orgId: string,
    @Param('id') id: string,
  ) {
    const vendor = await this.vendorsService.findOne(orgId, id);
    return { data: vendor };
  }

  @Get(':id/items')
  @RequirePermissions('vendors:view')
  @ApiOperation({ summary: 'Get vendor linked items' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Vendor items list' })
  @ApiResponse({ status: 404, description: 'Vendor not found' })
  async getVendorItems(
    @CurrentUser('organizationId') orgId: string,
    @Param('id') id: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.vendorsService.getVendorItems(orgId, id, { page, limit });
  }

  @Get(':id/transactions')
  @RequirePermissions('vendors:view')
  @ApiOperation({ summary: 'Get vendor transaction history' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'type', required: false, enum: ['bill', 'payment'] })
  @ApiResponse({ status: 200, description: 'Transaction history' })
  @ApiResponse({ status: 404, description: 'Vendor not found' })
  async getTransactionHistory(
    @CurrentUser('organizationId') orgId: string,
    @Param('id') id: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('type') type?: 'bill' | 'payment',
  ) {
    return this.vendorsService.getTransactionHistory(orgId, id, {
      page,
      limit,
      type,
    });
  }

  @Put(':id')
  @RequirePermissions('vendors:edit')
  @ApiOperation({ summary: 'Update vendor' })
  @ApiResponse({ status: 200, type: VendorResponseDto })
  @ApiResponse({ status: 404, description: 'Vendor not found' })
  async update(
    @CurrentUser('organizationId') orgId: string,
    @Param('id') id: string,
    @Body() dto: UpdateVendorDto,
  ) {
    const vendor = await this.vendorsService.update(orgId, id, dto);
    return { data: vendor };
  }

  @Delete(':id')
  @RequirePermissions('vendors:delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete vendor' })
  @ApiResponse({ status: 200, description: 'Vendor deleted' })
  @ApiResponse({ status: 404, description: 'Vendor not found' })
  async remove(
    @CurrentUser('organizationId') orgId: string,
    @Param('id') id: string,
  ) {
    await this.vendorsService.remove(orgId, id);
    return { data: { message: 'Vendor deleted successfully' } };
  }

  // Address endpoints
  @Post(':id/addresses')
  @RequirePermissions('vendors:edit')
  @ApiOperation({ summary: 'Add vendor address' })
  @ApiResponse({ status: 201, type: VendorAddressResponseDto })
  @ApiResponse({ status: 404, description: 'Vendor not found' })
  async addAddress(
    @CurrentUser('organizationId') orgId: string,
    @Param('id') vendorId: string,
    @Body() dto: CreateVendorAddressDto,
  ) {
    const address = await this.vendorsService.addAddress(orgId, vendorId, dto);
    return { data: address };
  }

  @Put(':id/addresses/:addressId')
  @RequirePermissions('vendors:edit')
  @ApiOperation({ summary: 'Update vendor address' })
  @ApiResponse({ status: 200, type: VendorAddressResponseDto })
  @ApiResponse({ status: 404, description: 'Vendor or address not found' })
  async updateAddress(
    @CurrentUser('organizationId') orgId: string,
    @Param('id') vendorId: string,
    @Param('addressId') addressId: string,
    @Body() dto: UpdateVendorAddressDto,
  ) {
    const address = await this.vendorsService.updateAddress(
      orgId,
      vendorId,
      addressId,
      dto,
    );
    return { data: address };
  }

  @Delete(':id/addresses/:addressId')
  @RequirePermissions('vendors:delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete vendor address' })
  @ApiResponse({ status: 200, description: 'Address deleted' })
  @ApiResponse({ status: 404, description: 'Vendor or address not found' })
  async removeAddress(
    @CurrentUser('organizationId') orgId: string,
    @Param('id') vendorId: string,
    @Param('addressId') addressId: string,
  ) {
    await this.vendorsService.removeAddress(orgId, vendorId, addressId);
    return { data: { message: 'Address deleted successfully' } };
  }

  // Contact endpoints
  @Post(':id/contacts')
  @RequirePermissions('vendors:edit')
  @ApiOperation({ summary: 'Add vendor contact' })
  @ApiResponse({ status: 201, type: VendorContactResponseDto })
  @ApiResponse({ status: 404, description: 'Vendor not found' })
  async addContact(
    @CurrentUser('organizationId') orgId: string,
    @Param('id') vendorId: string,
    @Body() dto: CreateVendorContactDto,
  ) {
    const contact = await this.vendorsService.addContact(orgId, vendorId, dto);
    return { data: contact };
  }

  @Put(':id/contacts/:contactId')
  @RequirePermissions('vendors:edit')
  @ApiOperation({ summary: 'Update vendor contact' })
  @ApiResponse({ status: 200, type: VendorContactResponseDto })
  @ApiResponse({ status: 404, description: 'Vendor or contact not found' })
  async updateContact(
    @CurrentUser('organizationId') orgId: string,
    @Param('id') vendorId: string,
    @Param('contactId') contactId: string,
    @Body() dto: UpdateVendorContactDto,
  ) {
    const contact = await this.vendorsService.updateContact(
      orgId,
      vendorId,
      contactId,
      dto,
    );
    return { data: contact };
  }

  @Delete(':id/contacts/:contactId')
  @RequirePermissions('vendors:delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete vendor contact' })
  @ApiResponse({ status: 200, description: 'Contact deleted' })
  @ApiResponse({ status: 404, description: 'Vendor or contact not found' })
  async removeContact(
    @CurrentUser('organizationId') orgId: string,
    @Param('id') vendorId: string,
    @Param('contactId') contactId: string,
  ) {
    await this.vendorsService.removeContact(orgId, vendorId, contactId);
    return { data: { message: 'Contact deleted successfully' } };
  }

  // Item linking endpoints
  @Post(':id/items')
  @RequirePermissions('vendors:edit')
  @ApiOperation({ summary: 'Link item to vendor with pricing' })
  @ApiResponse({ status: 201, type: VendorItemResponseDto })
  @ApiResponse({ status: 400, description: 'Item already linked' })
  @ApiResponse({ status: 404, description: 'Vendor or item not found' })
  async linkItem(
    @CurrentUser('organizationId') orgId: string,
    @Param('id') vendorId: string,
    @Body() dto: VendorItemPricingDto,
  ) {
    const vendorItem = await this.vendorsService.linkItem(orgId, vendorId, dto);
    return { data: vendorItem };
  }

  @Put(':id/items/:itemId')
  @RequirePermissions('vendors:edit')
  @ApiOperation({ summary: 'Update vendor-item link pricing' })
  @ApiResponse({ status: 200, type: VendorItemResponseDto })
  @ApiResponse({ status: 404, description: 'Vendor or item link not found' })
  async updateItemLink(
    @CurrentUser('organizationId') orgId: string,
    @Param('id') vendorId: string,
    @Param('itemId') itemId: string,
    @Body() dto: Partial<VendorItemPricingDto>,
  ) {
    const vendorItem = await this.vendorsService.updateItemLink(
      orgId,
      vendorId,
      itemId,
      dto,
    );
    return { data: vendorItem };
  }

  @Delete(':id/items/:itemId')
  @RequirePermissions('vendors:delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unlink item from vendor' })
  @ApiResponse({ status: 200, description: 'Item unlinked' })
  @ApiResponse({ status: 404, description: 'Vendor or item link not found' })
  async unlinkItem(
    @CurrentUser('organizationId') orgId: string,
    @Param('id') vendorId: string,
    @Param('itemId') itemId: string,
  ) {
    await this.vendorsService.unlinkItem(orgId, vendorId, itemId);
    return { data: { message: 'Item unlinked successfully' } };
  }
}
