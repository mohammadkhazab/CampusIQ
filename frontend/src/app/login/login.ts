import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../core/auth.service';

/** Sign-in screen at /login: collects credentials and obtains a JWT via AuthService. */
@Component({
  selector: 'app-login',
  imports: [FormsModule],
  template: `
    <h2>Sign in</h2>
    <form (ngSubmit)="submit()">
      <p>
        <label>Username <input name="username" [(ngModel)]="username" required autocomplete="username" /></label>
      </p>
      <p>
        <label>Password <input name="password" type="password" [(ngModel)]="password" required autocomplete="current-password" /></label>
      </p>
      <button type="submit" [disabled]="busy()">Sign in</button>
      @if (error()) {
        <p role="alert">{{ error() }}</p>
      }
    </form>
  `,
})
export class Login {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  // Two-way bound to the form inputs via ngModel.
  username = '';
  password = '';
  /** True while the login request is in flight; disables the button to prevent double submits. */
  protected readonly busy = signal(false);
  /** Message shown under the form when login fails; empty when there is nothing to show. */
  protected readonly error = signal('');

  /** Attempts login; on success goes to the course list, on failure shows why. */
  submit(): void {
    this.busy.set(true);
    this.error.set('');
    this.auth.login(this.username, this.password).subscribe({
      next: () => this.router.navigate(['/courses']),
      error: (err) => {
        this.busy.set(false);
        this.error.set(err.status === 401 ? 'Wrong username or password.' : 'Could not reach the server.');
      },
    });
  }
}
