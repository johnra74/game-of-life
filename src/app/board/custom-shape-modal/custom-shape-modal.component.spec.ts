import { ComponentFixture, TestBed, fakeAsync } from '@angular/core/testing';

import { CustomShapeModalComponent } from './custom-shape-modal.component';
import { LifeEngineService } from 'src/app/life-engine/life-engine.service';
import { BsModalService, ModalModule } from 'ngx-bootstrap/modal';
import { Cell } from 'src/app/life-engine/life-engine';
import { ElementRef } from '@angular/core';

describe('Given CustomShapeModalComponent', () => {
  let component: CustomShapeModalComponent;
  let fixture: ComponentFixture<CustomShapeModalComponent>;
  let mockLifeEngineService: LifeEngineService = 
  jasmine.createSpyObj('LifeEngineService', {
    'addCustomShape': null
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CustomShapeModalComponent ],
      imports: [ ModalModule ],
      providers: [
        BsModalService,
        { provide: LifeEngineService, useValue: mockLifeEngineService }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CustomShapeModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('When created, Then it should be created', () => {
    expect(component).toBeTruthy();
  });

  it('When cell exists, remove from shape', () => {
    const cell: Cell = {coordinateX: 1, coordinateY: 1};
    const rect: any = component.getRect();

    component.add(cell);
    component.onMouseUp({ clientX: rect.left, clientY: rect.top });

    expect(component.getShape().length).toEqual(0);
  });

  it('When cell does NOT exists, add to shape', () => {
    const cell: Cell = {coordinateX: 2, coordinateY: 2};
    const rect: any = component.getRect();

    component.add(cell);
    component.onMouseUp({ clientX: rect.left, clientY: rect.top });

    expect(component.getShape().length).toEqual(2);
  });

  it('When close is called, notify life engine service', fakeAsync(() => {
    component.close();

    expect(mockLifeEngineService.addCustomShape).toHaveBeenCalledOnceWith([]);
  }));

});
