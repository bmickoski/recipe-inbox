import { computed, inject } from '@angular/core';
import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';
import { firstValueFrom } from 'rxjs';
import { Recipe } from '../models/recipe.model';
import { ApiService } from '../services/api.service';

export type RecipeFilterStatus = 'ALL' | 'WANT_TO_TRY' | 'COOKED';

type RecipesState = {
  items: Recipe[];
  loading: boolean;
  error: string | null;
  activeTag: string | null;
  activeStatus: RecipeFilterStatus;
  activeCreatedBy: string | null;
};

const initialState: RecipesState = {
  items: [],
  loading: false,
  error: null,
  activeTag: null,
  activeStatus: 'ALL',
  activeCreatedBy: null,
};

export const RecipesStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed((store) => ({
    tagCounts: computed(() => {
      const counts = new Map<string, number>();
      for (const recipe of store.items()) {
        for (const tag of recipe.tags ?? []) {
          counts.set(tag, (counts.get(tag) ?? 0) + 1);
        }
      }
      return Array.from(counts.entries())
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count);
    }),
    filteredRecipes: computed(() => {
      return store.items().filter((recipe) => {
        const statusOk =
          store.activeStatus() === 'ALL' || recipe.status === store.activeStatus();
        const tagOk =
          !store.activeTag() || (recipe.tags ?? []).includes(store.activeTag() as string);
        const createdByOk =
          !store.activeCreatedBy() || recipe.createdBy === store.activeCreatedBy();
        return statusOk && tagOk && createdByOk;
      });
    }),
  })),
  withMethods((store, api = inject(ApiService)) => ({
    setActiveTag(tag: string | null) {
      patchState(store, { activeTag: tag });
    },

    setActiveStatus(status: RecipeFilterStatus) {
      patchState(store, { activeStatus: status });
    },

    setActiveCreatedBy(createdBy: string | null) {
      patchState(store, { activeCreatedBy: createdBy });
    },

    async loadRecipes(boardId: string) {
      patchState(store, { loading: true, error: null });

      try {
        const recipes = await firstValueFrom(api.getRecipes(boardId));
        patchState(store, {
          items: recipes.map(normalizeRecipeTags),
          loading: false,
          error: null,
        });
      } catch (error: any) {
        patchState(store, {
          loading: false,
          error: error?.error?.message ?? 'Failed to load recipes',
        });
      }
    },

    async addRecipe(url: string, boardId: string) {
      patchState(store, { loading: true, error: null });

      try {
        const recipe = await firstValueFrom(api.addRecipe(url, boardId));
        patchState(store, {
          items: [normalizeRecipeTags(recipe), ...store.items()],
          loading: false,
          error: null,
        });
      } catch (error: any) {
        patchState(store, {
          loading: false,
          error: error?.error?.message ?? 'Failed to save recipe',
        });
      }
    },

    async deleteRecipe(id: string) {
      patchState(store, { loading: true, error: null });
      try {
        await firstValueFrom(api.deleteRecipe(id));
        patchState(store, {
          items: store.items().filter((item) => item.id !== id),
          loading: false,
          error: null,
        });
      } catch (error: any) {
        patchState(store, {
          loading: false,
          error: error?.error?.message ?? 'Failed to delete recipe',
        });
      }
    },

    async toggleStatus(recipe: Recipe) {
      const nextStatus = recipe.status === 'COOKED' ? 'WANT_TO_TRY' : 'COOKED';
      const previous = store.items();
      patchState(store, {
        items: previous.map((item) =>
          item.id === recipe.id
            ? {
                ...item,
                status: nextStatus,
                cookedAt: nextStatus === 'COOKED' ? new Date().toISOString() : null,
              }
            : item,
        ),
      });

      try {
        await firstValueFrom(api.updateRecipe(recipe.id, { status: nextStatus }));
      } catch {
        patchState(store, { items: previous });
      }
    },

    async toggleTag(recipe: Recipe, tag: string) {
      const normalizedTag = normalizeTag(tag);
      const currentTags = normalizeTags(recipe.tags ?? []);
      const hasTag = currentTags.includes(normalizedTag);
      const nextTags = hasTag
        ? currentTags.filter((t) => t !== normalizedTag)
        : [...currentTags, normalizedTag];

      const previous = store.items();
      patchState(store, {
        items: previous.map((item) =>
          item.id === recipe.id ? { ...item, tags: nextTags } : item,
        ),
      });

      try {
        await firstValueFrom(api.updateRecipe(recipe.id, { tags: nextTags }));
      } catch {
        patchState(store, { items: previous });
      }
    },

    async updateNotes(recipe: Recipe, notes: string) {
      const nextNotes = notes.trim() || null;
      const previous = store.items();
      patchState(store, {
        items: previous.map((item) =>
          item.id === recipe.id ? { ...item, notes: nextNotes } : item,
        ),
      });

      try {
        await firstValueFrom(api.updateRecipe(recipe.id, { notes: nextNotes }));
      } catch {
        patchState(store, { items: previous });
      }
    },

    clear() {
      patchState(store, initialState);
    },
  })),
);

function normalizeRecipeTags(recipe: Recipe): Recipe {
  return {
    ...recipe,
    cookedAt: recipe.cookedAt ?? null,
    notes: recipe.notes ?? null,
    tags: normalizeTags(recipe.tags ?? []),
  };
}

function normalizeTags(tags: string[]): string[] {
  return [...new Set(tags.map((tag) => normalizeTag(tag)).filter(Boolean))];
}

function normalizeTag(tag: string): string {
  return tag.trim().toLowerCase();
}
