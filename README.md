Polygon-selector
================

This polygon selector tool allows you to select a polygon from WDPA or GADM cartodb tables and insert them into a new table in cartodb. You can toggle between the two sets (WDPA and GADM) and you can select as many polygons as you want from both of the data sets. A polygon that is selected will turn orange, and you can deselct a polygon by clicking on it again. When you press save, the app will ask you to give a name for the table that you will put these polygons into. Then, it will create this table in cartodb with the name of format 'tableName_temp'. The table will be 'invisible' so you have to copy the polygons into a new table again using a query on the cartodb website.

How it works:
============
Using the google maps and cartodb javscript api, the app creates 4 layers upon initialization. Each data set (WDPA and GADM) is associated with 2 layers. One layer displays all of the polygons in the dataset and handles the interaction (displays name on hover, selection and deselection) when the toggle button is set to that dataset. The second layer is visible all the time and displays all the polygons from the dataset that are currently selected (initialized with no polygons displayed) and is only interactive (handles deselection) when the toggle button is set to the other dataset. Each time a polygon is selected or deselected, the relevant layer is updated and redrawn. 

The app keeps track of the amount of selected polygons in each data set in 2 arrays, 1 for each data set. The first way to selector deselect a polygon is by clicking on it. The second way is by searching its name in the search bar (you can't just press enter but have to click on the search icon). This will move the map to the polygon and select the polygon. This also works with multiple polygons for the GADM data set because it contains different levels of names. For example, you could search 'Indonesia' and all of the polygons that are part of Indonesia will be selected. Similarly, you can deselect the polygons in Indonesia by using the search bar the same way. You can only search for the names of the polygons in the data set that the toggle button is set to, and there is no autocomplete functionality yet.

The javascript in use is map1.js and the python back-end is in insert_stuff.py.
