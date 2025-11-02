import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { CandidateProfile, CandidateProfileDto } from '../models/candidate-profile.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private apiUrl = '/api/CandidateProfiles';

  constructor(private http: HttpClient, private authService: AuthService) {}

  // Get current user's profile using their user ID
  getProfile(): Observable<CandidateProfile | null> {
    const currentUser = this.authService.getCurrentUser();
    console.log('Getting profile for current user:', currentUser);

    if (!currentUser || !currentUser.userId) {
      // No user logged in, return default profile
      console.log('No user logged in, returning default profile');
      return of(this.getDefaultProfile());
    }

    // Get profile by user ID directly from backend
    console.log('Fetching profile for user ID:', currentUser.userId);
    return this.http.get<CandidateProfileDto>(`${this.apiUrl}/by-user/${currentUser.userId}`).pipe(
      map(dto => {
        console.log('Profile DTO received:', dto);
        if (dto) {
          // Convert DTO to frontend model
          const profile = this.convertDtoToProfile(dto);
          console.log('Converted profile:', profile);
          return profile;
        }
        // No profile found for this user, return default profile structure
        console.log('No profile found for user, returning default');
        return this.getDefaultProfile();
      }),
      catchError(error => {
        console.error('Error fetching profile:', error);
        // If endpoint doesn't exist yet, fall back to old method
        if (error.status === 404) {
          console.log('New endpoint not found, trying fallback method');
          return this.getProfileFallback(currentUser.userId);
        }
        return this.handleError(error);
      })
    );
  }

  // Fallback method for getting profile (old way)
  private getProfileFallback(userId: number): Observable<CandidateProfile | null> {
    return this.http.get<CandidateProfileDto[]>(`${this.apiUrl}`).pipe(
      map(profiles => {
        if (profiles && profiles.length > 0) {
          // Find profile that matches the current user's ID
          const userProfileDto = profiles.find(profile => profile.CandidateID === userId);

          if (userProfileDto) {
            return this.convertDtoToProfile(userProfileDto);
          }
        }

        // No profile found for this user, return default profile structure
        return this.getDefaultProfile();
      }),
      catchError(this.handleError)
    );
  }

  // Get profile by ID
  getProfileById(id: number): Observable<CandidateProfile> {
    return this.http.get<CandidateProfileDto>(`${this.apiUrl}/${id}`).pipe(
      map(dto => this.convertDtoToProfile(dto)),
      catchError(this.handleError)
    );
  }

  // Create new profile
  createProfile(profile: CandidateProfile): Observable<CandidateProfile> {
    console.log('Creating profile:', profile);

    // Validate profile object
    if (!profile) {
      console.error('Create profile failed: Profile is null or undefined');
      return throwError(() => new Error('Profile data is missing'));
    }

    const currentUser = this.authService.getCurrentUser();

    if (!currentUser || !currentUser.userId) {
      console.error('Create profile failed: No user logged in');
      return throwError(() => new Error('Please log in to save your profile'));
    }

    // Convert to DTO format for backend
    const profileDto = this.convertProfileToDto(profile);

    // Ensure the profile is linked to the current user
    profileDto.CandidateID = currentUser.userId;
    profileDto.Email = currentUser.email;
    profileDto.Status = 'Active';
    profileDto.CreatedDate = new Date().toISOString();
    profileDto.UpdatedDate = new Date().toISOString();

    console.log('Profile DTO before sending to backend:', profileDto);

    console.log('Creating profile for user:', currentUser.userId, profileDto);

    return this.http.post<CandidateProfileDto>(`${this.apiUrl}`, profileDto).pipe(
      map(response => {
        console.log('Profile created successfully:', response);
        return this.convertDtoToProfile(response);
      }),
      catchError(this.handleError)
    );
  }

  // Update existing profile
  updateProfile(profile: CandidateProfile): Observable<CandidateProfile> {
    console.log('Updating profile:', profile);

    // Validate profile object
    if (!profile) {
      console.error('Update profile failed: Profile is null or undefined');
      return throwError(() => new Error('Profile data is missing'));
    }

    const currentUser = this.authService.getCurrentUser();

    if (!currentUser || !currentUser.userId || currentUser.userId == null) {
      console.error('Update profile failed: No user logged in');
      return throwError(() => new Error('Please log in to save your profile'));
    }

    // Additional validation - ensure profile has required properties
    if (typeof profile.candidateID === 'undefined' || profile.candidateID === null || profile.candidateID === 0) {
      console.error('Profile candidateID is missing, creating new profile');
      return this.createProfile(profile);
    }

    if (!profile.candidateID || profile.candidateID === 0) {
      // If no candidateID, create a new profile instead
      console.log('No candidateID, creating new profile');
      return this.createProfile(profile);
    }

    // Convert to DTO format for backend
    const profileDto = this.convertProfileToDto(profile);
    profileDto.UpdatedDate = new Date().toISOString();

    console.log('Profile DTO before updating backend:', profileDto);
    console.log('Updating existing profile with ID:', profile.candidateID);
    return this.http.put(`${this.apiUrl}/${profile.candidateID}`, profileDto, { observe: 'response' }).pipe(
      map(response => {
        console.log('Profile updated successfully:', response.status);
        // For 204 No Content, return the original profile since no data is returned
        return profile;
      }),
      catchError(this.handleError)
    );
  }

  // Delete profile
  deleteProfile(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  // Get all candidate profiles (for recruiters to browse all candidates)
  getAllCandidates(): Observable<CandidateProfile[]> {
    return this.http.get<any>(`${this.apiUrl}`).pipe(
      map(response => {
        // Handle ASP.NET Core serialization format with $values
        const dtos = response.$values || response;
        if (Array.isArray(dtos)) {
          return dtos.map(dto => this.convertDtoToProfile(dto));
        } else {
          console.error('Expected array of candidate profiles, got:', response);
          return [];
        }
      }),
      catchError(this.handleError)
    );
  }

  // Get default profile structure for new users
  private getDefaultProfile(): CandidateProfile {
    return {
      candidateID: 0,
      fullName: '',
      email: '',
      phoneNumber: '',
      linkedInProfile: '',
      address: '',
      dateOfBirth: new Date(),
      gender: '',
      status: 'Active',
      resumeURL: '',
      createdDate: new Date(),
      updatedDate: new Date(),
      graduationYear: new Date().getFullYear(),
      college: '',
      course: '',
      currentSemester: '',
      emailNotifications: true,
      jobApplicationUpdates: true,
      interviewReminders: true,
      marketingCommunications: false
    };
  }

  // Convert DTO to frontend model
  private convertDtoToProfile(dto: CandidateProfileDto): CandidateProfile {
    return {
      candidateID: dto.CandidateID,
      fullName: dto.FullName,
      email: dto.Email,
      phoneNumber: dto.PhoneNumber,
      linkedInProfile: dto.LinkedInProfile,
      address: dto.Address,
      dateOfBirth: dto.DateOfBirth ? new Date(dto.DateOfBirth) : null,
      gender: dto.Gender,
      status: dto.Status,
      resumeURL: dto.ResumeURL,
      createdDate: new Date(dto.CreatedDate),
      updatedDate: new Date(dto.UpdatedDate),
      graduationYear: dto.GraduationYear,
      college: dto.College,
      course: dto.Course,
      currentSemester: dto.CurrentSemester,
      emailNotifications: dto.EmailNotifications,
      jobApplicationUpdates: dto.JobApplicationUpdates,
      interviewReminders: dto.InterviewReminders,
      marketingCommunications: dto.MarketingCommunications
    };
  }

  // Convert frontend model to DTO
  private convertProfileToDto(profile: CandidateProfile): CandidateProfileDto {
    // Helper function to convert date to ISO string
    const toIsoString = (date: Date | string): string => {
      if (typeof date === 'string') {
        // If it's already a string, ensure it's in ISO format
        if (date.includes('T')) {
          return date; // Already ISO format
        }
        // Convert date string to ISO format
        return new Date(date).toISOString();
      }
      return date.toISOString();
    };

    return {
      CandidateID: profile.candidateID,
      FullName: profile.fullName,
      Email: profile.email,
      PhoneNumber: profile.phoneNumber,
      LinkedInProfile: profile.linkedInProfile,
      Address: profile.address,
      DateOfBirth: profile.dateOfBirth ? toIsoString(profile.dateOfBirth) : null,
      Gender: profile.gender,
      Status: profile.status,
      ResumeURL: profile.resumeURL,
      CreatedDate: toIsoString(profile.createdDate),
      UpdatedDate: toIsoString(profile.updatedDate),
      GraduationYear: profile.graduationYear,
      College: profile.college,
      Course: profile.course,
      CurrentSemester: profile.currentSemester || '',
      EmailNotifications: profile.emailNotifications ?? true,
      JobApplicationUpdates: profile.jobApplicationUpdates ?? true,
      InterviewReminders: profile.interviewReminders ?? true,
      MarketingCommunications: profile.marketingCommunications ?? false
    };
  }

  // Handle HTTP errors
  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('Profile service error:', error);

    let errorMessage = 'An unexpected error occurred';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      if (error.error && typeof error.error === 'string') {
        errorMessage = error.error;
      } else if (error.message) {
        errorMessage = error.message;
      } else {
        switch (error.status) {
          case 404:
            errorMessage = 'Profile not found';
            break;
          case 400:
            errorMessage = 'Invalid profile data';
            break;
          case 500:
            errorMessage = 'Server error. Please try again later.';
            break;
          default:
            errorMessage = `Server returned code: ${error.status}`;
        }
      }
    }

    return throwError(() => new Error(errorMessage));
  }
}
