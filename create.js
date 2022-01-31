//#region Imports
import {Block} from "./Engine/Model/Block.js";
import {MapHandler} from "./Engine/Model/MapHandler.js";
import {SkyBox} from "./Engine/Model/SkyBox.js";
import {Node} from "./Engine/Model/Node.js";
//endregion

//#region Variables
/**
 * MapHandler instance.
 */
let mapHandler = new MapHandler();

/**
 * New Map instance.
 */
let map;

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

/**
 * Arrays containing the instances of the objects to be rendered in the scene.
 * objects: the objects of the interactive part of the scene.
 * backgroundObjects: the objects of the non-interactive part of the scene.
 */
let objects = [];
let backgroundObjects = [];

/**
 * The instances of the two main nodes of the sceneGraph.
 */
let worldSpace;
let mapSpace;

//utility
/**
 * Matrix used to rotate 180 degrees the player model.
 */
let rotateYaxisMatrix = utils.MakeRotateYMatrix(180);

/**
 * Instances of the textures and relative texture to be used in the application.
 * @type {*[]}
 */
let texture = [];
let image = [];

/**
 * Instances of the locations of all the attribute and uniforms in the WebGLProgram.
 */
let positionAttributeLocation;
let uvAttributeLocation;
let normalAttributeLocation;

let colorUniformLocation;
let isColorPresentBooleanLocation;

let wvpMatrixLocation;
let positionMatrixLocation;
let normalMatrixLocation;

let cameraPositionHandle;

let ambientLightHandle;
let textureUniformLocation;
let shininessHandle;

let pointLightPositionHandle;
let pointLightColorHandle;
let pointLightTargetHandle;
let pointLightDecayHandle;

let directLightColorHandle;
let directLightDirectionHandle;

/**
 * Instance of the SkyBox.
 * @type {SkyBox}
 */
let skyBox = new SkyBox();
//endregion

//#region Init and Main
/**
 * Entry point of the WebGL program.
 */
async function init() {
    const path = window.location.pathname;
    const page = path.split("/").pop();
    baseDir = window.location.href.replace(page, '');
    settings.shaderDir = baseDir + "Graphics/Shaders/"; //Shader files will be put in the shaders folder
    settings.skyboxDir = baseDir + "Graphics/Env/"; //Skybox directories

    getCanvas();
    document.addEventListener("keydown", onKeyDown, false);
    document.addEventListener("keyup", onKeyUp, false);

    //Compile and Link Shaders
    //load shaders from file
    await utils.loadFiles([settings.shaderDir + 'vs.glsl', settings.shaderDir + 'fs.glsl'], function (shaderText) {
        let vertexShader = utils.createShader(gl, gl.VERTEX_SHADER, shaderText[0]);
        let fragmentShader = utils.createShader(gl, gl.FRAGMENT_SHADER, shaderText[1]);
        program = utils.createProgram(gl, vertexShader, fragmentShader);
    });

    gl.useProgram(program);

    //Load object
    let objectFile = await fetch("Engine/blocks.json");
    await loadObjects(objectFile);

    //load Texture
    setupTextures();

    main();
}

/**
 * This method is used to set all the variables that will be used by the application to work.
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
    shininessHandle = gl.getUniformLocation(program, "u_shininess");
}

/**
 * This function creates a Vertex Array Object for each mesh and saves it.
 */
