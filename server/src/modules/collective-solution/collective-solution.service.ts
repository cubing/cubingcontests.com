import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { Alg } from 'cubing/alg';
import { cube3x3x3 } from 'cubing/puzzles';
import { MyLogger } from '@m/my-logger/my-logger.service';
import { CollectiveSolutionDocument } from '~/src/models/collective-solution.model';
import { ICollectiveSolution, IFeCollectiveSolution } from '@sh/types';
import { CreateCollectiveSolutionDto } from '@m/collective-solution/dto/create-collective-solution.dto';
import { IPartialUser } from '~/src/helpers/interfaces/User';
import { LogType } from '~/src/helpers/enums';
import { MakeMoveDto } from '~/src/modules/collective-solution/dto/make-move.dto';

@Injectable()
export class CollectiveSolutionService {
  constructor(
    private readonly logger: MyLogger,
    @InjectModel('CollectiveSolution') private readonly collectiveSolutionModel: Model<CollectiveSolutionDocument>,
  ) {}

  public async getCollectiveSolution(): Promise<IFeCollectiveSolution> {
    const currentSolution = await this.getCurrentSolution();

    if (!currentSolution) return;

    return this.mapCollectiveSolution(currentSolution);
  }

  public async startNewSolution(
    createCollectiveSolutionDto: CreateCollectiveSolutionDto,
    user: IPartialUser,
  ): Promise<IFeCollectiveSolution> {
    this.logger.logAndSave('Generating new Collective Cubing scramble.', LogType.StartNewSolution);

    const currentSolution = await this.getCurrentSolution();

    const newCollectiveSolution: ICollectiveSolution = {
      ...createCollectiveSolutionDto,
      attemptNumber: (currentSolution?.attemptNumber ?? 0) + 1,
      solution: '',
      lastUserWhoInteracted: new mongoose.Types.ObjectId(user._id as string),
      usersWhoMadeMoves: [],
      state: 10,
    };

    return this.mapCollectiveSolution(await this.collectiveSolutionModel.create(newCollectiveSolution));
  }

  public async makeMove(makeMoveDto: MakeMoveDto, user: IPartialUser): Promise<IFeCollectiveSolution> {
    const currentSolution = await this.getCurrentSolution();

    if (!currentSolution)
      throw new BadRequestException("A solve hasn't been started yet. Please generate a scramble first.");

    if (user._id === currentSolution.lastUserWhoInteracted.toString())
      throw new BadRequestException('You may not make two moves in a row');

    if (currentSolution.solution !== makeMoveDto.lastSeenSolution)
      throw new BadRequestException('The state of the cube has changed before your move. Please reload and try again.');

    currentSolution.solution = `${currentSolution.solution} ${makeMoveDto.move}`.trim();
    currentSolution.lastUserWhoInteracted = new mongoose.Types.ObjectId(user._id as string);
    if (!currentSolution.usersWhoMadeMoves.some((usr) => usr.toString() === user._id))
      currentSolution.usersWhoMadeMoves.push(currentSolution.lastUserWhoInteracted);

    if (await this.getIsSolved(currentSolution)) {
      currentSolution.state = 20;
    }

    await currentSolution.save();

    return this.mapCollectiveSolution(currentSolution);
  }

  async getCurrentSolution(): Promise<CollectiveSolutionDocument> {
    return await this.collectiveSolutionModel.findOne({ state: { $lt: 30 } }).exec();
  }

  mapCollectiveSolution(collectiveSolution: CollectiveSolutionDocument): IFeCollectiveSolution {
    const mappedCollectiveSolution: IFeCollectiveSolution = {
      eventId: collectiveSolution.eventId,
      attemptNumber: collectiveSolution.attemptNumber,
      scramble: collectiveSolution.scramble,
      solution: collectiveSolution.solution,
      state: collectiveSolution.state,
      lastUserWhoInteractedId: collectiveSolution.lastUserWhoInteracted.toString(),
      totalUsersWhoMadeMoves: collectiveSolution.usersWhoMadeMoves.length,
    };

    return mappedCollectiveSolution;
  }

  async getIsSolved(collectiveSolution: CollectiveSolutionDocument): Promise<boolean> {
    const kpuzzle = await cube3x3x3.kpuzzle();
    const originalScramble = new Alg(`${collectiveSolution.scramble} z ${collectiveSolution.solution}`);
    return kpuzzle
      .defaultPattern()
      .applyAlg(originalScramble)
      .experimentalIsSolved({ ignorePuzzleOrientation: true, ignoreCenterOrientation: true });
  }
}
