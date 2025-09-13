import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';
import { PortfolioService } from './portfolio.service';
import { CreatePortfolioDto } from './dto/create-portfolio.dto';
import { UpdatePortfolioDto } from './dto/update-portfolio.dto';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller('portfolio')
export class PortfolioController {
  constructor(private readonly portfolioService: PortfolioService) {}

  @Post()
  @ApiOperation({ summary: '建立新的投資組合' })
  @ApiResponse({ status: 201, description: '成功建立投資組合' })
  @ApiResponse({ status: 401, description: '未經授權' })
  create(
    @Body() createPortfolioDto: CreatePortfolioDto,
    @Request() req: { user: { sub: string } },
  ) {
    const userId = req.user.sub;
    return this.portfolioService.create(createPortfolioDto, userId);
  }

  @Get()
  @ApiOperation({ summary: '取得目前使用者的所有投資組合' })
  @ApiResponse({ status: 200, description: '成功取得投資組合列表' })
  findAll(@Request() req: { user: { sub: string } }) {
    const userId = req.user.sub;
    return this.portfolioService.findAll(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: '取得單一投資組合的詳細資訊' })
  @ApiResponse({ status: 200, description: '成功取得投資組合資訊' })
  @ApiResponse({ status: 404, description: '找不到指定的投資組合' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: { user: { sub: string } },
  ) {
    const userId = req.user.sub;
    return this.portfolioService.findOne(id, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新指定的投資組合' })
  @ApiResponse({ status: 200, description: '成功更新投資組合' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePortfolioDto: UpdatePortfolioDto,
    @Request() req: { user: { sub: string } },
  ) {
    const userId = req.user.sub;
    return this.portfolioService.update(id, updatePortfolioDto, userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: '刪除指定的投資組合' })
  @ApiResponse({ status: 204, description: '成功刪除投資組合' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: { user: { sub: string } },
  ) {
    const userId = req.user.sub;
    return this.portfolioService.remove(id, userId);
  }
}
