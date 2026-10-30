import { ApiProperty } from "@nestjs/swagger";
import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from "sequelize-typescript";
import { Movie } from "./movies.model";

interface MovieTranslationCreationAttrs {
  movieId: number;
  language: string;
  title?: string | null;
  overview?: string | null;
  posterPath?: string | null;
}

// English lives in movies as the fallback. A row with NULL fields means
// "checked, TMDB has no translation"; no row means "not localized yet".
@Table({ tableName: "movie_translations" })
export class MovieTranslation extends Model<MovieTranslation, MovieTranslationCreationAttrs> {
  @ForeignKey(() => Movie)
  @Column({ type: DataType.INTEGER, primaryKey: true })
  declare movieId: number;

  @ApiProperty({ example: "ru", description: "Language code (ISO 639-1)" })
  @Column({ type: DataType.STRING(10), primaryKey: true })
  declare language: string;

  @ApiProperty({ example: "Человек-муравей и Оса: Квантомания", description: "Translated title" })
  @Column({ type: DataType.STRING, allowNull: true })
  declare title?: string | null;

  @ApiProperty({ example: "Скотт Лэнг и Хоуп ван Дайн...", description: "Translated overview" })
  @Column({ type: DataType.TEXT, allowNull: true })
  declare overview?: string | null;

  @ApiProperty({ example: "/7SmWrWVnAKuXNI0bJ0jJXRHx1xR.jpg", description: "Localized poster" })
  @Column({ type: DataType.STRING, allowNull: true })
  declare posterPath?: string | null;

  @BelongsTo(() => Movie)
  declare movie: Movie;
}
