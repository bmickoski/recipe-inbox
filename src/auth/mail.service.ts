import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly resend: Resend | null;
  private readonly fromEmail: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    this.fromEmail =
      this.configService.get<string>('EMAIL_FROM') ??
      'Recipe Inbox <onboarding@resend.dev>';
    this.resend = apiKey ? new Resend(apiKey) : null;
  }

  async sendPasswordResetEmail(to: string, resetUrl: string) {
    if (!this.resend) {
      this.logger.warn(
        'RESEND_API_KEY is not set. Skipping password reset email send.',
      );
      return;
    }

    const result = await this.resend.emails.send({
      from: this.fromEmail,
      to,
      subject: 'Reset your Recipe Inbox password',
      html: `
        <p>You requested a password reset for Recipe Inbox.</p>
        <p><a href="${resetUrl}">Reset password</a></p>
        <p>This link expires in 1 hour.</p>
      `,
    });

    if (result.error) {
      this.logger.error(
        `Failed sending password reset email to ${to}: ${result.error.message}`,
      );
      return;
    }

    this.logger.log(
      `Password reset email queued for ${to}. Resend ID: ${result.data?.id ?? 'n/a'}`,
    );
  }
}
