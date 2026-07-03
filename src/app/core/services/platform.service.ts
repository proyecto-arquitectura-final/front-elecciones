import { DOCUMENT } from '@angular/common';
import { Inject, Injectable, signal } from '@angular/core';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';

@Injectable({ providedIn: 'root' })
export class PlatformService {
  private initialized = false;
  private readonly nativeState = signal(Capacitor.isNativePlatform());

  readonly isNative = this.nativeState.asReadonly();
  readonly platform = Capacitor.getPlatform();

  constructor(@Inject(DOCUMENT) private readonly document: Document) {
    this.applyPlatformClasses();
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;
    this.applyPlatformClasses();

    if (!this.nativeState()) return;

    try {
      await StatusBar.setOverlaysWebView({ overlay: false });
      await SplashScreen.hide();
      await CapacitorApp.addListener('backButton', ({ canGoBack }) => {
        if (canGoBack) {
          globalThis.history.back();
        } else {
          void CapacitorApp.minimizeApp();
        }
      });
    } catch (error) {
      console.warn('No fue posible inicializar completamente la capa nativa.', error);
    }
  }

  async syncStatusBar(darkTheme: boolean): Promise<void> {
    if (!this.nativeState()) return;
    try {
      await StatusBar.setBackgroundColor({ color: darkTheme ? '#08111f' : '#f5f7fb' });
      await StatusBar.setStyle({ style: darkTheme ? Style.Light : Style.Dark });
    } catch {
      // La interfaz web continúa funcionando aunque el dispositivo no soporte este ajuste.
    }
  }

  private applyPlatformClasses(): void {
    const root = this.document.documentElement;
    root.classList.toggle('native-platform', this.nativeState());
    root.classList.toggle('web-platform', !this.nativeState());
    root.dataset['platform'] = this.platform;
  }
}
