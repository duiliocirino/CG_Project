import {Map} from "./Engine/Model/Map.js";
import {Block} from "./Engine/Model/Block.js";
import {MapHandler} from "./Engine/Model/MapHandler.js";
import {SkyBox} from "./Engine/SkyBox.js";
import {Node} from "./Engine/Model/Node.js";


// MapHandler instance
var mapHandler = new MapHandler();
//
var baseDir;
//
var perspectiveMatrix;
var projectionMatrix;
var viewMatrix;

var gl;

//Program used to render
var program;

//VAO
var vao_arr = []; //data structure containing all the VAO (one for each type of obj)

//MESHES
var meshes = [];

//OBJECTS
var objects = []; // list of objects to be rendered for the playable map
var backgroundObjects = []; //list of objects to be rendered for the background
var skyObjects = []; //list of objects to be rendered on the sky
var worldSpace;
var mapSpace;
var skySpace;
var backgroundSpace;

//STAGE
var sceneRoot //the list of objects in which the player moves. all the objects are already initialized

//TEXTURES and BUFFERS
var texture;

//ATTRIBUTES AND UNIFORMS
var positionAttributeLocation;
var uvAttributeLocation;
var normalAttributeLocation;

var colorUniformLocation;
var isColorPresentBooleanLocation;

var wvpMatrixLocation;
var positionMatrixLocation;
var normalMatrixLocation;

var ambientLightHandle;
var textureUniformLocation;
var shinessHandle;
var cameraPositionHandle;
var pointLightPositionHandle;
var pointLightColorHandle;
var pointLightTargetHandle;
var pointLightDecayHandle;
var directLightColorHandle;
var directLightDirectionHandle;


//SKYBOX
var skyBox = new SkyBox();


//Parameters for Game Loop
var lastFrameTime;
var deltaTime;
var playerStartPosition = [];

//parameter for movement
var horizontalSpeed =  0;
var verticalSpeed = 0;
var horizontalSpeedCap = settings.horizontalSpeedCap;
var verticalSpeedCap = settings.verticalSpeedCap;
var horizontalAcceleration = 0;
var verticalAcceleration = 0;
var gravity = settings.gravity;
var deceleration = settings.deceleration;
var jumping = false;


//EasterEgg
var easterEgg = 0;
var keyPressed = false;
var activePlayerModel = 0;


//utility
var rotateYaxismatrix = utils.MakeRotateYMatrix(180);
var lookinRight = true;




//#region Init and Main

/**
 * Entry point of the WebGL program
 */
async function init() {
    var path = window.location.pathname;
    var page = path.split("/").pop();
    baseDir = window.location.href.replace(page, '');
    settings.shaderDir = baseDir + "Graphics/Shaders/"; //Shader files will be put in the shaders folder
    settings.skyboxDir = baseDir + "Graphics/Env/"; //Skybox directories

    getCanvas();

    //Compile and Link Shaders
    //load shaders from file
    await utils.loadFiles([settings.shaderDir + 'vs.glsl', settings.shaderDir + 'fs.glsl'], function (shaderText) {
        var vertexShader = utils.createShader(gl, gl.VERTEX_SHADER, shaderText[0]);
        var fragmentShader = utils.createShader(gl, gl.FRAGMENT_SHADER, shaderText[1]);
        program = utils.createProgram(gl, vertexShader, fragmentShader);
    });

    gl.useProgram(program);

    //Load object
    var objectFile = await fetch("Engine/blocks.json");
    await loadObjects(objectFile);

    //load Texture
    setupTextures();

    main();
}

function main(){
    var dirLightAlpha = -utils.degToRad(-60);
    var dirLightBeta  = -utils.degToRad(120);
    var directionalLight = [Math.cos(dirLightAlpha) * Math.cos(dirLightBeta),
        Math.sin(dirLightAlpha), Math.cos(dirLightAlpha) * Math.sin(dirLightBeta)];
    var directionalLightColor = [0.8, 1.0, 1.0];

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0.85, 0.85, 0.85, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);

    getAttributesAndUniformLocation();

    createVaos();

    setGuiListeners();

    skyBox.loadEnvironment(gl);

    sceneGraphDefinition();

    requestAnimationFrame(drawScene);
}
//#endregion

