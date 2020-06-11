import { Injectable, OnModuleInit } from '@nestjs/common';
import { IUsCasesTestingProgression, ICOVID19GeneralReport, JSUResponse, USResponse } from './models/covid.model';
import { Cron, CronExpression } from '@nestjs/schedule';
import { map } from 'rxjs/operators'
import { ReportHttp } from 'ants-protocol-sdk'
import { RepositoryFactoryHttp } from 'symbol-sdk';

@Injectable()
export class AppService implements OnModuleInit {

  private repositoryFactory = new RepositoryFactoryHttp('http://178.128.184.107:3000')
  private reportHttp = new ReportHttp(this.repositoryFactory)
  private archiveName = 'covidtrackertest';


  private usObserver = this.reportHttp.getAllReportsForArchive(this.archiveName, 'uscovid')
    .pipe(map((reports) => {
      const latestDate = new Date(Math.max.apply(null, reports.map((r) => new Date(r.timestamp))));
      reports.map((v) => console.log(v.timestamp))
      const latestReport = reports.find((report) => {
        return Date.parse(report.timestamp) === latestDate.getTime()
      });
      const USReportUpload = latestDate.toString();
      const USreportHash = latestReport.hash;

      const US = latestReport.getValueByKey('usOverallTestingProgression') as IUsCasesTestingProgression;

      let USSender = ''
      console.log("US", latestReport.senderAddress.plain())
      if (latestReport.senderAddress.plain() === 'TAAC7OZEOYERQJTZMVMRRM7SE7RU3ZNPP3QPYVAZ') {
        USSender = 'ants-uscovid-bot';
      } else {
        USSender = 'not valid sender';
      }
      return {
        sender: USSender,
        hash: USreportHash,
        timestamp: USReportUpload,
        overall: US
      }
    }))


  private jsuObserver = this.reportHttp.getAllReportsForArchive(this.archiveName, 'covid')
    .pipe(map((reports) => {
      let covidReports: ICOVID19GeneralReport[] = [];

      const latestDate = new Date(Math.max.apply(null, reports.map((r) => new Date(r.timestamp))))
      const latestReport = reports.find((report) => Date.parse(report.timestamp) === latestDate.getTime());
      const worldWideReportUpload = latestDate.toString();
      const worldWidereportHash = latestReport.hash;
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