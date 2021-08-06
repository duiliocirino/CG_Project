async function init(){
    var path = window.location.pathname;
    var page = path.split("/").pop();
    baseDir = window.location.href.replace(page, '');
    shaderDir = baseDir + "graphics/shaders/"; //Shader files will be put in the shaders folder
    //[..Retrieve canvas and webgl context here..]
    var canvas = document.getElementById("canvas");
    var context = canvas.getContext("webgl2")
    //await makes the init function stop until the loadFiles function has completed
    await utils.loadFiles([shaderDir + 'vs.glsl', shaderDir + 'fs.glsl'], function (shaderText){
        var vertexShader = utils.createShader(gl, gl.VERTEX_SHADER, shaderText[0]);
        var fragmentShader = utils.createShader(gl, gl.FRAGMENT_SHADER, shaderText[1]);
        program = utils.createProgram(gl, vertexShader, fragmentShader);
    });
    gl.useProgram(program);
    main(); //Call the main function from here so it doesn’t have to be async too

}

function main(){

}

window.onload = init;