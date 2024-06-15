/* eslint-disable prettier/prettier */
import { Injectable, Res } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import { GenerateToken } from 'service/jwt/jwt';
import { Bcrypt } from 'utils/Bcrypt/Encrypt';
import { Response } from 'express';
import { EmailService } from './../email/email.service';
import { IAuthUserDTO, ICreateUserDTO, IForgotPasswordDTO, IEncodedDTO, IChangingPasswordDTO } from "../../types/global/global"

const prisma = new PrismaClient()

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private emailService: EmailService
  ) { }
  async signIn(credential: IAuthUserDTO, @Res() response: Response): Promise<any> {

    const user = await this.usersService.findOne(credential);

    if (!user) return response.status(400);

    if (!(await compare(String(credential.password), String(user?.password)))) {
      return response.status(401).send("unauthorized")
    }

    const payload = { sub: user.id, username: user.name };

    user.password = '';

    const data = {
      id: user.id,
      name: user.name,
      email: user.email,
      token: await GenerateToken({ payload, jwt: this.jwtService })
    }

    return response.status(200).json(data)
  }

  async signUp(credential: ICreateUserDTO): Promise<any> {

    const rgxEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const rgxName = /^[a-zA-Z\s]+$/;
    const rgxPwd = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    const maxLength = 31


    if (!rgxEmail.test(credential.email)) return "operation failed: email format not supported"
    if (!rgxName.test(credential.name)) return "operation failed: name format not supported"
    if (!rgxPwd.test(credential.password)) return "operation failed: password format not supported"
    if (credential.name.length > maxLength) return "operation failed: name too long, please abbreviate your name"

    const userExists = await prisma.user.findFirst({
      where: {
        name: {
          equals: credential.name
        }
      }
    });

    if (userExists) return "operation failed: this user already exists"

    const encodedPassword = await Bcrypt.EncryptPassword(credential.password);

    await prisma.user.create({
      data: {
        name: credential.name,
        email: credential.email,
        password: encodedPassword
      }
    });

    return "user created successfully";
  }

  async generateEmail(credential: string, @Res() response: Response): Promise<any> {

    const { email } = Object(credential)

    if (!email) return

    const user = await prisma.user.findUnique({
      where: {
        email
      }
    })

    if (!user) return "operation failed: this user already exists"

    const payload = { id: user.id, email: user.email }

    const token = await GenerateToken({ payload, jwt: this.jwtService })

    const host = `http://localhost:3000/v1/${token}`

    await this.emailService.sendEmail({ name: user.name, email: user.email, token: host });

    return response.status(200).json({ message: "email sent, check your email to change password" })

  }

  async forgotPassword(credential: IForgotPasswordDTO): Promise<any> {
    const encoded: IEncodedDTO = await this.jwtService.verifyAsync(credential.token)

    if (!encoded) return credential.res.status(400).json({ token: false })

    const user = await prisma.user.findUnique({
      where: {
        email: encoded.email
      }
    })

    if (!user) return false

    return credential.res.status(200).send("redirecting authenticated user")

  }
  async changePassword(credential: IChangingPasswordDTO): Promise<string | any> {

    const { name } = Object(credential.name)
    const { password } = Object(credential.password)
    const { newPassword } = Object(credential.newPassword)

    const user = await prisma.user.findUnique({
      where: {
        name: name
      }
    })

    if (!user) return credential.response.status(400).send("user not found in our database")

    const passwordMatch = await compare(password, user.password);

    if (!passwordMatch) return credential.response.status(400).send("invalid user credentials")

    await prisma.user.update({
      where: {
        id: user.id
      },
      data: {
        password: await Bcrypt.EncryptPassword(newPassword)
      }
    })

    return credential.response.status(200).send("password updated successfully")


  }
}
