import {
  ConflictException,
  ConsoleLogger,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import * as argon from 'argon2';

import { AuthDto } from './dtos';
import { ConfigurationService } from 'src/shared/config/config.service';
import { JwtPayload, Tokens } from './types';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigurationService,
  ) {}

  async signupLocal(dto: AuthDto): Promise<Tokens> {
    const { username, password } = dto;
    // check if user is already registered in database
    const user = await this.prisma.user.findUnique({ where: { username } });
    if (user) throw new ConflictException('User already exists');

    const passwordHash = await this.hashData(password);
    const newUser = await this.prisma.user.create({
      data: {
        username,
        password: passwordHash,
      },
    });

    // create tokens and return them
    const tokens = await this.getTokens(newUser.id, newUser.username);
    // update refresh token
    await this.updateRtHash(newUser.id, tokens.refresh_token);

    return tokens;
  }

  async signinLocal(dto: AuthDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        username: dto.username,
      },
    });

    if (!user) throw new ForbiddenException('Access Denied');

    const passwordMatch = await argon.verify(user.password, dto.password);
    if (!passwordMatch) throw new ForbiddenException('Access Denied');

    const tokens = await this.getTokens(user.id, user.username);
    await this.updateRtHash(user.id, tokens.refresh_token);

    return tokens;
  }

  async logout(userId: string): Promise<boolean> {
    await this.prisma.user.updateMany({
      where: {
        id: userId,
        refreshToken: {
          not: null,
        },
      },
      data: {
        refreshToken: null,
      },
    });

    return true;
  }

  async refreshTokens(userId: string, refreshToken: string): Promise<Tokens> {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });
    if (!user || !user.refreshToken)
      throw new ForbiddenException('Access Denied');

    const rtMatches = await argon.verify(user.refreshToken, refreshToken);
    if (!rtMatches) throw new ForbiddenException('Access Denied');

    const tokens = await this.getTokens(user.id, user.username);
    await this.updateRtHash(user.id, tokens.refresh_token);

    return tokens;
  }

  // util functions
  async updateRtHash(userId: string, refreshToken: string): Promise<void> {
    const refreshHash = await argon.hash(refreshToken);
    await this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        refreshToken: refreshHash,
      },
    });
  }

  async getTokens(userId: string, username: string): Promise<Tokens> {
    const jwtPayload: JwtPayload = {
      sub: userId,
      username,
    };

    const [at, rt] = await Promise.all([
      this.jwtService.signAsync(jwtPayload, {
        secret: this.config.get('AT_SECRET'),
        expiresIn: '15m',
      }),
      this.jwtService.signAsync(jwtPayload, {
        secret: this.config.get('RT_SECRET'),
        expiresIn: '7d',
      }),
    ]);

    return {
      access_token: at,
      refresh_token: rt,
    };
  }

  private hashData(data: string): Promise<string> {
    return argon.hash(data);
  }
}
