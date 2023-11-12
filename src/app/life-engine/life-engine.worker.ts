/// <reference lib="webworker" />
import { Cell, LifeEngine, Response } from './life-engine';

const lifeEngine: LifeEngine = new LifeEngine();

lifeEngine.getResponseObservable()
  .subscribe({
    next: (resp: Response<Cell[]|boolean>) => {
      postMessage(resp);
    },
    error: (e) => console.log('Unexpected error on life enginer: ' + e),
    complete: () => console.log('completed life enginer')
  });

addEventListener('message', ({ data }) => {
  lifeEngine.execute(data);  
});
