import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { MatChipsModule } from '@angular/material/chips';
import { BoardMember } from '../../../../core/models/board.model';

@Component({
  selector: 'app-saved-by-filter-bar',
  imports: [MatChipsModule],
  templateUrl: './saved-by-filter-bar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SavedByFilterBarComponent {
  @Input({ required: true }) members: BoardMember[] = [];
  @Input() activeCreatedBy: string | null = null;
  @Output() createdByChange = new EventEmitter<string | null>();
}
