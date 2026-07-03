import { DOCUMENT } from '@angular/common';
import { computed, Inject, Injectable, signal } from '@angular/core';

export type AppTheme = 'light' | 'dark';

const THEME_STORAGE_KEY = 'elecciones.theme';
const FONT_SCALE_STORAGE_KEY = 'elecciones.fontScale';
const FONT_SCALES = [0.9, 1, 1.125, 1.25] as const;
const DEFAULT_FONT_SCALE_INDEX = 1;

@Injectable({ providedIn: 'root' })
export class AppearanceService {
  private readonly themeState = signal<AppTheme>(this.readInitialTheme());
  private readonly fontScaleIndexState = signal<number>(this.readInitialFontScaleIndex());

  readonly theme = this.themeState.asReadonly();
  readonly isDark = computed(() => this.themeState() === 'dark');
  readonly fontScale = computed(() => FONT_SCALES[this.fontScaleIndexState()]);
  readonly fontSizeLabel = computed(() => `${Math.round(this.fontScale() * 100)}%`);
  readonly canDecreaseFont = computed(() => this.fontScaleIndexState() > 0);
  readonly canIncreaseFont = computed(() => this.fontScaleIndexState() < FONT_SCALES.length - 1);

  constructor(@Inject(DOCUMENT) private readonly document: Document) {
    this.applyPreferences();
  }

  toggleTheme(): void {
    this.themeState.update(theme => theme === 'dark' ? 'light' : 'dark');
    this.persistAndApply();
  }

  increaseFontSize(): void {
    if (!this.canIncreaseFont()) {
      return;
    }
    this.fontScaleIndexState.update(index => index + 1);
    this.persistAndApply();
  }

  decreaseFontSize(): void {
    if (!this.canDecreaseFont()) {
      return;
    }
    this.fontScaleIndexState.update(index => index - 1);
    this.persistAndApply();
  }

  resetFontSize(): void {
    this.fontScaleIndexState.set(DEFAULT_FONT_SCALE_INDEX);
    this.persistAndApply();
  }

  private persistAndApply(): void {
    this.safeSetStorage(THEME_STORAGE_KEY, this.themeState());
    this.safeSetStorage(FONT_SCALE_STORAGE_KEY, String(this.fontScaleIndexState()));
    this.applyPreferences();
  }

  private applyPreferences(): void {
    const root = this.document.documentElement;
    const theme = this.themeState();
    root.dataset['theme'] = theme;
    root.dataset['fontScale'] = String(this.fontScaleIndexState());
    root.style.setProperty('--app-font-scale', String(this.fontScale()));
    root.style.colorScheme = theme;

    const themeColor = this.document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    themeColor?.setAttribute('content', theme === 'dark' ? '#08111f' : '#f5f7fb');
  }

  private readInitialTheme(): AppTheme {
    const stored = this.safeGetStorage(THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') {
      return stored;
    }

    try {
      return globalThis.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  }

  private readInitialFontScaleIndex(): number {
    const stored = this.safeGetStorage(FONT_SCALE_STORAGE_KEY);
    if (stored === null || stored.trim() === '') {
      return DEFAULT_FONT_SCALE_INDEX;
    }

    const raw = Number(stored);
    return Number.isInteger(raw) && raw >= 0 && raw < FONT_SCALES.length
      ? raw
      : DEFAULT_FONT_SCALE_INDEX;
  }

  private safeGetStorage(key: string): string | null {
    try {
      return globalThis.localStorage?.getItem(key) ?? null;
    } catch {
      return null;
    }
  }

  private safeSetStorage(key: string, value: string): void {
    try {
      globalThis.localStorage?.setItem(key, value);
    } catch {
      // La aplicación sigue funcionando aunque el navegador bloquee localStorage.
    }
  }
}
