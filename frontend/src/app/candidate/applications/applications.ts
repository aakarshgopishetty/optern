import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApplicationService } from '../../services/application.service';
import { AuthService } from '../../services/auth.service';
import { SignalRService } from '../../services/signalr.service';
import { AlertService } from '../../services/alert.service';
import { Subscription } from 'rxjs';



@Component({
  selector: 'app-applications',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './applications.html',
  styleUrl: './applications.css'
})
export class Applications implements OnInit, OnDestroy {
  viewMode: 'grid' | 'list' = 'grid';
  activeFilter: string = 'All Applications';
  sortBy: string = 'AppliedDate';
  sortOrder: 'asc' | 'desc' = 'desc';

  // New properties for modal state
  isModalVisible = false;
  selectedApplication: any = null;

  allApplications: any[] = [];

  // Inject services
  private applicationService = inject(ApplicationService);
  private authService = inject(AuthService);
  private signalRService = inject(SignalRService);
  private alertService = inject(AlertService);
  private subscription: Subscription = new Subscription();

  filteredApplications = [...this.allApplications];
  filterCounts: { [key: string]: number } = {};

  constructor() {}

  ngOnInit() {
    this.loadApplications();
    this.setupSignalR();
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  private async setupSignalR() {
    try {
      await this.signalRService.startConnection();
      console.log('SignalR connection established for candidate applications');

      // Subscribe to dashboard updates
      this.subscription.add(
        this.signalRService.dashboardUpdates.subscribe(update => {
          if (update && update.data && (update.data.type === 'application-created' || update.data.type === 'application-status-updated' || update.data.type === 'application-deleted')) {
            console.log('Received application update:', update.data.type, 'refreshing applications');
            this.loadApplications();
          }
        })
      );
    } catch (error) {
      console.error('Error setting up SignalR connection:', error);
    }
  }

  trackByApplicationId(index: number, app: any): any {
    return app.ApplicationID;
  }

  private loadApplications() {
    // Load real applications from the API
    this.applicationService.getByCandidate().subscribe({
      next: (data) => {
        console.log('Raw API response in loadApplications:', data);

        // Data is now handled in the service, so it should be a clean array
        let applications: any[] = [];
        if (data && Array.isArray(data)) {
          applications = data;
          console.log('Applications array:', applications.length);
        } else {
          console.log('Unexpected data format:', typeof data, data);
        }

        console.log('Applications array before processing:', applications);

        if (applications.length > 0) {
          this.allApplications = applications.map(app => {
            // Clean the application object to remove $id, $ref, $values properties
            const cleanedApp = this.cleanObject(app);
            return {
              ...cleanedApp,
              Status: cleanedApp.Status || 'Applied', // Ensure Status has a default value
              interviewDate: this.extractInterviewDate(cleanedApp.InterviewStatus)
            };
          });
          console.log(`Loaded ${this.allApplications.length} real applications after cleaning`);
          console.log('First application sample:', this.allApplications[0]);
        } else {
          this.allApplications = [];
          console.log('No applications found');
        }
        this.filteredApplications = [...this.allApplications];
        this.calculateFilterCounts();
      },
      error: (err) => {
        console.error('Could not load applications from API:', err);
        this.allApplications = [];
        this.filteredApplications = [];
        this.filterCounts = {
          'All Applications': 0,
          'Applied': 0,
          'Interview Scheduled': 0,
          'Shortlisted': 0,
          'Rejected': 0
        };
      }
    });
  }

  private cleanObject(obj: any): any {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.cleanObject(item));
    }

