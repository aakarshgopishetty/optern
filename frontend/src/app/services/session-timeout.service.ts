import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, timer } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class SessionTimeoutService {
  private sessionExpiredSubject = new BehaviorSubject<boolean>(false);
  public sessionExpired$ = this.sessionExpiredSubject.asObservable();

  private readonly SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds
  private timeoutTimer: any;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    this.initializeSessionTimeout();
  }

  private initializeSessionTimeout() {
    // Start the session timeout timer
    this.startTimeoutTimer();

    // Listen for user activity to reset the timer
    this.setupActivityListeners();
  }

  private startTimeoutTimer() {
    // Clear any existing timer
    if (this.timeoutTimer) {
      clearTimeout(this.timeoutTimer);
    }

    // Only start timer if user is logged in
    if (this.authService.getCurrentUser()) {
      this.timeoutTimer = setTimeout(() => {
        this.handleSessionTimeout();
      }, this.SESSION_TIMEOUT);
    }
  }

  private setupActivityListeners() {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

    const resetTimer = () => {
      if (this.authService.getCurrentUser()) {
        this.startTimeoutTimer();
      }
    };

    events.forEach(event => {
      document.addEventListener(event, resetTimer, true);
    });
  }

  private handleSessionTimeout() {
    // Clear user session
    this.authService.logout();

    // Show the timeout modal
    this.sessionExpiredSubject.next(true);

    // Clear the timer
    if (this.timeoutTimer) {
      clearTimeout(this.timeoutTimer);
    }
  }

  public triggerSessionTimeout() {
    this.handleSessionTimeout();
  }

  public acknowledgeTimeout() {
    this.sessionExpiredSubject.next(false);

    // Navigate to appropriate login page based on current route
    const currentUrl = this.router.url;
    let loginRoute = '/candidate/sign-in';

    if (currentUrl.includes('/recruiter')) {
      loginRoute = '/recruiter/sign-in';
    } else if (currentUrl.includes('/admin')) {
      loginRoute = '/admin/sign-in';
    }

    this.router.navigate([loginRoute]);
  }

  public resetSessionTimeout() {
    this.startTimeoutTimer();
  }

  public isSessionExpired(): boolean {
    return this.sessionExpiredSubject.value;
  }
}
