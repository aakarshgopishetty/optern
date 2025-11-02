import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { RecruiterSidebarComponent } from '../recruiter-sidebar/recruiter-sidebar';
import { AlertComponent } from '../../candidate/alert/alert';
import { ConfirmationDialogComponent } from '../../candidate/alert/confirmation-dialog';

@Component({
  selector: 'app-recruiter-shell',
  standalone: true,
  imports: [
    RouterOutlet,
    RecruiterSidebarComponent,
    AlertComponent,
    ConfirmationDialogComponent
  ],
  templateUrl: './recruiter-shell.html',
  styleUrl: './recruiter-shell.css'
})
export class RecruiterShellComponent {}
