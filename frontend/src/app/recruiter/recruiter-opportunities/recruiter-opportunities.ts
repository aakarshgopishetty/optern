import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { JobService, Job as UiJob } from '../../services/job.service';
import { FormsModule } from '@angular/forms';
import { AlertService } from '../../services/alert.service';

interface Job {
  id: number;
  title: string;
  icon: string;
  status: 'active' | 'closed' | 'draft';
  location: string;
  workMode: string;
  salary: string;
  tags: { label: string; color: string }[];
  applicants: number;
  posted: string;
  description?: string;
  requirements?: string[];
}

@Component({
  selector: 'app-recruiter-opportunities',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './recruiter-opportunities.html',
  styleUrls: ['./recruiter-opportunities.css'],
})
export class RecruiterOpportunitiesComponent {
  viewMode: 'grid' | 'list' = 'grid';
  showDetailModal = false;
  showPostJobModal = false;
  showEditJobModal = false;
  filterActiveTab: string = 'All Jobs';
  isLoading = true;
  errorMessage: string | null = null;
  isInitialLoad = true;

  selectedJob?: UiJob | null = null;

  // Search and filter properties
  searchQuery: string = '';
  selectedType: string = 'All Types';


  jobs: UiJob[] = [];
  private jobService = inject(JobService);
  private cdr = inject(ChangeDetectorRef);
  private alertService = inject(AlertService);

  // Simple model for posting a job
  newJob: {
    title?: string;
    company?: string;
    location?: string;
    description?: string;
    skills?: string[];
    salary?: string;
    type?: string;
    workMode?: string;
    requirements?: string;
    closingDate?: string;
  } = { title: '', company: '', location: '', description: '', skills: [], salary: '', type: 'Full-time' };

  // Model for editing a job
  editJob: {
    jobID?: number;
    title?: string;
    company?: string;
    location?: string;
    description?: string;
    skills?: string[];
    salary?: string;
    type?: string;
    workMode?: string;
    requirements?: string;
    closingDate?: string;
  } = { title: '', company: '', location: '', description: '', skills: [], salary: '', type: 'Full-time' };

  constructor() {
    console.log('Initializing RecruiterOpportunities component');

    // Subscribe to the reactive recruiter jobs stream first
    this.jobService.recruiterJobs$.subscribe({
      next: (data) => {
        console.log('Received updated recruiter jobs in component:', data);
        console.log('Number of jobs received:', data?.length || 0);
        this.jobs = data || [];
        // Only set loading to false if this is not the initial load
        if (!this.isInitialLoad) {
          this.isLoading = false;
        }
        this.errorMessage = null; // Clear any previous error
        this.cdr.detectChanges(); // Force change detection
      },
      error: (err) => {
        console.error('Error in recruiter jobs subscription:', err);
        console.warn('Failed to load recruiter jobs:', err);
        // Do NOT set jobs to empty array on error - keep current jobs to prevent flicker
        this.isLoading = false; // Set loading to false even on error
        this.errorMessage = this.getErrorMessage(err);
        this.cdr.detectChanges(); // Force change detection
      }
    });

    // Load jobs from database on component initialization
    this.loadJobsFromDatabase();
  }

  loadJobsFromDatabase() {
    console.log('Loading jobs from database on component init');
    this.isLoading = true;
    this.isInitialLoad = true;

    this.jobService.loadRecruiterJobs().subscribe({
      next: (jobs) => {
        console.log('Successfully loaded jobs from database:', jobs);
        this.jobs = jobs || [];
        this.isLoading = false;
        this.isInitialLoad = false;
        this.errorMessage = null;
      },
      error: (err) => {
        console.error('Failed to load jobs from database:', err);
        // Do NOT clear jobs on auth errors to prevent vanishing - keep current jobs
        if (err?.status === 401 || err?.status === 403) {
          console.warn('Authentication error - keeping current jobs to prevent vanishing');
          this.errorMessage = this.getErrorMessage(err);
        } else {
          // For other errors, clear jobs and show error
          this.jobs = [];
          this.errorMessage = this.getErrorMessage(err);
        }
        this.isLoading = false;
        this.isInitialLoad = false;
      }
    });
  }



