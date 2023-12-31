import {
  IsNotEmpty,
  IsNumberString,
  IsPhoneNumber,
  IsString,
} from 'class-validator';

export class VerifyOtpDto {
  @IsNotEmpty()
  @IsPhoneNumber()
  chek: string;

  @IsNotEmpty()
  @IsString()
  verification_key: string;

  @IsNumberString()
  otp: string;
}
