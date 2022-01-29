import {Map} from "./Map.js";

export class MapHandler{
    constructor() {
        this.maps = [];
        this.lastMapId = 0;

        var temp = JSON.parse(localStorage.getItem("maps"));
        if(temp === null) {
            localStorage.setItem("maps", JSON.stringify(this.maps));
        } else{
            this.maps = JSON.parse(localStorage.getItem("maps"));
        }
        temp = JSON.parse(localStorage.getItem("lastMapId"));
        if(temp === null) {
            localStorage.setItem("lastMapId", "0");
        } else{
            this.lastMapId = parseInt(JSON.parse(localStorage.getItem("lastMapId")));
        }
    }

    storeMap(map){
        this.maps.push(map);
        this.lastMapId += 1;
        localStorage.setItem("lastMapId", this.lastMapId.toString());
        localStorage.setItem("maps", JSON.stringify(this.maps));
    }

    removeMap(mapId) {
        var map = this.maps.find(b => b.id === mapId);
        if(!isNaN(map.id)){
            this.maps.splice(this.maps.indexOf(map), 1);
        }
    }

    createMap() {
        let map = new Map("Noname", this.lastMapId);
        return map;
    }

    resetMaps() {
        this.maps = [];
        localStorage.setItem("maps", JSON.stringify(this.maps));
        this.lastMapId = 0;
        localStorage.setItem("lastMapId", "0");
    }

    getMaps() {
        return this.maps;
    }

    loadMap(mapId){
        var map = this.maps.find(map => map.id === mapId);
        if(map !== null) return map;
        else return null;
    }
}