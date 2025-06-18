import {
  BadGatewayException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import crypto from 'node:crypto';
import { AuthSSEMessage, QRCodeAction } from '../../constants/enum.constants';
import { WechatService } from '../../wechat/wechat.service';
import { CheckSignatureDto } from '../dto/check-signature.dto';
interface Session {
  response: Response;
  timer?: NodeJS.Timeout;
}

@Injectable()
export class AuthService {
  private readonly qrCodeExpireTime = 60;
  private sessionMap = new Map<string, Session>();

  constructor(
    private readonly configService: ConfigService,
    private readonly wechatService: WechatService,
  ) {}

  // 清理会话资源
  private cleanupSession(sessionId: string): void {
    const session = this.sessionMap.get(sessionId);
    if (session) {
      if (session.timer) {
        clearTimeout(session.timer);
      }
      this.sessionMap.delete(sessionId);
    }
  }

  checkSignature(checkSignatureDto: CheckSignatureDto) {
    const token = this.configService.get<string>('WECHAT_APP_TOKEN');
    const str = [token, checkSignatureDto.timestamp, checkSignatureDto.nonce]
      .sort()
      .join('');
    const encrypted = crypto.createHash('sha1').update(str).digest('hex');
    console.log(encrypted === checkSignatureDto.signature);

    const result = encrypted === checkSignatureDto.signature;
    if (result) {
      return checkSignatureDto.echostr;
    }

    return false;
  }
  eventPush(event: any) {
    throw new Error('Method not implemented.');
  }
  sse(req: Request) {
    const sessionId = req.headers['session-id'] as string;
    const session = this.sessionMap.get(sessionId);
    if (!session) {
      throw new BadGatewayException('sessionId is required');
    }
    return session.response;
  }
  async getQrCode(sessionId: string) {
    if (!sessionId) {
      throw new BadGatewayException('sessionId is required');
    }
    const ticketResult = await this.wechatService.getTicket({
      action: QRCodeAction.QR_STR_SCENE,
      sceneStr: sessionId,
      expireSeconds: this.qrCodeExpireTime,
    });

    if (!ticketResult?.ticket) {
      throw new InternalServerErrorException('获取 ticket 失败');
    }

    // // 获取二维码
    const qrCodeArrayBuffer = await this.wechatService.getQrCodeByTicket(
      ticketResult.ticket,
    );
    const base64 = Buffer.from(qrCodeArrayBuffer).toString('base64');

    // // 设置二维码过期定时器
    const session = this.sessionMap.get(sessionId);
    if (session) {
      session.timer = setTimeout(() => {
        session.response.write(
          `data: ${JSON.stringify({
            message: AuthSSEMessage.QRCODE_EXPIRED,
          })}\n\n`,
        );
        this.cleanupSession(sessionId);
      }, this.qrCodeExpireTime * 1000);
    }
    return `data:image/jpeg;base64,${base64}`;
  }

  getUserInfo() {
    return this.wechatService.getUserInfo('openid');
  }
}
