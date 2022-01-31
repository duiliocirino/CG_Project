import {Map} from "./Engine/Model/Map.js";
import {Block} from "./Engine/Model/Block.js";
import {MapHandler} from "./Engine/Model/MapHandler.js";
import {SkyBox} from "./Engine/Model/SkyBox.js";
import {Node} from "./Engine/Model/Node.js";

// MapHandler instance
var mapHandler = new MapHandler();

//
var baseDir;


var gl;

//Program used to render
var program;

//VAO
var vao_arr = []; //data structure containing all the VAO (one for each type of obj)

//MESHES
var meshes = [];

//OBJECTS
var objects = []; // list of objects to be rendered
var skyObjects = [];
var worldSpace;
var mapSpace;
var skySpace;


//Animation
var lastFrameTime;
var deltaTime;

//STAGE
var sceneRoot //the list of objects in which the player moves. all the objects are already initialized

//TEXTURES and BUFFERS
var texture = [];
var image = [];

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


//Parameters for Camera
var cx = 4.0;
var cy = 0.0;
var cz = 20.0;
var elevation = 50.0;
var angle = 0.0;
var lookRadius = 60.0;


//SKYBOX
var skyBox = new SkyBox();

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
        var map = new Map("First map");
        map.addPlayable(new Block(0,0, 6));
        map.addPlayable(new Block(1,0, 6));
        map.addPlayable(new Block(2,1, 0));
        map.addPlayable(new Block(3,1, 0));
        map.addPlayable(new Block(4,0, 6));
        map.addPlayable(new Block(5,0, 6));
        map.addPlayable(new Block(10,0, 6));
        map.addPlayable(new Block(10, 0, 9));

        worldSpace = new Node();
        worldSpace.localMatrix = utils.MakeWorld(-100, -60, 0, 0, 0, 0, 1.0);

        var playerNode = new Node();
        playerNode.localMatrix = utils.multiplyMatrices(utils.MakeTranslateMatrix(0, 20, 0), utils.MakeScaleMatrix(4))
        playerNode.drawInfo = {
            programInfo: program,
            bufferLength: meshes[8].mesh.indexBuffer.numItems,
            vertexArray: vao_arr[8],
            color: settings.playerColor,
            isColorPresent: true,
            texture: texture[0]
        };
        playerNode.setParent(worldSpace);
        objects.push(playerNode);

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

    }

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
    }
    if(type === 0){
        node.drawInfo.color = settings.bricksColor;
        node.drawInfo.isColorPresent= true;
    }else{
        node.drawInfo.color = [0,0,0,1];
        node.drawInfo.isColorPresent = false;
    }
    if(type === 9){
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

//endregion

//# region Clouds

/** creates the clouds and inserts them in the sky space */
function setClouds(){

    var translateFactor = settings.translateFactor
    var translateOffset = settings.GetTranslateByType(2);

    let cloudNumber = settings.cloudBaseNumber + Math.ceil(Math.random()*8);

    for(let i=1; i<=cloudNumber; i++){
        let z = -30 - Math.ceil(Math.random()*5)*10;
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

        // START SCREEN
        var blocks = [];
        {
            blocks.push(new Block(15, 0, 0));
            blocks.push(new Block(15, 10, 0));
            blocks.push(new Block(15, 20, 0));
            blocks.push(new Block(15, 30, 0));
            blocks.push(new Block(15, 40, 0));
            blocks.push(new Block(15, 50, 0));
            blocks.push(new Block(15, 60, 0));
            blocks.push(new Block(15, 70, 0));
            blocks.push(new Block(15, 80, 0));
            blocks.push(new Block(15, 90, 0));
            blocks.push(new Block(15, 100, 0));
            blocks.push(new Block(25, 100, 0));
            blocks.push(new Block(35, 100, 0));
            blocks.push(new Block(45, 100, 0));
            blocks.push(new Block(55, 100, 0));
            blocks.push(new Block(65, 100, 0));
            blocks.push(new Block(75, 100, 0));
            blocks.push(new Block(85, 100, 0));
            blocks.push(new Block(95, 100, 0));
            blocks.push(new Block(105, 100, 0));
            blocks.push(new Block(115, 100, 0));
            blocks.push(new Block(125, 100, 0));
            blocks.push(new Block(135, 100, 0));
            blocks.push(new Block(145, 100, 0));
            blocks.push(new Block(155, 100, 0));
            blocks.push(new Block(165, 100, 0));
            blocks.push(new Block(175, 100, 0));
            blocks.push(new Block(185, 100, 0));
            blocks.push(new Block(185, 90, 0));
            blocks.push(new Block(185, 80, 0));
            blocks.push(new Block(185, 70, 0));
            blocks.push(new Block(185, 60, 0));
            blocks.push(new Block(185, 50, 0));
            blocks.push(new Block(185, 40, 0));
            blocks.push(new Block(185, 30, 0));
            blocks.push(new Block(185, 20, 0));
            blocks.push(new Block(185, 10, 0));
            blocks.push(new Block(185, 0, 0));
            blocks.push(new Block(175, 0, 0));
            blocks.push(new Block(165, 0, 0));
            blocks.push(new Block(155, 0, 0));
            blocks.push(new Block(145, 0, 0));
            blocks.push(new Block(135, 0, 0));
            blocks.push(new Block(125, 0, 0));
            blocks.push(new Block(115, 0, 0));
            blocks.push(new Block(105, 0, 0));
            blocks.push(new Block(95, 0, 0));
            blocks.push(new Block(85, 0, 0));
            blocks.push(new Block(75, 0, 0));
            blocks.push(new Block(65, 0, 0));
            blocks.push(new Block(55, 0, 0));
            blocks.push(new Block(45, 0, 0));
            blocks.push(new Block(35, 0, 0));
            blocks.push(new Block(25, 0, 0));
        }

        blocks.forEach(function(element){
            const xPos = element.position[0];
            const yPos = element.position[1];
            const node = new Node();
            node.localMatrix = utils.multiplyMatrices(
                utils.MakeRotateXMatrix(5),
                utils.multiplyMatrices(
                    utils.MakeTranslateMatrix(xPos,yPos,115),
                    utils.MakeScaleMatrix(0.5))
            );
            node.drawInfo = {
                programInfo: program,
                bufferLength: meshes[element.type].mesh.indexBuffer.numItems,
                vertexArray: vao_arr[element.type],
                color: settings.bricksColor,
                isColorPresentBooleanLocation: true,
                texture: texture[0]
            };
            node.setParent(mapSpace);
            objects.push(node);
        });
    }

}

//endregion


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
    var cameraPosition = settings.cameraPosition;
    var target = settings.target;
    var up = settings.up;
    var cameraMatrix = utils.LookAt(cameraPosition, target, up);
    var viewMatrix = utils.invertMatrix(cameraMatrix);

    var viewProjectionMatrix = utils.multiplyMatrices(projectionMatrix, viewMatrix);

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
        gl.bindTexture(gl.TEXTURE_2D, object.drawInfo.texture);
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
        gl.bindTexture(gl.TEXTURE_2D, object.drawInfo.texture);
        gl.uniform1i(textureUniformLocation, 0);

        gl.bindVertexArray(object.drawInfo.vertexArray);
        gl.drawElements(gl.TRIANGLES, object.drawInfo.bufferLength, gl.UNSIGNED_SHORT, 0 );
    });

    requestAnimationFrame(drawScene);
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

