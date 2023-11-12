import { Injectable } from '@angular/core';
import { LifeEngine, Configuration, CommandType, Command, Cell } from './life-engine';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LifeEngineService {

  protected patternAddedSubject: Subject<boolean>;
  protected readySubject: Subject<boolean>;
  protected boardSubject: Subject<Cell[]>;

  private commandSubject: Subject<Command>;

  constructor() {
    this.readySubject = new Subject<boolean>();
    this.patternAddedSubject = new Subject<boolean>();
    this.boardSubject = new Subject<Cell[]>();
    this.commandSubject = new Subject<Command>();

    if (typeof Worker !== 'undefined') {
      const worker: Worker = new Worker(new URL('./life-engine.worker', import.meta.url));
      worker.onmessage = ({ data }) => {
        if (data.success) {
          const cmd: Command = data.cmd;
          switch(cmd.type) {
            case CommandType.INIT:
              if (data.payload) {
                worker.postMessage({type: CommandType.FETCH_NEXT_GEN});
              }
              break;
            case CommandType.FETCH_NEXT_GEN:
            case CommandType.CYCLE_REFRESHED:
              this.boardSubject.next(data.payload);
              break;
            case CommandType.ADD_PATTERN:
              this.patternAddedSubject.next(data.payload);
              break;
            default:
              break;
          }
        }
      }

      this.commandSubject.asObservable()
        .subscribe({
          next: (cmd: Command) => {
            worker.postMessage(cmd);
          },
          error: (e) => console.log('error sending command to worker:' + e),
          complete: () => console.log('completed worker command call')
        });
    } else {
      const engine: LifeEngine = new LifeEngine();
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
}
