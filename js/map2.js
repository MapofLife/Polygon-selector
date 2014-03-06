var overlay, image, lay, selectedShape, hpoly,
  hquery = "",
  selected = new Array(), //array of cartodb_id's of selected polygons
  polys   = new Array(),
  auth    = false,
  map     = null,
  status  = 'Ia',
  // Pick a random lat & lng at the start
  lat     = -6  + Math.floor( Math.random()*5 ),
  lng     = 110 + Math.floor( Math.random()*12 ),
  zoom    = 6,
  user    = "mol",
  table   = "wdpa2010",
  query   = "SELECT cartodb_id, ST_AsGeoJSON(the_geom) as geoj FROM " + table;
  $map_canvas = $('#map');
  $hover_window = $('.hover-window');


  function drawPolygon(id, poly) {
    // Construct the polygon
    // Note that we don't specify an array or arrays, but instead just
    // a simple array of LatLngs in the paths property


    s = selected.indexOf(id);
    if(s != -1) { // if already selected, remove from map
      for(shape in polys) {
        if (polys[shape].cartodb_id == id) {
          polys[shape].setMap(null);
          polys.splice(shape,1);
        }
      }
      selected.splice(s,1);
    }
    else {  // otherwise, add to selected list, and draw on map
    selected.push(id);
    var options = { paths: poly,
      strokeColor: '#AA2143',
      strokeOpacity: 1,
      strokeWeight: 2,
      fillColor: "#FF6600",
      fillOpacity: 0.7 };

      newPoly = new google.maps.Polygon(options);
      newPoly.cartodb_id = id;
      newPoly.setMap(map);
      google.maps.event.addListener(newPoly, 'click', function() {
        setSelection(this);
      });
      polys.push(newPoly);
    }
  }

  function getPolygonsSearch(val) {

    query   = "SELECT cartodb_id, ST_AsGeoJSON(the_geom) as geoj FROM " + table + 
    " WHERE name = '" + val + "'"; //only works for second part or first part alone

    var url = "http://" + user + ".cartodb.com/api/v1/sql?q=" + query;
    var xmin, ymin, xmax, ymax;

    $.getJSON(url,function(response) {

      var xmin = -180, xmax = 180, ymin = -80, ymax = 80;
      for (i in response.rows) {
        var 
        coords = JSON.parse(response.rows[i].geoj).coordinates[0][0],
        xmin = coords[0][0], xmax = coords[0][0], ymin = coords[0][1], ymax = coords[0][1];
        poly   = new Array(); 
        for (j in coords) { 
          // get polygon coordinates
          poly.push(new google.maps.LatLng(coords[j][1], coords[j][0]))
          // find bounds
          if(xmin > coords[j][0])
            xmin = coords[j][0];
          if(ymin > coords[j][1])
            ymin = coords[j][1];
          if(xmax < coords[j][0])
            xmax = coords[j][0];
          if(ymax < coords[j][1])
            ymax = coords[j][1];
        }
        poly.pop();
        drawPolygon( response.rows[i].cartodb_id, poly );
      };
      map.fitBounds(
          new google.maps.LatLngBounds(
              new google.maps.LatLng(ymin, xmin),
              new google.maps.LatLng(ymax, xmax)
          )
      );

    })

    
  }

  function getPolygonsClick(val) {

    query   = "SELECT cartodb_id, ST_AsGeoJSON(the_geom) as geoj FROM " + table + 
    " WHERE cartodb_id = " + val;
    
    var url = "http://" + user + ".cartodb.com/api/v1/sql?q=" + query;
    $.getJSON(url,function(response) {

      for (i in response.rows) {
        var 
        coords = JSON.parse(response.rows[i].geoj).coordinates[0][0],
        poly   = new Array();

        for (j in coords) {
          poly.push(new google.maps.LatLng(coords[j][1], coords[j][0]))
        }

        poly.pop();
        drawPolygon( response.rows[i].cartodb_id, poly );
      };

    })    
  }

  function clearSelection() {
    if (!selectedShape) return;

    storePolygon(selectedShape.getPath(), selectedShape.cartodb_id);
    selectedShape.setEditable(false);
    selectedShape = null;
  }

  function setSelection(shape) {
    clearSelection();
    selectedShape = shape;
    shape.setEditable(false);
  }

