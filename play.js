import {Block} from "./Engine/Model/Block.js";
import {MapHandler} from "./Engine/Model/MapHandler.js";
import {SkyBox} from "./Engine/Model/SkyBox.js";
import {Node} from "./Engine/Model/Node.js";

//# region Variables


/**
 * mapHandler instance.
 */
var mapHandler = new MapHandler();

/**
 * New map instance.
 */
var map;

/**
 * time variable used for the hedges timings.
 */
var time = 0;

/**
 * String containing the name of the base directory of the application.
 */
let baseDir;

/**
 * WebGLRenderingContext variable instance.
 */
let gl;

/**
 * WebGL Program variable instance.
 */
let program;

/**
 * Instances of the Vertex Array Objects in the scene.
 * @type {*[]}
 */
let vao_arr = []; //data structure containing all the VAO (one for each type of obj)

/**
 * Instances of the meshes of the objects loaded in the scene.
 * @type {*[]}
 */
let meshes = [];

//OBJECTS
/**
 * Arrays containing the instances of the objects to be rendered in the scene.
 * objects: the objects of the interactive part of the scene.
 * backgroundObjects: the objects of the non-interactive part of the scene.
 * skyObjects: the clouds rendered in the sky.
 * hedgeObjects: all the hedges present in the level.
 */
var objects = []; // list of objects to be rendered for the playable map
var backgroundObjects = []; //list of objects to be rendered for the background
var skyObjects = []; //list of objects to be rendered on the sky
var hedgeObjects = [];

/**
 * The instances of the four main nodes of the sceneGraph.
 */
var worldSpace;
var mapSpace;
var skySpace;
var backgroundSpace;



//TEXTURES and BUFFERS
/**
 * Instances of the textures and relative texture to be used in the application.
 * @type {*[]}
 */
var texture = [];
var image = [];

//ATTRIBUTES AND UNIFORMS
/**
 * Instances of the locations of all the attribute and uniforms in the WebGLProgram.
 */
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
/**
 * Instance of the SkyBox.
 * @type {SkyBox}
 */
var skyBox = new SkyBox();


//Parameters for Game Loop
/**
 * variables used to calculate the animations according to the elapsed time since last frame.
 */
var lastFrameTime;
var deltaTime;

/**
 * The local matrix of the player at spawn.
 * @type {*[]}
 */
var playerStartPosition = [];

//parameter for movement
/**
 * variables used for the player movement.
 * actual and max speed, accelerations.
 * @type {number}
 */
var horizontalSpeed =  0;
var verticalSpeed = 0;
var horizontalSpeedCap = settings.horizontalSpeedCap;
var verticalSpeedCap = settings.verticalSpeedCap;
var horizontalAcceleration = 0;
var verticalAcceleration = 0;
var gravity = settings.gravity;
var deceleration = settings.deceleration;

/**
 * variable used to prevent the player from infinite jumping.
 * @type {boolean}
 */
var jumping = false;


//EasterEgg
/**
 * Variables used to keep track of the inputs for the easter egg.
 * @type {number}
 */
var easterEgg = 0;
var keyPressed = false;

/**
 * variable used to keep track of the active player model when activating the easter egg.
 * @type {number}
 */
var activePlayerModel = 0;


//utility
/**
 * Matrix used to rotate the player model 180 degrees.
 */
var rotateYaxismatrix = utils.MakeRotateYMatrix(180);

/**
 * variable used to keep track of the player model facing direction.
 * @type {boolean}
 */
var lookinRight = true;

/**
 * variable used to keep track of the selected camera preset.
 */
var cameraPreset;

// endregion

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

/**
 * This method is used to set all the variables that will be used by the application to work and call the render loop.
 */
function main(){
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

    loadCameraSettings();

    sceneGraphDefinition();

    requestAnimationFrame(drawScene);
}
//#endregion

//#region Program Initialization
/**
 * This method gets the location of all Attributes and Uniforms of the GLProgram.
 */
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