    const cleaned: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key) && !key.startsWith('$')) {
        cleaned[key] = this.cleanObject(obj[key]);
      }
    }
    return cleaned;
  }



  private extractInterviewDate(interviewStatus: string): string | null {
    if (!interviewStatus) return null;
    const match = interviewStatus.match(/Interview scheduled for (.+)/);
    return match ? match[1] : null;
  }

  calculateFilterCounts() {
    this.filterCounts = {
      'All Applications': this.allApplications.length,
      'Applied': this.allApplications.filter(app => app.Status === 'Applied').length,
      'Interview Scheduled': this.allApplications.filter(app => app.Status === 'Interview Scheduled').length,
      'Shortlisted': this.allApplications.filter(app => app.Status === 'Shortlisted').length,
      'Rejected': this.allApplications.filter(app => app.Status === 'Rejected').length
    };
  }

  setView(mode: 'grid' | 'list') { this.viewMode = mode; }

  setFilter(filter: string) {
    this.activeFilter = filter;
    let filtered = (filter === 'All Applications')
      ? [...this.allApplications]
      : this.allApplications.filter(app => app.Status === filter);
    this.filteredApplications = this.sortApplications(filtered);
  }

  setSort(sortBy: string) {
    if (this.sortBy === sortBy) {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = sortBy;
      this.sortOrder = 'desc';
    }
    this.filteredApplications = this.sortApplications(this.filteredApplications);
  }

  private sortApplications(apps: any[]): any[] {
    return apps.sort((a, b) => {
      let aVal, bVal;
      switch (this.sortBy) {
        case 'AppliedDate':
          aVal = new Date(a.AppliedDate);
          bVal = new Date(b.AppliedDate);
          break;
        case 'Status':
          aVal = a.Status;
          bVal = b.Status;
          break;
        case 'JobTitle':
          aVal = a.Job?.Title || '';
          bVal = b.Job?.Title || '';
          break;
        default:
          return 0;
      }
      if (aVal < bVal) return this.sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return this.sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }

  // New methods to open and close the modal
  openModal(application: any) {
    this.selectedApplication = application;
    this.isModalVisible = true;
  }

  closeModal() {
    this.isModalVisible = false;
    // Delay clearing to allow for fade-out animation
    setTimeout(() => this.selectedApplication = null, 300);
  }

  downloadResume(app: any): void {
    if (app.ResumeUrl) {
      window.open(app.ResumeUrl, '_blank');
      this.showAlert('success', 'Resume Downloaded', 'Resume download initiated successfully.');
    } else {
      this.showAlert('warning', 'Resume Unavailable', 'Resume not available for download.');
    }
  }

  async withdrawApplication(app: any): Promise<void> {
    const confirmed = await this.showConfirmDialog(
      'Withdraw Application',
      `Are you sure you want to withdraw your application for "${app.Job?.Title}"? This action cannot be undone.`
    );

    if (confirmed) {
      this.applicationService.delete(app.ApplicationID).subscribe({
        next: () => {
          this.showAlert('success', 'Application Withdrawn', 'Your application has been withdrawn successfully.');
          this.loadApplications(); // Reload the applications list
          this.closeModal(); // Close the modal
        },
        error: (err) => {
          console.error('Error withdrawing application:', err);
          this.showAlert('error', 'Withdrawal Failed', 'Failed to withdraw application. Please try again.');
        }
      });
    }
  }

  getCompanyInitials(companyName: string | undefined): string {
    if (!companyName || typeof companyName !== 'string') {
      return 'CO';
    }
    return companyName.slice(0, 2).toUpperCase();
  }

  // View job posting details
  viewJobPosting(job: any) {
    // Create a detailed modal for the job posting
    const jobDetailsHtml = `
      <div style="max-width: 600px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <div style="background: white; border-radius: 12px; padding: 24px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <div style="display: flex; align-items: center; margin-bottom: 20px;">
            <img src="assets/user-profile.jpg" alt="${job.Company?.Name} logo" style="width: 60px; height: 60px; border-radius: 8px; margin-right: 16px; border: 1px solid #e5e7eb;">
            <div>
              <h2 style="margin: 0; font-size: 24px; font-weight: 600; color: #111827;">${job.Title}</h2>
              <p style="margin: 4px 0 0 0; font-size: 16px; color: #6b7280;">${job.Company?.Name}</p>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 20px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <i class="bi bi-geo-alt" style="color: #6b7280;"></i>
              <span>${job.Location}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <i class="bi bi-briefcase" style="color: #6b7280;"></i>
              <span>${job.EmploymentType}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <i class="bi bi-cash-stack" style="color: #6b7280;"></i>
              <span>${job.SalaryRange}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <i class="bi bi-calendar" style="color: #6b7280;"></i>
              <span>Posted ${new Date(job.PostedDate).toLocaleDateString()}</span>
            </div>
          </div>

          ${job.RemoteAllowed ? '<div style="background: #e0f2fe; color: #0ea5e9; padding: 8px 12px; border-radius: 6px; display: inline-block; margin-bottom: 20px;">Remote Work Available</div>' : ''}

          <div style="margin-bottom: 20px;">
            <h3 style="font-size: 18px; font-weight: 600; color: #111827; margin-bottom: 12px;">Job Description</h3>
            <p style="color: #374151; line-height: 1.6;">${job.Description}</p>
          </div>

          <div style="margin-bottom: 20px;">
            <h3 style="font-size: 18px; font-weight: 600; color: #111827; margin-bottom: 12px;">Required Skills</h3>
            <div style="display: flex; flex-wrap: wrap; gap: 8px;">
              ${job.Skills ? job.Skills.split(',').map((skill: string) => `<span style="background: #eef2ff; color: #4f46e5; padding: 6px 12px; border-radius: 6px; font-size: 14px;">${skill.trim()}</span>`).join('') : ''}
            </div>
          </div>

          <div style="display: flex; align-items: center; justify-content: space-between; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <i class="bi bi-star-fill" style="color: #f59e0b;"></i>
              <span style="color: #6b7280;">Job Posting</span>
            </div>
            <div style="display: flex; gap: 8px;">
              <button onclick="this.closest('.modal-overlay').remove()" style="background: #fff; border: 1px solid #d1d5db; color: #6b7280; padding: 8px 16px; border-radius: 6px; cursor: pointer;">Close</button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Create modal overlay
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'modal-overlay';
    modalOverlay.style.cssText = `
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
      padding: 20px;
    `;

    modalOverlay.innerHTML = jobDetailsHtml;

    // Close modal when clicking outside
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) {
        modalOverlay.remove();
      }
    });

    document.body.appendChild(modalOverlay);
  }

  // DOM-based Alert Method
  showAlert(type: 'success' | 'error' | 'warning' | 'info', title: string, message: string): void {
    console.log('Showing candidate alert:', type, title, message);

    // Create DOM-based alert
    const alertDiv = document.createElement('div');
    alertDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#3b82f6'};
      color: white;
      padding: 16px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      z-index: 10000;
      max-width: 400px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      animation: slideInRight 0.3s ease-out;
    `;

    alertDiv.innerHTML = `
      <div style="display: flex; align-items: flex-start; gap: 12px;">
        <i class="bi ${type === 'success' ? 'bi-check-circle-fill' : type === 'error' ? 'bi-exclamation-triangle-fill' : 'bi-info-circle-fill'}" style="font-size: 20px; flex-shrink: 0; margin-top: 2px;"></i>
        <div style="flex: 1;">
          <div style="font-weight: 600; margin-bottom: 4px;">${title}</div>
          <div style="line-height: 1.4;">${message}</div>
        </div>
        <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; color: white; cursor: pointer; padding: 4px; opacity: 0.8;">
          <i class="bi bi-x" style="font-size: 16px;"></i>
        </button>
      </div>
    `;

    // Add slide-in animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);

    document.body.appendChild(alertDiv);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (alertDiv.parentElement) {
        alertDiv.remove();
      }
    }, 5000);
  }

  // DOM-based Confirm Dialog
  showConfirmDialog(title: string, message: string): Promise<boolean> {
    return new Promise((resolve) => {
      const modal = document.createElement('div');
      modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10001;
        backdrop-filter: blur(4px);
      `;

      const modalContent = document.createElement('div');
      modalContent.style.cssText = `
        background: white;
        padding: 24px;
        border-radius: 12px;
        box-shadow: 0 20px 40px rgba(0,0,0,0.3);
        max-width: 400px;
        width: 90%;
        text-align: center;
      `;

      modalContent.innerHTML = `
        <h3 style="margin: 0 0 16px 0; color: #1e293b; font-size: 18px; font-weight: 600;">${title}</h3>
        <p style="margin: 0 0 20px 0; color: #64748b; font-size: 14px; line-height: 1.5;">${message}</p>

        <div style="display: flex; gap: 12px; justify-content: flex-end;">
          <button id="cancel-btn" style="
            padding: 10px 20px;
            border: 1px solid #d1d5db;
            background: white;
            color: #6b7280;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
          ">Cancel</button>
          <button id="confirm-btn" style="
            padding: 10px 20px;
            border: none;
            background: #ef4444;
            color: white;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
          ">Confirm</button>
        </div>
      `;

      modal.appendChild(modalContent);
      document.body.appendChild(modal);

      document.getElementById('cancel-btn')?.addEventListener('click', () => {
        document.body.removeChild(modal);
        resolve(false);
      });

      document.getElementById('confirm-btn')?.addEventListener('click', () => {
        document.body.removeChild(modal);
        resolve(true);
      });

      // Close modal when clicking outside
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          document.body.removeChild(modal);
          resolve(false);
        }
      });
    });
  }
}
