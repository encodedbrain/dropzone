import { Response } from "express";

/* eslint-disable prettier/prettier */
export interface IForgotPasswordDTO {
    token: string;
    res: Response;
}