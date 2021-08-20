
var program;

//Parameters for Camera
var cx = 4.5;
var cy = 0.0;
var cz = 10.0;
var elevation = 0.0;
var angle = 0.0;
var lookRadius = 10.0;


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
        gl.uniformMatrix4fv(program.WVPmatrixUniform, false, utils.transposeMatrix(WVPmatrix));
        gl.drawElements(gl.TRIANGLES, object.indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
}


/*

 */