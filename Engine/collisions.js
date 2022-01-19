/**
 * Player class used to store information about the player position and its collider.
 */
class Player{
    constructor(x, y, rangeX, rangeY) {
        this.objectX = x;
        this.objectY = y;
        this.rangeX = rangeX;
        this.rangeY = rangeY;
    }
}

/**
 * Object class to store information of objects other then the player about their position and their collider in the game.
 */
class Object{
    constructor(isHedge, sceneObject, x, y, rangeX, rangeY) {
        this.isHedge = isHedge;
        this.sceneObject = sceneObject;
        this.objectX = x;
        this.objectY = y;
        this.rangeX = rangeX;
        this.rangeY = rangeY;
    }
}

/**
 * This method checks if the player is colliding with something and returns the right new position.
 * @param playerCurrPos the former player position: Array[x, y] (from the local matrix)
 * @param playerNextPos the attempted new player position: Array[x, y] (from the local matrix)
 * @param objects the objects in the scene (without the player)
 * TODO: CHECK IF PLAYER IS ALWAYS THE FIRST IN CASE PASS THE OBJECTS WITHOUT THE PLAYER. IMPORTANT!!!!!!!!!
 * @returns {{detected: boolean, isHedge: boolean, position: [x, y]}}
 */
function checkCollisions(playerCurrPos, playerNextPos, objects){
    let detected = false;
    let position = [];
    let isHedge = false;
    var oldPlayer = new Player(playerCurrPos[0], playerCurrPos[1], getPlayerRangeX(playerCurrPos[0]), getPlayerRangeY(playerCurrPos[1]))
    var newPlayer = new Player(playerNextPos[0], playerNextPos[1], getPlayerRangeX(playerNextPos[0]), getPlayerRangeY(playerNextPos[1]))

    // CHECK FOR COLLISIONS
    let collidingObjects = checkSquareCollision(newPlayer, objects);

    if(collidingObjects.length !== 0){
        // COLLISION DETECTED
        detected = true;

        // CHECK IF HEDGE WAS TOUCHED
        collidingObjects.forEach(object => {
            if(object.isHedge)
                isHedge = true;
        })
        if(isHedge) return {detected: detected, position: playerNextPos, isHedge: isHedge}

        // IF NOT AN HEDGE
        position = calculateNewPosition(oldPlayer, newPlayer, collidingObjects)
    }
    // NO COLLISION => TELL THE PLAYER THE POSITION CALCULATED WAS RIGHT
    else position = playerNextPos;

    return {detected: detected, position: position, isHedge: isHedge}
}

/**
 * Method used in order to get the x-axis boundaries of the player's box collider.
 * @param playerX: x of the player in game.
 * @returns {(number|*)[]}
 */
function getPlayerRangeX(playerX) {
    return [playerX - settings.playerColliderX, playerX + settings.playerColliderX];
}

/**
 * Method used in order to get the y-axis boundaries of the player's box collider.
 * @param playerY: y of the player in game.
 * @returns {(number|*)[]}
 */
function getPlayerRangeY(playerY) {
    return [playerY - settings.playerColliderY, playerY - settings.playerColliderY];
}
/*
function checkCircCollision(x0, y0, r, x, y) {
    x -= x0;
    y -= y0;
    let theta = Math.atan2(y, x);
    let xp = r*Math.cos(theta) + x0;
    let yp = r*Math.sin(theta) + y0;
    var collision = false;
    return {"detected" : (x*x + y*y <= r*r), "position" : [xp, yp]};
}*/

/**
 * This method is used to check if the player in the next position will collide with one or more objects.
 * @param newPlayer: the Person object that represents the player.
 * @param sceneObjects: the array of objects in the scene.
 * @returns {[]} the array of objects the player collides with.
 */
function checkSquareCollision(newPlayer, sceneObjects){
    var objects = [];
    sceneObjects.forEach(object => {
        let isHedge = false;
        if(object.type === 1) isHedge = true;
        let objectX = object.localMatrix[3];
        let objectY = object.localMatrix[7];
        objects.push(new Object(isHedge, object, objectX, objectY, getObjectRangeX(isHedge, objectX), getObjectRangeY(isHedge, objectY)));
    })
    var collidingObjects = [];
    objects.forEach(object => {
        if(((newPlayer.rangeX[0] >= object.rangeX[0]) && (newPlayer.rangeX[0] <= object.rangeX[1]) ||
            (newPlayer.rangeX[1] >= object.rangeX[0]) && (newPlayer.rangeX[1] <= object.rangeX[1]))
            &&
            ((newPlayer.rangeY[0] >= object.rangeY[0]) && (newPlayer.rangeY[0] <= object.rangeY[1]) ||
                (newPlayer.rangeY[1] >= object.rangeY[0]) && (newPlayer.rangeY[1] <= object.rangeY[1]))
        ){
            collidingObjects.push(object);
        }
    })
    return collidingObjects;
}

