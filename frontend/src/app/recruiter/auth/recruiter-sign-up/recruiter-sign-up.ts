import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth.service';
import { AlertService } from '../../../services/alert.service';

interface RegisterForm {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
  confirmPassword?: string;
  role?: string;
  companyName?: string;
  companyWebsite?: string;
}

@Component({
  selector: 'app-recruiter-sign-up',
  standalone: true,
  templateUrl: './recruiter-sign-up.html',
  styleUrls: ['./recruiter-sign-up.css'],
  imports: [FormsModule, CommonModule]
})
export class RecruiterSignUp {
  model: RegisterForm = {
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'recruiter',
    companyName: '',
    companyWebsite: ''
  };

  error: string | null = null;
  loading = false;

  constructor(private router: Router, private auth: AuthService, private alertService: AlertService) {}

  onSubmit(event: Event) {
    event.preventDefault();

    // Validate form
    const validationError = this.validateForm();
    if (validationError) {
      this.alertService.error('Validation Error', validationError);
      return;
    }

    // Clear any existing authenticated user before creating a new account
    this.auth.logout();

    const payload = {
      Username: this.model.username || `${this.model.firstName} ${this.model.lastName}`.trim(),
      Email: this.model.email,
      Password: this.model.password,
      Role: this.model.role ?? 'Recruiter',
      Status: 'Active',
      VerificationStatus: 'Unverified',
      PhoneNumber: '',
      CreatedAt: new Date(),
      UpdatedAt: new Date(),
      // Include company information for recruiter registration
      CompanyName: this.model.companyName?.trim(),
      CompanyWebsite: this.model.companyWebsite?.trim()
    };

    this.loading = true;
    this.auth.register(payload).subscribe({
      next: () => {
        this.loading = false;
        this.alertService.success('Registration Successful', 'Your account has been created successfully! Please sign in to continue.');
        // Registration succeeded. Redirect user to sign-in so they can login.
        void this.router.navigate(['/recruiter/sign-in'], {
          queryParams: {
            registered: '1',
            email: this.model.email
          }
        });
      },
      error: (err) => {
        this.loading = false;

        // Handle specific error cases
        if (err?.status === 409) {
          this.alertService.error('Email Already Exists', 'An account with this email address already exists. Please use a different email or try signing in.');
        } else if (err?.status === 400) {
          this.alertService.error('Invalid Data', 'Please check your information and try again.');
        } else if (err?.status === 0) {
          this.alertService.error('Connection Error', 'Unable to contact server. Please check your internet connection and try again.');
        } else {
          const serverErr = err?.error;
          let errorMessage = 'Registration failed. Please try again.';

          if (serverErr) {
            if (typeof serverErr === 'string') errorMessage = serverErr;
            else if (typeof serverErr.message === 'string') errorMessage = serverErr.message;
            else if (serverErr.errors && Array.isArray(serverErr.errors)) {
              errorMessage = serverErr.errors.join(', ');
            }
          } else if (err?.message) {
            errorMessage = err.message;
          }

          this.alertService.error('Registration Failed', errorMessage);
        }
      }
    });
  }

  private validateForm(): string | null {
    // Required field validation
    if (!this.model.firstName || this.model.firstName.trim() === '') {
      return 'First name is required.';
    }
    if (!this.model.lastName || this.model.lastName.trim() === '') {
      return 'Last name is required.';
    }
    if (!this.model.email || this.model.email.trim() === '') {
      return 'Email address is required.';
    }
    if (!this.model.password || this.model.password.trim() === '') {
      return 'Password is required.';
    }
    if (!this.model.confirmPassword || this.model.confirmPassword.trim() === '') {
      return 'Please confirm your password.';
    }
    if (!this.model.companyName || this.model.companyName.trim() === '') {
      return 'Company name is required.';
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.model.email)) {
      return 'Please enter a valid email address.';
    }

    // Password validation
    if (this.model.password.length < 8) {
      return 'Password must be at least 8 characters long.';
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(this.model.password)) {
      return 'Password must contain at least one uppercase letter, one lowercase letter, and one number.';
    }

    // Password confirmation validation
    if (this.model.password !== this.model.confirmPassword) {
      return 'Passwords do not match. Please make sure both password fields are identical.';
    }

    // Company name validation
    if (this.model.companyName.trim().length < 2) {
      return 'Company name must be at least 2 characters long.';
    }

    // Company website validation (optional but if provided, should be valid URL)
    if (this.model.companyWebsite && this.model.companyWebsite.trim()) {
      try {
        new URL(this.model.companyWebsite);
      } catch {
        return 'Please enter a valid website URL (e.g., https://example.com).';
      }
    }

    return null; // No validation errors
  }

  goToSignIn(event: Event) {
    event.preventDefault();
    this.router.navigate(['/recruiter/sign-in']);
  }

  goToHome(event: Event) {
    event.preventDefault();
    this.router.navigate(['/']);
  }
}
