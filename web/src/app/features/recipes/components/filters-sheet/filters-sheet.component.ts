import { Component, inject } from '@angular/core';
import { MatBottomSheetRef, MAT_BOTTOM_SHEET_DATA } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { BoardMember } from '../../../../core/models/board.model';
import { RecipeFilterStatus } from '../../../../core/stores/recipes.store';

type FiltersSheetData = {
  activeStatus: RecipeFilterStatus;
  activeTag: string | null;
  activeCreatedBy: string | null;
  tags: Array<{ tag: string; count: number }>;
  members: BoardMember[];
};

export type FiltersSheetResult = {
  status: RecipeFilterStatus;
  tag: string | null;
  createdBy: string | null;
};

@Component({
  selector: 'app-filters-sheet',
  imports: [MatButtonModule, MatButtonToggleModule, MatChipsModule, MatIconModule],
  template: `
    <section class="sheet">
      <header class="sheet-header">
        <div>
          <p class="eyebrow">Browse</p>
          <h2>Filters</h2>
        </div>
        <button mat-icon-button aria-label="Close filters" (click)="close()">
          <mat-icon>close</mat-icon>
        </button>
      </header>

      <div class="group">
        <p class="group-title">Status</p>
        <mat-button-toggle-group [value]="status" (change)="status = $event.value">
          <mat-button-toggle value="ALL">All</mat-button-toggle>
          <mat-button-toggle value="WANT_TO_TRY">Want to try</mat-button-toggle>
          <mat-button-toggle value="COOKED">Cooked</mat-button-toggle>
        </mat-button-toggle-group>
      </div>

      <div class="group">
        <p class="group-title">Tags</p>
        <mat-chip-listbox [value]="tag" (change)="tag = $event.value">
          <mat-chip-option [value]="null">All tags</mat-chip-option>
          @for (item of data.tags; track item.tag) {
            <mat-chip-option [value]="item.tag">
              {{ item.tag }} ({{ item.count }})
            </mat-chip-option>
          }
        </mat-chip-listbox>
      </div>

      @if (data.members.length > 1) {
        <div class="group">
          <p class="group-title">Saved by</p>
          <mat-chip-listbox [value]="createdBy" (change)="createdBy = $event.value">
            <mat-chip-option [value]="null">Everyone</mat-chip-option>
            @for (member of data.members; track member.userId) {
              <mat-chip-option [value]="member.userId">
                {{ member.displayName || member.email }}
              </mat-chip-option>
            }
          </mat-chip-listbox>
        </div>
      }

      <footer class="actions">
        <button mat-button type="button" (click)="reset()">Clear all</button>
        <button mat-flat-button color="primary" type="button" (click)="apply()">Apply</button>
      </footer>
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

      .group {
        display: grid;
        gap: 0.5rem;
      }

      .group-title {
        color: #334155;
        font-size: 0.9rem;
        font-weight: 600;
        margin: 0;
      }

      mat-button-toggle-group,
      mat-chip-listbox {
        max-width: 100%;
      }

      .actions {
        display: flex;
        justify-content: space-between;
        padding-top: 0.5rem;
      }
    `,
  ],
})
export class FiltersSheetComponent {
  protected readonly data = inject<FiltersSheetData>(MAT_BOTTOM_SHEET_DATA);
  private readonly bottomSheetRef =
    inject<MatBottomSheetRef<FiltersSheetComponent, FiltersSheetResult | undefined>>(
      MatBottomSheetRef,
    );

  status: RecipeFilterStatus = this.data.activeStatus;
  tag: string | null = this.data.activeTag;
  createdBy: string | null = this.data.activeCreatedBy;

  apply() {
    this.bottomSheetRef.dismiss({
      status: this.status,
      tag: this.tag,
      createdBy: this.createdBy,
    });
  }

  reset() {
    this.bottomSheetRef.dismiss({
      status: 'ALL',
      tag: null,
      createdBy: null,
    });
  }

  close() {
    this.bottomSheetRef.dismiss();
  }
}
