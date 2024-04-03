/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { DeleteDto } from '../dto/deleteDto';
import * as fs from 'fs-extra';

@Injectable ()
export class AppService {


  UploadMessage(text: string) : string{
    return text
  }
  async UploadFileDb ( { originalname , size } : Express.Multer.File ) : Promise<any> {

    const date = new Date ().toLocaleDateString ( "pt-BR" );
    const RandomInteger = Math.floor((Math.random() * 1000)* 1000);
    const currentTime = new Date ().toLocaleTimeString ( "pt-BR" , { hour12 : false } );
    const prisma = new PrismaClient ();
    const ext = originalname.split ( "." );
    const fileName = `${ ext[ 0 ] }${ RandomInteger }`;

    const fileExists = await prisma.upload.findFirst({
      where:{
        File: fileName
      }
    });

    if(fileExists) return "operation failed: file name must be unique";

    return prisma.upload.create ( {
      data : {
        Date : date ,
        File : fileName,
        Size : size ,
        Time : currentTime
      }
    } );

  }

  async GetUploadFileDb (name: string) : Promise<any> {
    const prisma = new PrismaClient ();

    const fileExists = await prisma.upload.findFirst({
      where:{
        File: {
          equals:name,
        }
      }
    });
    if(!fileExists) return "operation failed: file does not exist"

    return prisma.upload.findMany ( {
      where : {
        File : {
          startsWith : name
        }
      }
    } );
  }


  async DeleteUploadFileDb ( file : DeleteDto ) : Promise<any> {

    const prisma = new PrismaClient ();

    const fileExists = await prisma.upload.count({
      where:{
        id:{
          equals: file.id
        }
      }
    });

    if(fileExists < 1) return "operation failed: file does not exist"
    const  checkNumberOfFiles = Number(fileExists) < 1 ? 'file were deleted' : 'files were deleted';

    await prisma.upload.deleteMany ( {
      where : {
        id : {
          equals : file.id
        }
      }
    } );

    return  `operation completed successfully: ${fileExists } ${checkNumberOfFiles}`
  }

  async DeleteUploadFileLocal ( file : DeleteDto ) : Promise<string>{

    const RandomInteger = Math.floor((Math.random() * 1000)* 1000);


    const folder = "files";
    const ext = file.name.split(".");
    const fileName = `${ext[0]}${RandomInteger}`;
    const filePath = `${folder}/${fileName}`;

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
