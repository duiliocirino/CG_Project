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
    constructor(isHedge, isVictory, x, y, rangeX, rangeY) {
        this.isHedge = isHedge;
        this.isVictory = isVictory;
        this.objectX = x;
        this.objectY = y;
        this.rangeX = rangeX;
        this.rangeY = rangeY;
    }
}

/**
 * This method checks if the player is colliding with something and returns the right new position.
 * @param playerCurrPos the former player position: (the local matrix)
 * @param playerNextPos the attempted new player position: (the local matrix)
 * @param objects the objects in the scene (without the player)
 * @returns {{speedMultiplier: number[], victory: boolean, detected: boolean, isHedge: boolean, position: localMatrix}}
 */
function checkCollisions(playerCurrPos, playerNextPos, objects){
    let detected = false;
    let position = [];
    let isHedge = false;
    let victory = false;
    let result = {position: [0, 0], speedMultiplier: [1, 1]}

    let oldPlayer = new Player(playerCurrPos[3], playerCurrPos[7], getPlayerRangeX(playerCurrPos[3]), getPlayerRangeY(playerCurrPos[7]));
    let newPlayer = new Player(playerNextPos[3], playerNextPos[7], getPlayerRangeX(playerNextPos[3]), getPlayerRangeY(playerNextPos[7]));

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
        // CHECK IF VICTORY POLE WAS TOUCHED
        collidingObjects.forEach(object => {
            if(object.isVictory)
                victory = true;
        })
        if(isHedge) return {detected: detected, speedMultiplier: result.speedMultiplier, position: playerNextPos, isHedge: isHedge, victory: victory};
        if(victory) return {detected: detected, speedMultiplier: result.speedMultiplier, position: playerNextPos, isHedge: isHedge, victory: victory};
        // IF NOT AN HEDGE
        result = calculateNewPosition(oldPlayer, newPlayer, collidingObjects);
        position = playerNextPos;
        position[3] = result.position[0];
        position[7] = result.position[1];
    }
    // NO COLLISION => TELL THE PLAYER THE POSITION CALCULATED WAS RIGHT
    else position = playerNextPos;

    return {detected: detected, speedMultiplier: result.speedMultiplier, position: position, isHedge: isHedge, victory: victory};
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
    return [playerY - settings.playerColliderY, playerY + settings.playerColliderY];
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
    let objects = [];
    sceneObjects.forEach(object => {
        let isHedge = false;
        let isVictory = false;
        let objectX;
        let objectY;

        if(object.gameInfo.type === 1) isHedge = true;
        if(object.gameInfo.type === 9) isVictory = true;
        if(object.gameInfo.type === 1) {
            objectX = object.localMatrix[3];
            objectY = object.localMatrix[7];
        } else {
            objectX = object.gameInfo.x * settings.translateFactor;
            objectY = object.gameInfo.y * settings.translateFactor;
        }
        objects.push(new Object(isHedge, isVictory, objectX, objectY, getObjectRangeX(isHedge, objectX), getObjectRangeY(isHedge, objectY)));
    })
    let collidingObjects = [];
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

/**
 * Method used in order to get the y-axis boundaries of the specified object's box collider.
 * @param isHedge: if the object isHedge apply a different calculation.
 * @param objectX: the x position of the object.
 * @returns {(number|*)[]}
 */
function getObjectRangeX(isHedge, objectX){
    if(isHedge)
        return [objectX - settings.hedgesColliderX, objectX + settings.hedgesColliderX];
    return [objectX - settings.blocksColliderX, objectX + settings.blocksColliderX];
}

/**
 * Method used in order to get the y-axis boundaries of the specified object's box collider.
 * @param isHedge: if the object isHedge apply a different calculation.
 * @param objectY: the y position of the object.
 * @returns {(number|*)[]|*[]}
 */
function getObjectRangeY(isHedge, objectY){
    if(isHedge)
        return [objectY - settings.hedgesColliderX, objectY + settings.hedgesColliderX];
    return [objectY, objectY + settings.blocksColliderY];
}

/**
 * This method is used to compute the effective position of the player in the case it collides with another object.
 * @param prevPlayer: Object class, the former player position.
 * @param newPlayer: Object class, the colliding player position.
 * @param objects: Object class, the object which the player collides with.
 * @returns array: position[x, y]
 */
