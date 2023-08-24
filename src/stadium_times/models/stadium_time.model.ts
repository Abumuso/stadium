import { ApiProperty } from '@nestjs/swagger';
import { Column, DataType, Model, Table } from 'sequelize-typescript';

interface StadiumTimesAttr {
  stadium_id: number;
  start_time: string;
  end_time: string;
  price: number;
}

@Table({ tableName: 'stadium_times' })
export class StadiumTimes extends Model<StadiumTimes, StadiumTimesAttr> {
  @ApiProperty({ example: 1, description: 'Unikal ID' })
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number;
  @ApiProperty({ example: 1, description: "Stadion 'ID'si" })
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  stadium_id: number;

  @ApiProperty({ example: '9:00', description: 'Ish vaqtining boshlanishi' })
  @Column({
    type: DataType.TIME,
    allowNull: false,
  })
  start_time: string;

  @ApiProperty({ example: '17:00', description: 'Ish vaqtining yakunlanishi' })
  @Column({
    type: DataType.TIME,
    allowNull: false,
  })
  end_time: string;

  @ApiProperty({ example: '17:00', description: 'Ish vaqtining yakunlanishi' })
  @Column({
    type: DataType.TIME,
    allowNull: false,
  })
  price: number;
}
