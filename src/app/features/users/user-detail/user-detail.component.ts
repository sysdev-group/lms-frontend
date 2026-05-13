import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { UserService } from '@core/services/feature-services';
import { User } from '@shared/models/models';

@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <div class="page-container">

      <!-- Back link -->
      <div class="mb-4">
        <a routerLink="/users" mat-button class="text-slate-500 hover:text-slate-700 -ml-2">
          <mat-icon>arrow_back</mat-icon>
          Back to Users
        </a>
      </div>

      @if (isLoading()) {
        <div class="lms-card flex justify-center py-16">
          <mat-spinner diameter="40" />
        </div>
      } @else if (error()) {
        <div class="lms-card text-center py-12">
          <mat-icon class="text-red-400 mb-3" style="font-size:48px;width:48px;height:48px">
            error_outline
          </mat-icon>
          <p class="text-slate-600">{{ error() }}</p>
        </div>
      } @else if (user()) {
        <div class="lms-card">
          <div class="flex items-center gap-4 mb-6">
            <div class="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <span class="text-blue-700 text-xl font-semibold">{{ initials() }}</span>
            </div>
            <div>
              <h1 class="text-xl font-semibold text-slate-800">
                {{ user()!.firstName }} {{ user()!.lastName }}
              </h1>
              <p class="text-slate-500 text-sm">{{ user()!.email }}</p>
              <span [class]="roleBadgeClass()">{{ user()!.role }}</span>
            </div>
          </div>
          <p class="text-slate-400 text-sm">Full user editing is coming soon.</p>
        </div>
      }

    </div>
  `,
})
export class UserDetailComponent implements OnInit {
  isLoading = signal(true);
  user = signal<User | null>(null);
  error = signal<string | null>(null);

  private userId: string;

  constructor(private route: ActivatedRoute, private userService: UserService) {
    this.userId = this.route.snapshot.paramMap.get('id') ?? '';
  }

  ngOnInit(): void {
    if (!this.userId) {
      this.error.set('No user ID provided.');
      this.isLoading.set(false);
      return;
    }
    try {
      this.userService.getUserById(this.userId).subscribe({
        next: user => {
          this.user.set(user);
          this.isLoading.set(false);
        },
        error: () => {
          this.isLoading.set(false);
          this.error.set('Failed to load user details. Please try again.');
        },
      });
    } catch {
      this.isLoading.set(false);
      this.error.set('Failed to load user details. Please try again.');
    }
  }

  initials(): string {
    const u = this.user();
    if (!u) return '';
    return `${u.firstName[0] ?? ''}${u.lastName[0] ?? ''}`.toUpperCase();
  }

  roleBadgeClass(): string {
    switch (this.user()?.role) {
      case 'Admin':    return 'badge badge-danger';
      case 'Lecturer': return 'badge badge-info';
      default:         return 'badge badge-neutral';
    }
  }
}
