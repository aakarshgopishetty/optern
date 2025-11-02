import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export function roleGuard(allowedRole: string) {
  return async () => {
    const router = inject(Router);
    const authService = inject(AuthService);

    // Wait for authentication to initialize
    await authService.initializeAsyncAuth();

    const user = authService.getCurrentUser();



    if (!user || !user.userId || !user.token) {
      console.log('Role guard: No valid user, redirecting to login');
      // Redirect to appropriate login page if no valid user
      const loginRoute = allowedRole === 'recruiter' ? '/recruiter/sign-in' :
                        allowedRole === 'admin' ? '/admin/sign-in' : '/candidate/sign-in';
      router.navigate([loginRoute]);
      return false;
    }

    // Map backend roles to frontend expected roles (case-insensitive)
    const roleLower = user.role?.toLowerCase();
    const mappedRole = roleLower === 'student' ? 'candidate' : roleLower;

    console.log('Role guard: Role check', {
      userRole: user.role,
      mappedRole,
      allowedRole,
      roleMatch: mappedRole === allowedRole
    });

    if (mappedRole !== allowedRole) {
      console.log('Role guard: Role mismatch, logging out');
      authService.logout(); // Force logout for wrong role
      const loginRoute = allowedRole === 'recruiter' ? '/recruiter/sign-in' :
                        allowedRole === 'admin' ? '/admin/sign-in' : '/candidate/sign-in';
      router.navigate([loginRoute]);
      return false;
    }

    console.log('Role guard: Access granted');
    return true;
  };
}
