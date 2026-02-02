import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/common/prisma';
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

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  async create(organizationId: string, dto: CreateCustomerDto): Promise<CustomerResponseDto> {
    let code = dto.code;
    if (!code) {
      code = await this.generateCustomerCode(organizationId);
    }

    const existing = await this.prisma.customer.findUnique({
      where: {
        organizationId_code: { organizationId, code },
      },
    });

    if (existing) {
      throw new BadRequestException('Customer code already exists');
    }

    const customer = await this.prisma.customer.create({
      data: {
        organizationId,
        code,
        companyName: dto.name,
        contactPerson: dto.displayName || dto.name,
        phone: dto.phone,
        email: dto.email,
        taxRegistrationNo: dto.taxId,
        paymentTerms: dto.paymentTerms ? String(dto.paymentTerms) : 'Net 30',
        creditLimit: dto.creditLimit || 0,
        notes: dto.notes,
        isActive: dto.isActive ?? true,
        addresses: dto.addresses?.length
          ? {
              create: dto.addresses.map((addr) => ({
                label: addr.label,
                addressLine1: addr.addressLine1,
                addressLine2: addr.addressLine2,
                city: addr.city,
                state: addr.state,
                postalCode: addr.postalCode,
                country: addr.country || 'Malaysia',
                isDefaultBilling: addr.isDefault ?? false,
                isDefaultShipping: addr.isDefault ?? false,
              })),
            }
          : undefined,
        contacts: dto.contacts?.length
          ? {
              create: dto.contacts.map((contact) => ({
                name: contact.name,
                role: contact.designation,
                phone: contact.phone,
                email: contact.email,
                isPrimary: contact.isPrimary ?? false,
              })),
            }
          : undefined,
      },
      include: {
        addresses: true,
        contacts: true,
      },
    });

    return this.toCustomerResponse(customer);
  }

  async findAll(
    organizationId: string,
    options?: {
      page?: number;
      limit?: number;
      search?: string;
      isActive?: boolean;
    },
  ) {
    const page = options?.page || 1;
    const limit = Math.min(options?.limit || 20, 100);
    const skip = (page - 1) * limit;

    const where: any = {
      organizationId,
      deletedAt: null,
    };

    if (options?.search) {
      where.OR = [
        { code: { contains: options.search, mode: 'insensitive' } },
        { companyName: { contains: options.search, mode: 'insensitive' } },
        { contactPerson: { contains: options.search, mode: 'insensitive' } },
        { email: { contains: options.search, mode: 'insensitive' } },
        { phone: { contains: options.search, mode: 'insensitive' } },
      ];
    }

    if (options?.isActive !== undefined) {
      where.isActive = options.isActive;
    }

    const [customers, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { companyName: 'asc' },
      }),
      this.prisma.customer.count({ where }),
    ]);

    return {
      data: customers.map((c: any) => this.toCustomerSummary(c)),
      meta: { total, page, limit },
    };
  }

  async findOne(organizationId: string, id: string): Promise<CustomerResponseDto> {
    const customer = await this.prisma.customer.findFirst({
      where: { id, organizationId, deletedAt: null },
      include: {
        addresses: true,
        contacts: true,
      },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    return this.toCustomerResponse(customer);
  }

  async findByCode(organizationId: string, code: string): Promise<CustomerResponseDto> {
    const customer = await this.prisma.customer.findFirst({
      where: { organizationId, code, deletedAt: null },
      include: {
        addresses: true,
        contacts: true,
      },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    return this.toCustomerResponse(customer);
  }

  async update(
    organizationId: string,
    id: string,
    dto: UpdateCustomerDto,
  ): Promise<CustomerResponseDto> {
    const customer = await this.prisma.customer.findFirst({
      where: { id, organizationId, deletedAt: null },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    const updateData: any = { ...dto };
    if (dto.paymentTerms !== undefined) {
      updateData.paymentTerms = String(dto.paymentTerms);
    }
    if (dto.name !== undefined) {
      updateData.companyName = dto.name;
      delete updateData.name;
    }
    if (dto.displayName !== undefined) {
      updateData.contactPerson = dto.displayName;
      delete updateData.displayName;
    }
    if (dto.taxId !== undefined) {
      updateData.taxRegistrationNo = dto.taxId;
      delete updateData.taxId;
    }

    const updated = await this.prisma.customer.update({
      where: { id },
      data: updateData,
      include: {
        addresses: true,
        contacts: true,
      },
    });

    return this.toCustomerResponse(updated);
  }

  async remove(organizationId: string, id: string): Promise<void> {
    const customer = await this.prisma.customer.findFirst({
      where: { id, organizationId, deletedAt: null },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    await this.prisma.customer.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }

  // Address management
  async addAddress(
    organizationId: string,
    customerId: string,
    dto: CreateCustomerAddressDto,
  ): Promise<CustomerAddressResponseDto> {
    const customer = await this.prisma.customer.findFirst({
      where: { id: customerId, organizationId, deletedAt: null },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    if (dto.isDefault) {
      await this.prisma.customerAddress.updateMany({
        where: { customerId },
        data: { isDefaultBilling: false, isDefaultShipping: false },
      });
    }

    const address = await this.prisma.customerAddress.create({
      data: {
        customerId,
        label: dto.label,
        addressLine1: dto.addressLine1,
        addressLine2: dto.addressLine2,
        city: dto.city,
        state: dto.state,
        postalCode: dto.postalCode,
        country: dto.country || 'Malaysia',
        isDefaultBilling: dto.isDefault ?? false,
        isDefaultShipping: dto.isDefault ?? false,
      },
    });

    return this.toAddressResponse(address);
  }

  async updateAddress(
    organizationId: string,
    customerId: string,
    addressId: string,
    dto: UpdateCustomerAddressDto,
  ): Promise<CustomerAddressResponseDto> {
    const customer = await this.prisma.customer.findFirst({
      where: { id: customerId, organizationId, deletedAt: null },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    const address = await this.prisma.customerAddress.findFirst({
      where: { id: addressId, customerId },
    });

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    if (dto.isDefault) {
      await this.prisma.customerAddress.updateMany({
        where: { customerId, id: { not: addressId } },
        data: { isDefaultBilling: false, isDefaultShipping: false },
      });
    }

    const updateData: any = { ...dto };
    if (dto.isDefault !== undefined) {
      updateData.isDefaultBilling = dto.isDefault;
      updateData.isDefaultShipping = dto.isDefault;
      delete updateData.isDefault;
    }

    const updated = await this.prisma.customerAddress.update({
      where: { id: addressId },
      data: updateData,
    });

    return this.toAddressResponse(updated);
  }

  async removeAddress(
    organizationId: string,
    customerId: string,
    addressId: string,
  ): Promise<void> {
    const customer = await this.prisma.customer.findFirst({
      where: { id: customerId, organizationId, deletedAt: null },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    const address = await this.prisma.customerAddress.findFirst({
      where: { id: addressId, customerId },
    });

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    await this.prisma.customerAddress.delete({
      where: { id: addressId },
    });
  }

  // Contact management
  async addContact(
    organizationId: string,
    customerId: string,
    dto: CreateCustomerContactDto,
  ): Promise<CustomerContactResponseDto> {
    const customer = await this.prisma.customer.findFirst({
      where: { id: customerId, organizationId, deletedAt: null },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    if (dto.isPrimary) {
      await this.prisma.customerContact.updateMany({
        where: { customerId },
        data: { isPrimary: false },
      });
    }

    const contact = await this.prisma.customerContact.create({
      data: {
        customerId,
        name: dto.name,
        role: dto.designation,
        phone: dto.phone,
        email: dto.email,
        isPrimary: dto.isPrimary ?? false,
      },
    });

    return this.toContactResponse(contact);
  }

  async updateContact(
    organizationId: string,
    customerId: string,
    contactId: string,
    dto: UpdateCustomerContactDto,
  ): Promise<CustomerContactResponseDto> {
    const customer = await this.prisma.customer.findFirst({
      where: { id: customerId, organizationId, deletedAt: null },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    const contact = await this.prisma.customerContact.findFirst({
      where: { id: contactId, customerId },
    });

    if (!contact) {
      throw new NotFoundException('Contact not found');
    }

    if (dto.isPrimary) {
      await this.prisma.customerContact.updateMany({
        where: { customerId, id: { not: contactId } },
        data: { isPrimary: false },
      });
    }

    const updateData: any = { ...dto };
    if (dto.designation !== undefined) {
      updateData.role = dto.designation;
      delete updateData.designation;
    }

    const updated = await this.prisma.customerContact.update({
      where: { id: contactId },
      data: updateData,
    });

    return this.toContactResponse(updated);
  }

  async removeContact(
    organizationId: string,
    customerId: string,
    contactId: string,
  ): Promise<void> {
    const customer = await this.prisma.customer.findFirst({
      where: { id: customerId, organizationId, deletedAt: null },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    const contact = await this.prisma.customerContact.findFirst({
      where: { id: contactId, customerId },
    });

    if (!contact) {
      throw new NotFoundException('Contact not found');
    }

    await this.prisma.customerContact.delete({
      where: { id: contactId },
    });
  }

  // Transaction history
  async getTransactionHistory(
    organizationId: string,
    customerId: string,
    options?: {
      page?: number;
      limit?: number;
      type?: 'invoice' | 'payment' | 'credit';
    },
  ) {
    const customer = await this.prisma.customer.findFirst({
      where: { id: customerId, organizationId, deletedAt: null },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    const page = options?.page || 1;
    const limit = Math.min(options?.limit || 20, 100);
    const skip = (page - 1) * limit;

    const transactions: any[] = [];

    if (!options?.type || options.type === 'invoice') {
      const invoices = await this.prisma.invoice.findMany({
        where: { customerId },
        select: {
          id: true,
          invoiceNumber: true,
          invoiceDate: true,
          dueDate: true,
          total: true,
          amountPaid: true,
          status: true,
        },
        orderBy: { invoiceDate: 'desc' },
      });

      invoices.forEach((inv: any) => {
        transactions.push({
          type: 'invoice',
          id: inv.id,
          number: inv.invoiceNumber,
          date: inv.invoiceDate,
          amount: Number(inv.total),
          balance: Number(inv.total) - Number(inv.amountPaid),
          status: inv.status,
        });
      });
    }

    if (!options?.type || options.type === 'payment') {
      const payments = await this.prisma.paymentReceived.findMany({
        where: { customerId },
        select: {
          id: true,
          paymentNumber: true,
          paymentDate: true,
          amount: true,
          paymentMethod: true,
        },
        orderBy: { paymentDate: 'desc' },
      });

      payments.forEach((pmt: any) => {
        transactions.push({
          type: 'payment',
          id: pmt.id,
          number: pmt.paymentNumber,
          date: pmt.paymentDate,
          amount: Number(pmt.amount),
          method: pmt.paymentMethod,
        });
      });
    }

    transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const total = transactions.length;
    const paginatedTransactions = transactions.slice(skip, skip + limit);

    return {
      data: paginatedTransactions,
      meta: { total, page, limit },
    };
  }

  // Credit tracking
  async getCreditInfo(organizationId: string, customerId: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id: customerId, organizationId, deletedAt: null },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    const outstandingInvoices = await this.prisma.invoice.aggregate({
      where: {
        customerId,
        status: { in: ['SENT', 'PARTIALLY_PAID', 'OVERDUE'] },
      },
      _sum: {
        total: true,
        amountPaid: true,
      },
    });

    const totalOutstanding =
      Number(outstandingInvoices._sum.total || 0) -
      Number(outstandingInvoices._sum.amountPaid || 0);

    return {
      customerId: customer.id,
      customerCode: customer.code,
      customerName: customer.companyName,
      creditLimit: Number(customer.creditLimit),
      currentBalance: totalOutstanding,
      totalOutstanding,
      availableCredit: Number(customer.creditLimit) - totalOutstanding,
    };
  }

  // Helpers
  private async generateCustomerCode(organizationId: string): Promise<string> {
    const lastCustomer = await this.prisma.customer.findFirst({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });

    let nextNum = 1;
    if (lastCustomer && lastCustomer.code.startsWith('CUST-')) {
      const num = parseInt(lastCustomer.code.replace('CUST-', ''), 10);
      if (!isNaN(num)) {
        nextNum = num + 1;
      }
    }

    return `CUST-${String(nextNum).padStart(5, '0')}`;
  }

  private toCustomerResponse(customer: any): CustomerResponseDto {
    return {
      id: customer.id,
      code: customer.code,
      name: customer.companyName,
      displayName: customer.contactPerson,
      phone: customer.phone,
      email: customer.email,
      taxId: customer.taxRegistrationNo,
      paymentTerms: customer.paymentTerms,
      creditLimit: Number(customer.creditLimit),
      balance: 0,
      notes: customer.notes,
      isActive: customer.isActive,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
      addresses: customer.addresses?.map((a: any) => this.toAddressResponse(a)),
      contacts: customer.contacts?.map((c: any) => this.toContactResponse(c)),
    };
  }

  private toCustomerSummary(customer: any): CustomerSummaryDto {
    return {
      id: customer.id,
      code: customer.code,
      name: customer.companyName,
      displayName: customer.contactPerson,
      phone: customer.phone,
      email: customer.email,
      balance: 0,
      isActive: customer.isActive,
    };
  }

  private toAddressResponse(address: any): CustomerAddressResponseDto {
    return {
      id: address.id,
      label: address.label,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country,
      isDefault: address.isDefaultBilling || address.isDefaultShipping,
    };
  }

  private toContactResponse(contact: any): CustomerContactResponseDto {
    return {
      id: contact.id,
      name: contact.name,
      designation: contact.role,
      phone: contact.phone,
      email: contact.email,
      isPrimary: contact.isPrimary,
    };
  }
}
