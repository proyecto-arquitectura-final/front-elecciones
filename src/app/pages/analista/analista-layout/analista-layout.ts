import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-analista-layout',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './analista-layout.html',
  styleUrl: './analista-layout.scss',
})
export class AnalistaLayout {
  get nombreUsuario(): string {
    return this.authService.getName();
  }

  constructor(private readonly authService: AuthService) {}

  logout(): void {
    this.authService.logout();
  }
}
