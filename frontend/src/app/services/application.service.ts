import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap, map } from 'rxjs';
import { AuthService } from './auth.service';
import { ConfigService } from './config.service';

export interface Application {
  ApplicationID: number;
  JobID: number;
  CandidateID: number;
  Status: string;
  AppliedDate: string;
  CoverLetter: string;
  ResumeUrl: string;
  InterviewStatus: string;
  Job?: {
    JobID: number;
    Title: string;
    Company?: {
      CompanyID: number;
      Name: string;
    };
    Location: string;
    SalaryRange: string;
    EmploymentType: string;
    Description: string;
    Skills: string;
    ClosingDate: string;
    PostedDate: string;
    RecruiterID: number;
  };
  Candidate?: {
    CandidateID: number;
    FullName: string;
    Email: string;
    PhoneNumber: string;
    Address: string;
    CreatedDate: string;
    UpdatedDate: string;
  };
}

export interface ApplicationUpdateRequest {
  status?: string;
  interviewStatus?: string;
  coverLetter?: string;
  resumeUrl?: string;
}

@Injectable({ providedIn: 'root' })
export class ApplicationService {
  constructor(private http: HttpClient, private authService: AuthService, private configService: ConfigService) {}

  getAll(): Observable<Application[]> {
    const applicationsUrl = this.configService.getApplicationsUrl();
    return this.http.get<Application[]>(applicationsUrl);
  }

  getByRecruiter(): Observable<Application[]> {
    const token = this.authService.getToken();
    const applicationsUrl = this.configService.getApplicationsUrl();
    return this.http.get<Application[]>(`${applicationsUrl}/by-recruiter`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : 'Bearer test-token'
      }
    }).pipe(
      map(response => {
        // Handle ASP.NET Core serialization with $values wrapper
        if (Array.isArray(response)) {
          return response;
        } else if (response && typeof response === 'object' && response['$values']) {
          return response['$values'];
        }
        return [];
      })
    );
  }

  getByCandidate(): Observable<Application[]> {
    console.log('ApplicationService: Fetching applications for candidate');
    const token = this.authService.getToken();
    console.log('Using token for request:', token);
    const applicationsUrl = this.configService.getApplicationsUrl();
    return this.http.get<Application[]>(`${applicationsUrl}/by-candidate`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : 'Bearer test-token'
      }
    }).pipe(
      tap(response => {
        console.log('Raw API response:', response);
        console.log('Response type:', typeof response);
        console.log('Is array:', Array.isArray(response));
        if (Array.isArray(response)) {
          console.log('Found array with', response.length, 'applications');
        }
      }),
      map(response => {
        // Handle ASP.NET Core serialization with $values wrapper
        if (Array.isArray(response)) {
          return response;
        } else if (response && typeof response === 'object' && response['$values']) {
          return response['$values'];
        }
        return [];
      })
    );
  }

  get(id: number) {
    const applicationsUrl = this.configService.getApplicationsUrl();
    return this.http.get<Application>(`${applicationsUrl}/${id}`);
  }

  create(payload: any) {
    const token = this.authService.getToken();
    const applicationsUrl = this.configService.getApplicationsUrl();
    return this.http.post(applicationsUrl, payload, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : 'Bearer test-token'
      }
    });
  }

  update(id: number, payload: any) {
    const token = this.authService.getToken();
    const applicationsUrl = this.configService.getApplicationsUrl();
    return this.http.put(`${applicationsUrl}/${id}`, payload, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : 'Bearer test-token'
      }
    });
  }

  delete(id: number) {
    const token = this.authService.getToken();
    const applicationsUrl = this.configService.getApplicationsUrl();
    return this.http.delete(`${applicationsUrl}/${id}`, {
      headers: {
        'Authorization': token ? `Bearer ${token}` : 'Bearer test-token'
      }
    });
  }
}
