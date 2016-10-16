// var center = null;
// var map = null;
// var currentPopup;
// var bounds = new google.maps.LatLngBounds();

// function addMarker(lat, lng, place) {
//     var pt = new google.maps.LatLng(lat, lng);
//     bounds.extend(pt);
//     var marker = new google.maps.Marker({
//         location: place,
//         position: pt,
//         map: map
//     });


    /*  don't worry about popups YET
    var popup = new google.maps.InfoWindow({
        content: info,
        maxWidth: 300
    });
    google.maps.event.addListener(marker, "click", function() {
        if (currentPopup != null) {
            currentPopup.close();
            currentPopup = null;
        }
        popup.open(map, marker);
        currentPopup = popup;
    });
    google.maps.event.addListener(popup, "closeclick", function() {
        map.panTo(center);
        currentPopup = null;
    });
    */
    // if(map) {
    //     center = bounds.getCenter();
    //     map.fitBounds(bounds);
    // }
// }

// function initMap() {
//     map = new google.maps.Map(document.getElementById("map"), {
//         center: new google.maps.LatLng(0, 0),
//         zoom: 1,
//         mapTypeId: google.maps.MapTypeId.ROADMAP,
//         mapTypeControl: false,
//         mapTypeControlOptions: {
//             style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR
//         },
//         navigationControl: true,
//         navigationControlOptions: {
//             style: google.maps.NavigationControlStyle.SMALL
//         }
//     });

//     center = bounds.getCenter();
//     map.fitBounds(bounds);

// }

/*
var markers = [
      {
        location: 'Troy',
        latitude: 42.7284,
        longitude: -73.6918
      },
      {
        location: 'Latham',
        latitude: 42.7478,
        longitude: -73.7605
      },
      {
        location: 'Poughkeepsie',
        latitude: 41.7004,
        longitude: -73.9210
      }

    ];
*/