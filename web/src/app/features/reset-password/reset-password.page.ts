import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AuthStore } from '../../core/stores/auth.store';

@Component({
  selector: 'app-reset-password-page',
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  templateUrl: './reset-password.page.html',
  styleUrl: './reset-password.page.scss',
})
export class ResetPasswordPage {
  private readonly authStore = inject(AuthStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly token = this.route.snapshot.queryParamMap.get('token') ?? '';
  readonly password = signal('');
  readonly confirmPassword = signal('');
  readonly localError = signal<string | null>(null);
  readonly done = signal(false);

  readonly loading = this.authStore.loading;
  readonly error = this.authStore.error;

  async submit() {
    this.localError.set(null);
    this.authStore.clearError();

    if (!this.token) {
      this.localError.set('Missing reset token.');
      return;
    }

    const password = this.password().trim();
    const confirmPassword = this.confirmPassword().trim();

    if (password.length < 8) {
      this.localError.set('Password must be at least 8 characters.');
      return;
    }

    if (password !== confirmPassword) {
      this.localError.set('Passwords do not match.');
      return;
    }

    const ok = await this.authStore.resetPassword(this.token, password);
    if (ok) {
      this.done.set(true);
      setTimeout(() => {
        void this.router.navigateByUrl('/auth');
      }, 1200);
    }
  }
}
