import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

interface User {
  userId: number;
  username: string;
  email: string;
  role: string;
  status: string;
  phoneNumber?: string;
  createdAt: string;
  updatedAt: string;
  verificationStatus: string;
  failedLoginAttempts: number;
  isLocked: boolean;
}

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="admin-users">
      <div class="header">
        <h1>User Management</h1>
        <button class="add-user-btn" (click)="showAddUser = true">Add New User</button>
      </div>

      <div class="users-table-container" *ngIf="!loading">
        <table class="users-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Username</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let user of users">
              <td>{{ user.userId }}</td>
              <td>{{ user.username }}</td>
              <td>{{ user.email }}</td>
              <td>
                <span class="role-badge" [ngClass]="user.role.toLowerCase()">
                  {{ user.role }}
                </span>
              </td>
              <td>
                <span class="status-badge" [ngClass]="user.status.toLowerCase()">
                  {{ user.status }}
                </span>
              </td>
              <td>{{ user.createdAt | date:'short' }}</td>
              <td>
                <button class="action-btn edit-btn" (click)="editUser(user)">Edit</button>
                <button class="action-btn delete-btn" (click)="deleteUser(user)">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="loading" *ngIf="loading">
        <p>Loading users...</p>
      </div>

      <div class="error" *ngIf="error">
        <p>{{ error }}</p>
        <button (click)="loadUsers()">Retry</button>
      </div>

      <!-- Add/Edit User Modal would go here -->
      <div class="modal" *ngIf="showAddUser" (click)="showAddUser = false">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <h2>Add New User</h2>
          <p>Feature coming soon...</p>
          <button (click)="showAddUser = false">Close</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .admin-users {
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

    .add-user-btn {
      background: #3498db;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 4px;
      cursor: pointer;
      transition: background-color 0.3s ease;
    }

    .add-user-btn:hover {
      background: #2980b9;
    }

    .users-table-container {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      overflow-x: auto;
    }

    .users-table {
      width: 100%;
      border-collapse: collapse;
    }

    .users-table th,
    .users-table td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #ecf0f1;
    }

    .users-table th {
      background-color: #f8f9fa;
      font-weight: 600;
      color: #2c3e50;
    }

    .role-badge {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 0.8rem;
      font-weight: 500;
      text-transform: uppercase;
    }

    .role-badge.admin { background: #e74c3c; color: white; }
    .role-badge.recruiter { background: #f39c12; color: white; }
    .role-badge.candidate,
    .role-badge.student { background: #27ae60; color: white; }

    .status-badge {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 0.8rem;
      font-weight: 500;
    }

    .status-badge.active { background: #27ae60; color: white; }
    .status-badge.inactive { background: #95a5a6; color: white; }
    .status-badge.pending { background: #f39c12; color: white; }

    .action-btn {
      padding: 6px 12px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.8rem;
      margin-right: 5px;
      transition: background-color 0.3s ease;
    }

    .edit-btn {
      background: #3498db;
      color: white;
    }

    .edit-btn:hover {
      background: #2980b9;
    }

    .delete-btn {
      background: #e74c3c;
      color: white;
    }

    .delete-btn:hover {
      background: #c0392b;
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

    .modal {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal-content {
      background: white;
      padding: 20px;
      border-radius: 8px;
      max-width: 500px;
      width: 90%;
    }

    .modal-content h2 {
      margin-top: 0;
      color: #2c3e50;
    }

    .modal-content button {
      background: #3498db;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 4px;
      cursor: pointer;
      margin-top: 10px;
    }
  `]
})
export class AdminUsersComponent implements OnInit {
  users: User[] = [];
  loading = false;
  error: string | null = null;
  showAddUser = false;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.loading = true;
    this.error = null;

    this.http.get<User[]>('/api/admin/users').subscribe({
      next: (data) => {
        this.users = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load users. Please try again.';
        this.loading = false;
        console.error('Error loading users:', err);
      }
    });
  }

  editUser(user: User) {
    // TODO: Implement edit user functionality
    alert('Edit user functionality coming soon!');
  }

  deleteUser(user: User) {
    if (confirm(`Are you sure you want to delete user ${user.username}?`)) {
      this.http.delete(`/api/admin/users/${user.userId}`).subscribe({
        next: () => {
          this.users = this.users.filter(u => u.userId !== user.userId);
        },
        error: (err) => {
          alert('Failed to delete user. Please try again.');
          console.error('Error deleting user:', err);
        }
      });
    }
  }
}
