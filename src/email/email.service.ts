import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { ISendMailerDTO } from './../../types/global/global';

@Injectable()
export class EmailService {
    constructor(private mailerService: MailerService) { }

    async sendEmail(user: ISendMailerDTO) {
        const confirmation_url = user.token;
        console.log(user.email, user.token, user.name)
        await this.mailerService.sendMail({
            to: user.email,
            subject: 'Welcome to DropZone! open and change your password',
            template: './welcome',
            context: {
                name: user.name,
                confirmation_url,
            },
        });
    }
}
