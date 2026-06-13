import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';

import { BANNER_REPOSITORY_INTERFACE, BannerRepositoryInterface } from 'src/banner/domain/interface/banner.interface';
import { IStorageService, STORAGE_SERVICE } from 'src/common/storage/domain/interfaces/storage.interface';
import { Banner } from 'src/banner/domain/entities/banner.entity';
import { SortOrder } from 'src/common/constants/user.constaint';
import { CreateBannerDto, UpdateBannerDto } from 'src/banner/presentation/dto/banner.dto';
import { BannerPositionType } from 'src/common/constants/banner.constaint';
import { BannerService } from 'src/banner/application/services/banner.service';

// ─── Factories dữ liệu mẫu ──────────────────────────────────────────────────

const makeBanner = (override: Partial<Banner> = {}): Banner =>
  ({
    id: 1,
    name: 'Banner A',
    url: 'https://example.com',
    img: 'uploads/banner-a.jpg',
    vi_tri: BannerPositionType.HOME_MIDDLE,
    an_hien: true,
    stt: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...override,
  } as Banner);

const makeFile = (): Express.Multer.File =>
  ({
    fieldname: 'img',
    originalname: 'test.jpg',
    mimetype: 'image/jpeg',
    buffer: Buffer.from(''),
    size: 1024,
  } as Express.Multer.File);

const dtoCreateFactory = (override: Partial<CreateBannerDto> = {}): CreateBannerDto =>
  ({ name: 'Banner A', url: 'https://x.com', vi_tri: BannerPositionType.HOME_MIDDLE, an_hien: true, ...override });

const dtoUpdateFactory = (override: Partial<UpdateBannerDto> = {}): UpdateBannerDto =>
  ({ name: 'Banner A', url: 'https://example.com', vi_tri: BannerPositionType.HOME_MIDDLE, an_hien: true, stt: 1, ...override });

// ─── Typed mocks ─────────────────────────────────────────────────────────────

type MockBannerRepository = { [K in keyof BannerRepositoryInterface]: jest.Mock };
type MockStorageService   = { [K in keyof IStorageService]: jest.Mock };

const mockBannerRepository = (): MockBannerRepository => ({
  findBannerById: jest.fn(),
  createBanner: jest.fn(),
  updateBannerBy: jest.fn(),
  deleteBanner: jest.fn(),
  searchBanner: jest.fn(),
  findBannerBy: jest.fn(),
  findAndCountBannerBy: jest.fn(),
  getMaxValueOfField: jest.fn(),
  incrementField: jest.fn(),
  adjustOrderInRange: jest.fn(),
  findBannerByExceptId: jest.fn(),
  executeTransaction: jest.fn(),
  adjustOrderWithTransaction: jest.fn(),
});

const mockStorageService = (): MockStorageService => ({
  saveFile: jest.fn(),
deleteFile: jest.fn().mockResolvedValue(undefined),//đẻ catch hoạt động bình thung
deleteManyFile: jest.fn()
});

// ─── Suite ───────────────────────────────────────────────────────────────────

