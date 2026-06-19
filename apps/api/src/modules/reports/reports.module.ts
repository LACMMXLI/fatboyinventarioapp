import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { InventoryCount } from '../counts/entities/inventory-count.entity';
import { InventoryCountItem } from '../counts/entities/inventory-count-item.entity';

@Module({
  imports: [TypeOrmModule.forFeature([InventoryCount, InventoryCountItem])],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