//#region Program Initialization
function getAttributesAndUniformLocation(){
    positionAttributeLocation = gl.getAttribLocation(program, "in_pos");
    normalAttributeLocation = gl.getAttribLocation(program, "in_norm");
    uvAttributeLocation = gl.getAttribLocation(program, "in_uv");
    colorUniformLocation = gl.getUniformLocation(program, "u_color");
    isColorPresentBooleanLocation = gl.getUniformLocation(program, "isColorPresent");

    wvpMatrixLocation = gl.getUniformLocation(program, "matrix");
    positionMatrixLocation = gl.getUniformLocation(program, "pMatrix");
    normalMatrixLocation = gl.getUniformLocation(program, "nMatrix");

    textureUniformLocation = gl.getUniformLocation(program, "u_texture");
    cameraPositionHandle = gl.getUniformLocation(program, "u_cameraPos");
    pointLightPositionHandle = gl.getUniformLocation(program, "u_pointLightPos");
    pointLightColorHandle = gl.getUniformLocation(program, "u_pointLightColor");
    pointLightTargetHandle = gl.getUniformLocation(program, "u_pointLightTarget");
    pointLightDecayHandle = gl.getUniformLocation(program, "u_pointLightDecay");
    directLightColorHandle = gl.getUniformLocation(program, "u_directLightColor");
    directLightDirectionHandle = gl.getUniformLocation(program, "u_directLightDirection");
    ambientLightHandle = gl.getUniformLocation(program, 'u_ambientLight');
    shinessHandle = gl.getUniformLocation(program, "u_shininess");
}

function createVaos(){
    meshes.forEach(mesh => {
        var vao = gl.createVertexArray();
        gl.bindVertexArray(vao);

        gl.bindBuffer(gl.ARRAY_BUFFER, mesh.mesh.vertexBuffer);
        gl.enableVertexAttribArray(positionAttributeLocation);
        gl.vertexAttribPointer(positionAttributeLocation, mesh.mesh.vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, mesh.mesh.normalBuffer);
        gl.enableVertexAttribArray(normalAttributeLocation);
        gl.vertexAttribPointer(normalAttributeLocation, mesh.mesh.normalBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, mesh.mesh.textureBuffer);
        gl.enableVertexAttribArray(uvAttributeLocation);
        gl.vertexAttribPointer(uvAttributeLocation, mesh.mesh.textureBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.mesh.indexBuffer);

        vao_arr.push(vao);
    });
}

function sceneGraphDefinition(){
    /*worldNode = new Node();
    var objectNode = new Node();
    objectNode.localMatrix = utils.MakeScaleMatrix(1,1,1);
    objectNode.drawInfo = {
        programInfo: program,
        bufferLength: meshes[6].mesh.indexBuffer.numItems,
        vertexArray: vao_arr[6]
    };
    var objectNode2 = new Node();
    objectNode2.localMatrix = utils.multiplyMatrices(utils.MakeTranslateMatrix(-20,0,0), utils.MakeScaleMatrix(1,1,1));
    objectNode2.drawInfo = {
        programInfo: program,
        bufferLength: meshes[6].mesh.indexBuffer.numItems,
        vertexArray: vao_arr[6]
    };

    objectNode.setParent(worldNode);
    objectNode2.setParent(worldNode)
    objects.push(objectNode);
    objects.push(objectNode2);*/

    var map = mapHandler.loadMap(parseInt(window.localStorage.getItem("playMap")));

    worldSpace = new Node();
    worldSpace.localMatrix = utils.MakeWorld(-100, -60, 0, 0, 0, 0, 1.0);

    var playerNode = new Node();
    playerNode.localMatrix = utils.multiplyMatrices(rotateYaxismatrix,utils.multiplyMatrices(utils.MakeTranslateMatrix(0, 25, 0), utils.MakeScaleMatrix(settings.playerScaleFactor)));
    playerNode.drawInfo = {
        programInfo: program,
        bufferLength: meshes[8].mesh.indexBuffer.numItems,
        vertexArray: vao_arr[8],
        color: settings.playerColor,
        isColorPresent: true
    };
    playerNode.setParent(worldSpace);
    objects.push(playerNode);
    playerStartPosition = playerNode.localMatrix;
    startGame();

    //Creation of the playable map
    mapSpace = new Node();
    mapSpace.setParent(worldSpace);

    map.playableObjects.forEach(function(element){
        const xPos = element.position[0];
        const yPos = element.position[1];
        CreateNode(xPos, yPos, element.type)
    });

    //creation of the clouds
    skySpace = new Node();
    skySpace.setParent(worldSpace);

    setClouds();

 //TODO space for background



}
//endregion

