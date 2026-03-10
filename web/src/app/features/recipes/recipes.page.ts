import { CommonModule } from '@angular/common';
import {
  Component,
  DestroyRef,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SwPush } from '@angular/service-worker';
import { firstValueFrom } from 'rxjs';
import { PushNotificationService } from '../../core/services/push-notification.service';
import { BoardMember } from '../../core/models/board.model';
import { AuthStore } from '../../core/stores/auth.store';
import { BoardStore } from '../../core/stores/board.store';
import { RecipesStore } from '../../core/stores/recipes.store';
import { AddRecipeSheetComponent } from './components/add-recipe-sheet/add-recipe-sheet.component';
import {
  FiltersSheetComponent,
  FiltersSheetResult,
} from './components/filters-sheet/filters-sheet.component';
import { NotificationPromptComponent } from './components/notification-prompt/notification-prompt.component';
import { RecipeCardComponent } from './components/recipe-card/recipe-card.component';
import { SearchBarComponent } from './components/search-bar/search-bar.component';
import { RecipeFilterStatus } from '../../core/stores/recipes.store';

@Component({
  selector: 'app-recipes-page',
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatChipsModule,
    MatIconModule,
    NotificationPromptComponent,
    SearchBarComponent,
    RecipeCardComponent,
  ],
  templateUrl: './recipes.page.html',
  styleUrl: './recipes.page.scss',
})
export class RecipesPage implements OnInit {
  private readonly recipesStore = inject(RecipesStore);
  private readonly authStore = inject(AuthStore);
  private readonly boardStore = inject(BoardStore);
  private readonly snackBar = inject(MatSnackBar);
  private readonly bottomSheet = inject(MatBottomSheet);
  private readonly pushNotificationService = inject(PushNotificationService);
  private readonly swPush = inject(SwPush);
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly skeletons = [1, 2, 3];
  readonly recipeUrl = signal('');
  readonly confirmDeleteId = signal<string | null>(null);
  readonly recipes = this.recipesStore.filteredRecipes;
  readonly allRecipes = this.recipesStore.items;
  readonly tagCounts = this.recipesStore.tagCounts;
  readonly activeTag = this.recipesStore.activeTag;
  readonly activeStatus = this.recipesStore.activeStatus;
  readonly activeSearch = this.recipesStore.activeSearch;
  readonly memberMap = this.boardStore.memberMap;
  readonly members = computed(() => this.boardStore.board()?.members ?? []);
  readonly loading = this.recipesStore.loading;
  readonly error = this.recipesStore.error;
  readonly activeCreatedBy = this.recipesStore.activeCreatedBy;
  readonly initialLoading = signal(true);
  readonly showNotifPrompt = signal(false);
  readonly activeFilters = computed(() => {
    const filters: Array<{ key: 'status' | 'tag' | 'createdBy'; label: string }> = [];
    if (this.activeStatus() !== 'ALL') {
      filters.push({
        key: 'status',
        label: this.activeStatus() === 'COOKED' ? 'Cooked' : 'Want to try',
      });
    }
    if (this.activeTag()) {
      filters.push({ key: 'tag', label: `Tag: ${this.activeTag()}` });
    }
    if (this.activeCreatedBy()) {
      filters.push({ key: 'createdBy', label: `Saved by: ${this.savedBy(this.activeCreatedBy()!)}` });
    }
    return filters;
  });
  readonly partnerName = computed(() => {
    const currentUserId = this.authStore.user()?.id;
    const partner = this.boardStore
      .board()
      ?.members?.find((member) => member.userId !== currentUserId);
    return partner?.displayName ?? 'your partner';
  });

  ngOnInit(): void {
    this.swPush.notificationClicks
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({ notification }) => {
        const recipeId = notification.data?.recipeId;
        if (recipeId) {
          const title = notification.body ?? 'New recipe';
          this.snackBar.open(title, undefined, { duration: 3000 });
        }
      });

