/* eslint-disable prettier/prettier */
import * as fs from 'fs-extra';
import * as process from 'node:process';
import { Injectable, Res, StreamableFile } from '@nestjs/common';
import { join } from 'node:path';
import { compare } from 'bcrypt';
import { File } from 'utils/File/File';
import { General } from 'utils/general';
import { PrismaClient } from '@prisma/client';
import { Response, response } from "express"
import {
  IReceivingDataFileDTO,
  IExposedFileDTO,
  IReadFileDownloadDTO,
  IReadFileDTO,
  IGetAllFileDTO,
  IDeleteUploadFileDbDTO
} from 'types/global/global';
import { Service } from 'utils/service/service';
import { IDeleteUploadFileLocalDTO } from 'types/file/DeleteUploadFileLocalDTO';


const prisma = new PrismaClient();

@Injectable()
export class AppService {

  UploadMessage(credentials: string, @Res() response: Response): Response {
    return response.status(200).send(credentials)
  }


  async GetFileDb(credentials: IReadFileDTO, @Res() response: Response
  ): Promise<any> {

    const { email, name, password } = credentials

    if (!Service.handleVerifyEmail(email) || !Service.handleVerifyNickname(name) || !Service.handleVerifyPassword(password))
      return response.status(400).send("credentials invalid")

    const user = await prisma.user.findUnique({ where: { email } })

    if (!user) return response.status(400).send("operation failed: user does not exist")

    const encodedPassword = await compare(password, user.password);

    if (!encodedPassword) return response.status(400).send("operation failed: these credentials do not correspond to any user")

    const fileExists = await prisma.file.findFirst({
      where: {
        authorId: {
          equals: user.id
        },
        name: {
          equals: name,
        }
      }
    });
    if (!fileExists) return response.status(400).send("operation failed: file does not exist")

    return response.status(200).send(fileExists)
  }

  async GetAllFileDb(credentials: IGetAllFileDTO, @Res() response: Response): Promise<Response> {

    const { email, name, password } = credentials

    if (!Service.handleVerifyEmail(email) || !Service.handleVerifyNickname(name) || !Service.handleVerifyPassword(password))
      return response.status(400).send("credentials invalid")

    const user = await prisma.user.findUnique({ where: { email } })

    if (!user) return response.status(400).send("operation failed: user does not exist")

    const encodedPassword = await compare(password, user.password);

    if (!encodedPassword) return response.status(400).send("operation failed: these credentials do not correspond to any user")

    const fileExists = await prisma.file.findMany({
      where: {
        authorId: user.id
      }
    })

    return response.status(200).send(fileExists);
  }

  async DownloadFile(credentials: IReadFileDownloadDTO, @Res() response: Response): Promise<StreamableFile | Response<string>> {

    const { email, name } = credentials

    if (!Service.handleVerifyEmail(email)) return response.status(400).send("credentials invalid")

    const user = await prisma.user.findUnique({ where: { email } })

    if (!user) return response.status(400).send("operation failed: user does not exist")


    return File.handleDownload({ name, response });


  }

  async ExposeFile(credentials: IExposedFileDTO, @Res() response: Response): Promise<Response<string> | void> {
    return response.sendFile(join(process.cwd(), './files/' + credentials.name));
  }

  async CreateFileUserDb(credentials: IReceivingDataFileDTO, @Res() response: Response): Promise<Response | string> {

    if (!credentials.file) return response.status(400).send("operation failed: something is missing here")

    if (!Service.handleVerifyEmail(credentials.email)) return response.status(400).send("credentials invalid")

    const user = Service.handleUserSearchViaEmail(credentials.email)

    if (!user) return response.status(400).send("operation failed: user does not exist")

    File.handleVerifyExtension({ originalname: credentials.file.originalname, response })

    File.handleVerifyExists({ id: (await user).id, originalname: credentials.file.originalname, response })

    if (!General.handleFormatingFilename(credentials.file.originalname)) return response.status(400).send("credentials invalid")

    return await File.handleCreate({
      name: credentials.file.originalname,
      path: credentials.file.path,
      size: credentials.file.size,
      mimeType: credentials.file.mimetype,
      response, email: (await user).email
    })
  }

  async DeleteUploadFileDb(credentials: IDeleteUploadFileDbDTO, @Res() response: Response): Promise<Response> {

    const { email, name, password
    } = credentials

    if (!Service.handleVerifyEmail(email) || !Service.handleVerifyPassword(password))
      return response.status(400).send("credentials invalid")

    const user = await prisma.user.findUnique({ where: { email } })

    if (!user) return response.status(400).send("operation failed: user does not exist")

    const encodedPassword = await compare(password, user.password);

    if (!encodedPassword) return response.status(400).send("operation failed: these credentials do not correspond to any user")

    const { count } = await prisma.file.deleteMany({
      where: {
        authorId: {
          equals: user.id
        },
        name: name
      }
    });

    if (count < 1) return response.status(400).send("operation failed: file no deleted")

    return response.status(200).send("operation completed successfully")
  }

  async DeleteUploadFileLocal(credentials: IDeleteUploadFileLocalDTO): Promise<Response> {

    const { name } = credentials

    const folder = "files";
    const filePath = `${folder}/${name}`;

    try {
      const exist = await fs.pathExists(filePath);
      if (!exist) {
        return response.status(400).send("the file does ${filePath} not exist.")
      }

      await fs.remove(filePath);

      return response.status(400).send("the file  ${filePath} was removed successfully.")
    } catch (error) {
      return response.status(400).send("an error occurred while removing the file ${filePath}: ${error}")
    }
  }

}
