import { Component, OnInit, OnDestroy, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DashboardService, DashboardStats, ActivityItem, JobPerformanceItem, ChartData } from '../../services/dashboard.service';
import { AuthService } from '../../services/auth.service';
import { SignalRService, DashboardUpdate } from '../../services/signalr.service';
import { Subscription } from 'rxjs';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

@Component({
  selector: 'app-recruiter-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './recruiter-dashboard.html',
  styleUrls: ['./recruiter-dashboard.css'],
})
export class RecruiterDashboardComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('recruitmentChart', { static: false }) chartCanvas!: ElementRef<HTMLCanvasElement>;
  stats: DashboardStats = {};
  activities: ActivityItem[] = [];
  topJobs: JobPerformanceItem[] = [];
  chartData: ChartData = { labels: [], applicationsData: [], interviewsData: [] };
  isLoading: boolean = true;
  private signalRSubscription: Subscription = new Subscription();
  private chart: Chart | null = null;
  private isUpdatingStats: boolean = false;

  constructor(
    private dashboardService: DashboardService,
    private authService: AuthService,
    private signalRService: SignalRService
  ) {}

  private dataLoaded = false;

  async ngOnInit() {
    // Wait for authentication to be initialized
    await this.authService.initializeAsyncAuth();

    // Subscribe to authentication state changes (only once)
    this.authService.currentUser$.subscribe(user => {
      if (user && user.token && !this.dataLoaded) {
        console.log('User authenticated, loading dashboard data');
        this.dataLoaded = true;
        this.loadDashboardData();
        this.setupSignalR();
      } else if (!user || !user.token) {
        console.log('User not authenticated, skipping dashboard data load');
        this.isLoading = false;
        this.dataLoaded = false;
      }
    });
  }

  ngOnDestroy() {
    this.signalRSubscription.unsubscribe();
    if (this.chart) {
      this.chart.destroy();
    }
  }

  ngAfterViewInit() {
    this.createChart();
  }

  private createChart() {
    if (this.chartCanvas && this.chartData.labels.length > 0) {
      const ctx = this.chartCanvas.nativeElement.getContext('2d');
      if (ctx) {
        if (this.chart) {
          // Update existing chart data instead of destroying and recreating
          this.chart.data.labels = this.chartData.labels;
          this.chart.data.datasets[0].data = this.chartData.applicationsData;
          this.chart.data.datasets[1].data = this.chartData.interviewsData;
          this.chart.update();
        } else {
          // Create new chart if it doesn't exist
          this.chart = new Chart(ctx, {
            type: 'bar',
            data: {
              labels: this.chartData.labels,
              datasets: [
                {
                  label: 'Applications',
                  data: this.chartData.applicationsData,
                  backgroundColor: 'rgba(16, 185, 129, 0.8)',
                  borderColor: 'rgba(16, 185, 129, 1)',
                  borderWidth: 1
                },
                {
                  label: 'Interviews',
                  data: this.chartData.interviewsData,
                  backgroundColor: 'rgba(59, 130, 246, 0.8)',
                  borderColor: 'rgba(59, 130, 246, 1)',
                  borderWidth: 1
                }
              ]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                y: {
                  beginAtZero: true
                }
              },
              plugins: {
                legend: {
                  display: true,
                  position: 'top'
                }
              }
            }
          });
        }
      }
    }
  }

  private loadDashboardData() {
    this.isLoading = true;

    // Load stats
    this.dashboardService.getRecruiterStats().subscribe({
      next: (stats) => {
        this.stats = stats;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading recruiter stats:', error);
        this.isLoading = false;
      }
    });

    // Load activities
    this.dashboardService.getRecruiterActivities().subscribe({
      next: (activities: ActivityItem[]) => {
        this.activities = activities;
      },
      error: (error: any) => {
        console.error('Error loading recruiter activities:', error);
      }
    });

    // Load top performing jobs
    this.dashboardService.getTopPerformingJobs().subscribe({
      next: (jobs) => {
        this.topJobs = jobs;
      },
      error: (error) => {
        console.error('Error loading top jobs:', error);
      }
    });

    // Load chart data
    this.dashboardService.getChartData().subscribe({
      next: (chartData) => {
        this.chartData = chartData;
        this.createChart();
      },
      error: (error) => {
        console.error('Error loading chart data:', error);
      }
    });
  }

  private setupSignalR() {
    // Setup SignalR asynchronously without blocking dashboard load
    this.signalRService.startConnection().then(() => {
      console.log('SignalR connection established for recruiter dashboard');

      // Subscribe to real-time dashboard updates
      this.signalRSubscription.add(
        this.signalRService.dashboardUpdates.subscribe((update: DashboardUpdate | null) => {
          if (update && update.updateType === 'stats-update') {
            console.log('Received real-time update:', update);
            // Handle specific update types
            if (update.data.type === 'recruiter-stats' || update.data.type === 'application-created' ||
                update.data.type === 'application-status-updated' || update.data.type === 'application-deleted' ||
                update.data.type === 'job-created' || update.data.type === 'job-updated' || update.data.type === 'job-deleted') {
              // Only reload specific data instead of all data to prevent flickering
              this.loadStatsOnly();
            }
          }
        })
      );
    }).catch(error => {
      console.error('Error setting up SignalR connection:', error);
    });
  }

  private loadStatsOnly() {
    // Prevent multiple simultaneous updates
    if (this.isUpdatingStats) {
      return;
    }

    this.isUpdatingStats = true;
    this.dashboardService.getRecruiterStats().subscribe({
      next: (stats) => {
        // Only update if stats actually changed to prevent unnecessary re-renders
        if (JSON.stringify(this.stats) !== JSON.stringify(stats)) {
          this.stats = stats;
        }
        this.isUpdatingStats = false;
      },
      error: (error) => {
        console.error('Error loading recruiter stats:', error);
        this.isUpdatingStats = false;
      }
    });
  }
}
