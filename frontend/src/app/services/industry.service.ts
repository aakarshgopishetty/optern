import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfigService } from './config.service';

export interface Industry {
  industryID: number;
  industryName: string;
}

@Injectable({
  providedIn: 'root'
})
export class IndustryService {
  constructor(private http: HttpClient, private configService: ConfigService) { }

  getIndustries(): Observable<Industry[]> {
    const industryUrl = this.configService.getIndustryLookupUrl();
    return this.http.get<Industry[]>(industryUrl);
  }
}
