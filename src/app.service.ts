/* eslint-disable prettier/prettier */
import { Injectable , Res , StreamableFile } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { DeleteDTO } from '../dto/deleteDTO';
import * as fs from 'fs-extra';
import { CreateUserDTO } from '../dto/createUserDTO';
import { UserDTO } from '../dto/userDTO';
import { ReadFileDTO } from '../dto/readFileDTO';
import { ReadFileDownload } from '../dto/readFileDownload';
import { join } from 'node:path';
import { createReadStream } from 'fs';
import process from 'node:process';

@Injectable ()
export class AppService {


  UploadMessage(text: string) : string{
    return text
  }

  async GetFileDb (user: ReadFileDTO) : Promise<any> {
    const prisma = new PrismaClient ();

    const userExists = await prisma.user.findFirst({
      where:{
        email: user.email,
        password: user.password
      }
    })

    if(!userExists) return "operation failed: these credentials do not correspond to any user"

    const fileExists = await prisma.file.findFirst({
      where:{
        authorId: {
          equals: userExists.id
        },
        File: {
          equals: user.name,
        }
      }
    });
    if(!fileExists) return "operation failed: file does not exist"

    return fileExists
  }

  async GetAllFileDb (user: ReadFileDTO) : Promise<any> {
    const prisma = new PrismaClient ();

    const userExists = await prisma.user.findFirst({
      where:{
        email: user.email,
        password: user.password
      }
    })

    if(!userExists) return "operation failed: user does not exist"

    const fileExists = await prisma.file.findMany({
      where:{
        authorId: userExists.id
      }
    })

    return fileExists;
  }

  async DownloadFile(user: ReadFileDownload , @Res() res: any) : Promise<any> {

    const prisma = new PrismaClient ();

    const userExists = await prisma.user.findFirst({
      where:{
        email: user.email,
        password: user.password
      }
    })

    if(!userExists) return "operation failed: invalid credentials or non-existent user";

    const folder = "./files";

    fs.readdir(folder , (err, files) => {
      if (err) return `error when searching for file: ${err}`
      files.forEach(file => {
        const pathComplete = `${folder}/${file}` ;
        fs.stat(pathComplete, (err, statistics) => {
          if (err) return `error getting file information: ${err}`;
          if (statistics.isFile()) {
            if(pathComplete.length < 1) return "operation failed: file does not exist"
          }
        });
      });
    });
    const file = createReadStream(join(process.cwd(), `files/${user.filename}`))
    res.set({
      'Content-Type': 'image/*',
      'Content-Disposition': `attachment; filename="${user.filename}"`,
    });
    return new StreamableFile(file);
  }

  async CreateNewUser(User: CreateUserDTO):Promise<any>{
    const prisma = new PrismaClient();
    const rgxEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const rgxName = /^[a-zA-Z\s]+$/;
    const rgxPwd = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    const maxLength = 31


    if(!rgxEmail.test(User.email)) return "operation failed: email format not supported"
    if(!rgxName.test(User.name)) return "operation failed: name format not supported"
    if(!rgxPwd.test(User.password)) return "operation failed: password format not supported"
    if(User.name.length > maxLength) return "operation failed: name too long, please abbreviate your name"

    const userExists = await prisma.user.findFirst({
      where:{
        name:{
          equals: User.name
        }
      }
    });

    if(userExists) return "operation failed: this user already exists"

    return prisma.user.create ( {
      data : {
        name : User.name ,
        email : User.email ,
        password : User.password
      }
    } );
  }

  async CreateFileUserDb ( File: Express.Multer.File , email : string , password: string) : Promise<any> {

    const prisma = new PrismaClient();

    const userExists = await prisma.user.findUnique({
      where:{
       email: email ,
        password: password
      }
    }).then(response => response)


    if(!userExists) return "operation failed: these credentials do not correspond to any user"

    const fileExists = await prisma.file.findFirst({
      where:{
        authorId: {
          equals: userExists.id
        },File:{
          equals:File.originalname
        }
      }
    })

    if(fileExists) return "operation failed: file already exists";

    await prisma.user.update ( {
      where : {
        email : email ,
        password : password
      } ,
      data : {
        file : {
          create : {
            File : File.originalname ,
            Date : String ( new Date () ) ,
            Time : String ( new Date () ) ,
            Size : File.size
          }
        }
      }
    } );

    return "operation completed: add new file";

  }

  async DeleteUploadFileDb ( file : DeleteDTO , user: UserDTO ) : Promise<any> {

    const prisma = new PrismaClient ();

    const userExists = await prisma.user.findFirst({
      where:{
        email: user.email,
        password: user.password
      }
    })
    if(!userExists) return "operation failed: these credentials do not correspond to any user"

    await prisma.file.deleteMany ( {
    where:{
      authorId: {
        equals: userExists.id
      },
      File : file.name
      }
    });

    return  `operation completed successfully`
  }

  async DeleteUploadFileLocal ( file : DeleteDTO ) : Promise<string>{

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
