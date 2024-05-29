/* eslint-disable prettier/prettier */
import { Injectable, StreamableFile } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { DeleteDTO } from '../types/file/IDeleteDTO';
import * as fs from 'fs-extra';
import { UserDTO } from '../types/user/IUserDTO';
import { ReadFileDTO } from '../types/file/IReadFileDTO';
import { ReadFileDownloadDTO } from '../types/file/IReadFileDownload';
import { join } from 'node:path';
import { createReadStream } from 'fs';
import { Response } from 'express';
import * as process from 'node:process';
import { Methods } from '../utils/methods';
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
    const prisma = new PrismaClient();

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

    const user = await prisma.user.findUnique({ where: { email: User.email } })

    if (!user) return "operation failed: user does not exist"

    const encodedPassword = await compare(User.password, user.password);

    if (!encodedPassword) return "operation failed: these credentials do not correspond to any user"

    const folder = "./files";

    fs.readdir(folder, (err, files) => {
      if (err) return `error when searching for file: ${err}`
      files.forEach(file => {
        const pathComplete = `${folder}/${file}`;
        fs.stat(pathComplete, (err, statistics) => {
          if (err) return `error getting file information: ${err}`;
          if (statistics.isFile()) {
            if (pathComplete.length < 1) return "operation failed: file does not exist"
          }
        });
      });
    });
    const file = createReadStream(join(process.cwd(), `files/${User.filename}`))
    res.set({
      'Content-Type': 'image/*',
      'Content-Disposition': `attachment; filename="${User.filename}"`,
    });
    return new StreamableFile(file);
  }

  async ExposeFile(filename: string, @Res() res: Response): Promise<any> {
    return res.sendFile(join(process.cwd(), './files/' + filename));
  }


  async CreateFileUserDb(File: Express.Multer.File, email: string, password: string, @Res() res: Response): Promise<any> {

    const prisma = new PrismaClient();

    const user = await prisma.user.findUnique({ where: { email: email } })

    if (!user) return res.status(400).send("operation failed: user does not exist")

    const encodedPassword = await compare(password, user.password);

    if (!encodedPassword) return res.status(200).send("operation failed: these credentials do not correspond to any user")

    const extension = ["jpg", "gif", "png", "svg", "psd", "raw", "tiff", "bmp", "jpeg",
      "docx", "pdf", "txt", "xlsx"]

    const fileExtension = File.originalname.split(".")[1]

    if (!extension.includes(fileExtension)) return res.status(400).send("operation failed: extension format not supported")

    const fileExists = await prisma.file.findFirst({
      where: {
        authorId: {
          equals: user.id
        }, File: {
          equals: Methods.handleFormatingFilename(File.originalname)
        }
      }
    })

    if (fileExists) return res.status(400).send("operation failed: file already exists")


    const filename = Methods.handleFormatingFilename(File.originalname);

    if(!filename) return

    await prisma.user.update({
      where: {
        email: email,
        password: user.password
      },
      data: {
        file: {
          create: {
            File: filename,
            Date: String(new Date()),
            Time: String(new Date()),
            Size: File.size
          }
        }
      }
    });

    return res.status(201).send("operation completed: add new file");

  }

  async DeleteUploadFileDb(file: DeleteDTO, User: UserDTO): Promise<any> {

    const prisma = new PrismaClient();

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
