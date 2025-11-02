import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { JobService, Job } from '../../services/job.service';
import { ApplicationService } from '../../services/application.service';
import { AuthService } from '../../services/auth.service';
import { AlertService } from '../../services/alert.service';

@Component({
  selector: 'app-opportunities',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule],
  // Updated file paths
  templateUrl: './opportunities.html',
  styleUrls: ['./opportunities.css']
})
// Updated class name
export class Opportunities {
  // Default view is 'list'
  viewMode: 'grid' | 'list' = 'list';

  // Method to switch views
  setView(mode: 'grid' | 'list') {
    this.viewMode = mode;
  }

  // Jobs loaded from backend with auto-refresh
  jobs: Job[] = [];

  // Filtered jobs for display
  filteredJobs: Job[] = [];

  // Search and filter properties
  searchTerm: string = '';
  selectedCategory: string = 'All Categories';
  showCategoriesDropdown: boolean = false;
  showFiltersPanel: boolean = false;

  // Filter options
  filters = {
    location: '',
    jobType: '',
    remoteOnly: false,
    salaryMin: '',
    salaryMax: ''
  };

  // Available categories based on job types
  categories: string[] = ['All Categories', 'Full-time', 'Part-time', 'Contract', 'Internship', 'Microinternship', 'Freelance'];

  // Track applied job IDs to show visual feedback
  appliedJobIds: Set<number> = new Set();

  // Track jobs currently being applied to
  applyingJobIds: Set<number> = new Set();

  private jobService = inject(JobService);
  private applicationService = inject(ApplicationService);
  private authService = inject(AuthService);
  private alertService = inject(AlertService);

  constructor() {
    console.log('Initializing Opportunities component');
    // Subscribe to the reactive jobs stream
    this.jobService.jobs$.subscribe({
      next: (data) => {
        console.log('Received updated jobs in component:', data);
        console.log('Number of jobs received:', data?.length || 0);
        this.jobs = data || [];
        this.updateFilteredJobs();
      },
      error: (err) => {
        console.error('Error in jobs subscription:', err);
        console.warn('Could not load jobs from API:', err);
      }
    });

    // Initial load
    this.loadJobs();

    // Load applied jobs from applications
    this.loadAppliedJobs();
  }

  loadJobs() {
    console.log('Loading jobs in Opportunities component');
    // This will trigger a refresh and update all subscribers
    this.jobService.getAll().subscribe({
      next: () => {
        console.log('Successfully triggered jobs refresh');
      },
      error: (err) => {
        console.error('Error triggering jobs refresh:', err);
        console.warn('Could not load jobs from API:', err);
      }
    });
  }

  refreshJobs() {
    this.loadJobs();
  }

  loadAppliedJobs() {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      console.log('No current user, skipping applied jobs load');
      return;
    }

