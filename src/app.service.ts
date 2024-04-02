/* eslint-disable prettier/prettier */
import { Injectable  } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { DeleteDto } from "../dto/deleteDto";
import * as fs from 'fs-extra';

@Injectable ()
export class AppService {


  UploadMessage(text: string) : string{
    return text
  }
  async UploadFileDb ( { originalname , size } : Express.Multer.File ) : Promise<any> {

    const date = new Date ().toLocaleDateString ( "pt-BR" );
    const currentTime = new Date ().toLocaleTimeString ( "pt-BR" , { hour12 : false } );
    const prisma = new PrismaClient ();
    const ext = originalname.split ( "." );
    const absolutePath = `${ ext[ 0 ] }-${ date }.${ ext[ 1 ] }`;

    return prisma.upload.create ( {
      data : {
        Date : date ,
        File : absolutePath ,
        Size : size ,
        Time : currentTime
      }
    } );

  }

  async GetUploadFileDb (name: string) : Promise<any> {
    const prisma = new PrismaClient ();

    return prisma.upload.findMany ( {
      where : {
        File:{
          startsWith: name
        }
      }
    } );
  }


  async DeleteUploadFileDb ( file : DeleteDto ) : Promise<any> {
    const prisma = new PrismaClient ();

    return prisma.upload.deleteMany ( {
      where : {
        id : {
          equals: file.id
        }
      }

    } );
  }

  async DeleteUploadFileLocal ( file : DeleteDto ) : Promise<string>{

    const date = new Date();
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();


    const folder = "files";
    const ext = file.name.split(".");
    const fileName = `${ext[0]}-${day}-${month}-${year}.${ext[1]}`;
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
