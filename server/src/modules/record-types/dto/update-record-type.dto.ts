import { IsBoolean, IsEnum, IsInt, IsString, Matches, Min } from "class-validator";
import { IRecordType } from "~/shared/types";
import { Color, WcaRecordType } from "~/shared/enums";

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
