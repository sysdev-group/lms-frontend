import { Component, computed, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { AuthService } from '@core/auth/auth.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    RouterOutlet, RouterLink, RouterLinkActive,
    MatIconModule, MatButtonModule, MatToolbarModule,
  ],
  template: `
    <div class="flex h-screen bg-slate-100">

      <!-- Backdrop overlay — shown on mobile when sidebar is open -->
      @if (sidebarOpen()) {
        <div class="fixed inset-0 z-40 bg-black/40 lg:hidden"
             (click)="sidebarOpen.set(false)"></div>
      }

      <!-- ── Sidebar ──────────────────────────────────────────────────── -->
      <!--
        Mobile:  fixed, off-screen by default (-translate-x-full), slides in when open.
        Desktop: relative, always visible (lg:translate-x-0 overrides any translate).
      -->
      <aside [class]="sidebarClass()">

        <!-- Logo + close button (close only visible on mobile) -->
        <div class="h-16 flex items-center px-6 border-b border-slate-200 flex-shrink-0">
          <mat-icon class="text-primary-600 mr-2">school</mat-icon>
          <span class="font-semibold text-slate-800">LMS</span>
          <button mat-icon-button class="ml-auto lg:hidden"
                  (click)="sidebarOpen.set(false)"
                  aria-label="Close menu">
            <mat-icon>close</mat-icon>
          </button>
        </div>

        <!-- Nav links -->
        <nav class="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          @for (item of navItems(); track item.path) {
            <a [routerLink]="item.path"
               routerLinkActive="bg-primary-50 text-primary-700 font-medium"
               (click)="sidebarOpen.set(false)"
               class="flex items-center gap-3 px-3 py-3 rounded-lg text-slate-600
                      hover:bg-slate-50 hover:text-slate-800 transition-colors
                      text-sm min-h-[44px]">
              <mat-icon class="text-[20px] flex-shrink-0">{{ item.icon }}</mat-icon>
              {{ item.label }}
            </a>
          }
        </nav>

        <!-- User info + logout -->
        <div class="border-t border-slate-200 p-4 flex-shrink-0">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
              <span class="text-primary-700 text-sm font-medium">
                {{ userInitials() }}
              </span>
            </div>
            <div class="min-w-0">
              <p class="text-sm font-medium text-slate-800 truncate">{{ userName() }}</p>
              <p class="text-xs text-slate-500">{{ userRole() }}</p>
            </div>
          </div>
          <button mat-stroked-button class="w-full text-sm min-h-[44px]" (click)="logout()">
            <mat-icon class="text-[18px] mr-1">logout</mat-icon>
            Sign out
          </button>
        </div>

      </aside>

      <!-- ── Main content column ────────────────────────────────────────── -->
      <div class="flex flex-col flex-1 min-w-0 overflow-hidden">

        <!-- Mobile top bar (hamburger + logo; hidden on desktop) -->
        <div class="flex items-center h-14 px-3 bg-white border-b border-slate-200
                    lg:hidden flex-shrink-0">
          <button mat-icon-button (click)="sidebarOpen.set(true)" aria-label="Open menu">
            <mat-icon>menu</mat-icon>
          </button>
          <mat-icon class="text-primary-600 ml-2 mr-1">school</mat-icon>
          <span class="font-semibold text-slate-800 text-sm">LMS</span>
        </div>

        <!-- Page content -->
        <main class="flex-1 overflow-y-auto">
          <router-outlet />
        </main>

      </div>

    </div>
  `,
})
export class ShellComponent {
  constructor(private authService: AuthService) {}

  sidebarOpen = signal(false);

  /** Full class string for the sidebar element.
   *  Computed so Tailwind sees all class names as string literals and purges correctly. */
  sidebarClass = computed(() =>
    'fixed inset-y-0 left-0 z-50 flex flex-col w-64 bg-white border-r border-slate-200 ' +
    'transition-transform duration-300 ease-in-out ' +
    'lg:relative lg:translate-x-0 lg:flex-shrink-0 ' +
    (this.sidebarOpen() ? 'translate-x-0' : '-translate-x-full')
  );

  userName    = computed(() => this.authService.currentUser()?.fullName ?? '');
  userRole    = computed(() => this.authService.currentUser()?.role ?? '');
  userInitials = computed(() => {
    const name = this.authService.currentUser()?.fullName ?? '';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  });

  navItems = computed(() => {
    const role = this.authService.userRole();
    return ALL_NAV_ITEMS.filter(item => !item.roles || item.roles.includes(role ?? ''));
  });

  logout(): void {
    this.authService.logout();
  }
}

const ALL_NAV_ITEMS = [
  { path: '/dashboard',     label: 'Dashboard',     icon: 'dashboard',      roles: null },
  { path: '/courses',       label: 'Courses',        icon: 'menu_book',      roles: null },
  { path: '/assignments',   label: 'Assignments',    icon: 'assignment',     roles: null },
  { path: '/grades',        label: 'Grades',         icon: 'grade',          roles: null },
  { path: '/timetable',     label: 'Timetable',      icon: 'calendar_month', roles: null },
  { path: '/attendance',    label: 'Attendance',     icon: 'how_to_reg',     roles: null },
  { path: '/notifications', label: 'Notifications',  icon: 'notifications',  roles: null },
  { path: '/users',         label: 'Users',          icon: 'group',          roles: ['Admin'] },
  { path: '/enrollment',    label: 'Enrollment',     icon: 'person_add',     roles: ['Admin'] },
];
