import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';

/**
 * Root rendered inside <scheme-nav-element>. NavComponent internally
 * router.navigate()s to a scheme-details route, so the custom element
 * itself needs to be the thing hosting <router-outlet>, not NavComponent
 * directly — otherwise navigation has nothing to swap.
 *
 * IMPORTANT: this app is bootstrapped via createApplication() +
 * createCustomElement(), NOT ApplicationRef.bootstrap(). Angular's Router
 * only performs its automatic "initial navigation" from an
 * APP_BOOTSTRAP_LISTENER that fires when the root component is created via
 * bootstrap() — createCustomElement instead attaches the component with
 * ApplicationRef.attachView(), which never triggers that listener. Without
 * this explicit call, the router never navigates to the default 'nav'
 * route and <router-outlet> stays permanently empty (blank page).
 */
@Component({
  selector: 'scheme-nav-root',
  standalone: true,
  imports: [RouterOutlet],
  template: '<router-outlet></router-outlet>'
})
export class SchemeNavRootComponent implements OnInit {
  private readonly router = inject(Router);

  ngOnInit(): void {
    this.router.initialNavigation();
  }
}