    this.applicationService.getByCandidate().subscribe({
      next: (applications) => {
        console.log('Loaded applications for applied jobs tracking:', applications);
        // Extract job IDs from applications
        this.appliedJobIds.clear();
        applications.forEach(app => {
          this.appliedJobIds.add(app.JobID);
        });
        console.log('Applied job IDs:', Array.from(this.appliedJobIds));
      },
      error: (err) => {
        console.warn('Could not load applications for applied jobs tracking:', err);
      }
    });
  }

  // Check if job has been applied to
  hasApplied(job: Job): boolean {
    return this.appliedJobIds.has(job.jobID);
  }

  // Check if job is currently being applied to
  isApplying(job: Job): boolean {
    return this.applyingJobIds.has(job.jobID);
  }

  // Get button text based on application status
  getButtonText(job: Job): string {
    if (this.hasApplied(job)) return 'Applied ✓';
    if (this.isApplying(job)) return 'Applying...';
    return 'Apply Now';
  }

  // Get button class based on application status
  getButtonClass(job: Job): string {
    if (this.hasApplied(job)) return 'applied-btn';
    if (this.isApplying(job)) return 'applying-btn';
    return 'apply-now-btn';
  }

  // Search and filter methods
  onSearchChange(event: any) {
    this.searchTerm = event.target.value.toLowerCase();
    this.updateFilteredJobs();
  }

  toggleCategoriesDropdown() {
    this.showCategoriesDropdown = !this.showCategoriesDropdown;
  }

  selectCategory(category: string) {
    this.selectedCategory = category;
    this.showCategoriesDropdown = false;
    this.updateFilteredJobs();
  }

  toggleFiltersPanel() {
    this.showFiltersPanel = !this.showFiltersPanel;
  }

  applyFilters() {
    this.updateFilteredJobs();
    this.showFiltersPanel = false;
  }

  clearFilters() {
    this.searchTerm = '';
    this.selectedCategory = 'All Categories';
    this.filters = {
      location: '',
      jobType: '',
      remoteOnly: false,
      salaryMin: '',
      salaryMax: ''
    };
    this.updateFilteredJobs();
    this.showFiltersPanel = false;
  }

  private updateFilteredJobs() {
    let filtered = [...this.jobs];

    // Apply search filter
    if (this.searchTerm) {
      filtered = filtered.filter(job =>
        job.title.toLowerCase().includes(this.searchTerm) ||
        job.company.toLowerCase().includes(this.searchTerm) ||
        job.description.toLowerCase().includes(this.searchTerm) ||
        job.skills.some(skill => skill.toLowerCase().includes(this.searchTerm)) ||
        job.location.toLowerCase().includes(this.searchTerm)
      );
    }

    // Apply category filter
    if (this.selectedCategory !== 'All Categories') {
      filtered = filtered.filter(job => job.type === this.selectedCategory);
    }

    // Apply additional filters
    if (this.filters.location) {
      filtered = filtered.filter(job =>
        job.location.toLowerCase().includes(this.filters.location.toLowerCase())
      );
    }

    if (this.filters.jobType) {
      filtered = filtered.filter(job => job.type === this.filters.jobType);
    }

    if (this.filters.remoteOnly) {
      filtered = filtered.filter(job => job.remote);
    }

    if (this.filters.salaryMin) {
      filtered = filtered.filter(job => {
        const salary = parseFloat(job.salary.replace(/[^0-9.-]/g, ''));
        return !isNaN(salary) && salary >= parseFloat(this.filters.salaryMin);
      });
    }

    if (this.filters.salaryMax) {
      filtered = filtered.filter(job => {
        const salary = parseFloat(job.salary.replace(/[^0-9.-]/g, ''));
        return !isNaN(salary) && salary <= parseFloat(this.filters.salaryMax);
      });
    }

    this.filteredJobs = filtered;
  }

  // View job details method
  viewJobDetails(job: Job) {
    // Create a detailed modal or navigate to a detailed view
    const hasApplied = this.hasApplied(job);
    const isApplying = this.isApplying(job);
    const buttonText = this.getButtonText(job);
    const buttonClass = this.getButtonClass(job);

    const detailsHtml = `
      <div style="max-width: 600px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <div style="background: white; border-radius: 12px; padding: 24px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <div style="display: flex; align-items: center; margin-bottom: 20px;">
            <img src="${job.logo}" alt="${job.company} logo" style="width: 60px; height: 60px; border-radius: 8px; margin-right: 16px; border: 1px solid #e5e7eb;">
            <div>
              <h2 style="margin: 0; font-size: 24px; font-weight: 600; color: #111827;">${job.title}</h2>
              <p style="margin: 4px 0 0 0; font-size: 16px; color: #6b7280;">${job.company}</p>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 20px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <i class="bi bi-geo-alt" style="color: #6b7280;"></i>
              <span>${job.location}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <i class="bi bi-briefcase" style="color: #6b7280;"></i>
              <span>${job.type}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <i class="bi bi-cash-stack" style="color: #6b7280;"></i>
              <span>${job.salary}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <i class="bi bi-people" style="color: #6b7280;"></i>
              <span>${job.applicants} applicants</span>
            </div>
          </div>

          ${job.remote ? '<div style="background: #e0f2fe; color: #0ea5e9; padding: 8px 12px; border-radius: 6px; display: inline-block; margin-bottom: 20px;">Remote Work Available</div>' : ''}

          <div style="margin-bottom: 20px;">
            <h3 style="font-size: 18px; font-weight: 600; color: #111827; margin-bottom: 12px;">Job Description</h3>
            <p style="color: #374151; line-height: 1.6;">${job.description}</p>
          </div>

          <div style="margin-bottom: 20px;">
            <h3 style="font-size: 18px; font-weight: 600; color: #111827; margin-bottom: 12px;">Required Skills</h3>
            <div style="display: flex; flex-wrap: wrap; gap: 8px;">
              ${job.skills.map(skill => `<span style="background: #eef2ff; color: #4f46e5; padding: 6px 12px; border-radius: 6px; font-size: 14px;">${skill}</span>`).join('')}
            </div>
          </div>

          <div style="display: flex; align-items: center; justify-content: space-between; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <i class="bi bi-star-fill" style="color: #f59e0b;"></i>
              <span style="color: #6b7280;">${job.rating} • Posted ${job.posted}</span>
            </div>
            <div style="display: flex; gap: 8px;">
              <button onclick="this.closest('.modal-overlay').remove()" style="background: #fff; border: 1px solid #d1d5db; color: #6b7280; padding: 8px 16px; border-radius: 6px; cursor: pointer;">Close</button>
              <button id="apply-btn-${job.jobID}" onclick="window.applyJobFromModal(${job.jobID})" class="${buttonClass}" style="padding: 8px 16px; border-radius: 6px; cursor: pointer; border: none; ${hasApplied ? 'background-color: #28a745; color: white; cursor: not-allowed;' : isApplying ? 'background-color: #ffc107; color: black;' : 'background-color: #4f46e5; color: white;'}">${buttonText}</button>
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

    modalOverlay.innerHTML = detailsHtml;

    // Close modal when clicking outside
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) {
        modalOverlay.remove();
      }
    });

    // Add global function for modal apply button (bind to component instance)
    (window as any).applyJobFromModal = ((jobId: number) => {
      const jobToApply = this.jobs.find(j => j.jobID === jobId);
      if (jobToApply) {
        this.apply(jobToApply);
        // Update button in modal
        const applyBtn = document.getElementById(`apply-btn-${jobId}`);
        if (applyBtn) {
          applyBtn.textContent = 'Applied ✓';
          applyBtn.style.backgroundColor = '#28a745';
          applyBtn.style.cursor = 'not-allowed';
          (applyBtn as HTMLButtonElement).disabled = true;
        }
      }
    }).bind(this);

    document.body.appendChild(modalOverlay);
  }

  async apply(job: Job) {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      this.alertService.warning('Authentication Required', 'Please sign in before applying for jobs.');
      return;
    }

    const token = this.authService.getToken();
    if (!token) {
      this.alertService.error('Authentication Error', 'Authentication token missing. Please sign in again.');
      return;
    }

    // Prevent multiple applications for the same job
    if (this.hasApplied(job) || this.isApplying(job)) {
      return;
    }

    // Show confirmation dialog
    const confirmed = await this.alertService.confirm(
      'Confirm Job Application',
      `Are you sure you want to apply for "${job.title}" at ${job.company}? You can withdraw your application later if needed.`,
      {
        confirmText: 'Apply Now',
        cancelText: 'Cancel',
        type: 'info'
      }
    );

    if (!confirmed) {
      return;
    }

    // Add to applying set for immediate UI feedback
    this.applyingJobIds.add(job.jobID);

    console.log('Applying for job:', job.title, 'with ID:', job.jobID);

    const payload = {
      JobID: job.jobID,
      Status: 'Applied',
      AppliedDate: new Date(),
      CoverLetter: '',
      ResumeUrl: ''
    };

    console.log('Application payload:', payload);

    this.applicationService.create(payload).subscribe({
      next: (response: any) => {
        console.log('Application response:', response);
        if (response && response.success) {
          // Show success message
          this.alertService.success(
            'Application Submitted',
            `Your application for ${job.title} at ${job.company} has been submitted successfully. You will be notified about the status of your application.`
          );

          // Remove from applying set and add to applied set
          this.applyingJobIds.delete(job.jobID);
          this.appliedJobIds.add(job.jobID);

          // Disable the apply button for this job
          const applyButton = document.querySelector(`[data-job-id="${job.jobID}"]`) as HTMLButtonElement;
          if (applyButton) {
            applyButton.textContent = 'Applied ✓';
            applyButton.disabled = true;
            applyButton.style.backgroundColor = '#28a745';
            applyButton.style.cursor = 'not-allowed';
          }

          // Refresh applications list to update UI
          this.loadAppliedJobs();

          // Optionally refresh jobs to update applicant count
          this.refreshJobs();
        } else {
          // Remove from applying set on unexpected response
          this.applyingJobIds.delete(job.jobID);
          this.alertService.warning('Application Status', 'Application submitted but response was unexpected. Please check your applications list.');
        }
      },
      error: (err) => {
        // Remove from applying set on error
        this.applyingJobIds.delete(job.jobID);

        console.error('Application error:', err);
        let errorMessage = 'Application failed';

        if (err?.error?.message) {
          errorMessage += ': ' + err.error.message;
        } else if (err?.message) {
          errorMessage += ': ' + err.message;
        } else if (err?.status) {
          errorMessage += ` (Error ${err.status})`;
        }

        this.alertService.error('Application Error', errorMessage);
      }
    });
  }

  getCompanyInitials(companyName: string): string {
    if (!companyName || typeof companyName !== 'string') {
      return 'CO';
    }
    return companyName.slice(0, 2).toUpperCase();
  }
}
