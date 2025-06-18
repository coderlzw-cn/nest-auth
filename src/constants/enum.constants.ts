export enum QRCodeAction {
  QR_SCENE = 'QR_SCENE', // 临时二维码
  QR_STR_SCENE = 'QR_STR_SCENE', // 临时字符串二维码
  QR_LIMIT_SCENE = 'QR_LIMIT_SCENE', // 永久二维码
  QR_LIMIT_STR_SCENE = 'QR_LIMIT_STR_SCENE', // 永久字符串二维码
}

export enum AuthSSEMessage {
  SESSION_ID = 'session-id', // 会话id
  QRCODE_EXPIRED = 'qrcode-expired', // 二维码过期
  QRCODE_LOGIN_SUCCESS = 'qrcode-login-success', // 登录成功
}
