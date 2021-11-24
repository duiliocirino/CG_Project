
export class SkyBox{

    constructor(){}

    async loadEnvironment(context){
        gl = context;
        await loadSkyBoxEnvironment();
        getSkyBoxAttributesAndUniforms();

    }

    InitializeAndDraw(){
        SkyBoxlightDefinition();
        setSkyBoxMatrices();
        setSkyBoxViewportAndCanvas();
        drawSkyBox();
    }

}

//context
var gl;


//program to render the scene
var skyBox_program;

//VAO
var skyBox_vao;

//skybox texture and buffers
var skyboxTexture;

//Attributes and uniforms for the skybox
var skyboxTexLocation;
var inverseViewProjMatrixLocation;
var skyboxVertPosAttr;

//matrices
var projectionMatrix;
var cameraMatrix;
var viewMatrix;


//Skybox settings


//Functions
/**
 * Set the global states of the program
 */
function setSkyBoxViewportAndCanvas(){
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(settings.backgroundColor[0], settings.backgroundColor[1], settings.backgroundColor[2], settings.backgroundColor[3]);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}

/**
 * setup attributes and uniforms
 */
    function getSkyBoxAttributesAndUniforms(){


    if(!skyBox_program){
        setTimeout(getSkyBoxAttributesAndUniforms, 500)
    }
    else{
        skyboxTexLocation = gl.getUniformLocation(skyBox_program, "u_texture");
        inverseViewProjMatrixLocation = gl.getUniformLocation(skyBox_program, "inverseViewProjMatrix");
        skyboxVertPosAttr = gl.getAttribLocation(skyBox_program, "in_position");
    }
}

/**
 * load the skybox environment and setup vao
 */
async function loadSkyBoxEnvironment(){
    //skybox
    await utils.loadFiles([settings.shaderDir + 'skybox_vs.glsl', settings.shaderDir + 'skybox_fs.glsl'], function (shaderText){
        var vertexShader = utils.createShader(gl, gl.VERTEX_SHADER, shaderText[0]);
        var fragmentShader = utils.createShader(gl, gl.FRAGMENT_SHADER, shaderText[1]);

        skyBox_program = utils.createProgram(gl, vertexShader, fragmentShader);
    });


    var skyBox_vertPos = new Float32Array(
        [
            -10, -10, 1.0,
            10, -10, 1.0,
            -10, 10, 1.0,
            -10, 10, 1.0,
            10, -10, 1.0,
            10, 10, 1.0,
        ]);
    skyBox_vao = gl.createVertexArray();
    gl.bindVertexArray(skyBox_vao);

    var positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, skyBox_vertPos, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(skyboxVertPosAttr);
    gl.vertexAttribPointer(skyboxVertPosAttr, 3, gl.FLOAT, false, 0, 0);

    skyboxTexture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0 + 3);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, skyboxTexture);

    var envTexDir = settings.skyboxDir; //TODO inserire nella directory la texture della skybox
    const faceInfos = [
        {
            target: gl.TEXTURE_CUBE_MAP_POSITIVE_X,
            url: envTexDir + 'posx.png',
        },
        {
            target: gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
            url: envTexDir + 'negx.png',
        },
        {
            target: gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
            url: envTexDir + 'posy.png',
        },
        {
            target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
            url: envTexDir + 'negy.png',
        },
        {
            target: gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
            url: envTexDir + 'posz.png',
        },
        {
            target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Z,
            url: envTexDir + 'negz.png',
        },
    ];
    faceInfos.forEach((faceInfo=>{
        const {target, url} = faceInfo;

        //upload the canvas to the cubemap face
        const level = 0;
        const internalFormat = gl.RGBA;
        const width = 1024;
        const height = 1024;
        const format = gl.RGBA;
        const type = gl.UNSIGNED_BYTE;

        //Set each face to renderize it
        gl.texImage2D(target, level, internalFormat, width, height, 0, format, type, null);

        //Async call to get the image
        const image = new Image();
        image.src = url;
        image.addEventListener('load', function (){
            //Once the image is loaded upload to the texture
            gl.activeTexture(gl.TEXTURE0 +3);
            gl.bindTexture(gl.TEXTURE_CUBE_MAP, skyboxTexture);
            gl.texImage2D(target, level, internalFormat, format, type, image);
            gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
        });

    }));
    gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);

}

/**
 * Get the parameter of the lights from the UI used to define the light parameters before the rendering
 */
function SkyBoxlightDefinition() {
    var dirLightTheta = -utils.degToRad(settings.directLightTheta);
    var dirLightPhi = -utils.degToRad(settings.directLightPhi);
    settings.directLightDir[0] = Math.cos(dirLightTheta) * Math.cos(dirLightPhi);
    settings.directLightDir[1] = Math.sin(dirLightTheta);
    settings.directLightDir[2] = Math.cos(dirLightTheta) * Math.sin(dirLightPhi);
}

/**
 * set all the matrices before the rendering of the objects
 */
function setSkyBoxMatrices() {
    cameraMatrix = utils.LookAt(settings.cameraPosition, settings.target, settings.up);
    projectionMatrix = utils.MakePerspective(settings.fieldOfView, gl.canvas.width / gl.canvas.height, 1.0, 2000.0); // fow, aspect, near, far
    viewMatrix = utils.invertMatrix(cameraMatrix);
}

function drawSkyBox(){
    gl.useProgram(skyBox_program);
    gl.activeTexture(gl.TEXTURE0 + 3);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, skyboxTexture);
    gl.uniform1i(skyboxTexLocation, 3);


    const viewMatrix = utils.invertMatrix(cameraMatrix);

    var viewProjMat = utils.multiplyMatrices(projectionMatrix, viewMatrix);
    var inverseViewProjMatrix = utils.invertMatrix(viewProjMat);
    gl.uniformMatrix4fv(inverseViewProjMatrixLocation, false, utils.transposeMatrix(inverseViewProjMatrix));

    gl.bindVertexArray(skyBox_vao);
    gl.depthFunc(gl.LEQUAL);
    gl.drawArrays(gl.TRIANGLES, 0, 6);

}





