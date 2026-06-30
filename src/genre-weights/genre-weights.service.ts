import { Injectable } from "@nestjs/common";
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
    return this.genreWeightRepository.findAll({ where: { profileId } });
  }

  async getTopGenres(profileId: number, limit: number) {
    return this.genreWeightRepository.findAll({
      where: { profileId },
      order: [["weight", "DESC"]],
      limit,
    });
  }

  async applySwipeUpdate(profileId: number, genreIds: number[], liked: boolean) {
    const target = liked ? 1 : 0;

    for (const genreId of genreIds) {
      const [row] = await this.genreWeightRepository.findOrCreate({
        where: { profileId, genreId },
        defaults: { profileId, genreId, weight: INITIAL_WEIGHT },
      });

      const newWeight = row.weight + LEARNING_RATE * (target - row.weight);
      await row.update({ weight: newWeight });
    }
  }
}
