import { Component, HostListener } from '@angular/core';
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
  menuOpen = false;

  get nombreUsuario(): string {
    return this.authService.getName();
  }

  get inicialUsuario(): string {
    return this.nombreUsuario.trim().charAt(0).toLocaleUpperCase('es') || 'A';
  }

  constructor(private readonly authService: AuthService) {}

  toggleMenu(): void { this.menuOpen = !this.menuOpen; }
  closeMenu(): void { this.menuOpen = false; }

  @HostListener('document:keydown.escape')
  onEscape(): void { this.closeMenu(); }

  logout(): void {
    this.closeMenu();
    this.authService.logout();
  }
}
