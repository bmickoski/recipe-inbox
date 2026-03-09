import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'auth',
    loadComponent: () =>
      import('./features/auth/auth.page').then((m) => m.AuthPage),
  },
  {
    path: 'auth/forgot-password',
    loadComponent: () =>
      import('./features/forgot-password/forgot-password.page').then(
        (m) => m.ForgotPasswordPage,
      ),
  },
  {
    path: 'auth/reset-password',
    loadComponent: () =>
      import('./features/reset-password/reset-password.page').then(
        (m) => m.ResetPasswordPage,
      ),
  },
  {
    path: 'recipes',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/recipes/recipes.page').then((m) => m.RecipesPage),
  },
  {
    path: 'board/settings',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/board-settings/board-settings.page').then(
        (m) => m.BoardSettingsPage,
      ),
  },
  {
    path: 'board/invite',
    loadComponent: () =>
      import('./features/invite-accept/invite-accept.page').then(
        (m) => m.InviteAcceptPage,
      ),
  },
  { path: '', pathMatch: 'full', redirectTo: 'recipes' },
  { path: '**', redirectTo: 'recipes' },
];
