//
// GPX Viewer
//

if (
  window.matchMedia &&
  window.matchMedia("(prefers-color-scheme: dark)").matches
) {
  document.documentElement.setAttribute("data-bs-theme", "dark");
}

const userTime = new Date();

if (userTime.getHours() >= 18 || userTime.getHours() <= 6) {
  document.documentElement.setAttribute("data-bs-theme", "dark");
}

// gibbie
// are you here
// ok well
// we could tryy and make it so that the map loads before you reach the unloaded parts
// that might be difficult
// but it would provide seamless scrolling

// atleast it's dark
// yay :)
// oh we should add an automatic time theme changer
// not the best looking but it'll get by
// won't singe your eyes at night

// Jquery
import $ from "jquery";

// Bootstrap
import * as bootstrap from "bootstrap";

// Leaflet
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import togpx from "togpx";
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow
});

require("leaflet-control-geocoder");
require("leaflet-routing-machine");
require("lrm-graphhopper");
require("./helpers/convertCords");

// Helpers
import { default as render } from "./helpers/render";
import { default as createButton } from "./helpers/createButton";
import queryOverpass from "./helpers/queryOverpass";

// URL Params
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);

// Check if first time visiting
if (localStorage.getItem("first_visit") == null) {
  localStorage.setItem("first_visit", "true");
  localStorage.setItem("graphhopper_api_key", null);
  $("#welcomeModal").modal("show");
}

function showWeclome() {
  // temp function
  $("#welcomeModal").modal("show");
}

// Map setup
var map = L.map("map").setView([51.505, -0.09], 13);
map.addLayer(
  new L.TileLayer("http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution:
      "Map data © <a href='http://openstreetmap.org'>OpenStreetMap</a> contributors | Special thanks to Turf.js, Leaflet, and Overpass API"
  })
);

L.control.scale().addTo(map);

// Course selected setup
var selected_info_text = document.getElementById("loaded_course");
function update_selected_info(text) {
  if (selected_info_text.innerHTML == "") {
    selected_info_text.innerHTML = `<a class="nav-link disabled">No course selected</a>`;
  } else {
    selected_info_text.innerHTML = `<a class="nav-link" href="#">${text}</a>`;
  }
}

// Dropzone setup
var dropzone = document.getElementById("dropzone");
dropzone.hidden = true;

document.addEventListener(
  "dragover",
  function (e) {
    e.preventDefault();
    dropzone.hidden = false;
    return false;
  },
  false
);

document.addEventListener(
  "dragleave",
  function (e) {
    e.preventDefault();
    dropzone.hidden = true;
    return false;
  },
  false
);

// Helpers

// GraphHopper API Key setup

function askForGraphHopperKey() {
  console.log("askForGraphHopperKey");
  $("#graphhopperApiKeyModal").modal("show");
}

var api_key_button = document.getElementById("save_graphhopper_api_key");
api_key_button.addEventListener("click", function () {
  // set button to bootstrap spinner
  api_key_button.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Saving...`;
  api_key_button.disabled = true;
  var api_key = document.getElementById("graphhopper_api_key").value;
  // call the api to check if the key is valid
  fetch(
    `https://graphhopper.com/api/1/route?point=51.131108%2C-114.01028&point=51.131108%2C-114.01028&vehicle=bike&locale=en&key=${api_key}`
  ).then(function (response) {
    if (response.status == 401) {
      document.getElementById("graphhopper_api_key_error").hidden = false;
      api_key_button.innerHTML = `Save`;
      api_key_button.disabled = false;

      return false;
    } else {
      document.getElementById("graphhopper_api_key_error").hidden = false;
      localStorage.setItem("graphhopper_api_key", api_key);
      $("#graphhopperApiKeyModal").modal("hide");
      return true;
    }
  });
});

// Handle file drop

document.addEventListener(
  "drop",
  function (e) {
    e.preventDefault();
    dropzone.hidden = true;
    var file = e.dataTransfer.files[0];
    if (file.name.split(".").pop() != "gpx") {
      alert(
        "Please upload a GPX file! \n\nIf you're uploading a different type, please convert them to .GPX first: https://www.alltrails.com/converter"
      );
      return false;
    }

    var reader = new FileReader();
    reader.onload = function (event) {
      render(event, map, update_selected_info);
    };
    reader.readAsText(file);
    return false;
  },
  false
);

