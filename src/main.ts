import { Logger, ValidationPipe } from '@nestjs/common';
import { NestApplication, NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestApplication>(AppModule);

  // app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  const host = process.env.HOST ?? 'localhost';
  const port = process.env.PORT ?? 3000;

  // const config = new DocumentBuilder()
  //   .setTitle('Cats example')
  //   .setDescription('The cats API description')
  //   .setVersion('1.0')
  //   .addTag('cats')
  //   .build();
  // const documentFactory = () => SwaggerModule.createDocument(app, config);
  // SwaggerModule.setup('api', app, documentFactory);
  // console.log(process.env);

  await app.listen(port, host);
  Logger.log(`Server is running on http://${host}:${port}`, 'Bootstrap');
  Logger.log(`Swagger is running on http://${host}:${port}/api`, 'Bootstrap');
}
void bootstrap();

// DLFreq = ((644628 – 620000）/ 2 * 30k) + 3300M
// const num = (((624628 - 620000) / 2) * 30 * 1000 + 3300 * 1000000) / 1000000;
// console.log(num);
