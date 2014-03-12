var 
  map     = null,
  // Pick a random lat & lng at the start
  lat     = -6  + Math.floor( Math.random()*5 ),
  lng     = 110 + Math.floor( Math.random()*12 ),
  zoom    = 6,
  user    = "mol",
  table   = "gadm2",
  query   = "SELECT cartodb_id, ST_AsGeoJSON(the_geom) as geoj FROM " + table;
  $map_canvas = $('#map');
  $hover_window = $('.hover-window');
var currentLayer = 0;
var layers = new Array;
var gadm_selected = new Array(); //array of cartodb_id's of selected polygons from gadm
var wdpa_selected = new Array(); 

  function getPolygonsSearch(val, selected_array, column) {
    var sql = new cartodb.SQL({user: user});
    var q = "select * from " + table + " where "+column+" = '"+val+"'";
    console.log(q);
    sql.getBounds(q).done(function(bounds){
      console.log(bounds);
      var google_bounds = new google.maps.LatLngBounds();
      google_bounds.extend(new google.maps.LatLng(bounds[0][0], bounds[0][1]));
      google_bounds.extend(new google.maps.LatLng(bounds[1][0], bounds[1][1]));
      map.fitBounds(google_bounds);
    });
    sql.execute("select cartodb_id from " + table + " where "+column+" = '"+val+"'").done(function(response) {
      var s;
      for (i in response.rows) {
        // Add this part to enable deselecting on search
        // s = selected_array.indexOf(response.rows[i].cartodb_id);
        // if (s == -1)
          select(selected_array, response.rows[i].cartodb_id);
      }
      layers[currentLayer][1].setQuery("select * from "+table+" where "+makeQuery(selected_array, 'cartodb_id'));
    });

  }

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
    if(currentLayer == 0)
      getPolygonsSearch(val, wdpa_selected, 'name');
    if (currentLayer == 1)
      getPolygonsSearch(val, gadm_selected, 'name_0');
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
   
  function makeQuery(array, column) {
    var qString = "";

    if (array.length == 0)
      return "false";
    
    for (i in array) {
      if (qString == "")
        qString = column+" = "+array[i];
      else
        qString += " or "+column+" = "+array[i];
    }
    return qString;
  }

  function select(array, elt) {
    var s = array.indexOf(elt);
    if (s == -1)
      array.push(elt);
    else
      array.splice(s, 1);
    return array;
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
    
    
    // cartodb.createLayer(map, {
    //   type: 'cartodb',
    //   options: {
    //     table_name:'wdpa2010',
    //     user_name:'mol',
    //     query:'select * from wdpa2010',
    //     tile_style:'#wdpa2010{polygon-fill:#FF6600;line-color:#FFFFFF;line-width:1;polygon-opacity:1;line-opacity:1;line-clip:false;polygon-clip:false;}'
    //   }})
    // .addTo(map,0)
    // .on('done', function(layer) {
    //   layers[0] = layer;
    //   layer.setInteractivity("cartodb_id,name");
    //   layer.setInteraction(true);
    //   layer.on('featureClick', function(e, pos, latlng, data) {
    //     console.log('this is your data' + data.cartodb_id);
    //     storePolygon(data.cartodb_id);
    //   });
    // })

    layers[0] = new Array();
    cartodb.createLayer(map, {
      type: 'cartodb',
      options: {
        table_name:'wdpa2010',
        user_name:'mol',
        tile_style:'#wdpa2010{polygon-fill:#FFFFFF;line-color:#000000;line-width:1;polygon-opacity:1;line-opacity:1;line-clip:false;polygon-clip:false;}'
      }}).addTo(map,0)
      .on('done', function(layer) {
        layers[0][0] = layer;
        layer.setInteractivity("cartodb_id, name");
        layer.setInteraction(true);
        layer.on('featureClick', function(e, pos, latlng, data) {
          console.log(data.cartodb_id);
          wdpa_selected = select(wdpa_selected, data.cartodb_id);
          layers[0][1].setQuery('select * from wdpa2010 where '+makeQuery(wdpa_selected, 'cartodb_id'));
        });
        layer.on('featureOver', function(e, pos, latlng, data) {
          $hover_window.html(data.name);
          $hover_window.show();
        });
        layer.on('featureOut', function(e, pos, latlng, data) {
          $hover_window.hide();
        })
      });  
    cartodb.createLayer(map, {
      type: 'cartodb',
      options: {
        table_name:'wdpa2010',
        user_name:'mol',
        query: 'select * from wdpa2010 where 1=0', //nothing
        tile_style:'#wdpa2010{polygon-fill:#FF6600;line-color:#000000;line-width:1;polygon-opacity:0.5;line-opacity:1;line-clip:false;polygon-clip:false;}'
      }}).addTo(map,2)
      .on('done', function(layer) {
        layers[0][1] = layer;
        layer.setInteractivity("cartodb_id");
        layer.setInteraction(true);
        layer.on('featureClick', function(e, pos, latlng, data) {
          console.log(data.cartodb_id);
          gadm_selected = select(gadm_selected, data.cartodb_id);
          layers[0][1].setQuery('select * from wdpa2010 where '+makeQuery(gadm_selected, 'cartodb_id'));
        });
      }); 


    layers[1] = new Array();
    cartodb.createLayer(map, {
      type: 'cartodb',
      options: {
        table_name:'gadm2',
        user_name:'mol',
        tile_style:'#gadm2{polygon-fill:#FFFFFF;line-color:#000000;line-width:1;polygon-opacity:1;line-opacity:1;line-clip:false;polygon-clip:false;}'
      }}).addTo(map,1)
      .on('done', function(layer) {
        layers[1][0] = layer;
        layer.setInteractivity("cartodb_id, name_0, name_1, name_2, name_3, name_4, name_5");
        layer.setInteraction(true);
        layer.on('featureClick', function(e, pos, latlng, data) {
          console.log(data.cartodb_id);
          gadm_selected = select(gadm_selected, data.cartodb_id);
          layers[1][1].setQuery('select * from gadm2 where '+makeQuery(gadm_selected, 'cartodb_id'));
        });
        layer.on('featureOver', function(e, pos, latlng, data) {
          $hover_window.html(data.name_0);
          $hover_window.show();
        });
        layer.on('featureOut', function(e, pos, latlng, data) {
          $hover_window.hide();
        })
      }); 
    cartodb.createLayer(map, {
      type: 'cartodb',
      options: {
        table_name:'gadm2',
        user_name:'mol',
        query: 'select * from gadm2 where 1=0', //nothing
        tile_style:'#gadm2{polygon-fill:#FF6600;line-color:#000000;line-width:1;polygon-opacity:0.5;line-opacity:1;line-clip:false;polygon-clip:false;}'
      }}).addTo(map,3)
      .on('done', function(layer) {
        layers[1][1] = layer;
        layer.setInteractivity("cartodb_id");
        layer.setInteraction(true);
        layer.on('featureClick', function(e, pos, latlng, data) {
          console.log(data.cartodb_id);
          gadm_selected = select(gadm_selected, data.cartodb_id);
          layers[1][1].setQuery('select * from gadm2 where '+makeQuery(gadm_selected, 'cartodb_id'));
        });

        // When all maps are loaded, initialize to wdpa2010
        $('.toggle-left').css('background-color',"#777");
        $('.toggle-middle').css('background-color', 'white');
        layers[0][0].show();
        layers[1][0].hide();
        layers[1][1].setInteraction(true);
        layers[0][1].setInteraction(false);
        table = 'wdpa2010';
        currentLayer = 0;
      }); 


    

    $('.searchbox .submit').click(function(event) {
       search($('.searchbox .text').val());
    });
    $(document).ready(function (){    
      $('.toggle-left').click(function (){
       $(this).css('background-color',"#777");
       $('.toggle-middle').css('background-color', 'white');
       layers[0][0].show();
       layers[1][0].hide();
       layers[1][1].setInteraction(true);
       layers[0][1].setInteraction(false);
       table = 'wdpa2010';
       currentLayer = 0;
      });
    });
    $(document).ready(function (){
      $('.toggle-middle').click(function (){
       $(this).css('background-color',"#777");
       $('.toggle-left').css('background-color', 'white');
       layers[0][0].hide();
       layers[1][0].show();
       layers[0][1].setInteraction(true);
       layers[1][1].setInteraction(false);

       table = 'gadm2';
       currentLayer = 1;
      });
    });    
  };

  window.onload = main; 