import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { User } from './users/models/user.model';
import { UsersModule } from './users/users.module';
import { MailModule } from './mail/mail.module';
import { BotModule } from './bot/bot.module';
import { TelegrafModule } from 'nestjs-telegraf';
import { BOT_NAME } from './app.constants';
import { Bot } from './bot/model/bot.model';
import { OtpModule } from './otp/otp.module';
import { Otp } from './otp/model/otp.model';
import { RegionModule } from './region/region.module';
import { Region } from './region/models/region.model';
import { StadiumTimesModule } from './stadium_times/stadium_times.module';

@Module({
  imports: [
    TelegrafModule.forRootAsync({
      botName: BOT_NAME,
      useFactory: () => ({
        token: process.env.BOT_TOKEN,
        middlewares: [],
        include: [BotModule],
      }),
    }),
    ConfigModule.forRoot({ envFilePath: `.env`, isGlobal: true }),
    SequelizeModule.forRoot({
      dialect: 'postgres',
      host: process.env.POSTGRES_HOST,
      port: Number(process.env.POSTGRES_PORT),
      username: process.env.POSTGRES_USER,
      password: String(process.env.POSTGRES_PASSWORD),
      database: process.env.POSTGRES_DB,
      models: [User, Bot, Otp, Region],
      autoLoadModels: true,
      logging: false,
    }),
    UsersModule,
    MailModule,
    BotModule,
    OtpModule,
    RegionModule,
    StadiumTimesModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
