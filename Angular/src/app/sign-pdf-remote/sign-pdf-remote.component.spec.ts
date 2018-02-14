import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SignPdfRemoteComponent } from './sign-pdf-remote.component';

describe('SignPdfRemoteComponent', () => {
  let component: SignPdfRemoteComponent;
  let fixture: ComponentFixture<SignPdfRemoteComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SignPdfRemoteComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SignPdfRemoteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
