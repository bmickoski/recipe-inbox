import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BoardStore } from '../../core/stores/board.store';

@Component({
  selector: 'app-board-settings-page',
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  templateUrl: './board-settings.page.html',
  styleUrl: './board-settings.page.scss',
})
export class BoardSettingsPage implements OnInit {
  private readonly boardStore = inject(BoardStore);
  private readonly snackBar = inject(MatSnackBar);

  readonly email = signal('');
  readonly board = this.boardStore.board;
  readonly loading = this.boardStore.loading;
  readonly error = this.boardStore.error;
  readonly inviteUrl = this.boardStore.lastInviteUrl;

  ngOnInit(): void {
    this.boardStore.clearInvite();
    this.boardStore.loadOrCreateBoard();
  }

  async invite() {
    const email = this.email().trim();
    if (!email) return;

    await this.boardStore.inviteMember(email);
    if (this.inviteUrl()) {
      this.email.set('');
      this.snackBar.open('Invite link created. Share it manually.', undefined, {
        duration: 2800,
      });
    }
  }

  async copyInvite() {
    const url = this.inviteUrl();
    if (!url) return;
    await navigator.clipboard.writeText(url);
    this.snackBar.open('Invite link copied', undefined, { duration: 2200 });
  }

  async shareInvite() {
    const url = this.inviteUrl();
    if (!url) return;

    if (navigator.share) {
      await navigator.share({
        title: 'Join my recipe board',
        text: 'I invited you to our shared recipe board on Recipe Inbox.',
        url,
      });
      this.snackBar.open('Invite shared', undefined, { duration: 2200 });
      return;
    }

    await this.copyInvite();
  }
}
