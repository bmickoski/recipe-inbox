import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-notification-prompt',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatIconModule],
  template: `
    <div class="notif-prompt">
      <mat-icon>notifications_none</mat-icon>
      <span>Get notified when <strong>{{ partnerName() }}</strong> saves recipes</span>
      <div class="actions">
        <button mat-stroked-button type="button" (click)="dismiss.emit()">
          Not now
        </button>
        <button mat-raised-button color="primary" type="button" (click)="enable.emit()">
          Enable
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      .notif-prompt {
        align-items: center;
        background: #f0f9ff;
        border: 1px solid #bae6fd;
        border-radius: 8px;
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
        margin-bottom: 1rem;
        padding: 0.75rem 1rem;
      }
      mat-icon {
        color: #0284c7;
        flex-shrink: 0;
      }
      span {
        flex: 1;
        font-size: 0.9rem;
        min-width: 160px;
      }
      .actions {
        display: flex;
        gap: 0.5rem;
      }
    `,
  ],
})
export class NotificationPromptComponent {
  readonly partnerName = input.required<string>();
  readonly enable = output<void>();
  readonly dismiss = output<void>();
}
