import { filter, forEach } from 'lodash';
import { Observable, Subject } from 'rxjs';

export const PIXEL_SZ: number = 10;

export interface Cell {
  coordinateX: number;
  coordinateY: number;
}

export interface Configuration {
  boardWidth: number;
  boardHeight: number;
  numberOfLiveCell: number;
}

export enum CommandType {
  INIT, CYCLE_REFRESHED, FETCH_NEXT_GEN, ADD_PATTERN
}

export interface Command {
  type: CommandType;
  config?: Configuration;
  pattern?: string;
}

export interface Response<T> {
  cmd: Command;
  success: boolean;
  payload: T;
}

export class LifeEngine {
  protected boardWidth: number;
  protected boardHeight: number;
  protected isReady: boolean;

  private centerCoordX: number;
  private centerCoordY: number;
  private currentGeneration: Cell[];
  private responseSubject: Subject<Response<Cell[]|boolean>>;
  private patternToAdd: Cell[];  

  constructor() {
    this.isReady = false;
    this.currentGeneration = [];
    this.patternToAdd = [];
    this.responseSubject = new Subject<Response<Cell[]|boolean>>();
  }

  public execute(cmd: Command): void {
    switch(cmd.type) {
      case CommandType.INIT:
        this.isReady = true;
        if (typeof cmd.config !== 'undefined' ) {
          this.init(cmd.config);
        }
        this.responseSubject.next({cmd: cmd, success: true, payload: true} as Response<boolean>);
        this.run();
        break;
      case CommandType.ADD_PATTERN:
        if (typeof cmd.pattern !== 'undefined') {
          this.loadPattern(cmd.pattern);
          this.responseSubject.next({cmd: cmd, success: true, payload: true} as Response<boolean>);
        }
        break;        
      case CommandType.FETCH_NEXT_GEN:
        this.responseSubject.next({cmd: cmd, success: true, payload: this.currentGeneration } as Response<Cell[]>);
        break;
      default:
        break;        
    }
  }

  public getResponseObservable(): Observable<Response<Cell[]|boolean>> {
    return this.responseSubject.asObservable();
  }

  public getBoard(): Cell[] {
    return this.currentGeneration;
  }

  public getPatternInQueue(): Cell[] {
    return this.patternToAdd;
  }

  public stop(): void {
    this.isReady = false;
  }

  protected add(cell: Cell): void {
    this.currentGeneration.push(cell);
  }

  protected runCycle(): void {
    const startTime: Date = new Date();
    const nextGeneration: Cell[] = [];
    for( let x: number = 0; x <= this.boardWidth; x++) {
      for( let y: number = 0; y <= this.boardHeight; y++) {
        if (this.cellExistsAtCoordinate(x, y)) {
          const livingCell: Cell = {coordinateX: x, coordinateY: y};
          const neigborCount: number = this.neigborCount(livingCell);
          if ( neigborCount == 2 || neigborCount == 3 ) {
            // Any live cell with two or three live neighbours lives on to the next generation.
            nextGeneration.push(livingCell);
          } else {        
            // Any live cell with fewer than two live neighbours dies, as if by underpopulation.
            // Any live cell with more than three live neighbours dies, as if by overpopulation.
          }
        } else {
          const deadCell: Cell = {coordinateX: x, coordinateY: y};
          const neigborCount: number = this.neigborCount(deadCell);
          if (neigborCount == 3) {
            // Any dead cell with exactly three live neighbours comes to life
            nextGeneration.push(deadCell);
          }
        }
      }
    }

    this.currentGeneration = [...nextGeneration, ...this.patternToAdd];
    this.patternToAdd = [];

    this.responseSubject.next({ 
      cmd: { type: CommandType.CYCLE_REFRESHED },
      success: true,
      payload: this.currentGeneration
    } as Response<Cell[]>);      
    let markerTime: Date = new Date();
    console.debug('run duration (ms): ' + (markerTime.getTime() - startTime.getTime()));
  }

  protected neigborCount(cell: Cell): number {
    let neighborCount: number = 0;

    for (let x: number = -1; x < 2; x++) {
      for (let y: number = -1; y < 2; y++) {
        if (x == 0 && y == 0) {
          // skip self
          continue;
        }

        // calculate possible neighbor
        const coorX: number = cell.coordinateX + x;
        const coorY: number = cell.coordinateY + y;

        if (this.cellExistsAtCoordinate(coorX, coorY)) {
          neighborCount++;
        }
      }
    }

    return neighborCount;
  }

