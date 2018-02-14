import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { SignatureAlgorithmParams } from './signature-algorithm-params';
import { map } from 'rxjs/operators';

@Injectable()
export class RemoteSignatureService {

  private signatureApiUrl = 'https://webpki.lacunasoftware.com/api/Signature';

  constructor(private http: HttpClient) {
  }

  start(certEncoding: string): Observable<SignatureAlgorithmParams> {
    return this.http.post<SignatureAlgorithmParams>(`${this.signatureApiUrl}/Start`, {
      certificate: certEncoding
    });
  }

  complete(processId: string, signature: string): Observable<string> {
    return this.http.post(`${this.signatureApiUrl}/Complete`, {
      processId: processId,
      signature: signature
    }).pipe(
      map(x => `${this.signatureApiUrl}/${processId}`)
    );
  }
}
