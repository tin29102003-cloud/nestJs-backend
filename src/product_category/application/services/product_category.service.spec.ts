import { Test, TestingModule } from '@nestjs/testing';
import { ProductCaategoryService } from './product_category.service';

describe('ProductCaategoryService', () => {
  let service: ProductCaategoryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProductCaategoryService],
    }).compile();

    service = module.get<ProductCaategoryService>(ProductCaategoryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
