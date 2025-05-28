import { PrismaService } from '@app/prisma';
import { RedisService } from '@app/redis';
import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { RegisterUserDto } from './dto/register-user.dto';
import { md5 } from './utils';
import { LoginUserDto } from './dto/login-user.dto';
import { UpdateUserPasswordDto } from './dto/update_password-user.dto';
import { UpdateUserProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UserService {
  @Inject(PrismaService)
  private prismaService: PrismaService;

  @Inject(RedisService)
  private redisService: RedisService;

  private logger = new Logger();

  async register(user: RegisterUserDto) {
    const captcha = await this.redisService.get(`captcha_${user.email}`);

    if (!captcha) {
      throw new HttpException('验证码已失效', HttpStatus.BAD_REQUEST);
    }

    if (user.captcha != captcha) {
      throw new HttpException('验证码不正确', HttpStatus.BAD_REQUEST);
    }

    const foundUser = await this.prismaService.user.findUnique({
      where: {
        username: user.username,
      },
    });

    if (foundUser) {
      throw new HttpException('用户已存在', HttpStatus.BAD_REQUEST);
    }

    try {
      return await this.prismaService.$transaction(async (prisma) => {
        const newUser = await this.prismaService.user.create({
          data: {
            username: user.username,
            password: md5(user.password),
            email: user.email,
          },
        });

        await prisma.userProfile.create({
          data: {
            userId: newUser.id,
            gender: '男',
            userType: user.userType,
          },
        });

        return {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
          createTime: newUser.createTime,
        };
      });
    } catch (e) {
      this.logger.error(e, UserService);
      return null;
    }
  }

  async login(user: LoginUserDto) {
    const foundUser = await this.prismaService.user.findUnique({
      where: {
        username: user.username,
      },
      include: {
        profile: true,
      },
    });

    if (!foundUser) {
      throw new HttpException('用户不存在', HttpStatus.BAD_REQUEST);
    }

    if (foundUser.password != md5(user.password)) {
      throw new HttpException('密码错误', HttpStatus.BAD_REQUEST);
    }

    delete foundUser.password;
    return foundUser;
  }

  async updatePassword(passwordDto: UpdateUserPasswordDto) {
    const captcha = await this.redisService.get(
      `update_password_captcha_${passwordDto.email}`,
    );

    if (!captcha) {
      throw new HttpException('验证码已失效', HttpStatus.BAD_REQUEST);
    }

    if (captcha != passwordDto.captcha) {
      throw new HttpException('验证码不正确', HttpStatus.BAD_REQUEST);
    }

    const foundUser = await this.prismaService.user.findUnique({
      where: {
        username: passwordDto.username,
      },
    });

    foundUser.password = md5(passwordDto.password);

    try {
      await this.prismaService.user.update({
        data: foundUser,
        where: {
          id: foundUser.id,
        },
      });

      return '密码修改成功';
    } catch (e) {
      this.logger.error(e, UserService);
      return '密码修改失败';
    }
  }

  async updateProfile(profileDto: UpdateUserProfileDto, userId: number) {
    try {
      return await this.prismaService.userProfile.update({
        where: { userId },
        data: {
          gender: profileDto.gender,
          birthDate: profileDto.birthDate,
          bio: profileDto.bio,
          region: profileDto.region,
        },
      });
    } catch (e) {
      this.logger.error(e, UserService);
      throw new HttpException('更新用户信息失败', HttpStatus.BAD_REQUEST);
    }
  }

  async getProfile(userId: number) {
    try {
      return await this.prismaService.userProfile.findUnique({
        where: { userId },
      });
    } catch (e) {
      this.logger.error(e, UserService);
      throw new HttpException('获取用户信息失败', HttpStatus.BAD_REQUEST);
    }
  }
}