function updatePlayerPosition() {
    let collisions;
    let positionDifference;

    if (horizontalSpeed < horizontalSpeedCap && horizontalSpeed > -horizontalSpeedCap){
        horizontalSpeed = horizontalSpeed + horizontalAcceleration*deltaTime/1000*deceleration;
    }
    if(verticalSpeed < verticalSpeedCap && verticalSpeed > -verticalSpeedCap){
        verticalSpeed = verticalSpeed + (verticalAcceleration + gravity)*deltaTime/1000*deceleration;
        verticalAcceleration += gravity;
    }
    if(horizontalSpeed>= horizontalSpeedCap){
        horizontalSpeed = horizontalSpeedCap;
    }
    if(horizontalSpeed <= -horizontalSpeedCap){
        horizontalSpeed = - horizontalSpeedCap;
    }
    if(verticalSpeed>= verticalSpeedCap){
        verticalSpeed = verticalSpeedCap;
    }
    if(verticalSpeed <= -verticalSpeedCap){
        verticalSpeed = - verticalSpeedCap;
    }
    if(horizontalSpeed > 0){
        if(!lookinRight){
            lookinRight = true;
            invertPlayerModel();
        }
    }else if(horizontalSpeed < 0){
        if(lookinRight){
            lookinRight = false;
            invertPlayerModel()
        }
    }
    if(lookinRight){
        collisions = checkCollisions(objects[0].localMatrix, utils.multiplyMatrices(objects[0].localMatrix, utils.MakeTranslateMatrix(-horizontalSpeed, verticalSpeed, 0)), objects.slice(1));
    }else{
        collisions = checkCollisions(objects[0].localMatrix, utils.multiplyMatrices(objects[0].localMatrix, utils.MakeTranslateMatrix(horizontalSpeed, verticalSpeed, 0)), objects.slice(1));
    }

    if(collisions.detected){
        if(collisions.isHedge){
            hedgeDamage();
        }
        jumping = false;
        horizontalSpeed *= collisions.speedMultiplier[0];
        horizontalAcceleration *= collisions.speedMultiplier[0];
        verticalSpeed *= collisions.speedMultiplier[1];
        verticalAcceleration *= collisions.speedMultiplier[1];
    }

    positionDifference = [
        collisions.position[3] - objects[0].localMatrix[3],
        collisions.position[7] - objects[0].localMatrix[7],
        collisions.position[11] - objects[0].localMatrix[11]];
    objects[0].localMatrix = collisions.position;
    if(collisions.position[3] < settings.horizontalBound || collisions.position[7] < settings.verticalBound){
        fallOffScreen();
    }

    animateCamera(positionDifference);
}


function moveClouds(){
    skyObjects.forEach(function (object){
        object.localMatrix = utils.multiplyMatrices(object.localMatrix, utils.MakeTranslateMatrix(- settings.cloudSpeed, 0, 0));
    });
}

function checkCloudsPosition(){
    skyObjects.forEach(function (cloud){
        if(cloud.localMatrix[3] < objects[0].localMatrix[3] - settings.cloudsBackDespawnFactor){
            cloud.localMatrix[3] = objects[0].localMatrix[3] + settings.cloudsFrontRespawnFactor;
        }
    });
}



