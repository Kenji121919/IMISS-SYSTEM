import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { DataSource } from 'typeorm'

import { ValidationPipe } from '@nestjs/common'
import 'dotenv/config'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  app.useGlobalPipes(new ValidationPipe())
  app.enableCors()


  const dataSource = app.get(DataSource)
  if (!dataSource.isInitialized) {
    await dataSource.initialize()
  }


  await app.listen(3111, '0.0.0.0')
  console.log('Server running on http://localhost:3111')
}

bootstrap()