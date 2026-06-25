import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

import { AppComponent }             from './app.component';
import { DashboardComponent }       from './features/dashboard/dashboard.component';
import { NavHistoryComponent }      from './features/nav-history/nav-history.component';
import { JobLogsComponent }         from './features/job-logs/job-logs.component';
import { MarketHolidaysComponent }  from './features/market-holidays/market-holidays.component';
import { KafkaEventsComponent }     from './features/kafka-events/kafka-events.component';
import { TabLabelPipe }             from './core/pipes/tab-label.pipe';

@NgModule({
  declarations: [
    AppComponent,
    DashboardComponent,
    NavHistoryComponent,
    JobLogsComponent,
    MarketHolidaysComponent,
    KafkaEventsComponent,
    TabLabelPipe
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    FormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
