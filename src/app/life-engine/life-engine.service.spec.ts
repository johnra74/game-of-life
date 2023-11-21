import { TestBed, fakeAsync, tick } from '@angular/core/testing';

import { LifeEngineService } from './life-engine.service';
import { Cell, CommandType, Response } from './life-engine';

class TestLifeEngineService extends LifeEngineService {
  execute(resp: Response<Cell[]|boolean>, callback: () => void): void {
    this.handleResponse(resp, callback);
  }
}

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

  it('When init, Then call back made', fakeAsync(() => {
    const resp: Response<Cell[]|boolean> = {
      cmd: { type: CommandType.INIT },
      success: true,      
      payload: true
    };

    const service:TestLifeEngineService = new TestLifeEngineService();
    let flag: boolean = false;
    service.execute(resp, () => {
      flag = true;      
    });
    tick();
    expect(flag).toBeTrue();
  }));

  it('When fetch next is successful, Then return cells', fakeAsync(() => {
    const resp: Response<Cell[]|boolean> = {
      cmd: { type: CommandType.FETCH_NEXT_GEN },
      success: true,      
      payload: []
    };

    const service:TestLifeEngineService = new TestLifeEngineService();
    service.getBoardObservable()
      .subscribe( {
        next: (board: Cell[]) => {
          expect(board).toBeTruthy();
          expect(board.length).toEqual(0);
        }
      });

    let flag: boolean = false;
    service.execute(resp, () => {
      flag = true;
    });    
    tick();    
  }));
});