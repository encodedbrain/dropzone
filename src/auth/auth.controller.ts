import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthUserDTO } from '../../dto/authUserDTO';

@Controller('v1')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  @Post('login')
  signIn(@Body() signInDto: AuthUserDTO) {
    return this.authService.signIn(signInDto.username, signInDto.password);
  }
}
