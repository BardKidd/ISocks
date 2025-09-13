import { PartialType } from '@nestjs/swagger';
import { CreatePortfolioDto } from './create-portfolio.dto';

// 這個 DTO 直接繼承 CreatePortfolio 的屬性，且都變成可選。
export class UpdatePortfolioDto extends PartialType(CreatePortfolioDto) {}
