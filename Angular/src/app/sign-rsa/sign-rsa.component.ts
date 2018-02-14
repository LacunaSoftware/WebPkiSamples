import { Component, OnInit, NgZone } from '@angular/core';
import { LacunaWebPKI, CertificateModel, ExceptionModel } from 'web-pki';
import { MessageService } from '../message.service';
import * as shajs from 'sha.js';
import { ConfigService } from '../config.service';

@Component({
  selector: 'app-sign-rsa',
  templateUrl: './sign-rsa.component.html',
  styleUrls: ['./sign-rsa.component.css']
})
export class SignRsaComponent implements OnInit {

  private pki: LacunaWebPKI;

  certificates: CertificateModel[];
  selectedCertificate: CertificateModel = null;
  textToSign: string = 'Hello, World!';

  constructor(private configService: ConfigService, private ngZone: NgZone, private messageService: MessageService) {
    this.pki = new LacunaWebPKI(configService.webPkiLicense);
  }

  ngOnInit(): void {
    this.pki.init({
      ngZone: this.ngZone,
      ready: this.onWebPkiReady,
      defaultFail: this.onWebPkiFail
    });
  }

  // Use "fat arrow" function otherwise "this" will have unpredictable value!
  private onWebPkiReady = () => {
    this.pki.listCertificates().success((certs) => {
      this.certificates = certs;
    });
  }

  signData(): void {

    if (!this.validateFields()) {
      return;
    }

    // Get ASCII encoding of text in Base64 format
    let data = btoa(this.textToSign);
    this.messageService.add(`Data: ${data}`);

    this.pki.signData({
      data: data,
      digestAlgorithm: 'sha256',
      thumbprint: this.selectedCertificate.thumbprint
    }).success((s) => {
      this.messageService.add(`Signature: ${s}`);
    });
  }

  signHash(): void {

    if (!this.validateFields()) {
      return;
    }

    // Get SHA-256 digest of ASCII encoding of text in Base64 format
    let hash = shajs('sha256').update(btoa(this.textToSign), 'base64').digest('base64');
    this.messageService.add(`Hash: ${hash}`);

    this.pki.signHash({
      hash: hash,
      digestAlgorithm: 'sha256',
      thumbprint: this.selectedCertificate.thumbprint
    }).success((s) => {
      this.messageService.add(`Signature: ${s}`);
    });
  }

  private validateFields(): boolean {

    if (this.selectedCertificate === null) {
      this.messageService.add('Please choose a certificate');
      return false;
    }

    if (this.textToSign === '') {
      this.messageService.add('Please type a text to sign');
      return false;
    }

    return true;
  }

  // Use "fat arrow" function otherwise "this" will have unpredictable value!
  private onWebPkiFail = (ex: ExceptionModel) => {
    if (console) {
      console.log(`Web PKI error ${ex.code}: ${ex.message}`);
      console.log(ex);
    }
    this.messageService.add(`Web PKI error: ${ex.message}`);
  }
}
