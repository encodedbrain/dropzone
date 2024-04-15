/* eslint-disable prettier/prettier */
import { Injectable, Res, StreamableFile } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { DeleteDTO } from '../dto/deleteDTO';
import * as fs from 'fs-extra';
import { CreateUserDTO } from '../dto/createUserDTO';
import { UserDTO } from '../dto/userDTO';
import { ReadFileDTO } from '../dto/readFileDTO';
import { ReadFileDownload } from '../dto/readFileDownload';
import { join } from 'node:path';
import { createReadStream } from 'fs';
import { Response } from 'express';
import * as process from 'node:process';
import { compare, hash } from "bcrypt";

@Injectable()
export class AppService {


  UploadMessage(text: string): string {
    return text
  }

  async GetFileDb(User: ReadFileDTO): Promise<any> {
    const prisma = new PrismaClient();

    const user = await prisma.user.findUnique({ where: { email: User.email } })

    if (!user) return "operation failed: user does not exist"

    const encodedPassword = await compare(User.password, user.password);

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

  async GetAllFileDb(User: ReadFileDTO): Promise<any> {
    const prisma = new PrismaClient();

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

  async DownloadFile(User: ReadFileDownload, @Res() res: any): Promise<any> {

    const prisma = new PrismaClient();

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

  async CreateNewUser(User: CreateUserDTO): Promise<any> {
    const prisma = new PrismaClient();
    const rgxEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const rgxName = /^[a-zA-Z\s]+$/;
    const rgxPwd = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    const maxLength = 31


    if (!rgxEmail.test(User.email)) return "operation failed: email format not supported"
    if (!rgxName.test(User.name)) return "operation failed: name format not supported"
    if (!rgxPwd.test(User.password)) return "operation failed: password format not supported"
    if (User.name.length > maxLength) return "operation failed: name too long, please abbreviate your name"

    const userExists = await prisma.user.findFirst({
      where: {
        name: {
          equals: User.name
        }
      }
    });

    if (userExists) return "operation failed: this user already exists"

    const encodedPassword = await hash(User.password, 10);

    await prisma.user.create({
      data: {
        name: User.name,
        email: User.email,
        password: encodedPassword
      }
    });

    return "user created successfully";
  }

  async CreateFileUserDb(File: Express.Multer.File, email: string, password: string): Promise<any> {

    const prisma = new PrismaClient();

    const user = await prisma.user.findUnique({ where: { email: email } })

    if (!user) return "operation failed: user does not exist"

    const encodedPassword = await compare(password, user.password);

    if (!encodedPassword) return "operation failed: these credentials do not correspond to any user"

    const extension = [ "jpg", "gif", "png", "svg", "psd", "raw", "tiff", "bmp", "jpeg",
      "docx", "pdf", "txt", "xlsx"]

    const fileExtension = File.originalname.split(".")[1]

    if(!extension.includes(fileExtension))  return  "operation failed: extension format not supported"

    const fileExists = await prisma.file.findFirst({
      where: {
        authorId: {
          equals: user.id
        }, File: {
          equals: File.originalname
        }
      }
    })

    if (fileExists) return "operation failed: file already exists";

    await prisma.user.update({
      where: {
        email: email,
        password: user.password
      },
      data: {
        file: {
          create: {
            File: File.originalname,
            Date: String(new Date()),
            Time: String(new Date()),
            Size: File.size
          }
        }
      }
    });

    return "operation completed: add new file";

  }

  async DeleteUploadFileDb(file: DeleteDTO, User: UserDTO): Promise<any> {

    const prisma = new PrismaClient();

    const user = await prisma.user.findUnique({ where: { email: User.email } })

    if (!user) return "operation failed: user does not exist"

    const encodedPassword = await compare(User.password, user.password);

    if (!encodedPassword) return "operation failed: these credentials do not correspond to any user"

    const {count} =  await prisma.file.deleteMany({
      where: {
        authorId: {
          equals: user.id
        },
        File: file.name
      }
    });

    if(count < 1) return "operation failed: file no deleted";

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