function createVaos(){
    meshes.forEach(mesh => {
        const vao = gl.createVertexArray();
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
 * This method creates the scene graph and the related spaces and nodes.
 */
function sceneGraphDefinition(){
    map = mapHandler.createMap();
    map.addPlayable(new Block(0,0, 6));

    worldSpace = new Node();
    worldSpace.localMatrix = utils.MakeWorld(-70, -60, 0, 0, 0, 0, 1.0);

    var playerNode = new Node();
    playerNode.localMatrix = utils.multiplyMatrices(
        rotateYaxisMatrix,utils.multiplyMatrices(
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

    mapSpace = new Node();
    mapSpace.setParent(worldSpace);

    let x = map.playableObjects[0].position[0];
    let y = map.playableObjects[0].position[1];
    let type = map.playableObjects[0].type;
    let node = CreateNode(x, y, 0, type, 0);
    node.setParent(mapSpace);
    map.addPlayable(new Block(x, y, type));
    objects.push(node);
}
//endregion

//#region Rendering and animations
/**
 * This is the rendering part of the program that will be drawn on the canvas at each frame.
 */
function drawScene(){
    gl.clearColor(0.85, 0.85, 0.85, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    let aspect = gl.canvas.width / gl.canvas.height;
    let projectionMatrix = utils.MakePerspective(60.0, aspect, 1.0, 2000.0);

    let cameraMatrix = utils.LookAt(settings.createCameraPosition, settings.createCameraTarget, settings.createCameraUp);
    let viewMatrix = utils.invertMatrix(cameraMatrix);

    let viewProjectionMatrix = utils.multiplyMatrices(projectionMatrix, viewMatrix);

    worldSpace.updateWorldMatrix();

    skyBox.InitializeAndDraw();

    objectDrawing(objects, viewProjectionMatrix);
    objectDrawing(backgroundObjects, viewProjectionMatrix);

    requestAnimationFrame(drawScene);
}

/**
 * This method gets an array of object to draw on the canvas and sets all the attributes and uniforms in order for each
 * object to be properly drawn.
 * @param objects: array of object to draw.
 * @param viewProjectionMatrix: the view-projection matrix previously calculated.
 */
function objectDrawing(objects, viewProjectionMatrix){
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
        gl.uniform1f(shininessHandle, settings.shiness);
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
    });
}
//endregion

//#region Obj Load and Textures

/**
 * Function used to load the meshes of a list of .obj files passed by json.
 * @param file is the json file containing the locations of the objects
 * @returns {Promise<*[]>} an array containing all the meshes of the loaded obj files
 */
async function loadObjects(file) {
    let text = await file.text();
    let objectsJ = JSON.parse(text);
    let objStr = [];
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
    for(let i = 0; i < settings.textureSrc.length; i++){
        texture[i] = gl.createTexture();
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture[0]);
        image[i] = new Image();
        image[i].src = settings.textureSrc[i];
        image[i].onload = function () {
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, texture[i]);
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image[i]);

            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

            gl.generateMipmap(gl.TEXTURE_2D);
        };
    }
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
    }
    utils.resizeCanvasToDisplaySize(gl.canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    // Clear the canvas
    gl.clearColor(1, 1, 1, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
}
//endregion

//#region Object creation functions
/**
 * This function is responsible of handling a user's request to add a certain block to the map and to the scene given
 * the parameters he entered in the creation container of the page.
 */
function addBlock(){
    let x = parseInt(document.getElementById("newX").value);
    let y = parseInt(document.getElementById("newY").value);
    let type = parseInt(document.getElementById("newType").value);
    let isHedgePresent = document.getElementById("checkboxH").checked;
    let isVictoryPresent = document.getElementById("checkboxV").checked;
    let decoration = parseInt(document.getElementById("newDecoration").value);

    if (decoration !== -1 && decoration !== null && !map.checkIfOtherBlockIsPresentBG(x)) {
        CreateDecorationNode(x, y, decoration);
    }

    if(isHedgePresent) {
        CreateHedgeNode(x, y);
    }

    if (isVictoryPresent)
        CreatePole(x, y);

    if(map.checkIfOtherBlockIsPresent(x, y)) return;

    let node = CreateNode(x, y, 0, type, 0);
    node.setParent(mapSpace);
    map.addPlayable(new Block(x, y, type));
    objects.push(node);

    document.getElementById("lastX").textContent = x.toString();
    document.getElementById("lastY").textContent = y.toString();
}

/**
 * This function creates the node that is requested to be added to the scene.
 * @param x: the x position of the new object.
 * @param y: the y position of the new object.
 * @param z: the z position of the new object.
 * @param type: the mesh type of the new object.
 * @param textureNo: the texture that must be applied to the new object, if any.
 * @returns {Node}: the node object created.
 */
function CreateNode(x, y, z, type, textureNo){
    let translateFactor = settings.translateFactor
    let translateOffset = settings.GetTranslateByType(type);
    let scaleFactor = settings.GetScaleByType(type);

    const node = new Node();
    node.localMatrix =
        utils.multiplyMatrices(
            utils.MakeTranslateMatrix(
                x * translateFactor + translateOffset[0],
                y * translateFactor + translateOffset[1],
                z + translateOffset[2]),
            utils.MakeScaleMatrixXYZ(
                scaleFactor[0],
                scaleFactor[1],
                scaleFactor[2]));
    node.drawInfo = {
        programInfo: program,
        bufferLength: meshes[type].mesh.indexBuffer.numItems,
        vertexArray: vao_arr[type],
        texture: texture[textureNo]
    }
    if(type === 0){
        node.drawInfo.color = settings.bricksColor;
        node.drawInfo.isColorPresent= true;
    }else{
        node.drawInfo.color = [0,0,0,1];
        node.drawInfo.isColorPresent = false;
    }

    return node;
}

/**
 * This method adds a decoration to the map.
 * @param x: the x position of the new backgroundObject.
 * @param y: the y position of the new backgroundObject.
 * @param type: the mesh type of the new backgroundObject.
 */
function CreateDecorationNode(x, y, type){
    // Set z level
    let z = -settings.translateFactor;
    // Instantiate SquareIsland under decoration
    let node = CreateNode(x, y, z, 6, 0);
    node.setParent(mapSpace);
    map.addBackgroundObject(new Block(x, y, 6));
    backgroundObjects.push(node);
    // Instantiate decoration
    node = CreateNode(x, y + 1, z, type, 0);
    node.setParent(mapSpace);
    map.addBackgroundObject(new Block(x, y + 1, type));
    backgroundObjects.push(node);
}

/**
 * This method adds a decoration to the map.
 * @param x: the x position of the new pole.
 * @param y: the y position of the new pole.
 */
function CreatePole(x, y){
    let node = CreateNode(x, y, 0, 9, 1);
    node.setParent(mapSpace);
    map.addPlayable(new Block(x, y, 9));
    objects.push(node);
}

/**
 * This method adds a hedge to the map.
 * @param x: the x position of the new hedge.
 * @param y: the y position of the new hedge.
 */
function CreateHedgeNode(x, y){
    let translateFactor = settings.translateFactor;
    let translateOffset = settings.GetTranslateByType(1);
    let scaleFactor = settings.GetScaleByType(1);

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
            vertexArray: vao_arr[1],
            texture: texture[0]
        }
        node.drawInfo.color = settings.hedgeColor;
        node.drawInfo.isColorPresent= true;
        node.setParent(mapSpace);
        objects.push(node);
    }
    map.addPlayable(new Block(x, y, 1));
}
//endregion