function setGuiListeners(){
    // UI
    document.getElementById("select_menu_button").addEventListener("click", goToSelectMenu);

    document.getElementById("maps_menu_button").addEventListener("click", goToMapsMenu);

    document.getElementById("reset_maps_button").addEventListener("click", resetMaps);

}

//# region UI events

function deleteAllRows(tableId){
    var table = document.getElementById(tableId);
    let i;
    for(i = table.rows.length - 1; i > 0; i--)
    {
        table.deleteRow(i);
    }
}

function resetMaps() {
    mapHandler.resetMaps();
    deleteAllRows("maps_reset_table");
    addRowsDelete();
}

function goToMapsMenu() {
    let modeMenu = document.getElementById("mode");
    let mapsMenu = document.getElementById("maps");
    let backButton = document.getElementById("backContainer");

    addRowsDelete();

    modeMenu.hidden = true;
    mapsMenu.hidden = false;
    backButton.hidden = false;
}

function addRowsDelete(){
    let maps = mapHandler.getMaps();
    let i = 1;
    maps.forEach(function (map){
        var table = document.getElementById("maps_reset_table");

        var rowCount = table.rows.length;
        var row = table.insertRow(rowCount);

        row.insertCell(0).innerHTML= map.id;
        row.insertCell(1).innerHTML= map.name;
        let playCell = row.insertCell(2);
        playCell.innerHTML= '<input type="button" value="Delete">'
        playCell.addEventListener("click", function (e){
            mapHandler.removeMap(map.id);
            deleteAllRows("maps_reset_table");
            addRowsDelete();
        });

        i++;
    })
}

function playSelected(mapId){
    let cameraPreset = 0;
    let cameraPreset0 = document.getElementById("preset0");
    let cameraPreset1 = document.getElementById("preset1");
    let cameraPreset2 = document.getElementById("preset2");

    if (cameraPreset0.checked) cameraPreset = 0;
    if (cameraPreset1.checked) cameraPreset = 1;
    if (cameraPreset2.checked) cameraPreset = 2;

    window.localStorage.setItem("cameraPreset", cameraPreset.toString());
    window.localStorage.setItem("playMap", mapId);
    window.location.href = "play.html";
}

function goToSelectMenu(){
    let modeMenu = document.getElementById("mode");
    let selectMenu = document.getElementById("select");
    let backButton = document.getElementById("backContainer");

    addRowsPlay();

    modeMenu.hidden = true;
    selectMenu.hidden = false;
    backButton.hidden = false;
}

function addRowsPlay(){
    let maps = mapHandler.getMaps();
    let i = 1;
    maps.forEach(function (map){
        var table = document.getElementById("maps_table");

        var rowCount = table.rows.length;
        var row = table.insertRow(rowCount);

        row.insertCell(0).innerHTML= map.id;
        row.insertCell(1).innerHTML= map.name;
        let playCell = row.insertCell(2);
        playCell.innerHTML= '<input type="button" value="Play">'
        playCell.addEventListener("click", function (e){
            playSelected(map.id);
        });

        i++;
    })
}

//endregion

window.onload = init();