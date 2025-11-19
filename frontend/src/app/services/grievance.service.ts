import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ConfigService } from './config.service';

export interface Grievance {
  greivanceID?: number;
  submittedBy: number;
  title: string;
  description: string;
  status: string;
  createdDate: string;
  priority: string;
  submitter?: any;
  attachmentFileName?: string;
  attachmentFilePath?: string;
  attachmentFileSize?: number;
  supportResponse?: string;
  category?: string;
}

// Extended interface for frontend use with computed properties
export interface GrievanceDisplay extends Grievance {
  id: number;
  category?: string;
  submittedDate: string;
  updatedDate: string;
  attachments?: Array<{ name: string; size: string }>;
  responses?: Array<{ text: string; type: 'support' | 'user' }>;
  supportResponse?: string;
}

export interface CreateGrievanceRequest {
  submittedBy: number;
  title: string;
  description: string;
  priority: string;
  status?: string;
  createdDate?: string;
}

@Injectable({
  providedIn: 'root'
})
export class GrievanceService {
  constructor(private http: HttpClient, private configService: ConfigService) { }

  // Get all grievances
  getAllGrievances(): Observable<Grievance[]> {
    const grievancesUrl = this.configService.getGrievancesUrl();
    return this.http.get<any>(grievancesUrl)
      .pipe(
        map(response => response.values || response),
        catchError(this.handleError)
      );
  }

  // Get grievance by ID
  getGrievanceById(id: number): Observable<Grievance> {
    const grievancesUrl = this.configService.getGrievancesUrl();
    return this.http.get<Grievance>(`${grievancesUrl}/${id}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Create new grievance
  createGrievance(grievance: CreateGrievanceRequest): Observable<Grievance> {
    console.log('Creating grievance:', grievance);
    const newGrievance = {
      ...grievance,
      status: grievance.status || 'Submitted',
      createdDate: grievance.createdDate || new Date().toISOString()
    };

    const grievancesUrl = this.configService.getGrievancesUrl();
    return this.http.post<Grievance>(grievancesUrl, newGrievance, {
      timeout: 30000 // 30 second timeout
    })
      .pipe(
        map(response => {
          console.log('Grievance created successfully:', response);
          return response;
        }),
        catchError(this.handleError)
      );
  }

  // Upload file
  uploadFile(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);

    const grievancesUrl = this.configService.getGrievancesUrl();
    return this.http.post(`${grievancesUrl}/upload`, formData)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Create grievance with file attachment
  createGrievanceWithAttachment(formData: FormData): Observable<Grievance> {
    console.log('Creating grievance with attachment...');
    const grievancesUrl = this.configService.getGrievancesUrl();
    return this.http.post<Grievance>(`${grievancesUrl}/create-with-attachment`, formData, {
      timeout: 60000, // 60 second timeout for file uploads
      reportProgress: true
    })
      .pipe(
        map(response => {
          console.log('Grievance with attachment created successfully:', response);
          return response;
        }),
        catchError(this.handleError)
      );
  }

  // Update grievance
  updateGrievance(id: number, grievance: Partial<Grievance>): Observable<void> {
    const grievancesUrl = this.configService.getGrievancesUrl();
    return this.http.put<void>(`${grievancesUrl}/${id}`, grievance)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Delete grievance
  deleteGrievance(id: number): Observable<void> {
    const grievancesUrl = this.configService.getGrievancesUrl();
    return this.http.delete<void>(`${grievancesUrl}/${id}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Get grievances by user ID
  getGrievancesByUser(userId: number): Observable<Grievance[]> {
    console.log('Fetching grievances for user:', userId);
    const grievancesUrl = this.configService.getGrievancesUrl();
    return this.http.get<Grievance[]>(grievancesUrl)
      .pipe(
        map(grievances => {
          console.log('All grievances:', grievances);
          const userGrievances = grievances.filter(g => g.submittedBy === userId);
          console.log('Filtered grievances for user:', userGrievances);
          return userGrievances;
        }),
        catchError(() => of([]))
      );
  }

  // Helper method to handle errors
  private handleError(error: HttpErrorResponse) {
    console.error('Grievance API Error:', error);

    let errorMessage = 'An error occurred while processing your request.';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      if (error.error && error.error.message) {
        errorMessage = error.error.message;
      } else if (error.status === 0) {
        errorMessage = 'Unable to connect to the server. Please check your connection.';
      } else if (error.status === 404) {
        errorMessage = 'The requested resource was not found.';
      } else if (error.status === 500) {
        errorMessage = 'Internal server error. Please try again later.';
      }
    }

    return throwError(() => new Error(errorMessage));
  }
}
