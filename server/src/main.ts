import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { MyLogger } from "./modules/my-logger/my-logger.service";

async function bootstrap() {
  if (!process.env.JWT_SECRET) throw new Error("JWT SECRET NOT SET!");
  if (!process.env.MONGO_DEV_USERNAME) throw new Error("MONGO DB USERNAME NOT SET!");
  if (!process.env.MONGO_DEV_PASSWORD) throw new Error("MONGO DB PASSWORD NOT SET!");
  if (!process.env.BASE_URL) throw new Error("BASE URL NOT SET!");
  if (!process.env.MAIL_URL) throw new Error("MAIL URL NOT SET!");
  if (!process.env.EMAIL_USERNAME) throw new Error("EMAIL USERNAME NOT SET!");
  if (!process.env.EMAIL_PASSWORD) throw new Error("EMAIL PASSWORD NOT SET!");

  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const logger = new MyLogger();
  let corsOptions;

  app.useLogger(logger); // use custom logger

  if (process.env.NODE_ENV === "production") {
    corsOptions = { origin: [process.env.BASE_URL, "http://cc-client:3000"] };

    logger.log(`Setting CORS origin policy for ${corsOptions.origin.join(", ")}`);
  }

  app.enableCors(corsOptions);
  app.setGlobalPrefix("api"); // add global /api prefix to all routes

  await app.listen(process.env.BACKEND_PORT, () =>
    logger.log(`Server is listening on port ${process.env.BACKEND_PORT}`),
  );
}

bootstrap();
