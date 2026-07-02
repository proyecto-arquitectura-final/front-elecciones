import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { clearStoredSession, isTokenExpired } from '../utils/session.util';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const token = localStorage.getItem('token');
  const tokenType = localStorage.getItem('tokenType') || 'Bearer';

  if (token && isTokenExpired(token)) {
    clearStoredSession();
    if (!req.url.includes('/auth/login')) void router.navigate(['/login']);
  }

  const activeToken = localStorage.getItem('token');
  const request = activeToken
    ? req.clone({ setHeaders: { Authorization: `${tokenType} ${activeToken}` } })
    : req;

  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !req.url.includes('/auth/login')) {
        clearStoredSession();
        void router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
};
