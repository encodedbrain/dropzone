/* eslint-disable prettier/prettier */
import { PrismaClient } from "@prisma/client"
import { ICreatingFileDTO } from "types/file/ICreatingFileDTO"
import { General } from "utils/general"
import { createReadStream, existsSync } from 'fs';
import { resolve } from "path";
import { NotFoundException, StreamableFile } from "@nestjs/common";
import { IDownloadFileDTO } from "types/file/IDownloadFileDTO";
import { IVerifyFileDTO } from "types/file/IVerifyFileDTO";
import { IVerifyFileExtensionDTO } from "types/file/IVerifyFileExtensionDTO";

const prisma = new PrismaClient()

export const File = {
    handleVerifyExtension(credentials: IVerifyFileExtensionDTO): string {

        const extension = ["jpg", "gif", "png", "svg", "psd", "raw", "tiff", "bmp", "jpeg",
            "docx", "pdf", "txt", "xlsx"]
        if (!extension.includes(credentials.originalname.split(".")[1])) return credentials.response.status(400).send("operation failed: extension format not supported")
    },
    async handleVerifyExists(credentials: IVerifyFileDTO): Promise<string> {

        const fileExists = await prisma.file.findFirst({
            where: {
                authorId: credentials.id,
                name: General.handleFormatingFilename(credentials.originalname)
            }
        })

        if (fileExists) return credentials.response.status(400).send("operation failed: file already exists")
    },
    async handleCreate(credentials: ICreatingFileDTO): Promise<string> {

        const { mimeType, size, name, path, response } = credentials

        await prisma.user.update({
            where: {
                email: credentials.email
            },
            data: {
                file: {
                    create: {
                        name,
                        path,
                        size,
                        mimeType,
                    }
                }
            }
        });

        return response.status(201).send("operation completed: add new file");
    },
    handleDownload(credentials: IDownloadFileDTO): StreamableFile {
        const folder = resolve("archive", credentials.name);

        if (!existsSync(folder)) {
            throw new NotFoundException('error when searching for file');
        }

        const file = createReadStream(folder)

        credentials.response.set({
            'Content-Type': 'image/*',
            'Content-Disposition': `attachment; filename="${credentials.name}"`,
        });
        return new StreamableFile(file);
    }

}