import { HttpService } from '@nestjs/axios';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosResponse } from 'axios';
import { lastValueFrom } from 'rxjs';
import { QRCodeAction } from '../constants/enum.constants';

interface GetTicketParams {
  action: QRCodeAction;
  sceneId?: number;
  sceneStr?: string;
  expireSeconds?: number;
}

interface GetTicketResult {
  ticket: string;
  expire_seconds: number;
  url: string;
}

@Injectable()
export class WechatService {
  private appId: string;
  private appSecret: string;
  private tokenExpireTime = 0;
  private currentToken = '';

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.appId = this.configService.get<string>('WECHAT_APPID')!;
    this.appSecret = this.configService.get<string>('WECHAT_APPSECRET')!;
  }

  /**
   * 获取 access_token（带缓存）
   */
  async getAccessToken(): Promise<string> {
    if (Date.now() <= this.tokenExpireTime && this.currentToken) {
      return this.currentToken;
    }

    const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${this.appId}&secret=${this.appSecret}`;
    console.log(url);

    const response = await lastValueFrom(
      this.httpService.get<{
        errcode: number;
        errmsg: string;
        access_token: string;
        expires_in: number;
      }>(url),
    );
    console.log(response.data);

    const { errcode, errmsg, access_token, expires_in } = response.data;

    if (errcode) {
      throw new HttpException(
        `获取access_token失败: ${errmsg}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    this.currentToken = access_token;
    this.tokenExpireTime = Date.now() + expires_in * 1000;
    return access_token;
  }

  /**
   * 获取二维码 ticket
   */
  async getTicket(params: GetTicketParams): Promise<GetTicketResult> {
    const accessToken = await this.getAccessToken();
    const url = `https://api.weixin.qq.com/cgi-bin/qrcode/create?access_token=${accessToken}`;
    console.log(url);

    const body = {
      expire_seconds: params.expireSeconds,
      action_name: params.action,
      action_info: {
        scene: {
          scene_id: params.sceneId,
          scene_str: params.sceneStr,
        },
      },
    };

    const response = await lastValueFrom(
      this.httpService.post<GetTicketResult>(url, body),
    );

    return response.data;
  }

  /**
   * 根据 ticket 获取二维码图片内容（buffer）
   */
  async getQrCodeByTicket(ticket: string): Promise<ArrayBuffer> {
    const encodedTicket = encodeURIComponent(ticket);
    const url = `https://mp.weixin.qq.com/cgi-bin/showqrcode?ticket=${encodedTicket}`;

    const response: AxiosResponse<ArrayBuffer> = await lastValueFrom(
      this.httpService.get(url, { responseType: 'arraybuffer' }),
    );

    return response.data;
  }

  /**
   * 发送模板消息
   */
  async sendTemplateMessage(
    openid: string,
    templateId: string,
    data: any,
  ): Promise<any> {
    const accessToken = await this.getAccessToken();
    const url = `https://api.weixin.qq.com/cgi-bin/message/template/send?access_token=${accessToken}`;

    const body = {
      touser: openid,
      template_id: templateId,
      data,
    };

    const response = await lastValueFrom(
      this.httpService.post<{ errcode: number; errmsg: string }>(url, body),
    );
    return response.data;
  }

  /**
   * 获取模板列表
   */
  async getTemplateList(): Promise<any> {
    const accessToken = await this.getAccessToken();
    const url = `https://api.weixin.qq.com/cgi-bin/template/get_all_private_template?access_token=${accessToken}`;

    const response = await lastValueFrom(this.httpService.get(url));
    return response.data;
  }

  /**
   * 获取用户信息
   */
  async getUserInfo(openid: string): Promise<any> {
    const accessToken = await this.getAccessToken();
    const url = `https://api.weixin.qq.com/cgi-bin/user/info?access_token=${accessToken}&openid=${openid}`;

    const response = await lastValueFrom(this.httpService.get(url));
    return response.data;
  }
}
