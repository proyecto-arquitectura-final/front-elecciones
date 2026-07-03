import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([])]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render the router outlet and accessibility controls', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('router-outlet')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.accessibility-toolbar')).toBeTruthy();
    expect(fixture.nativeElement.querySelectorAll('.accessibility-toolbar button').length).toBe(4);
    const promo = fixture.nativeElement.querySelector('.mobile-app-promo');
    expect(promo).toBeTruthy();
    const downloadLinks = promo.querySelectorAll('a[download="sistema-electoral.apk"]');
    expect(downloadLinks.length).toBe(1);
    expect(downloadLinks[0]?.getAttribute('href')).toBe('/downloads/sistema-electoral.apk');
    expect(downloadLinks[0]?.classList.contains('mobile-app-promo__content')).toBe(true);
    expect(promo.querySelector('.mobile-app-promo__icon')).toBeTruthy();
    expect(promo.querySelector('.mobile-app-promo__download')).toBeFalsy();
  });
});
