/* eslint-disable prettier/prettier */
import { ITokenDTO } from "types/jwt/ITokenDTO";

export async function GenerateToken(credential: ITokenDTO): Promise<string> {
    return await credential.jwt.signAsync(credential.payload)
}



