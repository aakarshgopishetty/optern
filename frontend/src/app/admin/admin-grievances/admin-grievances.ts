import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

interface Grievance {
  greivanceID: number;
  submittedBy: number;
  title: string;
  description: string;
  status: string;
  createdDate: string;
  priority: string;
  submitter?: {
    userId: number;
    username: string;
    email: string;
  };
}

@Component({
  selector: 'app-admin-grievances',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="admin-grievances">
      <h1>Grievance Management</h1>

      <div class="grievances-list" *ngIf="!loading">
        <div class="grievance-card" *ngFor="let grievance of grievances">
          <div class="grievance-header">
            <h3>{{ grievance.title }}</h3>
            <span class="priority-badge" [ngClass]="grievance.priority.toLowerCase()">
              {{ grievance.priority }}
            </span>
          </div>

          <div class="grievance-meta">
            <span>By: {{ grievance.submitter?.username || 'Unknown' }}</span>
            <span>Status: {{ grievance.status }}</span>
            <span>{{ grievance.createdDate | date:'short' }}</span>
          </div>

          <p class="grievance-description">{{ grievance.description }}</p>

          <div class="grievance-actions">
            <select [(ngModel)]="grievance.status" (change)="updateStatus(grievance)">
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>
          </div>
        </div>
      </div>

      <div class="loading" *ngIf="loading">
        <p>Loading grievances...</p>
      </div>

      <div class="error" *ngIf="error">
        <p>{{ error }}</p>
        <button (click)="loadGrievances()">Retry</button>
      </div>
    </div>
  `,
  styles: [`
    .admin-grievances {
      padding: 20px;
    }

    .admin-grievances h1 {
      color: #2c3e50;
      margin-bottom: 30px;
    }

    .grievances-list {
      display: grid;
      gap: 20px;
    }

    .grievance-card {
      background: white;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    }

    .grievance-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }

    .grievance-header h3 {
      margin: 0;
      color: #2c3e50;
    }

    .priority-badge {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 0.8rem;
      font-weight: 500;
      text-transform: uppercase;
    }

    .priority-badge.high { background: #e74c3c; color: white; }
    .priority-badge.medium { background: #f39c12; color: white; }
    .priority-badge.low { background: #27ae60; color: white; }

    .grievance-meta {
      display: flex;
      gap: 15px;
      margin-bottom: 10px;
      font-size: 0.9rem;
      color: #7f8c8d;
    }

    .grievance-description {
      color: #34495e;
      margin-bottom: 15px;
      line-height: 1.5;
    }

    .grievance-actions select {
      padding: 8px 12px;
      border: 1px solid #bdc3c7;
      border-radius: 4px;
      background: white;
      cursor: pointer;
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
export class AdminGrievancesComponent implements OnInit {
  grievances: Grievance[] = [];
  loading = false;
  error: string | null = null;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadGrievances();
  }

  loadGrievances() {
    this.loading = true;
    this.error = null;

    this.http.get<Grievance[]>('/api/admin/grievances').subscribe({
      next: (data) => {
        this.grievances = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load grievances. Please try again.';
        this.loading = false;
        console.error('Error loading grievances:', err);
      }
    });
  }

  updateStatus(grievance: Grievance) {
    this.http.put(`/api/admin/grievances/${grievance.greivanceID}/status`, {
      status: grievance.status
    }).subscribe({
      next: () => {
        // Status updated successfully
      },
      error: (err) => {
        alert('Failed to update grievance status. Please try again.');
        console.error('Error updating grievance status:', err);
      }
    });
  }
}