function getObjectRangeX(isHedge, objectX){
    if(isHedge)
        return [objectX - settings.hedgesColliderX, objectX + settings.hedgesColliderX];
    return [objectX - settings.blocksColliderX, objectX + settings.blocksColliderX];
}

function getObjectRangeY(isHedge, objectY){
    if(isHedge)
        return [objectY - settings.hedgesColliderX + settings.translateFactor, objectY + settings.hedgesColliderX + settings.translateFactor];
    return [objectY - settings.blocksColliderY, objectY + settings.blocksColliderY];
}

/**
 * This method is used to compute the effective position of the player in the case it collides with another object.
 * @param prevPlayer Object class, the former player position.
 * @param newPlayer Object class, the colliding player position.
 * @param object Object class, the object which the player collides with.
 * @returns array: position[x, y]
 */
function calculateNewPosition(prevPlayer, newPlayer, objects){
    var x = [];
    var y = [];

    objects.forEach(object => {
        let versor = getVersor(prevPlayer.x, prevPlayer.y, newPlayer.x, newPlayer.y);
        var face = getCollidingFace(object, newPlayer, versor);
        var tempX;
        var tempY;
        let rect = getRect();

        if(face === "down"){
            tempY = object.rangeY[0];
            tempX = getXgivenY(tempY, rect);
        }
        else if(face === "up"){
            tempY = object.rangeY[1];
            tempX = getXgivenY(tempY, rect);
        }
        else if(face === "left"){
            tempX = object.rangeX[0];
            tempY = getYgivenX(tempX, rect);
        }
        else if(face === "right") {
            tempX = object.rangeX[1];
            tempY = getYgivenX(tempX, rect);
        }
        else console.log("Something went wrong with collidingFace or face.\n" + "It was object: " + object.toString());

        x.push(tempX);
        y.push(tempY);
    })


    return [x[0], y[0]];
}

/**
 * This method is used to get the direction from which the player is coming.
 * @returns numbers: [xDir, yDir]
 */
function getVersor(prevPlayerX, prevPlayerY, newPlayerX, newPlayerY){
    var numbers;
    numbers = [Math.sign(prevPlayerX - newPlayerX), Math.sign(prevPlayerY - prevPlayerY)];
    return numbers;
}

/**
 * This method calculates the rect given the two player positions, old and former new one.
 * The rect is of the form : ax + bx + c = 0, where:
 * a = rect[0]
 * b = rect[1]
 * c = rect[2]
 */
function getRect(prevPlayerX, prevPlayerY, newPlayerX, newPlayerY){
    return [newPlayerY - prevPlayerY,
            prevPlayerX - newPlayerX,
            (newPlayerX - prevPlayerX) * prevPlayerY + (prevPlayerY - newPlayerY) * prevPlayerX]
}

function getXgivenY(y, rect){
    return (-rect[1] * y - rect[2]) / rect[0];
}

function getYgivenX(x, rect){
    return (-rect[0] * x - rect[2]) / rect[1];
}

function getCollidingFace(object, player, versor){
    if(versor[1] > 0){
        if(versor[0] > 0){
            let xVal = object.rangeX[0] - player.rangeX[1];
            let yVal = player.rangeY[0] - object.rangeY[1];
            if(xVal < yVal) return "left";
        }
        else{
            let xVal = object.rangeX[1] - player.rangeX[0];
            let yVal = player.rangeY[1] - object.rangeY[0];
            if(xVal < yVal) return "right";
        }
        return "down";
    }
    if(versor[1] < 0){
        if(versor[0] > 0){
            let xVal = player.rangeX[1] - object.rangeX[0];
            let yVal = object.rangeY[1] - player.rangeY[0];
            if(xVal < yVal) return "left";
        }
        else{
            let xVal = object.rangeX[1] - player.rangeX[0];
            let yVal = object.rangeY[1] - player.rangeY[0];
            if(xVal < yVal) return "right";
        }
        return "up";
    }
    if(versor[0] > 0){
        let xVal = player.rangeX[1] - object.rangeX[0];
        if(xVal > 0) return "left";
    }
    if(versor[0] < 0){
        let xVal = object.rangeX[1] - player.rangeX[0];
        if(xVal > 0) return "right";
    }
    return "up";
}
