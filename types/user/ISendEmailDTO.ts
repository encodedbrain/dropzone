/* eslint-disable prettier/prettier */
import { Response } from "express";

export interface ISendEmailDTO {
    email: string;
    response: Response
}