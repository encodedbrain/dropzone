/* eslint-disable prettier/prettier */
export interface IReceivingDataFileDTO {
  file: Express.Multer.File;
  email: string;
  response: Response | any;
}
