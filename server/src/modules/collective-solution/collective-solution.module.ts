import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { CollectiveSolutionController } from "./collective-solution.controller";
import { CollectiveSolutionSchema } from "~/src/models/collective-solution.model";
import { CollectiveSolutionService } from "./collective-solution.service";
import { LoggerModule } from "@m/my-logger/my-logger.module";

@Module({
  imports: [
    LoggerModule,
    MongooseModule.forFeature([{ name: "CollectiveSolution", schema: CollectiveSolutionSchema }]),
  ],
  controllers: [CollectiveSolutionController],
  providers: [CollectiveSolutionService],
})
export class CollectiveSolutionModule {}
