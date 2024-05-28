/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { AuthUserDTO } from 'dto/authUserDTO';

export type User = {
  id: number;
  name: string;
  email: string;
  password: string;
};

@Injectable()
export class UsersService {
  private prisma = new PrismaClient();

  async findOne(signInDto: AuthUserDTO): Promise<User | undefined> {
    console.log("findone",signInDto)
    return this.prisma.user.findUnique({
      where: {
        name: signInDto.name
      }
    })
  }
}
