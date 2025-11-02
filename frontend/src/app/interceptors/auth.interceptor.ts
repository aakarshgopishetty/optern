import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { SessionTimeoutService } from '../services/session-timeout.service';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const sessionTimeoutService = inject(SessionTimeoutService);

  // Get token from localStorage
  const raw = localStorage.getItem('optern_user');

  if (raw) {
    try {
      const user = JSON.parse(raw);
      if (user && user.token) {
        // Clone the request and add auth header
        const authReq = req.clone({
          headers: req.headers.set('Authorization', `Bearer ${user.token}`)
        });

        // Intercept responses to detect 401 errors
        return next(authReq).pipe(
          catchError((error) => {
            if (error.status === 401) {
              // Trigger session timeout for 401 responses
              sessionTimeoutService.triggerSessionTimeout();
            }
            return throwError(() => error);
          })
        );
      }
    } catch (error) {
      // Clear invalid data
      localStorage.removeItem('optern_user');
    }
  }

  // For requests without auth, still check for 401 responses
  return next(req).pipe(
    catchError((error) => {
      if (error.status === 401) {
        // Trigger session timeout for 401 responses
        sessionTimeoutService.triggerSessionTimeout();
      }
      return throwError(() => error);
    })
  );
};
