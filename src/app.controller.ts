/* eslint-disable prettier/prettier */
import {
  Body,
  Controller,
  Delete,
  Get, Headers, Param,
  Post, Res,
  StreamableFile,
  UploadedFile, UseGuards, UseInterceptors,
} from '@nestjs/common';
import { AppService } from "./app.service";
import { diskStorage } from "multer";
import { FileInterceptor } from '@nestjs/platform-express';
import { GuardGuard } from './guard/guard.guard';
import e, { Response } from 'express';
import { General } from '../utils/general';
import { IReadFileRouterParameterDTO, IGetAllFileRouterParameterDTO, IDeleteUploadFileDbDTO } from "../types/global/global"
import { IDeleteUploadFileLocalDTO } from 'types/file/DeleteUploadFileLocalDTO';



@Controller("v1")
export class AppController {
  constructor(private readonly appService: AppService) {
  }

  @Get()
  handleMessage(@Res() response: Response): Response {
    const credentials = "welcome to my api"
    return this.appService.UploadMessage(credentials, response);
  }

  @UseGuards(GuardGuard)
  @Get("user/file/read")
  async handleGetFileDb(@Body() parameter: IReadFileRouterParameterDTO, @Res() response: Response): Promise<Response> {

    if (!parameter.name || !parameter.email || !parameter.password) return response.status(400).send("operation failed: There's something missing here")

    const credentials = { name: parameter.name, password: parameter.password, email: parameter.email, response }

    return this.appService.GetFileDb(credentials, response).then(response => response).catch(error => error);
  }

  @UseGuards(GuardGuard)
  @Get("user/file/all")
  async handleGetAllFiles(@Body() parameter: IGetAllFileRouterParameterDTO, @Res() response: Response): Promise<Response> {
    if (!parameter.email || !parameter.name || !parameter.password) return response.status(400).send("operation failed: There's something missing here")

    const credentials = { name: parameter.name, email: parameter.email, password: parameter.password }

    return this.appService.GetAllFileDb(credentials, response).then(response => response).catch(error => error);
  }

  @Get("user/file/download/:name")
  async handleGetFileDownload(@Param("name") name: string, @Headers("email") email: string, @Res({ passthrough: true }) response: Response): Promise<StreamableFile | Response<string>> {

    if (!email || !name) return response.status(400).send("operation failed: There's something missing here")

    const credentials = { name, email }

    return await this.appService.DownloadFile(credentials, response).then(response => response).catch(error => error);
  }

  @Get("user/file/:filename")
  async handleGetFile(@Param("filename") name: string, @Res() response: any): Promise<Response<string> | void> {
    const credentials = { name }

    if (!name) return response.status(400).send("credentials invalid")

    return await this.appService.ExposeFile(credentials, response).then(response => response).catch(error => error);
  }

  @Post("user/file/upload"
  )
  @UseGuards(GuardGuard)
  @UseInterceptors(FileInterceptor("file", {
    storage: diskStorage({
      destination: "./archive",
      filename(_req: e.Request, file: Express.Multer.File, callback: (error: (Error | null), filename: string) =>
        void) {
        const filename = General.handleFormatingFilename(file.originalname);
        callback(null, filename);
      }
    })
  }))
  async handleCreateFile(@UploadedFile() file: Express.Multer.File, @Headers("email") email: string, @Res() response: Response): Promise<Response> {
    const credentials = { file, email }
    return await this.appService.CreateFileUserDb(credentials, response).then(response => response).catch(error => error)
  }

  @UseGuards(GuardGuard)
  @Delete("user/file/delete")
  async handleDeleteFile(@Body() name: string, @Headers("email") email: string, @Headers("password") password: string, @Res() response: Response): Promise<any> {

    if (!name || !email || !password) return response.status(400).send("operation failed: the name for the file was not provided")

    const credentials: IDeleteUploadFileDbDTO = { name, email, password }
    const deleteFileLocal: IDeleteUploadFileLocalDTO = { name }

    this.appService.DeleteUploadFileLocal(deleteFileLocal).then(response => response)

    return this.appService.DeleteUploadFileDb(credentials, response).then(response => response).catch(error => error);

  }

}