import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

const PORT = process.env.PORT || 4000;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  let corsOptions;

  if (process.env.NODE_ENV === 'production') {
    console.log('Setting CORS origin policy for https://denimintsaev.com and https://www.denimintsaev.com');

    corsOptions = {
      origin: ['https://denimintsaev.com', 'https://www.denimintsaev.com'],
    };
  }

  app.enableCors(corsOptions);

  await app.listen(PORT, () => console.log(`Server is listening on port ${PORT}`));
}
bootstrap();
