import { AfterViewInit, Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { filter, forEach } from 'lodash';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { Cell } from 'src/app/life-engine/life-engine';
import { LifeEngineService } from 'src/app/life-engine/life-engine.service';

const PIXEL_SZ: number = 20;

@Component({
  selector: 'app-custom-shape-modal',
  templateUrl: './custom-shape-modal.component.html',
  styleUrls: ['./custom-shape-modal.component.scss']
})
export class CustomShapeModalComponent implements AfterViewInit {  
  @ViewChild('shapeCanvas') 
  public shapeCanvasRef: ElementRef;

  public title?: string;
  public closeBtnName?: string;

  private shape: Cell[];

  private shapeCtx: CanvasRenderingContext2D;
  private shapeCanvas: any;

  constructor(public bsModalRef: BsModalRef, private engineService: LifeEngineService) {
  }

  @HostListener('mouseup', ['$event'])
  public onMouseUp(e: any): void {
    const rect = this.getRect();
    const cell: Cell = {
      coordinateX: Math.floor((e.clientX + 2 - rect.left) / PIXEL_SZ) + 1,
      coordinateY: Math.floor((e.clientY + 2 - rect.top) / PIXEL_SZ) + 1
    }

    if (this.exists(cell)) {
      // remove
      const newShape: Cell[] = 
        filter(this.shape, (c:Cell) => !(c.coordinateX === cell.coordinateX && c.coordinateY === cell.coordinateY));
      this.shape = [...newShape];
    } else {
      // add
      this.shape.push(cell);
    }

    this.draw();
  }

  public ngAfterViewInit(): void {
    this.shape = [];
    this.shapeCanvas = this.shapeCanvasRef.nativeElement;
    this.shapeCtx = this.shapeCanvas.getContext('2d');

    this.draw();
  }

  public close(): void {
    this.engineService.addCustomShape(this.shape);
    this.bsModalRef.hide();
  }

  public add(cell: Cell) {
    if (typeof this.shape !== 'undefined') {
      this.shape = [];
    }
    this.shape.push(cell);
  }

  public getShape(): Cell[] {
    return [...this.shape];
  }

  public getRect(): any {
    return this.shapeCanvas.getBoundingClientRect();
  }

  private exists(cell: Cell): boolean {
    const matches: Cell[] = 
      filter(this.shape, (c:Cell) => c.coordinateX === cell.coordinateX && c.coordinateY === cell.coordinateY);

    return typeof matches !== 'undefined' && matches.length > 0;
  }

  private draw(): void {
    this.shapeCtx.fillStyle = 'black';
    this.shapeCtx.fillRect(0, 0, 200, 200);
    
    this.shapeCtx.strokeStyle = 'white';
    for (let i = 1; i < 10; i++) {      
      this.shapeCtx.beginPath(); 
      this.shapeCtx.lineTo(0, i*PIXEL_SZ);
      this.shapeCtx.lineTo(200, i*PIXEL_SZ);
      this.shapeCtx.stroke();
    }

    for (let j = 1; j < 10; j++) {
      this.shapeCtx.beginPath(); 
      this.shapeCtx.lineTo(j*PIXEL_SZ, 0);
      this.shapeCtx.lineTo(j*PIXEL_SZ, 200);
      this.shapeCtx.stroke();
    }

    this.shapeCtx.strokeRect(0, 0, 200, 200);

    this.shapeCtx.fillStyle = 'white';
    forEach(this.shape, (cell:Cell) => {      
      this.shapeCtx.fillRect((cell.coordinateX - 1) * PIXEL_SZ, (cell.coordinateY - 1) * PIXEL_SZ, PIXEL_SZ, PIXEL_SZ);
    });
  }
}
