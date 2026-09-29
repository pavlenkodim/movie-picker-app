import { ApiProperty } from "@nestjs/swagger";
import { BelongsToMany, Column, DataType, HasOne, Model, Table } from "sequelize-typescript";
import { Role } from "../roles/roles.model";
import { UserRoles } from "../roles/user-roles.model";
import { Profile } from "src/profiles/profiles.model";

interface UserCreationAttrs {
  email: string;
  password?: string;
  googleId?: string;
}

@Table({
  tableName: "users",
})
export class User extends Model<User, UserCreationAttrs> {
  @ApiProperty({ example: 1, description: "Unique user ID" })
  @Column({
    type: DataType.INTEGER,
    unique: true,
    autoIncrement: true,
    primaryKey: true,
  })
  declare id: number;

  @ApiProperty({ example: "user@email.com", description: "Unique user email" })
  @Column({ type: DataType.STRING, unique: true, allowNull: false })
  declare email: string;

  @ApiProperty({
    example: "Qwerty123!",
    description: "User password (null for Google-only accounts)",
  })
  @Column({ type: DataType.STRING, allowNull: true })
  declare password: string | null;

  @ApiProperty({
    example: "109876543210987654321",
    description: "Google account ID (sub claim)",
  })
  @Column({ type: DataType.STRING, unique: true, allowNull: true })
  declare googleId: string | null;

  @ApiProperty({ example: false, description: "User ban status" })
  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  declare banned: boolean;

  @ApiProperty({ example: "Inappropriate behavior", description: "Reason for user ban" })
  @Column({ type: DataType.STRING, allowNull: true })
  declare banReason: string;

  @BelongsToMany(() => Role, () => UserRoles)
  roles: Role[];

  @HasOne(() => Profile, "userId")
  declare profile: Profile;
}
