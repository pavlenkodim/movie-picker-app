# Filmder — Backend

NestJS API powering the Filmder swipe app: TMDB-backed movie pool, genre-weight
recommendation engine, swipe tracking, auth, and profiles.

Frontend repo: https://github.com/pavlenkodim/movie-picker-frontend

## Stack

- NestJS 11, TypeScript
- Sequelize + sequelize-typescript, PostgreSQL
- Passport-free JWT auth (`@nestjs/jwt`, custom `JwtAuthGuard` as a global `APP_GUARD`)
- TMDB API (`discover/movie`) — cache-aside into local Postgres
- AWS S3 (`@aws-sdk/client-s3`) — profile thumbnails
- Swagger / OpenAPI at `/api/docs`

## Architecture

One module per domain, Sequelize models colocated with their module:

```
src/
  auth/            # login/registration, JwtAuthGuard, RolesGuard, @Public()/@Roles()
  users/           # user CRUD, roles, bans
  roles/           # role definitions, user-role join table
  profiles/        # profile CRUD, S3 thumbnail upload
  genres/          # TMDB genre list sync
  movies/          # local movie pool, TMDB cache-aside fetch, candidate scoring
  genre-weights/   # EMA-based per-profile genre weight store
  swipes/          # swipe recording, triggers genre-weight updates
  recommendations/ # orchestrates weights + movies + swipes into a scored feed
  s3/              # S3 upload/delete service
  utils/           # tmdbApiService — thin TMDB HTTP wrapper
```

### Recommendation engine

1. `RecommendationsService.getRecommendations(profileId, limit)` pulls the
   profile's top 3 weighted genres, its full weight map, and the set of
   already-swiped movie IDs.
2. `MoviesService.getCandidates(...)` first looks in the local Postgres pool.
   If fewer than `MIN_LOCAL_POOL` (20) candidates are available, it fetches
   more pages from TMDB `discover/movie` (`fetchAndCacheFromTMDB`), tracking
   progress per genre combination in `TmdbFetchProgress` (`lastPage`/`totalPages`)
   so it always resumes from the next unseen page instead of re-fetching page 1.
   Capped at `MAX_FETCH_ATTEMPTS = 3` per request.
3. Candidates are scored by summing the profile's genre weights across each
   movie's genres, then sorted by score (popularity as tiebreaker).
4. Genre weights update via an EMA on every swipe:
   `newWeight = oldWeight + 0.1 * (target - oldWeight)`, `target` = 1 (liked)
   or 0 (disliked) — done as a single atomic `INSERT ... ON CONFLICT DO UPDATE`
   (`GenreWeightsService.applySwipeUpdate`), backed by a unique index on
   `(profileId, genreId)`.
5. Genre IDs for a swipe are always looked up server-side from the movie
   record — never trusted from the client request body.

### Auth

- JWT payload carries `id`, `email`, `profileId`, `banned`, `banReason`, `roles`.
- `profileId` is embedded at login (`AuthService.generateToken`), so
  profile-scoped endpoints (`genre-weights`, `recommendations`, `swipes`) read
  `req.user.profileId` from the token — never from a URL param or request body.
- `JwtAuthGuard` is registered globally (`APP_GUARD`); routes opt out with a
  `@Public()` decorator, opt into role checks with `@Roles(...)` + `RolesGuard`.

## Getting started

```bash
cp exemple.env .development.env   # see Environment variables below
docker compose -f db/docker-compose.yaml up -d
npm install
npm run start:dev
```

API available at `http://localhost:3000/api`, Swagger docs at
`http://localhost:3000/api/docs`.

> `ConfigModule` loads `.${NODE_ENV}.env` (e.g. `.development.env`,
> `.production.env`) — not a plain `.env`. `npm run start:dev` sets
> `NODE_ENV=development` for you via `cross-env`.

### Environment variables

From `exemple.env`:

| Variable                 | Description                                                                                                      |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| `PORT`                   | API port (default 3000)                                                                                          |
| `POSTGRES_HOST`          | Postgres host                                                                                                    |
| `POSTGRES_PORT`          | Postgres port                                                                                                    |
| `POSTGRES_DB`            | Database name                                                                                                    |
| `POSTGRES_USER`          | Database user                                                                                                    |
| `POSTGRES_PASSWORD`      | Database password                                                                                                |
| `PRIVATE_KEY`            | JWT signing secret (symmetric — despite the name, it's not an asymmetric key; consider renaming to `JWT_SECRET`) |
| `TMDB_API_URL`           | TMDB base URL                                                                                                    |
| `TMDB_API_KEY`           | TMDB API key                                                                                                     |
| `TMDB_READ_ACCESS_TOKEN` | TMDB read access token                                                                                           |
| `AWS_ACCESS_KEY_ID`      | S3 credentials                                                                                                   |
| `AWS_SECRET_ACCESS_KEY`  | S3 credentials                                                                                                   |
| `AWS_REGION`             | S3 region                                                                                                        |
| `AWS_S3_BUCKET`          | S3 bucket for profile thumbnails                                                                                 |

`db/docker-compose.yaml` spins up local Postgres + Adminer (`localhost:8080`)
for local development — no TLS, matching plain `POSTGRES_*` values above.

## Scripts

- `npm run start:dev` — dev server with watch (`NODE_ENV=development`)
- `npm run start:prod` — run compiled `dist/main`
- `npm run build` — compile with `nest build`
- `npm run lint` — ESLint (`--fix`)
- `npm test` / `test:watch` / `test:cov` / `test:e2e` — Jest is fully configured;
  **no test files exist in the repo yet**

## Known issues / open work

- **`GET /recommendations` returns an inconsistent shape.** When a profile has
  no genre weights yet (e.g. onboarding incomplete), it returns a bare `[]`
  instead of `{ data: [], hasMore: false }`. The frontend always expects the
  object shape and will throw reading `response.data` on the array case.
- **No transaction around swipe + weight update.** `SwipesService.createSwipe`
  runs the swipe insert and the EMA weight update in a bare `Promise.all`,
  not a DB transaction — a failure in one after the other succeeds leaves
  swipe history and genre weights out of sync.
- **No unique constraint on `(profileId, movieId)` in `swipes`.** The normal
  UI flow prevents re-swiping (swiped movies are excluded from future
  candidate sets), but the API itself doesn't stop a duplicate `POST /swipes`
  from skewing a genre's EMA weight twice for the same swipe.
- **`ProfilesService.updateProfile` deletes the old S3 thumbnail before
  uploading the new one.** If the upload fails, the user is left with no
  thumbnail at all. Should upload first, then delete the old file — the
  reverse of what `createProfile`'s rollback already does correctly.
- **Dead route: `GET /users/:email` is unreachable.** It's declared after
  `GET /users/:id` — both are single-segment param routes, so Express/Nest
  routing always matches `:id` first regardless of the parameter name. Needs
  a distinct path, e.g. `GET /users/by-email/:email`.
- **Zero test coverage.** Jest is configured but I didn't anything.

## License

UNLICENSED — internal/portfolio project.
