import { Column, DataType, ForeignKey, Model, Table } from "sequelize-typescript";
import { Movie } from "./movies.model";
import { Person } from "../persons/persons.model";

@Table({ tableName: "movie_cast" })
export class MovieCast extends Model {
  @ForeignKey(() => Movie)
  @Column({ type: DataType.INTEGER, primaryKey: true })
  declare movieId: number;

  @ForeignKey(() => Person)
  @Column({ type: DataType.INTEGER, primaryKey: true })
  declare personId: number;

  // Billing position in the credits, 0 is the lead role
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare order: number;
}
