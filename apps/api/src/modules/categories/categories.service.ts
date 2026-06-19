import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductCategory } from './entities/product-category.entity';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(ProductCategory)
    private readonly categoryRepository: Repository<ProductCategory>,
  ) {}

  async findAll(isActive?: boolean) {
    const where: Record<string, unknown> = {};
    if (isActive !== undefined) where.isActive = isActive;

    const categories = await this.categoryRepository.find({
      where,
      order: { sortOrder: 'ASC', name: 'ASC' },
      relations: ['products'],
    });

    return categories.map((c) => ({
      id: c.id,
      name: c.name,
      sortOrder: c.sortOrder,
      isActive: c.isActive,
      productCount: c.products?.length ?? 0,
    }));
  }

  async findById(id: string) {
    const category = await this.categoryRepository.findOne({
      where: { id },
    });
    if (!category) throw new NotFoundException('Categoría no encontrada');
    return category;
  }

  async create(data: { name: string; sortOrder?: number }) {
    const existing = await this.categoryRepository.findOne({
      where: { name: data.name.trim() },
    });
    if (existing) {
      throw new ConflictException('Ya existe una categoría con ese nombre');
    }

    const category = this.categoryRepository.create({
      name: data.name.trim(),
      sortOrder: data.sortOrder ?? 0,
    });

    return this.categoryRepository.save(category);
  }

  async update(
    id: string,
    data: { name?: string; sortOrder?: number; isActive?: boolean },
  ) {
    const category = await this.findById(id);

    if (data.name && data.name.trim() !== category.name) {
      const existing = await this.categoryRepository.findOne({
        where: { name: data.name.trim() },
      });
      if (existing) {
        throw new ConflictException('Ya existe una categoría con ese nombre');
      }
      category.name = data.name.trim();
    }

    if (data.sortOrder !== undefined) category.sortOrder = data.sortOrder;
    if (data.isActive !== undefined) category.isActive = data.isActive;

    return this.categoryRepository.save(category);
  }
}
