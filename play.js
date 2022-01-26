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
var objects = []; // list of objects to be rendered
var worldSpace;

//STAGE
var sceneRoot //the list of objects in which the player moves. all the objects are already initialized

//TEXTURES and BUFFERS
var texture;

//ATTRIBUTES AND UNIFORMS
var positionAttributeLocation;
var uvAttributeLocation;
var normalAttributeLocation;

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


//Parameters for Camera
var cx = 4.0;
var cy = 0.0;
var cz = 20.0;
var elevation = 50.0;
var angle = 0.0;
var lookRadius = 60.0;


//SKYBOX
var skyBox = new SkyBox();


//Parameters for Game Loop
var lastFrameTime;
var deltaTime;

//parameter for movement
var horizontalSpeed =  0;
var verticalSpeed = 0;
var horizontalSpeedCap = 5;
var verticalSpeedCap = 5;
var horizontalAcceleration = 0;
var verticalAcceleration = 0;
var gravity = -0.1;
var deceleration = 0.5; //deceleration = 1 means the speed is linear. deceleration = 0 there is no acceleration.
var jumping = false;


//EasterEgg
var easterEgg = 0;
var keyPressed = false;
var activePlayerModel = 0;



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

    document.addEventListener("keydown", onKeyDown, false);
    document.addEventListener("keyup", onKeyUp, false);

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

    //setGuiListeners();

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

    var map = new Map("First map");
    map.addPlayable(new Block(0,0, 6));
    map.addPlayable(new Block(20,0, 6));
    map.addPlayable(new Block(40,20, 0));
    map.addPlayable(new Block(60,20, 0));
    map.addPlayable(new Block(80,0, 6));
    map.addPlayable(new Block(100,0, 6));
    map.addPlayable(new Block(120,20, 0));
    map.addPlayable(new Block(140,20, 0));
    map.addPlayable(new Block(160,0, 6));

    worldSpace = new Node();
    worldSpace.localMatrix = utils.MakeWorld(-100, -60, 0, 0, 0, 0, 1.0);

    var playerNode = new Node();
    playerNode.localMatrix = utils.multiplyMatrices(utils.MakeTranslateMatrix(0, 25, 0), utils.MakeScaleMatrix(4))
    playerNode.drawInfo = {
        programInfo: program,
        bufferLength: meshes[8].mesh.indexBuffer.numItems,
        vertexArray: vao_arr[8]
    };
    playerNode.setParent(worldSpace);
    objects.push(playerNode);

    var mapSpace = new Node();
    mapSpace.setParent(worldSpace);

    /*const pipe = new Node();
    pipe.drawInfo = {
        programInfo: program,
        bufferLength: meshes[9].mesh.indexBuffer.numItems,
        vertexArray: vao_arr[9]
    };
    pipe.setParent(mapSpace);
    objects.push(pipe);

    const pipeBase = new Node();
    pipeBase.drawInfo = {
        programInfo: program,
        bufferLength: meshes[10].mesh.indexBuffer.numItems,
        vertexArray: vao_arr[10]
    };
    pipeBase.setParent(mapSpace);
    objects.push(pipeBase);*/

    map.playableObjects.forEach(function(element){
        const xPos = element.position[0];
        const yPos = element.position[1];
        const node = new Node();
        node.localMatrix = utils.MakeTranslateMatrix(xPos,yPos,0);
        node.drawInfo = {
            programInfo: program,
            bufferLength: meshes[element.type].mesh.indexBuffer.numItems,
            vertexArray: vao_arr[element.type]
        };
        node.setParent(mapSpace);
        objects.push(node);
    });
}
//endregion

