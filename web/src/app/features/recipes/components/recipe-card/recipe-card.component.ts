import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { RECIPE_TAGS, Recipe } from '../../../../core/models/recipe.model';

@Component({
  selector: 'app-recipe-card',
  imports: [
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './recipe-card.component.html',
  styleUrl: './recipe-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecipeCardComponent {
  @Input({ required: true }) recipe!: Recipe;
  @Input({ required: true }) savedBy = 'Unknown';
  @Input() confirmDelete = false;

  @Output() open = new EventEmitter<void>();
  @Output() requestDelete = new EventEmitter<void>();
  @Output() cancelDelete = new EventEmitter<void>();
  @Output() confirmDeleteClick = new EventEmitter<void>();
  @Output() toggleStatus = new EventEmitter<void>();
  @Output() toggleTag = new EventEmitter<string>();
  @Output() notesBlur = new EventEmitter<string>();

  readonly quickTags = RECIPE_TAGS;

  toTagLabel(tag: string): string {
    return tag.charAt(0).toUpperCase() + tag.slice(1);
  }

  cookedLabel(): string {
    if (!this.recipe.cookedAt) return '';

    const cookedAt = new Date(this.recipe.cookedAt);
    const now = Date.now();
    const diffDays = Math.round((now - cookedAt.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) return 'Cooked today';
    if (diffDays === 1) return 'Cooked 1 day ago';
    return `Cooked ${diffDays} days ago`;
  }

  onNotesBlur(value: string) {
    this.notesBlur.emit(value);
  }

  placeholderEmoji(): string {
    const url = this.recipe.url.toLowerCase();
    if (url.includes('instagram')) return '📸';
    if (url.includes('tiktok')) return '🎵';
    if (url.includes('youtube')) return '▶';
    return '🍽';
  }
}
