import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MyLogger } from './modules/my-logger/my-logger.service';

const PORT = process.env.PORT || 5000;

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });
  app.useLogger(new MyLogger()); // use custom logger

  let corsOptions;

  if (!process.env.JWT_SECRET) throw new Error('JWT SECRET NOT SET!');
  if (!process.env.MONGODB_URI) throw new Error('MONGO DB URI NOT SET!');

  if (process.env.NODE_ENV === 'production') {
    corsOptions = {
      origin: ['https://cubingcontests.com'],
    };

    console.log('Setting CORS origin policy for', corsOptions.origin);
  }

  app.enableCors(corsOptions);
  app.setGlobalPrefix('api'); // add global /api prefix to all routes

  await app.listen(PORT, () => console.log(`Server is listening on port ${PORT}`));
}

bootstrap();
