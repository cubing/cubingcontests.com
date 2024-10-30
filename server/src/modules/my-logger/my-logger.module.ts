import { Module } from "@nestjs/common";
import { MyLogger } from "./my-logger.service";
import { MongooseModule } from "@nestjs/mongoose";
import { LogSchema } from "~/src/models/log.model";

@Module({
  imports: [MongooseModule.forFeature([{ name: "Log", schema: LogSchema }])],
  providers: [MyLogger],
  exports: [MyLogger],
})
export class LoggerModule {}