var storePolygon = function(cartodb_id) {
    var 
      q = "cartodb_id=" + cartodb_id;
    $.ajax({
      url: "/save/put",
      //crossDomain: true,
      type: 'POST',
      dataType: 'text',
      data: q,
      success: function() { },
      error: function() { }
    });
  }
  // var storePolygon = function(path, cartodb_id) {
  //   var 
  //   coords  = new Array(),
  //   payload = { type: "MultiPolygon", coordinates: new Array()};

  //   payload.coordinates.push(new Array());
  //   payload.coordinates[0].push(new Array());

  //   for (var i = 0; i < path.length; i++) {
  //     coord = path.getAt(i);
  //     coords.push( coord.lng() + " " + coord.lat() );
  //     payload.coordinates[0][0].push([coord.lng(),coord.lat()])
  //   }

  //   var q = "geojson=" + JSON.stringify(payload);

  //   if (cartodb_id) {
  //     q = q + "&cartodb_id=" + cartodb_id;
  //   }
  //   $.ajax({
  //     url: "save/put",
  //     //crossDomain: true,
  //     type: 'POST',
  //     dataType: 'jsonp',
  //     data: q,
  //     success: function() { },
  //     error: function() { }
  //   });
  // }

  function search(val) {
      getPolygonsSearch(val);
  }  

  function fillHoverWindow(data) {
      hquery   = "SELECT name FROM " + table + 
      " WHERE cartodb_id = " + data.cartodb_id;
      hpoly = data.cartodb_id;
      var url = "http://" + user + ".cartodb.com/api/v1/sql?q=" + hquery;
      $.getJSON(url,function(response) {
        var content = response.rows[0].name;
        $hover_window.html(content)
        $hover_window.show();
      })   
  }
  function calcHoverPosition(e){
      var xOffset = e.pageX
      , yOffset = e.pageY
      , xBuffer = 10
      , yBuffer = 10

      , hover_window_height = $hover_window.outerHeight()
      , hover_window_width = $hover_window.outerWidth()

      , map_canvas_height = $map_canvas.outerHeight()
      , map_canvas_width = $map_canvas.outerWidth()

      , map_canvas_offset_left = $map_canvas.offset().left
      , map_canvas_offset_top = $map_canvas.offset().top;

      $hover_window.css({
        'top': yOffset + yBuffer,
        'left': xOffset - hover_window_width/2
      });

      // If it goes against the left wall
      if (xOffset < map_canvas_offset_left  + hover_window_width/2 + xBuffer){
        $hover_window.css({
          'left': xBuffer
        });
      }
      // If it goes against the right wall
      if(xOffset > map_canvas_width - hover_window_width/2 - xBuffer){
        $hover_window.css({
          'left': map_canvas_width - hover_window_width - xBuffer
        });
      }
      // If it goes against the bottom
      if(yOffset > map_canvas_height - hover_window_height - yBuffer){
        $hover_window.css({
          'top': yOffset - yBuffer/2 - hover_window_height
        });
      }
  }
   
  
  function main() {

    //Basic
    var cartodbMapOptions = {
      zoom: zoom,
      center: new google.maps.LatLng( lat, lng ),
      disableDefaultUI: true,
      mapTypeId: google.maps.MapTypeId.ROADMAP
    }

    // Init the map
    map = new google.maps.Map(document.getElementById("map"),cartodbMapOptions);

    // Define the map styles (optional)
    var mapStyle = [{
      stylers: [{ saturation: -65 }, { gamma: 1.52 }] }, {
      featureType: "administrative", stylers: [{ saturation: -95 }, { gamma: 2.26 }] }, {
      featureType: "water", elementType: "labels", stylers: [{ visibility: "off" }] }, {
      featureType: "administrative.locality", stylers: [{ visibility: 'off' }] }, {
      featureType: "road", stylers: [{ visibility: "simplified" }, { saturation: -99 }, { gamma: 2.22 }] }, {
      featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] }, {
      featureType: "road.arterial", stylers: [{ visibility: 'off' }] }, {
      featureType: "road.local", elementType: "labels", stylers: [{ visibility: 'off' }] }, {
      featureType: "transit", stylers: [{ visibility: 'off' }] }, {
      featureType: "road", elementType: "labels", stylers: [{ visibility: 'off' }] }, {
      featureType: "poi", stylers: [{ saturation: -55 }]
    }];

    map.setOptions({styles: mapStyle});
    $map_canvas.mousemove(function(e){
      calcHoverPosition(e)
    });

    // When the mouse exits the window, hide polygons and the hover window
    $map_canvas.mouseleave(function(e){
      $hover_window.hide();
      hpoly="";
    })
    var url1 = 'http://mol.cartodb.com/api/v2/viz/ec6b2194-98d3-11e3-a519-6805ca06688a/viz.json';
    cartodb.createLayer(map, 'http://mol.cartodb.com/api/v2/viz/ec6b2194-98d3-11e3-a519-6805ca06688a/viz.json') 
          .addTo(map)
          .on('done', function(layer) {
            layer.setInteractivity("cartodb_id,name");
            layer.setInteraction(true);
            layer.on('featureClick', function(e, pos, latlng, data) {
              console.log('this is your data' + data.cartodb_id);
              getPolygonsClick(data.cartodb_id);
            });
            layer.on('featureOver', function(e, pos, latlng, data) {
              if (data.cartodb_id != hpoly) {
                hpoly = data.cartodb_id;
                $hover_window.html(data.name);
                $hover_window.show();
              } 
            });
            layer.on('featureOut', function(e, pos, latlng, data) {
              $hover_window.hide();
              hpoly="";
            })

            layer.on('error', function(err) {
              cartodb.log.log('error: ' + err);
            });

          })
          .on('error', function() {
            cartodb.log.log("some error occurred");
          });

    
    $('.searchbox .submit').click(function(event) {
       search($('.searchbox .text').val());
    });

    $('#saveButton').click(function(event) {
       for (i in selected) {
        storePolygon(selected[i]);
       }
       alert("Saved!");
    });

    var drawingManager = new google.maps.drawing.DrawingManager({
      drawingControl: true,
      drawingControlOptions: {
        position: google.maps.ControlPosition.TOP_RIGHT,
        drawingModes: [google.maps.drawing.OverlayType.POLYGON]
      },

      polygonOptions: {
        fillColor: '#0099FF',
        fillOpacity: 0.7,
        strokeColor: '#AA2143',
        strokeWeight: 2,
        clickable: true,
        zIndex: 1,
        editable: true
      }
    });

    drawingManager.setMap(map);


    
    
    // google.maps.event.addListener(drawingManager, 'overlaycomplete', function(e) {
    //   // Add an event listener that selects the newly-drawn shape when the user
    //   // mouses down on it.
    //   var newShape = e.overlay;

    //   newShape.type = e.type;

    //   google.maps.event.addListener(newShape, 'click', function() {
    //     setSelection(this);
    //   });

    //   setSelection(newShape);
    //   storePolygon(newShape.getPath());
    //   newShape.setEditable(false);
    // });

    // google.maps.event.addListener(map, 'click', clearSelection);


  };

  window.onload = main; 