import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SignRsaComponent } from './sign-rsa/sign-rsa.component';
import { HomeComponent } from './home/home.component';
import { SignPdfRemoteComponent } from './sign-pdf-remote/sign-pdf-remote.component';

const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'sign-rsa', component: SignRsaComponent },
  { path: 'sign-pdf-remote', component: SignPdfRemoteComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
