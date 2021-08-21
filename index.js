

var program;

//Parameters for Camera
var cx = 4.5;
var cy = 0.0;
var cz = 10.0;
var elevation = 0.0;
var angle = 0.0;
var lookRadius = 10.0;


//Node definition
function node(localWorldMatrix, children){
    this.localWorldMatrix = localWorldMatrix;
    this.children = children;
}

async function loadObjects(file) {
    var text = await file.text();
    var objects = JSON.parse(text);
    var objStr = [];
    var meshes = [];
    for (i = 0; i< objects.length; i++){
        objStr[i] = await utils.get_objstr(objects[i]);
        meshes[i] = new OBJ.Mesh(objStr[i]);
    }
    return meshes;
}

async function init(){
    var path = window.location.pathname;
    var page = path.split("/").pop();
    baseDir = window.location.href.replace(page, '');

    var canvas = document.getElementById("canvas");
    var gl = canvas.getContext("webgl2");

    gl.canvas.height = window.innerHeight;
    gl.canvas.width = window.innerWidth;
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    // Clear the canvas
    gl.clearColor(0, 0.3, 1, 0.6);
    gl.clear(gl.COLOR_BUFFER_BIT);


    //Compile and Link Shaders

    shaderDir = baseDir + "Graphics/Shaders/"; //Shader files will be put in the shaders folder
    //await makes the init function stop until the loadFiles function has completed
    await utils.loadFiles([shaderDir + 'vs.glsl', shaderDir + 'fs.glsl'], function (shaderText){
        var vertexShader = utils.createShader(gl, gl.VERTEX_SHADER, shaderText[0]);
        var fragmentShader = utils.createShader(gl, gl.FRAGMENT_SHADER, shaderText[1]);
        program = utils.createProgram(gl, vertexShader, fragmentShader);
    });
    gl.useProgram(program);


    //Load object
    var objectFile = await fetch("Engine/blocks.json");
    var objects = await loadObjects(objectFile);



    //link mesh attributes to shader attributes
    program.vertexPositionAttribute = gl.getAttribLocation(program, "in_pos");
    gl.enableVertexAttribArray(program.vertexPositionAttribute);

    program.vertexNormalAttribute = gl.getAttribLocation(program, "in_norm");
    gl.enableVertexAttribArray(program.vertexNormalAttribute);

    program.textureCoordAttribute = gl.getAttribLocation(program, "in_uv");
    gl.enableVertexAttribArray(program.textureCoordAttribute);

    program.WVPmatrixUniform = gl.getUniformLocation(program, "pMatrix");
    program.textureUniform = gl.getUniformLocation(program, "u_texture");

    OBJ.initMeshBuffers(gl, objects[0]);



    //prepare the world

    perspectiveMatrix = utils.MakePerspective(90, gl.canvas.clientWidth/gl.canvas.clientHeight, 0.1, 100.0);




    // selects the mesh
    gl.bindBuffer(gl.ARRAY_BUFFER, objects[0].vertexBuffer);
    gl.vertexAttribPointer(program.vertexPositionAttribute, objects[0].vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, objects[0].textureBuffer);
    gl.vertexAttribPointer(program.textureCoordAttribute, objects[0].textureBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, objects[0].normalBuffer);
    gl.vertexAttribPointer(program.vertexNormalAttribute, objects[0].normalBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, objects[0].indexBuffer);



    //turn on depth testing
    gl.enable(gl.DEPTH_TEST);
    gl.clear(gl.DEPTH_BUFFER_BIT);


    gl.drawElements(gl.TRIANGLES, objects[0].indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
    drawScene(gl, objects[0]);


}

window.onload = init;


function drawScene(gl, object) {

    // update WV matrix
    cz = lookRadius * Math.cos(utils.degToRad(-angle)) * Math.cos(utils.degToRad(-elevation));
    cx = lookRadius * Math.sin(utils.degToRad(-angle)) * Math.cos(utils.degToRad(-elevation));
    cy = lookRadius * Math.sin(utils.degToRad(-elevation));
    viewMatrix = utils.MakeView(cx, cy, cz, elevation, -angle);
    projectionMatrix = utils.multiplyMatrices(perspectiveMatrix, viewMatrix);

    // sets the uniforms
    gl.uniform1i(program.textureUniform, 0);



    // draws the answer
        WVPmatrix = utils.multiplyMatrices(projectionMatrix, utils.MakeScaleMatrix(1));
        gl.uniformMatrix4fv(program.WVPmatrixUniform, gl.FALSE, utils.transposeMatrix(WVPmatrix));
        gl.drawElements(gl.TRIANGLES, object.indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
}


//Before drawObjects is necessary to setup the uniforms, scene graph and world matrix
//the uniforms needs to be calculated for each object and are made by
//objectUniform.u_matrix = matrix made by -> viewProjection, transforms/world
//the function drawObjects sets the uniforms before draw
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
function computeWorld(currentNode, parentWorldMatrix){ //TODO integrare quando sarà definito il model
    var worldMatrix = m4.multiply(parentWorldMatrix, currentNode.localWorldMatrix);

    currentNode.children.forEach(function (child){
        computeWorld(child, worldMatrix);
    });

}

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



/*
Note
- dobbiamo fare lo shader in world space, questo significa che Light Direction, Light Position e Eye position possono essere usati in quanto sono
    già definiti in world space. Dobbiamo trasformare in world space le posizioni dei vertici e delle normali degli oggetti.
    nelle slides (esercitazione 05 - Normals and Shading Spaces) è spiegato bene.

-per la funzione del disegno bisogna stare attenti all'ordine. chiamare draw partendo dagli oggetti posteriori nella scena fino a quelli in primo
    piano. per fare questo basta ordinare per profondità.

 */