import { Component, OnInit, NgZone } from '@angular/core';
import { LacunaWebPKI, CertificateModel, ExceptionModel } from 'web-pki';
import { MessageService, MessageTypes } from '../message.service';
import { ConfigService } from '../config.service';
import { RemoteSignatureService } from '../remote-signature.service';

@Component({
  selector: 'app-sign-pdf-remote',
  templateUrl: './sign-pdf-remote.component.html',
  styleUrls: ['./sign-pdf-remote.component.css']
})
export class SignPdfRemoteComponent implements OnInit {

  private pki: LacunaWebPKI;

  certificates: CertificateModel[];
  selectedCertificate: CertificateModel = null;
  downloadLink: string = null;

  constructor(
    private configService: ConfigService,
    private ngZone: NgZone,
    private messageService: MessageService,
    private remoteSignatureService: RemoteSignatureService
  ) {
    this.pki = new LacunaWebPKI(configService.webPkiLicense);
  }

  ngOnInit(): void {
    this.messageService.add('Initializing Web PKI ...');
    this.pki.init({
      ngZone: this.ngZone,
      ready: this.onWebPkiReady,
      defaultFail: this.onWebPkiFail
    });
  }

  // Use "fat arrow" function otherwise "this" will have unpredictable value!
  private onWebPkiReady = () => {
    this.messageService.add('Web PKI ready, loading certificates ...');
    this.pki.listCertificates().success((certs) => {
      this.messageService.add('Certificates loaded.');
      this.certificates = certs;
    });
  }

  sign(): void {

    if (this.selectedCertificate === null) {
      this.messageService.add('Please choose a certificate!', MessageTypes.Warning);
      return;
    }

    this.downloadLink = null;
    this.messageService.add('Signing ... (step 1/4)');

    // The first thing we'll do is read the certificate encoding with Web PKI
    this.pki.readCertificate({
      thumbprint: this.selectedCertificate.thumbprint
    }).success(certEncoding => {

      this.messageService.add('Signing ... (step 2/4)');

      // Now that we have acquired the certificate's encoding, we'll send that to backend to get the signature algorithm parameters
      this.remoteSignatureService.start(certEncoding).subscribe(sigParams => {

        this.messageService.add('Signing ... (step 3/4)');

        // Having received the signature algorithm parameters from the backend, we perform the signature algorithm computation
        this.pki.signData({
          thumbprint: this.selectedCertificate.thumbprint,
          data: sigParams.toSign,
          digestAlgorithm: sigParams.digestAlgorithmOid
        }).success(signature => {

          this.messageService.add('Signing ... (step 4/4)');

          // We send the algorithm output back to the backend, which will then use its server-side SDK to assemble the signed PDF file
          this.remoteSignatureService.complete(sigParams.processId, signature).subscribe(downloadLink => {

            this.messageService.add('File signed successfully!');
            this.downloadLink = downloadLink;

          });
        });
      });
    });
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
