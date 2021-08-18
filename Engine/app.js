var program;

async function init(){
    var path = window.location.pathname;
    var page = path.split("/").pop();
    baseDir = window.location.href.replace(page, '');
    shaderDir = baseDir + "Graphics/Shaders/"; //Shader files will be put in the shaders folder

    // getCanvas()

    var canvas = document.getElementById("canvas");
    var gl = canvas.getContext("webgl2")

    // compileAndLinkShaders()

    //await makes the init function stop until the loadFiles function has completed
    await utils.loadFiles([shaderDir + 'vs.glsl', shaderDir + 'fs.glsl'], function (shaderText){
        var vertexShader = utils.createShader(gl, gl.VERTEX_SHADER, shaderText[0]);
        var fragmentShader = utils.createShader(gl, gl.FRAGMENT_SHADER, shaderText[1]);
        program = utils.createProgram(gl, vertexShader, fragmentShader);
    });
    gl.useProgram(program);


}

async function init2(){
    var path = window.location.pathname;
    var page = path.split("/").pop();
    baseDir = window.location.href.replace(page, '');
    shaderDir = baseDir + "Graphics/Shaders/"; //Shader files will be put in the shaders folder

    // getCanvas()

    var canvas = document.getElementById("canvas");
    var gl = canvas.getContext("webgl2")
    gl.canvas.height = window.innerHeight;
    gl.canvas.width = window.innerWidth;

    // compileAndLinkShaders()

    //await makes the init function stop until the loadFiles function has completed
    await utils.loadFiles([shaderDir + 'vs.glsl', shaderDir + 'fs.glsl'], function (shaderText){
        var vertexShader = utils.createShader(gl, gl.VERTEX_SHADER, shaderText[0]);
        var fragmentShader = utils.createShader(gl, gl.FRAGMENT_SHADER, shaderText[1]);
        program = utils.createProgram(gl, vertexShader, fragmentShader);
    });
    gl.useProgram(program);

    var objStr = await utils.get_objstr("Graphics/Models/10-Platformer Maker/ghost.obj")
    mesh = new OBJ.Mesh(objStr)
    OBJ.initMeshBuffers(gl, mesh);


    program.vertexPositionAttribute = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(program.vertexPositionAttribute);
    gl.vertexAttribPointer(program.vertexPositionAttribute, mesh.vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);

    var w = gl.canvas.width;
    var h = gl.canvas.height;
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.viewport(0.0, 0.0, w, h);

    perspectiveMatrix = utils.MakePerspective(90, w/h, 0.1, 100.0);
    // selects the mesh
    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, mesh.vertices, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, mesh.indices, gl.STATIC_DRAW)

    // turn on depth testing
    gl.enable(gl.DEPTH_TEST);

    gl.drawElements(gl.TRIANGLES, mesh.indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
    main(); //Call the main function from here so it doesn’t have to be async too

}

function main(){
    // Here we create the main menu
    var hudCanvas = document.getElementById("hudCanvas");
    hudCanvas.style.width = "100%";
    hudCanvas.style.height = "100%";
    var hudBitmap = hudCanvas.getContext('2d');
    hudBitmap.font = "Normal 40px Arial";
    hudBitmap.textAlign = 'center';
    hudBitmap.fillStyle = "rgba(45,45,45,0.75)";
    hudBitmap.fillText('Initializing...', 50, 50);
}

window.onload = init;