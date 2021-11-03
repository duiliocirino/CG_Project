/**
 * Class cont
 */

export class Map{
    constructor(name) {
        this.id = this.lastMapId + 1;
        this.lastMapId += 1;
        this.playableObjects = [];
        this.decorations = [];
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

    //TODO: decorations implementation
}