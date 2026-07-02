import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.scss',
})
export class AdminLayout {
  constructor(private readonly authService: AuthService) {}

  logout(): void {
    this.authService.logout();
  }
}
