/**
 * Script used to handle the settings of the environment and the lights
 */

var settings = {
    /**
     * Colliders' value
     */
    playerColliderX: 4,
    playerColliderY: 5,
    blocksColliderX: 8.5,
    blocksColliderY: 17,
    hedgesColliderX: 10,
    hedgesColliderY: 10,

    /**
     * Translate values
     */
    translateFactor: 17,
    translateOffsetBrick: [0, -3.2, 0],
    translateOffsetHedge: [0, 0, 0],
    translateOffsetCloud: [0, 160, 0],
    translateOffsetCylinderIsland: [0, 0, 0],
    translateOffsetSquareIsland: [0, 0, 0],
    translateOffsetTree:[0, 0, 0],
    translateOffsetRock: [0, 0, 0],
    translateOffsetFlagpole: [0,40,0],

    /**
     * Scaling values
     */
    scaleFactorPlayer: 6,
    scaleFactorBrick: [0.77, 0.77, 0.77],
    scaleFactorHedge: [0.65, 2.05, 1],
    scaleFactorCloud: [1, 1, 1],
    scaleFactorCylinderIsland: [1.1, 0.8, 1],
    scaleFactorSquareIsland: [1, 1.18, 1],
    scaleFactorTree:[1, 1, 1],
    scaleFactorRock: [1, 1, 1],
    scaleFactorFlagpole: [0.2, 0.2, 0.2],

    /**
     * Objects special colors
     */
    playerColor: [0.98, 0.98, 0.98, 1],
    cloudsColor: [1, 1, 1, 1],
    bricksColor: [0.51, 0.11, 0.11, 1],
    hedgeColor: [0.88, 0.88, 0.88, 1],
    treeColor: [1, 0.647, 0.125, 1],

    /**
     * Clouds' parameters
     */
    cloudBaseNumber: 4,
    //cloudHeightFactor: 70, //factor that is multiplied to the random number generated for the height of the clouds
    cloudTranslateFactor: 7, //the horizontal displacement of the clouds from x = 0
    cloudSpeed: 0.05,
    cloudsBackDespawnFactor: 280,
    cloudsFrontRespawnFactor: 450,

    /**
     * Hedges' parameters
     */
    hedgeDisplacement: [-6, 0, 6],

    /**
     * Player movement values
     */
    horizontalSpeedCap: 5,
    verticalSpeedCap: 5,
    gravity: -0.1,
    deceleration: 0.7, //deceleration = 1 means the speed is linear. deceleration = 0 there is no acceleration.
    jumpHeight: 3,

    /**
     * Game parameters
     */
    startingLives: 5,
    horizontalBound: -60,
    verticalBound: -100,
    activeHedgesTime: 2,
    hedgesHeight: 6,

    /**
     * Map values
     */
    lastMapId: 0,

    /**
     * camera parameters Main
     */
    cameraGamePosition: [0.0, 7.0, 4.0],
    cameraPosition: [0.0, -20, 200.0],
    target: [0.0, 0.0, 0.0],
    up: [0.0, 1.0, 0.0],
    fieldOfView: 60,

    /**
     * Camera Parameters Create
     */
    createCameraPosition: [0.0, -20.0, 200.0],
    createCameraTarget: [0.0, 0.0, 0.0],
    createCameraUp: [0.0, 1.0, 0.0],

    /**
     * Camera Parameters Play
     */
    playCameraPosition: [0.0, 20.0, 200.0],
    playCameraTarget: [0.0, 0.0, 0.0],
    playCameraUp: [0.0, 1.0, 0.0],

    /** Camera presets
     * each preset needs 3 values for the camera position and the camera up
     */
    cameraPresets :
    [
      [[-10, 5, 200.0],[0.0, 1.0, 0.0]],
      [[-50, 15, 200.0],[0.0, 1.0, 0.0]],
      [[40, 10, 200.0],[0.0, 1.0, 0.0]]
    ],

    /**
     * Textures information.
     */
    textureSrc: ["Graphics/Models/Terrain-Texture_2.png", "Graphics/Models/Flagpole.png"],

    /**
     * Lights parameters
     */
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
    shiness: 500,

    /**
     * background
     */
    backgroundColor: [0.8, 0.8, 0.8, 1.0],

    useEnvironment:true,


    /**
     * This method is used to get the TranslateOffset given the type of the object.
     * @param type: the code corresponding to the requested object.
     * @returns {number[]|*}
     * @constructor
     */
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
        if (type === 9) {
            return settings.translateOffsetFlagpole;
        }
    },

    /**
     * This method is used to get the ScaleFactor given the type of the object.
     * @param type: the code corresponding to the requested object.
     * @returns {number[]|*}
     * @constructor
     */
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
        if (type === 9) {
            return settings.scaleFactorFlagpole
        }
    },

    /**
     * This method sets the position vector and the up vector of the camera
     * according to a preset.
     * @param cameraMode the number of the preset to apply to the camera
     */
    changeCamera: function(cameraMode){
        if(cameraMode > settings.cameraPresets.size){
            settings.setCameraValues(0)
            return
        }
        settings.setCameraValues(cameraMode)
    },

    /**
     * Changes the camera position and up values.
     * @param index is the preset number from the camera preset list.
     */
    setCameraValues: function(index){
        settings.playCameraPosition[0] = settings.cameraPresets[index][0][0]
        settings.playCameraPosition[1] = settings.cameraPresets[index][0][1]
        settings.playCameraPosition[2] = settings.cameraPresets[index][0][2]
        settings.playCameraUp[0] = settings.cameraPresets[index][1][0]
        settings.playCameraUp[1] = settings.cameraPresets[index][1][1]
        settings.playCameraUp[2] = settings.cameraPresets[index][1][2]
    }


}

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

