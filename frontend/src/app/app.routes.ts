import { Routes } from '@angular/router';
import { CandidateShellComponent } from './candidate/candidate-shell/candidate-shell';
import { RecruiterShellComponent } from './recruiter/recruiter-shell/recruiter-shell';
import { AdminShellComponent } from './admin/admin-shell/admin-shell';
import { roleGuard } from './guards/role.guard';

export const routes: Routes = [
  { 
    path: '', 
    loadComponent: () => import('./landing-page/landing-page').then(m => m.LandingPage) 
  },

  // Candidate Routes
  {
    path: 'candidate',
    children: [
      { 
        path: 'login',
        // Eager fallback route to ensure sign-in is always reachable
        loadComponent: () => import('./candidate/auth/candidate-sign-in/candidate-sign-in-legacy').then(m => m.CandidateSignInLegacy)
      },
      {
        path: 'sign-in', 
        loadComponent: () => import('./candidate/auth/candidate-sign-in/candidate-sign-in').then(m => m.CandidateSignIn) 
      },
      { 
        path: 'sign-up', 
        loadComponent: () => import('./candidate/auth/candidate-sign-up/candidate-sign-up').then(m => m.CandidateSignUp) 
      },
      {
        path: '',
        component: CandidateShellComponent,
        canActivate: [() => roleGuard('candidate')()],
        children: [
          { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
          {
            path: 'dashboard',
            loadComponent: () => import('./candidate/dashboard/dashboard').then(m => m.Dashboard)
          },
          {
            path: 'applications',
            loadComponent: () => import('./candidate/applications/applications').then(m => m.Applications)
          },
          {
            path: 'opportunities',
            loadComponent: () => import('./candidate/opportunities/opportunities').then(m => m.Opportunities)
          },
          {
            path: 'resume-builder',
            loadComponent: () => import('./candidate/resume-builder/resume-builder').then(m => m.ResumeBuilder)
          },
          {
            path: 'grievances',
            loadComponent: () => import('./candidate/grievances/grievances').then(m => m.Grievances)
          },
          {
            path: 'profile',
            loadComponent: () => import('./candidate/profile/profile').then(m => m.Profile)
          }
        ]
      }
    ]
  },

  // Recruiter Routes
  {
    path: 'recruiter',
    children: [
      { 
        path: 'sign-in', 
        loadComponent: () => import('./recruiter/auth/recruiter-sign-in/recruiter-sign-in').then(m => m.RecruiterSignIn) 
      },
      { 
        path: 'sign-up', 
        loadComponent: () => import('./recruiter/auth/recruiter-sign-up/recruiter-sign-up').then(m => m.RecruiterSignUp) 
      },
      {
        path: '',
        component: RecruiterShellComponent,
        canActivate: [() => roleGuard('recruiter')()],
        children: [
          { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
          { 
            path: 'dashboard', 
            loadComponent: () => import('./recruiter/recruiter-dashboard/recruiter-dashboard').then(m => m.RecruiterDashboardComponent) 
          },
          { 
            path: 'opportunities', 
            loadComponent: () => import('./recruiter/recruiter-opportunities/recruiter-opportunities').then(m => m.RecruiterOpportunitiesComponent) 
          },
          { 
            path: 'applications', 
            loadComponent: () => import('./recruiter/recruiter-applications/recruiter-applications').then(m => m.ApplicationsManagementComponent) 
          },
          { 
            path: 'candidates', 
            loadComponent: () => import('./recruiter/recruiter-candidates/recruiter-candidates').then(m => m.RecruiterCandidatesComponent) 
          },
          { 
            path: 'grievances', 
            loadComponent: () => import('./recruiter/recruiter-grievances/recruiter-grievances').then(m => m.RecruiterGrievancesComponent) 
          },
          { 
            path: 'profile', 
            loadComponent: () => import('./recruiter/recruiter-profile/recruiter-profile').then(m => m.RecruiterProfileComponent) 
          }
          
        ]
      }
    ]
  },

  // Admin Routes
  {
    path: 'admin',
    children: [
      {
        path: 'sign-in',
        loadComponent: () => import('./admin/admin-sign-in/admin-sign-in').then(m => m.AdminSignInComponent)
      },
      {
        path: '',
        component: AdminShellComponent,
        canActivate: [() => roleGuard('admin')()],
        children: [
          { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
          {
            path: 'dashboard',
            loadComponent: () => import('./admin/admin-dashboard/admin-dashboard').then(m => m.AdminDashboardComponent)
          },
          {
            path: 'users',
            loadComponent: () => import('./admin/admin-users/admin-users').then(m => m.AdminUsersComponent)
          },
          {
            path: 'grievances',
            loadComponent: () => import('./admin/admin-grievances/admin-grievances').then(m => m.AdminGrievancesComponent)
          },
          {
            path: 'activity-logs',
            loadComponent: () => import('./admin/admin-activity-logs/admin-activity-logs').then(m => m.AdminActivityLogsComponent)
          }
        ]
      }
    ]
  }
];