function invertPlayerModel(){
    var currentPosition = [];
    currentPosition[0] = objects[0].localMatrix[3];
    currentPosition[1] = objects[0].localMatrix[7];
    currentPosition[2] = objects[0].localMatrix[11];
    objects[0].localMatrix = utils.multiplyMatrices(rotateYaxismatrix, objects[0].localMatrix);
    objects[0].localMatrix[3] = currentPosition[0];
    objects[0].localMatrix[7] = currentPosition[1];
    objects[0].localMatrix[11] = currentPosition[2];
}

function animateCamera(positionDifference){
    settings.playCameraTarget = [
        objects[0].localMatrix[3],
        20,
        objects[0].localMatrix[11]];
    settings.playCameraPosition = [
        settings.playCameraPosition[0] + positionDifference[0],
        settings.playCameraPosition[1],
        settings.playCameraPosition[2] + positionDifference[2]];
}

function drawScene(currentTime){
    if(!lastFrameTime){
        lastFrameTime = currentTime;
    }
    deltaTime = currentTime - lastFrameTime;
    lastFrameTime = currentTime;

    gl.clearColor(0.85, 0.85, 0.85, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Compute the projection matrix
    var aspect = gl.canvas.width / gl.canvas.height;
    var projectionMatrix = utils.MakePerspective(60.0, aspect, 1.0, 2000.0);

    // Compute the camera matrix using look at.
    var cameraPosition = settings.playCameraPosition;
    var target = settings.playCameraTarget;
    var up = settings.playCameraUp;
    var cameraMatrix = utils.LookAt(cameraPosition, target, up);
    var viewMatrix = utils.invertMatrix(cameraMatrix);

    var viewProjectionMatrix = utils.multiplyMatrices(projectionMatrix, viewMatrix);

    updatePlayerPosition();

    moveClouds();

    checkCloudsPosition();

    worldSpace.updateWorldMatrix();

    skyBox.InitializeAndDraw();

    objects.forEach(function(object) {
        gl.useProgram(object.drawInfo.programInfo);

        var projectionMatrix = utils.multiplyMatrices(viewProjectionMatrix, object.worldMatrix);
        var normalMatrix = utils.invertMatrix(utils.transposeMatrix(object.worldMatrix));

        gl.uniformMatrix4fv(wvpMatrixLocation, false, utils.transposeMatrix(projectionMatrix));
        gl.uniformMatrix4fv(normalMatrixLocation, false, utils.transposeMatrix(normalMatrix));
        gl.uniformMatrix4fv(positionMatrixLocation, false, utils.transposeMatrix(object.worldMatrix));

        gl.uniform4f(colorUniformLocation, object.drawInfo.color[0], object.drawInfo.color[1], object.drawInfo.color[2], object.drawInfo.color[3]);

        if(object.drawInfo.isColorPresent){
            gl.uniform1f(isColorPresentBooleanLocation,1.0);
        }else{
            gl.uniform1f(isColorPresentBooleanLocation, 0.0);
        }

        gl.uniform3fv(ambientLightHandle, settings.ambientLight);
        gl.uniform1f(shinessHandle, settings.shiness);
        gl.uniform3fv(cameraPositionHandle, settings.cameraPosition);
        gl.uniform3fv(pointLightPositionHandle, settings.pointLightPosition);
        gl.uniform3fv(pointLightColorHandle, settings.pointLightColor);
        gl.uniform1f(pointLightTargetHandle, settings.pointLightTarget);
        gl.uniform1f(pointLightDecayHandle, settings.pointLightDecay);
        gl.uniform3fv(directLightColorHandle, settings.directLightColor);
        gl.uniform3fv(directLightDirectionHandle, settings.directLightDir);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.uniform1i(textureUniformLocation, 0);

        gl.bindVertexArray(object.drawInfo.vertexArray);
        gl.drawElements(gl.TRIANGLES, object.drawInfo.bufferLength, gl.UNSIGNED_SHORT, 0 );
    });

    skyObjects.forEach(function(object) {
        gl.useProgram(object.drawInfo.programInfo);

        var projectionMatrix = utils.multiplyMatrices(viewProjectionMatrix, object.worldMatrix);
        var normalMatrix = utils.invertMatrix(utils.transposeMatrix(object.worldMatrix));

        gl.uniformMatrix4fv(wvpMatrixLocation, false, utils.transposeMatrix(projectionMatrix));
        gl.uniformMatrix4fv(normalMatrixLocation, false, utils.transposeMatrix(normalMatrix));
        gl.uniformMatrix4fv(positionMatrixLocation, false, utils.transposeMatrix(object.worldMatrix));

        gl.uniform4f(colorUniformLocation, object.drawInfo.color[0], object.drawInfo.color[1], object.drawInfo.color[2], object.drawInfo.color[3]);

        if(object.drawInfo.isColorPresent){
            gl.uniform1f(isColorPresentBooleanLocation,1.0);
        }else{
            gl.uniform1f(isColorPresentBooleanLocation,0.0);
        }

        gl.uniform3fv(ambientLightHandle, settings.ambientLight);
        gl.uniform1f(shinessHandle, settings.shiness);
        gl.uniform3fv(cameraPositionHandle, settings.cameraPosition);
        gl.uniform3fv(pointLightPositionHandle, settings.pointLightPosition);
        gl.uniform3fv(pointLightColorHandle, settings.pointLightColor);
        gl.uniform1f(pointLightTargetHandle, settings.pointLightTarget);
        gl.uniform1f(pointLightDecayHandle, settings.pointLightDecay);
        gl.uniform3fv(directLightColorHandle, settings.directLightColor);
        gl.uniform3fv(directLightDirectionHandle, settings.directLightDir);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.uniform1i(textureUniformLocation, 0);

        gl.bindVertexArray(object.drawInfo.vertexArray);
        gl.drawElements(gl.TRIANGLES, object.drawInfo.bufferLength, gl.UNSIGNED_SHORT, 0 );
    });

    requestAnimationFrame(drawScene);

}


//#region Obj Load and Textures

/**
 * Function used to load the meshes of a list of .obj files passed by json.
 * @param file is the json file containing the locations of the objects
 * @returns {Promise<*[]>} an array containing all the meshes of the loaded obj files
 */
async function loadObjects(file) {
    var text = await file.text();
    var objectsJ = JSON.parse(text);
    var objStr = [];
    meshes = [];
    for (let i = 0; i< objectsJ.length; i++){
        objStr[i] = await utils.get_objstr(objectsJ[i]);
        meshes[i] = {
            mesh: new OBJ.Mesh(objStr[i]),
            code: i
        };
        OBJ.initMeshBuffers(gl, meshes[i].mesh);
    }
}

function setupTextures() { //TODO modificare per caricare le textures sugli oggetti che non hanno terrain
    texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    var image = new Image();
    image.src = "Graphics/Models/Terrain-Texture_2.png";
    image.onload = function () {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

        gl.generateMipmap(gl.TEXTURE_2D);
    };
}

//endregion

//#region Canvas
function getCanvas() {
    var canvas = document.getElementById("canvas");

    gl = canvas.getContext("webgl2")
    if (!gl) {
        document.write("GL context not opened");
        return;
    } else {
        console.log('WebGL version: ', gl.getParameter(gl.VERSION));
        console.log('WebGL vendor : ', gl.getParameter(gl.VENDOR));
        console.log('WebGL supported extensions: ', gl.getSupportedExtensions());
        let depth_texture_extension = gl.getExtension('WEBGL_depth_texture');
    }
    utils.resizeCanvasToDisplaySize(gl.canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    // Clear the canvas
    gl.clearColor(1, 1, 1, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
}

//endregion

function CreateNode(x, y, type){
    var z = 0;
    var translateFactor = settings.translateFactor
    var translateOffset = settings.GetTranslateByType(type);
    var scaleFactor = settings.GetScaleByType(type);

    const node = new Node();
    node.localMatrix =
        utils.multiplyMatrices(
            utils.MakeTranslateMatrix(
                x * translateFactor + translateOffset[0],
                y * translateFactor + translateOffset[1],
                0 + translateOffset[2]),
            utils.MakeScaleMatrixXYZ(
                scaleFactor[0],
                scaleFactor[1],
                scaleFactor[2]));
    node.drawInfo = {
        programInfo: program,
        bufferLength: meshes[type].mesh.indexBuffer.numItems,
        vertexArray: vao_arr[type],
        color: [0,0,0,1],
        isColorPresent: false
    };
    node.gameInfo = {
        x: x,
        y: y,
        z: z,
        type: type
    };
    node.setParent(mapSpace);
    objects.push(node);
}

/** creates the clouds and inserts them in the sky space */
function setClouds(){
    var z = -40;
    var translateFactor = settings.translateFactor
    var translateOffset = settings.GetTranslateByType(2);

    let cloudNumber = Math.ceil(Math.random()*10);

    for(let i=1; i<=cloudNumber; i++){
        var scaleFactor = settings.GetScaleByType(2);
        scaleFactor[0] = 0.5 + Math.random()*3;

        const node = new Node();
        let y = Math.random();

        node.localMatrix =
            utils.multiplyMatrices(
                utils.MakeTranslateMatrix(
                    i * settings.cloudTranslateFactor * translateFactor + translateOffset[0],
                    i * y * translateFactor + translateOffset[1],
                    z + translateOffset[2]),
                utils.MakeScaleMatrixXYZ(
                    scaleFactor[0],
                    scaleFactor[1],
                    scaleFactor[2]));
        node.drawInfo = {
            programInfo: program,
            bufferLength: meshes[2].mesh.indexBuffer.numItems,
            vertexArray: vao_arr[2],
            color: settings.cloudsColor,
            isColorPresent: true

        };
        node.gameInfo = {
            x: settings.cloudTranslateFactor,
            y: y,
            z: z,
            type: 2
        };
        node.setParent(skySpace);
        skyObjects.push(node);
    }

}


function setGuiListeners(){

    // UI Listeners
    document.getElementById("play_again_button").addEventListener("click", function (e){
        startGame();
    });
    /*document.getElementById("back_to_main").addEventListener("click", function (e){
        addBlock();
    });*/

    //game Listeners
    document.addEventListener("keydown", onKeyDown, false);
    document.addEventListener("keyup", onKeyUp, false);
}

//# region UI events

function toggleGameOver(status){
    let gameOverMenu = document.getElementById("game_over_menu");

    gameOverMenu.hidden = status;
}

//endregion

//#region Keyboard events

function onKeyDown(event){
    switch (event.keyCode){
        case 87: //W
            //
            break;
        case 65: //A
            horizontalAcceleration = -0.8;
            checkEasterEgg(4)
            break;
        case 83: //S
            //
            break;
        case 68: //D
            horizontalAcceleration = 0.8;
            checkEasterEgg(6);
            break;
        case 32: //SPACEBAR
            jumpRoutine();
            break;
        case 37: //LEFT ARROW
            horizontalAcceleration = -0.8;
            break;
        case 38: //UP ARROW
            //
            break;
        case 39: //RIGHT ARROW
            horizontalAcceleration = 0.8;
            break;
        case 40: //DOWN ARROW
            //
            break;
        case 86: //V -> change view?
            //
            break;
        case 70: //F -> full screen?
            toggleFullScreen();
            break;
        case 27: //ESC
            //
            break;
        case 71: //G
            checkEasterEgg(0)
            break;
        case 82: //R
            checkEasterEgg(1)
            break;
        case 73: //I
            checkEasterEgg(2)
            break;
        case 66: //B
            checkEasterEgg(3);
            break;
        case 85: //U
            checkEasterEgg(5);
            break;
        case 79: //O
            checkEasterEgg(7);
            if(easterEgg === 8){
                swapPlayerModel();
            }
            break;
    }
}

function onKeyUp(event){
    switch (event.keyCode){
        case 87: //W
            //
            break;
        case 65: //A
            horizontalAcceleration = 0;
            horizontalSpeed = 0;
            keyPressed = false;
            break;
        case 83: //S
            //
            break;
        case 68: //D
            horizontalAcceleration = 0;
            horizontalSpeed = 0;
            keyPressed = false;
            break;
        case 32: //SPACEBAR
            //
            break;
        case 37: //LEFT ARROW
            horizontalAcceleration = 0;
            horizontalSpeed = 0;
            break;
        case 38: //UP ARROW
            //
            break;
        case 39: //RIGHT ARROW
            horizontalAcceleration = 0;
            horizontalSpeed = 0;
            break;
        case 40: //DOWN ARROW
            //
            break;
        case 71: //G
            keyPressed = false;
            break;
        case 82: //R
            keyPressed = false;
            break;
        case 73: //I
            keyPressed = false;
            break;
        case 66: //B
            keyPressed = false;
            break;
        case 85: //U
            keyPressed = false;
            break;
        case 79: //O
            keyPressed = false;
            break;
    }
}

 function jumpRoutine(){
    if(jumping){
        return;
    }
    jumping = true;
    verticalAcceleration = settings.jumpHeight;
 }

//#region EasterEgg

//For each letter checks if the sequence is correct, if not resets the counter
function checkEasterEgg(letterNumber){
    if(easterEgg === letterNumber && keyPressed === false){
        easterEgg++;
        keyPressed = true;
        return;
    }
    if(easterEgg !== letterNumber){
        easterEgg = 0;
    }
    keyPressed = true;

}

//if the sequence for the easter egg is complete swaps the player model
function swapPlayerModel(){
    if(activePlayerModel === 0){
        objects[0].drawInfo.bufferLength = meshes[7].mesh.indexBuffer.numItems;
        objects[0].drawInfo.vertexArray = vao_arr[7];
        activePlayerModel = 1;
    }
    else{
        objects[0].drawInfo.bufferLength = meshes[8].mesh.indexBuffer.numItems;
        objects[0].drawInfo.vertexArray = vao_arr[8];
        activePlayerModel = 0;
    }
    easterEgg = 0;
}

//endregion

//endregion

//# region gameManager


var lives;

function startGame(){
    //reset parameters
    lives = settings.startingLives;
    objects[0].position = playerStartPosition;
    horizontalSpeedCap = settings.horizontalSpeedCap;
    verticalSpeedCap = settings.verticalSpeedCap;
    toggleGameOver(true);
}


function deathScreen(){
    horizontalSpeed = 0;
    verticalSpeed = 0;
    horizontalAcceleration = 0;
    verticalAcceleration = 0;
    horizontalSpeedCap = 0;
    verticalSpeedCap = 0;
    toggleGameOver(false);

}

function hedgeDamage(){
    lives --;
    if(lives === 0){
        deathScreen()
    }

}

function fallOffScreen(){
    lives --;
    if(lives === 0){
        deathScreen()
    }else{
        repositionPlayer(playerStartPosition);
        settings.changeCamera(0); //TODO change number with camera preset passed before playing
    }
    horizontalSpeed = 0;
    verticalSpeed = 0;
    horizontalAcceleration = 0;
    verticalAcceleration = 0;

}

function repositionPlayer(newPosition){
    objects[0].localMatrix = newPosition;
    if(!lookinRight){
        invertPlayerModel()
    }
}

//endregion


/**
 * Toggles between window mode and full screen.
 */
function toggleFullScreen() {
    var canvas = document.getElementById("canvas");
    if(!document.fullscreenElement) {
        let outcome = canvas.requestFullscreen();
        if(!outcome){
            window.alert("Impossible to change to Full Screen");
        }
    }
    else {
        if(document.exitFullscreen) {
            let outcome = document.exitFullscreen();
            if(!outcome){
                window.alert("Impossible to exit to Full Screen");
            }
        }
    }
}

window.onload = init(); //TODO mappa presa dal main