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
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
    if ( ! file ) return false;
    try {
      return await this.appService.UploadFileDb ( file );
    } catch ( error ) {
      return error;
    }
  }

  @Get ( ":name" )
 async handleUploadGet (@Param("name") name: string) : Promise<any> {
    this.appService.GetUploadFileDb (name).then(response => response).then( data =>
    {
      console.log(data)
      return data
    }).catch( error => console.error(error))
  }

  @Delete ( "delete" )
async  handleUploadDelete ( @Body () file : DeleteDto ) : Promise<any>{
    this.appService.DeleteUploadFileDb ( file ).then ( res => {
      return res;
    } ).catch ( error => console.error ( error ) );

    this.appService.DeleteUploadFileLocal ( file).then (  res => res)
  }

}
