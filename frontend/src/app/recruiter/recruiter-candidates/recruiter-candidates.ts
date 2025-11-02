import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApplicationService } from '../../services/application.service';
import { ProfileService } from '../../services/profile.service';
import { SignalRService } from '../../services/signalr.service';
import { AlertService } from '../../services/alert.service';
import { Subscription } from 'rxjs';

// Interface for Candidate data structure
interface Candidate {
  id: number;
  name: string;
  role: string;
  email: string;
  avatarLetter: string;
  avatarColor: string;
  location: string;
  experience: string;
  degree?: string;
  skills: string[];
  extraSkillsCount: number;
  education: string;
  views: number;
  status: 'available' | 'employed' | 'not-looking';
  workExperience: Array<{ position: string; company: string; duration: string }>;
  lastActive?: string;
  applicationID: number;
  jobID: number;
  candidateID: number;
  appliedDate: string;
}

// Interface for Search History data structure
interface SearchHistory {
  id: number;
  title: string;
  skills: string;
  experience: string;
  location: string;
  resultsCount: number;
  timestamp: string;
}

@Component({
  selector: 'app-candidates-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './recruiter-candidates.html',
  styleUrls: ['./recruiter-candidates.css']
})
export class RecruiterCandidatesComponent implements OnInit, OnDestroy {

  // === PROPERTIES ===

  // Search query input
  searchQuery: string = '';

  // View mode: grid or list
  viewMode: 'grid' | 'list' = 'grid';

  // Modal visibility states
  showProfileModal: boolean = false;
  showFilters: boolean = false;

  // Filter properties
  statusFilter: string = '';
  experienceFilter: string = '';
  locationFilter: string = '';

  // Selected candidate for profile modal
  selectedCandidate: Candidate | null = null;

  // Candidates data - now fetched from API
  candidates: Candidate[] = [];
  filteredCandidates: Candidate[] = [];

  private applicationService = inject(ApplicationService);
  private profileService = inject(ProfileService);
  private signalRService = inject(SignalRService);
  private alertService = inject(AlertService);
  private subscription: Subscription = new Subscription();

  constructor() {
    this.loadCandidates();
  }