function calculateNewPosition(prevPlayer, newPlayer, objects){
    let x;
    let y;
    let xs = [];
    let ys = [];
    let faces = [];
    let speedMultiplier = [1, 1];

    objects.forEach(object => {
        let versor = getVersor(prevPlayer.objectX, prevPlayer.objectY, newPlayer.objectX, newPlayer.objectY);
        let face = getCollidingFace(object, newPlayer, versor);
        let tempX;
        let tempY;

        if(face === "down"){
            tempY = object.rangeY[0] - settings.playerColliderY;
            tempX = newPlayer.objectX;
            speedMultiplier = [speedMultiplier[0], 0];
        }
        else if(face === "up"){
            tempY = object.rangeY[1] + settings.playerColliderY;
            tempX = newPlayer.objectX;
            speedMultiplier = [speedMultiplier[0], 0];
        }
        else if(face === "left"){
            tempX = object.rangeX[0] - settings.playerColliderX;
            tempY = newPlayer.objectY;
            speedMultiplier = [0, speedMultiplier[1]];
        }
        else if(face === "right") {
            tempX = object.rangeX[1] + settings.playerColliderX;
            tempY = newPlayer.objectY;
            speedMultiplier = [0, speedMultiplier[1]];
        }
        else console.log("Something went wrong with collidingFace or face.\n" + "It was object: " + object.toString());

        xs.push(tempX);
        ys.push(tempY);
        faces.push(face);
    })

    if(faces.length > 1){
        let i;
        for(i = 0; i < faces.length; i++){
            if(faces[i] === "down"){
                y = ys[i];
            }
            else if(faces[i] === "up"){
                y = ys[i];
            }
            else if(faces[i] === "left"){
                x = xs[i];
            }
            else if(faces[i] === "right") {
                x = xs[i];
            }
        }
        if(faces.find(x => x === "up" || x === "down") !== undefined &&
            faces.find(x => x === "left" || x === "right") === undefined){
            x = newPlayer.objectX;
        }
        if(faces.find(x => x === "up" || x === "down") === undefined &&
            faces.find(x => x === "left" || x === "right") !== undefined){
            y = newPlayer.objectY;
        }
    } else{
        x = xs.pop();
        y = ys.pop();
    }
    if(x === undefined) x = xs.pop();
    if(y === undefined) y = ys.pop();

    return {position:[x, y], speedMultiplier: speedMultiplier};
}

/**
 * This method is used to get the direction from which the player is coming.
 * @returns numbers: [xDir, yDir]
 */
function getVersor(prevPlayerX, prevPlayerY, newPlayerX, newPlayerY){
    let numbers;
    numbers = [Math.sign(newPlayerX - prevPlayerX), Math.sign(newPlayerY - prevPlayerY)];
    return numbers;
}

/**
 * This method is responsible of calculating which face of the object is involved in the collision with the player.
 * @param object: the object with which the player collides.
 * @param player: instance of the player.
 * @param versor: the x-y direction of the player.
 * @returns {string}: up, down, left or right.
 */
function getCollidingFace(object, player, versor){
    if(versor[1] > 0){
        if(versor[0] > 0){
            let xVal = player.rangeX[1] - object.rangeX[0];
            let yVal = player.rangeY[1] - object.rangeY[0];
            if(xVal < yVal) return "left";
        }
        else if(versor[1] < 0){
            let xVal = object.rangeX[1] - player.rangeX[0];
            let yVal = player.rangeY[1] - object.rangeY[0];
            if(xVal < yVal) return "right";
        }
        else{
            if(object.rangeX[0] > player.objectX){
                let xVal = player.rangeX[1] - object.rangeX[0];
                let yVal = player.rangeY[1] - object.rangeY[0];
                if(xVal < yVal) return "left";
            }
            else if (object.rangeX[1] < player.objectX){
                let xVal = object.rangeX[1] - player.rangeX[0];
                let yVal = player.rangeY[1] - object.rangeY[0];
                if(xVal < yVal) return "right";
            }
        }
        return "down";
    }
    if(versor[1] < 0){
        if(versor[0] > 0){
            let xVal = player.rangeX[1] - object.rangeX[0];
            let yVal = object.rangeY[1] - player.rangeY[0];
            if(xVal < yVal) return "left";
        }
        else if(versor[0] < 0){
            let xVal = object.rangeX[1] - player.rangeX[0];
            let yVal = object.rangeY[1] - player.rangeY[0];
            if(xVal < yVal) return "right";
        }
        else{
            if(object.rangeX[0] > player.objectX){
                let xVal = player.rangeX[1] - object.rangeX[0];
                let yVal = object.rangeY[1] - player.rangeY[0];
                if(xVal < yVal) return "left";
            }
            else if (object.rangeX[1] < player.objectX){
                let xVal = object.rangeX[1] - player.rangeX[0];
                let yVal = object.rangeY[1] - player.rangeY[0];
                if(xVal < yVal) return "right";
            }
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