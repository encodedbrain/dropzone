/* eslint-disable prettier/prettier */
import { Response } from "express";

export interface IDownloadFileDTO {
    name: string
    response: Response
}