import { Column, DataType, ForeignKey, Model, Table } from "sequelize-typescript";
import { Movie } from "./movies.model";
import { Genre } from "../genres/genres.model";

@Table({ tableName: "movie_genres" })
export class MovieGenres extends Model {
  @ForeignKey(() => Movie)
  @Column({ type: DataType.INTEGER })
  declare movieId: number;

  @ForeignKey(() => Genre)
  @Column({ type: DataType.INTEGER })
  declare genreId: number;
}
