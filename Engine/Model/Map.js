 /**
 * Class cont
 */

export class Map{
    constructor(name, lastMapId) {
        this.id = lastMapId + 1;
        this.playableObjects = [];
        this.backgroundObjects = [];
        this.name = name;
    }

    lastMapId = 0;

    removePlayable(blockId) {
        var block = this.playableObjects.find(b => b.id === blockId);
        if(!isNaN(block.id)){
            this.playableObjects.splice(this.playableObjects.indexOf(block), 1);
        }
    }

    popPlayable() {
        if (this.playableObjects.length > 0){
            this.playableObjects.pop();
        }
    }

    addPlayable(block){
        this.playableObjects.push(block)
    }

    editPlayable(blockId, x, y) {
        var oldBlock = this.playableObjects.find(b => b.id === blockId);
        if(!isNaN(oldBlock.id)) oldBlock.setPosition(x ,y);
    }

     checkIfOtherBlockIsPresent(x, y){
        let bool = false;
        this.playableObjects.forEach(function (block){
            if(block.position[0] === x && block.position[1] === y)
                bool = true;
        });
        return bool;
     }

    //TODO: decorations implementation

     addBackgroundObject(block){
         this.backgroundObjects.push(block)
     }

     checkIfOtherBlockIsPresentBG(x){
         let bool = false;
         this.backgroundObjects.forEach(function (block){
             if(block.position[0] === x)
                 bool = true;
         });
         return bool;
     }
}