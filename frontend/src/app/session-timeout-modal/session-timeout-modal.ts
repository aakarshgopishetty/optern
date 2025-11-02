import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SessionTimeoutService } from '../services/session-timeout.service';

@Component({
  selector: 'app-session-timeout-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './session-timeout-modal.html',
  styleUrl: './session-timeout-modal.css'
})
export class SessionTimeoutModalComponent {
  private sessionTimeoutService = inject(SessionTimeoutService);

  isVisible$ = this.sessionTimeoutService.sessionExpired$;

  onAcknowledge() {
    this.sessionTimeoutService.acknowledgeTimeout();
  }
}
