import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/**
 * Root component — just a router outlet.
 * All layout (navbar, sidebar) lives in ShellComponent for authenticated routes.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet />`,
})
export class AppComponent {}
