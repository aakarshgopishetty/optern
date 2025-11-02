import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

interface DashboardStats {
  totalUsers: number;
  totalCandidates: number;
  totalRecruiters: number;
  totalAdmins: number;
  totalJobs: number;
  totalApplications: number;
  totalCompanies: number;
  totalGrievances: number;
  pendingApplications: number;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="admin-dashboard">
      <h1>Admin Dashboard</h1>

      <div class="stats-grid" *ngIf="stats">
        <div class="stat-card">
          <div class="stat-icon">👥</div>
          <div class="stat-content">
            <h3>{{ stats.totalUsers }}</h3>
            <p>Total Users</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">🎓</div>
          <div class="stat-content">
            <h3>{{ stats.totalCandidates }}</h3>
            <p>Candidates</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">🏢</div>
          <div class="stat-content">
            <h3>{{ stats.totalRecruiters }}</h3>
            <p>Recruiters</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">⚙️</div>
          <div class="stat-content">
            <h3>{{ stats.totalAdmins }}</h3>
            <p>Admins</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">💼</div>
          <div class="stat-content">
            <h3>{{ stats.totalJobs }}</h3>
            <p>Total Jobs</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">📄</div>
          <div class="stat-content">
            <h3>{{ stats.totalApplications }}</h3>
            <p>Applications</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">🏭</div>
          <div class="stat-content">
            <h3>{{ stats.totalCompanies }}</h3>
            <p>Companies</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">⚠️</div>
          <div class="stat-content">
            <h3>{{ stats.totalGrievances }}</h3>
            <p>Grievances</p>
          </div>
        </div>

        <div class="stat-card highlight">
          <div class="stat-icon">⏳</div>
          <div class="stat-content">
            <h3>{{ stats.pendingApplications }}</h3>
            <p>Pending Applications</p>
          </div>
        </div>
      </div>

      <div class="loading" *ngIf="loading">
        <p>Loading dashboard statistics...</p>
      </div>

      <div class="error" *ngIf="error">
        <p>{{ error }}</p>
        <button (click)="loadStats()">Retry</button>
      </div>
    </div>
  `,
  styles: [`
    .admin-dashboard {
      padding: 20px;
    }

    .admin-dashboard h1 {
      color: #2c3e50;
      margin-bottom: 30px;
      font-size: 2rem;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }

    .stat-card {
      background: white;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      display: flex;
      align-items: center;
      transition: transform 0.3s ease;
    }

    .stat-card:hover {
      transform: translateY(-5px);
    }

    .stat-card.highlight {
      border-left: 4px solid #f39c12;
      background: linear-gradient(135deg, #fff3cd 0%, #ffffff 100%);
    }

    .stat-icon {
      font-size: 2rem;
      margin-right: 15px;
      opacity: 0.8;
    }

    .stat-content h3 {
      margin: 0 0 5px 0;
      font-size: 2rem;
      font-weight: bold;
      color: #2c3e50;
    }

    .stat-content p {
      margin: 0;
      color: #7f8c8d;
      font-size: 0.9rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .loading, .error {
      text-align: center;
      padding: 40px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    }

    .loading p {
      color: #7f8c8d;
      font-size: 1.1rem;
    }

    .error p {
      color: #e74c3c;
      margin-bottom: 15px;
    }

    .error button {
      background: #3498db;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 4px;
      cursor: pointer;
      transition: background-color 0.3s ease;
    }

    .error button:hover {
      background: #2980b9;
    }
  `]
})
export class AdminDashboardComponent implements OnInit {
  stats: DashboardStats | null = null;
  loading = false;
  error: string | null = null;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadStats();
  }

  loadStats() {
    this.loading = true;
    this.error = null;

    this.http.get<DashboardStats>('/api/admin/dashboard-stats').subscribe({
      next: (data) => {
        this.stats = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load dashboard statistics. Please try again.';
        this.loading = false;
        console.error('Error loading stats:', err);
      }
    });
  }
}
