import { Injectable } from '@angular/core';
import { LifeEngine, Configuration, CommandType, Command, Cell, Response } from './life-engine';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LifeEngineService {

  protected patternAddedSubject: Subject<boolean>;
  protected readySubject: Subject<boolean>;
  protected boardSubject: Subject<Cell[]>;

  private commandSubject: Subject<Command>;
  private worker: Worker;

  constructor() {
    this.readySubject = new Subject<boolean>();
    this.patternAddedSubject = new Subject<boolean>();
    this.boardSubject = new Subject<Cell[]>();
    this.commandSubject = new Subject<Command>();

    if (typeof Worker !== 'undefined') {
      this.worker = new Worker(new URL('./life-engine.worker', import.meta.url));
      this.worker.onmessage = ({ data }) => {
        this.handleResponse(data, () => {
          this.worker.postMessage({type: CommandType.FETCH_NEXT_GEN});
        });
      }

      this.commandSubject.asObservable()
        .subscribe({
          next: (cmd: Command) => {
            this.worker.postMessage(cmd);
          },
          error: (e) => console.log('error sending command to worker:' + e),
          complete: () => console.log('completed worker command call')
        });        
    } else {      
      const engine: LifeEngine = new LifeEngine();
      engine.getResponseObservable()
        .subscribe({
          next: (resp: Response<Cell[]|boolean>) => {
            this.handleResponse(resp, () => {
              engine.execute({type: CommandType.FETCH_NEXT_GEN});
            });            
          },
          error: (e) => console.log('Unexpected error on life enginer: ' + e),
          complete: () => console.log('completed life enginer')
        });

      this.commandSubject.asObservable()
        .subscribe({
          next: (cmd: Command) => {
            engine.execute(cmd);
          },
          error: (e) => console.log('error sending command to worker:' + e),
          complete: () => console.log('completed worker command call')
        });
    }
  }

  public getReadyObservable(): Observable<boolean> {
    return this.readySubject.asObservable();
  }

  public getPatternAddedObservable(): Observable<boolean> {
    return this.patternAddedSubject.asObservable();
  }

  public getBoardObservable(): Observable<Cell[]> {
    return this.boardSubject.asObservable();
  }

  public init(conf: Configuration): void {
    const cmd: Command = { type: CommandType.INIT, config: conf };
    this.commandSubject.next(cmd);
  }

  public add(pattern: string): void {
    const cmd: Command = { type: CommandType.ADD_PATTERN, pattern: pattern.toLocaleLowerCase() };
    this.commandSubject.next(cmd);
  }

  public addCustomShape(shape:Cell[]): void {
    const cmd: Command = { type: CommandType.ADD_CUSTOM_PATTERN, pattern: shape };
    this.commandSubject.next(cmd);
  }

  protected handleResponse(resp: Response<Cell[]|boolean>, callback: () => void): void {
    if (resp.success) {
      const cmd: Command = resp.cmd;
      switch(cmd.type) {
        case CommandType.INIT:
          if (resp.payload) {
            callback();
          }
          break;
        case CommandType.FETCH_NEXT_GEN:
        case CommandType.CYCLE_REFRESHED:
          if (typeof resp.payload !== 'undefined') {
            const payload: Cell[] = resp.payload as Cell[];
            this.boardSubject.next(payload);
          }
          break;
        case CommandType.ADD_PATTERN:
          if (typeof resp.payload !== 'undefined') {
            const payload: boolean = resp.payload as boolean;
            this.patternAddedSubject.next(payload);
          }
          break;
        default:
          break;
      }
    }
  }
}
