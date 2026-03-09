import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleChange, MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { AuthStore } from '../../core/stores/auth.store';

@Component({
  selector: 'app-auth-page',
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonToggleModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './auth.page.html',
  styleUrl: './auth.page.scss',
})
export class AuthPage {
  private readonly authStore = inject(AuthStore);

  readonly mode = signal<'login' | 'register'>('login');
  readonly displayName = signal('');
  readonly email = signal('');
  readonly password = signal('');
  readonly showPassword = signal(false);

  readonly loading = this.authStore.loading;
  readonly error = this.authStore.error;

  togglePassword() {
    this.showPassword.update(v => !v);
  }

  setMode(mode: 'login' | 'register' | MatButtonToggleChange) {
    const nextMode =
      typeof mode === 'string' ? mode : (mode.value as 'login' | 'register');
    this.mode.set(nextMode);
    this.authStore.clearError();
  }

  async submit() {
    const email = this.email().trim();
    const password = this.password().trim();
    const displayName = this.displayName().trim();

    if (!email || !password) return;

    if (this.mode() === 'login') {
      await this.authStore.login(email, password);
      return;
    }

    if (!displayName) return;
    await this.authStore.register(email, password, displayName);
  }
}
