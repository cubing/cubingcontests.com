import "server-only";
import * as d from "drizzle-orm/pg-core";

export const rrSchema = d.snakeCase.schema("record_ranks");