/**
 * This function creates a Vertex Array Object for each mesh and saves it.
 */
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

/**
 * Loads the camera preset passed by the map selection menu.
 */
function loadCameraSettings(){
    cameraPreset = parseInt(window.localStorage.getItem("cameraPreset"));
    settings.changeCamera(cameraPreset);
}

/**
 * This method creates the scene graph and the related spaces and nodes.
 */
function sceneGraphDefinition(){
    map = mapHandler.loadMap(parseInt(window.localStorage.getItem("playMap")));
    worldSpace = new Node();
    worldSpace.localMatrix = utils.MakeWorld(-100, -60, 0, 0, 0, 0, 1.0);

    var playerNode = new Node();
    playerNode.localMatrix = utils.multiplyMatrices(
        rotateYaxismatrix,utils.multiplyMatrices(
            utils.MakeTranslateMatrix(0, 25, 0),
            utils.MakeScaleMatrix(settings.scaleFactorPlayer)));
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

    //creation of the background
    backgroundSpace = new Node();
    backgroundSpace.setParent(worldSpace);

    map.backgroundObjects.forEach(function(element){
        const xPos = element.position[0];
        const yPos = element.position[1];
        CreateDecorationNode(xPos, yPos, element.type);
    });

}
//endregion

//# region Rendering

/**
 * This is the rendering part of the program that will be drawn on the canvas at each frame.
 * the function also contains the calls for the animations.
 */
function drawScene(currentTime){
    if(!lastFrameTime){
        lastFrameTime = currentTime;
    }
    deltaTime = currentTime - lastFrameTime;
    time += deltaTime;
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

    animateHedges(time);

    checkCloudsPosition();

    worldSpace.updateWorldMatrix();

    skyBox.InitializeAndDraw();

    objects.forEach(function(object) {
        initializeAndDrawObject(object, viewProjectionMatrix);
    });

    skyObjects.forEach(function(object) {
        initializeAndDrawObject(object, viewProjectionMatrix);
    });

    hedgeObjects.forEach(function(object) {
        initializeAndDrawObject(object, viewProjectionMatrix);
    });

    backgroundObjects.forEach(function(object) {
        initializeAndDrawObject(object, viewProjectionMatrix);
    });

    requestAnimationFrame(drawScene);

}

/**
 * This method gets the object to draw on the canvas and sets all the attributes and uniforms in order
 * to be properly drawn.
 * @param object: object to draw.
 * @param viewProjectionMatrix: the view-projection matrix previously calculated.
 */
function initializeAndDrawObject(object, viewProjectionMatrix){
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
    gl.bindTexture(gl.TEXTURE_2D, object.drawInfo.texture);
    gl.uniform1i(textureUniformLocation, 0);

    gl.bindVertexArray(object.drawInfo.vertexArray);
    gl.drawElements(gl.TRIANGLES, object.drawInfo.bufferLength, gl.UNSIGNED_SHORT, 0 );
}

// endregion

//#region animation

/**
 * this function uses the speed and acceleration parameters to calculate the player's next position and then
 * calls the collision function to calculate if the model is going to collide with something. Then reads the result and
 * determines the next state of the game (e.g. win/loose conditions or simply movement of player).
 */
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
        collisions = checkCollisions(objects[0].localMatrix, utils.multiplyMatrices(objects[0].localMatrix, utils.MakeTranslateMatrix(-horizontalSpeed, verticalSpeed, 0)), objects.slice(1).concat(hedgeObjects));
    }else{
        collisions = checkCollisions(objects[0].localMatrix, utils.multiplyMatrices(objects[0].localMatrix, utils.MakeTranslateMatrix(horizontalSpeed, verticalSpeed, 0)), objects.slice(1).concat(hedgeObjects));
    }

    if(collisions.detected){
        if(collisions.isHedge){
            DeathHandler();
        }
        if(collisions.victory){
            winScreen();
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
        DeathHandler();
    }

    animateCamera(positionDifference);
}

