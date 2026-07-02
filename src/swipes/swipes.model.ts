import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from "sequelize-typescript";
import { Profile } from "src/profiles/profiles.model";
import { Movie } from "src/movies/movies.model";

interface SwipeCreationAttrs {
  profileId: number;
  movieId: number;
  liked: boolean;
}

@Table({ tableName: "swipes" })
export class Swipe extends Model<Swipe, SwipeCreationAttrs> {
  @Column({ type: DataType.INTEGER, autoIncrement: true, primaryKey: true })
  declare id: number;

  @ForeignKey(() => Profile)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare profileId: number;

  @ForeignKey(() => Movie)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare movieId: number;

  @Column({ type: DataType.BOOLEAN, allowNull: false })
  declare liked: boolean;

  @BelongsTo(() => Movie, "movieId")
  declare movie: Movie;

  @BelongsTo(() => Profile, "profileId")
  declare profile: Profile;
}
