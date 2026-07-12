import { ApiProperty } from "@nestjs/swagger";
import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from "sequelize-typescript";
import { Profile } from "../profiles/profiles.model";
import { Genre } from "../genres/genres.model";

interface ProfileGenreWeightCreationAttrs {
  profileId: number;
  genreId: number;
  weight?: number;
}

@Table({
  tableName: "profile_genre_weights",
  indexes: [
    {
      unique: true,
      fields: ["profileId", "genreId"],
      name: "unique_profile_genre",
    },
  ],
})
export class ProfileGenreWeight extends Model<ProfileGenreWeight, ProfileGenreWeightCreationAttrs> {
  @ApiProperty({ example: 1 })
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  declare id: number;

  @ApiProperty({ example: 1 })
  @ForeignKey(() => Profile)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare profileId: number;

  @ApiProperty({ example: 28 })
  @ForeignKey(() => Genre)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare genreId: number;

  @ApiProperty({ example: 0.5 })
  @Column({ type: DataType.DECIMAL(3, 2), allowNull: false, defaultValue: 0 })
  declare weight: number;

  @BelongsTo(() => Profile, "profileId")
  declare profile: Profile;

  @BelongsTo(() => Genre, "genreId")
  declare genre: Genre;
}
