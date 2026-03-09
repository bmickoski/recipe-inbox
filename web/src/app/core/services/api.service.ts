import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthResponse } from '../models/auth.model';
import { Board, BoardInvite, BoardInvitePreview } from '../models/board.model';
import { Recipe } from '../models/recipe.model';

type Credentials = {
  email: string;
  password: string;
  displayName?: string;
};

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:3000';

  register(body: Credentials) {
    return this.http.post<AuthResponse>(`${this.baseUrl}/auth/register`, body);
  }

  login(body: Credentials) {
    return this.http.post<AuthResponse>(`${this.baseUrl}/auth/login`, body);
  }

  createBoard(name: string) {
    return this.http.post<Board>(`${this.baseUrl}/boards`, { name });
  }

  getMyBoard() {
    return this.http.get<Board | null>(`${this.baseUrl}/boards/me`);
  }

  createInvite(boardId: string, email: string) {
    return this.http.post<BoardInvite>(`${this.baseUrl}/boards/${boardId}/invites`, {
      email,
    });
  }

  getInvite(token: string) {
    return this.http.get<BoardInvitePreview>(`${this.baseUrl}/boards/invites/${token}`);
  }

  acceptInvite(token: string) {
    return this.http.post(`${this.baseUrl}/boards/invites/${token}/accept`, {});
  }

  getRecipes(boardId: string) {
    return this.http.get<Recipe[]>(`${this.baseUrl}/boards/${boardId}/recipes`);
  }

  addRecipe(url: string, boardId: string) {
    return this.http.post<Recipe>(`${this.baseUrl}/recipes`, { url, boardId });
  }

  deleteRecipe(id: string) {
    return this.http.delete<Recipe>(`${this.baseUrl}/recipes/${id}`);
  }

  updateRecipe(
    id: string,
    body: { status?: 'WANT_TO_TRY' | 'COOKED'; tags?: string[]; notes?: string | null },
  ) {
    return this.http.patch<Recipe>(`${this.baseUrl}/recipes/${id}`, body);
  }
}
