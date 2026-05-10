import { Component, computed } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { AuthService } from '@core/auth/auth.service';

/**
 * Shell component — provides the persistent layout (sidebar + top bar)
 * for all authenticated pages. Inner pages render via <router-outlet>.
 *
 * TODO: Add mobile responsive sidebar toggle.
 */
@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    RouterOutlet, RouterLink, RouterLinkActive,
    MatIconModule, MatButtonModule, MatToolbarModule,
  ],
  template: `
    <div class="flex h-screen bg-slate-100">

      <!-- ── Sidebar ──────────────────────────────────────────────────── -->
      <aside class="w-64 bg-white border-r border-slate-200 flex flex-col flex-shrink-0">

        <!-- Logo -->
        <div class="h-16 flex items-center px-6 border-b border-slate-200">
          <mat-icon class="text-primary-600 mr-2">school</mat-icon>
          <span class="font-semibold text-slate-800">LMS</span>
        </div>

        <!-- Nav links -->
        <nav class="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          @for (item of navItems(); track item.path) {
            <a [routerLink]="item.path"
               routerLinkActive="bg-primary-50 text-primary-700 font-medium"
               class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors text-sm">
              <mat-icon class="text-[20px]">{{ item.icon }}</mat-icon>
              {{ item.label }}
            </a>
          }
        </nav>

        <!-- User info + logout -->
        <div class="border-t border-slate-200 p-4">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center">
              <span class="text-primary-700 text-sm font-medium">
                {{ userInitials() }}
              </span>
            </div>
            <div class="min-w-0">
              <p class="text-sm font-medium text-slate-800 truncate">{{ userName() }}</p>
              <p class="text-xs text-slate-500">{{ userRole() }}</p>
            </div>
          </div>
          <button mat-stroked-button class="w-full text-sm" (click)="logout()">
            <mat-icon class="text-[18px] mr-1">logout</mat-icon>
            Sign out
          </button>
        </div>

      </aside>

      <!-- ── Main content ─────────────────────────────────────────────── -->
      <main class="flex-1 overflow-y-auto">
        <router-outlet />
      </main>

    </div>
  `,
})
export class ShellComponent {
  constructor(private authService: AuthService) {}

  userName = computed(() => this.authService.currentUser()?.fullName ?? '');
  userRole = computed(() => this.authService.currentUser()?.role ?? '');
  userInitials = computed(() => {
    const name = this.authService.currentUser()?.fullName ?? '';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  });

  /** Navigation items filtered by role */
  navItems = computed(() => {
    const role = this.authService.userRole();
    return ALL_NAV_ITEMS.filter(item => !item.roles || item.roles.includes(role ?? ''));
  });

  logout(): void {
    this.authService.logout();
  }
}

const ALL_NAV_ITEMS = [
  { path: '/dashboard',    label: 'Dashboard',     icon: 'dashboard',         roles: null },
  { path: '/courses',      label: 'Courses',        icon: 'menu_book',         roles: null },
  { path: '/assignments',  label: 'Assignments',    icon: 'assignment',        roles: null },
  { path: '/grades',       label: 'Grades',         icon: 'grade',             roles: null },
  { path: '/timetable',    label: 'Timetable',      icon: 'calendar_month',    roles: null },
  { path: '/attendance',   label: 'Attendance',     icon: 'how_to_reg',        roles: null },
  { path: '/notifications',label: 'Notifications',  icon: 'notifications',     roles: null },
  { path: '/users',        label: 'Users',          icon: 'group',             roles: ['Admin'] },
  { path: '/enrollment',   label: 'Enrollment',     icon: 'person_add',        roles: ['Admin'] },
];
