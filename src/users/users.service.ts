import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './models/user.model';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import { InjectModel } from '@nestjs/sequelize';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { LoginUserDto } from './dto/login-user.dto';
import { Op } from 'sequelize';
import { FindUserDto } from './dto/find-user.dto';
import { MailService } from '../mail/mail.service';
import { send } from 'process';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User) private readonly userRepo: typeof User,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}
  async registration(CreateUserDto: CreateUserDto, res: Response) {
    const user = await this.userRepo.findOne({
      where: { username: CreateUserDto.username },
    });
    if (user) {
      throw new BadRequestException('Username already exists!');
    }
    if (CreateUserDto.password !== CreateUserDto.confirm_password) {
      throw new BadRequestException('Passwords is not match!');
    }

    const hashed_password = await bcrypt.hash(CreateUserDto.password, 7);
    const newUser = await this.userRepo.create({
      ...CreateUserDto,
      hashed_password: hashed_password,
    });
    const tokens = await this.getTokens(newUser);

    const hashed_password_token = await bcrypt.hash(tokens.refresh_token, 7);
    const uniqueKey: string = uuidv4();
    const updateUser = await this.userRepo.update(
      {
        hashed_refresh_token: hashed_password_token,
        activation_link: uniqueKey,
      },
      {
        where: { id: newUser.id },
        returning: true,
      },
    );
    res.cookie('refresh_token', tokens.refresh_token, {
      maxAge: 15 * 24 * 60 * 60 * 1000,
      httpOnly: true,
    });
    try {
      await this.mailService.sendUserConfirmation(updateUser[1][0]);
    } catch (error) {
      console.log(error);
    }
    const response = {
      message: 'User registred',
      user: updateUser[1][0],
      tokens,
    };
    return response;
  }

  async login(loginUserDto: LoginUserDto, res: Response) {
    const { email, password } = loginUserDto;
    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('User nor registered');
    }
    if (!user.is_active) {
      throw new BadRequestException('user is not active')
    }
    const isMatchPass = await bcrypt.compare(password, user.hashed_password);
    if (!isMatchPass) {
      throw new UnauthorizedException('User not registered(pass');
    }
    const tokens = await this.getTokens(user);
    const hashed_password_token = await bcrypt.hash(tokens.refresh_token, 7);
    const updateUser = await this.userRepo.update(
      {
        hashed_refresh_token: hashed_password_token,
      },
      {
        where: { id: user.id },
        returning: true,
      },
    );
    res.cookie('refresh_token', tokens.refresh_token, {
      maxAge: 15 * 24 * 60 * 60 * 1000,
      httpOnly: true,
    });

    const response = {
      message: 'User logged in',
      user: updateUser[1][0],
      tokens,
    };
    return response;
  }

  async logout(refreshToken: string, res: Response) {
    const userData = await this.jwtService.verify(refreshToken, {
      secret: process.env.REFRESH_TOKEN_KEY,
    });
    if (!userData) {
      throw new ForbiddenException('User not found');
    }
    const updateUser = await this.userRepo.update(
      { hashed_refresh_token: null },
      { where: { id: userData.id }, returning: true },
    );
    res.clearCookie('refresh_token');
    const response = {
      message: 'User logged out successfully',
      user: updateUser[1][0],
    };
    return response;
  }

  async refreshToken(user_id: number, refreshToken: string, res: Response) {
    const decodedToken = this.jwtService.decode(refreshToken);
    if (user_id != decodedToken['id']) {
      throw new BadRequestException('user not found');
    }
    const user = await this.userRepo.findOne({ where: { id: user_id } });
    if (!user || !user.hashed_refresh_token) {
      throw new BadRequestException('user not found');
    }

    const tokenMatch = await bcrypt.compare(
      refreshToken,
      user.hashed_refresh_token,
    );
    if (!tokenMatch) {
      throw new ForbiddenException('Forbidden');
    }
    const tokens = await this.getTokens(user);
    const hashed_password_token = await bcrypt.hash(tokens.refresh_token, 7);
    const updateUser = await this.userRepo.update(
      {
        hashed_refresh_token: hashed_password_token,
      },
      {
        where: { id: user.id },
        returning: true,
      },
    );
    res.cookie('refresh_token', tokens.refresh_token, {
      maxAge: 15 * 24 * 60 * 60 * 1000,
      httpOnly: true,
    });

    const response = {
      message: 'User refreshed',
      user: updateUser[1][0],
      tokens,
    };
    return response;
  }

  async getTokens(user: User) {
    const jwtPayload = {
      id: user.id,
      is_active: user.is_active,
      is_owner: user.is_owner,
    };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(jwtPayload, {
        secret: process.env.ACCESS_TOKEN_KEY,
        expiresIn: process.env.ACCESS_TOKEN_TIME,
      }),
      this.jwtService.signAsync(jwtPayload, {
        secret: process.env.REFRESH_TOKEN_KEY,
        expiresIn: process.env.REFRESH_TOKEN_TIME,
      }),
    ]);
    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  async activate(link: string) {
    if (!link) {
      throw new BadRequestException('Activation link not found');
    }
    const updatedUser = await this.userRepo.update(
      { is_active: true },
      { where: { activation_link: link, is_active: false }, returning: true },
    );
    if (!updatedUser[1][0]) {
      throw new BadRequestException('User already avtivated');
    }
    const response = {
      message: 'User activated successfully',
      user: updatedUser,
    };
    return response;
  }
  
  async findAll(findUserDto: FindUserDto) {
    const where = {};
    if (findUserDto.first_name) {
      where['first_name'] = {
        [Op.like]: `%${findUserDto.first_name}%`,
      };
    }
    if (findUserDto.last_name) {
      where['last_name'] = {
        [Op.like]: `%${findUserDto.last_name}%`,
      };
    }
    if (findUserDto.birthday_begin && findUserDto.birthday_end) {
      where[Op.and] = {
        birthday: {
          [Op.between]: [findUserDto.birthday_begin, findUserDto.birthday_end],
        },
      };
    } else if (findUserDto.birthday_begin) {
      where['birthday'] = { [Op.gte]: findUserDto.birthday_begin };
    } else if (findUserDto.birthday_end) {
      where['birthday'] = { [Op.lte]: findUserDto.birthday_end };
    }
    const users = await User.findAll({ where });
    if (!users) {
      throw new BadRequestException('user not found');
    }
    return users;
  }


  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
