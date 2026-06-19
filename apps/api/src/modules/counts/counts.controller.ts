import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CountsService } from './counts.service';
import { Roles, CurrentUser } from '../../common/decorators';
import { RolesGuard } from '../../common/guards';
import { UserRole, CountStatus } from '@inventarioapp/shared';
import { CreateCountDto } from './dto/create-count.dto';
import { UpdateCountItemsDto } from './dto/update-count-items.dto';

@ApiTags('Counts')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('counts')
export class CountsController {
  constructor(private readonly countsService: CountsService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO, UserRole.CONSULTA)
  findAll(
    @CurrentUser() user: any,
    @Query('branchId') branchId?: string,
    @Query('status') status?: CountStatus,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('userId') userId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    // ENCARGADO can only see their own branch
    const effectiveBranchId =
      user.role === UserRole.ENCARGADO ? user.branchId : branchId;

    return this.countsService.findAll({
      branchId: effectiveBranchId,
      status,
      startDate,
      endDate,
      userId: user.role === UserRole.ENCARGADO ? user.id : userId,
      page,
      limit,
    });
  }

  @Get('current')
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO)
  findCurrentDraft(@CurrentUser() user: any) {
    return this.countsService.findCurrentDraft(user);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.countsService.findById(id);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO)
  create(@CurrentUser() user: any, @Body() dto: CreateCountDto) {
    return this.countsService.create(user, dto.notes);
  }

  @Patch(':id/items')
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO)
  updateItems(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() dto: UpdateCountItemsDto,
  ) {
    return this.countsService.updateItems(id, dto.items, user);
  }

  @Post(':id/finalize')
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO)
  finalize(@Param('id') id: string, @CurrentUser() user: any) {
    return this.countsService.finalize(id, user);
  }
}
