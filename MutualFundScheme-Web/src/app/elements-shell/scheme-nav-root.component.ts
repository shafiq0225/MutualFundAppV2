import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/**
 * Root rendered inside <scheme-nav-element>. NavComponent internally
 * router.navigate()s to a scheme-details route, so the custom element
 * itself needs to be the thing hosting <router-outlet>, not NavComponent
 * directly — otherwise navigation has nothing to swap.
 */
@Component({
  selector: 'scheme-nav-root',
  standalone: true,
  imports: [RouterOutlet],
  template: '<router-outlet></router-outlet>'
})
export class SchemeNavRootComponent {}
