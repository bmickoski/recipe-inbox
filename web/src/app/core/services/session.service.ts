import { Injectable } from '@angular/core';
import { AuthResponse } from '../models/auth.model';

const SESSION_KEY = 'recipe-inbox.session';

@Injectable({ providedIn: 'root' })
export class SessionService {
  getSession(): AuthResponse | null {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;

    try {
      return JSON.parse(raw) as AuthResponse;
    } catch {
      this.clearSession();
      return null;
    }
  }

  setSession(session: AuthResponse) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }

  clearSession() {
    localStorage.removeItem(SESSION_KEY);
  }
}
