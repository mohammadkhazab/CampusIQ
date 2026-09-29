import { Component, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';

import { AuthService } from './core/auth.service';

@Component({
  imports: [RouterOutlet],
  selector: 'app-root',
  template: `
    <header>
      <h1>CampusIQ</h1>
      @if (auth.isLoggedIn()) {
        <button (click)="logout()">Sign out</button>
      }
    </header>
    <main>
      <router-outlet />
    </main>
  `,
})
export class App {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
