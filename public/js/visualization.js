var view = {
    drivers: [],
    users: [],
    shuttles:[],
    api_url: "http://localhost:3000/api/v1/",
    user_markers: {},
    driver_markers: {},
    shuttle_markers: {}

}
var map = L.map('mapid', { zoomControl: false }).setView([42.729264, -73.679532], 14);
init_map = function() {
    console.log("initializing map...");

    L.tileLayer('https://api.mapbox.com/styles/v1/lucienbrule/ciud3ja3j004p2jmotlpxdj32/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoibHVjaWVuYnJ1bGUiLCJhIjoiY2l1ZDNoZDFwMDA5dTJ6cGdrMWFhaXAwZCJ9.u9afrqlYsU6LdJb3V6IWJA', {
        maxZoom: 18,
        zoomControl: false,
        attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
            '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
            'Imagery © <a href="http://mapbox.com">Mapbox</a>',
        id: 'mapbox.streets'
    }).addTo(map);

    L.circle([42.729752, -73.691882], {
        color: 'whitesmoke',
        fillColor: '#0ff',
        fillOpacity: 0.5,
        radius: 70
    }).addTo(map);
}
get_RPI_shuttles = function() {
	$.get({
        aync: true,
        url: "http://shuttles.rpi.edu/vehicles/current.js",
        success: function(data) {
            view.shuttles = JSON.parse(data);
        },
        error: function(err) { console.warn(err.message); }
    });
}
put_rpi_shuttles_on_map = function() {
    view.shuttles.forEach(function(stl) {
        var lat = parseFloat(stl.vehicle.latest_position.latitude);
        var long = parseFloat(stl.vehicle.latest_position.longitude);
        console.log(lat, long);
        var nlatlong = new L.LatLng(lat, long);
        var marker;
        if (marker = view.shuttle_markers[stl.vehicle.name]) {
            console.log("Already exists");
            console.log(marker);
            marker.setLatLng(nlatlong).update();
            // marker.setLatLng(nlatlong);
            // marker.update();
        } else {
            console.log("New driver added");
            var drivericon = L.divIcon({
                className: 'driver-icon-div',
                html: '<div class = "driver-icon"><span style="no-break">' +
                    stl.vehicle.name + '</span>' +
                    '🚌' + " " + stl.vehicle.latest_position.speed + 
                    '</div><div class="icon-arrow"/>',
                iconSize: new L.Point(50, 50)
            });


            var line = L.polyline([nlatlong, nlatlong]),
                marker = L.animatedMarker(line.getLatLngs(), {
                    onEnd: function() {
                        console.log("This happened");
                        marker.setLatLng(nlatlong)
                        marker.update();
                    }.bind({ marker: marker }),
                    icon: drivericon
                });
            marker.addTo(map);

            view.shuttle_markers[stl.vehicle.name] = marker;
        }


    });
    view.users.forEach(function(usr) {
        var lat = parseFloat(usr.location.coordinates[1]);
        var long = parseFloat(usr.location.coordinates[0]);
        console.log(lat, long);
        var nlatlong = new L.LatLng(lat, long);
        var circle;
        if (circle = view.user_markers[usr._id]) {
            circle.setLatLng(nlatlong)
        } else {

            circle = L.circle(nlatlong, { radius: 30 }).addTo(map);

            view.user_markers[usr._id] = circle

        }



    });


}
populate_from_server = function() {
    console.log(this.api_url);
    $.get({
        aync: true,
        url: view.api_url + "get_drivers/",
        success: function(data) {
            view.drivers = JSON.parse(data);
        },
        error: function(err) { console.warn(err.message); }
    });
    $.get({
        aync: true,
        url: view.api_url + "get_users/",
        success: function(data) {
            view.users = JSON.parse(data);
        },
        error: function(err) { console.warn(err.message); }
    });
}
populate_info_pane = function() {
    var buf;
    view.drivers.forEach(function(drv) {
        buf += "<a class='item item-avatar'><img src='car-icon.png'/><h2>" + drv.profile.name + "</h2><p>" + "💃".repeat(drv.currentseats) + "</p></a>";
    });
    $("#driverlist").html(buf);
    // view.drivers.forEach(function(drv) {
    //     $("#driverlist").html('< div class = "item item-avatar" >' +
    //         '< img src = "car-icon.png" />' +
    //         '< h2 >' + drv.profile.name + '< /h2> < p >' + '💃'.repeat(drv.profile.numseats - drv.currentseats) + '< /p> < /div>'
    //     );

    // });
}

//using animated leaflet marker, credit to openplans
//https://github.com/openplans/Leaflet.AnimatedMarker/blob/master/src/AnimatedMarker.js
refresh_map_data = function() {
    console.log("refreshing map data");
    view.drivers.forEach(function(drv) {
        var lat = parseFloat(drv.location.coordinates[1]);
        var long = parseFloat(drv.location.coordinates[0]);
        console.log(lat, long);
        var nlatlong = new L.LatLng(lat, long);
        var marker;
        if (marker = view.driver_markers[drv._id]) {
            console.log("Already exists");
            console.log(marker);
            marker.setLatLng(nlatlong).update();
            // marker.setLatLng(nlatlong);
            // marker.update();
        } else {
            console.log("New driver added");
            var drivericon = L.divIcon({
                className: 'driver-icon-div',
                html: '<div class = "driver-icon"><span style="no-break">' +
                    drv.profile.name + '</span>' +
                    '💺'.repeat(drv.currentseats) +
                    '</div><div class="icon-arrow"/>',
                iconSize: new L.Point(50, 50)
            });


            var line = L.polyline([nlatlong, nlatlong]),
                marker = L.animatedMarker(line.getLatLngs(), {
                    onEnd: function() {
                        console.log("This happened");
                        marker.setLatLng(nlatlong)
                        marker.update();
                    }.bind({ marker: marker }),
                    icon: drivericon
                });
            marker.addTo(map);

            view.driver_markers[drv._id] = marker;
        }


    });
    view.users.forEach(function(usr) {
        var lat = parseFloat(usr.location.coordinates[1]);
        var long = parseFloat(usr.location.coordinates[0]);
        console.log(lat, long);
        var nlatlong = new L.LatLng(lat, long);
        var circle;
        if (circle = view.user_markers[usr._id]) {
            circle.setLatLng(nlatlong)
        } else {

            circle = L.circle(nlatlong, { radius: 30 }).addTo(map);

            view.user_markers[usr._id] = circle

        }



    });

}

function refresh() {
    console.log("30 seconds passed");
    populate_from_server();
    refresh_map_data();
    populate_info_pane();
}
//dunno how much they can take.

function refresh_RPI_shuttles(){
	get_RPI_shuttles();
	put_rpi_shuttles_on_map();
	return refresh_RPI_shuttles
}
function init() {
    console.log("Initializing...");
    init_map();
    populate_from_server();
    refresh_map_data();
    refresh();
    refresh_RPI_shuttles();
    // var interval0 = setInterval(refresh, 10 * 1000); //every 10 seconds
    var inteval1 = setInterval((refresh_RPI_shuttles)(), 10 * 1000); //every 30 seconds
}

document.addEventListener('DOMContentLoaded', init, false);
