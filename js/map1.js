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
var gadm_selected = new Array(); 
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
      for (i in response.rows) {
          select(selected_array, response.rows[i].cartodb_id, val); 
      } 
      layers[currentLayer][1].setQuery("select * from "+table+" where "+makeQuery(selected_array, 'cartodb_id'));
    });

  }

  var storePolygon = function(cartodb_id, table_name, shape_name, new_table) {
    //inserts row with cartodb_id into a table
    var q = "cartodb_id="+cartodb_id+"&table_name="+table_name+"&shape_name="+shape_name+"&new_table="+new_table;
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

  function search(val) {
    if(currentLayer == 0)
      getPolygonsSearch(val, wdpa_selected, 'name');
    if (currentLayer == 1) {
      getPolygonsSearch(val, gadm_selected, 'name_0');
      getPolygonsSearch(val, gadm_selected, 'name_1');
      getPolygonsSearch(val, gadm_selected, 'name_2');
      getPolygonsSearch(val, gadm_selected, 'name_3');
      getPolygonsSearch(val, gadm_selected, 'name_4');
      getPolygonsSearch(val, gadm_selected, 'name_5');
    }
  }  
   
  function makeQuery(array, column) {
    var qString = "";

    if (array.length == 0)
      return "false";
    
    for (i in array) {
      if (qString == "")
        qString = column+" = "+array[i][0];
      else
        qString += " or "+column+" = "+array[i][0];
    }
    return qString;
  }

  function select(array, elt, column) {
    var s = -1;
    var pair = [elt, column];

    //check if item is already selected
    for (i in array) {
      if (array[i][0] == elt)
        s = i;
    }
    
    if (s == -1)  //select if not already selected
      array.push(pair);
    else
      array.splice(s, 1); //otherwise, deselect
    return array;
  }

  function getName(data) {    //for gadm data, gets the most specific name
    if (data.name_5 != null)
      return data.name_5;
    if (data.name_4 != null)
      return data.name_4;
    if (data.name_3 != null)
      return data.name_3;
    if (data.name_2 != null)
      return data.name_2;
    if (data.name_1 != null)
      return data.name_1;
    if (data.name_0 != null)
      return data.name_0;
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

    layers[0] = new Array();
    // layers[0][:] is wdpa2010, layers[1][:] is gadm
    // Each dataset has 2 layers: 
    // layers[:][0] displays all polygons in the dataset, is interactive and shown when dataset is on
    // layers[:][1] displays all polygons that have been selected in the dataset, is always shown
    //    Is only interactive when the Layer 0 is hidden (dataset is off) to allow for deselection
    //    Clicking in Layer 0 will add the polygon to Layer 1
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
          wdpa_selected = select(wdpa_selected, data.cartodb_id, data.name);
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
        query: 'select * from wdpa2010 where 1=0', //start with nothing selected
        tile_style:'#wdpa2010{polygon-fill:#FF6600;line-color:#000000;line-width:1;polygon-opacity:0.5;line-opacity:1;line-clip:false;polygon-clip:false;}'
      }}).addTo(map,2)
      .on('done', function(layer) {
        layers[0][1] = layer;
        layer.setInteractivity("cartodb_id, name");
        layer.setInteraction(true);
        layer.on('featureClick', function(e, pos, latlng, data) {
          console.log(data.cartodb_id);
          gadm_selected = select(wdpa_selected, data.cartodb_id, data.name);
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
          var name = getName(data);
          console.log(data.cartodb_id);
          gadm_selected = select(gadm_selected, data.cartodb_id, name); 
          layers[1][1].setQuery('select * from gadm2 where '+makeQuery(gadm_selected, 'cartodb_id'));
        });
        layer.on('featureOver', function(e, pos, latlng, data) {
          var name = getName(data);
          $hover_window.html(name);
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
        query: 'select * from gadm2 where 1=0', //start with nothing selected
        tile_style:'#gadm2{polygon-fill:#FF6600;line-color:#000000;line-width:1;polygon-opacity:0.5;line-opacity:1;line-clip:false;polygon-clip:false;}'
      }}).addTo(map,3)
      .on('done', function(layer) {
        layers[1][1] = layer;
        layer.setInteractivity("cartodb_id, name_0");
        layer.setInteraction(true);
        layer.on('featureClick', function(e, pos, latlng, data) {
          console.log(data.cartodb_id);
          gadm_selected = select(gadm_selected, data.cartodb_id, data.name_0); //should only deselect
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
    $('#saveButton').click(function(event) {  //create new table and save selected polys
      var new_table = window.prompt("Please enter table name:", "table");
      var table_name = new_table+"_temp";
      var q = "table_name="+table_name;
      if (new_table != null) {
        $.ajax({
          url: "/save/create",
          //crossDomain: true,
          type: 'POST',
          dataType: 'text',
          data: q,
          success: function() {
            for (i in gadm_selected) {
              storePolygon(gadm_selected[i][0], 'gadm2', gadm_selected[i][1], table_name);
            }
            for (j in wdpa_selected) {
              storePolygon(wdpa_selected[j][0], 'wdpa2010', wdpa_selected[j][1], table_name);
            }
            alert("Saved with table name "+table_name);
          },
          error: function() { }
        }); 
      }       
    });
  };
  window.onload = main; 

  //Things to fix:
  //What happens when you create an already existing table?
  //Should the search function deselect its results if already selected?