//#region Event Listeners
/**
 * This method sets the interaction with interface's components.
 */
function setGuiListeners(){
    document.getElementById("createButton").addEventListener("click", addBlock);
    document.getElementById("undoButton").addEventListener("click", undoBlock);
    document.getElementById("saveButton").addEventListener("click", saveMap);
    setSlidersListeners();
}

/**
 * This method saves the map in the local storage.
 */
function saveMap(){
    let mapName = document.getElementById("newName").value;
    if (mapName === null || mapName === undefined|| mapName === "")
        alert("You cannot create a map with no name");
    else{
        alert("You successfully stored your map");
        map.setMapName(mapName);
        mapHandler.storeMap(map);
    }
}

/**
 * This method undoes the last playable block added to the scene.
 */
function undoBlock(){
    if(map.playableObjects.length === 1) return;
    map.popPlayable();
    objects.pop();
    document.getElementById("lastX").textContent = map.playableObjects[map.playableObjects.length - 1].position[0].toString();
    document.getElementById("lastY").textContent = map.playableObjects[map.playableObjects.length - 1].position[1].toString();
}

/**
 * Keyboard event handling.
 * @param event
 */
function onKeyDown(event){
    switch (event.keyCode){
        case 87: //W
            break;
        case 65: //A
            break;
        case 83: //S
            break;
        case 68: //D
            break;
        case 32: //SPACEBAR
            break;
        case 37: //LEFT ARROW
            settings.createCameraPosition[0] -= settings.translateFactor;
            settings.createCameraTarget[0] -= settings.translateFactor;
            break;
        case 38: //UP ARROW
            settings.createCameraPosition[1] += settings.translateFactor;
            settings.createCameraTarget[1] += settings.translateFactor;
            break;
        case 39: //RIGHT ARROW
            settings.createCameraPosition[0] += settings.translateFactor;
            settings.createCameraTarget[0] += settings.translateFactor;
            break;
        case 40: //DOWN ARROW
            settings.createCameraPosition[1] -= settings.translateFactor;
            settings.createCameraTarget[1] -= settings.translateFactor;
            break;
        case 86: //V -> change view?
            break;
        case 70: //F -> full screen?
            break;
        case 27: //ESC
            break;
        case 71: //G
            break;
        case 82: //R
            break;
        case 73: //I
            break;
        case 66: //B
            break;
        case 85: //U
            break;
        case 79: //O
            break;
    }
}

