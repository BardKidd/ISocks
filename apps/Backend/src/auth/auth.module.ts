import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    JwtModule.register({
      secret: 'your_jwt_secret', // 用來加密和解密 JWT 的密鑰。當你產生 token 給 user 時會用這個密鑰簽名，當 user 帶 token 回來請求時你可以拿來驗證。
      signOptions: { expiresIn: '1d' }, // token 有效期限為一天。
    }),
    UserModule,
  ],
  providers: [AuthService],
  controllers: [AuthController],
})
export class AuthModule {}