describe('BannerService', () => {
  let service: BannerService;
  let bannerRepo: ReturnType<typeof mockBannerRepository>;
  let storageService: ReturnType<typeof mockStorageService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BannerService,
        { provide: BANNER_REPOSITORY_INTERFACE, useFactory: mockBannerRepository },
        { provide: STORAGE_SERVICE,             useFactory: mockStorageService   },
      ],
    }).compile();

    service       = module.get<BannerService>(BannerService);
    bannerRepo    = module.get(BANNER_REPOSITORY_INTERFACE);
    storageService = module.get(STORAGE_SERVICE);
  });

  afterEach(() => jest.clearAllMocks());

  // ─── Arrange helpers dùng chung ──────────────────────────────────────────
  // Những đoạn setup lặp >= 3 lần trong updateBannerAdmin được tách ra đây,
  // giống cách service tách applyOrderShift / rollbackImage / generateNextOrder.

  /** Banner tồn tại + name không trùng → sẵn sàng update */
  const arrangeUpdateReady = (bannerOverride: Partial<Banner> = {}) => {
    const banner = makeBanner(bannerOverride);
    bannerRepo.findBannerById.mockResolvedValue(banner);
    bannerRepo.findBannerByExceptId.mockResolvedValue(null);
    return banner;
  };

  /** Transaction pass-through: chạy callback ngay với object {} làm tx */
  const arrangeTransactionOk = () => {
    bannerRepo.executeTransaction.mockImplementation(async (cb: (tx: unknown) => Promise<unknown>) => cb({}));
  };

  /**
   * findBannerById trả về 2 giá trị theo thứ tự:
   *   lần 1 (initial fetch) → oldBanner
   *   lần 2 (final fetch)   → updatedBanner
   */
  const arrangeFindBannerSequence = (oldBanner: Banner, updatedBanner: Banner) => {
    bannerRepo.findBannerById
      .mockResolvedValueOnce(oldBanner)
      .mockResolvedValueOnce(updatedBanner);
  };

  /** Xác nhận create banner không gọi storage và không chạy transaction */
  const assertNoSideEffects = () => {
    expect(storageService.saveFile).not.toHaveBeenCalled();
    expect(bannerRepo.executeTransaction).not.toHaveBeenCalled();
  };

  // ── FindAllBanner ──────────────────────────────────────────────────────────

  describe('FindAllBanner', () => {
    it('should return paginated banners without keyword', async () => {
      // Arrange
      const rows = [makeBanner()];
      bannerRepo.findAndCountBannerBy.mockResolvedValue({ rows, count: 1 });

      // Act
      const result = await service.FindAllBanner(undefined, '1', '10');

      // Assert
      expect(bannerRepo.findAndCountBannerBy).toHaveBeenCalledWith(10, 0, [['createdAt', SortOrder.DESC]]);
      expect(result.data).toEqual(rows);
      expect(result.pagination).toEqual({ currentPage: 1, limit: 10, totalItems: 1, totalPages: 1 });
    });

    it('should call searchBanner when keyword is provided', async () => {
      // Arrange
      const rows = [makeBanner()];
      bannerRepo.searchBanner.mockResolvedValue({ rows, count: 1 });

      // Act
      const result = await service.FindAllBanner('sale', '1', '5');

      // Assert
      expect(bannerRepo.searchBanner).toHaveBeenCalledWith('sale', 5, 0);
      expect(bannerRepo.findAndCountBannerBy).not.toHaveBeenCalled();
      expect(result.data).toEqual(rows);
    });

    it('should use default page=1 and limit=10 when params are omitted', async () => {
      // Arrange
      bannerRepo.findAndCountBannerBy.mockResolvedValue({ rows: [], count: 0 });

      // Act
      await service.FindAllBanner();

      // Assert
      expect(bannerRepo.findAndCountBannerBy).toHaveBeenCalledWith(10, 0, [['createdAt', SortOrder.DESC]]);
    });

    it('should calculate correct offset for page 3 with limit 10', async () => {
      // Arrange
      bannerRepo.findAndCountBannerBy.mockResolvedValue({ rows: [], count: 50 });

      // Act
      await service.FindAllBanner(undefined, '3', '10');

      // Assert
      expect(bannerRepo.findAndCountBannerBy).toHaveBeenCalledWith(10, 20, [['createdAt', SortOrder.DESC]]);
    });

    it('should clamp page to 1 for negative input', async () => {
      // Arrange
      bannerRepo.findAndCountBannerBy.mockResolvedValue({ rows: [], count: 0 });

      // Act
      await service.FindAllBanner(undefined, '-5', '10');

      // Assert
      expect(bannerRepo.findAndCountBannerBy).toHaveBeenCalledWith(10, 0, [['createdAt', SortOrder.DESC]]);
    });

    it('should fallback to maxLimit when limit is zero', async () => {
      // Arrange
      bannerRepo.findAndCountBannerBy.mockResolvedValue({ rows: [], count: 0 });

      // Act
      await service.FindAllBanner(undefined, '1', '0');

      // Assert
      expect(bannerRepo.findAndCountBannerBy).toHaveBeenCalledWith(10, 0, [['createdAt', SortOrder.DESC]]);
    });
  });

  // ── FindOneBannerById ──────────────────────────────────────────────────────

  describe('FindOneBannerById', () => {
    it('should return banner when found', async () => {
      // Arrange
      const banner = makeBanner();
      bannerRepo.findBannerById.mockResolvedValue(banner);

      // Act & Assert
      await expect(service.FindOneBannerById(1)).resolves.toEqual(banner);
      expect(bannerRepo.findBannerById).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException when banner does not exist', async () => {
      // Arrange
      bannerRepo.findBannerById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.FindOneBannerById(99)).rejects.toThrow(NotFoundException);
    });
  });

  // ── createBannerAdmin ──────────────────────────────────────────────────────

  describe('createBannerAdmin', () => {
    const dto = dtoCreateFactory();

    it('should throw BadRequestException when file is not provided', async () => {
      // Act & Assert
      await expect(
        service.createBannerAdmin(dto, 'img', undefined),
      ).rejects.toThrow(BadRequestException);
      expect(bannerRepo.findBannerBy).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when banner name already exists', async () => {
      // Arrange
      bannerRepo.findBannerBy.mockResolvedValue(makeBanner());

      // Act & Assert
      await expect(
        service.createBannerAdmin(dto, 'img', makeFile()),
      ).rejects.toThrow(ConflictException);
      expect(storageService.saveFile).not.toHaveBeenCalled();
    });

    it('should create banner with stt = maxOrder + 1', async () => {
      // Arrange
      bannerRepo.findBannerBy.mockResolvedValue(null);
      bannerRepo.getMaxValueOfField.mockResolvedValue(3);
      storageService.saveFile.mockResolvedValue('uploads/new.jpg');
      const created = makeBanner({ stt: 4, img: 'uploads/new.jpg' });
      bannerRepo.createBanner.mockResolvedValue(created);

      // Act
      const result = await service.createBannerAdmin(dto, 'img', makeFile());

      // Assert
      expect(bannerRepo.createBanner).toHaveBeenCalledWith(
        expect.objectContaining({ stt: 4, img: 'uploads/new.jpg', name: 'Banner A' }),
      );
      expect(result).toEqual(created);
    });

    it('should set stt = 1 when no banners exist yet (maxOrder = null)', async () => {
      // Arrange
      bannerRepo.findBannerBy.mockResolvedValue(null);
      bannerRepo.getMaxValueOfField.mockResolvedValue(null);
      storageService.saveFile.mockResolvedValue('uploads/first.jpg');
      bannerRepo.createBanner.mockResolvedValue(makeBanner({ stt: 1 }));

      // Act
      await service.createBannerAdmin(dto, 'img', makeFile());

      // Assert
      expect(bannerRepo.createBanner).toHaveBeenCalledWith(
        expect.objectContaining({ stt: 1 }),
      );
    });

    it('should rollback uploaded image if createBanner throws', async () => {
      // Arrange
      bannerRepo.findBannerBy.mockResolvedValue(null);
      bannerRepo.getMaxValueOfField.mockResolvedValue(0);
      storageService.saveFile.mockResolvedValue('uploads/bad.jpg');
      bannerRepo.createBanner.mockRejectedValue(new Error('DB error'));

      // Act & Assert
      await expect(
        service.createBannerAdmin(dto, 'img', makeFile()),
      ).rejects.toThrow('DB error');
      expect(storageService.deleteFile).toHaveBeenCalledWith('uploads/bad.jpg');
    });

    it('should NOT call rollbackImage if saveFile itself throws', async () => {
      // Arrange
      bannerRepo.findBannerBy.mockResolvedValue(null);
      bannerRepo.getMaxValueOfField.mockResolvedValue(0);
      storageService.saveFile.mockRejectedValue(new Error('Storage down'));

      // Act & Assert
      await expect(
        service.createBannerAdmin(dto, 'img', makeFile()),
      ).rejects.toThrow('Storage down');
      // hinhUrl vẫn là null → rollbackImage thoát sớm
      expect(storageService.deleteFile).not.toHaveBeenCalled();
    });
  });

  // ── updateBannerAdmin ──────────────────────────────────────────────────────

  describe('updateBannerAdmin', () => {
    // dto khớp hoàn toàn với makeBanner() defaults → không có gì thay đổi
    const sameDto = dtoUpdateFactory();

    it('should throw NotFoundException when banner does not exist', async () => {
      // Arrange
      bannerRepo.findBannerById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.updateBannerAdmin(99, sameDto, 'img'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when new name belongs to another banner', async () => {
      // Arrange
      bannerRepo.findBannerById.mockResolvedValue(makeBanner({ name: 'Old Name' }));
      bannerRepo.findBannerByExceptId.mockResolvedValue(makeBanner({ id: 2, name: 'Banner A' }));

      // Act & Assert
      await expect(
        service.updateBannerAdmin(1, sameDto, 'img'),
      ).rejects.toThrow(ConflictException);
      expect(storageService.saveFile).not.toHaveBeenCalled();
    });

    it('should return { update: false } without touching DB when nothing changed', async () => {
      // Arrange
      const banner = makeBanner();
      bannerRepo.findBannerById.mockResolvedValue(banner);

      // Act
      const result = await service.updateBannerAdmin(1, sameDto, 'img', undefined);

      // Assert
      expect(result).toEqual({ update: false, banner });
      assertNoSideEffects();
    });

    it('should update changed fields and return updated banner', async () => {
      // Arrange
      const oldBanner     = makeBanner({ name: 'Old Name', url: 'https://old.com' });
      const updatedBanner = makeBanner({ name: 'Banner A', url: 'https://x.com' });
      arrangeFindBannerSequence(oldBanner, updatedBanner);
      bannerRepo.findBannerByExceptId.mockResolvedValue(null);
      arrangeTransactionOk();

      // Act
      const dto    = dtoUpdateFactory({ url: 'https://x.com' });
      const result = await service.updateBannerAdmin(1, dto, 'img');

      // Assert
      expect(bannerRepo.executeTransaction).toHaveBeenCalled();
      expect(result).toEqual({ update: true, banner: updatedBanner });
    });

    // ── stt / order shifting ────────────────────────────────────────────────

    it('should shift order DOWN (-1) when new stt > old stt', async () => {
      // Arrange
      arrangeUpdateReady({ stt: 1 });
      arrangeTransactionOk();

      // Act
      await service.updateBannerAdmin(1, dtoUpdateFactory({ stt: 4 }), 'img');

      // Assert
      expect(bannerRepo.adjustOrderInRange).toHaveBeenCalledWith(-1, { gt: 1, lte: 4 }, {});
    });

    it('should shift order UP (+1) when new stt < old stt', async () => {
      // Arrange
      arrangeUpdateReady({ stt: 5 });
      arrangeTransactionOk();

      // Act
      await service.updateBannerAdmin(1, dtoUpdateFactory({ stt: 2 }), 'img');

      // Assert
      expect(bannerRepo.adjustOrderInRange).toHaveBeenCalledWith(+1, { gte: 2, lt: 5 }, {});
    });

    it('should NOT call adjustOrderInRange when stt does not change', async () => {
      // Arrange — chỉ url thay đổi, stt giữ nguyên = 1
      const oldBanner     = makeBanner({ url: 'https://old.com' });
      const updatedBanner = makeBanner();
      arrangeFindBannerSequence(oldBanner, updatedBanner);
      bannerRepo.findBannerByExceptId.mockResolvedValue(null);
      arrangeTransactionOk();

      // Act
      await service.updateBannerAdmin(1, dtoUpdateFactory({ url: 'https://new.com' }), 'img');

      // Assert
      expect(bannerRepo.adjustOrderInRange).not.toHaveBeenCalled();
    });

    // ── file handling ───────────────────────────────────────────────────────

    it('should save new image, update banner, then delete old image', async () => {
      // Arrange
      const oldBanner     = makeBanner({ img: 'uploads/old.jpg', url: 'https://old.com' });
      const updatedBanner = makeBanner({ img: 'uploads/new.jpg' });
      arrangeFindBannerSequence(oldBanner, updatedBanner);
      bannerRepo.findBannerByExceptId.mockResolvedValue(null);
      storageService.saveFile.mockResolvedValue('uploads/new.jpg');
      arrangeTransactionOk();

      // Act
      const result = await service.updateBannerAdmin(
        1, dtoUpdateFactory({ url: 'https://new.com' }), 'img', makeFile(),
      );

      // Assert
      expect(storageService.saveFile).toHaveBeenCalled();
      expect(storageService.deleteManyFile).toHaveBeenCalledWith(['uploads/old.jpg']);
      expect(result.update).toBe(true);
    });

    it('should skip deleteManyFile when banner had no previous image', async () => {
      // Arrange
      const oldBanner     = makeBanner({ img: undefined, url: 'https://old.com' });
      const updatedBanner = makeBanner();
      arrangeFindBannerSequence(oldBanner, updatedBanner);
      bannerRepo.findBannerByExceptId.mockResolvedValue(null);
      storageService.saveFile.mockResolvedValue('uploads/new.jpg');
      arrangeTransactionOk();

      // Act
      await service.updateBannerAdmin(
        1, dtoUpdateFactory({ url: 'https://new.com' }), 'img', makeFile(),
      );

      // Assert
      expect(storageService.deleteManyFile).not.toHaveBeenCalled();
    });

    it('should rollback new image if transaction throws', async () => {
      // Arrange
      arrangeUpdateReady({ img: 'uploads/old.jpg', url: 'https://old.com' });
      storageService.saveFile.mockResolvedValue('uploads/new.jpg');
      bannerRepo.executeTransaction.mockRejectedValue(new Error('TX failed'));

      // Act & Assert
      await expect(
        service.updateBannerAdmin(
          1, dtoUpdateFactory({ url: 'https://new.com' }), 'img', makeFile(),
        ),
      ).rejects.toThrow('TX failed');
      expect(storageService.deleteFile).toHaveBeenCalledWith('uploads/new.jpg');
    });
  });

  // ── deleteBannerAdmin ──────────────────────────────────────────────────────

  describe('deleteBannerAdmin', () => {
    it('should throw NotFoundException when banner does not exist', async () => {
      // Arrange
      bannerRepo.findBannerById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.deleteBannerAdmin(99)).rejects.toThrow(NotFoundException);
    });

    it('should run adjustOrderInRange and deleteBanner inside a transaction', async () => {
      // Arrange
      const banner = makeBanner({ stt: 3 });
      bannerRepo.findBannerById.mockResolvedValue(banner);
      arrangeTransactionOk();

      // Act
      await service.deleteBannerAdmin(1);

      // Assert
      expect(bannerRepo.adjustOrderInRange).toHaveBeenCalledWith(-1, { gt: 3 }, {});
      expect(bannerRepo.deleteBanner).toHaveBeenCalledWith({ id: 1 }, {});
    });

    it('should delete banner image after successful deletion', async () => {
      // Arrange
      const banner = makeBanner({ img: 'uploads/to-delete.jpg' });
      bannerRepo.findBannerById.mockResolvedValue(banner);
      arrangeTransactionOk();

      // Act
      await service.deleteBannerAdmin(1);

      // Assert
      expect(storageService.deleteFile).toHaveBeenCalledWith('uploads/to-delete.jpg');
    });

    it('should NOT throw even if deleteFile fails (graceful warn only)', async () => {
      // Arrange
      const banner = makeBanner({ img: 'uploads/ghost.jpg' });
      bannerRepo.findBannerById.mockResolvedValue(banner);
      arrangeTransactionOk();
      storageService.deleteFile.mockRejectedValue(new Error('Storage unavailable'));

      // Act & Assert
      await expect(service.deleteBannerAdmin(1)).resolves.not.toThrow();
    });

    it('should skip deleteFile when banner has no img', async () => {
      // Arrange
      const banner = makeBanner({ img: undefined });
      bannerRepo.findBannerById.mockResolvedValue(banner);
      arrangeTransactionOk();

      // Act
      await service.deleteBannerAdmin(1);

      // Assert
      expect(storageService.deleteFile).not.toHaveBeenCalled();
    });
  });
});