import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { ProfileGenreWeight } from "./profile-genre-weights.model";

const INITIAL_WEIGHT = 0.5;
const LEARNING_RATE = 0.1;

@Injectable()
export class GenreWeightsService {
  constructor(
    @InjectModel(ProfileGenreWeight)
    private genreWeightRepository: typeof ProfileGenreWeight,
  ) {}

  async setInitialWeights(profileId: number, genreIds: number[]) {
    if (!profileId) {
      throw new HttpException(
        "You need to create a profile or refresh your token",
        HttpStatus.FORBIDDEN,
      );
    }
    const rows = genreIds.map((genreId) => ({
      profileId,
      genreId,
      weight: INITIAL_WEIGHT,
    }));

    await this.genreWeightRepository.bulkCreate(rows, {
      updateOnDuplicate: ["weight"],
    });

    return this.getWeights(profileId);
  }

  async getWeights(profileId: number) {
    if (!profileId) {
      throw new HttpException(
        "You need to create a profile or refresh your token",
        HttpStatus.FORBIDDEN,
      );
    }
    return this.genreWeightRepository.findAll({ where: { profileId } });
  }

  async getTopGenres(profileId: number, limit?: number) {
    return this.genreWeightRepository.findAll({
      where: { profileId },
      order: [["weight", "DESC"]],
      limit,
    });
  }

  // TODO: Check this function
  async applySwipeUpdate(profileId: number, genreIds: number[], liked: boolean) {
    const target = liked ? 1 : 0;

    await Promise.all(
      genreIds.map((genreId) =>
        this.genreWeightRepository.sequelize?.query(
          `INSERT INTO "profile_genre_weights" ("profileId", "genreId", "weight", "createdAt", "updatedAt")
         VALUES (:profileId, :genreId, :initialWeight, NOW(), NOW())
         ON CONFLICT ("profileId", "genreId")
         DO UPDATE SET
           "weight" = "profile_genre_weights"."weight" + :learningRate * (:target - "profile_genre_weights"."weight"),
           "updatedAt" = NOW()`,
          {
            replacements: {
              profileId,
              genreId,
              initialWeight: INITIAL_WEIGHT,
              learningRate: LEARNING_RATE,
              target,
            },
          },
        ),
      ),
    );
  }
}
