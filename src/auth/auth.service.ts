/* eslint-disable prettier/prettier */
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcrypt';
import { IAuthUserDTO } from 'types/user/IAuthUserDTO';
import { ICreateUserDTO } from 'types/user/ICreateUserDTO';
import { PrismaClient } from '@prisma/client';
// import { ISendEmailDTO } from 'types/user/ISendEmailDTO';
// import { HandleSendRecoveryPassword } from 'config/mailer';
import { GenerateToken } from 'service/jwt/jwt';
import { IForgotPasswordDTO } from 'types/user/IForgotPasswordDTO';
import { IEncodedDTO } from 'types/jwt/IEncodedDTO';
import { IChangingPasswordDTO } from 'types/user/IChangingPasswordDTO';
import { Bcrypt } from 'utils/Bcrypt/Encrypt';
import { createTransport } from 'nodemailer';
// import { Response } from 'express';
import { ISendEmailDTO } from 'types/user/ISendEmailDTO';
const prisma = new PrismaClient()

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) { }
  async signIn(credential: IAuthUserDTO): Promise<any> {

    const user = await this.usersService.findOne(credential);

    if (!user) throw new UnauthorizedException();

    if (!(await compare(String(credential.password), String(user?.password)))) {
      throw new UnauthorizedException();
    }

    const payload = { sub: user.id, username: user.name };

    user.password = '';

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      token: await GenerateToken({ payload, jwt: this.jwtService })
    };
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

  async generateEmail(credential: ISendEmailDTO): Promise<string> {

    const { email } = Object(credential.email)

    if (!email) return

    const user = await prisma.user.findUnique({
      where: {
        email
      }
    })

    if (!user) return "operation failed: this user already exists"

    const payload = { id: user.id, email: user.email }

    const token = await GenerateToken({ payload, jwt: this.jwtService })

    // const host = `http://localhost:8000/v1/forgot-password/${token}`
    const host = `http://localhost:3000/v1/${token}`
    

    const transporter = createTransport({
      service: "outlook",
      auth: {
        user: process.env.MAILER_EMAIL,
        pass: process.env.MAILER_PASSWORD
      }
    })

    await transporter.sendMail({
      from: `olá ${user.name} <marcodamasceno0101@outlook.com>`,
      to: user.email,
      subject: "Hello ✔",
      text: "click on the link to update your password",
      html: `<a href=${host} target="_blank">forgot password</a>`,
    })

    return "email sent, check your email to change password"

  }

  async forgotPassword(credential: IForgotPasswordDTO): Promise<boolean> {
    const encoded: IEncodedDTO = await this.jwtService.verifyAsync(credential.token)

    if (!encoded) return false

    const user = await prisma.user.findUnique({
      where: {
        email: encoded.email
      }
    })

    if (!user) return false

    return true

  }
  async changePassword(credential: IChangingPasswordDTO): Promise<string | any> {

    const user = await prisma.user.findUnique({
      where: {
        name: credential.name
      }
    })

    if (!user) return "user not found in our database"

    const passwordMatch = await compare(credential.password, user.password);

    if (!passwordMatch) return "invalid user credentials"

    await prisma.user.update({
      where: {
        id: user.id
      },
      data: {
        password: await Bcrypt.EncryptPassword(credential.newPassword)
      }
    })

    return credential.response.status(200).send("password updated successfully")


  }
}
