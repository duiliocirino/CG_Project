import {m4} from "../TWGL/twgl.js";

export class Node{
    //Node definition
    /**
     * Class used to define a node of the scene graph
     * @param localWorldMatrix is the world matrix of the node
     * @param children is an array of children nodes
     * @param drawInfo contains Mesh and Texture of the object
     */
    constructor(localWorldMatrix) {
        this.children = [];
        this.localMatrix = localWorldMatrix;
        this.worldMatrix = utils.identityMatrix();
    }


    addChild(node){
        this.children.push(node);
    }

    setParent(parent){
        // remove us from our parent
        if (this.parent) {
            var ndx = this.parent.children.indexOf(this);
            if (ndx >= 0) {
        // remove elem ndx(current node) from our parent
                this.parent.children.splice(ndx, 1);
            }
        }
        // Add us to our new parent
        if (parent) {
            parent.children.push(this);
        }
        this.parent = parent;
    }

    updateWorldMatrix(matrix) {
        if (matrix) {
            this.worldMatrix = utils.multiplyMatrices(matrix, this.localMatrix);
        } else {
        // no matrix was passed in so just copy localMatrix->worldMatrix.
            utils.copy(this.localMatrix, this.worldMatrix);
        }
        // now process all the children
        var worldMatrix = this.worldMatrix;
        this.children.forEach(function(child) {
            child.updateWorldMatrix(worldMatrix);
        });
    }

}