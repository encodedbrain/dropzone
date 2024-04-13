import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
export type User = {
  id: number;
  name: string;
  email: string;
  password: string;
};

@Injectable()
export class UsersService {
  private prisma = new PrismaClient();

  async findOne(username: string): Promise<User | undefined> {
    return this.prisma.user.findFirst({
      where: {
        name: {
          equals: username,
        },
      },
    });
  }
}
