import { ConsoleLogger, Injectable, Scope } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { LogDocument } from '~/src/models/log.model';
import { LogType } from '~/src/helpers/enums';

@Injectable({ scope: Scope.TRANSIENT })
export class MyLogger extends ConsoleLogger {
  private readonly logModel: Model<LogDocument>;

  constructor(@InjectModel('Log') logModel?: Model<LogDocument>) {
    super();
    this.logModel = logModel;
  }

  logAndSave(message: string, type = LogType.Generic) {
    // This is not awaited on purpose
    this.logModel.create({ message, type });

    super.log(message);
  }
}
