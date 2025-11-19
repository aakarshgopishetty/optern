import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfigService } from './config.service';

export interface Company {
  companyID: number;
  name: string;
  website?: string;
  address?: string;
  founded?: string;
  size?: string;
}

@Injectable({ providedIn: 'root' })
export class CompanyService {
  constructor(private http: HttpClient, private configService: ConfigService) {}

  getAll(): Observable<Company[]> {
    const companiesUrl = this.configService.getCompaniesUrl();
    return this.http.get<Company[]>(companiesUrl);
  }

  get(id: number) {
    const companiesUrl = this.configService.getCompaniesUrl();
    return this.http.get<Company>(`${companiesUrl}/${id}`);
  }

  update(id: number, company: any): Observable<any> {
    const companiesUrl = this.configService.getCompaniesUrl();
    return this.http.put<any>(`${companiesUrl}/${id}`, company);
  }
}
