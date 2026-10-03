import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ItemsService } from './items.service';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ItemStatus, ItemType, Priority } from '@lifedesk/types';

@UseGuards(JwtAuthGuard)
@Controller('items')
export class ItemsController {
  constructor(private itemsService: ItemsService) {}

  @Post()
  create(@CurrentUser('id') userId: string, @Body() dto: CreateItemDto) {
    return this.itemsService.create(userId, dto);
  }

  @Get()
  findAll(
    @CurrentUser('id') userId: string,
    @Query('status') status?: ItemStatus,
    @Query('type') type?: ItemType,
    @Query('priority') priority?: Priority,
    @Query('categoryId') categoryId?: string,
    @Query('timeframe') timeframe?: 'overdue' | 'today' | 'upcoming' | 'completed' | 'all',
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.itemsService.findAll(userId, {
      status,
      type,
      priority,
      categoryId,
      timeframe,
      search,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      startDate,
      endDate,
    });
  }

  @Get(':id')
  findOne(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.itemsService.findOne(userId, id);
  }

  @Patch(':id')
  update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateItemDto,
  ) {
    return this.itemsService.update(userId, id, dto);
  }

  @Post(':id/complete')
  complete(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.itemsService.complete(userId, id);
  }

  @Delete(':id')
  remove(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.itemsService.remove(userId, id);
  }
}
