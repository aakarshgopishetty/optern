import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Industry {
  industryID: number;
  industryName: string;
}

@Injectable({
  providedIn: 'root'
})
export class IndustryService {
  private apiUrl = 'http://localhost:5000/api/industrylookup';

  constructor(private http: HttpClient) { }

  getIndustries(): Observable<Industry[]> {
    return this.http.get<Industry[]>(this.apiUrl);
  }
}
