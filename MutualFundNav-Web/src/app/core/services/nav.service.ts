import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { NavFileSummary, TriggerResult, TargetDateResult, LatestNavResult } from '../models/nav-file.model';

@Injectable({ providedIn: 'root' })
export class NavService {
  private base = `${environment.apiBaseUrl}/api/nav`;

  constructor(private http: HttpClient) {}

  getLatest(): Observable<LatestNavResult> {
    return this.http.get<LatestNavResult>(`${this.base}/latest`).pipe(catchError(this.handle));
  }

  getTargetDate(): Observable<TargetDateResult> {
    return this.http.get<TargetDateResult>(`${this.base}/target-date`).pipe(catchError(this.handle));
  }

  getDates(): Observable<string[]> {
    return this.http.get<string[]>(`${this.base}/dates`).pipe(catchError(this.handle));
  }

  getHistory(): Observable<NavFileSummary[]> {
    return this.http.get<NavFileSummary[]>(`${this.base}/history`).pipe(catchError(this.handle));
  }

  trigger(): Observable<TriggerResult> {
    return this.http.post<TriggerResult>(`${this.base}/trigger`, {}).pipe(catchError(this.handle));
  }

  triggerForDate(date: string): Observable<TriggerResult> {
    return this.http.post<TriggerResult>(`${this.base}/trigger/${date}`, {}).pipe(catchError(this.handle));
  }

  private handle(err: HttpErrorResponse) {
    const message = err.error?.message ?? err.error?.error ?? err.message ?? 'Unknown error';
    return throwError(() => ({ status: err.status, message, detail: JSON.stringify(err.error) }));
  }
}
