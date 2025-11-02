import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-admin-sign-in',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="admin-signin-container">
      <div class="signin-card">
        <div class="logo-section">
          <h1>Admin Portal</h1>
          <p>Job Portal Administration</p>
        </div>

        <form (ngSubmit)="onSubmit()" #signinForm="ngForm" class="signin-form">
          <div class="form-group">
            <label for="email">Email</label>
            <input
              type="email"
              id="email"
              [(ngModel)]="email"
              name="email"
              required
              email
              #emailInput="ngModel"
              class="form-control"
              placeholder="Enter admin email">
            <div class="error-message" *ngIf="emailInput.invalid && emailInput.touched">
              Please enter a valid email address
            </div>
          </div>

          <div class="form-group">
            <label for="password">Password</label>
            <input
              type="password"
              id="password"
              [(ngModel)]="password"
              name="password"
              required
              minlength="6"
              #passwordInput="ngModel"
              class="form-control"
              placeholder="Enter password">
            <div class="error-message" *ngIf="passwordInput.invalid && passwordInput.touched">
              Password must be at least 6 characters
            </div>
          </div>

          <button
            type="submit"
            [disabled]="signinForm.invalid || loading"
            class="signin-btn">
            <span *ngIf="loading">Signing In...</span>
            <span *ngIf="!loading">Sign In</span>
          </button>
        </form>

        <div class="error-message" *ngIf="error">
          {{ error }}
        </div>

        <div class="back-link">
          <a routerLink="/">← Back to Home</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .admin-signin-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
    }

    .signin-card {
      background: white;
      border-radius: 10px;
      box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
      padding: 40px;
      width: 100%;
      max-width: 400px;
    }

    .logo-section {
      text-align: center;
      margin-bottom: 30px;
    }

    .logo-section h1 {
      color: #2c3e50;
      margin: 0 0 10px 0;
      font-size: 2rem;
      font-weight: bold;
    }

    .logo-section p {
      color: #7f8c8d;
      margin: 0;
      font-size: 0.9rem;
    }

    .signin-form {
      margin-bottom: 20px;
    }

    .form-group {
      margin-bottom: 20px;
    }

    .form-group label {
      display: block;
      margin-bottom: 5px;
      color: #2c3e50;
      font-weight: 500;
    }

    .form-control {
      width: 100%;
      padding: 12px;
      border: 2px solid #ecf0f1;
      border-radius: 5px;
      font-size: 1rem;
      transition: border-color 0.3s ease;
      box-sizing: border-box;
    }

    .form-control:focus {
      outline: none;
      border-color: #3498db;
    }

    .form-control.ng-invalid.ng-touched {
      border-color: #e74c3c;
    }

    .error-message {
      color: #e74c3c;
      font-size: 0.8rem;
      margin-top: 5px;
    }

    .signin-btn {
      width: 100%;
      padding: 12px;
      background: #3498db;
      color: white;
      border: none;
      border-radius: 5px;
      font-size: 1rem;
      font-weight: 500;
      cursor: pointer;
      transition: background-color 0.3s ease;
    }

    .signin-btn:hover:not(:disabled) {
      background: #2980b9;
    }

    .signin-btn:disabled {
      background: #bdc3c7;
      cursor: not-allowed;
    }

    .back-link {
      text-align: center;
      margin-top: 20px;
    }

    .back-link a {
      color: #3498db;
      text-decoration: none;
      font-size: 0.9rem;
    }

    .back-link a:hover {
      text-decoration: underline;
    }
  `]
})
export class AdminSignInComponent {
  email: string = '';
  password: string = '';
  loading: boolean = false;
  error: string = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  async onSubmit() {
    console.log('Admin sign-in: Starting login process');
    if (!this.email || !this.password) {
      this.error = 'Please fill in all fields';
      return;
    }

    this.loading = true;
    this.error = '';

    try {
      console.log('Admin sign-in: Calling auth service login');
      const response = await this.authService.login(this.email, this.password).toPromise();
      console.log('Admin sign-in: Login response received:', response);

      if (response) {
        console.log('Admin sign-in: Response is truthy, checking user role');
        // Check if the logged-in user has admin role
        const user = this.authService.getCurrentUser();
        console.log('Admin sign-in: Current user from auth service:', user);

        if (user && user.role) {
          console.log('Admin sign-in: User role check:', {
            userRole: user.role,
            userRoleLower: user.role.toLowerCase(),
            isAdmin: user.role.toLowerCase() === 'admin'
          });

          if (user.role.toLowerCase() === 'admin') {
            console.log('Admin sign-in: Admin role confirmed, navigating to dashboard');
            this.router.navigate(['/admin/dashboard']);
          } else {
            console.log('Admin sign-in: User does not have admin role');
            this.error = 'Access denied. Admin privileges required.';
            this.authService.logout();
          }
        } else {
          console.log('Admin sign-in: No user or role found');
          this.error = 'Login failed. User data not found.';
          this.authService.logout();
        }
      } else {
        console.log('Admin sign-in: Response is falsy');
        this.error = 'Invalid admin credentials';
      }
    } catch (err) {
      console.log('Admin sign-in: Exception caught:', err);
      this.error = 'Login failed. Please try again.';
      console.error('Login error:', err);
    } finally {
      this.loading = false;
    }
  }
}
