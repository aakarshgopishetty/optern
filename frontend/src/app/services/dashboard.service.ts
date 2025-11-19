import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { ConfigService } from './config.service';

export interface DashboardStats {
  TotalOpportunities?: number;
  AppliedJobs?: number;
  ApprovedApplications?: number;
  InReviewApplications?: number;
  ActiveJobs?: number;
  TotalApplications?: number;
  HiresThisMonth?: number;
  ScheduledInterviews?: number;
}



export interface AnnouncementItem {
  id: number;
  title: string;
  subtitle: string;
  timeAgo: string;
  type: string;
  createdAt: Date;
}

export interface ActivityItem {
  id: number;
  description: string;
  timestamp: string;
  type: string;
  relatedId?: number;
  icon?: string;
  title?: string;
  timeAgo?: string;
}

export interface JobPerformanceItem {
  id: number;
  title: string;
  location: string;
  type: string;
  postedDate: string;
  applicationCount: number;
}

export interface ChartData {
  labels: string[];
  applicationsData: number[];
  interviewsData: number[];
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  constructor(private http: HttpClient, private authService: AuthService, private configService: ConfigService) {}

  private getHeaders(): HttpHeaders {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser && currentUser.token) {
      return new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentUser.token}`
      });
    }
    return new HttpHeaders({
      'Content-Type': 'application/json'
    });
  }

  // Candidate dashboard methods
  getCandidateStats(): Observable<DashboardStats> {
    const dashboardUrl = this.configService.getDashboardUrl();
    return this.http.get<DashboardStats>(`${dashboardUrl}/candidate-stats`, { headers: this.getHeaders() });
  }

  getAnnouncements(): Observable<AnnouncementItem[]> {
    const dashboardUrl = this.configService.getDashboardUrl();
    return this.http.get<AnnouncementItem[]>(`${dashboardUrl}/announcements`, { headers: this.getHeaders() });
  }

  // Recruiter dashboard methods
  getRecruiterStats(): Observable<DashboardStats> {
    const dashboardUrl = this.configService.getDashboardUrl();
    return this.http.get<DashboardStats>(`${dashboardUrl}/recruiter-stats`, { headers: this.getHeaders() });
  }

  getTopPerformingJobs(): Observable<JobPerformanceItem[]> {
    const dashboardUrl = this.configService.getDashboardUrl();
    return this.http.get<JobPerformanceItem[]>(`${dashboardUrl}/top-jobs`, { headers: this.getHeaders() });
  }

  getChartData(): Observable<ChartData> {
    const dashboardUrl = this.configService.getDashboardUrl();
    return this.http.get<ChartData>(`${dashboardUrl}/chart-data`, { headers: this.getHeaders() });
  }

  getRecruiterActivities(): Observable<ActivityItem[]> {
    const dashboardUrl = this.configService.getDashboardUrl();
    return this.http.get<ActivityItem[]>(`${dashboardUrl}/recruiter-activities`, { headers: this.getHeaders() });
  }
}
