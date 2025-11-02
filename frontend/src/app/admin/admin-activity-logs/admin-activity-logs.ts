import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

interface ActivityLog {
  activityID: number;
  userID?: number;
  activityType: string;
  entityType: string;
  description: string;
  createdDate?: string;
  entityID?: number;
  user?: {
    userId: number;
    username: string;
    email: string;
  };
}

@Component({
  selector: 'app-admin-activity-logs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="admin-activity-logs">
      <div class="header">
        <h1>Activity Logs</h1>
        <div class="filters">
          <select [(ngModel)]="pageSize" (change)="loadLogs()">
            <option [value]="25">25 per page</option>
            <option [value]="50">50 per page</option>
            <option [value]="100">100 per page</option>
          </select>
        </div>
      </div>

      <div class="logs-container" *ngIf="!loading">
        <div class="log-entry" *ngFor="let log of logs">
          <div class="log-header">
            <span class="activity-type">{{ log.activityType }}</span>
            <span class="timestamp">{{ log.createdDate | date:'short' }}</span>
          </div>

          <div class="log-content">
            <p class="description">{{ log.description }}</p>
            <div class="log-meta">
              <span *ngIf="log.user">User: {{ log.user.username }}</span>
              <span *ngIf="log.entityType">Entity: {{ log.entityType }}</span>
              <span *ngIf="log.entityID">ID: {{ log.entityID }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="pagination" *ngIf="logs.length > 0">
        <button
          (click)="changePage(currentPage - 1)"
          [disabled]="currentPage <= 1"
          class="page-btn">
          Previous
        </button>

        <span class="page-info">Page {{ currentPage }}</span>

        <button
          (click)="changePage(currentPage + 1)"
          [disabled]="logs.length < pageSize"
          class="page-btn">
          Next
        </button>
      </div>

      <div class="loading" *ngIf="loading">
        <p>Loading activity logs...</p>
      </div>

      <div class="error" *ngIf="error">
        <p>{{ error }}</p>
        <button (click)="loadLogs()">Retry</button>
      </div>
    </div>
  `,
  styles: [`
    .admin-activity-logs {
      padding: 20px;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
    }

    .header h1 {
      color: #2c3e50;
      margin: 0;
    }

    .filters select {
      padding: 8px 12px;
      border: 1px solid #bdc3c7;
      border-radius: 4px;
      background: white;
      cursor: pointer;
    }

    .logs-container {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      max-height: 600px;
      overflow-y: auto;
    }

    .log-entry {
      padding: 15px 20px;
      border-bottom: 1px solid #ecf0f1;
    }

    .log-entry:last-child {
      border-bottom: none;
    }

    .log-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .activity-type {
      background: #3498db;
      color: white;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 0.8rem;
      font-weight: 500;
      text-transform: uppercase;
    }

    .timestamp {
      color: #7f8c8d;
      font-size: 0.9rem;
    }

    .description {
      margin: 0 0 8px 0;
      color: #34495e;
      font-weight: 500;
    }

    .log-meta {
      display: flex;
      gap: 15px;
      font-size: 0.8rem;
      color: #7f8c8d;
    }

    .pagination {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 20px;
      margin-top: 20px;
      padding: 20px;
    }

    .page-btn {
      padding: 8px 16px;
      background: #3498db;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      transition: background-color 0.3s ease;
    }

    .page-btn:hover:not(:disabled) {
      background: #2980b9;
    }

    .page-btn:disabled {
      background: #bdc3c7;
      cursor: not-allowed;
    }

    .page-info {
      color: #2c3e50;
      font-weight: 500;
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
export class AdminActivityLogsComponent implements OnInit {
  logs: ActivityLog[] = [];
  loading = false;
  error: string | null = null;
  currentPage = 1;
  pageSize = 50;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadLogs();
  }

  loadLogs() {
    this.loading = true;
    this.error = null;

    this.http.get<ActivityLog[]>(`/api/admin/activity-logs?page=${this.currentPage}&pageSize=${this.pageSize}`).subscribe({
      next: (data) => {
        this.logs = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load activity logs. Please try again.';
        this.loading = false;
        console.error('Error loading activity logs:', err);
      }
    });
  }

  changePage(page: number) {
    this.currentPage = page;
    this.loadLogs();
  }
}