/**
 * this function calculates the animation of each cloud.
 */
function moveClouds(){
    skyObjects.forEach(function (object){
        object.localMatrix = utils.multiplyMatrices(object.localMatrix, utils.MakeTranslateMatrix(- settings.cloudSpeed, 0, 0));
    });
}

/**
 * checks if the clouds have reached a certain threshold behind the player position and if so repositions them
 * a certain factor in front of the current player position.
 */
function checkCloudsPosition(){
    skyObjects.forEach(function (cloud){
        if(cloud.localMatrix[3] < objects[0].localMatrix[3] - settings.cloudsBackDespawnFactor){
            cloud.localMatrix[3] = objects[0].localMatrix[3] + settings.cloudsFrontRespawnFactor;
        }
    });
}

/**
 * function used to invert the direction which the player model is facing when changing direction of movement.
 */
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

/**
 * function that moves the camera according to the player so the player model is always in focus.
 * @param positionDifference
 */
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

/**
 * function used to deactivate the jumping button while the player is mid-air.
 */
function jumpRoutine(){
    if(jumping){
        return;
    }
    jumping = true;
    verticalAcceleration = settings.jumpHeight;
}

/**
 * function used to animate the hedges on the ground.
 * @param Time the elapsed time since the start of the game. Time variable defined as global.
 */
function animateHedges(Time){
    hedgeObjects.forEach(function (hedge){
        hedge.localMatrix[7] = hedge.gameInfo.y * settings.translateFactor;
        let movement = Math.sin(0.01*Time/settings.activeHedgesTime);
        if(movement<0){
            movement = 0;
        }
        hedge.localMatrix = utils.multiplyMatrices(hedge.localMatrix,
            utils.MakeTranslateMatrix(0, movement*settings.hedgesHeight, 0));
    })


}

//endregion

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

/**
 * This method loads all the textures in the corresponding variable ready to be used.
 */
function setupTextures() {
    texture[0] = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture[0]);
    image[0] = new Image();
    image[0].src = "Graphics/Models/Terrain-Texture_2.png";
    image[0].onload = function () {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture[0]);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image[0]);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

        gl.generateMipmap(gl.TEXTURE_2D);
    };

    texture[1] = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture[1]);
    image[1] = new Image();
    image[1].src = "Graphics/Models/Flagpole.png";
    image[1].onload = function () {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture[1]);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image[1]);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

        gl.generateMipmap(gl.TEXTURE_2D);
    };
}

//endregion

//#region Canvas

/**
 * This method gets the canvas element in the HTML page and prepares its interaction with the WebGL context.
 */
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

//#region Object Creation functions

/**
 * This function creates a new node to add to the scene. This function is used to create the playable
 * elements of the map, such as SquareIslands, CylinderIslands, Bricks and Flagpoles.
 * @param x: the x position of the new object.
 * @param y: the y position of the new object.
 * @param type: the mesh type of the new object.
 * @returns {Node}: the node object created.
 * @constructor
 */
function CreateNode(x, y, type){
    if(type === 1){
        CreateHedgeNode(x,y);
        return
    }
    var z = 0;
    var translateFactor = settings.translateFactor
    var translateOffset = settings.GetTranslateByType(type);
    var scaleFactor = settings.GetScaleByType(type);

    let node = new Node();
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
    }
    if(type === 0){
        node.drawInfo.color = settings.bricksColor;
        node.drawInfo.isColorPresent= true;
    }else{
        node.drawInfo.color = [0,0,0,1];
        node.drawInfo.isColorPresent = false;
    }
    if(type===9){
        node.drawInfo.texture = texture[1];
    }else{
        node.drawInfo.texture = texture[0]
    }
    node.gameInfo = {
        x: x,
        y: y,
        z: z,
        type: type
    };
    node.setParent(mapSpace);
    objects.push(node);
}

