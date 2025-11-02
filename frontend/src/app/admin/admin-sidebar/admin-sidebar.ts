import { Component, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  template: `
    <div class="admin-sidebar">
      <div class="sidebar-header">
        <h2>Admin Panel</h2>
      </div>

      <nav class="sidebar-nav">
        <ul>
          <li>
            <a routerLink="/admin/dashboard" routerLinkActive="active">
              <i class="icon-dashboard"></i>
              Dashboard
            </a>
          </li>
          <li>
            <a routerLink="/admin/users" routerLinkActive="active">
              <i class="icon-users"></i>
              User Management
            </a>
          </li>
          <li>
            <a routerLink="/admin/grievances" routerLinkActive="active">
              <i class="icon-grievances"></i>
              Grievances
            </a>
          </li>
          <li>
            <a routerLink="/admin/activity-logs" routerLinkActive="active">
              <i class="icon-logs"></i>
              Activity Logs
            </a>
          </li>
        </ul>
      </nav>

      <div class="sidebar-footer">
        <button (click)="logout()" class="logout-btn">
          <i class="icon-logout"></i>
          Logout
        </button>
      </div>
    </div>
  `,
  styles: [`
    .admin-sidebar {
      width: 250px;
      background-color: #2c3e50;
      color: white;
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }

    .sidebar-header {
      padding: 20px;
      border-bottom: 1px solid #34495e;
    }

    .sidebar-header h2 {
      margin: 0;
      font-size: 1.5rem;
      color: #ecf0f1;
    }

    .sidebar-nav {
      flex: 1;
      padding: 20px 0;
    }

    .sidebar-nav ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .sidebar-nav li {
      margin-bottom: 5px;
    }

    .sidebar-nav a {
      display: flex;
      align-items: center;
      padding: 12px 20px;
      color: #bdc3c7;
      text-decoration: none;
      transition: all 0.3s ease;
    }

    .sidebar-nav a:hover {
      background-color: #34495e;
      color: #ecf0f1;
    }

    .sidebar-nav a.active {
      background-color: #3498db;
      color: white;
      border-right: 3px solid #2980b9;
    }

    .sidebar-nav .icon-dashboard:before { content: "📊"; margin-right: 10px; }
    .sidebar-nav .icon-users:before { content: "👥"; margin-right: 10px; }
    .sidebar-nav .icon-grievances:before { content: "⚠️"; margin-right: 10px; }
    .sidebar-nav .icon-logs:before { content: "📋"; margin-right: 10px; }
    .sidebar-nav .icon-logout:before { content: "🚪"; margin-right: 10px; }

    .sidebar-footer {
      padding: 20px;
      border-top: 1px solid #34495e;
    }

    .logout-btn {
      width: 100%;
      padding: 12px;
      background-color: #e74c3c;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background-color 0.3s ease;
    }

    .logout-btn:hover {
      background-color: #c0392b;
    }
  `]
})
export class AdminSidebarComponent implements OnInit {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {}

  logout() {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