  ngOnInit() {
    this.setupSignalR();
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  private async setupSignalR() {
    try {
      await this.signalRService.startConnection();
      console.log('SignalR connection established for recruiter candidates');

      // Subscribe to dashboard updates
      this.subscription.add(
        this.signalRService.dashboardUpdates.subscribe(update => {
          if (update && update.data && (update.data.type === 'application-created' || update.data.type === 'application-status-updated' || update.data.type === 'application-deleted')) {
            console.log('Received application update:', update.data.type, 'refreshing candidates');
            this.refreshCandidates();
          }
        })
      );
    } catch (error) {
      console.error('Error setting up SignalR connection:', error);
    }
  }

  refreshCandidates() {
    this.loadCandidates();
  }

  private loadCandidates() {
    console.log('Loading candidates from ProfileService...');
    this.profileService.getAllCandidates().subscribe({
      next: (candidateProfiles) => {
        console.log('Received candidate profiles:', candidateProfiles);
        // Map candidate profiles to candidates
        this.candidates = (candidateProfiles || []).map((profile, index) => {
          // Generate avatar letter from name, handling edge cases
          let avatarLetter = 'U'; // Default
          if (profile.fullName && profile.fullName.trim()) {
            const nameParts = profile.fullName.trim().split(' ').filter(part => part.length > 0);
            if (nameParts.length >= 2) {
              // Take first letter of first and last name
              avatarLetter = (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
            } else if (nameParts.length === 1) {
              // Take first letter of single name
              avatarLetter = nameParts[0][0].toUpperCase();
            }
          }

          return {
            id: profile.candidateID,
            name: profile.fullName && profile.fullName.trim() ? profile.fullName : 'Unknown Candidate',
            role: `${profile.course || 'Student'} at ${profile.college || 'Unknown Institution'}`,
            email: profile.email || '',
            avatarLetter: avatarLetter,
            avatarColor: this.getConsistentColor(profile.candidateID),
            location: profile.address || 'Not specified',
            experience: profile.graduationYear ? `Expected graduation: ${profile.graduationYear}` : 'Not specified',
            degree: profile.course || 'Not specified',
            skills: [], // Could be populated from skills table if available
            extraSkillsCount: 0,
            education: `${profile.course || 'Not specified'} - ${profile.college || 'Not specified'}`,
            views: 0, // Default
            status: 'available' as const, // Default - could be derived from profile status
            workExperience: [], // Could be populated from experience table if available
            applicationID: 0, // Not applicable for all candidates view
            jobID: 0, // Not applicable for all candidates view
            candidateID: profile.candidateID,
            appliedDate: '' // Not applicable for all candidates view
          };
        });

        console.log('Mapped candidates:', this.candidates);
        // Initialize filtered candidates
        this.filteredCandidates = [...this.candidates];
        console.log('Filtered candidates count:', this.filteredCandidates.length);
      },
      error: (err) => {
        console.error('Failed to load candidates', err);
        this.candidates = [];
        this.filteredCandidates = [];
      }
    });
  }

  private getConsistentColor(candidateId: number): string {
    const colors = ['orange', 'purple', 'blue', 'green', 'red', 'teal'];
    // Use candidate ID to ensure consistent color assignment
    return colors[candidateId % colors.length];
  }
  
  // === PUBLIC METHODS ===
  
  /**
   * Get CSS class for skill tag based on skill type
   */
  getSkillTagClass(skill: string): string {
    const frontendSkills: string[] = ['React', 'TypeScript', 'Next.js', 'Vue.js', 'Angular', 'GraphQL'];
    const backendSkills: string[] = ['Node.js', 'PostgreSQL', 'Docker', 'AWS'];
    const dataScienceSkills: string[] = ['Python', 'Machine Learning', 'Pandas', 'TensorFlow', 'SQL'];
    const designSkills: string[] = ['Figma', 'Prototyping', 'User Research', 'Design Systems'];
    
    if (frontendSkills.includes(skill)) {
      return 'skill-tag green';
    }
    
    if (backendSkills.includes(skill)) {
      return 'skill-tag green';
    }
    
    if (dataScienceSkills.includes(skill)) {
      return 'skill-tag teal';
    }
    
    if (designSkills.includes(skill)) {
      return 'skill-tag green';
    }
    
    return 'skill-tag green';
  }
  
  /**
   * Set view mode (grid or list)
   */
  setViewMode(mode: 'grid' | 'list'): void {
    this.viewMode = mode;
  }

  /**
   * Toggle filters visibility
   */
  toggleFilters(): void {
    this.showFilters = !this.showFilters;
  }
  
  /**
   * Handle search action
   */
  onSearch(): void {
    console.log('Search query:', this.searchQuery);
    this.applyFilters();
  }

  /**
   * Apply search and filter logic
   */
  applyFilters(): void {
    let filtered = [...this.candidates];

    // Apply search filter
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase().trim();
      filtered = filtered.filter(candidate =>
        candidate.name.toLowerCase().includes(query) ||
        candidate.email.toLowerCase().includes(query) ||
        candidate.role.toLowerCase().includes(query) ||
        candidate.location.toLowerCase().includes(query) ||
        candidate.skills.some(skill => skill.toLowerCase().includes(query))
      );
    }

    // Apply status filter
    if (this.statusFilter) {
      filtered = filtered.filter(candidate => candidate.status === this.statusFilter);
    }

    // Apply experience filter
    if (this.experienceFilter) {
      filtered = filtered.filter(candidate => {
        // Since experience is stored as string, we'll do basic matching
        const exp = candidate.experience.toLowerCase();
        if (this.experienceFilter === 'entry') {
          return exp.includes('entry') || exp.includes('0-2') || exp.includes('junior');
        } else if (this.experienceFilter === 'mid') {
          return exp.includes('mid') || exp.includes('3-5') || exp.includes('intermediate');
        } else if (this.experienceFilter === 'senior') {
          return exp.includes('senior') || exp.includes('6+') || exp.includes('lead') || exp.includes('principal');
        }
        return true;
      });
    }

    // Apply location filter
    if (this.locationFilter.trim()) {
      const locationQuery = this.locationFilter.toLowerCase().trim();
      filtered = filtered.filter(candidate =>
        candidate.location.toLowerCase().includes(locationQuery)
      );
    }

    this.filteredCandidates = filtered;
  }

  /**
   * Clear all filters
   */
  clearFilters(): void {
    this.searchQuery = '';
    this.statusFilter = '';
    this.experienceFilter = '';
    this.locationFilter = '';
    this.filteredCandidates = [...this.candidates];
  }
  
  /**
   * Toggle bookmark for candidate
   */
  toggleBookmark(candidateId: number): void {
    const candidate = this.candidates.find(c => c.id === candidateId);
    if (candidate) {
      // Add bookmark property if it doesn't exist
      if (!candidate.hasOwnProperty('bookmarked')) {
        (candidate as any).bookmarked = false;
      }
      (candidate as any).bookmarked = !(candidate as any).bookmarked;
      console.log('Bookmark toggled for candidate ID:', candidateId, 'New state:', (candidate as any).bookmarked);
    }
  }
  
  /**
   * Open profile modal for selected candidate
   */
  viewProfile(candidateId: number): void {
    this.selectedCandidate = this.candidates.find(c => c.id === candidateId) || null;
    this.showProfileModal = true;
    document.body.style.overflow = 'hidden';
  }
  
  /**
   * Close profile modal
   */
  closeProfileModal(): void {
    this.showProfileModal = false;
    this.selectedCandidate = null;
    document.body.style.overflow = 'auto';
  }
  
  /**
   * Contact candidate - Open Outlook compose
   */
  contactCandidate(candidateId: number): void {
    const candidate = this.candidates.find(c => c.id === candidateId);
    if (candidate) {
      // Open Outlook web app in compose mode
      const outlookUrl = `https://outlook.live.com/mail/0/deeplink/compose?to=${encodeURIComponent(candidate.email)}`;
      window.open(outlookUrl, '_blank');
      this.alertService.success('Outlook Opened', `Opening Outlook to compose email to: ${candidate.email}`);
    } else {
      console.error('Candidate not found for ID:', candidateId);
      this.alertService.error('Error', 'Candidate not found');
    }
  }
  

  
  /**
   * Get human-readable status text
   */
  getStatusText(status: string): string {
    const statusMap: Record<string, string> = {
      'available': 'Available',
      'employed': 'Employed',
      'not-looking': 'Not Looking'
    };
    return statusMap[status] || status;
  }


}
