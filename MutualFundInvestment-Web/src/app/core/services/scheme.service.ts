import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SchemeEnrollmentDto } from '../models/scheme.model';

/**
 * Calls MutualFund.Scheme.API directly — no gateway yet.
 * Used to populate the scheme picker in the New Order modal.
 */
@Injectable({ providedIn: 'root' })
export class SchemeService {
  private readonly api = `${environment.schemeApiUrl}/api/schemeenrollment`;

  constructor(private http: HttpClient) {}

  getApproved(): Observable<SchemeEnrollmentDto[]> {
    return this.http.get<SchemeEnrollmentDto[]>(`${this.api}/approved`);
  }
}
