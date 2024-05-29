/* eslint-disable prettier/prettier */
import { Response } from "express";

export interface IExposedFileDTO {
    filename: string,
    response: Response
}