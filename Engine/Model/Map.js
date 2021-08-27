/**
 * Class cont
 */
export class Map{
    constructor(name) {
        this.id = 1;
        this.blocks = [];
        this.name = name;
    }

    removeBlock(blockId) {
        var block = this.blocks.find(b => b.id === blockId);
        if(!isNaN(block.id)){
            this.blocks.splice(this.blocks.indexOf(block), 1);
        }
    }

    popBlock() {
        if (this.blocks.length > 0){
            this.blocks.pop();
        }
    }

    addBlock(block){
        this.blocks.push(block)
    }

    editBlock(blockId, x, y) {
        var oldBlock = this.blocks.find(b => b.id === blockId);
        if(!isNaN(oldBlock.id)) oldBlock.setPosition(x ,y);
    }
}