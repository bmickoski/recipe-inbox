import { Component, inject, OnInit } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { AuthStore } from './core/stores/auth.store';
import { BoardStore } from './core/stores/board.store';
import { RecipesStore } from './core/stores/recipes.store';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, MatButtonModule],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  private readonly authStore = inject(AuthStore);
  private readonly boardStore = inject(BoardStore);
  private readonly recipesStore = inject(RecipesStore);

  readonly user = this.authStore.user;

  ngOnInit(): void {
    this.authStore.restoreSession();
  }

  logout() {
    this.authStore.logout();
    this.boardStore.clear();
    this.recipesStore.clear();
  }
}
