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
import { CustomersService } from './customers.service';
import {
  CreateCustomerDto,
  UpdateCustomerDto,
  CustomerResponseDto,
  CustomerSummaryDto,
  CreateCustomerAddressDto,
  UpdateCustomerAddressDto,
  CreateCustomerContactDto,
  UpdateCustomerContactDto,
  CustomerAddressResponseDto,
  CustomerContactResponseDto,
} from './dto';
import { CurrentUser } from '@/common/decorators';

@ApiTags('Customers')
@ApiBearerAuth()
@Controller('customers')
export class CustomersController {
  constructor(private customersService: CustomersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new customer' })
  @ApiResponse({ status: 201, type: CustomerResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async create(
    @CurrentUser('organizationId') orgId: string,
    @Body() dto: CreateCustomerDto,
  ) {
    const customer = await this.customersService.create(orgId, dto);
    return { data: customer };
  }

  @Get()
  @ApiOperation({ summary: 'List all customers' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'Customers list' })
  async findAll(
    @CurrentUser('organizationId') orgId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('isActive') isActive?: boolean,
  ) {
    return this.customersService.findAll(orgId, {
      page,
      limit,
      search,
      isActive,
    });
  }

  @Get('code/:code')
  @ApiOperation({ summary: 'Get customer by code' })
  @ApiResponse({ status: 200, type: CustomerResponseDto })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async findByCode(
    @CurrentUser('organizationId') orgId: string,
    @Param('code') code: string,
  ) {
    const customer = await this.customersService.findByCode(orgId, code);
    return { data: customer };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get customer by ID' })
  @ApiResponse({ status: 200, type: CustomerResponseDto })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async findOne(
    @CurrentUser('organizationId') orgId: string,
    @Param('id') id: string,
  ) {
    const customer = await this.customersService.findOne(orgId, id);
    return { data: customer };
  }

  @Get(':id/credit')
  @ApiOperation({ summary: 'Get customer credit information' })
  @ApiResponse({ status: 200, description: 'Credit information' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async getCreditInfo(
    @CurrentUser('organizationId') orgId: string,
    @Param('id') id: string,
  ) {
    const creditInfo = await this.customersService.getCreditInfo(orgId, id);
    return { data: creditInfo };
  }

  @Get(':id/transactions')
  @ApiOperation({ summary: 'Get customer transaction history' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'type', required: false, enum: ['invoice', 'payment', 'credit'] })
  @ApiResponse({ status: 200, description: 'Transaction history' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async getTransactionHistory(
    @CurrentUser('organizationId') orgId: string,
    @Param('id') id: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('type') type?: 'invoice' | 'payment' | 'credit',
  ) {
    return this.customersService.getTransactionHistory(orgId, id, {
      page,
      limit,
      type,
    });
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update customer' })
  @ApiResponse({ status: 200, type: CustomerResponseDto })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async update(
    @CurrentUser('organizationId') orgId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCustomerDto,
  ) {
    const customer = await this.customersService.update(orgId, id, dto);
    return { data: customer };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete customer' })
  @ApiResponse({ status: 200, description: 'Customer deleted' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async remove(
    @CurrentUser('organizationId') orgId: string,
    @Param('id') id: string,
  ) {
    await this.customersService.remove(orgId, id);
    return { data: { message: 'Customer deleted successfully' } };
  }

  // Address endpoints
  @Post(':id/addresses')
  @ApiOperation({ summary: 'Add customer address' })
  @ApiResponse({ status: 201, type: CustomerAddressResponseDto })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async addAddress(
    @CurrentUser('organizationId') orgId: string,
    @Param('id') customerId: string,
    @Body() dto: CreateCustomerAddressDto,
  ) {
    const address = await this.customersService.addAddress(orgId, customerId, dto);
    return { data: address };
  }

  @Put(':id/addresses/:addressId')
  @ApiOperation({ summary: 'Update customer address' })
  @ApiResponse({ status: 200, type: CustomerAddressResponseDto })
  @ApiResponse({ status: 404, description: 'Customer or address not found' })
  async updateAddress(
    @CurrentUser('organizationId') orgId: string,
    @Param('id') customerId: string,
    @Param('addressId') addressId: string,
    @Body() dto: UpdateCustomerAddressDto,
  ) {
    const address = await this.customersService.updateAddress(
      orgId,
      customerId,
      addressId,
      dto,
    );
    return { data: address };
  }

  @Delete(':id/addresses/:addressId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete customer address' })
  @ApiResponse({ status: 200, description: 'Address deleted' })
  @ApiResponse({ status: 404, description: 'Customer or address not found' })
  async removeAddress(
    @CurrentUser('organizationId') orgId: string,
    @Param('id') customerId: string,
    @Param('addressId') addressId: string,
  ) {
    await this.customersService.removeAddress(orgId, customerId, addressId);
    return { data: { message: 'Address deleted successfully' } };
  }

  // Contact endpoints
  @Post(':id/contacts')
  @ApiOperation({ summary: 'Add customer contact' })
  @ApiResponse({ status: 201, type: CustomerContactResponseDto })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async addContact(
    @CurrentUser('organizationId') orgId: string,
    @Param('id') customerId: string,
    @Body() dto: CreateCustomerContactDto,
  ) {
    const contact = await this.customersService.addContact(orgId, customerId, dto);
    return { data: contact };
  }

  @Put(':id/contacts/:contactId')
  @ApiOperation({ summary: 'Update customer contact' })
  @ApiResponse({ status: 200, type: CustomerContactResponseDto })
  @ApiResponse({ status: 404, description: 'Customer or contact not found' })
  async updateContact(
    @CurrentUser('organizationId') orgId: string,
    @Param('id') customerId: string,
    @Param('contactId') contactId: string,
    @Body() dto: UpdateCustomerContactDto,
  ) {
    const contact = await this.customersService.updateContact(
      orgId,
      customerId,
      contactId,
      dto,
    );
    return { data: contact };
  }

  @Delete(':id/contacts/:contactId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete customer contact' })
  @ApiResponse({ status: 200, description: 'Contact deleted' })
  @ApiResponse({ status: 404, description: 'Customer or contact not found' })
  async removeContact(
    @CurrentUser('organizationId') orgId: string,
    @Param('id') customerId: string,
    @Param('contactId') contactId: string,
  ) {
    await this.customersService.removeContact(orgId, customerId, contactId);
    return { data: { message: 'Contact deleted successfully' } };
  }
}
