import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin, of, catchError } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '@core/auth/auth.service';
import { AssignmentService } from '@core/services/assignment.service';
import { EnrollmentService } from '@core/services/enrollment.service';
import { NotificationService } from '@core/services/notification.service';
import { TimetableService } from '@core/services/timetable.service';
import { UserService } from '@core/services/user.service';
import { CourseService } from '@core/services/course.service';
import { ProgrammeService } from '../programmes/programme.service';
import {
  Assignment,
  TimetableSession,
  Enrollment,
  Notification,
  User,
  Course,
  ProgrammeList,
} from '@shared/models/models';
import { PaginatedResult } from '@shared/models/api-response.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatListModule,
    MatProgressSpinnerModule,
    MatIconModule,
  ],
  template: `
    <div class="page-container">

      <!-- ═══════════════════════════════════════════════════════════════
           STUDENT DASHBOARD
      ═══════════════════════════════════════════════════════════════ -->
      @if (role() === 'Student') {

        @if (isLoading()) {
          <!-- Skeleton — mirrors exact final layout so page never jumps -->
          <div class="animate-pulse space-y-6">
            <div class="space-y-2">
              <div class="h-7 bg-slate-200 rounded-lg w-44"></div>
              <div class="h-4 bg-slate-200 rounded w-64"></div>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div class="h-[76px] bg-slate-200 rounded-xl"></div>
              <div class="h-[76px] bg-slate-200 rounded-xl"></div>
              <div class="h-[76px] bg-slate-200 rounded-xl"></div>
              <div class="h-[76px] bg-slate-200 rounded-xl"></div>
            </div>
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div class="lg:col-span-2 lms-card">
                <div class="h-5 bg-slate-200 rounded w-40 mb-5"></div>
                <div class="space-y-3">
                  <div class="h-14 bg-slate-100 rounded-lg"></div>
                  <div class="h-14 bg-slate-100 rounded-lg"></div>
                  <div class="h-14 bg-slate-100 rounded-lg"></div>
                </div>
              </div>
              <div class="lms-card">
                <div class="h-5 bg-slate-200 rounded w-32 mb-5"></div>
                <div class="space-y-2">
                  <div class="h-11 bg-slate-100 rounded-lg"></div>
                  <div class="h-11 bg-slate-100 rounded-lg"></div>
                  <div class="h-11 bg-slate-100 rounded-lg"></div>
                  <div class="h-11 bg-slate-100 rounded-lg"></div>
                  <div class="h-11 bg-slate-100 rounded-lg"></div>
                </div>
              </div>
            </div>
          </div>

        } @else {

          <div class="space-y-6">

            <!-- Page heading -->
            <div>
              <h1 class="font-display text-2xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
              <p class="text-sm text-slate-500 mt-0.5">Here's what needs your attention today.</p>
            </div>

            <!-- ── Stat tiles ─────────────────────────────────────────── -->
            <!-- Each tile answers one question students actually ask -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">

              <!-- "What programme am I in?" -->
              <a routerLink="/programmes"
                 class="lms-card flex items-center gap-4 cursor-pointer
                        hover:shadow-md transition-shadow no-underline min-h-[76px]">
                <div class="w-10 h-10 rounded-lg bg-indigo-50 flex items-center
                            justify-center flex-shrink-0">
                  <mat-icon class="text-indigo-600"
                            style="font-size:22px;width:22px;height:22px">school</mat-icon>
                </div>
                <div>
                  <p class="font-display text-2xl font-bold text-slate-900 leading-tight">
                    {{ studentProgrammeCount() }}
                  </p>
                  <p class="text-xs text-slate-500 mt-0.5">My Programmes</p>
                </div>
              </a>

              <!-- "How many modules am I in this semester?" -->
              <a routerLink="/courses"
                 class="lms-card flex items-center gap-4 cursor-pointer
                        hover:shadow-md transition-shadow no-underline min-h-[76px]">
                <div class="w-10 h-10 rounded-lg bg-blue-50 flex items-center
                            justify-center flex-shrink-0">
                  <mat-icon class="text-blue-600"
                            style="font-size:22px;width:22px;height:22px">menu_book</mat-icon>
                </div>
                <div>
                  <p class="font-display text-2xl font-bold text-slate-900 leading-tight">
                    {{ enrolledCourseCount() }}
                  </p>
                  <p class="text-xs text-slate-500 mt-0.5">My Modules</p>
                </div>
              </a>

              <!-- "What's due soon?" -->
              <a routerLink="/assignments"
                 class="lms-card flex items-center gap-4 cursor-pointer
                        hover:shadow-md transition-shadow no-underline min-h-[76px]">
                <div class="w-10 h-10 rounded-lg bg-rose-50 flex items-center
                            justify-center flex-shrink-0">
                  <mat-icon class="text-rose-500"
                            style="font-size:22px;width:22px;height:22px">assignment_late</mat-icon>
                </div>
                <div>
                  <p class="font-display text-2xl font-bold text-slate-900 leading-tight">
                    {{ upcomingDeadlines().length }}
                  </p>
                  <p class="text-xs text-slate-500 mt-0.5">Due This Week</p>
                </div>
              </a>

              <!-- "Did I miss anything?" -->
              <a routerLink="/notifications"
                 class="lms-card flex items-center gap-4 cursor-pointer
                        hover:shadow-md transition-shadow no-underline min-h-[76px]">
                <div class="w-10 h-10 rounded-lg bg-amber-50 flex items-center
                            justify-center flex-shrink-0">
                  <mat-icon class="text-amber-500"
                            style="font-size:22px;width:22px;height:22px">notifications</mat-icon>
                </div>
                <div>
                  <p class="font-display text-2xl font-bold text-slate-900 leading-tight">
                    {{ unreadCount() }}
                  </p>
                  <p class="text-xs text-slate-500 mt-0.5">Unread</p>
                </div>
              </a>

            </div>

            <!-- ── Main content grid ───────────────────────────────────── -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

              <!-- Deadline list — 2/3 width on desktop, first on mobile -->
              <div class="lms-card lg:col-span-2">
                <div class="flex items-center justify-between mb-5">
                  <h2 class="font-display font-semibold text-slate-900">
                    Upcoming Deadlines
                  </h2>
                  <a routerLink="/assignments"
                     class="text-xs font-medium text-blue-600 hover:text-blue-700
                            transition-colors cursor-pointer no-underline">
                    View all →
                  </a>
                </div>

                @if (upcomingDeadlines().length === 0) {
                  <!-- Empty state -->
                  <div class="flex flex-col items-center py-10 text-center">
                    <div class="w-12 h-12 rounded-full bg-green-50 flex items-center
                                justify-center mb-3">
                      <mat-icon class="text-green-500"
                                style="font-size:24px;width:24px;height:24px">check_circle</mat-icon>
                    </div>
                    <p class="text-sm font-medium text-slate-700">You're all caught up!</p>
                    <p class="text-xs text-slate-400 mt-1">
                      No assignments due in the next 7 days.
                    </p>
                    <a routerLink="/assignments" mat-flat-button color="primary"
                       class="mt-5 min-h-[44px]">
                      Browse Assignments
                    </a>
                  </div>

                } @else {
                  <ul class="divide-y divide-slate-100">
                    @for (a of upcomingDeadlines(); track a.id) {
                      <li>
                        <a [routerLink]="['/assignments', a.id]"
                           class="flex items-center gap-3 py-3 px-2 -mx-2 rounded-lg
                                  hover:bg-slate-50 transition-colors cursor-pointer
                                  no-underline group">

                          <!-- Left urgency accent bar -->
                          @if (deadlineLabel(a.deadline) === 'Due today') {
                            <div class="w-1 self-stretch rounded-full flex-shrink-0
                                        bg-red-500"></div>
                          } @else if (deadlineLabel(a.deadline) === '1 day left'
                                      || deadlineLabel(a.deadline) === '2 days left') {
                            <div class="w-1 self-stretch rounded-full flex-shrink-0
                                        bg-amber-400"></div>
                          } @else {
                            <div class="w-1 self-stretch rounded-full flex-shrink-0
                                        bg-green-400"></div>
                          }

                          <!-- Title + module name -->
                          <div class="flex-1 min-w-0">
                            <p class="text-sm font-medium text-slate-800 truncate
                                       group-hover:text-blue-600 transition-colors">
                              {{ a.title }}
                            </p>
                            <p class="text-xs text-slate-500 mt-0.5">{{ a.courseName }}</p>
                          </div>

                          <!-- Urgency badge — uses existing badge utility classes -->
                          @if (deadlineLabel(a.deadline) === 'Due today') {
                            <span class="badge badge-danger flex-shrink-0">Due today</span>
                          } @else if (deadlineLabel(a.deadline) === '1 day left'
                                      || deadlineLabel(a.deadline) === '2 days left') {
                            <span class="badge badge-warning flex-shrink-0">
                              {{ deadlineLabel(a.deadline) }}
                            </span>
                          } @else {
                            <span class="badge badge-success flex-shrink-0">
                              {{ deadlineLabel(a.deadline) }}
                            </span>
                          }

                        </a>
                      </li>
                    }
                  </ul>
                }
              </div>

              <!-- Quick actions — 1/3 width on desktop -->
              <div class="lms-card">
                <h2 class="font-display font-semibold text-slate-900 mb-4">
                  Quick Actions
                </h2>
                <nav class="space-y-0.5" aria-label="Quick navigation">

                  <a routerLink="/programmes"
                     class="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50
                            transition-colors cursor-pointer no-underline min-h-[44px]">
                    <div class="w-8 h-8 rounded-lg bg-indigo-50 flex items-center
                                justify-center flex-shrink-0">
                      <mat-icon class="text-indigo-600"
                                style="font-size:18px;width:18px;height:18px">school</mat-icon>
                    </div>
                    <span class="flex-1 text-sm font-medium text-slate-700">View Programmes</span>
                    <mat-icon class="text-slate-300"
                              style="font-size:18px;width:18px;height:18px">chevron_right</mat-icon>
                  </a>

                  <a routerLink="/assignments"
                     class="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50
                            transition-colors cursor-pointer no-underline min-h-[44px]">
                    <div class="w-8 h-8 rounded-lg bg-blue-50 flex items-center
                                justify-center flex-shrink-0">
                      <mat-icon class="text-blue-600"
                                style="font-size:18px;width:18px;height:18px">assignment</mat-icon>
                    </div>
                    <span class="flex-1 text-sm font-medium text-slate-700">Assignments</span>
                    <mat-icon class="text-slate-300"
                              style="font-size:18px;width:18px;height:18px">chevron_right</mat-icon>
                  </a>

                  <a routerLink="/courses"
                     class="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50
                            transition-colors cursor-pointer no-underline min-h-[44px]">
                    <div class="w-8 h-8 rounded-lg bg-violet-50 flex items-center
                                justify-center flex-shrink-0">
                      <mat-icon class="text-violet-600"
                                style="font-size:18px;width:18px;height:18px">menu_book</mat-icon>
                    </div>
                    <span class="flex-1 text-sm font-medium text-slate-700">View Modules</span>
                    <mat-icon class="text-slate-300"
                              style="font-size:18px;width:18px;height:18px">chevron_right</mat-icon>
                  </a>

                  <a routerLink="/grades"
                     class="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50
                            transition-colors cursor-pointer no-underline min-h-[44px]">
                    <div class="w-8 h-8 rounded-lg bg-green-50 flex items-center
                                justify-center flex-shrink-0">
                      <mat-icon class="text-green-600"
                                style="font-size:18px;width:18px;height:18px">grade</mat-icon>
                    </div>
                    <span class="flex-1 text-sm font-medium text-slate-700">My Grades</span>
                    <mat-icon class="text-slate-300"
                              style="font-size:18px;width:18px;height:18px">chevron_right</mat-icon>
                  </a>

                  <a routerLink="/timetable"
                     class="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50
                            transition-colors cursor-pointer no-underline min-h-[44px]">
                    <div class="w-8 h-8 rounded-lg bg-amber-50 flex items-center
                                justify-center flex-shrink-0">
                      <mat-icon class="text-amber-500"
                                style="font-size:18px;width:18px;height:18px">calendar_month</mat-icon>
                    </div>
                    <span class="flex-1 text-sm font-medium text-slate-700">Timetable</span>
                    <mat-icon class="text-slate-300"
                              style="font-size:18px;width:18px;height:18px">chevron_right</mat-icon>
                  </a>

                  <a routerLink="/attendance"
                     class="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50
                            transition-colors cursor-pointer no-underline min-h-[44px]">
                    <div class="w-8 h-8 rounded-lg bg-rose-50 flex items-center
                                justify-center flex-shrink-0">
                      <mat-icon class="text-rose-500"
                                style="font-size:18px;width:18px;height:18px">how_to_reg</mat-icon>
                    </div>
                    <span class="flex-1 text-sm font-medium text-slate-700">Attendance</span>
                    <mat-icon class="text-slate-300"
                              style="font-size:18px;width:18px;height:18px">chevron_right</mat-icon>
                  </a>

                </nav>
              </div>

            </div>
          </div>
        }
      }

      <!-- ═══════════════════════════════════════════════════════════════
           LECTURER DASHBOARD
      ═══════════════════════════════════════════════════════════════ -->
      @if (role() === 'Lecturer') {

        @if (isLoading()) {
          <!-- Skeleton — mirrors exact final layout so page never jumps -->
          <div class="animate-pulse space-y-6">
            <div class="space-y-2">
              <div class="h-7 bg-slate-200 rounded-lg w-52"></div>
              <div class="h-4 bg-slate-200 rounded w-72"></div>
            </div>
            <div class="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <div class="h-[76px] bg-slate-200 rounded-xl"></div>
              <div class="h-[76px] bg-slate-200 rounded-xl"></div>
              <div class="h-[76px] bg-slate-200 rounded-xl"></div>
              <div class="h-[76px] bg-slate-200 rounded-xl"></div>
              <div class="h-[76px] bg-slate-200 rounded-xl"></div>
            </div>
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div class="lg:col-span-2 space-y-4">
                <div class="h-5 bg-slate-200 rounded w-36"></div>
                <div class="lms-card space-y-4">
                  <div class="h-4 bg-slate-200 rounded w-48"></div>
                  <div class="h-3 bg-slate-100 rounded w-36"></div>
                  <div class="h-10 bg-amber-50 rounded-lg"></div>
                  <div class="flex gap-2">
                    <div class="h-11 flex-1 bg-blue-100 rounded-lg"></div>
                    <div class="h-11 w-28 bg-slate-100 rounded-lg"></div>
                  </div>
                </div>
                <div class="lms-card space-y-4">
                  <div class="h-4 bg-slate-200 rounded w-40"></div>
                  <div class="h-3 bg-slate-100 rounded w-32"></div>
                  <div class="h-10 bg-amber-50 rounded-lg"></div>
                  <div class="flex gap-2">
                    <div class="h-11 flex-1 bg-blue-100 rounded-lg"></div>
                    <div class="h-11 w-28 bg-slate-100 rounded-lg"></div>
                  </div>
                </div>
              </div>
              <div class="lms-card">
                <div class="h-5 bg-slate-200 rounded w-32 mb-5"></div>
                <div class="space-y-2">
                  <div class="h-11 bg-slate-100 rounded-lg"></div>
                  <div class="h-11 bg-slate-100 rounded-lg"></div>
                  <div class="h-11 bg-slate-100 rounded-lg"></div>
                  <div class="h-11 bg-slate-100 rounded-lg"></div>
                  <div class="h-11 bg-slate-100 rounded-lg"></div>
                </div>
              </div>
            </div>
            <div class="lms-card">
              <div class="h-5 bg-slate-200 rounded w-44 mb-5"></div>
              <div class="h-[88px] bg-amber-50 rounded-xl"></div>
            </div>
          </div>

        } @else {

          <div class="space-y-6">

            <!-- Page heading -->
            <div>
              <h1 class="font-display text-2xl font-bold text-slate-900 tracking-tight">
                Lecturer Dashboard
              </h1>
              <p class="text-sm text-slate-500 mt-0.5">Here's what needs your attention today.</p>
            </div>

            <!-- ── Stat tiles ─────────────────────────────────────────── -->
            <!-- Each tile is a nav link to the relevant screen -->
            <div class="grid grid-cols-2 lg:grid-cols-5 gap-4">

              <!-- My Programmes -->
              <a routerLink="/programmes"
                 class="lms-card flex items-center gap-4 cursor-pointer
                        hover:shadow-md transition-shadow no-underline min-h-[76px]">
                <div class="w-10 h-10 rounded-lg bg-indigo-50 flex items-center
                            justify-center flex-shrink-0">
                  <mat-icon class="text-indigo-600"
                            style="font-size:22px;width:22px;height:22px">school</mat-icon>
                </div>
                <div>
                  <p class="font-display text-2xl font-bold text-slate-900 leading-tight">—</p>
                  <p class="text-xs text-slate-500 mt-0.5">My Programmes</p>
                </div>
              </a>

              <!-- Pending Submissions — most actionable number -->
              <a routerLink="/assignments"
                 class="lms-card flex items-center gap-4 cursor-pointer
                        hover:shadow-md transition-shadow no-underline min-h-[76px]">
                <div class="w-10 h-10 rounded-lg bg-amber-50 flex items-center
                            justify-center flex-shrink-0">
                  <mat-icon class="text-amber-500"
                            style="font-size:22px;width:22px;height:22px">pending_actions</mat-icon>
                </div>
                <div>
                  <p class="font-display text-2xl font-bold text-slate-900 leading-tight">
                    {{ pendingSubmissionCount() }}
                  </p>
                  <p class="text-xs text-slate-500 mt-0.5">Pending Submissions</p>
                </div>
              </a>

              <!-- Today's Classes -->
              <a routerLink="/timetable"
                 class="lms-card flex items-center gap-4 cursor-pointer
                        hover:shadow-md transition-shadow no-underline min-h-[76px]">
                <div class="w-10 h-10 rounded-lg bg-blue-50 flex items-center
                            justify-center flex-shrink-0">
                  <mat-icon class="text-blue-600"
                            style="font-size:22px;width:22px;height:22px">today</mat-icon>
                </div>
                <div>
                  <p class="font-display text-2xl font-bold text-slate-900 leading-tight">
                    {{ todaySessions().length }}
                  </p>
                  <p class="text-xs text-slate-500 mt-0.5">Today's Classes</p>
                </div>
              </a>

              <!-- Active Modules — no aggregate signal yet; placeholder -->
              <a routerLink="/courses"
                 class="lms-card flex items-center gap-4 cursor-pointer
                        hover:shadow-md transition-shadow no-underline min-h-[76px]">
                <div class="w-10 h-10 rounded-lg bg-violet-50 flex items-center
                            justify-center flex-shrink-0">
                  <mat-icon class="text-violet-600"
                            style="font-size:22px;width:22px;height:22px">menu_book</mat-icon>
                </div>
                <div>
                  <p class="font-display text-2xl font-bold text-slate-900 leading-tight">—</p>
                  <p class="text-xs text-slate-500 mt-0.5">Active Modules</p>
                </div>
              </a>

              <!-- Avg Attendance — no aggregate signal yet; placeholder -->
              <a routerLink="/attendance"
                 class="lms-card flex items-center gap-4 cursor-pointer
                        hover:shadow-md transition-shadow no-underline min-h-[76px]">
                <div class="w-10 h-10 rounded-lg bg-green-50 flex items-center
                            justify-center flex-shrink-0">
                  <mat-icon class="text-green-600"
                            style="font-size:22px;width:22px;height:22px">how_to_reg</mat-icon>
                </div>
                <div>
                  <p class="font-display text-2xl font-bold text-slate-900 leading-tight">—</p>
                  <p class="text-xs text-slate-500 mt-0.5">Avg Attendance</p>
                </div>
              </a>

            </div>

            <!-- ── Middle grid ─────────────────────────────────────────── -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

              <!-- Today's Classes — 2/3 width -->
              <div class="lg:col-span-2 space-y-4">

                <div class="flex items-center justify-between">
                  <h2 class="font-display font-semibold text-slate-900">Today's Classes</h2>
                  <a routerLink="/timetable"
                     class="text-xs font-medium text-blue-600 hover:text-blue-700
                            transition-colors cursor-pointer no-underline">
                    View timetable →
                  </a>
                </div>

                @if (todaySessions().length === 0) {

                  <div class="lms-card flex flex-col items-center py-10 text-center">
                    <div class="w-12 h-12 rounded-full bg-slate-50 flex items-center
                                justify-center mb-3">
                      <mat-icon class="text-slate-400"
                                style="font-size:24px;width:24px;height:24px">
                        event_busy
                      </mat-icon>
                    </div>
                    <p class="text-sm font-medium text-slate-700">No classes scheduled today.</p>
                    <p class="text-xs text-slate-400 mt-1">
                      Check your timetable for upcoming sessions.
                    </p>
                    <a routerLink="/timetable" mat-flat-button color="primary"
                       class="mt-5 min-h-[44px]">
                      View Timetable
                    </a>
                  </div>

                } @else {

                  @for (s of todaySessions(); track s.id) {
                    <!-- Each session gets its own card — attendance is per-session -->
                    <div class="lms-card">

                      <!-- Session header: module name, time, room, type badge -->
                      <div class="flex items-start justify-between gap-3 mb-3">
                        <div class="flex-1 min-w-0">
                          <h3 class="font-display font-semibold text-slate-900
                                     leading-tight truncate">
                            {{ s.courseTitle }}
                          </h3>
                          <p class="text-xs text-slate-500 mt-1.5 flex items-center gap-1.5">
                            <mat-icon style="font-size:13px;width:13px;height:13px;line-height:1"
                                      class="text-slate-400">schedule</mat-icon>
                            {{ s.startTime }} – {{ s.endTime }}
                            <span class="text-slate-300 select-none">·</span>
                            <mat-icon style="font-size:13px;width:13px;height:13px;line-height:1"
                                      class="text-slate-400">room</mat-icon>
                            {{ s.room }}
                          </p>
                        </div>
                        @if (s.type === 'Lecture') {
                          <span class="badge badge-info flex-shrink-0">Lecture</span>
                        } @else if (s.type === 'Lab') {
                          <span class="badge badge-neutral flex-shrink-0">Lab</span>
                        } @else {
                          <span class="badge badge-success flex-shrink-0">Tutorial</span>
                        }
                      </div>

                      <!-- Attendance reminder — shown for all today's sessions -->
                      <div class="flex items-center gap-2 px-3 py-2 bg-amber-50 rounded-lg
                                  border border-amber-100 mb-4">
                        <mat-icon class="text-amber-500 flex-shrink-0"
                                  style="font-size:15px;width:15px;height:15px">
                          warning_amber
                        </mat-icon>
                        <p class="text-xs font-medium text-amber-700">
                          Attendance not yet marked for this session
                        </p>
                      </div>

                      <!-- Actions — Mark Attendance is the dominant CTA -->
                      <div class="flex gap-2">
                        <a routerLink="/attendance"
                           mat-flat-button color="primary"
                           class="flex-1 min-h-[44px]">
                          <mat-icon style="font-size:17px;width:17px;height:17px">
                            how_to_reg
                          </mat-icon>
                          Mark Attendance
                        </a>
                        <a routerLink="/courses"
                           mat-stroked-button
                           class="min-h-[44px] shrink-0">
                          <mat-icon style="font-size:16px;width:16px;height:16px">
                            edit_note
                          </mat-icon>
                          Outcomes
                        </a>
                      </div>

                    </div>
                  }

                }
              </div>

              <!-- Quick Actions — 1/3 width -->
              <div class="lms-card h-fit">
                <h2 class="font-display font-semibold text-slate-900 mb-4">Quick Actions</h2>
                <nav class="space-y-0.5" aria-label="Lecturer quick navigation">

                  <a routerLink="/programmes"
                     class="flex items-center gap-3 px-3 py-2.5 rounded-lg
                            hover:bg-slate-50 transition-colors cursor-pointer
                            no-underline min-h-[44px]">
                    <div class="w-8 h-8 rounded-lg bg-indigo-50 flex items-center
                                justify-center flex-shrink-0">
                      <mat-icon class="text-indigo-600"
                                style="font-size:18px;width:18px;height:18px">school</mat-icon>
                    </div>
                    <span class="flex-1 text-sm font-medium text-slate-700">
                      View Programmes
                    </span>
                    <mat-icon class="text-slate-300"
                              style="font-size:18px;width:18px;height:18px">chevron_right</mat-icon>
                  </a>

                  <!-- Grade Submissions — badge shows pending count -->
                  <a routerLink="/assignments"
                     class="flex items-center gap-3 px-3 py-2.5 rounded-lg
                            hover:bg-slate-50 transition-colors cursor-pointer
                            no-underline min-h-[44px]">
                    <div class="w-8 h-8 rounded-lg bg-amber-50 flex items-center
                                justify-center flex-shrink-0">
                      <mat-icon class="text-amber-500"
                                style="font-size:18px;width:18px;height:18px">grading</mat-icon>
                    </div>
                    <span class="flex-1 text-sm font-medium text-slate-700">
                      Grade Submissions
                    </span>
                    @if (pendingSubmissionCount() > 0) {
                      <span class="inline-flex items-center justify-center
                                   min-w-[20px] h-5 px-1.5 rounded-full
                                   bg-amber-500 text-white text-xs font-bold flex-shrink-0">
                        {{ pendingSubmissionCount() }}
                      </span>
                    } @else {
                      <mat-icon class="text-slate-300"
                                style="font-size:18px;width:18px;height:18px">
                        chevron_right
                      </mat-icon>
                    }
                  </a>

                  <a routerLink="/assignments"
                     class="flex items-center gap-3 px-3 py-2.5 rounded-lg
                            hover:bg-slate-50 transition-colors cursor-pointer
                            no-underline min-h-[44px]">
                    <div class="w-8 h-8 rounded-lg bg-blue-50 flex items-center
                                justify-center flex-shrink-0">
                      <mat-icon class="text-blue-600"
                                style="font-size:18px;width:18px;height:18px">add_task</mat-icon>
                    </div>
                    <span class="flex-1 text-sm font-medium text-slate-700">
                      Create Assignment
                    </span>
                    <mat-icon class="text-slate-300"
                              style="font-size:18px;width:18px;height:18px">chevron_right</mat-icon>
                  </a>

                  <a routerLink="/timetable"
                     class="flex items-center gap-3 px-3 py-2.5 rounded-lg
                            hover:bg-slate-50 transition-colors cursor-pointer
                            no-underline min-h-[44px]">
                    <div class="w-8 h-8 rounded-lg bg-violet-50 flex items-center
                                justify-center flex-shrink-0">
                      <mat-icon class="text-violet-600"
                                style="font-size:18px;width:18px;height:18px">calendar_month</mat-icon>
                    </div>
                    <span class="flex-1 text-sm font-medium text-slate-700">
                      Manage Timetable
                    </span>
                    <mat-icon class="text-slate-300"
                              style="font-size:18px;width:18px;height:18px">chevron_right</mat-icon>
                  </a>

                  <a routerLink="/notifications"
                     class="flex items-center gap-3 px-3 py-2.5 rounded-lg
                            hover:bg-slate-50 transition-colors cursor-pointer
                            no-underline min-h-[44px]">
                    <div class="w-8 h-8 rounded-lg bg-rose-50 flex items-center
                                justify-center flex-shrink-0">
                      <mat-icon class="text-rose-500"
                                style="font-size:18px;width:18px;height:18px">campaign</mat-icon>
                    </div>
                    <span class="flex-1 text-sm font-medium text-slate-700">
                      Post Notification
                    </span>
                    <mat-icon class="text-slate-300"
                              style="font-size:18px;width:18px;height:18px">chevron_right</mat-icon>
                  </a>

                  <a routerLink="/courses"
                     class="flex items-center gap-3 px-3 py-2.5 rounded-lg
                            hover:bg-slate-50 transition-colors cursor-pointer
                            no-underline min-h-[44px]">
                    <div class="w-8 h-8 rounded-lg bg-green-50 flex items-center
                                justify-center flex-shrink-0">
                      <mat-icon class="text-green-600"
                                style="font-size:18px;width:18px;height:18px">menu_book</mat-icon>
                    </div>
                    <span class="flex-1 text-sm font-medium text-slate-700">
                      View All Modules
                    </span>
                    <mat-icon class="text-slate-300"
                              style="font-size:18px;width:18px;height:18px">chevron_right</mat-icon>
                  </a>

                </nav>
              </div>

            </div>

            <!-- ── Recent Submissions feed ─────────────────────────────── -->
            <div class="lms-card">
              <div class="flex items-center justify-between mb-5">
                <h2 class="font-display font-semibold text-slate-900">Recent Submissions</h2>
                <a routerLink="/assignments"
                   class="text-xs font-medium text-blue-600 hover:text-blue-700
                          transition-colors cursor-pointer no-underline">
                  View all →
                </a>
              </div>

              @if (pendingSubmissionCount() === 0) {
                <!-- Empty state — no ungraded work -->
                <div class="flex flex-col items-center py-8 text-center">
                  <div class="w-12 h-12 rounded-full bg-green-50 flex items-center
                              justify-center mb-3">
                    <mat-icon class="text-green-500"
                              style="font-size:24px;width:24px;height:24px">check_circle</mat-icon>
                  </div>
                  <p class="text-sm font-medium text-slate-700">All caught up!</p>
                  <p class="text-xs text-slate-400 mt-1">
                    No submissions waiting to be graded.
                  </p>
                </div>

              } @else {
                <!-- Pending submissions summary — individual items available in Assignments -->
                <div class="flex items-center gap-4 p-4 bg-amber-50 rounded-xl
                            border border-amber-100">
                  <div class="w-10 h-10 rounded-lg bg-amber-100 flex items-center
                              justify-center flex-shrink-0">
                    <mat-icon class="text-amber-600"
                              style="font-size:22px;width:22px;height:22px">
                      pending_actions
                    </mat-icon>
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-semibold text-amber-900">
                      {{ pendingSubmissionCount() }}
                      submission{{ pendingSubmissionCount() === 1 ? '' : 's' }}
                      waiting to be graded
                    </p>
                    <p class="text-xs text-amber-700 mt-0.5">
                      Head to Assignments to review and publish grades.
                    </p>
                  </div>
                  <a routerLink="/assignments"
                     mat-flat-button color="primary"
                     class="min-h-[44px] flex-shrink-0">
                    Grade Now
                  </a>
                </div>
              }

            </div>

          </div>
        }
      }

      <!-- ═══════════════════════════════════════════════════════════════
           ADMIN DASHBOARD (Screen 4)

           ROLE BADGE COLOUR SYSTEM — global convention, used on ALL screens:
             Admin    → bg-red-100 text-red-700
             Lecturer → bg-blue-100 text-blue-700
             Student  → bg-green-100 text-green-700
           Apply inline wherever a role badge appears — no custom CSS needed.
      ═══════════════════════════════════════════════════════════════ -->
      @if (role() === 'Admin') {

        @if (isLoading()) {
          <!-- Skeleton — mirrors exact final layout so page never jumps -->
          <div class="animate-pulse space-y-6">
            <div class="space-y-2">
              <div class="h-7 bg-slate-200 rounded-lg w-44"></div>
              <div class="h-4 bg-slate-200 rounded w-72"></div>
            </div>
            <div class="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <div class="h-[76px] bg-slate-200 rounded-xl"></div>
              <div class="h-[76px] bg-slate-200 rounded-xl"></div>
              <div class="h-[76px] bg-slate-200 rounded-xl"></div>
              <div class="h-[76px] bg-slate-200 rounded-xl"></div>
              <div class="h-[76px] bg-slate-200 rounded-xl"></div>
            </div>
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div class="lg:col-span-2 lms-card">
                <div class="h-5 bg-slate-200 rounded w-44 mb-4"></div>
                <div class="h-10 bg-slate-100 rounded-lg mb-5"></div>
                <div class="space-y-3">
                  <div class="h-14 bg-slate-100 rounded-lg"></div>
                  <div class="h-14 bg-slate-100 rounded-lg"></div>
                  <div class="h-14 bg-slate-100 rounded-lg"></div>
                  <div class="h-14 bg-slate-100 rounded-lg"></div>
                  <div class="h-14 bg-slate-100 rounded-lg"></div>
                </div>
              </div>
              <div class="lms-card">
                <div class="h-5 bg-slate-200 rounded w-32 mb-5"></div>
                <div class="space-y-2">
                  <div class="h-11 bg-slate-100 rounded-lg"></div>
                  <div class="h-11 bg-slate-100 rounded-lg"></div>
                  <div class="h-11 bg-slate-100 rounded-lg"></div>
                  <div class="h-11 bg-slate-100 rounded-lg"></div>
                  <div class="h-11 bg-slate-100 rounded-lg"></div>
                </div>
              </div>
            </div>
            <div class="lms-card">
              <div class="h-5 bg-slate-200 rounded w-40 mb-5"></div>
              <div class="space-y-3">
                <div class="h-11 bg-slate-100 rounded-lg"></div>
                <div class="h-11 bg-slate-100 rounded-lg"></div>
                <div class="h-11 bg-slate-100 rounded-lg"></div>
                <div class="h-11 bg-slate-100 rounded-lg"></div>
                <div class="h-11 bg-slate-100 rounded-lg"></div>
              </div>
            </div>
          </div>

        } @else {

          <div class="space-y-6">

            <!-- Page heading -->
            <div>
              <h1 class="font-display text-2xl font-bold text-slate-900 tracking-tight">
                Admin Dashboard
              </h1>
              <p class="text-sm text-slate-500 mt-0.5">
                System overview — users, modules, and activity at a glance.
              </p>
            </div>

            <!-- ── Stat tiles — five numbers that answer "is the system healthy?" ── -->
            <div class="grid grid-cols-2 lg:grid-cols-5 gap-4">

              <!-- Total Programmes (indigo) -->
              <a routerLink="/programmes"
                 class="lms-card flex items-center gap-4 cursor-pointer
                        hover:shadow-md transition-shadow no-underline min-h-[76px]">
                <div class="w-10 h-10 rounded-lg bg-indigo-50 flex items-center
                            justify-center flex-shrink-0">
                  <mat-icon class="text-indigo-600"
                            style="font-size:22px;width:22px;height:22px">school</mat-icon>
                </div>
                <div>
                  <p class="font-display text-2xl font-bold text-slate-900 leading-tight">
                    {{ totalProgrammeCount() }}
                  </p>
                  <p class="text-xs text-slate-500 mt-0.5">Total Programmes</p>
                </div>
              </a>

              <!-- Total Users (blue) -->
              <a routerLink="/users"
                 class="lms-card flex items-center gap-4 cursor-pointer
                        hover:shadow-md transition-shadow no-underline min-h-[76px]">
                <div class="w-10 h-10 rounded-lg bg-blue-50 flex items-center
                            justify-center flex-shrink-0">
                  <mat-icon class="text-blue-600"
                            style="font-size:22px;width:22px;height:22px">people</mat-icon>
                </div>
                <div>
                  <p class="font-display text-2xl font-bold text-slate-900 leading-tight">
                    {{ totalUserCount() }}
                  </p>
                  <p class="text-xs text-slate-500 mt-0.5">Total Users</p>
                </div>
              </a>

              <!-- Active Modules (violet) -->
              <a routerLink="/courses"
                 class="lms-card flex items-center gap-4 cursor-pointer
                        hover:shadow-md transition-shadow no-underline min-h-[76px]">
                <div class="w-10 h-10 rounded-lg bg-violet-50 flex items-center
                            justify-center flex-shrink-0">
                  <mat-icon class="text-violet-600"
                            style="font-size:22px;width:22px;height:22px">menu_book</mat-icon>
                </div>
                <div>
                  <p class="font-display text-2xl font-bold text-slate-900 leading-tight">
                    {{ totalCourseCount() }}
                  </p>
                  <p class="text-xs text-slate-500 mt-0.5">Active Modules</p>
                </div>
              </a>

              <!-- Total Enrollments (green) — no aggregate signal; placeholder -->
              <a routerLink="/courses"
                 class="lms-card flex items-center gap-4 cursor-pointer
                        hover:shadow-md transition-shadow no-underline min-h-[76px]">
                <div class="w-10 h-10 rounded-lg bg-green-50 flex items-center
                            justify-center flex-shrink-0">
                  <mat-icon class="text-green-600"
                            style="font-size:22px;width:22px;height:22px">how_to_reg</mat-icon>
                </div>
                <div>
                  <p class="font-display text-2xl font-bold text-slate-900 leading-tight">—</p>
                  <p class="text-xs text-slate-500 mt-0.5">Total Enrollments</p>
                </div>
              </a>

              <!-- Audit Events Today (amber, >50 = high activity worth investigating) -->
              <!-- No signal yet — placeholder; wire auditEventsTodayCount() when available -->
              <a routerLink="/audit"
                 class="lms-card flex items-center gap-4 cursor-pointer
                        hover:shadow-md transition-shadow no-underline min-h-[76px]">
                <div class="w-10 h-10 rounded-lg bg-amber-50 flex items-center
                            justify-center flex-shrink-0">
                  <mat-icon class="text-amber-500"
                            style="font-size:22px;width:22px;height:22px">history</mat-icon>
                </div>
                <div>
                  <p class="font-display text-2xl font-bold text-slate-900 leading-tight">—</p>
                  <p class="text-xs text-slate-500 mt-0.5">Audit Events Today</p>
                </div>
              </a>

            </div>

            <!-- ── Middle grid: Audit feed (2/3) + Quick Actions (1/3) ───── -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

              <!-- Recent Audit Activity — most visually weighted section for admins -->
              <div class="lms-card lg:col-span-2">
                <div class="flex items-center justify-between mb-4">
                  <h2 class="font-display font-semibold text-slate-900">
                    Recent Audit Activity
                  </h2>
                  <a routerLink="/audit"
                     class="text-xs font-medium text-blue-600 hover:text-blue-700
                            transition-colors cursor-pointer no-underline">
                    View Full Audit Log →
                  </a>
                </div>

                <!-- Colour legend — each event row in the audit feed gets a left border
                     in one of these three colours depending on action risk level -->
                <div class="grid grid-cols-3 gap-2 mb-5">
                  <div class="flex items-center gap-2 px-3 py-2.5 rounded-lg
                              bg-green-50 border border-green-100">
                    <div class="w-2.5 h-2.5 rounded-full bg-green-400 flex-shrink-0"></div>
                    <div class="min-w-0">
                      <p class="text-xs font-semibold text-green-800 leading-tight">Read</p>
                      <p class="text-xs text-green-600 leading-tight">View · list · export</p>
                    </div>
                  </div>
                  <div class="flex items-center gap-2 px-3 py-2.5 rounded-lg
                              bg-amber-50 border border-amber-100">
                    <div class="w-2.5 h-2.5 rounded-full bg-amber-400 flex-shrink-0"></div>
                    <div class="min-w-0">
                      <p class="text-xs font-semibold text-amber-800 leading-tight">Write</p>
                      <p class="text-xs text-amber-600 leading-tight">Create · update</p>
                    </div>
                  </div>
                  <div class="flex items-center gap-2 px-3 py-2.5 rounded-lg
                              bg-red-50 border border-red-100">
                    <div class="w-2.5 h-2.5 rounded-full bg-red-500 flex-shrink-0"></div>
                    <div class="min-w-0">
                      <p class="text-xs font-semibold text-red-800 leading-tight">High Risk</p>
                      <p class="text-xs text-red-600 leading-tight">Delete · auth fail</p>
                    </div>
                  </div>
                </div>

                <!-- Navigate to /audit for the live feed — data not loaded on dashboard -->
                <div class="flex flex-col items-center py-8 text-center">
                  <div class="w-12 h-12 rounded-full bg-amber-50 flex items-center
                              justify-center mb-3">
                    <mat-icon class="text-amber-500"
                              style="font-size:24px;width:24px;height:24px">
                      manage_search
                    </mat-icon>
                  </div>
                  <p class="text-sm font-medium text-slate-700">
                    Live audit feed on the Audit Log page
                  </p>
                  <p class="text-xs text-slate-400 mt-1 max-w-[260px]">
                    Filter by user, action type, entity, or date range.
                    High-risk events are flagged automatically.
                  </p>
                  <a routerLink="/audit" mat-flat-button color="primary"
                     class="mt-5 min-h-[44px]">
                    Open Audit Log
                  </a>
                </div>

              </div>

              <!-- Quick Actions — 1/3 width -->
              <div class="lms-card h-fit">
                <h2 class="font-display font-semibold text-slate-900 mb-4">
                  Quick Actions
                </h2>
                <nav class="space-y-0.5" aria-label="Admin quick navigation">

                  <a routerLink="/programmes"
                     class="flex items-center gap-3 px-3 py-2.5 rounded-lg
                            hover:bg-slate-50 transition-colors cursor-pointer
                            no-underline min-h-[44px]">
                    <div class="w-8 h-8 rounded-lg bg-indigo-50 flex items-center
                                justify-center flex-shrink-0">
                      <mat-icon class="text-indigo-600"
                                style="font-size:18px;width:18px;height:18px">school</mat-icon>
                    </div>
                    <span class="flex-1 text-sm font-medium text-slate-700">
                      Manage Programmes
                    </span>
                    <mat-icon class="text-slate-300"
                              style="font-size:18px;width:18px;height:18px">chevron_right</mat-icon>
                  </a>

                  <!-- Add New User — most common admin task; blue = primary action -->
                  <a routerLink="/users"
                     class="flex items-center gap-3 px-3 py-2.5 rounded-lg
                            hover:bg-slate-50 transition-colors cursor-pointer
                            no-underline min-h-[44px]">
                    <div class="w-8 h-8 rounded-lg bg-blue-50 flex items-center
                                justify-center flex-shrink-0">
                      <mat-icon class="text-blue-600"
                                style="font-size:18px;width:18px;height:18px">person_add</mat-icon>
                    </div>
                    <span class="flex-1 text-sm font-medium text-slate-700">Add New User</span>
                    <mat-icon class="text-slate-300"
                              style="font-size:18px;width:18px;height:18px">chevron_right</mat-icon>
                  </a>

                  <a routerLink="/users"
                     class="flex items-center gap-3 px-3 py-2.5 rounded-lg
                            hover:bg-slate-50 transition-colors cursor-pointer
                            no-underline min-h-[44px]">
                    <div class="w-8 h-8 rounded-lg bg-violet-50 flex items-center
                                justify-center flex-shrink-0">
                      <mat-icon class="text-violet-600"
                                style="font-size:18px;width:18px;height:18px">upload_file</mat-icon>
                    </div>
                    <span class="flex-1 text-sm font-medium text-slate-700">
                      Bulk Import Users
                    </span>
                    <mat-icon class="text-slate-300"
                              style="font-size:18px;width:18px;height:18px">chevron_right</mat-icon>
                  </a>

                  <a routerLink="/courses"
                     class="flex items-center gap-3 px-3 py-2.5 rounded-lg
                            hover:bg-slate-50 transition-colors cursor-pointer
                            no-underline min-h-[44px]">
                    <div class="w-8 h-8 rounded-lg bg-green-50 flex items-center
                                justify-center flex-shrink-0">
                      <mat-icon class="text-green-600"
                                style="font-size:18px;width:18px;height:18px">add_circle</mat-icon>
                    </div>
                    <span class="flex-1 text-sm font-medium text-slate-700">
                      Create Module
                    </span>
                    <mat-icon class="text-slate-300"
                              style="font-size:18px;width:18px;height:18px">chevron_right</mat-icon>
                  </a>

                  <a routerLink="/users"
                     class="flex items-center gap-3 px-3 py-2.5 rounded-lg
                            hover:bg-slate-50 transition-colors cursor-pointer
                            no-underline min-h-[44px]">
                    <div class="w-8 h-8 rounded-lg bg-rose-50 flex items-center
                                justify-center flex-shrink-0">
                      <mat-icon class="text-rose-500"
                                style="font-size:18px;width:18px;height:18px">manage_accounts</mat-icon>
                    </div>
                    <span class="flex-1 text-sm font-medium text-slate-700">
                      View All Users
                    </span>
                    <mat-icon class="text-slate-300"
                              style="font-size:18px;width:18px;height:18px">chevron_right</mat-icon>
                  </a>

                  <a routerLink="/audit"
                     class="flex items-center gap-3 px-3 py-2.5 rounded-lg
                            hover:bg-slate-50 transition-colors cursor-pointer
                            no-underline min-h-[44px]">
                    <div class="w-8 h-8 rounded-lg bg-amber-50 flex items-center
                                justify-center flex-shrink-0">
                      <mat-icon class="text-amber-500"
                                style="font-size:18px;width:18px;height:18px">history</mat-icon>
                    </div>
                    <span class="flex-1 text-sm font-medium text-slate-700">
                      View Audit Log
                    </span>
                    <mat-icon class="text-slate-300"
                              style="font-size:18px;width:18px;height:18px">chevron_right</mat-icon>
                  </a>

                </nav>
              </div>

            </div>

            <!-- ── User Management snapshot ──────────────────────────────── -->
            <div class="lms-card">
              <div class="flex items-center justify-between mb-5">
                <h2 class="font-display font-semibold text-slate-900">
                  User Management
                </h2>
                <a routerLink="/users"
                   class="text-xs font-medium text-blue-600 hover:text-blue-700
                          transition-colors cursor-pointer no-underline">
                  Manage All Users →
                </a>
              </div>

              <!-- Column headers — show the table structure even in empty state -->
              <div class="hidden sm:grid grid-cols-12 gap-3 px-2 pb-3
                          border-b border-slate-100 mb-1">
                <div class="col-span-4 text-xs font-semibold text-slate-400
                            uppercase tracking-wider">Name</div>
                <div class="col-span-2 text-xs font-semibold text-slate-400
                            uppercase tracking-wider">Role</div>
                <div class="col-span-4 text-xs font-semibold text-slate-400
                            uppercase tracking-wider">Email</div>
                <div class="col-span-1 text-xs font-semibold text-slate-400
                            uppercase tracking-wider">Joined</div>
                <div class="col-span-1"></div>
              </div>

              <!-- Empty state — full list loads in User Management -->
              <div class="flex flex-col items-center py-8 text-center">
                <div class="w-12 h-12 rounded-full bg-blue-50 flex items-center
                            justify-center mb-3">
                  <mat-icon class="text-blue-500"
                            style="font-size:24px;width:24px;height:24px">group</mat-icon>
                </div>
                <p class="text-sm font-medium text-slate-700">
                  {{ totalUserCount() }}
                  user{{ totalUserCount() === 1 ? '' : 's' }} registered
                </p>
                <p class="text-xs text-slate-400 mt-1">
                  Add users, change roles, and manage access from User Management.
                </p>
                <a routerLink="/users" mat-flat-button color="primary"
                   class="mt-5 min-h-[44px]">
                  Open User Management
                </a>
              </div>

            </div>

          </div>
        }
      }

    </div>
  `,
})
export class DashboardComponent implements OnInit {
  isLoading = signal(false);

