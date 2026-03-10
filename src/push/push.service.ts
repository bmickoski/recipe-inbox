import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import webpush, { PushSubscription } from 'web-push';
import { PrismaService } from '../prisma/prisma.service';

type NotificationPayload = {
  title: string;
  body: string;
  recipeId?: string;
};

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);
  private readonly enabled: boolean;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    const subject =
      this.configService.get<string>('VAPID_SUBJECT') ??
      'mailto:dev@recipe-inbox.local';
    const publicKey = this.configService.get<string>('VAPID_PUBLIC_KEY');
    const privateKey = this.configService.get<string>('VAPID_PRIVATE_KEY');

    if (publicKey && privateKey) {
      webpush.setVapidDetails(subject, publicKey, privateKey);
      this.enabled = true;
    } else {
      this.enabled = false;
      this.logger.warn(
        'Push notifications disabled: VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY missing.',
      );
    }
  }

  async subscribe(
    userId: string,
    sub: { endpoint: string; p256dh: string; auth: string },
  ): Promise<void> {
    await this.prisma.pushSubscription.upsert({
      where: { endpoint: sub.endpoint },
      update: {
        p256dh: sub.p256dh,
        auth: sub.auth,
        userId,
      },
      create: {
        userId,
        endpoint: sub.endpoint,
        p256dh: sub.p256dh,
        auth: sub.auth,
      },
    });
  }

  async notifyBoardMembers(
    boardId: string,
    excludeUserId: string,
    payload: NotificationPayload,
  ): Promise<void> {
    if (!this.enabled) return;

    try {
      const members = await this.prisma.member.findMany({
        where: {
          boardId,
          userId: { not: excludeUserId },
        },
        select: {
          userId: true,
          user: {
            select: {
              pushSubscriptions: {
                select: {
                  id: true,
                  endpoint: true,
                  p256dh: true,
                  auth: true,
                },
              },
            },
          },
        },
      });

      const subs = members.flatMap((member) => member.user.pushSubscriptions);
      const message = JSON.stringify({
        notification: {
          title: payload.title,
          body: payload.body,
          icon: '/icons/icon-192.png',
          data: { url: '/recipes', recipeId: payload.recipeId ?? null },
        },
      });

      for (const sub of subs) {
        const webPushSub: PushSubscription = {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        };

        try {
          await webpush.sendNotification(webPushSub, message);
        } catch (error: unknown) {
          const statusCode = getWebPushStatusCode(error);
          if (statusCode === 404 || statusCode === 410) {
            await this.prisma.pushSubscription.delete({
              where: { endpoint: sub.endpoint },
            });
            continue;
          }

          this.logger.warn(
            `Failed to send push notification for endpoint ${sub.endpoint}`,
          );
        }
      }
    } catch (error: unknown) {
      this.logger.warn(
        `notifyBoardMembers failed for board ${boardId}: ${stringifyError(error)}`,
      );
    }
  }
}

function getWebPushStatusCode(error: unknown): number | undefined {
  if (typeof error === 'object' && error !== null && 'statusCode' in error) {
    const statusCode = (error as { statusCode?: number }).statusCode;
    return typeof statusCode === 'number' ? statusCode : undefined;
  }
  return undefined;
}

function stringifyError(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}
