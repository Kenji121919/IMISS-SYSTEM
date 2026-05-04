import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { User } from './entities/user.entity'
import { Profile } from './entities/profile.entity'
import { Module as ModuleEntity } from './entities/module.entity'
import { Log } from './entities/log.entity'

import { AuthModule } from './auth/auth.module'
import { ProfilesModule } from './profiles/profiles.module'
import { ModulesModule } from './module/modules.module'
import { LogsModule } from './logs/logs.module'
import { ModuleColumn } from './entities/module-column.entity'

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: '1234',
      database: 'imisslogs_db',
      entities: [User, Profile, ModuleEntity, Log,  ModuleColumn],
      synchronize: true,
    }),

    AuthModule,
    ProfilesModule,
    ModulesModule,
    LogsModule,
  ],
})
export class AppModule {}