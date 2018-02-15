import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { AppComponent } from './app.component';
import { SignRsaComponent } from './sign-rsa/sign-rsa.component';
import { AppRoutingModule } from './/app-routing.module';
import { HomeComponent } from './home/home.component';
import { MessageService } from './message.service';
import { MessagesComponent } from './messages/messages.component';
import { ConfigService } from './config.service';
import { SignPdfRemoteComponent } from './sign-pdf-remote/sign-pdf-remote.component';
import { RemoteSignatureService } from './remote-signature.service';
import { NavMenuComponent } from './nav-menu/nav-menu.component';


@NgModule({
  declarations: [
    AppComponent,
    SignRsaComponent,
    HomeComponent,
    MessagesComponent,
    SignPdfRemoteComponent,
    NavMenuComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    AppRoutingModule,
    HttpClientModule
  ],
  providers: [
    ConfigService,
    MessageService,
    RemoteSignatureService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
