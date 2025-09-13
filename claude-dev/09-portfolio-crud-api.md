# Phase 2, Step 2: Portfolio CRUD API 實作

## 📋 概述

本文件為 `TODO 3.1` 和 `3.2` 提供詳細的實作指引。目標是建立一組完整的 RESTful API 端點，用於管理使用者的 `Portfolio` (投資組合)。

我們將會：

1.  建立 `PortfolioModule`, `PortfolioService`, `PortfolioController`。
2.  建立用於資料傳輸的 DTO (Data Transfer Objects)。
3.  實作 CRUD (Create, Read, Update, Delete) 的核心邏輯。
4.  整合 JWT 認證，確保使用者只能存取自己的投資組合。
5.  加上完整的 Swagger API 文件。

---

## 🏗️ 檔案結構

請在 `apps/Backend/src/portfolio` 資料夾中建立以下檔案和資料夾：

```
apps/Backend/src/portfolio/
├── controllers/                  # (新建資料夾)
│   └── portfolio.controller.ts   # (新建檔案)
├── dto/                          # (新建資料夾)
│   ├── create-portfolio.dto.ts   # (新建檔案)
│   ├── update-portfolio.dto.ts   # (新建檔案)
│   └── portfolio-response.dto.ts # (新建檔案)
├── services/                     # (新建資料夾)
│   └── portfolio.service.ts      # (新建檔案)
├── entities/
│   └── portfolio.entity.ts       # (已存在)
└── portfolio.module.ts           # (新建檔案)
```

---

## 💡 實作內容

### 1. DTO (Data Transfer Objects) 建立

#### a. `create-portfolio.dto.ts`

**檔案路徑**: `apps/Backend/src/portfolio/dto/create-portfolio.dto.ts`

```typescript
import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length, IsOptional, IsIn } from 'class-validator';

export class CreatePortfolioDto {
  @ApiProperty({
    description: '投資組合的名稱',
    example: '我的美股長期投資',
  })
  @IsString()
  @Length(1, 100, { message: '名稱長度必須介於 1 到 100 字之間' })
  name: string;

  @ApiProperty({
    description: '投資組合的詳細描述',
    example: '專注於科技股的長期增長型投資組合。',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: '投資組合的基礎貨幣，預設為 USD',
    example: 'TWD',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(3, 3, { message: '貨幣代碼必須為 3 個字元' })
  currency?: string;
}
```

#### b. `update-portfolio.dto.ts`

**檔案路徑**: `apps/Backend/src/portfolio/dto/update-portfolio.dto.ts`

```typescript
import { PartialType } from '@nestjs/swagger';
import { CreatePortfolioDto } from './create-portfolio.dto';

// UpdatePortfolioDto 繼承自 CreatePortfolioDto，但所有屬性都變為可選。
// PartialType 會自動處理 ApiProperty 和 class-validator 的繼承。
export class UpdatePortfolioDto extends PartialType(CreatePortfolioDto) {}
```

### 2. Portfolio Service 建立

**檔案路徑**: `apps/Backend/src/portfolio/services/portfolio.service.ts`

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Portfolio } from '../entities/portfolio.entity';
import { CreatePortfolioDto } from '../dto/create-portfolio.dto';
import { UpdatePortfolioDto } from '../dto/update-portfolio.dto';

@Injectable()
export class PortfolioService {
  constructor(
    @InjectRepository(Portfolio)
    private readonly portfolioRepository: Repository<Portfolio>
  ) {}

  // 建立新的投資組合
  async create(
    createPortfolioDto: CreatePortfolioDto,
    userId: string
  ): Promise<Portfolio> {
    const portfolio = this.portfolioRepository.create({
      ...createPortfolioDto,
      userId, // 將 portfolio 與使用者關聯
    });
    return this.portfolioRepository.save(portfolio);
  }

