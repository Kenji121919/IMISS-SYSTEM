import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ConfigModule } from '@nestjs/config'

import { User } from './entities/user.entity'
import { Profile } from './entities/profile.entity'
import { Module as ModuleEntity } from './entities/module.entity'
import { Log } from './entities/log.entity'
import { ModuleColumn } from './entities/module-column.entity'
import { AuditLog } from './entities/audit-log.entity'
import { ModuleTemplate } from './entities/module-template.entity'

import { AuthModule } from './auth/auth.module'
import { ProfilesModule } from './profiles/profiles.module'
import { ModulesModule } from './module/modules.module'
import { LogsModule } from './logs/logs.module'
import { AuditModule } from './audit/audit.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: '1234',
      database: 'imisslogs_db',
      entities: [
        User,
        Profile,
        ModuleEntity,
        Log,
        ModuleColumn,
        AuditLog,
        ModuleTemplate,
      ],
      synchronize: true,
    }),

    AuthModule,
    ProfilesModule,
    ModulesModule,
    LogsModule,
    AuditModule,
  ],
})
export class AppModule {}