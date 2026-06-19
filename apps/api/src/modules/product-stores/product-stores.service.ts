import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductStore } from './entities/product-store.entity';

@Injectable()
export class ProductStoresService {
  constructor(
    @InjectRepository(ProductStore)
    private readonly storeRepository: Repository<ProductStore>,
  ) {}

  async findAll(isActive?: boolean) {
    const where: Record<string, unknown> = {};
    if (isActive !== undefined) where.isActive = isActive;

    const stores = await this.storeRepository.find({
      where,
      order: { name: 'ASC' },
      relations: ['products'],
    });

    return stores.map((store) => ({
      id: store.id,
      name: store.name,
      address: store.address,
      phone: store.phone,
      isActive: store.isActive,
      createdAt: store.createdAt,
      productCount: store.products?.length ?? 0,
    }));
  }

  async findById(id: string) {
    const store = await this.storeRepository.findOne({ where: { id } });
    if (!store) throw new NotFoundException('Tienda no encontrada');
    return store;
  }

  async create(data: { name: string; address?: string; phone?: string }) {
    const existing = await this.storeRepository.findOne({
      where: { name: data.name.trim() },
    });
    if (existing) {
      throw new ConflictException('Ya existe una tienda con ese nombre');
    }

    const store = this.storeRepository.create({
      name: data.name.trim(),
      address: data.address?.trim() || null,
      phone: data.phone?.trim() || null,
    });

    return this.storeRepository.save(store);
  }

  async update(
    id: string,
    data: {
      name?: string;
      address?: string;
      phone?: string;
      isActive?: boolean;
    },
  ) {
    const store = await this.findById(id);

    if (data.name && data.name.trim() !== store.name) {
      const existing = await this.storeRepository.findOne({
        where: { name: data.name.trim() },
      });
      if (existing) {
        throw new ConflictException('Ya existe una tienda con ese nombre');
      }
      store.name = data.name.trim();
    }

    if (data.address !== undefined) store.address = data.address?.trim() || null;
    if (data.phone !== undefined) store.phone = data.phone?.trim() || null;
    if (data.isActive !== undefined) store.isActive = data.isActive;

    return this.storeRepository.save(store);
  }
}
