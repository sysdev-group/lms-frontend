import { Component, computed, signal, OnDestroy } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '@core/auth/auth.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    RouterOutlet, RouterLink, RouterLinkActive,
    MatIconModule, MatButtonModule,
  ],
  template: `
    <div class="flex h-screen bg-slate-100 overflow-hidden">

      <!-- ── Mobile backdrop ──────────────────────────────────────────── -->
      @if (sidebarOpen()) {
        <div class="fixed inset-0 z-40 bg-black/60 lg:hidden"
             (click)="sidebarOpen.set(false)"
             aria-hidden="true"></div>
      }

      <!-- ── Sidebar ──────────────────────────────────────────────────── -->
      <aside [class]="'fixed inset-y-0 left-0 z-50 flex flex-col w-64 bg-slate-900 ' +
                      'transition-transform duration-300 ease-in-out ' +
                      'lg:relative lg:translate-x-0 lg:flex-shrink-0 ' +
                      (sidebarOpen() ? 'translate-x-0' : '-translate-x-full')">

        <!-- Brand header -->
        <div class="h-16 flex items-center gap-3 px-5 border-b border-slate-800 flex-shrink-0">
          <div class="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
            <mat-icon style="font-size:18px;width:18px;height:18px;color:white;line-height:1">school</mat-icon>
          </div>
          <div class="flex-1 min-w-0">
            <p class="font-display font-bold text-white text-sm leading-tight tracking-tight">LMS</p>
            <p class="text-xs text-slate-500 leading-tight truncate">{{ userRole() }}</p>
          </div>
          <button mat-icon-button class="lg:hidden flex-shrink-0 text-slate-500 hover:text-slate-300"
                  (click)="sidebarOpen.set(false)" aria-label="Close navigation">
            <mat-icon style="font-size:20px;width:20px;height:20px">close</mat-icon>
          </button>
        </div>

        <!-- Navigation links -->
        <nav class="flex-1 py-3 px-3 overflow-y-auto" role="navigation" aria-label="Main navigation">
          @for (item of navItems(); track item.path) {
            <a [routerLink]="item.path"
               routerLinkActive #rla="routerLinkActive"
               [class]="'flex items-center gap-3 px-3 rounded-lg text-sm font-medium min-h-[44px] mb-0.5 ' +
                        'transition-colors duration-150 cursor-pointer no-underline ' +
                        (rla.isActive
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200')">
              <mat-icon style="font-size:20px;width:20px;height:20px;flex-shrink:0">{{ item.icon }}</mat-icon>
              <span>{{ item.label }}</span>
            </a>
          }
        </nav>

        <!-- User identity + sign out -->
        <div class="border-t border-slate-800 p-4 flex-shrink-0 space-y-3">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-full bg-blue-600/20 border border-blue-500/30
                        flex items-center justify-center flex-shrink-0">
              <span class="text-blue-400 text-xs font-semibold font-display">{{ userInitials() }}</span>
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-sm font-medium text-white truncate leading-tight">{{ userName() }}</p>
              <p class="text-xs text-slate-500 leading-tight">{{ userRole() }}</p>
            </div>
          </div>
          <button (click)="logout()"
                  class="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg
                         text-slate-400 hover:text-white hover:bg-slate-800
                         transition-colors duration-150 text-sm font-medium min-h-[44px] cursor-pointer">
            <mat-icon style="font-size:18px;width:18px;height:18px">logout</mat-icon>
            Sign out
          </button>
        </div>

      </aside>

      <!-- ── Main content column ───────────────────────────────────────── -->
      <div class="flex flex-col flex-1 min-w-0 overflow-x-hidden">

        <!-- Mobile top bar -->
        <header class="flex items-center gap-3 h-14 px-4 bg-white border-b border-slate-200
                       lg:hidden flex-shrink-0 shadow-sm">
          <button mat-icon-button (click)="sidebarOpen.set(true)" aria-label="Open navigation">
            <mat-icon>menu</mat-icon>
          </button>
          <div class="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center flex-shrink-0">
            <mat-icon style="font-size:14px;width:14px;height:14px;color:white;line-height:1">school</mat-icon>
          </div>
          <span class="font-display font-semibold text-slate-800 text-sm">LMS</span>
        </header>

        <!-- Page content -->
        <main class="flex-1 overflow-y-auto">
          <router-outlet />
        </main>

      </div>

    </div>
  `,
})
export class ShellComponent implements OnDestroy {
  private routerSub: Subscription;

  constructor(private authService: AuthService, private router: Router) {
    this.routerSub = this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => this.sidebarOpen.set(false));
  }

  ngOnDestroy(): void {
    this.routerSub.unsubscribe();
  }

  sidebarOpen = signal(false);

  /** Computed so Tailwind's scanner sees all class names as string literals. */
  sidebarClass = computed(() =>
    'fixed inset-y-0 left-0 z-50 flex flex-col w-64 bg-white border-r border-slate-200 ' +
    'transition-transform duration-300 ease-in-out ' +
    'lg:relative lg:translate-x-0 lg:flex-shrink-0 ' +
    (this.sidebarOpen() ? 'translate-x-0' : '-translate-x-full')
  );

  userName     = computed(() => this.authService.currentUser()?.fullName ?? '');
  userRole     = computed(() => this.authService.currentUser()?.role ?? '');
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
  { path: '/dashboard',     label: 'Dashboard',     icon: 'home',           roles: null },
  { path: '/programmes',    label: 'Programmes',     icon: 'school',         roles: ['Admin', 'Student'] },
  { path: '/courses',       label: 'Courses',        icon: 'menu_book',      roles: null },
  { path: '/assignments',   label: 'Assignments',    icon: 'assignment',     roles: ['Lecturer', 'Student'] },
  { path: '/grades',        label: 'Grades',         icon: 'grade',          roles: null },
  { path: '/timetable',     label: 'Timetable',      icon: 'calendar_month', roles: null },
  { path: '/attendance',    label: 'Attendance',     icon: 'how_to_reg',     roles: ['Lecturer', 'Student'] },
  { path: '/notifications', label: 'Notifications',  icon: 'notifications',  roles: null },
  { path: '/users',         label: 'Users',          icon: 'group',          roles: ['Admin'] },
  { path: '/enrollment',    label: 'Enrollment',     icon: 'person_add',     roles: ['Admin'] },
  { path: '/audit',         label: 'Audit Log',      icon: 'history',        roles: ['Admin'] },
];
