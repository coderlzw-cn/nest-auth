import { IsString } from 'class-validator';

export class CheckSignatureDto {
  @IsString()
  signature: string;

  @IsString()
  timestamp: string;

  @IsString()
  nonce: string;

  @IsString()
  echostr: string;
}
