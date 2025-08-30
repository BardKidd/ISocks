import { Test, TestingModule } from '@nestjs/testing';
import { StockController } from '../controllers/stock.controller';
import { AlphaVantageService } from '../services/alpha-vantage.service';

describe('StockController (Simplified)', () => {
  let controller: StockController;

  const mockAlphaVantageService = {
    searchStocks: jest.fn(),
    getStockPrice: jest.fn(),
    getCurrentQuote: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StockController],
      providers: [
        {
          provide: AlphaVantageService,
          useValue: mockAlphaVantageService,
        },
      ],
    }).compile();

    controller = module.get<StockController>(StockController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('基本功能測試', () => {
    it('controller 應該被定義', () => {
      expect(controller).toBeDefined();
    });

    it('應該有 searchStocks 方法', () => {
      expect(typeof controller.searchStocks).toBe('function');
    });

    it('應該有 getStockPrice 方法', () => {
      expect(typeof controller.getStockPrice).toBe('function');
    });

    it('應該有 getCurrentStockPrice 方法', () => {
      expect(typeof controller.getCurrentStockPrice).toBe('function');
    });

    it('AlphaVantageService 應該被正確注入', () => {
      expect(mockAlphaVantageService.searchStocks).toBeDefined();
      expect(mockAlphaVantageService.getStockPrice).toBeDefined();
      expect(mockAlphaVantageService.getCurrentQuote).toBeDefined();
    });
  });
});