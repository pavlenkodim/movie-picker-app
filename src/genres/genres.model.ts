import { ApiProperty } from "@nestjs/swagger";
import { Column, DataType, Table, Model } from "sequelize-typescript";

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

  @ApiProperty({ example: "Si-Fi", description: "Ganre name" })
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare name: string;
}
