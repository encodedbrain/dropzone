import { PrismaClient } from "@prisma/client";
import { ICreateUserDTO, IUserDTO } from "types/global/global";
const prisma = new PrismaClient()

export const Service = {
    handleVerifyCredentialsCreateUser(credentials: ICreateUserDTO) {

        const { email, name, password } = credentials
        const rgxEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const rgxName = /^[a-zA-Z\s]+$/;
        const rgxPwd = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        const maxLength = 31


        if (!rgxEmail.test(email)) return "operation failed: email format not supported"
        if (!rgxName.test(name)) return "operation failed: name format not supported"
        if (!rgxPwd.test(password)) return "operation failed: password format not supported"
        if (name.length > maxLength) return "operation failed: name too long, please abbreviate your name"
    },
    handleVerifyPassword(password: string): boolean {

        const rgxPwd = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;


        if (!password || !rgxPwd.test(password)) {

            return false
        }

        return true
    },
    handleVerifyNickname(nickname: string): boolean {

        const rgxName = /^[a-zA-Z\s]+$/;

        if (!nickname || !rgxName.test(nickname)) {
            return false
        }

        return true
    },
    handleVerifyEmail(email: string): boolean {

        const rgxEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!email || !rgxEmail.test(email)) {

            return false
        }

        return true
    },
    async handleUserSearchViaEmail(email: string): Promise<IUserDTO | undefined> {
        return await prisma.user.findUnique({ where: { email } })
    }
}