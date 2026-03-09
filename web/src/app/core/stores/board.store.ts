import { computed, inject } from '@angular/core';
import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';
import { firstValueFrom } from 'rxjs';
import { Board, BoardInvite } from '../models/board.model';
import { ApiService } from '../services/api.service';

type BoardState = {
  board: Board | null;
  invite: BoardInvite | null;
  loading: boolean;
  error: string | null;
};

const initialState: BoardState = {
  board: null,
  invite: null,
  loading: false,
  error: null,
};

export const BoardStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed((store) => ({
    boardId: computed(() => store.board()?.id ?? null),
    memberMap: computed(() => {
      const entries: Array<[string, string]> = (store.board()?.members ?? []).map((member) => [
        member.userId,
        member.displayName || member.email,
      ]);
      return new Map(entries);
    }),
    lastInviteUrl: computed(() => {
      const token = store.invite()?.token;
      return token ? `${window.location.origin}/board/invite?token=${token}` : null;
    }),
  })),
  withMethods((store, api = inject(ApiService)) => ({
    async loadOrCreateBoard() {
      if (store.board()) return store.board();

      patchState(store, { loading: true, error: null });

      try {
        const existing = await firstValueFrom(api.getMyBoard());

        if (existing) {
          patchState(store, {
            board: existing,
            loading: false,
            error: null,
          });
          return store.board();
        }

        const created = await firstValueFrom(api.createBoard('Family Recipes'));
        patchState(store, {
          board: created,
          loading: false,
          error: null,
        });

        return store.board();
      } catch (error: any) {
        patchState(store, {
          loading: false,
          error: error?.error?.message ?? 'Failed to initialize board',
        });
        return null;
      }
    },

    async inviteMember(email: string) {
      const boardId = store.board()?.id;
      if (!boardId) return null;

      patchState(store, { loading: true, error: null, invite: null });
      try {
        const invite = await firstValueFrom(api.createInvite(boardId, email));
        patchState(store, { invite, loading: false, error: null });
        return invite;
      } catch (error: any) {
        patchState(store, {
          loading: false,
          error: error?.error?.message ?? 'Failed to create invite',
        });
        return null;
      }
    },

    async acceptInvite(token: string) {
      patchState(store, { loading: true, error: null });
      try {
        await firstValueFrom(api.acceptInvite(token));
        patchState(store, { loading: false, error: null });
        await this.loadOrCreateBoard();
        return true;
      } catch (error: any) {
        patchState(store, {
          loading: false,
          error: error?.error?.message ?? 'Failed to accept invite',
        });
        return false;
      }
    },

    clear() {
      patchState(store, initialState);
    },

    clearInvite() {
      patchState(store, { invite: null });
    },
  })),
);
