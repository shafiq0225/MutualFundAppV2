import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [],
  templateUrl: './unauthorized.component.html',
  styleUrls: ['./unauthorized.component.scss']
})
export class UnauthorizedComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private authService = inject(AuthService);
  private pollInterval: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    // Poll every second for the shared cookie written by MutualFundAuth-Web.
    // Once detected, navigate to /orders automatically — no manual URL entry needed.
    this.pollInterval = setInterval(() => {
      if (this.authService.isAuthenticated()) {
        this.router.navigate(['/orders']);
      }
    }, 1000);
  }

  ngOnDestroy(): void {
    if (this.pollInterval !== null) {
      clearInterval(this.pollInterval);
    }
  }
}
