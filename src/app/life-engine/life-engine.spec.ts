import { fakeAsync, tick } from '@angular/core/testing';
import { Cell, Command, CommandType, LifeEngine, Response } from './life-engine';
import { filter, forEach } from 'lodash';

class TestEngine extends LifeEngine {
  constructor(width: number, height: number) {
    super();
    this.boardWidth = width;
    this.boardHeight = height;
  }

  public enableEngine(): void {
    this.isReady = true;
  }

  public addCell(cell: Cell): void {
    this.add(cell);
  }

  public refreshOnce(): void {
    this.runCycle();
  }

  public exists(coordX: number, coordY: number): boolean {
    return this.cellExistsAtCoordinate(coordX, coordY);
  }

  public getNeigborCount(cell: Cell): number {
    return this.neigborCount(cell);
  }
}

describe('Given LifeEngine', () => {
  it('When created, instance exists', () => {
    expect(new LifeEngine()).toBeTruthy();
  });

  it('When cell has less than two live neighbors, Then it dies', () => {
    const engine: TestEngine = new TestEngine(10, 10);
    engine.addCell({ coordinateX: 3, coordinateY: 3 });
    engine.addCell({ coordinateX: 4, coordinateY: 3 });

    engine.refreshOnce();
    const newGeneration:Cell[] = engine.getBoard();
    expect(newGeneration.length).toEqual(0);
  });

  it('When cell has more than three live neighbors, Then it dies', () => {
    const engine: TestEngine = new TestEngine(10, 10);
    engine.addCell({ coordinateX: 1, coordinateY: 2 });
    engine.addCell({ coordinateX: 2, coordinateY: 3 });
    engine.addCell({ coordinateX: 3, coordinateY: 1 });
    engine.addCell({ coordinateX: 3, coordinateY: 2 });
    engine.addCell({ coordinateX: 3, coordinateY: 3 });

    engine.refreshOnce();    
    expect(engine.exists(2, 2)).toBeFalse();
  });

  it('When cell is dead but has three live neighbors, Then it revives', fakeAsync(() => {
    const engine: TestEngine = new TestEngine(10, 10);
    engine.addCell({ coordinateX: 1, coordinateY: 2 });
    engine.addCell({ coordinateX: 2, coordinateY: 3 });
    engine.addCell({ coordinateX: 3, coordinateY: 1 });
    engine.addCell({ coordinateX: 3, coordinateY: 2 });
    engine.addCell({ coordinateX: 3, coordinateY: 3 });

    const deadCell: Cell = { coordinateX: 2, coordinateY: 1 };
    engine.getResponseObservable()
      .subscribe({next: (resp: Response<Cell[]|boolean>) => {
        const cells:Cell[] = resp.payload as Cell[];
        expect(cells.length).toEqual(5);

        const match: Cell[] = 
          filter(cells, 
            (c: Cell) =>
              c.coordinateX == deadCell.coordinateX && c.coordinateY == deadCell.coordinateY);

        expect(match).toBeTruthy();
      }})

    // before run check    
    expect(engine.getNeigborCount(deadCell)).toEqual(3);
    expect(engine.exists(deadCell.coordinateX, deadCell.coordinateY)).toBeFalse();
    engine.refreshOnce();
    tick(10);    
    expect(engine.getBoard().length).toEqual(5);
    expect(engine.exists(2, 1)).toBeTrue();
    expect(engine.exists(2, 3)).toBeTrue();
    expect(engine.exists(3, 2)).toBeTrue();
    expect(engine.exists(3, 3)).toBeTrue();
    expect(engine.exists(4, 2)).toBeTrue();
  }));

  it('When execute with valid init command, run once', fakeAsync(() => {
    const engine: TestEngine = new TestEngine(10, 10);
    engine.getResponseObservable()
      .subscribe({ next: (resp: Response<Cell[]|boolean>) => {
        expect(resp).toBeTruthy();
        expect(resp.success).toBeTrue();
        expect(resp.payload).toBeTrue();
      }})
    
    const cmd: Command = {type: CommandType.INIT, config: { boardHeight: 10, boardWidth: 10, numberOfLiveCell: 1}};
    engine.execute(cmd);    
    engine.stop();
    tick(250);
  }));

  it('When execute with valid fetch next gen command, run once', fakeAsync(() => {
    const engine: TestEngine = new TestEngine(10, 10);
    engine.getResponseObservable()
      .subscribe({ next: (resp: Response<Cell[]|boolean>) => {
        expect(resp).toBeTruthy();
        expect(resp.success).toBeTrue();
        expect(resp.payload).toBeTruthy();
      }})
    
    const cmd: Command = {type: CommandType.FETCH_NEXT_GEN};
    engine.execute(cmd);    
    engine.stop();
    tick();
  }));

  it('When glider pattern added, board contains pattern', fakeAsync(() => {
    const engine: TestEngine = new TestEngine(10, 10);
    const cmd: Command = {type: CommandType.ADD_PATTERN, pattern: 'glider'};
    engine.execute(cmd);    
    engine.stop();
    tick();
    expect(engine.getPatternInQueue()).toBeTruthy();
  }));

  it('When heavy-weight spaceship pattern added, board contains pattern', fakeAsync(() => {
    const engine: TestEngine = new TestEngine(10, 10);
    const cmd: Command = {type: CommandType.ADD_PATTERN, pattern: 'heavy-weight spaceship'};
    engine.execute(cmd);    
    engine.stop();
    tick();
    expect(engine.getPatternInQueue()).toBeTruthy();
  }));

  it('When light-weight spaceship pattern added, board contains pattern', fakeAsync(() => {
    const engine: TestEngine = new TestEngine(10, 10);
    const cmd: Command = {type: CommandType.ADD_PATTERN, pattern: 'light-weight spaceship'};
    engine.execute(cmd);    
    engine.stop();
    tick();
    expect(engine.getPatternInQueue()).toBeTruthy();
  }));

  it('When middle-weight spaceship pattern added, board contains pattern', fakeAsync(() => {
    const engine: TestEngine = new TestEngine(10, 10);
    const cmd: Command = {type: CommandType.ADD_PATTERN, pattern: 'middle-weight spaceship'};
    engine.execute(cmd);    
    engine.stop();
    tick();
    expect(engine.getPatternInQueue()).toBeTruthy();
  }));

  it('When beacon pattern added, board contains pattern', fakeAsync(() => {
    const engine: TestEngine = new TestEngine(10, 10);
    const cmd: Command = {type: CommandType.ADD_PATTERN, pattern: 'beacon'};
    engine.execute(cmd);    
    engine.stop();
    tick();
    expect(engine.getPatternInQueue()).toBeTruthy();
  }));
});
