export class MapHandler{
    constructor() {
        this.maps = [];
        if(localStorage.getItem("maps") === "") {
            localStorage.setItem("maps", this.maps);
        } else{
            this.maps = localStorage.getItem("maps")
        }
    }

    storeMap(map){
        this.maps.push(map);
        localStorage.setItem("maps", this.maps);
    }

    removeMap(mapId) {
        var map = this.maps.find(b => b.id === mapId);
        if(!isNaN(map.id)){
            this.maps.splice(this.maps.indexOf(map), 1);
        }
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