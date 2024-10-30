import { Global, Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { UsersModule } from "@m/users/users.module";
import { LoggerModule } from "@m/my-logger/my-logger.module";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { LocalStrategy } from "./local.strategy";
import { JwtStrategy } from "./jwt.strategy";
import { AuthTokenSchema } from "~/src/models/auth-token.model";

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([{ name: "AuthToken", schema: AuthTokenSchema }]),
    UsersModule,
    LoggerModule,
    PassportModule,
    JwtModule.register({
      // global: true,
      // The fallback is the same as in .env.dev. It's necessary, because that file isn't
      // loaded until the Nest JS dependencies are initialized.
      secret: process.env.JWT_SECRET || "jwt_secret",
      signOptions: { expiresIn: "86400s" }, // 24 hours
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, LocalStrategy, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
