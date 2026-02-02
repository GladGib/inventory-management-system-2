import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma';
import {
  UpdateOrganizationDto,
  OrganizationResponseDto,
  CreateTaxRateDto,
  UpdateTaxRateDto,
  TaxRateResponseDto,
  UpdateNumberSequenceDto,
  NumberSequenceResponseDto,
} from './dto';

@Injectable()
export class OrganizationsService {
  constructor(private prisma: PrismaService) {}

  // Organization Profile
  async getOrganization(organizationId: string): Promise<OrganizationResponseDto> {
    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!org) {
      throw new NotFoundException('Organization not found');
    }

    return this.toOrgResponse(org);
  }

  async updateOrganization(
    organizationId: string,
    dto: UpdateOrganizationDto,
  ): Promise<OrganizationResponseDto> {
    const org = await this.prisma.organization.update({
      where: { id: organizationId },
      data: dto,
    });

    return this.toOrgResponse(org);
  }

  async updateLogo(organizationId: string, logoUrl: string): Promise<OrganizationResponseDto> {
    const org = await this.prisma.organization.update({
      where: { id: organizationId },
      data: { logo: logoUrl },
    });

    return this.toOrgResponse(org);
  }

  // Tax Rates
  async getTaxRates(organizationId: string): Promise<TaxRateResponseDto[]> {
    const taxRates = await this.prisma.taxRate.findMany({
      where: { organizationId },
      orderBy: { name: 'asc' },
    });

    return taxRates.map(this.toTaxRateResponse);
  }

  async createTaxRate(
    organizationId: string,
    dto: CreateTaxRateDto,
  ): Promise<TaxRateResponseDto> {
    // Check for duplicate name
    const existing = await this.prisma.taxRate.findUnique({
      where: {
        organizationId_name: {
          organizationId,
          name: dto.name,
        },
      },
    });

    if (existing) {
      throw new BadRequestException('Tax rate with this name already exists');
    }

    const taxRate = await this.prisma.taxRate.create({
      data: {
        organizationId,
        name: dto.name,
        rate: dto.rate,
        isActive: dto.isActive ?? true,
      },
    });

    return this.toTaxRateResponse(taxRate);
  }

  async updateTaxRate(
    organizationId: string,
    id: string,
    dto: UpdateTaxRateDto,
  ): Promise<TaxRateResponseDto> {
    const taxRate = await this.prisma.taxRate.findFirst({
      where: { id, organizationId },
    });

    if (!taxRate) {
      throw new NotFoundException('Tax rate not found');
    }

    // Check for duplicate name if changing
    if (dto.name && dto.name !== taxRate.name) {
      const existing = await this.prisma.taxRate.findUnique({
        where: {
          organizationId_name: {
            organizationId,
            name: dto.name,
          },
        },
      });

      if (existing) {
        throw new BadRequestException('Tax rate with this name already exists');
      }
    }

    const updated = await this.prisma.taxRate.update({
      where: { id },
      data: dto,
    });

    return this.toTaxRateResponse(updated);
  }

  async deleteTaxRate(organizationId: string, id: string): Promise<void> {
    const taxRate = await this.prisma.taxRate.findFirst({
      where: { id, organizationId },
    });

    if (!taxRate) {
      throw new NotFoundException('Tax rate not found');
    }

    // Check if tax rate is in use
    const itemsCount = await this.prisma.item.count({
      where: { taxRateId: id },
    });

    if (itemsCount > 0) {
      throw new BadRequestException(
        'Cannot delete tax rate that is assigned to items. Deactivate it instead.',
      );
    }

    await this.prisma.taxRate.delete({ where: { id } });
  }

  // Number Sequences
  async getNumberSequences(organizationId: string): Promise<NumberSequenceResponseDto[]> {
    const sequences = await this.prisma.numberSequence.findMany({
      where: { organizationId },
      orderBy: { documentType: 'asc' },
    });

    return sequences.map(this.toNumberSequenceResponse);
  }

  async updateNumberSequence(
    organizationId: string,
    documentType: string,
    dto: UpdateNumberSequenceDto,
  ): Promise<NumberSequenceResponseDto> {
    const sequence = await this.prisma.numberSequence.findUnique({
      where: {
        organizationId_documentType: {
          organizationId,
          documentType,
        },
      },
    });

    if (!sequence) {
      throw new NotFoundException('Number sequence not found');
    }

    const updated = await this.prisma.numberSequence.update({
      where: { id: sequence.id },
      data: dto,
    });

    return this.toNumberSequenceResponse(updated);
  }

  async getNextNumber(organizationId: string, documentType: string): Promise<string> {
    const now = new Date();
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Use transaction for atomic increment
    const result = await this.prisma.$transaction(async (tx: any) => {
      let sequence = await tx.numberSequence.findUnique({
        where: {
          organizationId_documentType: {
            organizationId,
            documentType,
          },
        },
      });

      if (!sequence) {
        // Create sequence if not exists
        sequence = await tx.numberSequence.create({
          data: {
            organizationId,
            documentType,
            prefix: documentType,
            currentNumber: 0,
            resetMonthly: true,
          },
        });
      }

      // Check if we need to reset (monthly)
      let nextNumber = sequence.currentNumber + 1;
      if (sequence.resetMonthly) {
        const lastResetMonth = sequence.lastResetDate.getMonth();
        const lastResetYear = sequence.lastResetDate.getFullYear();
        if (now.getMonth() !== lastResetMonth || now.getFullYear() !== lastResetYear) {
          nextNumber = 1;
        }
      }

      // Update sequence
      await tx.numberSequence.update({
        where: { id: sequence.id },
        data: {
          currentNumber: nextNumber,
          lastResetDate: now,
        },
      });

      return `${sequence.prefix}-${yearMonth}-${String(nextNumber).padStart(5, '0')}`;
    });

    return result;
  }

  private toOrgResponse(org: any): OrganizationResponseDto {
    return {
      id: org.id,
      name: org.name,
      logo: org.logo,
      email: org.email,
      phone: org.phone,
      address: org.address,
      city: org.city,
      state: org.state,
      postalCode: org.postalCode,
      country: org.country,
      taxRegistrationNo: org.taxRegistrationNo,
      baseCurrency: org.baseCurrency,
      fiscalYearStart: org.fiscalYearStart,
      createdAt: org.createdAt,
      updatedAt: org.updatedAt,
    };
  }

  private toTaxRateResponse(taxRate: any): TaxRateResponseDto {
    return {
      id: taxRate.id,
      name: taxRate.name,
      rate: Number(taxRate.rate),
      isActive: taxRate.isActive,
      createdAt: taxRate.createdAt,
      updatedAt: taxRate.updatedAt,
    };
  }

  private toNumberSequenceResponse(seq: any): NumberSequenceResponseDto {
    return {
      id: seq.id,
      documentType: seq.documentType,
      prefix: seq.prefix,
      currentNumber: seq.currentNumber,
      resetMonthly: seq.resetMonthly,
      lastResetDate: seq.lastResetDate,
    };
  }
}
