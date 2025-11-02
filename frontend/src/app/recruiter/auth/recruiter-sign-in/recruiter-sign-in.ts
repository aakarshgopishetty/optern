import { Component } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth.service';
import { AlertService } from '../../../services/alert.service';

interface LoginForm { email: string; password: string }

@Component({
  selector: 'app-recruiter-sign-in',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './recruiter-sign-in.html',
  styleUrls: ['./recruiter-sign-in.css']
})
export class RecruiterSignIn {
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
    this.auth.logout();
    this.auth.login(this.model.email, this.model.password).subscribe({
      next: () => this.router.navigate(['/recruiter/dashboard']),
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
    this.router.navigate(['/recruiter/sign-up']);
  }

  navigateToHome() {
    this.router.navigate(['/']);
  }

  goToSignUp(event: Event) {
    event.preventDefault();
    this.router.navigate(['/recruiter/sign-up']);
  }

  goToHome(event: Event) {
    event.preventDefault();
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
