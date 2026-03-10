import { Component, inject, OnDestroy, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatBottomSheetRef, MAT_BOTTOM_SHEET_DATA } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

type AddRecipeSheetData = {
  value: string;
};

@Component({
  selector: 'app-add-recipe-sheet',
  imports: [FormsModule, MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule],
  template: `
    <section class="sheet">
      <header class="sheet-header">
        <div>
          <p class="eyebrow">Save</p>
          <h2>Add recipe link</h2>
        </div>
        <button mat-icon-button aria-label="Close add recipe" (click)="close()">
          <mat-icon>close</mat-icon>
        </button>
      </header>

      <form class="form" (ngSubmit)="submit()">
        <mat-form-field appearance="outline" subscriptSizing="dynamic">
          <mat-label>Recipe URL</mat-label>
          <input
            matInput
            name="recipeUrl"
            placeholder="Paste Instagram, TikTok, YouTube, or website URL"
            [ngModel]="value()"
            (ngModelChange)="value.set($event)"
            (paste)="onPaste($event)"
            autofocus
          />
        </mat-form-field>

        <p class="hint">Paste a valid URL and it will save automatically.</p>

        <button mat-flat-button color="primary" type="submit" [disabled]="!value().trim()">
          Save recipe
        </button>
      </form>
    </section>
  `,
  styles: [
    `
      .sheet {
        display: grid;
        gap: 1rem;
        padding: 0.5rem 0 0.75rem;
      }

      .sheet-header {
        align-items: start;
        display: flex;
        justify-content: space-between;
      }

      .eyebrow {
        color: #64748b;
        font-size: 0.75rem;
        letter-spacing: 0.08em;
        margin: 0 0 0.25rem;
        text-transform: uppercase;
      }

      h2 {
        margin: 0;
      }

      .form {
        display: grid;
        gap: 0.75rem;
      }

      .hint {
        color: #64748b;
        font-size: 0.85rem;
        margin: -0.25rem 0 0;
      }
    `,
  ],
})
export class AddRecipeSheetComponent implements OnDestroy {
  private readonly data = inject<AddRecipeSheetData>(MAT_BOTTOM_SHEET_DATA);
  private readonly bottomSheetRef =
    inject<MatBottomSheetRef<AddRecipeSheetComponent, string | undefined>>(MatBottomSheetRef);
  private autoSubmitTimer: ReturnType<typeof setTimeout> | null = null;

  readonly value = signal(this.data.value);

  submit() {
    const url = this.value().trim();
    if (!url) return;
    this.bottomSheetRef.dismiss(url);
  }

  close() {
    this.bottomSheetRef.dismiss();
  }

  onPaste(event: ClipboardEvent) {
    const pastedText = event.clipboardData?.getData('text')?.trim() ?? '';
    if (!isValidUrl(pastedText)) return;

    event.preventDefault();
    this.value.set(pastedText);

    if (this.autoSubmitTimer) {
      clearTimeout(this.autoSubmitTimer);
    }

    this.autoSubmitTimer = setTimeout(() => this.submit(), 300);
  }

  ngOnDestroy(): void {
    if (this.autoSubmitTimer) {
      clearTimeout(this.autoSubmitTimer);
    }
  }
}

function isValidUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}