/**
 * This method adds a hedge to the scene.
 * @param x: the x position of the new hedge.
 * @param y: the y position of the new hedge.
 * @constructor
 */
function CreateHedgeNode(x, y){
    var z = 0;
    var translateFactor = settings.translateFactor;
    var translateOffset = settings.GetTranslateByType(1);
    var scaleFactor = settings.GetScaleByType(1);

    for(let i = 0; i < 3; i++){
        let node = new Node();
        node.localMatrix =
            utils.multiplyMatrices(
                utils.MakeTranslateMatrix(
                    x * translateFactor + translateOffset[0] + settings.hedgeDisplacement[i],
                    y * translateFactor + translateOffset[1],
                    0 + translateOffset[2]),
                utils.MakeScaleMatrixXYZ(
                    scaleFactor[0],
                    scaleFactor[1],
                    scaleFactor[2]));
        node.drawInfo = {
            programInfo: program,
            bufferLength: meshes[1].mesh.indexBuffer.numItems,
            vertexArray: vao_arr[1]
        }
        node.drawInfo.color = settings.hedgeColor;
        node.drawInfo.isColorPresent= true;

        node.gameInfo = {
            x: x,
            y: y,
            z: z,
            type: 1
        };

        node.setParent(mapSpace);
        hedgeObjects.push(node);
    }
}

/** creates the clouds and inserts them in the sky space */
function setClouds(){

    var translateFactor = settings.translateFactor
    var translateOffset = settings.GetTranslateByType(2);

    let cloudNumber = settings.cloudBaseNumber + Math.ceil(Math.random()*8);

    for(let i=1; i<=cloudNumber; i++){
        let z = -30 - Math.ceil(Math.random()*5)*10;
        var scaleFactor = settings.GetScaleByType(2);
        scaleFactor[0] = 0.5 + Math.random()*3;

        let node = new Node();
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

/**
 * This method adds a decoration node to the map space.
 * @param x: the x position of the new backgroundObject.
 * @param y: the y position of the new backgroundObject.
 * @param type: the mesh type of the new backgroundObject.
 * @constructor
 */
function CreateDecorationNode(x, y, type){
    var z = -settings.translateFactor;
    var translateFactor = settings.translateFactor;
    var translateOffset = settings.GetTranslateByType(type);
    var scaleFactor = settings.GetScaleByType(type);

    let node = new Node();
    node.localMatrix =
        utils.multiplyMatrices(
            utils.MakeTranslateMatrix(
                x * translateFactor + translateOffset[0],
                (y) * translateFactor + translateOffset[1],
                z + translateOffset[2]),
            utils.MakeScaleMatrixXYZ(
                scaleFactor[0],
                scaleFactor[1],
                scaleFactor[2]));
    node.drawInfo = {
        programInfo: program,
        bufferLength: meshes[type].mesh.indexBuffer.numItems,
        vertexArray: vao_arr[type]
    }
    if(type === 0){
        node.drawInfo.color = settings.bricksColor;
        node.drawInfo.isColorPresent= true;
    }else{
        node.drawInfo.color = [0,0,0,1];
        node.drawInfo.isColorPresent = false;
    }
    node.setParent(mapSpace);
    map.backgroundObjects.push(new Block(x, y, type));
    backgroundObjects.push(node);
}

//endregion

//# region Event Listeners

/**
 * enables the GUI listeners
 */
function setGuiListeners(){

    // UI Listeners
    document.getElementById("play_again_button").addEventListener("click", function (e){
        startGame();
    });

    document.getElementById("play_pain_button").addEventListener("click", function (e){
        startGame();
    });
    /*document.getElementById("back_to_main").addEventListener("click", function (e){
        addBlock();
    });*/

    //game Listeners
    document.addEventListener("keydown", onKeyDown, false);
    document.addEventListener("keyup", onKeyUp, false);
}

//endregion

//# region UI events
/**
 * function used to enable end disable the win and loose screens.
 * @param status boolean that is true if the panel needs to be hidden or false if the panel needs to be visible.
 * @param screenID the name of the panel to toggle.
 */
function toggleScreen(status, screenID){
    let panel = document.getElementById(screenID);
    panel.hidden = status;
}

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

//endregion

//#region Keyboard events

/**
 * Function to listen to the key pressed event.
 * @param event
 */
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
                swapMusic();
            }
            break;
    }
}

