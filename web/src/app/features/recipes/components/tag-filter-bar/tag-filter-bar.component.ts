import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { MatChipsModule } from '@angular/material/chips';

@Component({
  selector: 'app-tag-filter-bar',
  imports: [MatChipsModule],
  templateUrl: './tag-filter-bar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TagFilterBarComponent {
  @Input({ required: true }) tags: Array<{ tag: string; count: number }> = [];
  @Input() activeTag: string | null = null;
  @Output() tagChange = new EventEmitter<string | null>();
}
