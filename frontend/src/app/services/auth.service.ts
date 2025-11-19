import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, throwError, map, catchError } from 'rxjs';
import { ConfigService } from './config.service';

export interface User {
  userId: number;
  role: string;
  username: string;
  email: string;
  phoneNumber?: string;
  token?: string;
  createdAt?: Date;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();
  private initialized = false;

  constructor(private http: HttpClient, private configService: ConfigService) {
    // Initialize authentication synchronously first
    this.initializeAuth();
  }

  private initializeAuth() {
    // hydrate from localStorage if available
    const raw = localStorage.getItem('optern_user');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        // Parse createdAt back to Date object if it exists
        if (parsed.createdAt) {
          parsed.createdAt = new Date(parsed.createdAt);
        }
        this.currentUserSubject.next(parsed);
        this.initialized = true;
      } catch (error) {
        localStorage.removeItem('optern_user');
        this.initialized = true;
      }
    } else {
      this.currentUserSubject.next(null);
      this.initialized = true;
    }
  }

  // Method to initialize authentication asynchronously
  async initializeAsyncAuth(): Promise<void> {
    // Ensure initialization is complete
    if (!this.initialized) {
      this.initializeAuth();
    }
    // No artificial delay needed - initialization is synchronous
  }

  login(email: string, password: string) {
    // Backend expects PascalCase property names
    const payload = { Email: email, Password: password };
    const loginUrl = `${this.configService.getAuthUrl()}/login`;
    return this.http.post<any>(loginUrl, payload, {
      headers: {
        'Content-Type': 'application/json'
      }
    }).pipe(
      tap((response) => {
        console.log('Login response received:', response);
        console.log('Response type:', typeof response);
        console.log('Response keys:', Object.keys(response || {}));
      }),
      map((response) => {
        console.log('Processing response:', response);

        // TEMPORARILY DISABLE VALIDATION TO DEBUG
        console.log('Response validation disabled for debugging');

        // Handle different response structures
        let serverUser;
        if (response.user) {
          serverUser = response.user;
        } else if (response.data && response.data.user) {
          serverUser = response.data.user;
        } else {
          serverUser = response;
        }

        console.log('Server user:', serverUser);

        if (!serverUser) {
          throw new Error('No user data in response');
        }

        // Backend returns PascalCase (UserId, Role, Username, Email, CreatedAt)
        // Map to our frontend User interface with better fallback handling
        const user: User = {
          userId: serverUser.UserId || serverUser.userId || 0,
          role: serverUser.Role || serverUser.role || '',
          username: serverUser.Username || serverUser.username || serverUser.Email || serverUser.email || '',
          email: serverUser.Email || serverUser.email || '',
          phoneNumber: serverUser.PhoneNumber || serverUser.phoneNumber || '',
          createdAt: serverUser.CreatedAt ? new Date(serverUser.CreatedAt) : undefined,
          token: response.token
        };

        console.log('Mapped user:', user);

        if (user.userId > 0) {
          this.currentUserSubject.next(user);
          // Store user data including token for authentication
          const userData = {
            userId: user.userId,
            role: user.role,
            username: user.username,
            email: user.email,
            phoneNumber: user.phoneNumber,
            createdAt: user.createdAt,
            token: user.token
          };
          try {
            localStorage.setItem('optern_user', JSON.stringify(userData));
          } catch (e) {
            console.error('Failed to save user to localStorage:', e);
          }
        } else {
          throw new Error('Invalid user data');
        }

        return response;
      }),
      catchError((error) => {
        console.error('Login error:', error);
        console.error('Error response:', error.error);
        console.error('Error status:', error.status);
        return throwError(() => error);
      })
    );
  }

  register(payload: any) {
    const registerUrl = this.configService.getUsersUrl();
    return this.http.post(registerUrl, payload);
  }

  logout() {
    this.currentUserSubject.next(null);
    try { localStorage.removeItem('optern_user'); } catch {}
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  getToken(): string | null {
    const user = this.getCurrentUser();
    return user?.token || null;
  }

  changePassword(currentPassword: string, newPassword: string) {
    const currentUser = this.getCurrentUser();
    if (!currentUser || !currentUser.userId || !currentUser.token) {
      return throwError(() => new Error('Please log in to change your password'));
    }

    const payload = {
      CurrentPassword: currentPassword,
      NewPassword: newPassword
    };
    const changePasswordUrl = `${this.configService.getAuthUrl()}/change-password`;
    return this.http.post(changePasswordUrl, payload, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentUser.token}`
      }
    });
  }

  updateCurrentUser(updatedUser: User) {
    this.currentUserSubject.next(updatedUser);
    try {
      const userData = {
        userId: updatedUser.userId,
        role: updatedUser.role,
        username: updatedUser.username,
        email: updatedUser.email,
        phoneNumber: updatedUser.phoneNumber,
        createdAt: updatedUser.createdAt,
        token: updatedUser.token
      };
      localStorage.setItem('optern_user', JSON.stringify(userData));
    } catch (e) {
      console.error('Failed to save updated user to localStorage:', e);
    }
  }

  getActiveSessions() {
    const currentUser = this.getCurrentUser();
    if (!currentUser || !currentUser.token) {
      return throwError(() => new Error('Please log in to view active sessions'));
    }

    const activeSessionsUrl = `${this.configService.getAuthUrl()}/active-sessions`;
    return this.http.get(activeSessionsUrl, {
      headers: {
        'Authorization': `Bearer ${currentUser.token}`
      }
    });
  }

  revokeSession(sessionId: string) {
    const currentUser = this.getCurrentUser();
    if (!currentUser || !currentUser.token) {
      return throwError(() => new Error('Please log in to revoke sessions'));
    }

    const revokeSessionUrl = `${this.configService.getAuthUrl()}/revoke-session/${sessionId}`;
    return this.http.post(revokeSessionUrl, {}, {
      headers: {
        'Authorization': `Bearer ${currentUser.token}`
      }
    });
  }

  revokeAllSessions() {
    const currentUser = this.getCurrentUser();
    if (!currentUser || !currentUser.token) {
      return throwError(() => new Error('Please log in to revoke sessions'));
    }

    const revokeAllSessionsUrl = `${this.configService.getAuthUrl()}/revoke-all-sessions`;
    return this.http.post(revokeAllSessionsUrl, {}, {
      headers: {
        'Authorization': `Bearer ${currentUser.token}`
      }
    });
  }
}