  protected cellExistsAtCoordinate(coorX: number, coorY: number): boolean {
    const match: Cell[] = 
          filter(this.currentGeneration, 
            (c: Cell) => c.coordinateX == coorX && c.coordinateY == coorY);
    return typeof match !== 'undefined' && match.length > 0;
  }

  private init(cfg: Configuration): void {
    this.currentGeneration = [];    
    this.boardWidth = Math.round(cfg.boardWidth / PIXEL_SZ);
    this.boardHeight = Math.round(cfg.boardHeight / PIXEL_SZ);
    this.centerCoordX = Math.round(this.boardWidth / 2);
    this.centerCoordY = Math.round(this.boardHeight / 2);

    for(let i: number = 0; i < cfg.numberOfLiveCell; i++) {
      do {
        let coordX: number = this.getRandomNumber(this.boardWidth) + 1;
        let coordY: number = this.getRandomNumber(this.boardHeight) + 1;
        if (this.cellExistsAtCoordinate(coordX, coordY)) {
          // life already exists, try again
        } else {
          const cell: Cell = {
            coordinateX: coordX,
            coordinateY: coordY
          };

          this.currentGeneration.push(cell);
          break;
        }
      } while (true);
    }
  }

  private run(): void {
    let inProg: boolean = false;
    let startTime: Date = new Date();
    let counter: number = 1;
    let diff: number = 0;
    const intervalId = setInterval(() => {
      if (this.isReady) {
        if (inProg) {
          console.debug('prior run did not complete, skipping run');
        } else {
          inProg = true;
          this.runCycle();
          inProg = false;
        }
        let markerTime: Date = new Date();
        diff = (markerTime.getTime() - startTime.getTime());      
        console.debug('average run cycle (ms):' + Math.round(diff/counter++));
        if (diff > 250) diff = 250;
      } else {
        clearInterval(intervalId);
      }
    }, 250 - diff);
  }

  private getRandomNumber(max: number): number {
    return Math.floor(Math.random() * max);
  }
  
  private loadPattern(pattern: string): void {
    switch(pattern) {
      case 'glider':
        this.loadGlider();
        break;
      case 'heavy-weight spaceship':
        this.loadHWSS();
        break;
      case 'light-weight spaceship':
        this.loadLWSS();
        break;
      case 'middle-weight spaceship':
        this.loadMWSS();
        break;
      case 'beacon':
        this.loadBeacon();
        break;      
      default:
        break;
    }
  }

  private loadBeacon(): void {
    this.patternToAdd = [];
    this.patternToAdd.push({coordinateX: this.centerCoordX-2, coordinateY: this.centerCoordY-2});
    this.patternToAdd.push({coordinateX: this.centerCoordX-1, coordinateY: this.centerCoordY-2});
    this.patternToAdd.push({coordinateX: this.centerCoordX-2, coordinateY: this.centerCoordY-1});
    this.patternToAdd.push({coordinateX: this.centerCoordX-1, coordinateY: this.centerCoordY-1});

    this.patternToAdd.push({coordinateX: this.centerCoordX, coordinateY: this.centerCoordY});
    this.patternToAdd.push({coordinateX: this.centerCoordX+1, coordinateY: this.centerCoordY});
    this.patternToAdd.push({coordinateX: this.centerCoordX, coordinateY: this.centerCoordY+1});
    this.patternToAdd.push({coordinateX: this.centerCoordX+1, coordinateY: this.centerCoordY+1}); 
  }

  private loadGlider(): void {
    this.patternToAdd = [];
    this.patternToAdd.push({coordinateX: this.centerCoordX-1, coordinateY: this.centerCoordY});
    this.patternToAdd.push({coordinateX: this.centerCoordX, coordinateY: this.centerCoordY+1});
    this.patternToAdd.push({coordinateX: this.centerCoordX+1, coordinateY: this.centerCoordY-1});
    this.patternToAdd.push({coordinateX: this.centerCoordX+1, coordinateY: this.centerCoordY});
    this.patternToAdd.push({coordinateX: this.centerCoordX+1, coordinateY: this.centerCoordY+1});   
  }