/**
 * Keyboard event handling.
 * @param event
 */
function onKeyUp(event){
    switch (event.keyCode){
        case 87: //W
            break;
        case 65: //A
            break;
        case 83: //S
            break;
        case 68: //D
            break;
        case 32: //SPACEBAR
            break;
        case 37: //LEFT ARROW
            break;
        case 38: //UP ARROW
            break;
        case 39: //RIGHT ARROW
            break;
        case 40: //DOWN ARROW
            break;
        case 71: //G
            break;
        case 82: //R
            break;
        case 73: //I
            break;
        case 66: //B
            break;
        case 85: //U
            break;
        case 79: //O
            break;
    }
}

let settingObj = function (max, positiveOnly, value){
    this.id = null;
    this.max=max;
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

//TODO check for right values
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
        settings.createCameraPosition[0] = gui_settings['cameraX'].value;
        settings.createCameraPosition[1] = gui_settings['cameraY'].value;
        settings.createCameraPosition[2] = gui_settings['cameraZ'].value;
    }
    settings.fieldOfView = gui_settings['fieldOfView'].value;
    settings.pointLightPosition[0] = gui_settings['posX'].value;
    settings.pointLightPosition[1] = gui_settings['posY'].value;
    settings.pointLightPosition[2] = gui_settings['posZ'].value;
    settings.pointLightDecay = gui_settings['lightDecay'].value;
    settings.pointLightTarget = gui_settings['lightTarget'].value;
    settings.ambientLight[0] = gui_settings['ambientLight'].value;
    settings.ambientLight[1] = gui_settings['ambientLight'].value;
    settings.ambientLight[2] = gui_settings['ambientLight'].value;
    settings.shiness = gui_settings['shininess'].value;
    settings.directLightTheta = gui_settings['dirTheta'].value;
    settings.directLightPhi = gui_settings['dirPhi'].value;
}

function setSlidersListeners(){
    document.getElementById("cameraX_slider").addEventListener("input", function (){
        onSliderChange(this.value, 'cameraX');
    }, false);
    document.getElementById("cameraY_slider").addEventListener("input", function (){
        onSliderChange(this.value, 'cameraY');
    }, false);
    document.getElementById("cameraZ_slider").addEventListener("input", function (){
        onSliderChange(this.value, 'cameraZ');
    }, false);
    document.getElementById("ambientLight_slider").addEventListener("input", function (){
        onSliderChange(this.value, 'ambientLight');
    }, false);
    document.getElementById("dirPhi_slider").addEventListener("input", function (){
        onSliderChange(this.value, 'dirPhi');
    }, false);
    document.getElementById("dirTheta_slider").addEventListener("input", function (){
        onSliderChange(this.value, 'dirTheta');
    }, false);
    document.getElementById("fieldOfView_slider").addEventListener("input", function (){
        onSliderChange(this.value, 'fieldOfView');
    }, false);
}
//endregion

window.onload = init();