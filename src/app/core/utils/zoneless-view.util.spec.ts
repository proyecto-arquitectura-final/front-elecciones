import { ChangeDetectorRef } from '@angular/core';
import { of, throwError } from 'rxjs';
import { refreshView } from './zoneless-view.util';

describe('refreshView', () => {
  it('marca la vista después de emitir y completar', () => {
    const cdr = { markForCheck: vi.fn() } as unknown as ChangeDetectorRef;
    const values: number[] = [];

    of(1)
      .pipe(refreshView(cdr))
      .subscribe((value) => values.push(value));

    expect(values).toEqual([1]);
    expect(cdr.markForCheck).toHaveBeenCalledTimes(2);
  });

  it('marca la vista después de un error', () => {
    const cdr = { markForCheck: vi.fn() } as unknown as ChangeDetectorRef;
    const error = new Error('fallo controlado');

    throwError(() => error)
      .pipe(refreshView(cdr))
      .subscribe({ error: (received) => expect(received).toBe(error) });

    expect(cdr.markForCheck).toHaveBeenCalledTimes(1);
  });
});
