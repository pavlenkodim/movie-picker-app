# CLAUDE.md

Backend for Filmder (swipe-based movie picker). NestJS 11 + Sequelize (sequelize-typescript) + PostgreSQL, TMDB as the movie source, S3 for profile thumbnails, Swagger at `/api/docs`. Frontend lives in a separate repo (`pavlenkodim/movie-picker-frontend`). README.md has the full architecture write-up and env var table — read it first for context; this file covers what you need to work in the code.

## Commands

```bash
docker compose -f db/docker-compose.yaml up -d   # local Postgres :5432 + Adminer :8080
npm run start:dev      # watch mode, NODE_ENV=development → loads .development.env
npm run build          # nest build → dist/
npx tsc --noEmit       # type check (fastest way to verify a change)
npm run lint           # eslint --fix (no eslint config is committed yet)
npm run format         # prettier
```

- Env is loaded from `.${NODE_ENV}.env` (`.development.env` / `.production.env`), **not** `.env`. Template: `exemple.env` (sic). Never commit the real env files.
- Local docker Postgres needs `POSTGRES_SSL=false`; SSL is on by default (prod is Neon).
- There are **no tests**. Jest is configured (`*.spec.ts` under `src/`), but nothing exists yet. Verify changes with `npx tsc --noEmit`, and by running the app plus Swagger/curl when it matters.

## Layout

One Nest module per domain in `src/<domain>/`, with `<domain>.module|controller|service|model.ts` and a `dto/` folder. Models without a module of their own: `persons/`, `companies/` (registered in `MoviesModule`). Shared code: `utils/` (`tmdbApiService`, `runWithConcurrency`, `languages`), `s3/`.

Request flow for the core feature: `GET /api/recommendations` → `RecommendationsService` → top-3 genres from `GenreWeightsService` + swiped IDs from `SwipesService` → `MoviesService.getCandidates` (local pool, TMDB `discover/movie` fallback with page progress in `TmdbFetchProgress`) → score by genre weights → `MovieDetailsService.enrichPending(ids)` fetches cast/companies/trailer/translations for just the returned movies. `POST /api/swipes` saves the swipe and updates genre weights with an EMA (`applySwipeUpdate`, raw `INSERT ... ON CONFLICT`).

## Conventions

- **Style:** double quotes, semicolons, trailing commas, ~100 char lines. English comments, short and only where the "why" isn't obvious.
- **Imports:** both `src/...` absolute paths (resolved via `baseUrl`) and relative paths are used. Match the file you're editing; `src/...` is more common in newer code.
- **Models:** `@Table({ tableName: "snake_case" })`, camelCase columns, `declare` on every field, a `XxxCreationAttrs` interface as the second generic, `@ApiProperty` on fields exposed to the API. Inject with `@InjectModel(X) private xRepository: typeof X`, and register in the owning module's `SequelizeModule.forFeature([...])`.
- **TMDB:** always go through `tmdbApiService<T>(path, params)`. It handles auth, 10s timeout, and 429 retries, and rethrows `HttpException` with TMDB's status code. Type TMDB responses with local `interface Tmdb...` declarations in the service. Use `runWithConcurrency` for many parallel calls (keep it around 5).
- **Bulk upserts:** `bulkCreate(rows, { updateOnDuplicate: [...] })` or `{ ignoreDuplicates: true }`. Multi-table writes go in `this.sequelize.transaction(async (transaction) => ...)`. Sort rows by id before parallel upserts to avoid deadlocks (see `movie-details.service.ts`).
- **Validation:** a global `ValidationPipe({ transform: true, whitelist: true })` is set in `main.ts`, so every body/query field needs a class-validator decorator or it is silently stripped. Query numbers/booleans need `@Type(() => Number)` / `@Transform`, as in `GetSwipesHistoryDto`. `src/pipes/validation.pipe.ts` and `src/exeptions/` are unused legacy code.
- **Pagination:** cursor-based (`id < cursor`, fetch `limit + 1`), returning `{ data, meta: { nextCursor, hasMore } }`.

## Auth rules (important)

- `JwtAuthGuard` is a global `APP_GUARD`, so every route requires a Bearer JWT unless it has `@Public()`.
- Role checks need **both** `@Roles("ADMIN")` **and** `@UseGuards(RolesGuard)`. `@Roles` by itself does nothing (`GET /profiles/:userId` currently has this bug).
- Profile-scoped data (swipes, genre weights, recommendations) must take `profileId` from `req.user.profileId` (the JWT), never from params or body. User-scoped data uses `req.user.id`. When reading a record by id, check that it belongs to the caller (`GET /swipes/:swipeId` doesn't yet).
- `profileId` is baked into the token at login. After profile creation a new token is issued (`ProfilesService.createProfile`). Services throw 403 "refresh your token" when it's missing.
- Movie genre IDs for a swipe come from the DB movie record, never from the client.

## Database / schema changes

- No migration tool. `autoLoadModels` lets Sequelize `sync()` create **missing tables** on boot, but it never alters existing ones.
- Any new column or index on an existing table needs a hand-written idempotent SQL file in `db/migrations/NNN_name.sql` (`ADD COLUMN IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`, wrapped in `BEGIN/COMMIT`), applied manually **before** starting the app. See `001_movie_details.sql`.
- `profile_genre_weights.weight` is `DECIMAL(3,2)`. Postgres returns it as a string (hence `Number(w.weight)`) and stores it rounded to 2 decimals.
- Translations: `movies` holds English. `movie_translations` holds `LANGUAGES` (env, comma-separated). A row with NULL fields means "TMDB has no translation", while a missing row means "not fetched yet".

## Known issues

The README "Known issues" section is the source of truth (recommendations returning `[]` vs `{data, hasMore}`, swipe + weight update not in one transaction, no unique `(profileId, movieId)` on swipes, thumbnail deleted before re-upload, unreachable `GET /users/:email`). Don't "fix" these on the side unless asked, but don't copy these patterns into new code either.

## Git

Work on `dev`; `main` is the PR target. Commit messages are short, imperative, lowercase-ish (e.g. "add filter by liked").