    void this.initializePage();
  }

  private async initializePage() {
    try {
      const board = await this.boardStore.loadOrCreateBoard();
      if (!board?.id) return;
      await this.recipesStore.loadRecipes(board.id);
      const hasPartner = (this.boardStore.board()?.members?.length ?? 0) > 1;
      const permission = Notification.permission;
      const swEnabled = this.swPush.isEnabled;
      if (hasPartner && swEnabled) {
        if (permission === 'default') {
          this.showNotifPrompt.set(true);
        } else if (permission === 'granted') {
          // Silently re-subscribe (handles failed saves from previous sessions)
          void this.pushNotificationService.requestPermissionAndSubscribe();
        }
      }
      await this.consumeSharedUrlParams();
    } finally {
      this.initialLoading.set(false);
    }
  }

  async saveRecipe(nextUrl?: string) {
    const url = (nextUrl ?? this.recipeUrl()).trim();
    if (!url) return;

    const boardId = this.boardStore.boardId();
    if (!boardId) {
      this.snackBar.open('Board is not ready yet. Try again in a moment.', undefined, {
        duration: 2500,
      });
      return;
    }

    await this.recipesStore.addRecipe(url, boardId);
    if (!this.error()) {
      this.recipeUrl.set('');
      this.snackBar.open('Recipe saved!', undefined, { duration: 2500 });
    }
  }

  requestDelete(id: string) {
    this.confirmDeleteId.set(id);
  }

  cancelDelete() {
    this.confirmDeleteId.set(null);
  }

  async confirmDelete(id: string) {
    this.confirmDeleteId.set(null);
    await this.recipesStore.deleteRecipe(id);
    if (!this.error()) {
      this.snackBar.open('Recipe deleted', undefined, { duration: 2500 });
    }
  }

  openRecipe(url: string) {
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  savedBy(createdBy: string) {
    return this.memberMap().get(createdBy) ?? 'Unknown';
  }

  onTagChange(tag: string | null) {
    this.recipesStore.setActiveTag(tag);
  }

  onStatusChange(status: 'ALL' | 'WANT_TO_TRY' | 'COOKED') {
    this.recipesStore.setActiveStatus(status);
  }

  onCreatedByChange(createdBy: string | null) {
    this.recipesStore.setActiveCreatedBy(createdBy);
  }

  onSearchChange(query: string) {
    this.recipesStore.setActiveSearch(query);
  }

  async openFilters() {
    const ref = this.bottomSheet.open<
      FiltersSheetComponent,
      {
        activeStatus: RecipeFilterStatus;
        activeTag: string | null;
        activeCreatedBy: string | null;
        tags: Array<{ tag: string; count: number }>;
        members: BoardMember[];
      },
      FiltersSheetResult | undefined
    >(FiltersSheetComponent, {
      data: {
        activeStatus: this.activeStatus(),
        activeTag: this.activeTag(),
        activeCreatedBy: this.activeCreatedBy(),
        tags: this.tagCounts(),
        members: this.members(),
      },
    });

    const result = await firstValueFrom(ref.afterDismissed());
    if (!result) return;
    this.recipesStore.setActiveStatus(result.status);
    this.recipesStore.setActiveTag(result.tag);
    this.recipesStore.setActiveCreatedBy(result.createdBy);
  }

  clearFilter(key: 'status' | 'tag' | 'createdBy') {
    if (key === 'status') {
      this.recipesStore.setActiveStatus('ALL');
      return;
    }
    if (key === 'tag') {
      this.recipesStore.setActiveTag(null);
      return;
    }
    this.recipesStore.setActiveCreatedBy(null);
  }

  async openAddRecipeSheet(prefill = this.recipeUrl()) {
    const ref = this.bottomSheet.open<
      AddRecipeSheetComponent,
      { value: string },
      string | undefined
    >(AddRecipeSheetComponent, {
      data: { value: prefill },
    });

    const nextUrl = await firstValueFrom(ref.afterDismissed());
    if (!nextUrl) return;
    this.recipeUrl.set(nextUrl);
    await this.saveRecipe(nextUrl);
  }

  async toggleStatus(recipeId: string) {
    const recipe = this.recipesStore.items().find((item) => item.id === recipeId);
    if (!recipe) return;
    await this.recipesStore.toggleStatus(recipe);
  }

  async toggleTag(recipeId: string, tag: string) {
    const recipe = this.recipesStore.items().find((item) => item.id === recipeId);
    if (!recipe) return;
    await this.recipesStore.toggleTag(recipe, tag);
  }

  async updateNotes(recipeId: string, notes: string) {
    const recipe = this.recipesStore.items().find((item) => item.id === recipeId);
    if (!recipe) return;
    await this.recipesStore.updateNotes(recipe, notes);
  }

  async enableNotifications() {
    this.showNotifPrompt.set(false);
    const result = await this.pushNotificationService.requestPermissionAndSubscribe();
    if (result === 'ios-unsupported') {
      this.snackBar.open(
        'Notifications not supported on iOS Safari. Use Android or Chrome.',
        undefined,
        { duration: 5000 },
      );
    } else if (result === 'denied') {
      this.snackBar.open(
        'Notifications blocked. Enable them in your browser settings.',
        undefined,
        { duration: 4000 },
      );
    }
  }

  dismissNotifPrompt() {
    this.showNotifPrompt.set(false);
  }

  private async consumeSharedUrlParams() {
    const params = this.route.snapshot.queryParamMap;
    const sharedUrl = params.get('url') ?? extractFirstUrl(params.get('text'));
    if (!sharedUrl) return;

    this.recipeUrl.set(sharedUrl);
    await this.openAddRecipeSheet(sharedUrl);

    await this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { url: null, text: null, title: null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }
}

function extractFirstUrl(text: string | null): string | null {
  if (!text) return null;
  const match = text.match(/https?:\/\/\S+/i);
  return match?.[0] ?? null;
}
