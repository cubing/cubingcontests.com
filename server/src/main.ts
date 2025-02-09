import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { MyLogger } from "./modules/my-logger/my-logger.service";

async function bootstrap() {
  if (!process.env.PORT) throw new Error("FRONTEND PORT NOT SET!");
  if (!process.env.BACKEND_PORT) throw new Error("BACKEND PORT NOT SET!");
  if (!process.env.JWT_SECRET) throw new Error("JWT SECRET NOT SET!");
  if (!process.env.DB_NAME) throw new Error("DB NAME NOT SET!");
  if (!process.env.DB_USERNAME) throw new Error("DB USERNAME NOT SET!");
  if (!process.env.DB_PASSWORD) throw new Error("DB PASSWORD NOT SET!");
  if (!process.env.BASE_URL) throw new Error("BASE URL NOT SET!");
  if (!process.env.MAIL_URL) throw new Error("MAIL URL NOT SET!");
  if (!process.env.EMAIL_USERNAME) throw new Error("EMAIL USERNAME NOT SET!");
  if (!process.env.EMAIL_PASSWORD) throw new Error("EMAIL PASSWORD NOT SET!");

  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const logger = new MyLogger();
  let corsOptions;

  app.useLogger(logger); // use custom logger

  if (process.env.NODE_ENV === "production") {
    if (!process.env.MONGODB_HOSTNAME) {
      throw new Error("MONGO DB HOSTNAME NOT SET!");
    }

    corsOptions = {
      origin: [process.env.BASE_URL, `http://cc-client:${process.env.PORT}`],
    };

    logger.log(
      `Setting CORS origin policy for ${corsOptions.origin.join(", ")}`,
    );
  }

  app.enableCors(corsOptions);
  app.setGlobalPrefix("api"); // add global /api prefix to all routes

  await app.listen(
    process.env.BACKEND_PORT,
    () => logger.log(`Server is listening on port ${process.env.BACKEND_PORT}`),
  );
}

bootstrap();
