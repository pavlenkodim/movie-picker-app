import { BelongsTo, Column, DataType, Table, Model } from "sequelize-typescript";
import { User } from "../users/users.model";
import { ApiProperty } from "@nestjs/swagger";

interface ProfileCreationAttrs {
  userId: number;
  nickname: string;
  thumbnail?: string;
}

@Table({
  tableName: "profiles",
})
export class Profile extends Model<Profile, ProfileCreationAttrs> {
  @ApiProperty({ example: 1, description: "Unique profile ID" })
  @Column({
    type: DataType.INTEGER,
    unique: true,
    autoIncrement: true,
    primaryKey: true,
  })
  declare id: number;

  @ApiProperty({ example: 1, description: "Unique user ID" })
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare userId: number;

  @ApiProperty({ example: "CoolNickname", description: "Profile nickname" })
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare nickname: string;

  @ApiProperty({
    example: "https://localhost:3000/thumbnail.jpg",
    description: "Profile thumbnail image url",
  })
  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare thumbnail?: string;

  @BelongsTo(() => User, "userId")
  declare user: User;
}
