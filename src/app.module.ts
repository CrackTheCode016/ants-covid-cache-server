import { Module, CacheModule, CacheInterceptor } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_INTERCEPTOR } from '@nestjs/core';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    CacheModule.register({
      ttl: 86400,
      max: 2
    })
  ],
  controllers: [AppController],
  providers: [AppService,
    // {
    //   provide: APP_INTERCEPTOR,
    //   useClass: CacheInterceptor
    // },
  ],
})
export class AppModule { }
