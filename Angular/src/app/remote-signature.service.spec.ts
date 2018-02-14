import { TestBed, inject } from '@angular/core/testing';

import { RemoteSignatureService } from './remote-signature.service';

describe('RemoteSignatureService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [RemoteSignatureService]
    });
  });

  it('should be created', inject([RemoteSignatureService], (service: RemoteSignatureService) => {
    expect(service).toBeTruthy();
  }));
});
