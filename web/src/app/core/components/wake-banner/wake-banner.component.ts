import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { WakeState } from '../../services/wake.service';

@Component({
  selector: 'app-wake-banner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (state() === 'checking' || state() === 'slow') {
      <div class="wake-banner" [class.slow]="state() === 'slow'">
        <span class="dot"></span>
        @if (state() === 'slow') {
          Still waking up server... please wait.
        } @else {
          Waking up server (free tier), first load may take up to 60s.
        }
      </div>
    }
  `,
  styles: [`
    .wake-banner {
      align-items: center;
      background: #1e3a5f;
      color: #93c5fd;
      display: flex;
      font-size: 0.8rem;
      gap: 0.5rem;
      justify-content: center;
      padding: 0.4rem 1rem;
    }

    .wake-banner.slow {
      background: #7c2d12;
      color: #fdba74;
    }

    .dot {
      animation: pulse 1.2s ease-in-out infinite;
      background: currentColor;
      border-radius: 50%;
      display: inline-block;
      flex-shrink: 0;
      height: 7px;
      width: 7px;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.3; }
    }
  `],
})
export class WakeBannerComponent {
  readonly state = input.required<WakeState>();
}
