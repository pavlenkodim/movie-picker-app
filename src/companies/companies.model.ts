import { ApiProperty } from "@nestjs/swagger";
import { BelongsToMany, Column, DataType, Model, Table } from "sequelize-typescript";
import { Movie } from "src/movies/movies.model";
import { MovieCompanies } from "src/movies/movie-companies.model";

interface CompanyCreationAttrs {
  id: number;
  name: string;
  logoPath?: string | null;
  originCountry?: string | null;
}

@Table({ tableName: "companies" })
export class Company extends Model<Company, CompanyCreationAttrs> {
  @ApiProperty({ example: 420, description: "Unique TMDB company ID" })
  @Column({
    type: DataType.INTEGER,
    unique: true,
    primaryKey: true,
  })
  declare id: number;

  @ApiProperty({ example: "Marvel Studios", description: "Company name" })
  @Column({ type: DataType.STRING, allowNull: false })
  declare name: string;

  @ApiProperty({ example: "/hUzeosd33nzE5MCNsZxCGEKTXaQ.png", description: "Url to company logo" })
  @Column({ type: DataType.STRING, allowNull: true })
  declare logoPath?: string | null;

  @ApiProperty({ example: "US", description: "Company origin country (ISO 3166-1)" })
  @Column({ type: DataType.STRING, allowNull: true })
  declare originCountry?: string | null;

  @BelongsToMany(() => Movie, () => MovieCompanies)
  declare movies: Movie[];
}
