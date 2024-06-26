/* eslint-disable prettier/prettier */
import { Injectable, Res } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import { JWT } from 'service/jwt/jwt';
import { Bcrypt } from 'utils/Bcrypt/Encrypt';
import { Service } from "utils/service/service"
import { EmailService } from './../email/email.service';
import {
  IForgotPasswordDTO,
  IChangingPasswordDTO,
  IGenerateEmailDTO,
  ICreateUserDTO,
  IAuthUserDTO,
  IDataAuthUserDTO
} from "../../types/global/global"
import { Response } from 'express';

const prisma = new PrismaClient()

@Injectable()
export class AuthService extends JWT {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {
    super(jwtService);
  }
  async signIn(credentials: IAuthUserDTO, @Res() response: Response): Promise<IDataAuthUserDTO | Response> {

    const { password } = credentials

    if (!Service.handleVerifyPassword(password)) return response.status(400).send("credentials invalid")

    const user = await this.usersService.findOne(credentials);

    if (!user) return response.status(400).send("invalid user credentials");

    if (!(await compare(password, user.password))) {
      return response.status(401).send("unauthorized")
    }

    const payload = { sub: user.id, username: user.name };

    user.password = '';

    const data: IDataAuthUserDTO = {
      id: user.id,
      name: user.name,
      email: user.email,
      token: await this.GenerateToken({ payload, jwt: this.jwtService })
    }

    return response.status(200).json(data)
  }
  async signUp(credentials: ICreateUserDTO, @Res() response: Response): Promise<Response> {

    Service.handleVerifyCredentialsCreateUser(credentials)

    const { email, name, password } = credentials

    if (!Service.handleVerifyEmail(email) || !Service.handleVerifyNickname(name) || !Service.handleVerifyPassword(password))
      return response.status(400).send("credentials invalid")

    const userExists = await prisma.user.findFirst({
      where: {
        name: {
          equals: name
        }
      }
    })

    if (userExists) return response.status(400).send("operation failed: this user already exists")

    const encodedPassword = await Bcrypt.EncryptPassword(password)

    await prisma.user.create({
      data: {
        name: name,
        email: email,
        password: encodedPassword
      }
    })

    return response.status(200).send("user created successfully")
  }
  async generateEmail(credentials: IGenerateEmailDTO, @Res() response: Response): Promise<Response<string>> {

    const { email } = credentials

    if (!email || !Service.handleVerifyEmail(email)) return response.status(400).send("credentials invalid")

    const user = await prisma.user.findUnique({
      where: {
        email
      }
    })

    if (!user) return response.status(400).send("operation failed: this user already exists")

    const payload = { id: user.id, email: user.email }

    const token = await this.GenerateToken({ payload, jwt: this.jwtService })

    const host = `http://localhost:3000/v1/${token}`

    await this.emailService.sendEmail({ name: user.name, email: user.email, token: host });

    return response.status(200).send("email sent, check your email to change password")

  }
  async forgotPassword(credentials: IForgotPasswordDTO, @Res() response: Response): Promise<Response<string>> {

    const decoded = await this.VerifyToken(credentials.token).then(res => res).catch(e => e)

    if (!decoded) return response.json({ token: false })
    else if (!decoded && decoded.response.status == 401) return response.status(401).send(decoded.response.message)


    if ((await decoded).id == undefined) return response.status(401).send("not authorized")

    const user = await prisma.user.findUnique({
      where: {
        id: (await decoded).id,
      }
    })

    if (!user) return response.status(400).send("credentials invalid")

    return response.status(200).send("redirecting authenticated user")

  }
  async changePassword(credentials: IChangingPasswordDTO, @Res() response: Response): Promise<Response> {
    const { name, newPassword, password } = credentials


    if (!Service.handleVerifyNickname(name) || !Service.handleVerifyPassword(password) || !Service.handleVerifyPassword(newPassword))
      return response.status(400).send("credentials invalid")

    const user = await prisma.user.findUnique({
      where: {
        name: name
      }
    })

    if (!user) return response.status(400).send("user not found in our database")

    const passwordMatch = await compare(password, user.password);

    if (!passwordMatch) return response.status(400).send("invalid user credentials")

    await prisma.user.update({
      where: {
        id: user.id
      },
      data: {
        password: await Bcrypt.EncryptPassword(newPassword)
      }
    })

    return response.status(200).send("password updated successfully")
  }
}
