import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SignRsaComponent } from './sign-rsa.component';

describe('SignRsaComponent', () => {
  let component: SignRsaComponent;
  let fixture: ComponentFixture<SignRsaComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SignRsaComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SignRsaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
