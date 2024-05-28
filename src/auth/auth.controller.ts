/* eslint-disable prettier/prettier */
import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthUserDTO } from '../../dto/authUserDTO';

@Controller('v1')
export class AuthController {
  constructor(private readonly authService: AuthService) { }
  @Post('signin')
  async signIn(@Body() signInDto: AuthUserDTO): Promise<any> {
    if (!signInDto.name || !signInDto.password) return
    return await this.authService.signIn(signInDto);
  }
}
