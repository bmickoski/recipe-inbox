import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export type WakeState = 'idle' | 'checking' | 'slow' | 'ready';

const SLOW_THRESHOLD_MS = 8_000;

@Injectable({ providedIn: 'root' })
export class WakeService {
  private readonly http = inject(HttpClient);

  readonly state = signal<WakeState>('idle');

  ping(): void {
    if (this.state() !== 'idle') return;

    this.state.set('checking');

    const slowTimer = setTimeout(() => {
      if (this.state() === 'checking') {
        this.state.set('slow');
      }
    }, SLOW_THRESHOLD_MS);

    this.http.get(`${environment.apiBaseUrl}/health`).subscribe({
      next: () => {
        clearTimeout(slowTimer);
        this.state.set('ready');
      },
      error: () => {
        clearTimeout(slowTimer);
        this.state.set('ready');
      },
    });
  }
}
