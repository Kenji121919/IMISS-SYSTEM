import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProfilesModule } from './profiles/profiles.module';
import { User } from './entities/user.entity';
import { Profile } from './entities/profile.entity';
import { DailyLog } from './entities/daily-log.entity';
import { AuthModule } from './auth/auth.module'; 
import { DailyLogModule } from './daily-log/daily-log.module'

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: '',
      database: 'imisslogs_db',
      entities: [User, Profile, DailyLog],
      synchronize: true,
      
    }),

    AuthModule, 
    ProfilesModule,
    DailyLogModule,
  ],
})
export class AppModule {}