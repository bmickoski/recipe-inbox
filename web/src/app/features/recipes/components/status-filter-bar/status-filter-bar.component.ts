import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { RecipeFilterStatus } from '../../../../core/stores/recipes.store';

@Component({
  selector: 'app-status-filter-bar',
  imports: [MatButtonToggleModule],
  templateUrl: './status-filter-bar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusFilterBarComponent {
  @Input() activeStatus: RecipeFilterStatus = 'ALL';
  @Output() statusChange = new EventEmitter<RecipeFilterStatus>();
}
