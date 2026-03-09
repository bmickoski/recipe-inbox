import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BoardStore } from '../../core/stores/board.store';
import { RecipesStore } from '../../core/stores/recipes.store';
import { AddRecipeBarComponent } from './components/add-recipe-bar/add-recipe-bar.component';
import { RecipeCardComponent } from './components/recipe-card/recipe-card.component';
import { SavedByFilterBarComponent } from './components/saved-by-filter-bar/saved-by-filter-bar.component';
import { StatusFilterBarComponent } from './components/status-filter-bar/status-filter-bar.component';
import { TagFilterBarComponent } from './components/tag-filter-bar/tag-filter-bar.component';

@Component({
  selector: 'app-recipes-page',
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    AddRecipeBarComponent,
    SavedByFilterBarComponent,
    TagFilterBarComponent,
    StatusFilterBarComponent,
    RecipeCardComponent,
  ],
  templateUrl: './recipes.page.html',
  styleUrl: './recipes.page.scss',
})
export class RecipesPage implements OnInit {
  private readonly recipesStore = inject(RecipesStore);
  private readonly boardStore = inject(BoardStore);
  private readonly snackBar = inject(MatSnackBar);
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
  readonly memberMap = this.boardStore.memberMap;
  readonly members = computed(() => this.boardStore.board()?.members ?? []);
  readonly loading = this.recipesStore.loading;
  readonly error = this.recipesStore.error;
  readonly activeCreatedBy = this.recipesStore.activeCreatedBy;
  readonly initialLoading = signal(true);

  ngOnInit(): void {
    void this.initializePage();
  }

  private async initializePage() {
    try {
      const board = await this.boardStore.loadOrCreateBoard();
      if (!board?.id) return;
      await this.recipesStore.loadRecipes(board.id);
      await this.consumeSharedUrlParams();
    } finally {
      this.initialLoading.set(false);
    }
  }

  async saveRecipe() {
    const url = this.recipeUrl().trim();
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

  private async consumeSharedUrlParams() {
    const params = this.route.snapshot.queryParamMap;
    const sharedUrl = params.get('url') ?? extractFirstUrl(params.get('text'));
    if (!sharedUrl) return;

    this.recipeUrl.set(sharedUrl);
    this.snackBar.open('Shared link detected. Tap Save to add it.', undefined, {
      duration: 2500,
    });

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
