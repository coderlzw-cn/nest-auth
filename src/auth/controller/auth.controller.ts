import { Body, Controller, Get, Headers, Post, Query, Req, Res, Sse } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiOperation } from '@nestjs/swagger';
import fs from 'node:fs';
import path from 'node:path';
import { getDirectoryTree } from '../../dir-tree';
import { CheckSignatureDto } from '../dto/check-signature.dto';
import { AuthService } from '../service/auth.service';

@Controller()
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Get()
  getUserInfo() {
    console.log('Release');

    // 获取当前工作目录
    console.log('当前工作目录', process.cwd());
    // 获取当前文件目录
    console.log('当前文件目录', __dirname);
    // 获取当前文件名
    console.log('当前文件名', __filename);
    // 获取当前文件路径
    console.log('当前文件路径', __filename);
    // 获取当前文件所在目录
    console.log('当前文件所在目录', __dirname);
    // 当前工作目录下的所有文件
    console.log('当前工作目录下的所有文件', fs.readdirSync(process.cwd()));
    // 获取当前文件所在目录的父目录
    console.log(path.resolve('../../', process.cwd()));

    console.log('当前文件所在目录的父目录', JSON.stringify(getDirectoryTree(process.cwd())));

    return 'Release';
  }

  @ApiOperation({ summary: '微信签名验证', deprecated: true })
  @Get('wechat')
  checkSignature(@Query() checkSignatureDto: CheckSignatureDto) {
    return this.authService.checkSignature(checkSignatureDto);
  }

  @ApiOperation({ summary: '微信事件推送', deprecated: true })
  @Post('wechat')
  eventPush(@Body() event: any) {
    return this.authService.eventPush(event);
  }

  @ApiOperation({ summary: '获取二维码' })
  @Get('qrcode')
  getQrCode(@Headers('sessionId') sessionId: string) {
    return this.authService.getQrCode(sessionId);
  }

  @ApiOperation({ summary: '授权SSE' })
  @Sse('auth/sse')
  sse(@Req() req: Request) {
    return this.authService.sse(req);
  }
}
