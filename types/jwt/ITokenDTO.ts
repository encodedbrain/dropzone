/* eslint-disable prettier/prettier */
import { JwtService } from "@nestjs/jwt";

export interface ITokenDTO {
    payload: object,
    jwt: JwtService
}