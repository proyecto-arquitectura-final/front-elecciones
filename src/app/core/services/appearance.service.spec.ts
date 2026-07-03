import { TestBed } from '@angular/core/testing';
import { AppearanceService } from './appearance.service';

describe('AppearanceService', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.style.removeProperty('--app-font-scale');
    TestBed.configureTestingModule({});
  });

  it('should toggle and persist the night mode', () => {
    const service = TestBed.inject(AppearanceService);
    const initialTheme = service.theme();

    service.toggleTheme();

    expect(service.theme()).not.toBe(initialTheme);
    expect(document.documentElement.dataset['theme']).toBe(service.theme());
    expect(localStorage.getItem('elecciones.theme')).toBe(service.theme());
  });

  it('should increase, decrease and reset the font size', () => {
    const service = TestBed.inject(AppearanceService);

    service.increaseFontSize();
    expect(service.fontSizeLabel()).toBe('113%');

    service.decreaseFontSize();
    expect(service.fontSizeLabel()).toBe('100%');

    service.increaseFontSize();
    service.resetFontSize();
    expect(service.fontSizeLabel()).toBe('100%');
    expect(document.documentElement.style.getPropertyValue('--app-font-scale')).toBe('1');
  });
});
