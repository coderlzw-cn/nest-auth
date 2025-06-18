import { Module } from '@nestjs/common';
import { WechatModule } from '../wechat/wechat.module';
import { AuthController } from './controller/auth.controller';
import { AuthService } from './service/auth.service';

@Module({
  imports: [WechatModule],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
