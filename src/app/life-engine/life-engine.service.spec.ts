import { TestBed, fakeAsync, tick } from '@angular/core/testing';

import { LifeEngineService } from './life-engine.service';
import { Cell, Configuration } from './life-engine';


describe('Given CoreService', () => {
  let service: LifeEngineService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LifeEngineService);
  });

  it('When created, instance exists', () => {
    expect(service).toBeTruthy();
    expect(service.getBoardObservable()).toBeTruthy();
    expect(service.getReadyObservable()).toBeTruthy();
  });

  it('When init, return true', fakeAsync(() => {
    service.getReadyObservable()
      .subscribe({
        next: (flag) => {
          expect(flag).toBeTrue();
        }
      });

    service.init({
      boardWidth: 10,
      boardHeight: 10,
      numberOfLiveCell: 10
    });
    tick();
  }));

  it('When pattern added successfully, return true ', () => {
    service.getPatternAddedObservable()
      .subscribe({
        next: (flag) => {
          expect(flag).toBeTrue();
        }
      });

    service.add('glider');
  });

});