import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { DataSource } from 'typeorm'
import { seedAdmin } from './seed'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  app.enableCors()

  await app.listen(3000, '0.0.0.0')
  console.log('Server running on http://localhost:3000')

  try {
    const dataSource = app.get(DataSource)
    await seedAdmin(dataSource)
  } catch (err) {
    console.log('Seeding error:', err)
  }
}

bootstrap()