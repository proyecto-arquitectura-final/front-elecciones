import { Component, ChangeDetectorRef, inject } from '@angular/core';
import { refreshView } from '../../core/utils/zoneless-view.util';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private readonly cdr = inject(ChangeDetectorRef);
  correo = '';
  contrasena = '';
  error = false;
  mensajeError = '';
  cargando = false;
  rolSeleccionado = '';

  constructor(
    private readonly router: Router,
    private readonly authService: AuthService,
  ) {}

  seleccionarRol(rol: 'admin' | 'analista') {
    this.rolSeleccionado = rol;
    this.error = false;

    if (rol === 'admin') {
      this.correo = 'admin@elecciones.gov.co';
      this.contrasena = 'admin1234';
    } else {
      this.correo = 'analista@elecciones.gov.co';
      this.contrasena = 'analista1234';
    }
  }

  ingresar() {
    if (!this.correo || !this.contrasena) {
      this.error = true;
      this.mensajeError = 'Por favor ingresa tu correo y contraseña.';
      return;
    }

    this.error = false;
    this.cargando = true;

    this.authService
      .login({ email: this.correo, password: this.contrasena })
      .pipe(refreshView(this.cdr))
      .subscribe({
        next: (response) => {
          this.cargando = false;
          const destino =
            response.data.role === 'ANALISTA' ? '/analista/dashboard' : '/admin/dashboard';
          this.router.navigate([destino]);
        },
        error: (err) => {
          this.cargando = false;
          this.error = true;
          this.mensajeError =
            err?.status === 0
              ? 'No se pudo conectar con el backend. Verifica que Spring Boot esté corriendo en el puerto 8080.'
              : 'Credenciales inválidas o usuario sin permiso.';
          console.error('Error login:', err);
        },
      });
  }
}
