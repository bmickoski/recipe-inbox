import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from '../stores/auth.store';

export const authGuard: CanActivateFn = (_, state) => {
  const authStore = inject(AuthStore);
  const router = inject(Router);
  if (!authStore.token()) authStore.restoreSession();

  if (authStore.isAuthenticated()) return true;

  return router.parseUrl(`/auth?redirectTo=${encodeURIComponent(state.url)}`);
};
