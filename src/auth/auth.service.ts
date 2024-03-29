import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthDto } from './dto';
import * as argon from "argon2"
import { PrismaClientKnownRequestError } from '@prisma/client/runtime';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwt: JwtService, private config: ConfigService) {}
  async signup(dto: AuthDto) {
    try {
        const hash = await argon.hash(dto.password);
        const fullName = dto.fullName.split(' ')
        const user = await this.prisma.user.create({
            data: {
                email: dto.email,
                hash,
                firstName: fullName[0],
                lastName: fullName[fullName.length - 1]
            }
        })
    
        return this.signToken(user.id, user.email);
    } catch (error) {
        if (error instanceof PrismaClientKnownRequestError) {
            if (error.code === 'P2002') {
                throw new ForbiddenException('Credentials taken')
            }
        }

        throw error;
    }
  }

  async signin(dto: AuthDto) {
    const user = await this.prisma.user.findUnique({
        where: {
            email: dto.email
        }
    })
    if (!user) throw new UnauthorizedException('Incorrect Credentials');

    const pwMatches = await argon.verify(user.hash, dto.password);
    if (!pwMatches) throw new UnauthorizedException('Incorrect Credentials')

    return this.signToken(user.id, user.email); 
  }

  async signToken(userId: number, email: string): Promise<{ access_token: string }> {
      const payload = {
          sub: userId,
          email
      }

      const secret = this.config.get('JWT_SECRET');
      const token = await this.jwt.signAsync(payload, {
        expiresIn: '15m',
        secret: secret,
      });

      return {
          access_token: token
      }
  }
}
