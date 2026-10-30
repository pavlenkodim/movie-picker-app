import { Column, DataType, ForeignKey, Model, Table } from "sequelize-typescript";
import { Movie } from "./movies.model";
import { Company } from "../companies/companies.model";

@Table({ tableName: "movie_companies" })
export class MovieCompanies extends Model {
  @ForeignKey(() => Movie)
  @Column({ type: DataType.INTEGER, primaryKey: true })
  declare movieId: number;

  @ForeignKey(() => Company)
  @Column({ type: DataType.INTEGER, primaryKey: true })
  declare companyId: number;
}
