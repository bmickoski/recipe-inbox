# Recipe Inbox API

NestJS backend for the Recipe Inbox MVP.

## MVP Features

- Register/Login with JWT
- Create board
- Save recipe URL with OpenGraph metadata extraction
- List recipes by board
- Delete recipe
- Swagger docs

## Stack

- NestJS
- Prisma + PostgreSQL
- JWT auth (`@nestjs/jwt`, Passport)
- `open-graph-scraper`

## Setup

1. Install dependencies:

```bash
npm install
```

2. Configure `.env`:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/postgres"
JWT_SECRET="change-this-in-production"
PORT=3000
```

3. Generate Prisma client:

```bash
npx prisma generate
```

4. Run:

```bash
npm run start:dev
```

Base URL: `http://localhost:3000`  
Swagger: `http://localhost:3000/api/docs`

## Auth Flow

1. `POST /auth/register`
2. Save `accessToken`
3. Send `Authorization: Bearer <token>` for protected endpoints

## Endpoints

### Public

- `POST /auth/register`
- `POST /auth/login`

### Protected (Bearer token required)

- `GET /users/me`
- `POST /boards`
- `GET /boards/:boardId/recipes`
- `POST /recipes`
- `DELETE /recipes/:id`

## Request Examples

### Register

`POST /auth/register`

```json
{
  "email": "bojan@example.com",
  "password": "StrongPass123!"
}
```

Response:

```json
{
  "accessToken": "jwt-token",
  "user": {
    "id": "6b0fd17d-9a66-4bb2-b9d7-d6645519e237",
    "email": "bojan@example.com"
  }
}
```

### Login

`POST /auth/login`

```json
{
  "email": "bojan@example.com",
  "password": "StrongPass123!"
}
```

### Create Board (protected)

`POST /boards`

```json
{
  "name": "Family Recipes"
}
```

### Create Recipe (protected)

`POST /recipes`

```json
{
  "url": "https://www.bbcgoodfood.com/recipes/chicken-pasta",
  "boardId": "77ec39cc-67bb-47f3-9dc4-d3de2ed4b6e5"
}
```

### List Recipes (protected)

`GET /boards/:boardId/recipes`

### Delete Recipe (protected)

`DELETE /recipes/:id`

## cURL Quickstart

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"bojan@example.com\",\"password\":\"StrongPass123!\"}"
```

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"bojan@example.com\",\"password\":\"StrongPass123!\"}"
```

```bash
curl -X POST http://localhost:3000/boards \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d "{\"name\":\"Family Recipes\"}"
```

```bash
curl -X POST http://localhost:3000/recipes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d "{\"url\":\"https://www.bbcgoodfood.com/recipes/chicken-pasta\",\"boardId\":\"BOARD_ID\"}"
```

## Prisma Note

`User.passwordHash` is now part of the model. If your database is already initialized, create/apply a Prisma migration before using auth in non-empty environments.

## Scripts

```bash
npm run start:dev
npm run test
npm run build
npm run db:migrate
```

## Safe DB Migration Helper

To avoid `DATABASE_URL` vs `DIRECT_URL` mismatch issues, use:

```bash
npm run db:migrate
```

This runs `prisma migrate deploy` with `DATABASE_URL` forced to `DIRECT_URL` from `.env`, then runs `prisma generate`.
