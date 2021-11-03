export class Block{
    constructor(x, y, type) {
        this.id = 1;
        this.position = [];
        this.position.push(x, y);
        this.type = type;
        this.drawInfo = "null";
    }

    lastBlockId = 0;

    setPosition(x, y) {
        this.position = [x, y];
    }
}