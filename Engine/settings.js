/**
 * Script used to handle the settings of the environment and the lights
 */

var settings = {
    /** directories */
    baseDir:null,
    shaderDir:null,
    assetDir:null,
    skyboxDir: null,
    /** variables  */
    playerColliderX: 4,
    playerColliderY: 5,
    blocksColliderX: 8.5,
    blocksColliderY: 17,
    hedgesColliderX: 10,
    hedgesColliderY: 10,

    translateFactor: 17,
    translateOffsetBrick: [0, -3.2, 0],
    translateOffsetCylinderIsland: [0, 0, 0],

    translateOffsetSquareIsland: [0, 0, 0],
    scaleFactorSquareIsland: [1, 1.18, 1],
    scaleFactorBrick: [0.77, 0.77, 0.77],
    scaleFactorCylinderIsland: [1, 0.805, 1],

    playerScaleFactor: 6,


    /**Player movement values*/
    horizontalSpeedCap: 5,
    verticalSpeedCap: 5,
    gravity: -0.1,
    deceleration: 0.7, //deceleration = 1 means the speed is linear. deceleration = 0 there is no acceleration.
    jumpHeight: 3,

    /** Game parameters */
    startingLives: 5,
    horizontalBound: -60,
    verticalBound: -100,

    /** camera parameters Main */
    cameraGamePosition: [0.0, 7.0, 4.0],
    cameraPosition: [0.0, -20, 200.0],
    target: [0.0, 0.0, 0.0],
    up: [0.0, 0.0, 1.0],
    fieldOfView: 60,

    /** Camera Parameters Create */
    createCameraPosition: [0.0, -20.0, 200.0],
    createCameraTarget: [0.0, 0.0, 0.0],
    createCameraUp: [0.0, 1.0, 0.0],

    /** Camera Parameters Play */
    playCameraPosition: [0.0, 0.0, 200.0],
    playCameraTarget: [0.0, 0.0, 0.0],
    playCameraUp: [0.0, 1.0, 0.0],

    /** Camera presets
     * each preset needs 3 values for the camera position and the camera up */

    cameraPresets :
    [
      [[-10, 5, 200.0],[0.0, 1.0, 0.0]],
      [[-50, 0.0, 200.0],[0.0, 1.0, 0.0]],
      [[35, 0.0, 200.0],[0.0, 1.0, 0.0]]
    ],


    /** object positions */
    //Insert objects starting positions if necessary

    /** lights */
    //point
    pointLightColor: [0.8, 0.8, 0.8],
    pointLightPosition: [2.0, 5.0, 3.0],
    pointLightDecay: 1.0,
    pointLightTarget: 2.0,
    //direct
    directLightTheta: 30,
    directLightPhi: 40,
    directLightColor: [0.8, 0.8, 0.6],
    directLightDir: [null, null, null],
    //ambient
    ambientLight: [0.2, 0.2, 0.2],
    //specular
    shiness: 50,

    /** background */
    backgroundColor: [0.8, 0.8, 0.8, 1.0],

    useEnvironment:true,

    GetTranslateByType: function(type) {
        if (type === 0) {
            return settings.translateOffsetBrick
        }
        if (type === 1) {
            return settings.translateOffsetHedge
        }
        if (type === 2) {
            return settings.translateOffsetCloud
        }
        if (type === 3) {
            return settings.translateOffsetCylinderIsland
        }
        if (type === 4) {
            return settings.translateOffsetMountain
        }
        if (type === 5) {
            return settings.translateOffsetRock
        }
        if (type === 6) {
            return settings.translateOffsetSquareIsland
        }
        if (type === 7) {
            return settings.translateOffsetTree
        }
    },

    GetScaleByType: function(type) {
        if (type === 0) {
            return settings.scaleFactorBrick
        }
        if (type === 1) {
            return settings.scaleFactorHedge
        }
        if (type === 2) {
            return settings.scaleFactorCloud
        }
        if (type === 3) {
            return settings.scaleFactorCylinderIsland
        }
        if (type === 4) {
            return settings.scaleFactorMountain
        }
        if (type === 5) {
            return settings.scaleFactorRock
        }
        if (type === 6) {
            return settings.scaleFactorSquareIsland
        }
        if (type === 7) {
            return settings.scaleFactorTree
        }
    },

    changeCamera: function(cameraMode){
    if(cameraMode > settings.cameraPresets.size){
        settings.setCameraValues(0)
        return
    }
    settings.setCameraValues(cameraMode)
    },

    setCameraValues: function(index){
    settings.playCameraPosition[0] = settings.cameraPresets[index][0][0]
    settings.playCameraPosition[1] = settings.cameraPresets[index][0][1]
    settings.playCameraPosition[2] = settings.cameraPresets[index][0][2]
    settings.playCameraUp[0] = settings.cameraPresets[index][1][0]
    settings.playCameraUp[1] = settings.cameraPresets[index][1][1]
    settings.playCameraUp[2] = settings.cameraPresets[index][1][2]
}


}

//Definition of the structure used as scene graph (example taken from webGLTutorial2)
var Node = function () {
    this.children = [];
    this.localMatrix = utils.identityMatrix();
    this.worldMatrix = utils.identityMatrix();
};

Node.prototype.setParent = function (parent) {
    // remove us from our parent
    if (this.parent) {
        var ndx = this.parent.children.indexOf(this);
        if (ndx >= 0) {
            this.parent.children.splice(ndx, 1);
        }
    }

    // Add us to our new parent
    if (parent) {
        parent.children.push(this);
    }
    this.parent = parent;
};

Node.prototype.updateWorldMatrix = function (matrix) {
    if (matrix) {
        // a matrix was passed in so do the math
        this.worldMatrix = utils.multiplyMatrices(matrix, this.localMatrix);
    } else {
        // no matrix was passed in so just copy.
        utils.copy(this.localMatrix, this.worldMatrix);
    }

    // now process all the children
    var worldMatrix = this.worldMatrix;
    this.children.forEach(function (child) {
        child.updateWorldMatrix(worldMatrix);
    });
};

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

settingObj.prototype.onSliderInput = function(slider_norm_value){
    this.value = slider_norm_value * this.max;
    document.getElementById(this.id+'_value').innerHTML=this.value.toFixed(2);
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
    'posX': new settingObj(8, false, settings.pointLightPosition[0]),
    'posY': new settingObj(8, false, settings.pointLightPosition[1]),
    'posZ': new settingObj(8, false, settings.pointLightPosition[2]),
    'lightDecay': new settingObj(5, true, settings.pointLightDecay),
    'lightTarget': new settingObj(20, true, settings.pointLightTarget),
    'dirTheta': new settingObj(180, true, settings.directLightTheta),
    'dirPhi': new settingObj(180, false, settings.directLightPhi),
    'ambientLight': new settingObj(1, true, settings.ambientLight[0]),
    'shiness': new settingObj(200, true, settings.shiness),
}

function setDefaultSettings(){
    for(const [key, value] of Object.entries(gui_settings)){
        value.init(key);
    }
}
