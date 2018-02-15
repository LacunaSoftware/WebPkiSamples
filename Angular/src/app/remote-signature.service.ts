import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { SignatureAlgorithmParams } from './signature-algorithm-params';
import { map, catchError, tap } from 'rxjs/operators';
import { MessageService } from './message.service';

@Injectable()
export class RemoteSignatureService {

  private signatureApiUrl = 'https://webpki.lacunasoftware.com/api/signature';

  constructor(
    private http: HttpClient,
    private messageService: MessageService
  ) {
  }

  start(certEncoding: string): Observable<SignatureAlgorithmParams> {
    return this.http
      .post<SignatureAlgorithmParams>(`${this.signatureApiUrl}/start`, {
        certificate: certEncoding
      })
      .pipe(
        tap(r => { }, err => this.messageService.add(`Error starting signature: ${this.getErrorMessage(err)}`))
      );
  }

  complete(processId: string, signature: string): Observable<string> {
    return this.http
      .post(`${this.signatureApiUrl}/complete`, {
        processId: processId,
        signature: signature
      })
      .pipe(
        tap(r => { }, err => this.messageService.add(`Error completing signature: ${this.getErrorMessage(err)}`)),
        map(x => `${this.signatureApiUrl}/${processId}`)
      );
  }

  private getErrorMessage(err: any): string {
    if (err instanceof HttpErrorResponse) {
      let response = err as HttpErrorResponse;
      if (response.error && response.error.message) {
        return response.error.message;
      } else {
        return response.message;
      }
    } else {
      return '(unknown error)';
    }
  }
}
