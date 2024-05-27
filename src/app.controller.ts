/* eslint-disable prettier/prettier */
import {
  Body,
  Controller,
  Delete,
  Get, Headers, Param,
  Post, Res,
  UploadedFile, UseGuards, UseInterceptors,
} from '@nestjs/common';
import { AppService } from "./app.service";
import { diskStorage } from "multer";
import { DeleteDTO } from "../dto/deleteDTO";
import { CreateUserDTO } from '../dto/createUserDTO';
import { FileInterceptor } from '@nestjs/platform-express';
import { ReadFileDTO } from '../dto/readFileDTO';
import { GuardGuard } from './guard/guard.guard';
import e, { Response } from 'express';
import { Methods } from '../utils/methods';


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
  async handleGetFileDownload(@Param("filename") filename: string, @Headers("email") email: string, @Headers("password") password: string, @Res({ passthrough: true }) res: any): Promise<any> {
    if (!email || !password) return "operation failed: There's something missing here"
    return await this.appService.DownloadFile({ filename, email, password }, res).then(response => response).catch(error => error);
  }

  @Get("user/file/:filename")
  async handleGetFile(@Param("filename") filename: string, @Res() res: any): Promise<any> {
    return await this.appService.ExposeFile(filename, res).then(response => response).catch(error => error);
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
  async handleCreateFile(@UploadedFile() file: Express.Multer.File, @Headers("Email") Email: string, @Headers("Password") Password: string, @Res() response: Response): Promise<any> {
    if (!file) return "operation failed: something is missing here";

    return await this.appService.CreateFileUserDb(file, Email, Password, response).then(response => response).catch(error => error);
  }

  @Post("user/create")
  async handleCreateNewUser(@Body() User: CreateUserDTO): Promise<any> {
    if (!User.password || !User.email || !User.name) return "operation failed: something missing here"
    return await this.appService.CreateNewUser(User).then(response => response).catch(error => error);
  }

  @UseGuards(GuardGuard)
  @Delete("user/file/delete")
  async handleDeleteFile(@Body() file: DeleteDTO, @Headers("email") email: string, @Headers("password") password: string): Promise<any> {

    if (!file.name || !email || !password) return "operation failed: the name for the file was not provided"

    this.appService.DeleteUploadFileLocal(file).then(response => response)

    return this.appService.DeleteUploadFileDb(file, { email, password }).then(response => response).catch(error => error);

  }

}