function updatePlayerPosition() {
    let collisions;
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
    collisions = checkCollisions(objects[0].localMatrix, utils.multiplyMatrices(objects[0].localMatrix, utils.MakeTranslateMatrix(horizontalSpeed, verticalSpeed, 0)), objects.slice(1));
    if(collisions.detected){
        jumping = false;
        horizontalSpeed *= collisions.speedMultiplier[0];
        horizontalAcceleration *= collisions.speedMultiplier[0];
        verticalSpeed *= collisions.speedMultiplier[1];
        verticalAcceleration *= collisions.speedMultiplier[1];
    }
    objects[0].localMatrix = collisions.position;

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
    var cameraPosition = [0.0, -20.0, 200.0];
    var target = [0.0, 0.0, 0.0];
    var up = [0.0, 0.0, 1.0];
    var cameraMatrix = utils.LookAt(cameraPosition, target, up);
    var viewMatrix = utils.invertMatrix(cameraMatrix);

    var viewProjectionMatrix = utils.multiplyMatrices(projectionMatrix, viewMatrix);

    updatePlayerPosition();

    worldSpace.updateWorldMatrix();

    skyBox.InitializeAndDraw();

    objects.forEach(function(object) {
        gl.useProgram(object.drawInfo.programInfo);

        var projectionMatrix = utils.multiplyMatrices(viewProjectionMatrix, object.worldMatrix);
        var normalMatrix = utils.invertMatrix(utils.transposeMatrix(object.worldMatrix));

        gl.uniformMatrix4fv(wvpMatrixLocation, false, utils.transposeMatrix(projectionMatrix));
        gl.uniformMatrix4fv(normalMatrixLocation, false, utils.transposeMatrix(normalMatrix));
        gl.uniformMatrix4fv(positionMatrixLocation, false, utils.transposeMatrix(object.worldMatrix));

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


/**
 * EVENT LISTENERS
 */

var settingObj = function (max, positiveOnly, value){
    this.id = null;
    this.max=max;
    this.positiveOnly=positiveOnly;
    this.value=value;
    this.locked = false;
}

settingObj.prototype.init = function(id){
    this.id = id;
    document.getElementById(id+'_value').innerHTML=this.value.toFixed(2);
    document.getElementById(id+'_slider').value = document.getElementById(id+'_slider').max * this.value/this.max;
}

settingObj.prototype.onSliderInput = function(slider_norm_value, id){
    this.value = slider_norm_value * this.max;
    document.getElementById(id+'_value').innerHTML=this.value.toFixed(2);
}

settingObj.prototype.lock= function(){
    this.locked = true;
    document.getElementById(this.id+'_value').innerHTML=" -";
    document.getElementById(this.id+'_slider').disabled=true;
}

const gui_settings = {
    'cameraX': new settingObj(50, false, settings.cameraPosition[0]),
    'cameraY': new settingObj(50, false, settings.cameraPosition[1]),
    'cameraZ': new settingObj(50, false, settings.cameraPosition[2]),
    'fieldOfView': new settingObj(180, true, settings.fieldOfView),
    'dirTheta': new settingObj(180, true, settings.directLightTheta),
    'dirPhi': new settingObj(180, false, settings.directLightPhi),
    'ambientLight': new settingObj(1, true, settings.ambientLight[0])
}

function onSliderChange(slider_value, id) {
    let slider_norm_value = slider_value / document.getElementById(id + '_slider').max;
    gui_settings[id].onSliderInput(slider_norm_value, id);
    if (!gui_settings['cameraX'].locked) {
        settings.cameraPosition[0] = gui_settings['cameraX'].value;
        settings.cameraPosition[1] = gui_settings['cameraY'].value;
        settings.cameraPosition[2] = gui_settings['cameraZ'].value;
    }
    settings.fieldOfView = gui_settings['fieldOfView'].value;
    settings.ambientLight[0] = gui_settings['ambientLight'].value;
    settings.ambientLight[1] = gui_settings['ambientLight'].value;
    settings.ambientLight[2] = gui_settings['ambientLight'].value;
    settings.directLightTheta = gui_settings['dirTheta'].value;
    settings.directLightPhi = gui_settings['dirPhi'].value;
}

function setGuiListeners(){
    document.getElementById("cameraX_slider").addEventListener("input", function (event){
        onSliderChange(this.value, 'cameraX');
    }, false);
    document.getElementById("cameraY_slider").addEventListener("input", function (event){
        onSliderChange(this.value, 'cameraY');
    }, false);
    document.getElementById("cameraZ_slider").addEventListener("input", function (event){
        onSliderChange(this.value, 'cameraZ');
    }, false);
    document.getElementById("ambientLight_slider").addEventListener("input", function (event){
        onSliderChange(this.value, 'ambientLight');
    }, false);
    document.getElementById("dirPhi_slider").addEventListener("input", function (event){
        onSliderChange(this.value, 'dirPhi');
    }, false);
    document.getElementById("dirTheta_slider").addEventListener("input", function (event){
        onSliderChange(this.value, 'dirTheta');
    }, false);
    document.getElementById("fieldOfView_slider").addEventListener("input", function (event){
        onSliderChange(this.value, 'fieldOfView');
    }, false);
}

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
    verticalAcceleration = 5;
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