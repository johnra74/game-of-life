import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, HostListener, OnDestroy, ViewChild } from '@angular/core';
import { LifeEngineService } from '../life-engine/life-engine.service';
import { Cell, Configuration, PIXEL_SZ } from '../life-engine/life-engine';
import { forEach } from 'lodash';
import { Subscription } from 'rxjs';
import { BsModalRef, BsModalService, ModalOptions } from 'ngx-bootstrap/modal';
import { CustomShapeModalComponent } from './custom-shape-modal/custom-shape-modal.component';

@Component({
  selector: 'app-board',
  templateUrl: './board.component.html',
  styleUrls: ['./board.component.scss']
})
export class BoardComponent implements AfterViewInit, OnDestroy {
  public bsModalRef?: BsModalRef;

  @ViewChild('mainCanvas') 
  public mainCanvasRef: ElementRef;
  /*
   * hidden canvas for pre-drawing to improve animation (aka double-buffering)
   */
  @ViewChild('dbCanvas')
  public dbCanvasRef: ElementRef;

  public width: number;
  public height: number;
  public lifeCount: number;
  public genCycleCount: number;
  public activeCellCount: number;
  public pattern: string;
  
  private dbCanvas: any;
  private mainCtx: CanvasRenderingContext2D;
  private dbCtx: CanvasRenderingContext2D;
  private fps: number;
  private hasChange: boolean;
  private intervalId: any;

  private boardSubscription: Subscription;

  constructor(private cdRef : ChangeDetectorRef, private service: LifeEngineService, private modalService: BsModalService) {
    this.width = 10;
    this.height = 10;
    this.lifeCount = 1000;
    this.activeCellCount = 0;
    this.genCycleCount = 0;

    this.boardSubscription = 
      this.service.getBoardObservable()
        .subscribe({
          next: (lives:Cell[]) => {
            this.genCycleCount++;
            this.dbCtx.fillStyle = 'black';
            this.dbCtx.fillRect(0, 0, Number(this.width), this.height);
            this.activeCellCount = lives.length;

            forEach(lives, (cell: Cell) => {
              this.doubleBufferDraw(cell);
            });

            this.hasChange = true;
          },
          error: (e) => console.error(e),
          complete: () => console.info('board observer completed')
        });
  }  

  @HostListener('window:resize', ['$event'])
  public onResize(event: any): void {
    this.width = window.innerWidth - 20;
    this.height = Math.round(window.innerHeight * 0.75);
  }

  public ngAfterViewInit(): void {
    this.width = window.innerWidth - 20;
    this.height = Math.round(window.innerHeight * 0.75);
    this.cdRef.detectChanges();

    let mainCanvas: any = this.mainCanvasRef.nativeElement;

    this.mainCtx = mainCanvas.getContext('2d');
    this.dbCanvas = this.dbCanvasRef.nativeElement;
    this.dbCtx = this.dbCanvas.getContext('2d');
    this.hasChange = false;

    let counter: number = 0;
    let startTime: Date = new Date();
    let diff: number = 0;
    this.intervalId = setInterval(() => {
      counter++;
      this.draw();      
      
      let markerTime: Date = new Date();
      diff = (markerTime.getTime() - startTime.getTime()) / 1000;
      this.fps = Math.round(counter / diff);
      if (diff > 65) diff = 65;
    }, 65 - diff); // 15 frames per sec   
  }

  public ngOnDestroy(): void {
    clearInterval(this.intervalId);
    this.boardSubscription.unsubscribe();
  }

  public addPattern(): void {
    if (this.pattern.endsWith('Create Custom Shape')) {
      const initialState: ModalOptions = {
        initialState: {
          title: 'Create Custom Shape'
        }
      };
      this.bsModalRef = this.modalService.show(CustomShapeModalComponent, initialState);
      this.bsModalRef.content.closeBtnName = 'Load Shape';
    } else {
      this.service.add(this.pattern);
    }    
  }

  public start(): void {
    const cfg: Configuration = { 
      boardWidth: this.width,
      boardHeight: this.height,
      numberOfLiveCell: this.lifeCount
    }

    this.genCycleCount = 0;
    this.service.init(cfg);    
  }

  public getIntervalId(): any {
    return this.intervalId;
  }

  public hasBoardChange(): boolean {
    return this.hasChange;
  }

  private draw(): void {
    this.mainCtx.fillStyle = 'black';
    this.mainCtx.fillRect(0, 0, Number(this.width), this.height);

    this.mainCtx.drawImage(this.dbCanvas, 0, 0);
    this.mainCtx.fillStyle = 'green';
    this.mainCtx.fillText(this.fps + ' fps', this.width - 50, this.height - 25);
    this.mainCtx.fillText(this.activeCellCount + ' living cells', 10, this.height - 25);
    this.mainCtx.fillText('cycle ' + this.genCycleCount, 10, 30);
  }

  private doubleBufferDraw(cell: Cell) : void {    
    this.dbCtx.globalAlpha = 1.0;
    this.dbCtx.fillStyle = '#c0c0c0';

    this.dbCtx.fillRect(cell.coordinateX * PIXEL_SZ, cell.coordinateY * PIXEL_SZ, PIXEL_SZ, PIXEL_SZ);
    this.dbCtx.globalAlpha = 0.6;
    this.dbCtx.strokeRect(cell.coordinateX * PIXEL_SZ, cell.coordinateY * PIXEL_SZ, PIXEL_SZ, PIXEL_SZ);
  }
}
