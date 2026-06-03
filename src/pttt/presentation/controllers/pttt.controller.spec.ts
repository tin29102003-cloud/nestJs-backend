import { Test, TestingModule } from '@nestjs/testing';
import { PtttController } from './pttt.controller';

describe('PtttController', () => {
  let controller: PtttController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PtttController],
    }).compile();

    controller = module.get<PtttController>(PtttController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
