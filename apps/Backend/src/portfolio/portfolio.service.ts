import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePortfolioDto } from './dto/create-portfolio.dto';
import { UpdatePortfolioDto } from './dto/update-portfolio.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Portfolio } from './entities/portfolio.entity';
import { Repository } from 'typeorm';

@Injectable()
export class PortfolioService {
  constructor(
    @InjectRepository(Portfolio)
    private readonly portfolioRepository: Repository<Portfolio>,
  ) {}

  create(
    createPortfolioDto: CreatePortfolioDto,
    userId: string,
  ): Promise<Portfolio> {
    const portfolio = this.portfolioRepository.create({
      ...createPortfolioDto,
      userId,
    }); // 建立物件 <- 不會和資料庫溝通
    return this.portfolioRepository.save(portfolio);
  }

  findAll(userId: string): Promise<Portfolio[]> {
    return this.portfolioRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, userId: string): Promise<Portfolio> {
    const portfolio = await this.portfolioRepository.findOne({
      where: { id, userId },
    });
    if (!portfolio) {
      throw new NotFoundException(`Portfolio with ID ${id} not found`);
    }
    return portfolio;
  }

  async update(
    id: string,
    updatePortfolioDto: UpdatePortfolioDto,
    userId: string,
  ) {
    const portfolio = await this.findOne(id, userId);

    // 避免前端只傳送部分欄位來，所以要 merge 補齊舊資料後再一起 save 回去 DB，否則 DB 內的資料會被清除掉。
    this.portfolioRepository.merge(portfolio, updatePortfolioDto);
    return this.portfolioRepository.save(portfolio);
  }

  async remove(id: string, userId: string): Promise<void> {
    const result = await this.portfolioRepository.delete({ id, userId });
    if (result.affected === 0) {
      throw new NotFoundException(`Portfolio with ID ${id} not found`);
    }
  }
}
