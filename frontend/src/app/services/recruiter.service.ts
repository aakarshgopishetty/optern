import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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
  private baseUrl = '/api/Recruiters';
  
  constructor(private http: HttpClient) {}

  getProfile(): Observable<RecruiterProfile> {
    return this.http.get<RecruiterProfile>(`${this.baseUrl}/profile`);
  }

  updateProfile(profile: Partial<RecruiterProfile>): Observable<RecruiterProfile> {
    return this.http.put<RecruiterProfile>(`${this.baseUrl}/profile`, profile);
  }
}
