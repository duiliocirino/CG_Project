export class Block{
    constructor(x, y, drawInfo) {
        this.id = 1;
        this.position = [];
        this.position.push(x, y);
        this.drawInfo = drawInfo;
    }

    lastBlockId = 0;

    setPosition(x, y) {
        this.position = [x, y];
    }
}