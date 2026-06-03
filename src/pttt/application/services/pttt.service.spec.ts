import { Test, TestingModule } from '@nestjs/testing';
import { PtttService } from './pttt.service';

describe('PtttService', () => {
  let service: PtttService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PtttService],
    }).compile();

    service = module.get<PtttService>(PtttService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
