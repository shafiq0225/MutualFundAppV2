import { Injectable } from '@angular/core';
import { LocationStrategy, LocationChangeListener } from '@angular/common';

/**
 * A LocationStrategy that keeps route state entirely in memory instead of
 * touching window.history / the address bar.
 *
 * Why this exists: <scheme-nav-element> has its own internal router so
 * NavComponent -> SchemeDetailsComponent navigation keeps working when
 * embedded in the shell. But the DEFAULT Angular LocationStrategy
 * (PathLocationStrategy) calls the real browser history API — which would
 * fight with the shell's own router over control of the URL. This strategy
 * makes the embedded router self-contained: it can navigate freely without
 * ever touching the page the shell is actually showing.
 */
@Injectable()
export class MemoryLocationStrategy extends LocationStrategy {
  private internalPath = '';
  private internalState: unknown = null;
  private readonly popStateListeners: LocationChangeListener[] = [];

  override path(): string {
    return this.internalPath;
  }

  override prepareExternalUrl(internal: string): string {
    return internal;
  }

  override pushState(state: unknown, _title: string, url: string, queryParams: string): void {
    this.internalPath = url + (queryParams ? '?' + queryParams : '');
    this.internalState = state;
  }

  override replaceState(state: unknown, _title: string, url: string, queryParams: string): void {
    this.internalPath = url + (queryParams ? '?' + queryParams : '');
    this.internalState = state;
  }

  override forward(): void {
    // no-op: no real history stack to move through
  }

  override back(): void {
    // no-op: no real history stack to move through
  }

  override onPopState(fn: LocationChangeListener): void {
    this.popStateListeners.push(fn);
  }

  override getBaseHref(): string {
    return '';
  }

  override getState(): unknown {
    return this.internalState;
  }
}