  // Simple counts
  get allJobsCount() { return this.jobs.length; }
  get activeJobsCount() { return this.jobs.filter(j => (j.status ?? 'active') === 'active').length; }
  get closedJobsCount() { return this.jobs.filter(j => (j.status ?? '') === 'closed').length; }
  get draftJobsCount() { return this.jobs.filter(j => (j.status ?? '') === 'draft').length; }

  // Filtered jobs based on search, type, and status filter
  get filteredJobs() {
    let filtered = this.jobs;

    // Apply status filter first
    if (this.filterActiveTab !== 'All Jobs') {
      const statusMap: { [key: string]: string } = {
        'Active': 'active',
        'Closed': 'closed',
        'Draft': 'draft'
      };
      const targetStatus = statusMap[this.filterActiveTab];
      if (targetStatus) {
        filtered = filtered.filter(job => (job.status ?? 'active') === targetStatus);
      }
    }

    // Apply search filter
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase().trim();
      filtered = filtered.filter(job =>
        job.title?.toLowerCase().includes(query) ||
        job.location?.toLowerCase().includes(query) ||
        job.company?.toLowerCase().includes(query) ||
        job.description?.toLowerCase().includes(query) ||
        job.skills?.some(skill => skill.toLowerCase().includes(query))
      );
    }

    // Apply type filter
    if (this.selectedType !== 'All Types') {
      filtered = filtered.filter(job => job.type === this.selectedType);
    }