  private loadLWSS(): void {    
    this.patternToAdd = [];
    this.patternToAdd.push({coordinateX: this.centerCoordX-1, coordinateY: this.centerCoordY});
    this.patternToAdd.push({coordinateX: this.centerCoordX-1, coordinateY: this.centerCoordY+2});
    this.patternToAdd.push({coordinateX: this.centerCoordX, coordinateY: this.centerCoordY-1});
    this.patternToAdd.push({coordinateX: this.centerCoordX+1, coordinateY: this.centerCoordY-1});
    this.patternToAdd.push({coordinateX: this.centerCoordX+2, coordinateY: this.centerCoordY-1});
    this.patternToAdd.push({coordinateX: this.centerCoordX+2, coordinateY: this.centerCoordY+2});
    this.patternToAdd.push({coordinateX: this.centerCoordX+3, coordinateY: this.centerCoordY-1});
    this.patternToAdd.push({coordinateX: this.centerCoordX+3, coordinateY: this.centerCoordY});
    this.patternToAdd.push({coordinateX: this.centerCoordX+3, coordinateY: this.centerCoordY+1});    
  }

  private loadMWSS(): void {
    this.patternToAdd = [];
    this.patternToAdd.push({coordinateX: this.centerCoordX-2, coordinateY: this.centerCoordY-1});
    this.patternToAdd.push({coordinateX: this.centerCoordX-2, coordinateY: this.centerCoordY+1});
    this.patternToAdd.push({coordinateX: this.centerCoordX-1, coordinateY: this.centerCoordY+2});
    this.patternToAdd.push({coordinateX: this.centerCoordX, coordinateY: this.centerCoordY-2});
    this.patternToAdd.push({coordinateX: this.centerCoordX, coordinateY: this.centerCoordY+2});
    this.patternToAdd.push({coordinateX: this.centerCoordX+1, coordinateY: this.centerCoordY+2});
    this.patternToAdd.push({coordinateX: this.centerCoordX+2, coordinateY: this.centerCoordY-1});
    this.patternToAdd.push({coordinateX: this.centerCoordX+2, coordinateY: this.centerCoordY+2});
    this.patternToAdd.push({coordinateX: this.centerCoordX+3, coordinateY: this.centerCoordY});
    this.patternToAdd.push({coordinateX: this.centerCoordX+3, coordinateY: this.centerCoordY+1});
    this.patternToAdd.push({coordinateX: this.centerCoordX+3, coordinateY: this.centerCoordY+2});
  }

  private loadHWSS(): void {
    this.patternToAdd = [];
    this.patternToAdd.push({coordinateX: this.centerCoordX-2, coordinateY: this.centerCoordY-1});
    this.patternToAdd.push({coordinateX: this.centerCoordX-2, coordinateY: this.centerCoordY+1});
    this.patternToAdd.push({coordinateX: this.centerCoordX-1, coordinateY: this.centerCoordY+2});
    this.patternToAdd.push({coordinateX: this.centerCoordX, coordinateY: this.centerCoordY-2});
    this.patternToAdd.push({coordinateX: this.centerCoordX, coordinateY: this.centerCoordY+2});
    this.patternToAdd.push({coordinateX: this.centerCoordX+1, coordinateY: this.centerCoordY-2});
    this.patternToAdd.push({coordinateX: this.centerCoordX+1, coordinateY: this.centerCoordY+2});
    this.patternToAdd.push({coordinateX: this.centerCoordX+2, coordinateY: this.centerCoordY+2});
    this.patternToAdd.push({coordinateX: this.centerCoordX+3, coordinateY: this.centerCoordY-1});
    this.patternToAdd.push({coordinateX: this.centerCoordX+3, coordinateY: this.centerCoordY+2});
    this.patternToAdd.push({coordinateX: this.centerCoordX+4, coordinateY: this.centerCoordY});
    this.patternToAdd.push({coordinateX: this.centerCoordX+4, coordinateY: this.centerCoordY+1});
    this.patternToAdd.push({coordinateX: this.centerCoordX+4, coordinateY: this.centerCoordY+2});
  }
}
