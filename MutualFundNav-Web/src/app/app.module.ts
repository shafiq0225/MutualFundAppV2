import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

import { AppComponent }             from './app.component';
import { MfNavMonitorComponent } from './features/monitor/mfnav-monitor.component';

@NgModule({
  declarations: [
    AppComponent,
    MfNavMonitorComponent
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
