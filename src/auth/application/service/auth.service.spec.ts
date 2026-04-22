import { AuthService } from './auth.service';
import { UserService } from '../../../user/application/service/user.service';
import { JwtService } from '@nestjs/jwt';
import { NotificationInterface } from 'src/notification/domain/interface/notification.interface';
import cryto from 'crypto';
import  bcrypt from 'bcryptjs';
import {beforeAll, describe, expect, it, jest} from '@jest/globals';
import { User } from 'src/user/domain/entities/user.entity';
describe('AuthService', () => {
  let authService: AuthService;
  
  // Định nghĩa Type rõ ràng cho các Mock
  let mockJwtService: jest.Mocked<Partial<JwtService>>;
  let mockUserService: jest.Mocked<Partial<UserService>>;
  let mockNotification: jest.Mocked<Partial<NotificationInterface>>;

  beforeAll(() => {// beforeAll chạy một lần trước tất cả các test case, thường dùng để khởi tạo các biến hoặc mock chung cho tất cả test case
    // Khởi tạo Mock với kiểu dữ liệu chuẩn
    mockJwtService = {
      sign: jest.fn(),
    } as jest.Mocked<Partial<JwtService>>;

    mockUserService = {
      UpdateUser: jest.fn(),
      FindFirstBy: jest.fn()
    } as jest.Mocked<Partial<UserService>>;

    mockNotification = {
      send: jest.fn(),
    } as jest.Mocked<Partial<NotificationInterface>>;

    // Inject vào constructor (ép kiểu về bản gốc để NestJS/TS không than phiền)
    authService = new AuthService(
      mockJwtService as JwtService,
      mockUserService as UserService,
      mockNotification as NotificationInterface,
    );

    jest.spyOn(bcrypt, 'genSalt').mockImplementation(() => Promise.resolve('fake_salt'));
    jest.spyOn(bcrypt, 'hash').mockImplementation(() => Promise.resolve('hashed_token'));
    
  });

  //test case cho hàm issueTokenPair
  describe('issueTokenPair', () => {
        it('nên tạo cặp token và lưu vào DB với Type chuẩn', async () => {
    // ARRANGE: Dùng đúng Class/Entity thay vì object khơi khơi
        const mockUser = new User();
        mockUser.id = 1;
        mockUser.tai_khoan = 'tinvip';
        mockUser.token_version = 1;

        // Giả lập giá trị trả về
        (mockJwtService.sign as jest.Mock)
          .mockReturnValueOnce('access_token')
          .mockReturnValueOnce('refresh_token');

        // ACT
        const result = await authService.issueTokenPair(mockUser);

        // ASSERT
        expect(result).toEqual({
          token: 'access_token',
          refreshToken: 'refresh_token',
        });

        //dòng này kiểm tra xem hàm UpdateUser có được gọi với đúng tham số không
        expect(mockUserService.UpdateUser).toHaveBeenCalledWith(
          { id: mockUser.id },
          { refresh_token: 'hashed_token' }
        );
        expect(bcrypt.hash).toHaveBeenCalledWith('refresh_token', expect.any(String));
      });
    });
    //tesst case cho hamf createotpandupdate
    describe('createOtpAndUpdate (private method)', () => {
      it('nên tạo OTP, hash nó và cập nhật vào DB thanh công', async () => {
        const userId = 123;
        const currentTime = new Date();
        const fakeOtp = 888888;
        const expectedExpire = new Date(currentTime.getTime() + 5 * 60_000);
        jest.spyOn(cryto, 'randomInt').mockImplementation(() => fakeOtp);
        //vi hàm createOtpAndUpdate là private nên chúng ta không thể gọi trực tiếp, chúng ta sẽ spyOn nó để kiểm tra xem nó có được gọi đúng cách không
        jest.spyOn(authService as any , 'generateExpireTime').mockImplementation(() => expectedExpire);
        const result = await (authService as any).createOtpAndUpdate(
          userId,
          10000,
          999999,
          10,
          currentTime
        );
        expect(result).toBe('888888');
        expect(mockUserService.UpdateUser).toHaveBeenCalledWith(
          { id: userId },
          { otp: 'hashed_token', otp_expire: expectedExpire }
        );
        //xem bcrypt.hash có được gọi với đúng tham số không, tham số thứ nhất là OTP dưới dạng string, tham số thứ hai là salt mà chúng ta đã mock ở trên
        expect(bcrypt.hash).toHaveBeenCalledWith("888888", expect.any(String));
      });
    });

  
});