    return filtered;
  }

  openDetailModal(job: UiJob) {
    this.selectedJob = job;
    this.showDetailModal = true;
  }

  closeDetailModal() {
    this.showDetailModal = false;
    this.selectedJob = undefined;
  }

  openPostJobModal() {
    this.showPostJobModal = true;
  }

  closePostJobModal() {
    this.showPostJobModal = false;
  }

  openEditJobModal(job: UiJob) {
    this.selectedJob = job;
    // Populate edit form with job data, ensuring all required fields have values
    this.editJob = {
      jobID: job.jobID,
      title: job.title || 'Untitled',
      company: job.company || '',
      location: job.location || 'Location not specified',
      description: job.description || 'Description not provided',
      skills: job.skills || [],
      salary: job.salary || 'Salary not specified',
      type: job.type || 'Full-time',
      workMode: job.workMode || 'Onsite',
      requirements: job.requirements?.join(', ') || '',
      closingDate: '' // Will need to be handled separately if we have closing date
    };
    this.showEditJobModal = true;
  }

  closeEditJobModal() {
    this.showEditJobModal = false;
    this.selectedJob = undefined;
  }

  editJobSubmit() {
    if (!this.editJob.title || !this.editJob.location || !this.editJob.description || !this.editJob.salary) {
      this.alertService.error('Validation Error', 'Please fill in all required fields');
      return;
    }

    if (!this.editJob.jobID) {
      this.alertService.error('System Error', 'Job ID is missing');
      return;
    }

    // Convert requirements string to array if provided
    const requirementsArray = this.editJob.requirements ?
      this.editJob.requirements.split(',').map((req: string) => req.trim()).filter((req: string) => req.length > 0) : [];

    const payload: any = {
      Title: this.editJob.title,
      Location: this.editJob.location,
      Description: this.editJob.description,
      Skills: requirementsArray.join(','),
      SalaryRange: this.editJob.salary,
      EmploymentType: this.editJob.type || 'Full-time',
      RemoteAllowed: this.editJob.workMode === 'Remote' ? true : false
    };

    console.log('Updating job with payload:', payload);
    console.log('Form data being sent:', this.editJob);

    // Set loading state for editing
    this.isLoading = true;

    this.jobService.update(this.editJob.jobID, payload).subscribe({
      next: (updated) => {
        console.log('Job updated successfully:', updated);

        // The service should handle updating the BehaviorSubject
        // Close modal and reset form
        this.closeEditJobModal();

        // Reset edit form
        this.editJob = { title: '', company: '', location: '', description: '', skills: [], salary: '', type: 'Full-time' };

        // Reset loading state
        this.isLoading = false;

        this.alertService.success('Success', 'Job updated successfully!');
      },
      error: (err) => {
        console.error('Error updating job:', err);
        console.error('Error response:', err.error);
        const errorMessage = err?.error?.message || err?.message || 'Unknown error occurred';
        this.alertService.error('Update Failed', 'Failed to update job: ' + errorMessage);
        this.isLoading = false; // Reset loading state on error
      }
    });
  }





  postJob() {
    if (!this.newJob.title || !this.newJob.location || !this.newJob.description || !this.newJob.salary) {
      this.alertService.error('Validation Error', 'Please fill in all required fields');
      return;
    }

    // Convert requirements string to array if provided
    const requirementsArray = this.newJob.requirements ?
      this.newJob.requirements.split(',').map((req: string) => req.trim()).filter((req: string) => req.length > 0) : [];

    const payload: any = {
      Title: this.newJob.title,
      Location: this.newJob.location,
      Description: this.newJob.description,
      Skills: requirementsArray.join(','),
      SalaryRange: this.newJob.salary,
      EmploymentType: this.newJob.type || 'Full-time',
      RemoteAllowed: this.newJob.workMode === 'Remote' ? true : false
    };

    console.log('Creating job with payload:', payload);
    console.log('Form data being sent:', this.newJob);

    // Set loading state for posting
    this.isLoading = true;

    this.jobService.create(payload).subscribe({
      next: (created) => {
        console.log('Job created successfully:', created);
        console.log('Raw response from server:', created);

        // Job is already added to the list by the service, no need to manually add
        // The service now immediately updates the BehaviorSubject to prevent flicker

        // Reset form
        this.newJob = { title: '', company: '', location: '', description: '', skills: [], salary: '', type: 'Full-time' };
        this.closePostJobModal();

        // Reset loading state
        this.isLoading = false;

        this.alertService.success('Success', 'Job posted successfully!');
      },
      error: (err) => {
        console.error('Error creating job:', err);
        console.error('Error response:', err.error);
        const errorMessage = err?.error?.message || err?.message || 'Unknown error occurred';
        this.alertService.error('Posting Failed', 'Failed to post job: ' + errorMessage);
        this.isLoading = false; // Reset loading state on error
      }
    });
  }

  setFilter(tab: string) {
    this.filterActiveTab = tab;
  }

  async deleteJob(job: UiJob) {
    if (!job.jobID) {
      this.alertService.error('System Error', 'Job ID is missing');
      return;
    }

    const confirmed = await this.alertService.confirm(
      'Delete Job',
      'Are you sure you want to delete this job? This action cannot be undone.',
      { type: 'danger', confirmText: 'Delete', cancelText: 'Cancel' }
    );

    if (!confirmed) {
      return;
    }

    console.log('Deleting job with ID:', job.jobID);
    this.isLoading = true;

    this.jobService.delete(job.jobID).subscribe({
      next: () => {
        console.log('Job deleted successfully');
        // The service should handle updating the BehaviorSubject
        this.isLoading = false;
        this.alertService.success('Success', 'Job deleted successfully!');
      },
      error: (err) => {
        console.error('Error deleting job:', err);
        console.error('Error response:', err.error);
        const errorMessage = err?.error?.message || err?.message || 'Unknown error occurred';
        this.alertService.error('Deletion Failed', 'Failed to delete job: ' + errorMessage);
        this.isLoading = false;
      }
    });
  }

  private getErrorMessage(err: any): string {
    console.log('Parsing error for user display:', err);

    if (err?.status === 403) {
      return 'Access denied. You may not have permission to view jobs.';
    } else if (err?.status === 404) {
      return 'Recruiter profile not found. Please contact support.';
    } else if (err?.status >= 500) {
      return 'Server error. Please try again later.';
    } else if (err?.error?.message) {
      return err.error.message;
    } else if (err?.message) {
      return err.message;
    } else {
      return 'Failed to load job opportunities. This might be due to a network issue.';
    }
  }
}
