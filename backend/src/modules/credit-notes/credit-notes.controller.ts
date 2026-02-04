import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiProduces,
} from '@nestjs/swagger';
import { Response } from 'express';
import { CurrentUser } from '@/common/decorators';
import { PdfService } from '@/common/pdf';
import { CreditNotesService } from './credit-notes.service';
import {
  CreateCreditNoteDto,
  UpdateCreditNoteDto,
  ApplyCreditNoteDto,
  RefundCreditNoteDto,
  CreditNoteQueryDto,
  CreditNoteResponseDto,
} from './dto/credit-note.dto';

@ApiTags('Credit Notes')
@ApiBearerAuth()
@Controller('credit-notes')
export class CreditNotesController {
  constructor(
    private readonly creditNotesService: CreditNotesService,
    private readonly pdfService: PdfService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a credit note' })
  @ApiResponse({ status: 201, type: CreditNoteResponseDto })
  async create(
    @CurrentUser('organizationId') organizationId: string,
    @Body() dto: CreateCreditNoteDto,
  ) {
    const creditNote = await this.creditNotesService.create(organizationId, dto);
    return { data: creditNote };
  }

  @Post('from-return/:returnId')
  @ApiOperation({ summary: 'Create credit note from sales return' })
  @ApiResponse({ status: 201, type: CreditNoteResponseDto })
  async createFromReturn(
    @CurrentUser('organizationId') organizationId: string,
    @Param('returnId') returnId: string,
  ) {
    const creditNote = await this.creditNotesService.createFromReturn(
      organizationId,
      returnId,
    );
    return { data: creditNote };
  }

  @Get()
  @ApiOperation({ summary: 'Get all credit notes' })
  @ApiResponse({ status: 200, description: 'List of credit notes' })
  async findAll(
    @CurrentUser('organizationId') organizationId: string,
    @Query() query: CreditNoteQueryDto,
  ) {
    return this.creditNotesService.findAll(organizationId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get credit note by ID' })
  @ApiResponse({ status: 200, type: CreditNoteResponseDto })
  @ApiResponse({ status: 404, description: 'Credit note not found' })
  async findOne(
    @CurrentUser('organizationId') organizationId: string,
    @Param('id') id: string,
  ) {
    const creditNote = await this.creditNotesService.findOne(organizationId, id);
    return { data: creditNote };
  }

  @Get(':id/pdf')
  @ApiOperation({ summary: 'Download credit note as PDF' })
  @ApiProduces('application/pdf')
  @ApiResponse({ status: 200, description: 'PDF file' })
  @ApiResponse({ status: 404, description: 'Credit note not found' })
  async downloadPdf(
    @CurrentUser('organizationId') organizationId: string,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const creditNoteData = await this.creditNotesService.getCreditNoteForPdf(
      organizationId,
      id,
    );
    const pdfBuffer = await this.pdfService.generateCreditNotePdf(creditNoteData);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="CN-${creditNoteData.creditNoteNumber}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });

    res.send(pdfBuffer);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update credit note' })
  @ApiResponse({ status: 200, type: CreditNoteResponseDto })
  @ApiResponse({ status: 400, description: 'Can only update draft credit notes' })
  @ApiResponse({ status: 404, description: 'Credit note not found' })
  async update(
    @CurrentUser('organizationId') organizationId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCreditNoteDto,
  ) {
    const creditNote = await this.creditNotesService.update(organizationId, id, dto);
    return { data: creditNote };
  }

  @Post(':id/issue')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Issue credit note' })
  @ApiResponse({ status: 200, type: CreditNoteResponseDto })
  @ApiResponse({ status: 400, description: 'Can only issue draft credit notes' })
  @ApiResponse({ status: 404, description: 'Credit note not found' })
  async issue(
    @CurrentUser('organizationId') organizationId: string,
    @Param('id') id: string,
  ) {
    const creditNote = await this.creditNotesService.issue(organizationId, id);
    return { data: creditNote };
  }

  @Post(':id/void')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Void credit note' })
  @ApiResponse({ status: 200, type: CreditNoteResponseDto })
  @ApiResponse({ status: 400, description: 'Cannot void applied credit notes' })
  @ApiResponse({ status: 404, description: 'Credit note not found' })
  async void(
    @CurrentUser('organizationId') organizationId: string,
    @Param('id') id: string,
  ) {
    const creditNote = await this.creditNotesService.void(organizationId, id);
    return { data: creditNote };
  }

  @Post(':id/apply')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Apply credit note to invoice' })
  @ApiResponse({ status: 200, type: CreditNoteResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid application' })
  @ApiResponse({ status: 404, description: 'Credit note or invoice not found' })
  async applyToInvoice(
    @CurrentUser('organizationId') organizationId: string,
    @Param('id') id: string,
    @Body() dto: ApplyCreditNoteDto,
  ) {
    const creditNote = await this.creditNotesService.applyToInvoice(
      organizationId,
      id,
      dto,
    );
    return { data: creditNote };
  }

  @Post(':id/refund')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Record refund for credit note' })
  @ApiResponse({ status: 200, type: CreditNoteResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid refund' })
  @ApiResponse({ status: 404, description: 'Credit note not found' })
  async refund(
    @CurrentUser('organizationId') organizationId: string,
    @Param('id') id: string,
    @Body() dto: RefundCreditNoteDto,
  ) {
    const creditNote = await this.creditNotesService.refund(
      organizationId,
      id,
      dto,
    );
    return { data: creditNote };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete credit note' })
  @ApiResponse({ status: 204, description: 'Credit note deleted' })
  @ApiResponse({ status: 400, description: 'Can only delete draft credit notes' })
  @ApiResponse({ status: 404, description: 'Credit note not found' })
  async delete(
    @CurrentUser('organizationId') organizationId: string,
    @Param('id') id: string,
  ) {
    await this.creditNotesService.delete(organizationId, id);
  }
}
