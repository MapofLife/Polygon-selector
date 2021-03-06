//Draws polygons on map to implement select and hover. 
//Hovering polygons is still a little buggy for GADM data.
//Also might want to be more specific with the GADM hover box names

var overlay, image, lay, selectedShape, h_id, 
  hpoly = new Array(),  
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
    // Draw polygon on map when selected

    var s = selected.indexOf(id);
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

      google.maps.event.addListener(newPoly, 'click', function() {  //CHECK what is this?
        setSelection(this);
      });

      polys.push(newPoly);
    }
  }

  function drawHoverPolygon(id, poly) {
    // Draw polygon on map (when mouse hovers over it)

    var options = { paths: poly,
      strokeColor: '#F0C3B1',
      strokeOpacity: 1,
      strokeWeight: 1,
      fillColor: "#ED8961",
      fillOpacity: 0.7 };
    newPoly = new google.maps.Polygon(options);
    newPoly.cartodb_id = id;
    newPoly.setMap(map);
    hpoly.push(newPoly);
  }

  function removeHoverPolygon() {
    // Removes polygon from map
    for (l = 0; l < hpoly.length; l++) {
      console.log('out'+hpoly[l].cartodb_id);
      hpoly[l].setMap(null);
      hpoly.splice(l,1);
    }
  }

  function getPolygonsSearch(val) {
    // Gets polygon coordinates from search function, sends to drawPolygoon

    query   = "SELECT cartodb_id, ST_AsGeoJSON(the_geom) as geoj FROM " + table + 
      " WHERE name = '" + val + "'"; 
    var url = "http://" + user + ".cartodb.com/api/v1/sql?q=" + query;

    $.getJSON(url,function(response) {
      var xmin, ymin, xmax, ymax, coords, poly;
      xmin = -180, xmax = 180, ymin = -80, ymax = 80;

      for (i in response.rows) {
        coords = JSON.parse(response.rows[i].geoj).coordinates[0][0];
        xmin = coords[0][0], xmax = coords[0][0], ymin = coords[0][1], ymax = coords[0][1];
        poly   = new Array(); 

        for (j in coords) { 
          // get polygon coordinates
          poly.push(new google.maps.LatLng(coords[j][1], coords[j][0]));

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
        drawPolygon(response.rows[i].cartodb_id, poly);
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
    // Get polygon coordinates from cartodb_id (returned on click), sends to drawPolygon

    query   = "SELECT cartodb_id, ST_AsGeoJSON(the_geom) as geoj FROM " + table + 
    " WHERE cartodb_id = " + val;
    var url = "http://" + user + ".cartodb.com/api/v1/sql?q=" + query;

    $.getJSON(url,function(response) {
      var coords, poly;

      for (i in response.rows) {
        coords = JSON.parse(response.rows[i].geoj).coordinates[0][0];
        poly   = new Array();

        for (j in coords) {
          poly.push(new google.maps.LatLng(coords[j][1], coords[j][0]))
        }

        poly.pop();
        drawPolygon( response.rows[i].cartodb_id, poly);
      };
    })    
  }

  function getPolygonHover(val) {
    // Get polygon coordinates from cartodb_id (on hover), sends to drawHoverPolygon
    removeHoverPolygon();
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
        }   //CHECK why Tropical Rainforest Heritage of Sumatra does not completely show up
        poly.pop();
        drawHoverPolygon( response.rows[i].cartodb_id, poly);
      };
    })    
  }

//CHECK NOT IN USE
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
/////

  var storePolygon = function(cartodb_id) {
    // inserts row with cartodb_id into a table
    var q = "cartodb_id=" + cartodb_id;
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

    // CHECK this seems to do nothing
    // When the mouse exits the window, hide polygons and the hover window
    // $map_canvas.mouseleave(function(e){
    //   $hover_window.hide();
    // })

    var layers = new Array;
    var url1 = 'http://mol.cartodb.com/api/v2/viz/ec6b2194-98d3-11e3-a519-6805ca06688a/viz.json';
    var url2 = 'http://mol.cartodb.com/api/v2/viz/d644e280-a64b-11e3-a410-002590d96782/viz.json';
    cartodb.createLayer(map, url1) 
          .addTo(map,0)
          .on('done', function(layer) {
            layers[0] = layer;
            layer.setInteractivity("cartodb_id,name");
            layer.setInteraction(true);
            layer.on('featureClick', function(e, pos, latlng, data) {
              console.log('this is your data' + data.cartodb_id);
              getPolygonsClick(data.cartodb_id);
            });
            layer.on('featureOver', function(e, pos, latlng, data) {
              if (data.cartodb_id != h_id) {
                //removeHoverPolygon();
                console.log('hover'+data.cartodb_id);
                h_id = data.cartodb_id;
                getPolygonHover(h_id);
                $hover_window.html(data.name);
                $hover_window.show();
              } 
            });
            layer.on('featureOut', function(e, pos, latlng, data) {
              $hover_window.hide(); 
              removeHoverPolygon();  //CHECK still laggy
              h_id="";
            })

            layer.on('error', function(err) {
              cartodb.log.log('error: ' + err);
            });
            
          })
          .on('error', function() {
            cartodb.log.log("some error occurred");
          });
    cartodb.createLayer(map, url2) 
          .addTo(map,1)
          .on('done', function(layer) {
            layers[1] = layer;
            layer.setInteractivity("cartodb_id,name_0");
            layer.setInteraction(true);
            layer.on('featureClick', function(e, pos, latlng, data) {
              console.log('this is your data' + data.cartodb_id);
              getPolygonsClick(data.cartodb_id);
            });
            layer.on('featureOver', function(e, pos, latlng, data) {
              if (data.cartodb_id != h_id) {
                console.log('hover:'+data.cartodb_id);
                h_id = data.cartodb_id;
                getPolygonHover(h_id);
                $hover_window.html(data.name_0);
                $hover_window.show();
              } 
            });
            layer.on('featureOut', function(e, pos, latlng, data) {
              $hover_window.hide();
              removeHoverPolygon();
              h_id="";
            })

            layer.on('error', function(err) {
              cartodb.log.log('error: ' + err);
            }); 
          })
          .on('error', function() {
            cartodb.log.log("some error occurred");
          });
layers[0].hide();

    $('.searchbox .submit').click(function(event) {
       search($('.searchbox .text').val());
    });

    $(document).ready(function (){
      $('.toggle-left').click(function (){
       $(this).css('background-color',"#777");
       $('.toggle-middle').css('background-color', 'white');
       layers[0].show();
       layers[1].hide();
       table = 'wdpa2010';
       });
     });
    $(document).ready(function (){
      $('.toggle-middle').click(function (){
       $(this).css('background-color',"#777");
       $('.toggle-left').css('background-color', 'white');
       layers[0].hide();
       layers[1].show();
       table = 'gadm2'
       });
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