/* eslint-disable prettier/prettier */
import { Response } from "express";

export interface IDownloadFileDTO {
    filename: string,
    response: Response
}