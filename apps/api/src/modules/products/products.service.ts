import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { ProductCategory } from '../categories/entities/product-category.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(ProductCategory)
    private readonly categoryRepository: Repository<ProductCategory>,
  ) {}

  async findAll(filters?: {
    categoryId?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }) {
    const query = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category');

    if (filters?.categoryId) {
      query.andWhere('product.categoryId = :categoryId', {
        categoryId: filters.categoryId,
      });
    }
    if (filters?.isActive !== undefined) {
      query.andWhere('product.isActive = :isActive', {
        isActive: filters.isActive,
      });
    }

    query.orderBy('category.sortOrder', 'ASC');
    query.addOrderBy('product.sortOrder', 'ASC');
    query.addOrderBy('product.name', 'ASC');

    const page = filters?.page || 1;
    const limit = filters?.limit || 100;
    query.skip((page - 1) * limit).take(limit);

    const [products, total] = await query.getManyAndCount();

    return {
      data: products.map((p) => this.toDto(p)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findByCategory(isActive = true) {
    const categories = await this.categoryRepository.find({
      where: { isActive: true },
      order: { sortOrder: 'ASC', name: 'ASC' },
    });

    const result = [];

    for (const category of categories) {
      const products = await this.productRepository.find({
        where: { categoryId: category.id, isActive },
        order: { sortOrder: 'ASC', name: 'ASC' },
      });

      if (products.length > 0) {
        result.push({
          category: {
            id: category.id,
            name: category.name,
            sortOrder: category.sortOrder,
            isActive: category.isActive,
          },
          products: products.map((p) => this.toDto(p)),
        });
      }
    }

    return result;
  }

  async findById(id: string) {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['category'],
    });
    if (!product) throw new NotFoundException('Producto no encontrado');
    return this.toDto(product);
  }

  async create(data: {
    name: string;
    categoryId: string;
    unit: string;
    sortOrder?: number;
  }) {
    // Verify category exists
    const category = await this.categoryRepository.findOne({
      where: { id: data.categoryId },
    });
    if (!category) throw new NotFoundException('Categoría no encontrada');

    // Check uniqueness within category
    const existing = await this.productRepository.findOne({
      where: { name: data.name.trim(), categoryId: data.categoryId },
    });
    if (existing) {
      throw new ConflictException(
        'Ya existe un producto con ese nombre en esta categoría',
      );
    }

    const product = this.productRepository.create({
      name: data.name.trim(),
      categoryId: data.categoryId,
      unit: data.unit.trim(),
      sortOrder: data.sortOrder ?? 0,
    });

    const saved = await this.productRepository.save(product);
    return this.findById(saved.id);
  }

  async update(
    id: string,
    data: {
      name?: string;
      categoryId?: string;
      unit?: string;
      sortOrder?: number;
      isActive?: boolean;
    },
  ) {
    const product = await this.productRepository.findOne({
      where: { id },
    });
    if (!product) throw new NotFoundException('Producto no encontrado');

    if (data.categoryId) {
      const category = await this.categoryRepository.findOne({
        where: { id: data.categoryId },
      });
      if (!category) throw new NotFoundException('Categoría no encontrada');
    }

    // Check uniqueness if name or category changes
    const newName = data.name?.trim() || product.name;
    const newCategoryId = data.categoryId || product.categoryId;
    if (newName !== product.name || newCategoryId !== product.categoryId) {
      const existing = await this.productRepository.findOne({
        where: { name: newName, categoryId: newCategoryId },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException(
          'Ya existe un producto con ese nombre en esta categoría',
        );
      }
    }

    if (data.name !== undefined) product.name = data.name.trim();
    if (data.categoryId !== undefined) product.categoryId = data.categoryId;
    if (data.unit !== undefined) product.unit = data.unit.trim();
    if (data.sortOrder !== undefined) product.sortOrder = data.sortOrder;
    if (data.isActive !== undefined) product.isActive = data.isActive;

    await this.productRepository.save(product);
    return this.findById(id);
  }

  private toDto(product: Product) {
    return {
      id: product.id,
      name: product.name,
      categoryId: product.categoryId,
      categoryName: product.category?.name ?? '',
      unit: product.unit,
      sortOrder: product.sortOrder,
      isActive: product.isActive,
    };
  }
}
