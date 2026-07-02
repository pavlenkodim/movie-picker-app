import { ApiProperty } from "@nestjs/swagger";
import { Column, DataType, Table, Model, BelongsToMany } from "sequelize-typescript";
import { MovieGenres } from "src/movies/movie-genres.model";
import { Movie } from "src/movies/movies.model";

interface GenreCreationAttr {
  id: number;
  name: string;
}

@Table({ tableName: "genres" })
export class Genre extends Model<Genre, GenreCreationAttr> {
  @ApiProperty({ example: 1, description: "Unique genre ID" })
  @Column({
    type: DataType.INTEGER,
    unique: true,
    primaryKey: true,
  })
  declare id: number;

  @ApiProperty({ example: "Si-Fi", description: "Genre name" })
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare name: string;

  @BelongsToMany(() => Movie, () => MovieGenres)
  movies: Movie[];
}
