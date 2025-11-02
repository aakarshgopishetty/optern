import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { AlertService } from '../../../services/alert.service';

interface LoginForm { email: string; password: string }

@Component({
  standalone: true,
  selector: 'app-candidate-sign-in',
  templateUrl: './candidate-sign-in.html',
  styleUrls: ['./candidate-sign-in.css'],
  imports: [FormsModule, CommonModule]
})
export class CandidateSignIn {
  model: LoginForm = { email: '', password: '' };
  error: string | null = null;

  successMessage: string | null = null;

  constructor(private router: Router, private auth: AuthService, private route: ActivatedRoute, private alertService: AlertService) {
    // check for registration redirect
    const reg = this.route.snapshot.queryParamMap.get('registered');
    const email = this.route.snapshot.queryParamMap.get('email');
    if (reg) {
      this.alertService.success('Registration Successful', 'Your account has been created successfully. Please sign in with your credentials.');
      if (email) this.model.email = email;
    }
  }

  onSubmit(event: Event) {
    event.preventDefault();
    this.error = null;
    console.log('Login form submitted with:', this.model.email, this.model.password);
    // ensure any previous user is cleared before new login attempt
    this.auth.logout();

    // Clear localStorage to ensure clean state
    try {
      localStorage.removeItem('optern_user');
      console.log('Cleared localStorage before login');
    } catch (e) {
      console.error('Failed to clear localStorage:', e);
    }

    this.auth.login(this.model.email, this.model.password).subscribe({
      next: (response) => {
        console.log('Login successful, full response:', response);

        // The AuthService should have updated the user state synchronously
        const currentUser = this.auth.getCurrentUser();
        console.log('Current user after login:', currentUser);
        console.log('Current user userId:', currentUser?.userId);
        console.log('Current user role:', currentUser?.role);

        if (currentUser && currentUser.userId > 0) {
          console.log('Login successful, navigating to dashboard');
          // Use navigateByUrl for more reliable navigation
          this.router.navigateByUrl('/candidate/dashboard');
        } else {
          console.error('Login response received but user not set properly');
          this.alertService.error('Login Failed', 'Login failed - please check your credentials and try again.');
        }
      },
      error: (err) => {
        // Network failure
        if (err?.status === 0) {
          this.alertService.error('Connection Error', 'Unable to contact server. Please check your internet connection and try again.');
          return;
        }

        // Handle specific error cases
        if (err?.status === 401) {
          this.alertService.error('Invalid Credentials', 'The email or password you entered is incorrect. Please check and try again.');
        } else if (err?.status === 429) {
          this.alertService.error('Too Many Attempts', 'Too many login attempts. Please wait a few minutes before trying again.');
        } else {
          // Try common shapes: { message: '' }, plain string, HttpErrorResponse.message
          const serverErr = err?.error;
          let errorMessage = 'Login failed. Please check your credentials and try again.';

          if (serverErr) {
            if (typeof serverErr === 'string') {
              errorMessage = this.stripHtml(serverErr);
            } else if (typeof serverErr.message === 'string') {
              errorMessage = this.stripHtml(serverErr.message);
            }
          } else if (err?.message) {
            errorMessage = this.stripHtml(err.message);
          }

          this.alertService.error('Login Failed', errorMessage);
        }
      }
    });
  }

  loginWithCredentials(email: string, password: string) {
    this.model.email = email;
    this.model.password = password;
    this.onSubmit(new Event('submit'));
  }

  navigateToSignUp() {
    this.router.navigate(['/candidate/sign-up']);
  }

  navigateToHome() {
    this.router.navigate(['/']);
  }

  private stripHtml(html: string): string {
    // Create a temporary DOM element to parse HTML
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    // Get text content and trim whitespace
    return tmp.textContent || tmp.innerText || html;
  }
}
