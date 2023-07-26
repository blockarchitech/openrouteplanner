// Render

import * as toGeoJSON from "@tmcw/togeojson";
import * as turf from "@turf/turf";
import { default as queryOverpass } from "./queryOverpass";

export default function render(event, map, update_selected_info) {
  var gpx = event.target.result;
  var parser = new DOMParser();
  var xmlDoc = parser.parseFromString(gpx, "text/xml");
  var gpxData = toGeoJSON.gpx(xmlDoc);

  // Parse Lat/Lngs from gpxData
  var lat_lngs = [];
  try {
    for (var i = 0; i < gpxData.features[0].geometry.coordinates.length; i++) {
      lat_lngs.push(
        new L.LatLng(
          gpxData.features[0].geometry.coordinates[i][1],
          gpxData.features[0].geometry.coordinates[i][0]
        )
      );
    }
  } catch (error) {
    alert(
      "Error parsing GPX file. Please ensure it's a valid GPX file.\n\n" +
        error +
        "\n\n Your GPX: \n\n" +
        gpxData
    );
  }

  // Get some extended stats (e.g. estimated how long it'll take to complete the trip at 12mph)
  var distance = turf.length(gpxData, { units: "miles" });
  var duration_in_minutes = Math.round((distance / 12) * 60);

  // Get the name. If the name is not set, find the closest road from the starting point and use that as the name
  if (gpxData.features[0].properties.name == undefined) {
    var query = `
		[out:json];
		way(around:10,${gpxData.features[0].geometry.coordinates[0][1]},${gpxData.features[0].geometry.coordinates[0][0]})
		[highway];
		out body;
		>;
		out skel qt;
	`;
    queryOverpass(query).then(function (data) {
      // loop through all the ways returned and find the first one with a name
      //   alert(data);
      for (var i = 0; i < data.elements.length; i++) {
        if (data.elements[i].tags.name != undefined) {
          gpxData.features[0].properties.name = data.elements[i].tags.name;
          // Ensure selected info is only *one line*
          update_selected_info(
            `Trip near <strong>${
              gpxData.features[0].properties.name
            }</strong> - ${distance.toFixed(
              2
            )} miles - ~${duration_in_minutes} minutes (at 12mph)`
          );

          break;
        }
      }
    });
  } else {
    // Ensure selected info is only *one line*
    update_selected_info(
      `Trip '<strong>${
        gpxData.features[0].properties.name
      }</strong>' - ${distance.toFixed(
        2
      )} miles - about ${duration_in_minutes} minutes (at 12mph)`
    );
  }

  // Add gpx layer to map
  var gpxLayer = new L.Polyline(lat_lngs, {
    color: "blue",
    weight: 3,
    opacity: 0.5,
    smoothFactor: 1
  });
  map.addLayer(gpxLayer);

  // Add start and end markers to map
  var startMarker = L.marker([
    gpxData.features[0].geometry.coordinates[0][1],
    gpxData.features[0].geometry.coordinates[0][0]
  ]).addTo(map);
  var endMarker = L.marker([
    gpxData.features[0].geometry.coordinates[
      gpxData.features[0].geometry.coordinates.length - 1
    ][1],
    gpxData.features[0].geometry.coordinates[
      gpxData.features[0].geometry.coordinates.length - 1
    ][0]
  ]).addTo(map);

  // Query overpass for the road that the trip starts on, and the road that the trip ends on
  var startQuery = `
	  	[out:json];
	  	way(around:10,${gpxData.features[0].geometry.coordinates[0][1]},${gpxData.features[0].geometry.coordinates[0][0]})
	  	[highway];
			  	out body;
				>;
				out skel qt;
	  `;

  var endQuery = `
	  	[out:json];
	  	way(around:10,${
        gpxData.features[0].geometry.coordinates[
          gpxData.features[0].geometry.coordinates.length - 1
        ][1]
      },${
    gpxData.features[0].geometry.coordinates[
      gpxData.features[0].geometry.coordinates.length - 1
    ][0]
  })
	  	[highway];
	  	out body;
			  	>;
				out skel qt;
					  `;
  queryOverpass(startQuery).then(function (data) {
    // Add popup to start marker
    startMarker.bindPopup(
      `Starts on <strong>${data.elements[0].tags.name}</strong>`
    );
  });
  queryOverpass(endQuery).then(function (data) {
    // Add popup to end marker
    endMarker.bindPopup(
      `Ends on <strong>${data.elements[0].tags.name}</strong>`
    );
  });

  // focus the map on the gpx data
  map.fitBounds(L.geoJSON(gpxData).getBounds());
}
