import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { InventoryCount } from './entities/inventory-count.entity';
import { InventoryCountItem } from './entities/inventory-count-item.entity';
import { Product } from '../products/entities/product.entity';
import { CountStatus, UserRole } from '@inventarioapp/shared';

interface AuthenticatedUser {
  id: string;
  role: UserRole;
  branchId: string | null;
  fullName: string;
}

@Injectable()
export class CountsService {
  constructor(
    @InjectRepository(InventoryCount)
    private readonly countRepository: Repository<InventoryCount>,
    @InjectRepository(InventoryCountItem)
    private readonly itemRepository: Repository<InventoryCountItem>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async findAll(filters?: {
    branchId?: string;
    status?: CountStatus;
    startDate?: string;
    endDate?: string;
    userId?: string;
    page?: number;
    limit?: number;
  }) {
    const query = this.countRepository
      .createQueryBuilder('count')
      .leftJoinAndSelect('count.branch', 'branch')
      .leftJoinAndSelect('count.user', 'user')
      .loadRelationCountAndMap('count.itemCount', 'count.items');

    if (filters?.branchId) {
      query.andWhere('count.branchId = :branchId', {
        branchId: filters.branchId,
      });
    }
    if (filters?.status) {
      query.andWhere('count.status = :status', { status: filters.status });
    }
    if (filters?.userId) {
      query.andWhere('count.userId = :userId', { userId: filters.userId });
    }
    if (filters?.startDate) {
      query.andWhere('count.countDate >= :startDate', {
        startDate: filters.startDate,
      });
    }
    if (filters?.endDate) {
      query.andWhere('count.countDate <= :endDate', {
        endDate: filters.endDate,
      });
    }

    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    query.skip((page - 1) * limit).take(limit);
    query.orderBy('count.countDate', 'DESC');
    query.addOrderBy('count.startedAt', 'DESC');

    const [counts, total] = await query.getManyAndCount();

    return {
      data: counts.map((c) => this.toDto(c)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findCurrentDraft(user: AuthenticatedUser) {
    if (!user.branchId) {
      throw new BadRequestException(
        'Tu usuario no tiene una sucursal asignada',
      );
    }

    const draft = await this.countRepository.findOne({
      where: {
        branchId: user.branchId,
        status: CountStatus.DRAFT,
      },
      relations: ['branch', 'user', 'items', 'items.product', 'items.product.category'],
      order: { startedAt: 'DESC' },
    });

    if (!draft) return null;
    return this.toDetailDto(draft);
  }

  async findById(id: string) {
    const count = await this.countRepository.findOne({
      where: { id },
      relations: ['branch', 'user', 'items', 'items.product', 'items.product.category'],
    });
    if (!count) throw new NotFoundException('Conteo no encontrado');
    return this.toDetailDto(count);
  }

  async create(user: AuthenticatedUser, notes?: string) {
    if (!user.branchId) {
      throw new BadRequestException(
        'Tu usuario no tiene una sucursal asignada',
      );
    }

    // Check for existing draft
    const existingDraft = await this.countRepository.findOne({
      where: {
        branchId: user.branchId,
        status: CountStatus.DRAFT,
      },
    });

    if (existingDraft) {
      throw new BadRequestException(
        'Ya existe un conteo en borrador para tu sucursal. Finalízalo o continúa con él.',
      );
    }

    const today = new Date().toISOString().split('T')[0];

    const count = this.countRepository.create({
      branchId: user.branchId,
      userId: user.id,
      countDate: today,
      status: CountStatus.DRAFT,
      startedAt: new Date(),
      notes: notes || null,
    });

    const saved = await this.countRepository.save(count);
    return this.findById(saved.id);
  }

  async updateItems(
    id: string,
    items: { productId: string; quantity: number }[],
    user: AuthenticatedUser,
  ) {
    const count = await this.countRepository.findOne({
      where: { id },
      relations: ['items'],
    });
    if (!count) throw new NotFoundException('Conteo no encontrado');

    // Verify ownership
    if (
      user.role !== UserRole.ADMIN &&
      count.branchId !== user.branchId
    ) {
      throw new ForbiddenException('No puedes modificar conteos de otra sucursal');
    }

    if (count.status === CountStatus.FINALIZED) {
      throw new BadRequestException(
        'No se puede modificar un conteo finalizado',
      );
    }

    // Validate all items
    for (const item of items) {
      if (item.quantity < 0) {
        throw new BadRequestException(
          'Las cantidades no pueden ser negativas',
        );
      }

      const product = await this.productRepository.findOne({
        where: { id: item.productId },
      });
      if (!product) {
        throw new NotFoundException(
          `Producto con ID ${item.productId} no encontrado`,
        );
      }
    }

    // Upsert items
    for (const item of items) {
      const existing = await this.itemRepository.findOne({
        where: { countId: id, productId: item.productId },
      });

      if (existing) {
        existing.quantity = item.quantity;
        await this.itemRepository.save(existing);
      } else {
        const newItem = this.itemRepository.create({
          countId: id,
          productId: item.productId,
          quantity: item.quantity,
        });
        await this.itemRepository.save(newItem);
      }
    }

    return this.findById(id);
  }

  async finalize(id: string, user: AuthenticatedUser) {
    const count = await this.countRepository.findOne({
      where: { id },
      relations: ['items'],
    });
    if (!count) throw new NotFoundException('Conteo no encontrado');

    // Verify ownership
    if (
      user.role !== UserRole.ADMIN &&
      count.branchId !== user.branchId
    ) {
      throw new ForbiddenException(
        'No puedes finalizar conteos de otra sucursal',
      );
    }

    if (count.status === CountStatus.FINALIZED) {
      throw new BadRequestException('Este conteo ya fue finalizado');
    }

    if (!count.items || count.items.length === 0) {
      throw new BadRequestException(
        'No puedes finalizar un conteo sin productos capturados',
      );
    }

    count.status = CountStatus.FINALIZED;
    count.finalizedAt = new Date();

    await this.countRepository.save(count);
    return this.findById(id);
  }

  private toDto(count: InventoryCount) {
    return {
      id: count.id,
      branchId: count.branchId,
      branchName: count.branch?.name ?? '',
      userId: count.userId,
      userName: count.user?.fullName ?? '',
      countDate: count.countDate,
      status: count.status,
      startedAt: count.startedAt?.toISOString() ?? '',
      finalizedAt: count.finalizedAt?.toISOString() ?? null,
      notes: count.notes,
      itemCount: (count as any).itemCount ?? 0,
    };
  }

  private toDetailDto(count: InventoryCount) {
    return {
      ...this.toDto(count),
      itemCount: count.items?.length ?? 0,
      items: (count.items || [])
        .map((item) => ({
          id: item.id,
          productId: item.productId,
          productName: item.product?.name ?? '',
          categoryName: item.product?.category?.name ?? '',
          unit: item.product?.unit ?? '',
          quantity: Number(item.quantity),
        }))
        .sort((a, b) => a.categoryName.localeCompare(b.categoryName)),
    };
  }
}
