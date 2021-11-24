import {Map} from "./Engine/Model/Map.js";
import {Block} from "./Engine/Model/Block.js";
import {MapHandler} from "./Engine/Model/MapHandler.js";
import {SkyBox} from "./Engine/SkyBox.js";

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

var textureUniformLocation;
var directLightColorHandle;
var directLightDirectionHandle;
var ambientLightHandle;


//Parameters for Camera
var cx = 4.0;
var cy = 0.0;
var cz = 10.0;
var elevation = 50.0;
var angle = 0.0;
var lookRadius = 60.0;


//SKYBOX
var skyBox = new SkyBox();


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
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
}

function setViewportAndCanvas() {
    utils.resizeCanvasToDisplaySize(gl.canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
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


function getAttributesAndUniformLocations() { //TODO serve altro
    positionAttributeLocation = gl.getAttribLocation(program, "in_pos");
    gl.enableVertexAttribArray(positionAttributeLocation);
    normalAttributeLocation = gl.getAttribLocation(program, "in_norm");
    gl.enableVertexAttribArray(normalAttributeLocation);
    uvAttributeLocation = gl.getAttribLocation(program, "in_uv");
    gl.enableVertexAttribArray(uvAttributeLocation);

    wvpMatrixLocation = gl.getUniformLocation(program, "matrix");
    positionMatrixLocation = gl.getUniformLocation(program, "pMatrix");
    normalMatrixLocation = gl.getUniformLocation(program, "nMatrix");

    textureUniformLocation = gl.getUniformLocation(program, "u_texture");

    directLightColorHandle = gl.getUniformLocation(program, "u_directLightColor");
    directLightDirectionHandle = gl.getUniformLocation(program, "u_directLightDirection");
    ambientLightHandle = gl.getUniformLocation(program, 'u_ambientLight');

}

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


function createVaos() {
    meshes.forEach(mesh => {
        var vao = gl.createVertexArray();

        gl.bindVertexArray(vao);
        gl.bindBuffer(gl.ARRAY_BUFFER, mesh.mesh.vertexBuffer);

        gl.vertexAttribPointer(positionAttributeLocation, mesh.mesh.vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, mesh.mesh.normalBuffer);
        gl.vertexAttribPointer(normalAttributeLocation, mesh.mesh.normalBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, mesh.mesh.textureBuffer);
        gl.vertexAttribPointer(uvAttributeLocation, mesh.mesh.textureBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.mesh.indexBuffer);

        vao_arr.push(vao);
    });
}

function main(){
    //link mesh attributes to shader attributes
    getAttributesAndUniformLocations();

    createVaos();

    setGuiListeners();

    skyBox.loadEnvironment(gl);

    //prepare the world
    sceneRoot = prepareWorld(); //funziona?

    window.requestAnimationFrame(render);
}

/**
 * Get the parameter of the lights from the UI and used to define the light parameters before the rendering
 */
function lightDefinition() {
    var dirLightTheta = -utils.degToRad(settings.directLightTheta);
    var dirLightPhi = -utils.degToRad(settings.directLightPhi);
    settings.directLightDir[0] = Math.cos(dirLightTheta) * Math.cos(dirLightPhi);
    settings.directLightDir[1] = Math.sin(dirLightTheta);
    settings.directLightDir[2] = Math.cos(dirLightTheta) * Math.sin(dirLightPhi);
}

function setMatrices() { // TODO: fare look-at matrix?
    viewMatrix = utils.MakeView(cx, cy, cz, elevation, -angle);
    perspectiveMatrix = utils.MakePerspective(90, gl.canvas.clientWidth/gl.canvas.clientHeight, 0.1, 100.0);
    projectionMatrix = utils.multiplyMatrices(perspectiveMatrix, viewMatrix); // usare bene nella drawScene
}



function render(){
    lightDefinition();

    //animate()

    //turn on depth testing
    gl.enable(gl.DEPTH_TEST);
    gl.clear(gl.DEPTH_BUFFER_BIT);

    setMatrices();

    sceneRoot.updateWorldMatrix();

    setViewportAndCanvas();

    skyBox.InitializeAndDraw();

    //drawScene
    drawScene();

    requestAnimationFrame(render);
}

//Da sostituire con drawObjects
function drawScene() {
    objects.forEach(function (object){
        gl.useProgram(program);

        var viewProjectionMatrix = utils.multiplyMatrices(projectionMatrix, object.worldMatrix);
        var normalMatrix = utils.invertMatrix(utils.transposeMatrix(object.worldMatrix));

        gl.uniformMatrix4fv(wvpMatrixLocation, false, utils.transposeMatrix(viewProjectionMatrix));
        gl.uniformMatrix4fv(positionMatrixLocation, false, utils.transposeMatrix(object.worldMatrix));
        gl.uniformMatrix4fv(normalMatrixLocation, false, utils.transposeMatrix(normalMatrix));

        gl.uniform3fv(ambientLightHandle, settings.ambientLight);
        gl.uniform3fv(directLightColorHandle, settings.directLightColor);
        gl.uniform3fv(directLightDirectionHandle, settings.directLightDir);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.uniform1i(textureUniformLocation, 0);

        gl.bindVertexArray(object.drawInfo.vertexArray);
        gl.drawArrays(gl.TRIANGLES, 0, object.drawInfo.bufferLength);
    });
    // draws the answer
    /*WVPmatrix = utils.multiplyMatrices(projectionMatrix, utils.MakeScaleMatrix(1));
    gl.uniformMatrix4fv(program.WVPmatrixUniform, gl.FALSE, utils.transposeMatrix(WVPmatrix));
    gl.drawElements(gl.TRIANGLES, object.mesh.indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);*/
}


//Before drawObjects is necessary to setup the uniforms, scene graph and world matrix
//the uniforms needs to be calculated for each object and are made by
//objectUniform.u_matrix = matrix made by -> viewProjection, transforms/world
//the function drawObjects sets the uniforms before draw
/**
 * The function sets the buffers and the uniforms for each object, then draws the scene.
 * @param gl is the context
 * @param objects an array with all the objects to draw. For each object is needed the world matrix and program and buffer info.
 */
/*function drawObjects(gl, objects){ //TODO integrare nel codice
    objects.forEach(function (element){
      var programInfo = element.programInfo;
      var bufferInfo = element.bufferInfo;

      gl.useProgram(program);

      //setup attributes
        webglUtils.setBuffersAndAttributes(gl, programInfo, bufferInfo);

        //set uniforms
        webglUtils.setUniforms(programInfo, element.uniforms);

        gl.drawArrays(gl.TRIANGLES, 0, bufferInfo.numElements);
    })
}*/

//recursive function to compute world matrix for each object
/**
 * The function calculates the world matrix for each object of the scene graph. For the graph root use null at parentWorldMatrix.
 * @param currentNode The node for which the matrix is being calculated
 * @param parentWorldMatrix the world matrix of the parent node
 */
/*function computeWorld(currentNode, parentWorldMatrix){ //TODO integrare quando sarà definito il model
    if(parentWorldMatrix == null){
        parentWorldMatrix = utils.identityMatrix();
    }
    var worldMatrix = m4.multiply(parentWorldMatrix, currentNode.localWorldMatrix);
    currentNode.localWorldMatrix=worldMatrix;

    if(currentNode.children != null){
        var ramifications = currentNode.children;

        ramifications.forEach(function (child){
            computeWorld(child, worldMatrix);
        });
    }
}*/

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

//Mesh codes
/*
0- brick
1- hedge
2- cloud
3- cylinderIsland
4- mountain
5- rock
6- squareIsland
7- tree
8- ghost
9- Mario Pipe //attenzione il modello non è dritto -> rotazione 90 asse z
10- Mario Pipe Base //attenzione il modello non è dritto -> rotazione 90  asse z
 */

//TODO funzione per portare da mappa a albero con le matrici, iniziare fisica personaggio
/**
 * creates an array with all the objects to draw and the relative world matrices.
 * @param map is the map created by the user and contains all the placement and types of blocks.
 */
function sceneGraphDefinition(map){
    var worldSpace = new Node(utils.MakeWorld(0, 0, 0, 0, 0, 0, 1.0));

    var playerNode = new Node(utils.MakeTranslateMatrix(0.5, 0, 0));
    playerNode.drawInfo = {
        programInfo: program,
        bufferLength: meshes[8].mesh.indexBuffer.numItems,
        vertexArray: vao_arr[8]
    };
    playerNode.setParent(worldSpace);
    objects.push(playerNode);

    var mapSpace = new Node(utils.MakeTranslateMatrix(0,0,0));
    mapSpace.setParent(worldSpace);

    const pipe = new Node(utils.identityMatrix());
    pipe.drawInfo = {
        programInfo: program,
        bufferLength: meshes[9].mesh.indexBuffer.numItems,
        vertexArray: vao_arr[9]
    };
    pipe.setParent(mapSpace);
    objects.push(pipe);

    const pipeBase = new Node(utils.identityMatrix());
    pipeBase.drawInfo = {
        programInfo: program,
        bufferLength: meshes[10].mesh.indexBuffer.numItems,
        vertexArray: vao_arr[10]
    };
    pipeBase.setParent(mapSpace);
    objects.push(pipeBase);

    map.playableObjects.forEach(function(element){
        const xPos = element.position[0];
        const yPos = element.position[1];
        const node = new Node(utils.MakeTranslateMatrix(xPos,yPos,0));
        node.drawInfo = {
            programInfo: program,
            bufferLength: meshes[element.type].mesh.indexBuffer.numItems,
            vertexArray: vao_arr[element.type]
        };
        node.setParent(mapSpace);
        objects.push(node);
    });

    return worldSpace;
}

function prepareWorld() {
    var map = new Map("First map");
    map.addPlayable(new Block(0,0, 0));
    map.addPlayable(new Block(1,0, 0));
    map.addPlayable(new Block(2,1, 1));
    map.addPlayable(new Block(3,1, 1));
    map.addPlayable(new Block(4,0, 0));
    map.addPlayable(new Block(5,0, 0));
    map.addPlayable(new Block(6,1, 1));
    map.addPlayable(new Block(7,1, 1));
    map.addPlayable(new Block(8,0, 0));
    //map.popBlock();
    //mapHandler.storeMap(map);
    //console.log(mapHandler.getMaps())
    return sceneGraphDefinition(map);
}

// ------------------------------------------------------------------------------------------------------------------------------
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

window.onload = init;

/*
Note
- dobbiamo fare lo shader in world space, questo significa che Light Direction, Light Position e Eye position possono essere usati in quanto sono
    già definiti in world space. Dobbiamo trasformare in world space le posizioni dei vertici e delle normali degli oggetti.
    nelle slides (esercitazione 05 - Normals and Shading Spaces) è spiegato bene.

-per la funzione del disegno bisogna stare attenti all'ordine. chiamare draw partendo dagli oggetti posteriori nella scena fino a quelli in primo
    piano. per fare questo basta ordinare per profondità.

 */