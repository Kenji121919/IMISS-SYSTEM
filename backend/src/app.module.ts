import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProfilesModule } from './profiles/profiles.module';
import { User } from './entities/user.entity';
import { Profile } from './entities/profile.entity';

import { AuthModule } from './auth/auth.module'; // 🔥 ADD THIS

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: '',
      database: 'imisslogs_db',
      entities: [User, Profile],
      synchronize: true,
    }),

    AuthModule, 
    ProfilesModule,
  ],
})
export class AppModule {}