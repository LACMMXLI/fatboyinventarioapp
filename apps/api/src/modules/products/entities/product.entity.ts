import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ProductCategory } from '../../categories/entities/product-category.entity';
import { ProductStore } from '../../product-stores/entities/product-store.entity';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'uuid', name: 'category_id' })
  categoryId: string;

  @ManyToOne(() => ProductCategory, (category) => category.products, {
    eager: true,
  })
  @JoinColumn({ name: 'category_id' })
  category: ProductCategory;

  @Column({ type: 'uuid', name: 'store_id', nullable: true })
  storeId: string | null;

  @ManyToOne(() => ProductStore, (store) => store.products, {
    nullable: true,
    eager: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'store_id' })
  store: ProductStore | null;

  @Column({ type: 'varchar', length: 50 })
  unit: string;

  @Column({ type: 'int', name: 'sort_order', default: 0 })
  sortOrder: number;

  @Column({ type: 'boolean', name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
