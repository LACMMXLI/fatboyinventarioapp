import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { Product } from './entities/product.entity';
import { ProductCategory } from '../categories/entities/product-category.entity';
import { ProductStore } from '../product-stores/entities/product-store.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Product, ProductCategory, ProductStore])],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
