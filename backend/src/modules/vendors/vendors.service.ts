import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/common/prisma';
import {
  CreateVendorDto,
  UpdateVendorDto,
  VendorResponseDto,
  VendorSummaryDto,
  CreateVendorAddressDto,
  UpdateVendorAddressDto,
  CreateVendorContactDto,
  UpdateVendorContactDto,
  VendorAddressResponseDto,
  VendorContactResponseDto,
  VendorItemPricingDto,
  VendorItemResponseDto,
} from './dto';

@Injectable()
export class VendorsService {
  constructor(private prisma: PrismaService) {}

  async create(organizationId: string, dto: CreateVendorDto): Promise<VendorResponseDto> {
    let code = dto.code;
    if (!code) {
      code = await this.generateVendorCode(organizationId);
    }

    const existing = await this.prisma.vendor.findUnique({
      where: {
        organizationId_code: { organizationId, code },
      },
    });

    if (existing) {
      throw new BadRequestException('Vendor code already exists');
    }

    const vendor = await this.prisma.vendor.create({
      data: {
        organizationId,
        code,
        companyName: dto.name,
        contactPerson: dto.displayName || dto.name,
        phone: dto.phone,
        email: dto.email,
        taxRegistrationNo: dto.taxId,
        paymentTerms: dto.paymentTerms ? String(dto.paymentTerms) : undefined,
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
                isDefault: addr.isDefault ?? false,
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

    return this.toVendorResponse(vendor);
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

    const [vendors, total] = await Promise.all([
      this.prisma.vendor.findMany({
        where,
        skip,
        take: limit,
        orderBy: { companyName: 'asc' },
      }),
      this.prisma.vendor.count({ where }),
    ]);

    return {
      data: vendors.map((v: any) => this.toVendorSummary(v)),
      meta: { total, page, limit },
    };
  }

  async findOne(organizationId: string, id: string): Promise<VendorResponseDto> {
    const vendor = await this.prisma.vendor.findFirst({
      where: { id, organizationId, deletedAt: null },
      include: {
        addresses: true,
        contacts: true,
      },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    return this.toVendorResponse(vendor);
  }

  async findByCode(organizationId: string, code: string): Promise<VendorResponseDto> {
    const vendor = await this.prisma.vendor.findFirst({
      where: { organizationId, code, deletedAt: null },
      include: {
        addresses: true,
        contacts: true,
      },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    return this.toVendorResponse(vendor);
  }

  async update(
    organizationId: string,
    id: string,
    dto: UpdateVendorDto,
  ): Promise<VendorResponseDto> {
    const vendor = await this.prisma.vendor.findFirst({
      where: { id, organizationId, deletedAt: null },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    const updateData: any = {};
    if (dto.name !== undefined) updateData.companyName = dto.name;
    if (dto.displayName !== undefined) updateData.contactPerson = dto.displayName;
    if (dto.phone !== undefined) updateData.phone = dto.phone;
    if (dto.email !== undefined) updateData.email = dto.email;
    if (dto.taxId !== undefined) updateData.taxRegistrationNo = dto.taxId;
    if (dto.paymentTerms !== undefined) updateData.paymentTerms = String(dto.paymentTerms);
    if (dto.notes !== undefined) updateData.notes = dto.notes;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;

    const updated = await this.prisma.vendor.update({
      where: { id },
      data: updateData,
      include: {
        addresses: true,
        contacts: true,
      },
    });

    return this.toVendorResponse(updated);
  }

  async remove(organizationId: string, id: string): Promise<void> {
    const vendor = await this.prisma.vendor.findFirst({
      where: { id, organizationId, deletedAt: null },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    await this.prisma.vendor.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }

  // Address management
  async addAddress(
    organizationId: string,
    vendorId: string,
    dto: CreateVendorAddressDto,
  ): Promise<VendorAddressResponseDto> {
    const vendor = await this.prisma.vendor.findFirst({
      where: { id: vendorId, organizationId, deletedAt: null },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    if (dto.isDefault) {
      await this.prisma.vendorAddress.updateMany({
        where: { vendorId },
        data: { isDefault: false },
      });
    }

    const address = await this.prisma.vendorAddress.create({
      data: {
        vendorId,
        label: dto.label,
        addressLine1: dto.addressLine1,
        addressLine2: dto.addressLine2,
        city: dto.city,
        state: dto.state,
        postalCode: dto.postalCode,
        country: dto.country || 'Malaysia',
        isDefault: dto.isDefault ?? false,
      },
    });

    return this.toAddressResponse(address);
  }

  async updateAddress(
    organizationId: string,
    vendorId: string,
    addressId: string,
    dto: UpdateVendorAddressDto,
  ): Promise<VendorAddressResponseDto> {
    const vendor = await this.prisma.vendor.findFirst({
      where: { id: vendorId, organizationId, deletedAt: null },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    const address = await this.prisma.vendorAddress.findFirst({
      where: { id: addressId, vendorId },
    });

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    if (dto.isDefault) {
      await this.prisma.vendorAddress.updateMany({
        where: { vendorId, id: { not: addressId } },
        data: { isDefault: false },
      });
    }

    const updated = await this.prisma.vendorAddress.update({
      where: { id: addressId },
      data: dto,
    });

    return this.toAddressResponse(updated);
  }

  async removeAddress(
    organizationId: string,
    vendorId: string,
    addressId: string,
  ): Promise<void> {
    const vendor = await this.prisma.vendor.findFirst({
      where: { id: vendorId, organizationId, deletedAt: null },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    const address = await this.prisma.vendorAddress.findFirst({
      where: { id: addressId, vendorId },
    });

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    await this.prisma.vendorAddress.delete({
      where: { id: addressId },
    });
  }

  // Contact management
  async addContact(
    organizationId: string,
    vendorId: string,
    dto: CreateVendorContactDto,
  ): Promise<VendorContactResponseDto> {
    const vendor = await this.prisma.vendor.findFirst({
      where: { id: vendorId, organizationId, deletedAt: null },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    if (dto.isPrimary) {
      await this.prisma.vendorContact.updateMany({
        where: { vendorId },
        data: { isPrimary: false },
      });
    }

    const contact = await this.prisma.vendorContact.create({
      data: {
        vendorId,
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
    vendorId: string,
    contactId: string,
    dto: UpdateVendorContactDto,
  ): Promise<VendorContactResponseDto> {
    const vendor = await this.prisma.vendor.findFirst({
      where: { id: vendorId, organizationId, deletedAt: null },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    const contact = await this.prisma.vendorContact.findFirst({
      where: { id: contactId, vendorId },
    });

    if (!contact) {
      throw new NotFoundException('Contact not found');
    }

    if (dto.isPrimary) {
      await this.prisma.vendorContact.updateMany({
        where: { vendorId, id: { not: contactId } },
        data: { isPrimary: false },
      });
    }

    const updated = await this.prisma.vendorContact.update({
      where: { id: contactId },
      data: dto,
    });

    return this.toContactResponse(updated);
  }

  async removeContact(
    organizationId: string,
    vendorId: string,
    contactId: string,
  ): Promise<void> {
    const vendor = await this.prisma.vendor.findFirst({
      where: { id: vendorId, organizationId, deletedAt: null },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    const contact = await this.prisma.vendorContact.findFirst({
      where: { id: contactId, vendorId },
    });

    if (!contact) {
      throw new NotFoundException('Contact not found');
    }

    await this.prisma.vendorContact.delete({
      where: { id: contactId },
    });
  }

  // Vendor-Item linking
  async linkItem(
    organizationId: string,
    vendorId: string,
    dto: VendorItemPricingDto,
  ): Promise<VendorItemResponseDto> {
    const vendor = await this.prisma.vendor.findFirst({
      where: { id: vendorId, organizationId, deletedAt: null },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    const item = await this.prisma.item.findFirst({
      where: { id: dto.itemId, organizationId, deletedAt: null },
    });

    if (!item) {
      throw new NotFoundException('Item not found');
    }

    // Check if link already exists
    const existingLink = await this.prisma.vendorItem.findUnique({
      where: {
        vendorId_itemId: { vendorId, itemId: dto.itemId },
      },
    });

    if (existingLink) {
      throw new BadRequestException('Item is already linked to this vendor');
    }

    // If setting as preferred, unset other vendors for this item
    if (dto.isPreferred) {
      await this.prisma.vendorItem.updateMany({
        where: { itemId: dto.itemId },
        data: { isPreferred: false },
      });
    }

    const vendorItem = await this.prisma.vendorItem.create({
      data: {
        vendorId,
        itemId: dto.itemId,
        vendorSku: dto.vendorPartNumber,
        price: dto.unitCost,
        leadTimeDays: dto.leadTimeDays,
        isPreferred: dto.isPreferred ?? false,
      },
      include: {
        item: true,
      },
    });

    return this.toVendorItemResponse(vendorItem);
  }

  async updateItemLink(
    organizationId: string,
    vendorId: string,
    itemId: string,
    dto: Partial<VendorItemPricingDto>,
  ): Promise<VendorItemResponseDto> {
    const vendor = await this.prisma.vendor.findFirst({
      where: { id: vendorId, organizationId, deletedAt: null },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    const vendorItem = await this.prisma.vendorItem.findUnique({
      where: {
        vendorId_itemId: { vendorId, itemId },
      },
    });

    if (!vendorItem) {
      throw new NotFoundException('Item link not found');
    }

    if (dto.isPreferred) {
      await this.prisma.vendorItem.updateMany({
        where: { itemId, vendorId: { not: vendorId } },
        data: { isPreferred: false },
      });
    }

    const updated = await this.prisma.vendorItem.update({
      where: {
        vendorId_itemId: { vendorId, itemId },
      },
      data: {
        vendorSku: dto.vendorPartNumber,
        price: dto.unitCost,
        leadTimeDays: dto.leadTimeDays,
        isPreferred: dto.isPreferred,
      },
      include: {
        item: true,
      },
    });

    return this.toVendorItemResponse(updated);
  }

  async unlinkItem(
    organizationId: string,
    vendorId: string,
    itemId: string,
  ): Promise<void> {
    const vendor = await this.prisma.vendor.findFirst({
      where: { id: vendorId, organizationId, deletedAt: null },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    const vendorItem = await this.prisma.vendorItem.findUnique({
      where: {
        vendorId_itemId: { vendorId, itemId },
      },
    });

    if (!vendorItem) {
      throw new NotFoundException('Item link not found');
    }

    await this.prisma.vendorItem.delete({
      where: {
        vendorId_itemId: { vendorId, itemId },
      },
    });
  }

  async getVendorItems(
    organizationId: string,
    vendorId: string,
    options?: {
      page?: number;
      limit?: number;
    },
  ) {
    const vendor = await this.prisma.vendor.findFirst({
      where: { id: vendorId, organizationId, deletedAt: null },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    const page = options?.page || 1;
    const limit = Math.min(options?.limit || 20, 100);
    const skip = (page - 1) * limit;

    const [vendorItems, total] = await Promise.all([
      this.prisma.vendorItem.findMany({
        where: { vendorId },
        include: { item: true },
        skip,
        take: limit,
        orderBy: { item: { name: 'asc' } },
      }),
      this.prisma.vendorItem.count({ where: { vendorId } }),
    ]);

    return {
      data: vendorItems.map((vi: any) => this.toVendorItemResponse(vi)),
      meta: { total, page, limit },
    };
  }

  // Transaction history
  async getTransactionHistory(
    organizationId: string,
    vendorId: string,
    options?: {
      page?: number;
      limit?: number;
      type?: 'bill' | 'payment';
    },
  ) {
    const vendor = await this.prisma.vendor.findFirst({
      where: { id: vendorId, organizationId, deletedAt: null },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    const page = options?.page || 1;
    const limit = Math.min(options?.limit || 20, 100);
    const skip = (page - 1) * limit;

    const transactions: any[] = [];

    if (!options?.type || options.type === 'bill') {
      const bills = await this.prisma.purchaseBill.findMany({
        where: { vendorId },
        select: {
          id: true,
          billNumber: true,
          billDate: true,
          dueDate: true,
          total: true,
          amountPaid: true,
          status: true,
        },
        orderBy: { billDate: 'desc' },
      });

      bills.forEach((bill: any) => {
        transactions.push({
          type: 'bill',
          id: bill.id,
          number: bill.billNumber,
          date: bill.billDate,
          amount: Number(bill.total),
          balance: Number(bill.total) - Number(bill.amountPaid),
          status: bill.status,
        });
      });
    }

    if (!options?.type || options.type === 'payment') {
      const payments = await this.prisma.paymentMade.findMany({
        where: { vendorId },
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

  // Helpers
  private async generateVendorCode(organizationId: string): Promise<string> {
    const lastVendor = await this.prisma.vendor.findFirst({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });

    let nextNum = 1;
    if (lastVendor && lastVendor.code.startsWith('VEND-')) {
      const num = parseInt(lastVendor.code.replace('VEND-', ''), 10);
      if (!isNaN(num)) {
        nextNum = num + 1;
      }
    }

    return `VEND-${String(nextNum).padStart(5, '0')}`;
  }

  private toVendorResponse(vendor: any): VendorResponseDto {
    return {
      id: vendor.id,
      code: vendor.code,
      name: vendor.companyName,
      displayName: vendor.contactPerson,
      phone: vendor.phone,
      email: vendor.email,
      taxId: vendor.taxRegistrationNo,
      paymentTerms: vendor.paymentTerms,
      balance: 0, // Vendor has no balance field in schema
      notes: vendor.notes,
      isActive: vendor.isActive,
      createdAt: vendor.createdAt,
      updatedAt: vendor.updatedAt,
      addresses: vendor.addresses?.map((a: any) => this.toAddressResponse(a)),
      contacts: vendor.contacts?.map((c: any) => this.toContactResponse(c)),
    };
  }

  private toVendorSummary(vendor: any): VendorSummaryDto {
    return {
      id: vendor.id,
      code: vendor.code,
      name: vendor.companyName,
      displayName: vendor.contactPerson,
      phone: vendor.phone,
      email: vendor.email,
      balance: 0, // Vendor has no balance field in schema
      isActive: vendor.isActive,
    };
  }

  private toAddressResponse(address: any): VendorAddressResponseDto {
    return {
      id: address.id,
      label: address.label,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country,
      isDefault: address.isDefault,
    };
  }

  private toContactResponse(contact: any): VendorContactResponseDto {
    return {
      id: contact.id,
      name: contact.name,
      designation: contact.role,
      phone: contact.phone,
      email: contact.email,
      isPrimary: contact.isPrimary,
    };
  }

  private toVendorItemResponse(vendorItem: any): VendorItemResponseDto {
    return {
      id: vendorItem.id,
      itemId: vendorItem.itemId,
      itemCode: vendorItem.item.code,
      itemName: vendorItem.item.name,
      vendorPartNumber: vendorItem.vendorSku,
      unitCost: Number(vendorItem.price),
      minOrderQty: 1, // VendorItem has no minOrderQty field in schema
      leadTimeDays: vendorItem.leadTimeDays,
      isPreferred: vendorItem.isPreferred,
    };
  }
}