  // Student
  upcomingDeadlines = signal<Assignment[]>([]);
  enrolledCourseCount = signal(0);
  unreadCount = signal(0);
  studentProgrammeCount = signal(0);

  // Lecturer
  pendingSubmissionCount = signal(0);
  todaySessions = signal<TimetableSession[]>([]);

  // Admin
  totalUserCount = signal(0);
  totalCourseCount = signal(0);
  totalProgrammeCount = signal(0);

  readonly role = computed(() => this.authService.currentUser()?.role ?? null);

  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private readonly authService: AuthService,
    private readonly assignmentService: AssignmentService,
    private readonly enrollmentService: EnrollmentService,
    private readonly notificationService: NotificationService,
    private readonly timetableService: TimetableService,
    private readonly userService: UserService,
    private readonly courseService: CourseService,
    private readonly programmeService: ProgrammeService,
  ) {}

  ngOnInit(): void {
    const r = this.role();
    if (r === 'Student') {
      this.loadStudentData();
    } else if (r === 'Lecturer') {
      this.loadLecturerData();
    } else if (r === 'Admin') {
      this.loadAdminData();
    }
  }

  deadlineLabel(deadline: string): string {
    const days = this.daysUntil(deadline);
    if (days === 0) return 'Due today';
    if (days === 1) return '1 day left';
    return `${days} days left`;
  }

  deadlineCss(deadline: string): string {
    const days = this.daysUntil(deadline);
    if (days === 0) return 'text-orange-500 font-medium';
    if (days <= 2) return 'text-amber-600 font-medium';
    return 'text-green-600 font-medium';
  }

  private daysUntil(deadline: string): number {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const d = new Date(deadline);
    d.setHours(0, 0, 0, 0);
    return Math.round((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }

  private loadStudentData(): void {
    const userId = this.authService.currentUser()!.id;
    this.isLoading.set(true);
    forkJoin({
      assignments: this.assignmentService.getMyAssignments().pipe(
        catchError(() => of<Assignment[]>([])),
      ),
      enrollments: this.enrollmentService.getStudentEnrollments(userId).pipe(
        catchError(() => of<Enrollment[]>([])),
      ),
      notifications: this.notificationService.getMyNotifications(true).pipe(
        catchError(() => of<Notification[]>([])),
      ),
      programmes: this.programmeService.getAll().pipe(
        catchError(() => of<ProgrammeList[]>([])),
      ),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ assignments, enrollments, notifications, programmes }) => {
          const now = new Date();
          now.setHours(0, 0, 0, 0);
          const cutoff = new Date(now);
          cutoff.setDate(now.getDate() + 7);
          this.upcomingDeadlines.set(
            assignments.filter(a => {
              const d = new Date(a.deadline);
              d.setHours(0, 0, 0, 0);
              return d >= now && d <= cutoff;
            }),
          );
          this.enrolledCourseCount.set(enrollments.filter(e => e.status === 'Active').length);
          this.unreadCount.set(notifications.length);
          this.studentProgrammeCount.set(programmes.length);
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false),
      });
  }

  private loadLecturerData(): void {
    this.isLoading.set(true);
    const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    forkJoin({
      assignments: this.assignmentService.getMyAssignments().pipe(
        catchError(() => of<Assignment[]>([])),
      ),
      sessions: this.timetableService.getSessions().pipe(
        catchError(() => of<TimetableSession[]>([])),
      ),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ assignments, sessions }) => {
          this.pendingSubmissionCount.set(
            assignments.reduce((sum, a) => sum + a.submissionCount, 0),
          );
          this.todaySessions.set(sessions.filter(s => s.dayOfWeek === todayName));
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false),
      });
  }

  private loadAdminData(): void {
    this.isLoading.set(true);
    forkJoin({
      users: this.userService.getUsers({ pageSize: 1 }).pipe(
        catchError(() => of<PaginatedResult<User>>({ items: [], totalCount: 0, page: 1, pageSize: 1 })),
      ),
      courses: this.courseService.getCourses({ pageSize: 1 }).pipe(
        catchError(() => of<PaginatedResult<Course>>({ items: [], totalCount: 0, page: 1, pageSize: 1 })),
      ),
      programmes: this.programmeService.getAll().pipe(
        catchError(() => of<ProgrammeList[]>([])),
      ),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ users, courses, programmes }) => {
          this.totalUserCount.set(users.totalCount);
          this.totalCourseCount.set(courses.totalCount);
          this.totalProgrammeCount.set(programmes.length);
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false),
      });
  }
}