  // 查詢特定使用者的所有投資組合
  async findAllForUser(userId: string): Promise<Portfolio[]> {
    return this.portfolioRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' }, // 按創建時間降序排列
    });
  }

  // 查詢單一投資組合 (確保是屬於該使用者的)
  async findOne(id: string, userId: string): Promise<Portfolio> {
    const portfolio = await this.portfolioRepository.findOne({
      where: { id, userId },
    });
    if (!portfolio) {
      throw new NotFoundException(`找不到 ID 為 "${id}" 的投資組合`);
    }
    return portfolio;
  }

  // 更新投資組合
  async update(
    id: string,
    updatePortfolioDto: UpdatePortfolioDto,
    userId: string
  ): Promise<Portfolio> {
    // 先用 findOne 確保這個 portfolio 存在且屬於該使用者
    const portfolio = await this.findOne(id, userId);

    // 將更新的資料合併到現有實體
    this.portfolioRepository.merge(portfolio, updatePortfolioDto);

    return this.portfolioRepository.save(portfolio);
  }

  // 刪除投資組合
  async remove(id: string, userId: string): Promise<void> {
    const result = await this.portfolioRepository.delete({ id, userId });

    if (result.affected === 0) {
      throw new NotFoundException(`找不到 ID 為 "${id}" 的投資組合`);
    }
  }
}
```

### 3. Portfolio Controller 建立

**檔案路徑**: `apps/Backend/src/portfolio/controllers/portfolio.controller.ts`

```typescript
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';
import { PortfolioService } from '../services/portfolio.service';
import { CreatePortfolioDto } from '../dto/create-portfolio.dto';
import { UpdatePortfolioDto } from '../dto/update-portfolio.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('Portfolios') // Swagger UI 中的分組標籤
@ApiBearerAuth() // 在 Swagger UI 中標示這個 Controller 需要 JWT token
@UseGuards(JwtAuthGuard) // 使用我們之前建立的 JWT 守衛保護所有路由
@Controller('portfolios')
export class PortfolioController {
  constructor(private readonly portfolioService: PortfolioService) {}

  @Post()
  @ApiOperation({ summary: '建立新的投資組合' })
  @ApiResponse({ status: 201, description: '成功建立投資組合' })
  @ApiResponse({ status: 401, description: '未經授權' })
  create(@Body() createPortfolioDto: CreatePortfolioDto, @Request() req) {
    // 從 request 中解析出 JWT payload 裡的 userId
    const userId = req.user.sub;
    return this.portfolioService.create(createPortfolioDto, userId);
  }

  @Get()
  @ApiOperation({ summary: '取得目前使用者的所有投資組合' })
  @ApiResponse({ status: 200, description: '成功取得投資組合列表' })
  findAll(@Request() req) {
    const userId = req.user.sub;
    return this.portfolioService.findAllForUser(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: '取得單一投資組合的詳細資訊' })
  @ApiResponse({ status: 200, description: '成功取得投資組合資訊' })
  @ApiResponse({ status: 404, description: '找不到指定的投資組合' })
  findOne(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    const userId = req.user.sub;
    return this.portfolioService.findOne(id, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新指定的投資組合' })
  @ApiResponse({ status: 200, description: '成功更新投資組合' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePortfolioDto: UpdatePortfolioDto,
    @Request() req
  ) {
    const userId = req.user.sub;
    return this.portfolioService.update(id, updatePortfolioDto, userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: '刪除指定的投資組合' })
  @ApiResponse({ status: 204, description: '成功刪除投資組合' })
  remove(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    const userId = req.user.sub;
    return this.portfolioService.remove(id, userId);
  }
}
```

### 4. Portfolio Module 建立

**檔案路徑**: `apps/Backend/src/portfolio/portfolio.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Portfolio } from './entities/portfolio.entity';
import { PortfolioService } from './services/portfolio.service';
import { PortfolioController } from './controllers/portfolio.controller.ts';

@Module({
  imports: [
    TypeOrmModule.forFeature([Portfolio]), // 讓這個模組可以注入 Portfolio Repository
  ],
  controllers: [PortfolioController],
  providers: [PortfolioService],
})
export class PortfolioModule {}
```

### 5. 更新主 App Module

最後，我們需要將新建的 `PortfolioModule` 匯入到主模組 `app.module.ts` 中，這樣 NestJS 應用程式才能識別它。

**檔案路徑**: `apps/Backend/src/app.module.ts`

請在 `imports` 陣列中加入 `PortfolioModule`：

```typescript
// ... 其他 imports
import { PortfolioModule } from './portfolio/portfolio.module';

@Module({
  imports: [
    // ... 其他模組
    AuthModule, // 確保 AuthModule 在前面
    UserModule,
    StockModule,
    PortfolioModule, // <-- 在這裡加入
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

---

## ✅ 實作指引

1.  **建立檔案**: 根據上面的檔案結構，在 `src/portfolio` 資料夾下建立對應的檔案。
2.  **複製貼上**: 將每個檔案的程式碼複製並貼到對應的檔案中。
3.  **更新 `app.module.ts`**: 將 `PortfolioModule` 加入到 `AppModule` 的 `imports` 中。
4.  **啟動專案**: 執行 `pnpm dev`。
5.  **測試 API**:
    - 打開瀏覽器，訪問 `http://localhost:3000/api` (或您設定的 port)。
    - 您應該會在 Swagger UI 中看到一個新的 **Portfolios** 區塊。
    - 先使用 `auth/login` 取得 JWT token。
    - 點擊右上角的 `Authorize` 按鈕，貼上您的 token (格式: `Bearer your_token`)。
    - 現在您就可以測試 Portfolios 的所有 API 了！

當您完成以上步驟後，請通知我，我會檢查您的實作並更新 `TODO.md` 的狀態。
