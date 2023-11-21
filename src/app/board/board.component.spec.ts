import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';

import { BoardComponent } from './board.component';
import { FormsModule } from '@angular/forms';
import { LifeEngineService } from '../life-engine/life-engine.service';
import { Subject } from 'rxjs';
import { Cell, Configuration } from '../life-engine/life-engine';
import { BsModalService, ModalModule } from 'ngx-bootstrap/modal';

describe('Given BoardComponent', () => {
  let component: BoardComponent;
  let fixture: ComponentFixture<BoardComponent>;

  let boardObservable: Subject<Cell[]> = new Subject<Cell[]>();
  let mockLifeEngineService: LifeEngineService = 
    jasmine.createSpyObj('LifeEngineService', {
      'getBoardObservable': boardObservable.asObservable(),
      'init': null,
      'add': null
    });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BoardComponent ],
      imports: [FormsModule, ModalModule],
      providers: [
        BsModalService,
        { provide: LifeEngineService, useValue: mockLifeEngineService }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BoardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('When constructed, Then it is created', () => {
    expect(component).toBeTruthy();
  });

  it('When update is called, Then service is initialized', () => {
    const cfg: Configuration = { 
      boardWidth: component.width,
      boardHeight: component.height,
      numberOfLiveCell: component.lifeCount
    }

    component.start();
    expect(mockLifeEngineService.init).toHaveBeenCalledOnceWith(cfg);
  });

  it('When addPattern is called, Then service add pattern', () => {
    component.pattern = 'foo';
    component.addPattern();
    expect(mockLifeEngineService.add).toHaveBeenCalledOnceWith('foo');
  });

  it('When board complete next gen cycle, Then board is rendered', fakeAsync(() => {
    const cells: Cell[] = [];
    cells.push({coordinateX: 10, coordinateY: 10});
    boardObservable.next(cells);
    tick();
    expect(component.hasBoardChange()).toBeTrue();
  }));

  it('When board complete next gen cycle, Then board is rendered', fakeAsync(() => {
    component.ngAfterViewInit();   
    tick(50);
    expect(component.getIntervalId()).toBeTruthy();
    clearInterval(component.getIntervalId());
  }));
});