// Handle file selection

document.getElementById("file-input").addEventListener(
  "change",
  function (e) {
    var file = e.target.files[0];
    if (file.name.split(".").pop() != "gpx") {
      alert(
        "Please upload a GPX file! \n\nIf you're uploading .FIT files, please convert them to .GPX first: https://www.alltrails.com/converter"
      );
      return false;
    }
    var reader = new FileReader();
    reader.onload = function (event) {
      render(event);
    };
    reader.readAsText(file);
    return false;
  },
  false
);

// Handle new document button
// (URL param: ?new=true)

if (urlParams.get("new") == "true") {
  // Check localsotrage for GraphHopper API key
  if (
    localStorage.getItem("graphhopper_api_key") == null ||
    localStorage.getItem("graphhopper_api_key") == "null"
  ) {
    askForGraphHopperKey();
  }

  // New document (do not upload a file)

  // Ask for user location and focus map on it
  //   map.locate({ setView: true, maxZoom: 16 });
  // temp center on sacramento
  map.setView([38.5816, -121.4944], 13);
  // Ask user to click on the map to start drawing (create a new router with leaflet routing machine)
  var router = new L.Routing.control({
    waypoints: [],
    routeWhileDragging: true,
    geocoder: L.Control.Geocoder.nominatim(),
    showAlternatives: true,
    altLineOptions: {
      styles: [
        { color: "black", opacity: 0.15, weight: 9 },
        { color: "white", opacity: 0.8, weight: 6 },
        { color: "blue", opacity: 0.5, weight: 2 }
      ]
    },
    // use OpenStreetMap as the default routing service
    router: L.Routing.graphHopper(localStorage.getItem("graphhopper_api_key"), {
      urlParameters: {
        vehicle: "bike"
      }
    }),
    formatter: new L.Routing.Formatter({
      units: "imperial",
      roundingSensitivity: 1,
      distanceTemplate: "{value} {unit}"
    })
  }).addTo(map);

  map.on("click", function (e) {
    var container = L.DomUtil.create("div"),
      startBtn = createButton("Start from this location", container),
      destBtn = createButton("Go to this location", container),
      addBtn = createButton("Add a waypoint here", container);
    L.DomEvent.on(startBtn, "click", function () {
      router.spliceWaypoints(0, 1, e.latlng);
      map.closePopup();
    });
    L.DomEvent.on(destBtn, "click", function () {
      router.spliceWaypoints(router.getWaypoints().length - 1, 1, e.latlng);
      map.closePopup();
    });
    L.DomEvent.on(addBtn, "click", function () {
      router.spliceWaypoints(router.getWaypoints().length, 0, e.latlng);
      map.closePopup();
    });

    L.popup().setContent(container).setLatLng(e.latlng).openOn(map);
  });

  router.on("routesfound", function (e) {
    queryOverpass(`
		[out:json];
		way(around:20,${e.waypoints[0].latLng.lat},${e.waypoints[0].latLng.lng})[highway];
		out body;
		>;
		out skel qt;
	`).then(function (data) {
      console.log(data);
      update_selected_info(
        `Planning a trip near <strong>${data.elements[0].tags.name}</strong> - via ${data.generator}
		`
      );
    });
  });

  // Function to save the route as a GPX file
  function saveRoute() {
    var polyline = L.polyline(router._routes[0].coordinates);
    var geojson = polyline.toGeoJSON();
    var gpx = togpx(geojson);
    var blob = new Blob([gpx], { type: "text/plain;charset=utf-8" });
    var filename = "route.gpx";
    var a = document.createElement("a");
    a.download = filename;
    a.href = window.URL.createObjectURL(blob);
    a.dataset.downloadurl = ["text/plain", a.download, a.href].join(":");
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  // Add a CTRL/CMD + S shortcut to save the route
  document.addEventListener("keydown", function (e) {
    if (
      (window.navigator.platform.match("Mac") ? e.metaKey : e.ctrlKey) &&
      e.keyCode == 83
    ) {
      e.preventDefault();
      saveRoute();
    }
  });
}
