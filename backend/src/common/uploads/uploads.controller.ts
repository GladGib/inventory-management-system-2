import {
  Controller,
  Post,
  Get,
  Delete,
  Patch,
  Param,
  Body,
  UseInterceptors,
  UploadedFile,
  Res,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiBody,
  ApiBearerAuth,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import { UploadsService, UploadedFile as IUploadedFile } from './uploads.service';
import { CurrentUser } from '../decorators/current-user.decorator';

interface JwtPayload {
  sub: string;
  email: string;
  organizationId: string;
  role: string;
}

class ReorderImagesDto {
  imageIds: string[];
}

@ApiTags('uploads')
@ApiBearerAuth()
@Controller()
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post('organizations/:id/logo')
  @ApiOperation({ summary: 'Upload organization logo' })
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'id', description: 'Organization ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Logo uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadOrganizationLogo(
    @Param('id') organizationId: string,
    @UploadedFile() file: IUploadedFile,
    @CurrentUser() user: JwtPayload,
  ) {
    // Verify user belongs to organization
    if (user.organizationId !== organizationId) {
      return { statusCode: HttpStatus.FORBIDDEN, message: 'Access denied' };
    }

    const metadata = await this.uploadsService.uploadOrganizationLogo(
      organizationId,
      file,
    );

    return {
      id: metadata.id,
      filename: metadata.filename,
      originalName: metadata.originalName,
      size: metadata.size,
      mimeType: metadata.mimeType,
    };
  }

  @Get('organizations/:id/logo')
  @ApiOperation({ summary: 'Get organization logo' })
  @ApiParam({ name: 'id', description: 'Organization ID' })
  @ApiResponse({ status: 200, description: 'Logo file' })
  @ApiResponse({ status: 404, description: 'Logo not found' })
  async getOrganizationLogo(
    @Param('id') organizationId: string,
    @CurrentUser() user: JwtPayload,
    @Res() res: Response,
  ) {
    if (user.organizationId !== organizationId) {
      return res.status(HttpStatus.FORBIDDEN).json({ message: 'Access denied' });
    }

    const file = await this.uploadsService.getOrganizationLogo(organizationId);

    if (!file) {
      return res.status(HttpStatus.NOT_FOUND).json({ message: 'Logo not found' });
    }

    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${file.filename}"`);
    res.sendFile(file.path, { root: '.' });
  }

  @Delete('organizations/:id/logo')
  @ApiOperation({ summary: 'Delete organization logo' })
  @ApiParam({ name: 'id', description: 'Organization ID' })
  @ApiResponse({ status: 200, description: 'Logo deleted' })
  async deleteOrganizationLogo(
    @Param('id') organizationId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    if (user.organizationId !== organizationId) {
      return { statusCode: HttpStatus.FORBIDDEN, message: 'Access denied' };
    }

    const logo = await this.uploadsService.getOrganizationLogo(organizationId);
    if (logo) {
      // Find the file metadata to get the ID
      const file = await this.uploadsService['prisma'].fileMetadata.findFirst({
        where: { organizationId, type: 'logo' },
      });
      if (file) {
        await this.uploadsService.deleteFile(file.id, organizationId);
      }
    }

    return { message: 'Logo deleted' };
  }

  @Post('items/:id/images')
  @ApiOperation({ summary: 'Upload item image' })
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'id', description: 'Item ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Image uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file or max images reached' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadItemImage(
    @Param('id') itemId: string,
    @UploadedFile() file: IUploadedFile,
    @CurrentUser() user: JwtPayload,
  ) {
    const metadata = await this.uploadsService.uploadItemImage(
      itemId,
      user.organizationId,
      file,
    );

    return {
      id: metadata.id,
      filename: metadata.filename,
      originalName: metadata.originalName,
      size: metadata.size,
      mimeType: metadata.mimeType,
      sortOrder: 0,
    };
  }

  @Get('items/:id/images')
  @ApiOperation({ summary: 'Get all images for an item' })
  @ApiParam({ name: 'id', description: 'Item ID' })
  @ApiResponse({ status: 200, description: 'List of item images' })
  async getItemImages(
    @Param('id') itemId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    const images = await this.uploadsService.getItemImages(
      itemId,
      user.organizationId,
    );

    return images.map((img) => ({
      id: img.id,
      filename: img.filename,
      originalName: img.originalName,
      size: img.size,
      mimeType: img.mimeType,
    }));
  }

  @Patch('items/:id/images/reorder')
  @ApiOperation({ summary: 'Reorder item images' })
  @ApiParam({ name: 'id', description: 'Item ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        imageIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Ordered list of image IDs',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Images reordered' })
  async reorderItemImages(
    @Param('id') itemId: string,
    @Body() body: ReorderImagesDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const images = await this.uploadsService.reorderItemImages(
      itemId,
      user.organizationId,
      body.imageIds,
    );

    return images.map((img) => ({
      id: img.id,
      filename: img.filename,
      originalName: img.originalName,
      sortOrder: 0,
    }));
  }

  @Delete('items/:itemId/images/:imageId')
  @ApiOperation({ summary: 'Delete item image' })
  @ApiParam({ name: 'itemId', description: 'Item ID' })
  @ApiParam({ name: 'imageId', description: 'Image ID' })
  @ApiResponse({ status: 200, description: 'Image deleted' })
  async deleteItemImage(
    @Param('itemId') itemId: string,
    @Param('imageId') imageId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.uploadsService.deleteFile(imageId, user.organizationId);
    return { message: 'Image deleted' };
  }

  @Get('files/:id')
  @ApiOperation({ summary: 'Get file by ID' })
  @ApiParam({ name: 'id', description: 'File ID' })
  @ApiResponse({ status: 200, description: 'File content' })
  @ApiResponse({ status: 404, description: 'File not found' })
  async getFile(
    @Param('id') fileId: string,
    @CurrentUser() user: JwtPayload,
    @Res() res: Response,
  ) {
    const file = await this.uploadsService.getFile(fileId, user.organizationId);

    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${file.filename}"`);
    res.sendFile(file.path, { root: '.' });
  }
}
