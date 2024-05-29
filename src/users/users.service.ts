/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { IAuthUserDTO } from 'types/user/IAuthUserDTO';

export type User = {
  id: number;
  name: string;
  email: string;
  password: string;
};

@Injectable()
export class UsersService {
  private prisma = new PrismaClient();

  async findOne(signInDto: IAuthUserDTO): Promise<User | undefined> {
  
    return this.prisma.user.findUnique({
      where: {
        name: signInDto.name
      }
    })
  }
}
