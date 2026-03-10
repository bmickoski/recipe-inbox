import { inject, Injectable } from '@angular/core';
import { SwPush } from '@angular/service-worker';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiService } from './api.service';

export type PushSubscribeResult =
  | 'subscribed'
  | 'ios-unsupported'
  | 'denied'
  | 'skipped';

@Injectable({ providedIn: 'root' })
export class PushNotificationService {
  private readonly swPush = inject(SwPush);
  private readonly api = inject(ApiService);

  async requestPermissionAndSubscribe(): Promise<PushSubscribeResult> {
    try {
      const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent);
      if (isIos) return 'ios-unsupported';

      if (!this.swPush.isEnabled) return 'skipped';
      if (!environment.vapidPublicKey) return 'skipped';
      if (Notification.permission === 'denied') return 'denied';

      const subscription = await this.swPush.requestSubscription({
        serverPublicKey: environment.vapidPublicKey,
      });

      const json = subscription.toJSON();
      const endpoint = json.endpoint;
      const p256dh = json.keys?.['p256dh'];
      const auth = json.keys?.['auth'];

      if (!endpoint || !p256dh || !auth) return 'skipped';

      await firstValueFrom(this.api.subscribePush({ endpoint, p256dh, auth }));
      return 'subscribed';
    } catch {
      // Push is enhancement only; never block the app flow.
      return 'skipped';
    }
  }
}
