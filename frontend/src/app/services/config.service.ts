import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  private readonly apiBaseUrl: string = environment.apiBaseUrl;

  constructor() { }

  getApiBaseUrl(): string {
    return this.apiBaseUrl;
  }

  getApiUrl(endpoint: string): string {
    return `${this.apiBaseUrl}/api/${endpoint}`;
  }

  // Specific API endpoints
  getAuthUrl(): string {
    return this.getApiUrl('Auth');
  }

  getGrievancesUrl(): string {
    return this.getApiUrl('grievances');
  }

  getIndustryLookupUrl(): string {
    return this.getApiUrl('industrylookup');
  }

  getUsersUrl(): string {
    return this.getApiUrl('Users');
  }

  getJobsUrl(): string {
    return this.getApiUrl('Jobs');
  }

  getApplicationsUrl(): string {
    return this.getApiUrl('Applications');
  }

  getCompaniesUrl(): string {
    return this.getApiUrl('Companies');
  }

  getDashboardUrl(): string {
    return this.getApiUrl('Dashboard');
  }

  getAnnouncementsUrl(): string {
    return this.getApiUrl('Announcements');
  }

  getRecruitersUrl(): string {
    return this.getApiUrl('Recruiters');
  }

  getCandidatesUrl(): string {
    return this.getApiUrl('Candidates');
  }

  getCandidateProfilesUrl(): string {
    return this.getApiUrl('CandidateProfiles');
  }

  getActivityLogsUrl(): string {
    return this.getApiUrl('ActivityLogs');
  }

  getAdminUrl(): string {
    return this.getApiUrl('Admin');
  }

  getSeedUrl(): string {
    return this.getApiUrl('Seed');
  }

  getTestDataUrl(): string {
    return this.getApiUrl('TestData');
  }
}
