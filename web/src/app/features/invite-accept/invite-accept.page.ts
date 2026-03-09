import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar } from '@angular/material/snack-bar';
import { firstValueFrom } from 'rxjs';
import { AuthStore } from '../../core/stores/auth.store';
import { BoardInvitePreview } from '../../core/models/board.model';
import { ApiService } from '../../core/services/api.service';
import { BoardStore } from '../../core/stores/board.store';

@Component({
  selector: 'app-invite-accept-page',
  imports: [CommonModule, MatCardModule, MatButtonModule],
  templateUrl: './invite-accept.page.html',
  styleUrl: './invite-accept.page.scss',
})
export class InviteAcceptPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(ApiService);
  private readonly authStore = inject(AuthStore);
  private readonly boardStore = inject(BoardStore);
  private readonly snackBar = inject(MatSnackBar);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly invite = signal<BoardInvitePreview | null>(null);
  readonly inviteToken = signal<string | null>(null);

  ngOnInit(): void {
    this.authStore.restoreSession();
    void this.initialize();
  }

  private async initialize() {
    const tokenFromQuery = this.route.snapshot.queryParamMap.get('token');
    const tokenFromSession = sessionStorage.getItem(INVITE_TOKEN_STORAGE_KEY);
    const token = tokenFromQuery ?? tokenFromSession;

    if (!token) {
      this.error.set('Missing invite token');
      return;
    }

    this.inviteToken.set(token);
    sessionStorage.setItem(INVITE_TOKEN_STORAGE_KEY, token);

    await this.loadInvitePreview(token);

    if (this.authStore.isAuthenticated() && this.invite() && !this.error()) {
      await this.accept();
    }
  }

  private async loadInvitePreview(token: string) {
    try {
      const invite = await firstValueFrom(this.api.getInvite(token));
      this.invite.set(invite);
    } catch (error: any) {
      this.error.set(error?.error?.message ?? 'Invalid or expired invite link');
    }
  }

  async accept() {
    const token = this.inviteToken();
    if (!token) {
      this.error.set('Missing invite token');
      return;
    }

    if (!this.authStore.isAuthenticated()) {
      const redirectTo = `/board/invite?token=${encodeURIComponent(token)}`;
      await this.router.navigateByUrl(`/auth?redirectTo=${encodeURIComponent(redirectTo)}`);
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    try {
      await firstValueFrom(this.api.acceptInvite(token));
      await this.boardStore.loadOrCreateBoard();
      sessionStorage.removeItem(INVITE_TOKEN_STORAGE_KEY);
      this.snackBar.open('Invite accepted', undefined, { duration: 2500 });
      await this.router.navigateByUrl('/recipes');
    } catch (error: any) {
      if (error?.status === 401) {
        const redirectTo = `/board/invite?token=${encodeURIComponent(token)}`;
        await this.router.navigateByUrl(`/auth?redirectTo=${encodeURIComponent(redirectTo)}`);
        return;
      }
      this.error.set(error?.error?.message ?? 'Failed to accept invite');
    } finally {
      this.loading.set(false);
    }
  }
}

const INVITE_TOKEN_STORAGE_KEY = 'recipe_inbox_pending_invite_token';
