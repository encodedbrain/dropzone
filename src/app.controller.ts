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
import { DeleteDTO } from "../types/file/IDeleteDTO";
import { FileInterceptor } from '@nestjs/platform-express';
import { ReadFileDTO } from '../types/file/IReadFileDTO';
import { GuardGuard } from './guard/guard.guard';
import e, { Response } from 'express';
import { General } from '../utils/general';



@Controller("v1")
export class AppController {
  constructor(private readonly appService: AppService) {
  }

  @Get()
  handleMessage() {
    return this.appService.UploadMessage("welcome to my api");
  }

  @UseGuards(GuardGuard)
  @Get("user/file/read")
  async handleGetFileDb(@Body() user: ReadFileDTO): Promise<any> {
    if (!user.name || !user.email || !user.password) return "operation failed: There's something missing here"
    return this.appService.GetFileDb(user).then(response => response).catch(error => error);
  }

  @UseGuards(GuardGuard)
  @Get("user/file/all")
  async handleGetAllFiles(@Body() user: ReadFileDTO): Promise<any> {
    if (!user) return "operation failed: There's something missing here"
    return this.appService.GetAllFileDb(user).then(response => response).catch(error => error);
  }

  @Get("user/file/download/:filename")
  async handleGetFileDownload(@Param("filename") filename: string, @Headers("email") email: string, @Res({ passthrough: true }) response: Response): Promise<StreamableFile | string> {
    if (!email || !filename) return "operation failed: There's something missing here"
    return await this.appService.DownloadFile({ filename, email, response }).then(response => response).catch(error => error);
  }

  @Get("user/file/:filename")
  async handleGetFile(@Param("filename") filename: string, @Res() response: any): Promise<any> {
    return await this.appService.ExposeFile({ filename, response }).then(response => response).catch(error => error);
  }

  @Post("user/file/upload"
  )
  @UseGuards(GuardGuard)
  @UseInterceptors(FileInterceptor("file", {
    storage: diskStorage({
      destination: "./files",
      filename(_req: e.Request, file: Express.Multer.File, callback: (error: (Error | null), filename: string) =>
        void) {
        const filename = Methods.handleFormatingFilename(file.originalname);
        callback(null, filename);
      }
    })
  }))
  async handleCreateFile(@UploadedFile() file: Express.Multer.File, @Headers("email") email: string, @Res() response: Response): Promise<string> {

    if (!file) return "operation failed: something is missing here";
    return await this.appService.CreateFileUserDb({ file, email, response }).then(response => response).catch(error => error);
  }

  @UseGuards(GuardGuard)
  @Delete("user/file/delete")
  async handleDeleteFile(@Body() file: DeleteDTO, @Headers("email") email: string, @Headers("password") password: string): Promise<any> {

    if (!file.name || !email || !password) return "operation failed: the name for the file was not provided"

    this.appService.DeleteUploadFileLocal(file).then(response => response)

    return this.appService.DeleteUploadFileDb(file, { email, password }).then(response => response).catch(error => error);

  }

}