import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { ApiResponseDto } from '../common/dto/api-response.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async signIn(
    email: string,
    password: string,
  ): Promise<ApiResponseDto<{ access_token: string; user: any }>> {
    const user = await this.userService.findUserForAuth(email);

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('帳號或密碼錯誤');
    }

    const payload = { sub: user.id, email: user.email };
    const { password: _, ...userInfo } = user;

    return ApiResponseDto.success(
      {
        access_token: this.jwtService.sign(payload),
        user: userInfo,
      },
      ['登入成功'],
    );
  }

  async register(data: { email: string; name: string; password: string }): Promise<ApiResponseDto<any>> {
    const existingUser = await this.userService.findByEmail(data.email);
    if (existingUser) {
      throw new ConflictException('此電子郵件已被註冊');
    }

    const newUser = await this.userService.create(data);
    const { password: _, ...result } = newUser;
    
    return ApiResponseDto.success(result, ['註冊成功']);
  }
}
