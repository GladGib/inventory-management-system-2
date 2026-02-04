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
import { ItemsService } from './items.service';
import { VariantsService } from './variants.service';
import {
  CreateItemDto,
  UpdateItemDto,
  ItemResponseDto,
  ItemStockResponseDto,
  CreateCategoryDto,
  UpdateCategoryDto,
  CategoryResponseDto,
  CreateVariantsDto,
  UpdateVariantDto,
  ItemWithVariantsResponseDto,
  VariantResponseDto,
} from './dto';
import { CurrentUser } from '@/common/decorators';

@ApiTags('Items')
@ApiBearerAuth()
@Controller('items')
export class ItemsController {
  constructor(
    private itemsService: ItemsService,
    private variantsService: VariantsService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new item' })
  @ApiResponse({ status: 201, type: ItemResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async create(
    @CurrentUser('organizationId') orgId: string,
    @Body() dto: CreateItemDto,
  ) {
    const item = await this.itemsService.create(orgId, dto);
    return { data: item };
  }

  @Get()
  @ApiOperation({ summary: 'List all items' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'categoryId', required: false, type: String })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({ name: 'type', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Items list' })
  async findAll(
    @CurrentUser('organizationId') orgId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('categoryId') categoryId?: string,
    @Query('isActive') isActive?: boolean,
    @Query('type') type?: string,
  ) {
    return this.itemsService.findAll(orgId, {
      page,
      limit,
      search,
      categoryId,
      isActive,
      type,
    });
  }

  @Get('barcode/:barcode')
  @ApiOperation({ summary: 'Get item by barcode' })
  @ApiResponse({ status: 200, type: ItemResponseDto })
  @ApiResponse({ status: 404, description: 'Item not found' })
  async findByBarcode(
    @CurrentUser('organizationId') orgId: string,
    @Param('barcode') barcode: string,
  ) {
    const item = await this.itemsService.findByBarcode(orgId, barcode);
    return { data: item };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get item by ID' })
  @ApiResponse({ status: 200, type: ItemResponseDto })
  @ApiResponse({ status: 404, description: 'Item not found' })
  async findOne(
    @CurrentUser('organizationId') orgId: string,
    @Param('id') id: string,
  ) {
    const item = await this.itemsService.findOne(orgId, id);
    return { data: item };
  }

  @Get(':id/stock')
  @ApiOperation({ summary: 'Get item stock levels' })
  @ApiResponse({ status: 200, type: ItemStockResponseDto })
  @ApiResponse({ status: 404, description: 'Item not found' })
  async getStock(
    @CurrentUser('organizationId') orgId: string,
    @Param('id') id: string,
  ) {
    const stock = await this.itemsService.getStock(orgId, id);
    return { data: stock };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update item' })
  @ApiResponse({ status: 200, type: ItemResponseDto })
  @ApiResponse({ status: 404, description: 'Item not found' })
  async update(
    @CurrentUser('organizationId') orgId: string,
    @Param('id') id: string,
    @Body() dto: UpdateItemDto,
  ) {
    const item = await this.itemsService.update(orgId, id, dto);
    return { data: item };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete item' })
  @ApiResponse({ status: 200, description: 'Item deleted' })
  @ApiResponse({ status: 404, description: 'Item not found' })
  async remove(
    @CurrentUser('organizationId') orgId: string,
    @Param('id') id: string,
  ) {
    await this.itemsService.remove(orgId, id);
    return { data: { message: 'Item deleted successfully' } };
  }

  // Variant Endpoints
  @Post(':id/variants')
  @ApiOperation({ summary: 'Create variants for an item' })
  @ApiResponse({ status: 201, type: ItemWithVariantsResponseDto })
  @ApiResponse({ status: 400, description: 'Item already has variants or is a variant' })
  async createVariants(
    @CurrentUser('organizationId') orgId: string,
    @Param('id') id: string,
    @Body() dto: CreateVariantsDto,
  ) {
    const result = await this.variantsService.createVariants(orgId, id, dto);
    return { data: result };
  }

  @Get(':id/variants')
  @ApiOperation({ summary: 'Get item with all variants' })
  @ApiResponse({ status: 200, type: ItemWithVariantsResponseDto })
  @ApiResponse({ status: 404, description: 'Item not found' })
  async getVariants(
    @CurrentUser('organizationId') orgId: string,
    @Param('id') id: string,
  ) {
    const result = await this.variantsService.getItemWithVariants(orgId, id);
    return { data: result };
  }

  @Put(':id/variants/:variantId')
  @ApiOperation({ summary: 'Update a specific variant' })
  @ApiResponse({ status: 200, type: VariantResponseDto })
  @ApiResponse({ status: 404, description: 'Variant not found' })
  async updateVariant(
    @CurrentUser('organizationId') orgId: string,
    @Param('id') _id: string,
    @Param('variantId') variantId: string,
    @Body() dto: UpdateVariantDto,
  ) {
    const result = await this.variantsService.updateVariant(orgId, variantId, dto);
    return { data: result };
  }

  @Delete(':id/variants')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete all variants for an item' })
  @ApiResponse({ status: 200, description: 'Variants deleted' })
  @ApiResponse({ status: 400, description: 'Variants have stock' })
  async deleteVariants(
    @CurrentUser('organizationId') orgId: string,
    @Param('id') id: string,
  ) {
    const result = await this.variantsService.deleteVariants(orgId, id);
    return { data: result };
  }

  @Put(':id/variants/bulk-prices')
  @ApiOperation({ summary: 'Bulk update variant prices' })
  @ApiResponse({ status: 200, description: 'Prices updated' })
  async bulkUpdatePrices(
    @CurrentUser('organizationId') orgId: string,
    @Param('id') id: string,
    @Body() updates: { variantId: string; costPrice?: number; sellingPrice?: number }[],
  ) {
    const result = await this.variantsService.bulkUpdatePrices(orgId, id, updates);
    return { data: result };
  }
}

@ApiTags('Categories')
@ApiBearerAuth()
@Controller('categories')
export class CategoriesController {
  constructor(private itemsService: ItemsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new category' })
  @ApiResponse({ status: 201, type: CategoryResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async create(
    @CurrentUser('organizationId') orgId: string,
    @Body() dto: CreateCategoryDto,
  ) {
    const category = await this.itemsService.createCategory(orgId, dto);
    return { data: category };
  }

  @Get()
  @ApiOperation({ summary: 'List all categories' })
  @ApiQuery({ name: 'tree', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'Categories list' })
  async findAll(
    @CurrentUser('organizationId') orgId: string,
    @Query('tree') tree?: boolean,
  ) {
    const categories = await this.itemsService.findAllCategories(orgId, tree);
    return { data: categories };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update category' })
  @ApiResponse({ status: 200, type: CategoryResponseDto })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async update(
    @CurrentUser('organizationId') orgId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    const category = await this.itemsService.updateCategory(orgId, id, dto);
    return { data: category };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete category' })
  @ApiResponse({ status: 200, description: 'Category deleted' })
  @ApiResponse({ status: 400, description: 'Category has subcategories' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async remove(
    @CurrentUser('organizationId') orgId: string,
    @Param('id') id: string,
  ) {
    await this.itemsService.removeCategory(orgId, id);
    return { data: { message: 'Category deleted successfully' } };
  }
}
