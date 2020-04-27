import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { IPerStateTestReport, IUsCasesTestingProgression, ICOVID19GeneralReport, JSUResponse, USResponse } from './models/covid.model';
import { Cron, CronExpression } from '@nestjs/schedule';
import { mergeMap, map, tap, switchMap, delay, mapTo } from 'rxjs/operators'
import { Observable, of, Subject, interval, from, ObservedValueOf } from 'rxjs';
import { ArchiveHttp } from 'ants-protocol-sdk'

@Injectable()
export class AppService implements OnModuleInit {

  private archiveHttp = new ArchiveHttp('http://198.199.80.167:3000')
  private archiveName = 'covidtrackertest';

  private usObserver = this.archiveHttp.getAllReports(this.archiveName, 'uscovid')
    .pipe(map((reports) => {
      const covidReports: IPerStateTestReport[] = [];
      const latestDate = new Date(Math.max.apply(null, reports.map((r) => new Date(r.timestamp))));
      reports.map((v) => console.log(v.timestamp))
      const latestReport = reports.find((report) => {
        return report.timestamp === latestDate.toString()
      });
      const USReportUpload = latestDate.toString();
      const USreportHash = latestReport.hash;

      const perState = latestReport.getValueByKey('perStateReport') as IPerStateTestReport[];
      const US = latestReport.getValueByKey('usOverallTestingProgression') as IUsCasesTestingProgression;

      perState.forEach((point) => covidReports.push(point));
      let USSender = ''
      if (latestReport.senderAddress.plain() === 'TBYKY5JIX3TSI6FBQYJHDOSQVMMRENKWYXAM43F4') {
        USSender = 'ants-uscovid-bot';
      } else {
        USSender = 'not valid sender';
      }
      return {
        sender: USSender,
        hash: USreportHash,
        timestamp: USReportUpload,
        states: perState,
        overall: US
      }
    }))


  private jsuObserver = this.archiveHttp.getAllReports(this.archiveName, 'covid')
    .pipe(map((reports) => {
      let covidReports: ICOVID19GeneralReport[] = [];

      const latestDate = new Date(Math.max.apply(null, reports.map((r) => new Date(r.timestamp))))
      const latestReport = reports.find((report) => report.timestamp === latestDate.toString());

      const worldWideReportUpload = latestDate.toString();
      const worldWidereportHash = latestReport.hash;
      console.log(latestReport.hash);
      const totalConfirmed = latestReport.getValueByKey('totalGlobalInfected') as number;
      const totalDeath = latestReport.getValueByKey('totalGlobalDeathCount') as number;
      const totalRecovery = latestReport.getValueByKey('totalGlobalRecovered') as number;
      const totalActive = totalConfirmed - totalRecovery;
      let worldWideSender;

      if (latestReport.senderAddress.plain() === 'TDXELMSWWES7TV6GQWXYIQ5PLOAVNHRPZ5RSFKD2') {
        worldWideSender = 'ants-jsu-covid-bot';
      } else {
        worldWideSender = 'not valid!'
      }

      const perCountry = latestReport.getValueByKey('covidCountryReport') as ICOVID19GeneralReport[];
      perCountry.forEach((point) => covidReports.push(point));
      covidReports = covidReports.filter((c) => c.confirmed !== 0);
      return { sender: worldWideSender, timestamp: worldWideReportUpload, hash: worldWidereportHash, deaths: totalDeath, confirmed: totalConfirmed, active: totalActive, recovered: totalRecovery, reports: covidReports }
    }));

  private usDataStore: USResponse
  private jsuDataStore: JSUResponse

  async onModuleInit() {
    await this.updateJsuData()
    await this.updateUsData()
  }

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async updateJsuData() {
    this.jsuDataStore = await this.jsuObserver.toPromise()
  }

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async updateUsData() {
    this.usDataStore = await this.usObserver.toPromise()
  }

  getUsData(): USResponse {
    return this.usDataStore
  }

  getJsuData(): JSUResponse {
    return this.jsuDataStore
  }

}