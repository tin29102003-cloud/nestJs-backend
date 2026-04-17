import { AuthService } from './auth.service';
import { UserService } from '../../../user/application/service/user.service';
import { JwtService } from '@nestjs/jwt';
import { NotificationInterface } from 'src/notification/domain/interface/notification.interface';

import  bcrypt from 'bcryptjs';
import {beforeAll, describe, expect, it, jest} from '@jest/globals';
import { User } from 'src/user/domain/entities/user.entity';
describe('AuthService - issueTokenPair (No Any)', () => {
  let authService: AuthService;
  
  // Định nghĩa Type rõ ràng cho các Mock
  let mockJwtService: jest.Mocked<Partial<JwtService>>;
  let mockUserService: jest.Mocked<Partial<UserService>>;
  let mockNotification: jest.Mocked<Partial<NotificationInterface>>;

  beforeAll(() => {
    // Khởi tạo Mock với kiểu dữ liệu chuẩn
    mockJwtService = {
      sign: jest.fn(),
    } as jest.Mocked<Partial<JwtService>>;

    mockUserService = {
      UpdateUser: jest.fn(),
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
  });
});