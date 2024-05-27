/* eslint-disable prettier/prettier */
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcrypt';
import { AuthUserDTO } from 'dto/authUserDTO';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) { }
  async signIn(signInDto: AuthUserDTO): Promise<any> {

    const user = await this.usersService.findOne(signInDto);
    console.log("dados chegou signin", signInDto)

    if (!user) throw new UnauthorizedException();

    console.log("usuario", user)

    if (!(await compare(String(signInDto.password), String(user?.password)))) {
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
