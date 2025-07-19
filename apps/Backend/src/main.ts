import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 啟用驗證管道
  app.useGlobalPipes(new ValidationPipe());
  // 全域錯誤過濾器
  app.useGlobalFilters(new AllExceptionsFilter());

  // Swagger 設定
  const config = new DocumentBuilder()
    .setTitle('User API')
    .setDescription('The USer API for managing users')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  app.enableCors({
    origin: 'http://localhost:5173', // 允許前端的來源
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // 允許的 HTTP 方法
    credentials: true, // 允許發送 cookie 和 HTTP 認證資訊
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
