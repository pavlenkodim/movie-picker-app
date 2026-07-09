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

  async getTopGenres(profileId: number, limit: number) {
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
      genreIds.map(async (genreId) => {
        await this.genreWeightRepository.bulkCreate([{ profileId, genreId, weight: 0 }], {
          ignoreDuplicates: true,
        });

        await this.genreWeightRepository.update(
          {
            weight: this.genreWeightRepository.sequelize?.literal(
              `weight + ${LEARNING_RATE} * (${target} - weight)`,
            ) as unknown as number,
          },
          { where: { profileId, genreId } },
        );
      }),
    );
  }
}
