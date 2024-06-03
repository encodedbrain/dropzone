/* eslint-disable prettier/prettier */
import { hash } from "bcrypt";

export const Bcrypt  = {
    async EncryptPassword(password: string) : Promise<string> {
        return await hash(password, 10);
    }
}