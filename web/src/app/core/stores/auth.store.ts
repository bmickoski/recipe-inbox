import { computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';
import { firstValueFrom } from 'rxjs';
import { AuthUser } from '../models/auth.model';
import { ApiService } from '../services/api.service';
import { SessionService } from '../services/session.service';

type AuthState = {
  token: string | null;
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
};

const initialState: AuthState = {
  token: null,
  user: null,
  loading: false,
  error: null,
};

export const AuthStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed((store) => ({
    isAuthenticated: computed(() => !!store.token() && !!store.user()),
  })),
  withMethods(
    (
      store,
      api = inject(ApiService),
      session = inject(SessionService),
      router = inject(Router),
    ) => ({
      restoreSession() {
        const current = session.getSession();
        if (!current) {
          patchState(store, { token: null, user: null, loading: false, error: null });
          return;
        }

        patchState(store, {
          token: current.accessToken,
          user: current.user,
          loading: false,
          error: null,
        });
      },

      async login(email: string, password: string) {
        patchState(store, { loading: true, error: null });

        try {
          const response = await firstValueFrom(api.login({ email, password }));
          session.setSession(response);
          patchState(store, {
            token: response.accessToken,
            user: response.user,
            loading: false,
            error: null,
          });
          await router.navigateByUrl(resolveRedirectTarget(router.url));
        } catch (error: any) {
          patchState(store, {
            loading: false,
            error: getErrorMessage(error, 'Login failed'),
          });
        }
      },

      async register(email: string, password: string, displayName: string) {
        patchState(store, { loading: true, error: null });

        try {
          const response = await firstValueFrom(
            api.register({ email, password, displayName }),
          );
          session.setSession(response);
          patchState(store, {
            token: response.accessToken,
            user: response.user,
            loading: false,
            error: null,
          });
          await router.navigateByUrl(resolveRedirectTarget(router.url));
        } catch (error: any) {
          patchState(store, {
            loading: false,
            error: getErrorMessage(error, 'Registration failed'),
          });
        }
      },

      async logout() {
        session.clearSession();
        patchState(store, initialState);
        await router.navigateByUrl('/auth');
      },

      clearError() {
        patchState(store, { error: null });
      },
    }),
  ),
);

function getErrorMessage(error: any, fallback: string) {
  const message = error?.error?.message;

  if (Array.isArray(message)) {
    return message.join(', ');
  }

  if (typeof message === 'string' && message.trim().length > 0) {
    return message;
  }

  if (error?.status === 0) {
    return 'Cannot reach API. Check backend is running and CORS is enabled.';
  }

  return fallback;
}

function resolveRedirectTarget(currentUrl: string): string {
  const queryStart = currentUrl.indexOf('?');
  if (queryStart === -1) return '/recipes';

  const params = new URLSearchParams(currentUrl.slice(queryStart + 1));
  const redirectToRaw = params.get('redirectTo');
  if (!redirectToRaw) return '/recipes';

  try {
    const decoded = decodeURIComponent(redirectToRaw);
    return decoded || '/recipes';
  } catch {
    return redirectToRaw || '/recipes';
  }
}
