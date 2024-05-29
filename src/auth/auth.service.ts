/* eslint-disable prettier/prettier */
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcrypt';
import { IAuthUserDTO } from 'types/user/IAuthUserDTO';
import { ICreateUserDTO } from 'types/user/ICreateUserDTO';
import { PrismaClient } from '@prisma/client';


@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) { }
  async signIn(signInDto: AuthUserDTO): Promise<any> {

    const user = await this.usersService.findOne(signInDto);

    if (!user) throw new UnauthorizedException();

    if (!(await compare(String(signInDto.password), String(user?.password)))) {
      throw new UnauthorizedException();
    }

    const payload = { sub: user.id, username: user.name };

    user.password = '';

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      token: await this.jwtService.signAsync(payload)
    };
  }

  async signUp(User: CreateUserDTO): Promise<any> {
    const prisma = new PrismaClient();
    const rgxEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const rgxName = /^[a-zA-Z\s]+$/;
    const rgxPwd = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    const maxLength = 31


    if (!rgxEmail.test(User.email)) return "operation failed: email format not supported"
    if (!rgxName.test(User.name)) return "operation failed: name format not supported"
    if (!rgxPwd.test(User.password)) return "operation failed: password format not supported"
    if (User.name.length > maxLength) return "operation failed: name too long, please abbreviate your name"

    const userExists = await prisma.user.findFirst({
      where: {
        name: {
          equals: User.name
        }
      }
    });

    if (userExists) return "operation failed: this user already exists"

    const encodedPassword = await hash(User.password, 10);

    await prisma.user.create({
      data: {
        name: User.name,
        email: User.email,
        password: encodedPassword
      }
    });

    return "user created successfully";
  }

}
