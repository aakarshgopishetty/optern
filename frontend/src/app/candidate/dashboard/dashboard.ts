import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DashboardService, DashboardStats, AnnouncementItem } from '../../services/dashboard.service';
import { AuthService } from '../../services/auth.service';
import { ProfileService } from '../../services/profile.service';
import { CandidateProfile } from '../../models/candidate-profile.model';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit, OnDestroy {
  stats: DashboardStats = {};
  announcements: AnnouncementItem[] = [];
  userName: string = 'User';
  isLoading: boolean = true;

  constructor(
    private dashboardService: DashboardService,
    private authService: AuthService,
    private profileService: ProfileService
  ) {}

  ngOnInit() {
    this.loadDashboardData();
    this.loadUserProfile();
  }

  ngOnDestroy() {
    // No cleanup needed
  }

  private loadDashboardData() {
    this.isLoading = true;
    let loadedCount = 0;
    const totalRequests = 2; // stats, announcements

    const checkAllLoaded = () => {
      loadedCount++;
      if (loadedCount >= totalRequests) {
        this.isLoading = false;
        console.log('All dashboard data loaded');
      }
    };

    // Load stats
    this.dashboardService.getCandidateStats().subscribe({
      next: (stats) => {
        console.log('Received stats from API:', stats);
        this.stats = stats || {};
        checkAllLoaded();
      },
      error: (error) => {
        console.error('Error loading dashboard stats:', error);
        checkAllLoaded();
      }
    });

    // Load announcements
    this.dashboardService.getAnnouncements().subscribe({
      next: (announcements) => {
        this.announcements = Array.isArray(announcements) ? announcements : [];
        checkAllLoaded();
      },
      error: (error) => {
        console.error('Error loading announcements:', error);
        this.announcements = [];
        checkAllLoaded();
      }
    });
  }

  private loadUserProfile() {
    this.profileService.getProfile().subscribe({
      next: (profile) => {
        if (profile && profile.fullName) {
          this.userName = profile.fullName;
        } else {
          // Fallback to username from auth service if no fullName in profile
          const currentUser = this.authService.getCurrentUser();
          if (currentUser && currentUser.username) {
            this.userName = currentUser.username;
          }
        }
      },
      error: (error) => {
        console.error('Error loading user profile:', error);
        // Fallback to username from auth service on error
        const currentUser = this.authService.getCurrentUser();
        if (currentUser && currentUser.username) {
          this.userName = currentUser.username;
        }
      }
    });
  }
}
