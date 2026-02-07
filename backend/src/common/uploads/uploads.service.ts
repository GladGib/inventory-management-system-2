import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';

export interface FileMetadata {
  id: string;
  originalName: string;
  filename: string;
  mimeType: string;
  size: number;
  path: string;
  type: 'logo' | 'item_image';
  organizationId: string;
  entityId?: string;
  createdAt: Date;
}

export interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
  buffer?: Buffer;
}

const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
const MAX_LOGO_SIZE = 2 * 1024 * 1024; // 2MB
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_IMAGES_PER_ITEM = 5;

@Injectable()
export class UploadsService {
  private readonly uploadDir: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.uploadDir = this.configService.get<string>('UPLOAD_DIR') || './uploads';
    this.ensureUploadDirExists();
  }

  private ensureUploadDirExists(): void {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  private getOrganizationDir(organizationId: string, type: string): string {
    const dir = path.join(this.uploadDir, organizationId, type);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    return dir;
  }

  validateImageFile(
    file: UploadedFile,
    type: 'logo' | 'item_image',
  ): void {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        'Only PNG, JPG, JPEG, and WebP files are allowed',
      );
    }

    const maxSize = type === 'logo' ? MAX_LOGO_SIZE : MAX_IMAGE_SIZE;
    if (file.size > maxSize) {
      const maxSizeMB = maxSize / (1024 * 1024);
      throw new BadRequestException(`File size must be under ${maxSizeMB}MB`);
    }
  }

  async uploadOrganizationLogo(
    organizationId: string,
    file: UploadedFile,
  ): Promise<FileMetadata> {
    this.validateImageFile(file, 'logo');

    // Delete existing logo if present
    const existingLogo = await this.prisma.fileMetadata.findFirst({
      where: {
        organizationId,
        type: 'logo',
      },
    });

    if (existingLogo) {
      await this.deleteFile(existingLogo.id, organizationId);
    }

    // Save new logo
    const dir = this.getOrganizationDir(organizationId, 'logos');
    const ext = path.extname(file.originalname);
    const filename = `${uuidv4()}${ext}`;
    const filePath = path.join(dir, filename);

    if (file.buffer) {
      fs.writeFileSync(filePath, file.buffer);
    } else if (file.path) {
      fs.copyFileSync(file.path, filePath);
      fs.unlinkSync(file.path);
    }

    const metadata = await this.prisma.fileMetadata.create({
      data: {
        originalName: file.originalname,
        filename,
        mimeType: file.mimetype,
        size: file.size,
        path: filePath,
        type: 'logo',
        organizationId,
      },
    });

    // Update organization with logo reference
    await this.prisma.organization.update({
      where: { id: organizationId },
      data: { logoId: metadata.id },
    });

    return {
      id: metadata.id,
      originalName: metadata.originalName,
      filename: metadata.filename,
      mimeType: metadata.mimeType,
      size: metadata.size,
      path: metadata.path,
      type: metadata.type as 'logo' | 'item_image',
      organizationId: metadata.organizationId,
      createdAt: metadata.createdAt,
    };
  }

  async uploadItemImage(
    itemId: string,
    organizationId: string,
    file: UploadedFile,
  ): Promise<FileMetadata> {
    this.validateImageFile(file, 'item_image');

    // Check item exists and belongs to organization
    const item = await this.prisma.item.findFirst({
      where: { id: itemId, organizationId },
    });

    if (!item) {
      throw new NotFoundException('Item not found');
    }

    // Check image count limit
    const imageCount = await this.prisma.fileMetadata.count({
      where: {
        entityId: itemId,
        type: 'item_image',
      },
    });

    if (imageCount >= MAX_IMAGES_PER_ITEM) {
      throw new BadRequestException(`Maximum ${MAX_IMAGES_PER_ITEM} images per item`);
    }

    // Save image
    const dir = this.getOrganizationDir(organizationId, 'items');
    const ext = path.extname(file.originalname);
    const filename = `${uuidv4()}${ext}`;
    const filePath = path.join(dir, filename);

    if (file.buffer) {
      fs.writeFileSync(filePath, file.buffer);
    } else if (file.path) {
      fs.copyFileSync(file.path, filePath);
      fs.unlinkSync(file.path);
    }

    // Determine sort order (first image is primary)
    const sortOrder = imageCount;

    const metadata = await this.prisma.fileMetadata.create({
      data: {
        originalName: file.originalname,
        filename,
        mimeType: file.mimetype,
        size: file.size,
        path: filePath,
        type: 'item_image',
        organizationId,
        entityId: itemId,
        sortOrder,
      },
    });

    return {
      id: metadata.id,
      originalName: metadata.originalName,
      filename: metadata.filename,
      mimeType: metadata.mimeType,
      size: metadata.size,
      path: metadata.path,
      type: metadata.type as 'logo' | 'item_image',
      organizationId: metadata.organizationId,
      entityId: metadata.entityId || undefined,
      createdAt: metadata.createdAt,
    };
  }

  async getItemImages(itemId: string, organizationId: string): Promise<FileMetadata[]> {
    const images = await this.prisma.fileMetadata.findMany({
      where: {
        entityId: itemId,
        organizationId,
        type: 'item_image',
      },
      orderBy: { sortOrder: 'asc' },
    });

    return images.map((img) => ({
      id: img.id,
      originalName: img.originalName,
      filename: img.filename,
      mimeType: img.mimeType,
      size: img.size,
      path: img.path,
      type: img.type as 'logo' | 'item_image',
      organizationId: img.organizationId,
      entityId: img.entityId || undefined,
      createdAt: img.createdAt,
    }));
  }

  async reorderItemImages(
    itemId: string,
    organizationId: string,
    imageIds: string[],
  ): Promise<FileMetadata[]> {
    // Verify all images belong to the item
    const images = await this.prisma.fileMetadata.findMany({
      where: {
        entityId: itemId,
        organizationId,
        type: 'item_image',
      },
    });

    const existingIds = new Set(images.map((img) => img.id));
    for (const id of imageIds) {
      if (!existingIds.has(id)) {
        throw new BadRequestException(`Image ${id} not found for this item`);
      }
    }

    // Update sort orders
    await Promise.all(
      imageIds.map((id, index) =>
        this.prisma.fileMetadata.update({
          where: { id },
          data: { sortOrder: index },
        }),
      ),
    );

    return this.getItemImages(itemId, organizationId);
  }

  async setPrimaryImage(
    itemId: string,
    imageId: string,
    organizationId: string,
  ): Promise<FileMetadata[]> {
    // Verify the image exists and belongs to the item
    const image = await this.prisma.fileMetadata.findFirst({
      where: {
        id: imageId,
        entityId: itemId,
        organizationId,
        type: 'item_image',
      },
    });

    if (!image) {
      throw new NotFoundException('Image not found for this item');
    }

    // Get all images for the item, ordered by current sort order
    const allImages = await this.prisma.fileMetadata.findMany({
      where: {
        entityId: itemId,
        organizationId,
        type: 'item_image',
      },
      orderBy: { sortOrder: 'asc' },
    });

    // Build new order: selected image first, then the rest in their current order
    const reorderedIds = [
      imageId,
      ...allImages.filter((img) => img.id !== imageId).map((img) => img.id),
    ];

    // Update sort orders
    await Promise.all(
      reorderedIds.map((id, index) =>
        this.prisma.fileMetadata.update({
          where: { id },
          data: { sortOrder: index },
        }),
      ),
    );

    return this.getItemImages(itemId, organizationId);
  }

  async deleteFile(fileId: string, organizationId: string): Promise<void> {
    const file = await this.prisma.fileMetadata.findFirst({
      where: { id: fileId, organizationId },
    });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    // Delete physical file
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }

    // If this was a logo, remove reference from organization
    if (file.type === 'logo') {
      await this.prisma.organization.updateMany({
        where: { logoId: fileId },
        data: { logoId: null },
      });
    }

    // Delete metadata
    await this.prisma.fileMetadata.delete({
      where: { id: fileId },
    });
  }

  async getFile(
    fileId: string,
    organizationId: string,
  ): Promise<{ path: string; mimeType: string; filename: string }> {
    const file = await this.prisma.fileMetadata.findFirst({
      where: { id: fileId, organizationId },
    });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    if (!fs.existsSync(file.path)) {
      throw new NotFoundException('File not found on disk');
    }

    return {
      path: file.path,
      mimeType: file.mimeType,
      filename: file.originalName,
    };
  }

  async getOrganizationLogo(
    organizationId: string,
  ): Promise<{ path: string; mimeType: string; filename: string } | null> {
    const file = await this.prisma.fileMetadata.findFirst({
      where: {
        organizationId,
        type: 'logo',
      },
    });

    if (!file || !fs.existsSync(file.path)) {
      return null;
    }

    return {
      path: file.path,
      mimeType: file.mimeType,
      filename: file.originalName,
    };
  }
}
