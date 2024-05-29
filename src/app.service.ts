/* eslint-disable prettier/prettier */
import { Injectable, StreamableFile } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { DeleteDTO } from '../types/file/IDeleteDTO';
import * as fs from 'fs-extra';
import { UserDTO } from '../types/user/IUserDTO';
import { ReadFileDTO } from '../types/file/IReadFileDTO';
import { ReadFileDownloadDTO } from '../types/file/IReadFileDownload';
import { join } from 'node:path';
import * as process from 'node:process';
import { compare } from 'bcrypt';
import { IReceivingDataFileDTO } from 'types/file/IReceivingDataFileDTO';
import { File } from 'utils/File/File';
import { General } from 'utils/general';
import { ICreatingFileDTO } from 'types/file/ICreatingFileDTO';
import { IGetAllFileDbDTO } from 'types/file/IGetAllFileDbDTO';
import { IExposedFileDTO } from 'types/file/IExposeFileDTO';
const prisma = new PrismaClient();

@Injectable()
export class AppService {

  UploadMessage(text: string): string {
    return text
  }

  async GetFileDb(User: ReadFileDTO): Promise<any> {

    const user = await prisma.user.findUnique({ where: { email: User.email } })

    if (!user) return "operation failed: user does not exist"

    const encodedPassword = await compare((User.password), user.password);

    if (!encodedPassword) return "operation failed: these credentials do not correspond to any user"

    const fileExists = await prisma.file.findFirst({
      where: {
        authorId: {
          equals: user.id
        },
        File: {
          equals: User.name,
        }
      }
    });
    if (!fileExists) return "operation failed: file does not exist"

    return fileExists
  }

  async GetAllFileDb(User: ReadFileDTO): Promise<IGetAllFileDbDTO[] | string> {

    const user = await prisma.user.findUnique({ where: { email: User.email } })

    if (!user) return "operation failed: user does not exist"

    const encodedPassword = await compare(User.password, user.password);

    if (!encodedPassword) return "operation failed: these credentials do not correspond to any user"

    const fileExists = await prisma.file.findMany({
      where: {
        authorId: user.id
      }
    })

    return fileExists;
  }

  async DownloadFile(credentials: ReadFileDownloadDTO): Promise<StreamableFile | string> {

    const { email, filename, response } = credentials

    const user = await prisma.user.findUnique({ where: { email } })

    if (!user) return "operation failed: user does not exist"


    return File.handleDownload({ filename, response });

  }

  async ExposeFile(credentials: IExposedFileDTO): Promise<any> {
    return credentials.response.sendFile(join(process.cwd(), './files/' + credentials.filename));
  }

  async CreateFileUserDb(credentials: IReceivingDataFileDTO): Promise<string> {

    const { email, file, response } = credentials

    const user = await prisma.user.findUnique({ where: { email } })

    if (!user) return credentials.response.status(400).send("operation failed: user does not exist")

    const originalname = file.originalname

    File.handleVerifyExtension({ originalname, response })

    File.handleVerifyExists({ id: user.id, originalname, response })

    const filename = General.handleFormatingFilename(originalname);

    if (!filename) return

    const data: ICreatingFileDTO = {
      email,
      File: originalname,
      Date: String(new Date()),
      Time: String(new Date()),
      Size: file.size,
      response
    }
    File.handleCreate(data)

  }

  async DeleteUploadFileDb(file: DeleteDTO, User: UserDTO): Promise<string> {

    const user = await prisma.user.findUnique({ where: { email: User.email } })

    if (!user) return "operation failed: user does not exist"

    const encodedPassword = await compare(User.password, user.password);

    if (!encodedPassword) return "operation failed: these credentials do not correspond to any user"

    const { count } = await prisma.file.deleteMany({
      where: {
        authorId: {
          equals: user.id
        },
        File: file.name
      }
    });

    if (count < 1) return "operation failed: file no deleted";

    return `operation completed successfully`
  }

  async DeleteUploadFileLocal(file: DeleteDTO): Promise<string> {

    const folder = "files";
    const filePath = `${folder}/${file.name}`;

    try {
      const exist = await fs.pathExists(filePath);
      if (!exist) {
        return `the file does ${filePath} not exist.`;
      }

      await fs.remove(filePath);

      return `the file  ${filePath} was removed successfully.`;
    } catch (error) {
      return `an error occurred while removing the file ${filePath}: ${error}`;
    }
  }

}
