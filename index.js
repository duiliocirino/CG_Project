import {Map} from "./Engine/Model/Map.js";
import {Block} from "./Engine/Model/Block.js";
import {MapHandler} from "./Engine/Model/MapHandler.js";

// Global variable to save the last id value of a Map
let lastMapId = 0;
// Global variable to save the last id value of a Block
let lastBlockId = 0;
// MapHandler instance
var mapHandler = new MapHandler();
//
var baseDir;
var shaderDir;
//
var perspectiveMatrix;
var projectionMatrix;
var viewMatrix;
var WVPmatrix;

var gl;

//Program used to render
var program;

//VAO
var vao_arr; //data structure containing all the VAO (one for each type of obj)

//OBJECTS
var objects; // list of objects to be rendered

//TEXTURES and BUFFERS
var texture;

//LIGHTS
var directLightColorHandle;
var directLightDirectionHandle;
var ambientLightHandle;

var settings = {
    //direct
    directLightTheta: 30,
    directLightPhi: 40,
    directLightColor: [0.8, 0.8, 0.6],
    directLightDir: [null, null, null],
    //ambient
    ambientLight: [0.2, 0.2, 0.2]
}

//Parameters for Camera
var cx = 4.5;
var cy = 0.0;
var cz = 10.0;
var elevation = 50.0;
var angle = 0.0;
var lookRadius = 50.0;

//Node definition
/**
 * Class used to define a node of the scene graph
 * @param localWorldMatrix is the world matrix of the node
 * @param children is an array of children nodes
 */
function node(localWorldMatrix, children){
    this.localWorldMatrix = localWorldMatrix;
    this.children = children;
}

/**
 * Function used to load the meshes of a list of .obj files passed by json.
 * @param file is the json file containing the locations of the objects
 * @returns {Promise<*[]>} an array containing all the meshes of the loaded obj files
 */
async function loadObjects(file) {
    var text = await file.text();
    var objectsJ = JSON.parse(text);
    var objStr = [];
    var meshes = [];
    for (let i = 0; i< objectsJ.length; i++){
        objStr[i] = await utils.get_objstr(objectsJ[i]);
        meshes[i] = new OBJ.Mesh(objStr[i]);
    }
    return meshes;
}

/**
 * Entry point of the WebGL program
 */
