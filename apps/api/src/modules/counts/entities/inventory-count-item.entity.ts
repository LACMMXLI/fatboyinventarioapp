import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { InventoryCount } from './inventory-count.entity';
import { Product } from '../../products/entities/product.entity';

@Entity('inventory_count_items')
@Unique(['countId', 'productId'])
export class InventoryCountItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'count_id' })
  countId: string;

  @ManyToOne(() => InventoryCount, (count) => count.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'count_id' })
  count: InventoryCount;

  @Column({ type: 'uuid', name: 'product_id' })
  productId: string;

  @ManyToOne(() => Product, { eager: true })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  quantity: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
