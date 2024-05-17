import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}
  async signIn(username: string, pass: string): Promise<any> {
    const user = await this.usersService.findOne(username);

    if (!user) throw new UnauthorizedException();

    if (!(await compare(String(pass), String(user?.password)))) {
      throw new UnauthorizedException();
    }
    const payload = { sub: user.id, username: user.name };
    user.password = '';
    return {
      token: await this.jwtService.signAsync(payload),
      user: user,
    };
  }
}
