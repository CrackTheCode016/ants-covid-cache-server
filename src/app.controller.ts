import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { Observable } from 'rxjs';
import { JSUResponse, USResponse } from './models/covid.model';
import { Cron, CronExpression } from '@nestjs/schedule';

@Controller('covid')
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Get('us')
  getUS(): USResponse {
    console.log("been one minute!")
    return this.appService.getUsData()
  }

  @Get('jsu')
  getJSU(): JSUResponse {
    return this.appService.getJsuData();
  }

}
