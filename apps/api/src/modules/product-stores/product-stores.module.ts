import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductStore } from './entities/product-store.entity';
import { ProductStoresController } from './product-stores.controller';
import { ProductStoresService } from './product-stores.service';

@Module({
  imports: [TypeOrmModule.forFeature([ProductStore])],
  controllers: [ProductStoresController],
  providers: [ProductStoresService],
  exports: [ProductStoresService],
})
export class ProductStoresModule {}
