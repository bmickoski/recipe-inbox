import { Component, inject, OnInit } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { AuthStore } from './core/stores/auth.store';
import { BoardStore } from './core/stores/board.store';
import { RecipesStore } from './core/stores/recipes.store';
import { WakeService } from './core/services/wake.service';
import { WakeBannerComponent } from './core/components/wake-banner/wake-banner.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, MatButtonModule, WakeBannerComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  private readonly authStore = inject(AuthStore);
  private readonly boardStore = inject(BoardStore);
  private readonly recipesStore = inject(RecipesStore);
  private readonly wakeService = inject(WakeService);

  readonly user = this.authStore.user;
  readonly wakeState = this.wakeService.state;

  ngOnInit(): void {
    this.authStore.restoreSession();
    this.wakeService.ping();
  }

  logout() {
    this.authStore.logout();
    this.boardStore.clear();
    this.recipesStore.clear();
  }
}
