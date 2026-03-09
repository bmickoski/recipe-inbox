import { inject, Injectable } from '@angular/core';
import { SwPush } from '@angular/service-worker';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class PushNotificationService {
  private readonly swPush = inject(SwPush);
  private readonly api = inject(ApiService);

  async requestPermissionAndSubscribe(): Promise<void> {
    try {
      if (!this.swPush.isEnabled) return;
      if (!environment.vapidPublicKey) return;
      if (Notification.permission === 'denied') return;

      const subscription = await this.swPush.requestSubscription({
        serverPublicKey: environment.vapidPublicKey,
      });

      const json = subscription.toJSON();
      const endpoint = json.endpoint;
      const p256dh = json.keys?.['p256dh'];
      const auth = json.keys?.['auth'];

      if (!endpoint || !p256dh || !auth) return;

      await firstValueFrom(this.api.subscribePush({ endpoint, p256dh, auth }));
    } catch {
      // Push is enhancement only; never block the app flow.
    }
  }
}