/**
 * function to listen to the key released event.
 * @param event
 */
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

//endregion

//#region EasterEgg

//For each letter checks if the sequence is correct, if not resets the counter
/**
 * function to check if the easter egg keys are pressed in the right order.
 * @param letterNumber the number corresponding to the letter pressed.
 */
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
/**
 * if the easter egg sequence is correctly completed this function swaps the player ghost model with the easter egg one.
 */
function swapPlayerModel(){
    if(activePlayerModel === 0){
        objects[0].drawInfo.bufferLength = meshes[7].mesh.indexBuffer.numItems;
        objects[0].drawInfo.vertexArray = vao_arr[7];
        objects[0].drawInfo.color = settings.treeColor;
        activePlayerModel = 1;
    }
    else{
        objects[0].drawInfo.bufferLength = meshes[8].mesh.indexBuffer.numItems;
        objects[0].drawInfo.vertexArray = vao_arr[8];
        objects[0].drawInfo.color = settings.playerColor;
        activePlayerModel = 0;
    }
    easterEgg = 0;
}

/**
 * if the easter egg sequence is correctly completed this function swaps the play screen song with one
 * between two (randomly selected) easter egg songs.
 */
function swapMusic(){
    if(activePlayerModel === 1){
        let prob = Math.random();
        if (prob >= 0.5) document.getElementById("audio").src = "Game/Music/playEDgy.mp3";
        else document.getElementById("audio").src = "Game/Music/playEDgy2.mp3";
    } else {
        document.getElementById("audio").src = "Game/Music/play.mp3";
    }
}
//endregion

//# region gameManager

/**
 * variable that contains the current player lives.
 */
var lives;

/**
 * function that resets the game parameters and switches off the win or loose screens.
 */
function startGame(){
    //reset parameters
    lives = settings.startingLives;
    objects[0].position = playerStartPosition;
    horizontalSpeedCap = settings.horizontalSpeedCap;
    verticalSpeedCap = settings.verticalSpeedCap;
    toggleScreen(true, "game_over_menu");
    toggleScreen(true, "win_menu");
}

/**
 * Stops the player from moving and enables the Lost screen.
 */
function deathScreen(){
    horizontalSpeed = 0;
    verticalSpeed = 0;
    horizontalAcceleration = 0;
    verticalAcceleration = 0;
    horizontalSpeedCap = 0;
    verticalSpeedCap = 0;
    toggleScreen(false, "game_over_menu");
}

/**
 * Stops the player from moving and enables the Won screen.
 */
function winScreen(){
    horizontalSpeed = 0;
    verticalSpeed = 0;
    horizontalAcceleration = 0;
    verticalAcceleration = 0;
    horizontalSpeedCap = 0;
    verticalSpeedCap = 0;
    toggleScreen(false, "win_menu");
}

/**
 * for each death checks if there are still lives remaining and in case of falling out of the map
 * repositions the player to the spawn position.
 * @constructor
 */
function DeathHandler(){
    lives --;
    if(lives === 0){
        deathScreen()
    }else{
        repositionPlayer(playerStartPosition);
        settings.changeCamera(cameraPreset);
    }
    horizontalSpeed = 0;
    verticalSpeed = 0;
    horizontalAcceleration = 0;
    verticalAcceleration = 0;
}

/**
 * repositions the player to a passed position.
 * @param newPosition the position which the player is going to be placed.
 */
function repositionPlayer(newPosition){
    objects[0].localMatrix = newPosition;
    if(!lookinRight){
        invertPlayerModel()
    }
}

//endregion

window.onload = init();