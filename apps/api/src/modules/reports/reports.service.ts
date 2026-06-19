import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InventoryCount } from '../counts/entities/inventory-count.entity';
import { InventoryCountItem } from '../counts/entities/inventory-count-item.entity';
import { CountStatus } from '@inventarioapp/shared';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(InventoryCount)
    private readonly countRepository: Repository<InventoryCount>,
    @InjectRepository(InventoryCountItem)
    private readonly itemRepository: Repository<InventoryCountItem>,
  ) {}

  async getCountsSummary(filters: {
    branchId?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const query = this.countRepository
      .createQueryBuilder('count')
      .leftJoinAndSelect('count.branch', 'branch')
      .leftJoinAndSelect('count.user', 'user');

    if (filters.branchId) {
      query.andWhere('count.branchId = :branchId', {
        branchId: filters.branchId,
      });
    }
    if (filters.startDate) {
      query.andWhere('count.countDate >= :startDate', {
        startDate: filters.startDate,
      });
    }
    if (filters.endDate) {
      query.andWhere('count.countDate <= :endDate', {
        endDate: filters.endDate,
      });
    }

    query.orderBy('count.countDate', 'DESC');

    const counts = await query.getMany();

    return {
      totalCounts: counts.length,
      finalizedCounts: counts.filter(
        (c) => c.status === CountStatus.FINALIZED,
      ).length,
      draftCounts: counts.filter((c) => c.status === CountStatus.DRAFT).length,
      counts: counts.map((c) => ({
        id: c.id,
        branchName: c.branch?.name ?? '',
        userName: c.user?.fullName ?? '',
        countDate: c.countDate,
        status: c.status,
        startedAt: c.startedAt?.toISOString() ?? '',
        finalizedAt: c.finalizedAt?.toISOString() ?? null,
      })),
    };
  }

  async getProductHistory(
    productId: string,
    filters: { branchId?: string; startDate?: string; endDate?: string },
  ) {
    const query = this.itemRepository
      .createQueryBuilder('item')
      .leftJoinAndSelect('item.count', 'count')
      .leftJoinAndSelect('count.branch', 'branch')
      .leftJoinAndSelect('count.user', 'user')
      .leftJoinAndSelect('item.product', 'product')
      .where('item.productId = :productId', { productId })
      .andWhere('count.status = :status', { status: CountStatus.FINALIZED });

    if (filters.branchId) {
      query.andWhere('count.branchId = :branchId', {
        branchId: filters.branchId,
      });
    }
    if (filters.startDate) {
      query.andWhere('count.countDate >= :startDate', {
        startDate: filters.startDate,
      });
    }
    if (filters.endDate) {
      query.andWhere('count.countDate <= :endDate', {
        endDate: filters.endDate,
      });
    }

    query.orderBy('count.countDate', 'DESC');

    const items = await query.getMany();
    const product = items[0]?.product;

    return {
      productId,
      productName: product?.name ?? '',
      unit: product?.unit ?? '',
      entries: items.map((item) => ({
        countId: item.countId,
        countDate: item.count?.countDate ?? '',
        branchName: item.count?.branch?.name ?? '',
        userName: item.count?.user?.fullName ?? '',
        quantity: Number(item.quantity),
      })),
    };
  }
}
