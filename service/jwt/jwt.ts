/* eslint-disable prettier/prettier */
import { IEncodedDTO, ITokenDTO } from "types/global/global"
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from "@nestjs/common";



export class JWT {

    constructor(private service: JwtService) { }

    async GenerateToken(credential: ITokenDTO): Promise<string> {
        return await credential.jwt.signAsync(credential.payload)
    }

    async VerifyToken(token: string): Promise<IEncodedDTO> {
        try {
            const decoded: IEncodedDTO = await this.service.verifyAsync(token)
            return decoded;
        } catch (error: any) {
            if (error.name === 'TokenExpiredError') {
                throw new UnauthorizedException('Token expirou');
            } else {
                throw new UnauthorizedException('Token inválido');
            }
        }
    }

}




