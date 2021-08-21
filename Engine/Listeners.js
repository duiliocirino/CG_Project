var keyPress = function(e){
    if(!keys[e.keyCode]){
        keys[e.keyCode] = true;
        switch (e.keyCode){
            case 87: //W
                //
                break;
            case 65: //A
                //
                break;
            case 83: //S
                //
                break;
            case 68: //D
                //
                break;
            case 32: //SPACEBAR
                //
                break;
            case 37: //LEFT ARROW
                //
                break;
            case 38: //UP ARROW
                //
                break;
            case 39: //RIGHT ARROW
                //
                break;
            case 40: //DOWN ARROW
                //
                break;
            case 86: //V -> change view?
                //
                break;
            case 70: //F -> full screen?
                //
                break;
            case 27: //ESC
                //
                break;

        }
    }
}


var keyRelease = function(e){
    if(keys[e.keyCode]){
        keys[e.keyCode] = false;
        switch (e.keyCode){
            case 87: //W
                //
                break;
            case 65: //A
                //
                break;
            case 83: //S
                //
                break;
            case 68: //D
                //
                break;
            case 32: //SPACEBAR
                //
                break;
            case 37: //LEFT ARROW
                //
                break;
            case 38: //UP ARROW
                //
                break;
            case 39: //RIGHT ARROW
                //
                break;
            case 40: //DOWN ARROW
                //
                break;
        }
    }
}