import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfigService } from './config.service';

export interface RecruiterProfile {
  recruiterID: number;
  fullName: string;
  email: string;
  jobTitle: string;
  phoneNumber: string;
  bio: string;
  createdDate: string;
  companyID: number;
  company?: {
    companyID: number;
    name: string;
    website: string;
    size: string;
    address: string;
    phone: string;
    founded: string;
    description: string;
    industryID: number;
    industry?: {
      industryID: number;
      industryName: string;
    };
  };
}

@Injectable({ providedIn: 'root' })
export class RecruiterService {
  constructor(private http: HttpClient, private configService: ConfigService) {}

  getProfile(): Observable<RecruiterProfile> {
    const recruitersUrl = this.configService.getRecruitersUrl();
    return this.http.get<RecruiterProfile>(`${recruitersUrl}/profile`);
  }

  updateProfile(profile: Partial<RecruiterProfile>): Observable<RecruiterProfile> {
    const recruitersUrl = this.configService.getRecruitersUrl();
    return this.http.put<RecruiterProfile>(`${recruitersUrl}/profile`, profile);
  }
}
