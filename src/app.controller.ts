/* eslint-disable prettier/prettier */
import { Body , Controller , Delete , Get , Param , Post , UploadedFile , UseInterceptors } from "@nestjs/common";
import { AppService } from "./app.service";
import { FileInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import e from "express";
import { DeleteDto } from "../dto/deleteDto";


@Controller ("upload")
export class AppController {
  constructor ( private readonly appService : AppService ) {
  }

  @Get()
  handleMessage(){
    return this.appService.UploadMessage("welcome to my api");
  }

  @Post ( "file"
  )
  @UseInterceptors ( FileInterceptor ( "file" , {
    storage : diskStorage ( {
      destination : "./files" ,
      filename ( _req : e.Request , file : Express.Multer.File , callback : ( error : ( Error | null ) , filename : string ) =>
        void ) {
        const D = new Date()
        const year = D.getFullYear();
        const month = D.getMonth() + 1;
        const day = D.getDate();
        const ext = file.originalname.split ( "." );
        const filename = `${ ext[ 0 ] }-${ day }-${month}-${year}.${ ext[ 1 ] }`;

        callback ( null , filename );
      }
    } )
  } ) )
  async handleUploadFile ( @UploadedFile () file : Express.Multer.File ) : Promise<any> {
    if(!file) return  "operation failed: something is missing here";
    return await this.appService.UploadFileDb ( file ).then(response =>  response).catch(error => error);
  }

  @Get ( ":name" )
 async handleUploadGet (@Param("name") name: string) : Promise<any> {
    if(!name) return "operation failed: the name for the file was not provided"
    return this.appService.GetUploadFileDb (name).then(response => response).catch(error => error);
  }

  @Delete ( "delete" )
async  handleUploadDelete ( @Body () file : DeleteDto ) : Promise<any>{

    if(!file.id) return "operation failed: the identifier for the file was not provided"
    if(!file.name) return "operation failed: the name for the file was not provided"

    this.appService.DeleteUploadFileLocal ( file).then (  res => res)

    return this.appService.DeleteUploadFileDb ( file ).then ( res => res ).catch ( error =>  error );

  }

}
