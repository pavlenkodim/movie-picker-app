-- Movie details from TMDB /movie/{id}: cast, companies, translations.
-- Idempotent: safe to run more than once.
-- Apply BEFORE starting the app with the new models, otherwise sequelize sync()
-- creates the new tables on its own (without these indexes).

BEGIN;

-- movies: new detail fields
ALTER TABLE movies ADD COLUMN IF NOT EXISTS "productionCountries" VARCHAR(2)[];
ALTER TABLE movies ADD COLUMN IF NOT EXISTS "status" VARCHAR(255);
ALTER TABLE movies ADD COLUMN IF NOT EXISTS "trailerKey" VARCHAR(255);
ALTER TABLE movies ADD COLUMN IF NOT EXISTS "detailsFetchedAt" TIMESTAMP WITH TIME ZONE;
ALTER TABLE movies ADD COLUMN IF NOT EXISTS "detailsAttempts" INTEGER NOT NULL DEFAULT 0;

-- actors
CREATE TABLE IF NOT EXISTS persons (
  "id"          INTEGER PRIMARY KEY,
  "name"        VARCHAR(255) NOT NULL,
  "profilePath" VARCHAR(255),
  "createdAt"   TIMESTAMP WITH TIME ZONE NOT NULL,
  "updatedAt"   TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE IF NOT EXISTS movie_cast (
  "movieId"   INTEGER NOT NULL REFERENCES movies(id) ON UPDATE CASCADE ON DELETE CASCADE,
  "personId"  INTEGER NOT NULL REFERENCES persons(id) ON UPDATE CASCADE ON DELETE CASCADE,
  "order"     INTEGER NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  PRIMARY KEY ("movieId", "personId")
);
CREATE INDEX IF NOT EXISTS movie_cast_person_id ON movie_cast ("personId");

-- production companies
CREATE TABLE IF NOT EXISTS companies (
  "id"            INTEGER PRIMARY KEY,
  "name"          VARCHAR(255) NOT NULL,
  "logoPath"      VARCHAR(255),
  "originCountry" VARCHAR(255),
  "createdAt"     TIMESTAMP WITH TIME ZONE NOT NULL,
  "updatedAt"     TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE IF NOT EXISTS movie_companies (
  "movieId"   INTEGER NOT NULL REFERENCES movies(id) ON UPDATE CASCADE ON DELETE CASCADE,
  "companyId" INTEGER NOT NULL REFERENCES companies(id) ON UPDATE CASCADE ON DELETE CASCADE,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  PRIMARY KEY ("movieId", "companyId")
);
CREATE INDEX IF NOT EXISTS movie_companies_company_id ON movie_companies ("companyId");

-- translations (English stays in movies as the fallback).
-- A row with NULL fields means "checked, TMDB has no translation";
-- no row means "not localized yet".
CREATE TABLE IF NOT EXISTS movie_translations (
  "movieId"    INTEGER NOT NULL REFERENCES movies(id) ON UPDATE CASCADE ON DELETE CASCADE,
  "language"   VARCHAR(10) NOT NULL,
  "title"      VARCHAR(255),
  "overview"   TEXT,
  "posterPath" VARCHAR(255),
  "createdAt"  TIMESTAMP WITH TIME ZONE NOT NULL,
  "updatedAt"  TIMESTAMP WITH TIME ZONE NOT NULL,
  PRIMARY KEY ("movieId", "language")
);

COMMIT;