async function init() {
    var path = window.location.pathname;
    var page = path.split("/").pop();
    baseDir = window.location.href.replace(page, '');
    shaderDir = baseDir + "Graphics/Shaders/"; //Shader files will be put in the shaders folder

    // getCanvas()

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
    gl.clearColor(0, 0.3, 1, 0.6);
    gl.clear(gl.COLOR_BUFFER_BIT);

    //Compile and Link Shaders
    //load shaders from file
    await utils.loadFiles([shaderDir + 'vs.glsl', shaderDir + 'fs.glsl'], function (shaderText) {
        var vertexShader = utils.createShader(gl, gl.VERTEX_SHADER, shaderText[0]);
        var fragmentShader = utils.createShader(gl, gl.FRAGMENT_SHADER, shaderText[1]);
        program = utils.createProgram(gl, vertexShader, fragmentShader);
    });
    gl.useProgram(program);


    //Load object
    var objectFile = await fetch("Engine/blocks.json");
    objects = await loadObjects(objectFile);

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

    //link mesh attributes to shader attributes
    program.vertexPositionAttribute = gl.getAttribLocation(program, "in_pos");
    gl.enableVertexAttribArray(program.vertexPositionAttribute);

    program.vertexNormalAttribute = gl.getAttribLocation(program, "in_norm");
    gl.enableVertexAttribArray(program.vertexNormalAttribute);

    program.textureCoordAttribute = gl.getAttribLocation(program, "in_uv");
    gl.enableVertexAttribArray(program.textureCoordAttribute);

    program.WVPmatrixUniform = gl.getUniformLocation(program, "pMatrix");
    program.textureUniform = gl.getUniformLocation(program, "u_texture");

    OBJ.initMeshBuffers(gl, objects[5]);


    //prepare the world

    perspectiveMatrix = utils.MakePerspective(90, gl.canvas.clientWidth/gl.canvas.clientHeight, 0.1, 100.0);


    directLightColorHandle = gl.getUniformLocation(program, "u_directLightColor");
    directLightDirectionHandle = gl.getUniformLocation(program, "u_directLightDirection");
    ambientLightHandle = gl.getUniformLocation(program, 'u_ambientLight');


    // selects the mesh
    gl.bindBuffer(gl.ARRAY_BUFFER, objects[5].vertexBuffer);
    gl.vertexAttribPointer(program.vertexPositionAttribute, objects[5].vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, objects[5].textureBuffer);
    gl.vertexAttribPointer(program.textureCoordAttribute, objects[5].textureBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, objects[5].normalBuffer);
    gl.vertexAttribPointer(program.vertexNormalAttribute, objects[5].normalBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, objects[5].indexBuffer);

    //turn on depth testing
    gl.enable(gl.DEPTH_TEST);
    gl.clear(gl.DEPTH_BUFFER_BIT);


    gl.drawElements(gl.TRIANGLES, objects[5].indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
    drawScene(gl, objects[5]);

    main();
}

window.onload = init;

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

function main(){
    var map = new Map("First map");
    map.addBlock(new Block(0,0, "ciao"));
    map.addBlock(new Block(1,0, "ciao"));
    map.addBlock(new Block(0,1, "ciao"));
    map.addBlock(new Block(1,1, "ciao"));
    map.popBlock();
    mapHandler.storeMap(map);
    console.log(mapHandler.getMaps())
}

//Da sostituire con drawObjects
function drawScene(gl, object) {
    lightDefinition();

    // update WV matrix
    cz = lookRadius * Math.cos(utils.degToRad(-angle)) * Math.cos(utils.degToRad(-elevation));
    cx = lookRadius * Math.sin(utils.degToRad(-angle)) * Math.cos(utils.degToRad(-elevation));
    cy = lookRadius * Math.sin(utils.degToRad(-elevation));
    viewMatrix = utils.MakeView(cx, cy, cz, elevation, -angle);
    projectionMatrix = utils.multiplyMatrices(perspectiveMatrix, viewMatrix);

    // sets the uniforms
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(program.textureUniform, 0);

    gl.uniform3fv(ambientLightHandle, settings.ambientLight);
    gl.uniform3fv(directLightColorHandle, settings.directLightColor);
    gl.uniform3fv(directLightDirectionHandle, settings.directLightDir);


    // draws the answer
    WVPmatrix = utils.multiplyMatrices(projectionMatrix, utils.MakeScaleMatrix(1));
    gl.uniformMatrix4fv(program.WVPmatrixUniform, gl.FALSE, utils.transposeMatrix(WVPmatrix));
    gl.drawElements(gl.TRIANGLES, object.indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
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
function drawObjects(gl, objects){ //TODO integrare nel codice
    objects.forEach(function (element){
      var programInfo = element.programInfo;
      var bufferInfo = element.bufferInfo;

      gl.useProgram(programInfo.program);

      //setup attributes
        webglUtils.setBuffersAndAttributes(gl, programInfo, bufferInfo);

        //set uniforms
        webglUtils.setUniforms(programInfo, element.uniforms);

        gl.drawArrays(gl.TRIANGLES, 0, bufferInfo.numElements);
    })
}

//recursive function to compute world matrix for each object
/**
 * The function calculates the world matrix for each object of the scene graph. For the graph root use null at parentWorldMatrix.
 * @param currentNode The node for which the matrix is being calculated
 * @param parentWorldMatrix the world matrix of the parent node
 */
function computeWorld(currentNode, parentWorldMatrix){ //TODO integrare quando sarà definito il model
    if(parentWorldMatrix == null){
        parentWorldMatrix = utils.identityMatrix();
    }
    var worldMatrix = m4.multiply(parentWorldMatrix, currentNode.localWorldMatrix);

    currentNode.children.forEach(function (child){
        computeWorld(child, worldMatrix);
    });

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

//TODO funzione per portare da mappa a albero con le matrici, iniziare fisica personaggio



/*
Note
- dobbiamo fare lo shader in world space, questo significa che Light Direction, Light Position e Eye position possono essere usati in quanto sono
    già definiti in world space. Dobbiamo trasformare in world space le posizioni dei vertici e delle normali degli oggetti.
    nelle slides (esercitazione 05 - Normals and Shading Spaces) è spiegato bene.

-per la funzione del disegno bisogna stare attenti all'ordine. chiamare draw partendo dagli oggetti posteriori nella scena fino a quelli in primo
    piano. per fare questo basta ordinare per profondità.

 */