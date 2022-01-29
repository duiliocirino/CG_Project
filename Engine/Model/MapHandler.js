export class MapHandler{
    constructor() {
        this.maps = [];
        var temp = JSON.parse(localStorage.getItem("maps"));
        if(temp === null) {
            localStorage.setItem("maps", JSON.stringify(this.maps));
        } else{
            this.maps = JSON.parse(localStorage.getItem("maps"));
        }
    }

    storeMap(map){
        this.maps.push(map);
        localStorage.setItem("maps", JSON.stringify(this.maps));
    }

    removeMap(mapId) {
        var map = this.maps.find(b => b.id === mapId);
        if(!isNaN(map.id)){
            this.maps.splice(this.maps.indexOf(map), 1);
        }
    }

    resetMaps() {
        this.maps = [];
        settings.lastMapId = 0;
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