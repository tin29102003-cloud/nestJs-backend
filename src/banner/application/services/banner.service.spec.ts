import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { BannerService } from './banner.service';
import { BANNER_REPOSITORY_INTERFACE } from 'src/banner/domain/interface/banner.interface';
import { STORAGE_SERVICE } from 'src/common/storage/domain/interfaces/storage.interface';
import { Banner } from 'src/banner/domain/entities/banner.entity';
import { SortOrder } from 'src/common/constants/user.constaint';
import { CreateBannerDto, UpdateBannerDto } from 'src/banner/presentation/dto/banner.dto';
import { BannerPositionType } from 'src/common/constants/banner.constaint';


// ─── Helpers ────────────────────────────────────────────────────────────────
//dữ liệu mãu để tạo test
const makeBanner = (override: Partial<Banner> = {}): Banner =>
  ({
    id: 1,
    name: 'Banner A',
    url: 'https://example.com',
    img: 'uploads/banner-a.jpg',
    vi_tri: 1,
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

// ─── Mocks ───────────────────────────────────────────────────────────────────

const mockBannerRepository = () => ({
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
});

const mockStorageService = () => ({
  saveFile: jest.fn(),
  deleteFile: jest.fn(),
  deleteManyFile: jest.fn(),
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
        { provide: STORAGE_SERVICE, useFactory: mockStorageService },
      ],
    }).compile();

    service = module.get<BannerService>(BannerService);
    bannerRepo = module.get(BANNER_REPOSITORY_INTERFACE);
    storageService = module.get(STORAGE_SERVICE);
  });

  afterEach(() => jest.clearAllMocks());

  // ── FindAllBanner ──────────────────────────────────────────────────────────

  describe('FindAllBanner', () => {
    it('should return paginated banners without keyword', async () => {
      const rows = [makeBanner()];
      bannerRepo.findAndCountBannerBy.mockResolvedValue({ rows, count: 1 });

      const result = await service.FindAllBanner(undefined, '1', '10');

      expect(bannerRepo.findAndCountBannerBy).toHaveBeenCalledWith(
        10, 0, [['createdAt', SortOrder.DESC]],
      );
      expect(result.data).toEqual(rows);
      expect(result.pagination).toEqual({
        currentPage: 1,
        limit: 10,
        totalItems: 1,
        totalPages: 1,
      });
    });

    it('should call searchBanner when keyword is provided', async () => {
      const rows = [makeBanner()];
      bannerRepo.searchBanner.mockResolvedValue({ rows, count: 1 });

      const result = await service.FindAllBanner('sale', '1', '5');

      expect(bannerRepo.searchBanner).toHaveBeenCalledWith('sale', 5, 0);
      expect(bannerRepo.findAndCountBannerBy).not.toHaveBeenCalled();
      expect(result.data).toEqual(rows);
    });

    it('should use default page=1 and limit=10 when params are omitted', async () => {
      bannerRepo.findAndCountBannerBy.mockResolvedValue({ rows: [], count: 0 });

      await service.FindAllBanner();

      expect(bannerRepo.findAndCountBannerBy).toHaveBeenCalledWith(
        10, 0, [['createdAt', SortOrder.DESC]],
      );
    });

    it('should calculate correct offset for page 3 with limit 10', async () => {
      bannerRepo.findAndCountBannerBy.mockResolvedValue({ rows: [], count: 50 });

      await service.FindAllBanner(undefined, '3', '10');

      expect(bannerRepo.findAndCountBannerBy).toHaveBeenCalledWith(
        10, 20, [['createdAt', SortOrder.DESC]],
      );
    });

    it('should clamp page to 1 for negative input', async () => {
      bannerRepo.findAndCountBannerBy.mockResolvedValue({ rows: [], count: 0 });

      await service.FindAllBanner(undefined, '-5', '10');

      expect(bannerRepo.findAndCountBannerBy).toHaveBeenCalledWith(
        10, 0, [['createdAt', SortOrder.DESC]],
      );
    });

    it('should clamp limit to 1 for zero input', async () => {
      bannerRepo.findAndCountBannerBy.mockResolvedValue({ rows: [], count: 0 });

      await service.FindAllBanner(undefined, '1', '0');

      expect(bannerRepo.findAndCountBannerBy).toHaveBeenCalledWith(
        1, 0, [['createdAt', SortOrder.DESC]],
      );
    });
  });

  // ── FindOneBannerById ──────────────────────────────────────────────────────

  describe('FindOneBannerById', () => {
    it('should return banner when found', async () => {
      const banner = makeBanner();
      bannerRepo.findBannerById.mockResolvedValue(banner);

      await expect(service.FindOneBannerById(1)).resolves.toEqual(banner);
      expect(bannerRepo.findBannerById).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException when banner does not exist', async () => {
      bannerRepo.findBannerById.mockResolvedValue(null);

      await expect(service.FindOneBannerById(99)).rejects.toThrow(NotFoundException);
    });
  });

  // ── createBannerAdmin ──────────────────────────────────────────────────────

  describe('createBannerAdmin', () => {
    const dto = { name: 'Banner A', url: 'https://x.com', vi_tri: BannerPositionType.HOME_MIDDLE, an_hien: true };

    it('should throw BadRequestException when file is not provided', async () => {
      await expect(
        service.createBannerAdmin(dto as CreateBannerDto, 'img', undefined),
      ).rejects.toThrow(BadRequestException);

      // should not touch DB at all
      expect(bannerRepo.findBannerBy).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when banner name already exists', async () => {
      bannerRepo.findBannerBy.mockResolvedValue(makeBanner());

      await expect(
        service.createBannerAdmin(dto as CreateBannerDto, 'img', makeFile() as any),
      ).rejects.toThrow(ConflictException);

      expect(storageService.saveFile).not.toHaveBeenCalled();
    });

    it('should create banner with stt = maxOrder + 1', async () => {
      bannerRepo.findBannerBy.mockResolvedValue(null);
      bannerRepo.getMaxValueOfField.mockResolvedValue(3);
      storageService.saveFile.mockResolvedValue('uploads/new.jpg');
      const created = makeBanner({ stt: 4, img: 'uploads/new.jpg' });
      bannerRepo.createBanner.mockResolvedValue(created);

      const result = await service.createBannerAdmin(dto as CreateBannerDto, 'img', makeFile() as any);

      expect(bannerRepo.createBanner).toHaveBeenCalledWith(
        expect.objectContaining({ stt: 4, img: 'uploads/new.jpg', name: 'Banner A' }),
      );
      expect(result).toEqual(created);
    });

    it('should set stt = 1 when no banners exist yet (maxOrder = null)', async () => {
      bannerRepo.findBannerBy.mockResolvedValue(null);
      bannerRepo.getMaxValueOfField.mockResolvedValue(null);
      storageService.saveFile.mockResolvedValue('uploads/first.jpg');
      bannerRepo.createBanner.mockResolvedValue(makeBanner({ stt: 1 }));

      await service.createBannerAdmin(dto as CreateBannerDto, 'img', makeFile() as any);

      expect(bannerRepo.createBanner).toHaveBeenCalledWith(
        expect.objectContaining({ stt: 1 }),
      );
    });

    it('should rollback uploaded image if createBanner throws', async () => {
      bannerRepo.findBannerBy.mockResolvedValue(null);
      bannerRepo.getMaxValueOfField.mockResolvedValue(0);
      storageService.saveFile.mockResolvedValue('uploads/bad.jpg');
      bannerRepo.createBanner.mockRejectedValue(new Error('DB error'));
      storageService.deleteFile.mockResolvedValue(undefined);

      await expect(
        service.createBannerAdmin(dto as CreateBannerDto, 'img', makeFile() as any),
      ).rejects.toThrow('DB error');

      expect(storageService.deleteFile).toHaveBeenCalledWith('uploads/bad.jpg');
    });

    it('should NOT call rollbackImage if saveFile itself throws', async () => {
      bannerRepo.findBannerBy.mockResolvedValue(null);
      bannerRepo.getMaxValueOfField.mockResolvedValue(0);
      storageService.saveFile.mockRejectedValue(new Error('Storage down'));
      storageService.deleteFile.mockResolvedValue(undefined);

      await expect(
        service.createBannerAdmin(dto as CreateBannerDto, 'img', makeFile() as any),
      ).rejects.toThrow('Storage down');

      // hinhUrl is still null → rollbackImage exits early
      expect(storageService.deleteFile).not.toHaveBeenCalled();
    });
  });

  // ── updateBannerAdmin ──────────────────────────────────────────────────────

  describe('updateBannerAdmin', () => {
    // dto matches banner defaults → nothing changes
    const sameDto = { name: 'Banner A', url: 'https://example.com', vi_tri: BannerPositionType.HOME_MIDDLE, an_hien: true, stt: 1 };

    it('should throw NotFoundException when banner does not exist', async () => {
      bannerRepo.findBannerById.mockResolvedValue(null);

      await expect(
        service.updateBannerAdmin(99, sameDto as UpdateBannerDto, 'img'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when new name belongs to another banner', async () => {
      bannerRepo.findBannerById.mockResolvedValue(makeBanner({ name: 'Old Name' }));
      bannerRepo.findBannerByExceptId.mockResolvedValue(makeBanner({ id: 2, name: 'Banner A' }));

      await expect(
        service.updateBannerAdmin(1, sameDto as UpdateBannerDto, 'img'),
      ).rejects.toThrow(ConflictException);

      expect(storageService.saveFile).not.toHaveBeenCalled();
    });

    it('should return { update: false } without touching DB when nothing changed', async () => {
      const banner = makeBanner();
      bannerRepo.findBannerById.mockResolvedValue(banner);

      const result = await service.updateBannerAdmin(1, sameDto as UpdateBannerDto, 'img', undefined);

      expect(result).toEqual({ update: false, banner });
      expect(bannerRepo.executeTransaction).not.toHaveBeenCalled();
      expect(storageService.saveFile).not.toHaveBeenCalled();
    });

    it('should update changed fields and return updated banner', async () => {
      const banner = makeBanner({ name: 'Old Name', url: 'https://old.com' });
      const updated = makeBanner({ name: 'Banner A', url: 'https://x.com' });
      bannerRepo.findBannerById
        .mockResolvedValueOnce(banner)   // initial fetch
        .mockResolvedValueOnce(updated); // final fetch after update
      bannerRepo.findBannerByExceptId.mockResolvedValue(null);
      bannerRepo.executeTransaction.mockImplementation(async (cb: any) => cb({}));

      const dto = { ...sameDto, url: 'https://x.com', name: 'Banner A' };
      const result = await service.updateBannerAdmin(1, dto as UpdateBannerDto, 'img');

      expect(bannerRepo.executeTransaction).toHaveBeenCalled();
      expect(result).toEqual({ update: true, banner: updated });
    });

    // ── stt / order shifting ──

    it('should shift order DOWN (-1) when new stt > old stt', async () => {
      const banner = makeBanner({ stt: 1 });
      bannerRepo.findBannerById.mockResolvedValue(banner);
      bannerRepo.findBannerByExceptId.mockResolvedValue(null);

      let capturedTx: any;
      bannerRepo.executeTransaction.mockImplementation(async (cb: any) => {
        capturedTx = cb;
        return cb({});
      });

      const dto = { ...sameDto, stt: 4 };
      await service.updateBannerAdmin(1, dto as UpdateBannerDto, 'img');

      expect(bannerRepo.adjustOrderInRange).toHaveBeenCalledWith(
        -1, { gt: 1, lte: 4 }, {},
      );
    });

    it('should shift order UP (+1) when new stt < old stt', async () => {
      const banner = makeBanner({ stt: 5 });
      bannerRepo.findBannerById.mockResolvedValue(banner);
      bannerRepo.findBannerByExceptId.mockResolvedValue(null);
      bannerRepo.executeTransaction.mockImplementation(async (cb: any) => cb({}));

      const dto = { ...sameDto, stt: 2 };
      await service.updateBannerAdmin(1, dto as UpdateBannerDto, 'img');

      expect(bannerRepo.adjustOrderInRange).toHaveBeenCalledWith(
        +1, { gte: 2, lt: 5 }, {},
      );
    });

    it('should NOT call adjustOrderInRange when stt does not change', async () => {
      // only url changes, stt stays at 1
      const banner = makeBanner({ url: 'https://old.com' });
      const updated = makeBanner();
      bannerRepo.findBannerById
        .mockResolvedValueOnce(banner)
        .mockResolvedValueOnce(updated);
      bannerRepo.findBannerByExceptId.mockResolvedValue(null);
      bannerRepo.executeTransaction.mockImplementation(async (cb: any) => cb({}));

      const dto = { ...sameDto, url: 'https://new.com' };
      await service.updateBannerAdmin(1, dto as UpdateBannerDto, 'img');

      expect(bannerRepo.adjustOrderInRange).not.toHaveBeenCalled();
    });

    // ── file handling ──

    it('should save new image, update banner, then delete old image', async () => {
      const banner = makeBanner({ img: 'uploads/old.jpg', url: 'https://old.com' });
      const updated = makeBanner({ img: 'uploads/new.jpg' });
      bannerRepo.findBannerById
        .mockResolvedValueOnce(banner)
        .mockResolvedValueOnce(updated);
      bannerRepo.findBannerByExceptId.mockResolvedValue(null);
      storageService.saveFile.mockResolvedValue('uploads/new.jpg');
      bannerRepo.executeTransaction.mockImplementation(async (cb: any) => cb({}));
      storageService.deleteManyFile.mockResolvedValue(undefined);

      const dto = { ...sameDto, url: 'https://new.com' };
      const result = await service.updateBannerAdmin(1, dto as UpdateBannerDto, 'img', makeFile() as any);

      expect(storageService.saveFile).toHaveBeenCalled();
      expect(storageService.deleteManyFile).toHaveBeenCalledWith(['uploads/old.jpg']);
      expect(result.update).toBe(true);
    });

    it('should skip deleteManyFile when banner had no previous image', async () => {
      const banner = makeBanner({ img: undefined, url: 'https://old.com' });
      const updated = makeBanner();
      bannerRepo.findBannerById
        .mockResolvedValueOnce(banner)
        .mockResolvedValueOnce(updated);
      bannerRepo.findBannerByExceptId.mockResolvedValue(null);
      storageService.saveFile.mockResolvedValue('uploads/new.jpg');
      bannerRepo.executeTransaction.mockImplementation(async (cb: any) => cb({}));

      const dto = { ...sameDto, url: 'https://new.com' };
      await service.updateBannerAdmin(1, dto as UpdateBannerDto, 'img', makeFile() as any);

      expect(storageService.deleteManyFile).not.toHaveBeenCalled();
    });

    it('should rollback new image if applyOrderShift (transaction) throws', async () => {
      const banner = makeBanner({ img: 'uploads/old.jpg', url: 'https://old.com' });
      bannerRepo.findBannerById.mockResolvedValue(banner);
      bannerRepo.findBannerByExceptId.mockResolvedValue(null);
      storageService.saveFile.mockResolvedValue('uploads/new.jpg');
      bannerRepo.executeTransaction.mockRejectedValue(new Error('TX failed'));
      storageService.deleteFile.mockResolvedValue(undefined);

      const dto = { ...sameDto, url: 'https://new.com' };
      await expect(
        service.updateBannerAdmin(1, dto as UpdateBannerDto, 'img', makeFile() as any),
      ).rejects.toThrow('TX failed');

      expect(storageService.deleteFile).toHaveBeenCalledWith('uploads/new.jpg');
    });
  });

  // ── deleteBannerAdmin ──────────────────────────────────────────────────────

  describe('deleteBannerAdmin', () => {
    it('should throw NotFoundException when banner does not exist', async () => {
      bannerRepo.findBannerById.mockResolvedValue(null);

      await expect(service.deleteBannerAdmin(99)).rejects.toThrow(NotFoundException);
    });

    it('should run adjustOrderInRange and deleteBanner inside a transaction', async () => {
      const banner = makeBanner({ stt: 3 });
      bannerRepo.findBannerById.mockResolvedValue(banner);
      bannerRepo.executeTransaction.mockImplementation(async (cb: any) => cb({}));
      storageService.deleteFile.mockResolvedValue(undefined);

      await service.deleteBannerAdmin(1);

      expect(bannerRepo.adjustOrderInRange).toHaveBeenCalledWith(-1, { gt: 3 }, {});
      expect(bannerRepo.deleteBanner).toHaveBeenCalledWith({ id: 1 }, {});
    });

    it('should delete banner image after successful deletion', async () => {
      const banner = makeBanner({ img: 'uploads/to-delete.jpg' });
      bannerRepo.findBannerById.mockResolvedValue(banner);
      bannerRepo.executeTransaction.mockImplementation(async (cb: any) => cb({}));
      storageService.deleteFile.mockResolvedValue(undefined);

      await service.deleteBannerAdmin(1);

      expect(storageService.deleteFile).toHaveBeenCalledWith('uploads/to-delete.jpg');
    });

    it('should NOT throw even if deleteFile fails (graceful warn only)', async () => {
      const banner = makeBanner({ img: 'uploads/ghost.jpg' });
      bannerRepo.findBannerById.mockResolvedValue(banner);
      bannerRepo.executeTransaction.mockImplementation(async (cb: any) => cb({}));
      storageService.deleteFile.mockRejectedValue(new Error('Storage unavailable'));

      await expect(service.deleteBannerAdmin(1)).resolves.not.toThrow();
    });

    it('should skip deleteFile when banner has no img', async () => {
      const banner = makeBanner({ img: undefined });
      bannerRepo.findBannerById.mockResolvedValue(banner);
      bannerRepo.executeTransaction.mockImplementation(async (cb: any) => cb({}));

      await service.deleteBannerAdmin(1);

      expect(storageService.deleteFile).not.toHaveBeenCalled();
    });
  });
});