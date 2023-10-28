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

  error(message: any) {
    this.logModel?.create({ message, type: LogType.Error });
    super.error(message);
  }

  warn(message: any) {
    this.logModel?.create({ message, type: LogType.Warning });
    super.warn(message);
  }

  // Allows logging with a specific log type
  logAndSave(message: string, type: LogType) {
    this.logModel?.create({ message, type });
    super.log(message);
  }
}
