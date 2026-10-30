import { ApiProperty } from "@nestjs/swagger";
import { BelongsToMany, Column, DataType, Model, Table } from "sequelize-typescript";
import { Movie } from "src/movies/movies.model";
import { MovieCast } from "src/movies/movie-cast.model";

interface PersonCreationAttrs {
  id: number;
  name: string;
  profilePath?: string | null;
}

@Table({ tableName: "persons" })
export class Person extends Model<Person, PersonCreationAttrs> {
  @ApiProperty({ example: 6193, description: "Unique TMDB person ID" })
  @Column({
    type: DataType.INTEGER,
    unique: true,
    primaryKey: true,
  })
  declare id: number;

  @ApiProperty({ example: "Leonardo DiCaprio", description: "Person name" })
  @Column({ type: DataType.STRING, allowNull: false })
  declare name: string;

  @ApiProperty({ example: "/wo2hJpn04vbtmh0B9utCFdsQhxM.jpg", description: "Url to profile photo" })
  @Column({ type: DataType.STRING, allowNull: true })
  declare profilePath?: string | null;

  @BelongsToMany(() => Movie, () => MovieCast)
  declare movies: Movie[];
}
