/* eslint-disable prettier/prettier */
import { Body, Controller, Get, Param, Post, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  IAuthUserDTO,
  ICreateUserRouteParameterDTO,
  IChangingPasswordRoutePasswordDTO,
  ISendEmailRouteParameterDTO,
  IDataAuthUserDTO
} from "../../types/global/global"
import { Response } from 'express';

@Controller('v1')
export class AuthController {
  constructor(private readonly authService: AuthService) { }
  @Post('signin')
  async signIn(@Body() Parameter: IAuthUserDTO, @Res() response: Response): Promise<IDataAuthUserDTO | Response<string>> {
    if (!Parameter.name || !Parameter.password) return response.status(400).send("operation failed: something missing here")
    const credentials = { name: Parameter.name, password: Parameter.password }
    return await this.authService.signIn(credentials, response)
  }

  @Post('signup')
  async handleCreateNewUser(@Body() parameter: ICreateUserRouteParameterDTO, @Res() response: Response): Promise<Response> {

    if (!parameter.password || !parameter.email || !parameter.name) return response.status(400).send("operation failed: something missing here")

    const credentials = { name: parameter.name, password: parameter.password, email: parameter.email }

    return await this.authService.signUp(credentials, response).then(response => response).catch(error => error)
  }

  @Post('send/email')
  async handleSendEmail(@Body() parameter: ISendEmailRouteParameterDTO, @Res() response: Response): Promise<Response<string> | void> {
    if (!parameter.email) return response.status(400).send("operation failed: something missing here")

    const credentials = { email: parameter.email, response }

    return await this.authService.generateEmail(credentials, response).then(response => response).catch(error => error)
  }

  @Get("forgot-password/:token")
  async handleForgotPassword(@Param("token") parameter: string, @Res() response: Response): Promise<Response<boolean | any>> {

    if (!parameter) return response.status(400).send("credential invalid")

    const credentials = { token: parameter, response }

    return await this.authService.forgotPassword(credentials, response)
  }

  @Post("change/password")
  async handleChangePassword(@Body() parameter: IChangingPasswordRoutePasswordDTO, @Res() response: Response): Promise<Response> {

    if (!parameter.password || !parameter.newPassword) return response.status(400).send("operation failed: something missing here")

    const credentials = { name: parameter.name, password: parameter.password, newPassword: parameter.newPassword, response }

    return await this.authService.changePassword(credentials, response);
  }
}
