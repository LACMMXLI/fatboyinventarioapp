import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@inventarioapp/shared';
import { Roles } from '../../common/decorators';
import { RolesGuard } from '../../common/guards';
import { ProductStoresService } from './product-stores.service';
import { CreateProductStoreDto } from './dto/create-product-store.dto';
import { UpdateProductStoreDto } from './dto/update-product-store.dto';

@ApiTags('Product Stores')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('product-stores')
export class ProductStoresController {
  constructor(private readonly storesService: ProductStoresService) {}

  @Get()
  findAll(@Query('isActive') isActive?: boolean) {
    return this.storesService.findAll(isActive);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.storesService.findById(id);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  create(@Body() dto: CreateProductStoreDto) {
    return this.storesService.create(dto);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateProductStoreDto) {
    return this.storesService.update(id, dto);
  }
}
