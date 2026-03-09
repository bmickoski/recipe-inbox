import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AuthStore } from '../../core/stores/auth.store';

@Component({
  selector: 'app-forgot-password-page',
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  templateUrl: './forgot-password.page.html',
  styleUrl: './forgot-password.page.scss',
})
export class ForgotPasswordPage {
  private readonly authStore = inject(AuthStore);
  readonly email = signal('');
  readonly localError = signal<string | null>(null);
  readonly sent = signal(false);

  readonly loading = this.authStore.loading;
  readonly error = this.authStore.error;

  async submit() {
    const email = this.email().trim();
    this.localError.set(null);
    this.authStore.clearError();

    if (!isValidEmail(email)) {
      this.localError.set('Please enter a valid email address.');
      return;
    }

    const ok = await this.authStore.forgotPassword(email);
    if (ok) {
      this.sent.set(true);
    }
  }
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
