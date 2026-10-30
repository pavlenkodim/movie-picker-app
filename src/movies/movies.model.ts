import { ApiProperty } from "@nestjs/swagger";
import { BelongsToMany, Column, DataType, HasMany, Model, Table } from "sequelize-typescript";
import { Genre } from "src/genres/genres.model";
import { MovieGenres } from "./movie-genres.model";
import { Person } from "src/persons/persons.model";
import { MovieCast } from "./movie-cast.model";
import { Company } from "src/companies/companies.model";
import { MovieCompanies } from "./movie-companies.model";
import { MovieTranslation } from "./movie-translations.model";

interface MovieCreationAttrs {
  id: number;
  title: string;
  overview?: string | null;
  posterPath?: string | null;
  voteAverage: number;
  voteCount: number;
  popularity: number;
  releaseDate?: string | null;
}

@Table({ tableName: "movies" })
export class Movie extends Model<Movie, MovieCreationAttrs> {
  @ApiProperty({ example: 640146, description: "Unique movie ID" })
  @Column({
    type: DataType.INTEGER,
    unique: true,
    primaryKey: true,
  })
  declare id: number;

  @ApiProperty({ example: "Ant-Man and the Wasp: Quantumania", description: "Name of movie" })
  @Column({ type: DataType.STRING, allowNull: false })
  declare title: string;

  @ApiProperty({
    example:
      "Super-Hero partners Scott Lang and Hope van Dyne, along with with Hope's parents Janet van Dyne and Hank Pym, and Scott's daughter Cassie Lang, find themselves exploring the Quantum Realm, interacting with strange new creatures and embarking on an adventure that will push them beyond the limits of what they thought possible.",
    description: "Shor overview",
  })
  @Column({ type: DataType.TEXT, allowNull: true })
  declare overview?: string | null;

  @ApiProperty({ example: "/ngl2FKBlU4fhbdsrtdom9LVLBXw.jpg", description: "Url to movie poster" })
  @Column({ type: DataType.STRING, allowNull: true })
  declare posterPath?: string;

  @ApiProperty({ example: 6.5, description: "Rating" })
  @Column({ type: DataType.FLOAT, allowNull: false, defaultValue: 0 })
  declare voteAverage: number;

  @ApiProperty({ example: 1856, description: "Number of people who vote" })
  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
  declare voteCount: number;

  @ApiProperty({ example: 9272.643, description: "Popularity" })
  @Column({ type: DataType.FLOAT, allowNull: false, defaultValue: 0 })
  declare popularity: number;

  @ApiProperty({ example: "2023-02-15", description: "Release date" })
  @Column({ type: DataType.DATEONLY, allowNull: true })
  declare releaseDate?: string | null;

  @ApiProperty({ example: ["US"], description: "Production countries (ISO 3166-1)" })
  @Column({ type: DataType.ARRAY(DataType.STRING(2)), allowNull: true })
  declare productionCountries?: string[] | null;

  @ApiProperty({ example: "Released", description: "Release status" })
  @Column({ type: DataType.STRING, allowNull: true })
  declare status?: string | null;

  @ApiProperty({ example: "ZlNFpri-Y40", description: "YouTube key of the official English trailer" })
  @Column({ type: DataType.STRING, allowNull: true })
  declare trailerKey?: string | null;

  // NULL means details were not fetched from TMDB yet
  @Column({ type: DataType.DATE, allowNull: true })
  declare detailsFetchedAt?: Date | null;

  // Failed fetch attempts, movies over the limit are skipped by the worker
  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
  declare detailsAttempts: number;

  @BelongsToMany(() => Genre, () => MovieGenres)
  declare genres: Genre[];

  @BelongsToMany(() => Person, () => MovieCast)
  declare cast: Person[];

  @BelongsToMany(() => Company, () => MovieCompanies)
  declare companies: Company[];

  @HasMany(() => MovieTranslation)
  declare translations: MovieTranslation[];
}
