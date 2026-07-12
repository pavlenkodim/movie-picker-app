import { Column, DataType, Model, Table } from "sequelize-typescript";

interface TmdbFetchProgressCreationAttrs {
  genreKey: string;
  lastPage?: number;
  totalPages?: number;
}

@Table({ tableName: "tmdb_fetch_progress" })
export class TmdbFetchProgress extends Model<TmdbFetchProgress, TmdbFetchProgressCreationAttrs> {
  @Column({ type: DataType.STRING, allowNull: false, unique: true })
  declare genreKey: string;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
  declare lastPage: number;

  @Column({ type: DataType.INTEGER, allowNull: true })
  declare totalPages: number | null;
}
