import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, mongo } from 'mongoose';
import { MyLogger } from '@m/my-logger/my-logger.service';
import { CollectiveSolutionDocument } from '~/src/models/collective-solution.model';
import { ICollectiveSolution, IFeCollectiveSolution } from '@sh/types';
import { IPartialUser } from '~/src/helpers/interfaces/User';
import { LogType } from '~/src/helpers/enums';
import { MakeMoveDto } from '~/src/modules/collective-solution/dto/make-move.dto';
import { importEsmModule } from '~/src/helpers/utilityFunctions';

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

  public async startNewSolution(user: IPartialUser): Promise<IFeCollectiveSolution> {
    const alreadyScrambledSolution = await this.collectiveSolutionModel.findOne({ state: 10 }).exec();
    if (alreadyScrambledSolution) {
      throw new BadRequestException({
        message: 'The cube has already been scrambled',
        data: { collectiveSolution: this.mapCollectiveSolution(alreadyScrambledSolution) },
      });
    }

    this.logger.logAndSave('Generating new Collective Cubing scramble.', LogType.StartNewSolution);

    const { randomScrambleForEvent } = await importEsmModule('cubing/scramble');

    const currentSolution = await this.getCurrentSolution();
    const eventId = '333';
    const scramble = await randomScrambleForEvent(eventId);
    const newCollectiveSolution: ICollectiveSolution = {
      eventId,
      attemptNumber: (currentSolution?.attemptNumber ?? 0) + 1,
      scramble,
      solution: '',
      lastUserWhoInteracted: new mongo.ObjectId(user._id as string),
      usersWhoMadeMoves: [],
      state: 10,
    };

    const newSolution = await this.collectiveSolutionModel.create(newCollectiveSolution);

    const oldSolution = await this.collectiveSolutionModel.findOne({ state: 20 }).exec();

    // Archive old solution
    if (oldSolution) {
      oldSolution.state = 30;
      oldSolution.save();
    }

    return this.mapCollectiveSolution(newSolution);
  }

  public async makeMove(makeMoveDto: MakeMoveDto, user: IPartialUser): Promise<IFeCollectiveSolution> {
    const currentSolution = await this.getCurrentSolution();

    if (!currentSolution) {
      throw new BadRequestException("A solve hasn't been started yet. Please generate a scramble first.");
    }

    if (user._id === currentSolution.lastUserWhoInteracted.toString()) {
      const message = currentSolution.solution
        ? 'You may not make two moves in a row'
        : 'You scrambled the cube, so you may not make the first move';
      throw new BadRequestException(message);
    }

    if (currentSolution.solution !== makeMoveDto.lastSeenSolution) {
      throw new BadRequestException({
        message: 'The state of the cube has changed before your move',
        data: { collectiveSolution: this.mapCollectiveSolution(currentSolution) },
      });
    }

    currentSolution.solution = `${currentSolution.solution} ${makeMoveDto.move}`.trim();
    currentSolution.lastUserWhoInteracted = new mongo.ObjectId(user._id as string);
    if (!currentSolution.usersWhoMadeMoves.some((usr) => usr.toString() === user._id)) {
      currentSolution.usersWhoMadeMoves.push(currentSolution.lastUserWhoInteracted);
    }

    if (await this.getIsSolved(currentSolution)) currentSolution.state = 20;

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
    const { cube3x3x3 } = await importEsmModule('cubing/puzzles');
    const { Alg } = await importEsmModule('cubing/alg');

    const kpuzzle = await cube3x3x3.kpuzzle();
    const scramble = new Alg(`${collectiveSolution.scramble} z2 ${collectiveSolution.solution}`);
    const isSolved = kpuzzle
      .defaultPattern()
      .applyAlg(scramble)
      .experimentalIsSolved({ ignorePuzzleOrientation: true, ignoreCenterOrientation: true });

    return isSolved;
  }
}
