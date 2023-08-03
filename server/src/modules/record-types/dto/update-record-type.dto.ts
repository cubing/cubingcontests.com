import { IsBoolean, IsEnum, IsNumber, IsString } from 'class-validator';
import { IRecordType } from '@sh/interfaces';
import { Color, WcaRecordType } from '@sh/enums';

export class UpdateRecordTypeDto implements IRecordType {
  @IsString()
  label: string;

  @IsEnum(WcaRecordType)
  wcaEquivalent: WcaRecordType;

  @IsNumber()
  order: number;

  @IsBoolean()
  active: boolean;

  @IsEnum(Color)
  color: Color;
}
