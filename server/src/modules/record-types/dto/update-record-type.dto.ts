import { IsBoolean, IsEnum, IsInt, IsString, Matches, Min } from 'class-validator';
import { IRecordType } from '@sh/types';
import { Color, WcaRecordType } from '@sh/enums';

export class UpdateRecordTypeDto implements IRecordType {
  @IsString()
  @Matches(/^[a-zA-Z ]{2,}$/)
  label: string;

  @IsEnum(WcaRecordType)
  wcaEquivalent: WcaRecordType;

  @IsInt()
  @Min(1)
  order: number;

  @IsBoolean()
  active: boolean;

  @IsEnum(Color)
  color: Color;
}
