/* eslint-disable prettier/prettier */
import { Response } from "express";

export interface IChangingPasswordDTO {
    name: string;
    password: string;
    newPassword: string;
    response: Response
}