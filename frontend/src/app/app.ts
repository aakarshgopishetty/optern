import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SessionTimeoutModalComponent } from './session-timeout-modal/session-timeout-modal';
import { AlertComponent } from './candidate/alert/alert';
// import { Sidebar } from './candidate/sidebar/sidebar';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, SessionTimeoutModalComponent, AlertComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  title = 'optern-student';
}
