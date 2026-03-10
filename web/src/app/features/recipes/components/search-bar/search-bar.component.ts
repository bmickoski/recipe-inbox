import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-search-bar',
  imports: [FormsModule, MatFormFieldModule, MatIconModule, MatInputModule, MatButtonModule],
  template: `
    <mat-form-field appearance="outline" class="search-field">
      <mat-icon matPrefix>search</mat-icon>
      <input
        matInput
        type="search"
        placeholder="Search recipes..."
        [ngModel]="value"
        (ngModelChange)="valueChange.emit($event)"
      />
      @if (value) {
        <button matSuffix mat-icon-button aria-label="Clear" (click)="valueChange.emit('')">
          <mat-icon>close</mat-icon>
        </button>
      }
    </mat-form-field>
  `,
  styles: [
    `
      .search-field {
        width: 100%;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchBarComponent {
  @Input() value = '';
  @Output() valueChange = new EventEmitter<string>();
}
