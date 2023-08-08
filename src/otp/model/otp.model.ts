import { ApiProperty } from '@nestjs/swagger';
import { Column, DataType, Model, Table } from 'sequelize-typescript';

interface OtpAttr {
  id: string;
  otp: string;
  expiration_time: Date;
  verified: boolean;
  chek: string;
}

@Table({ tableName: 'otp' })
export class Otp extends Model<Otp, OtpAttr> {
  @ApiProperty({
    example: '112983-sdgs-sdfs-sgs1',
    description: 'OTP ID',
  })
  @Column({
    type: DataType.UUID,
    primaryKey: true,
    allowNull: false,
  })
  id: string;

  @ApiProperty({
    example: '1978',
    description: 'OTP',
  })
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  otp: string;

  @ApiProperty({
    example: '2023-02-27t08:10:10.000Z',
    description: 'expiration time',
  })
  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  expiration_time: Date;

  @ApiProperty({
    example: false,
    description: 'verified',
  })
  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  verified: boolean;

  @ApiProperty({
    example: '998998445459',
    description: 'chek phone number',
  })
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  chek: string;
}
