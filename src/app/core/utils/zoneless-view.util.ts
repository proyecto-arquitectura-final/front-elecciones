import { ChangeDetectorRef } from '@angular/core';
import { MonoTypeOperatorFunction, Observable } from 'rxjs';

/**
 * Notifica a Angular que debe renderizar de nuevo después de que un observable
 * actualice el estado de un componente. Es necesario en el modo zoneless de
 * Angular 21 cuando la información llega desde callbacks de RxJS.
 */
export function refreshView<T>(changeDetectorRef: ChangeDetectorRef): MonoTypeOperatorFunction<T> {
  return (source: Observable<T>) =>
    new Observable<T>((subscriber) => {
      const subscription = source.subscribe({
        next: (value) => {
          try {
            subscriber.next(value);
          } finally {
            changeDetectorRef.markForCheck();
          }
        },
        error: (error) => {
          try {
            subscriber.error(error);
          } finally {
            changeDetectorRef.markForCheck();
          }
        },
        complete: () => {
          try {
            subscriber.complete();
          } finally {
            changeDetectorRef.markForCheck();
          }
        },
      });

      return () => subscription.unsubscribe();
    });
}
