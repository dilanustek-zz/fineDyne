var allData;
var groupname = "marker-select";
var xf;

var priceDimension;
var restaurantNamesDimension;
var starsDimension;
var categoriesDimension;

var priceBar;
var markerChart;
var starBar;
var categoriesBar;
var dataTable;

var count;

var pinned = [];

var map;
var restaurantsGroup;

var randomImageArray = [
	"https://i.ytimg.com/vi/NCO36DCleZ8/hqdefault.jpg",
	"http://i.telegraph.co.uk/multimedia/archive/02999/restaurant_2999753b.jpg",
	"https://images.pexels.com/photos/2232/vegetables-italian-pizza-restaurant.jpg?h=350&auto=compress&cs=tinysrgb",
	"http://willtravelforfood.com/wp-content/uploads/2016/10/atma-indian-restaurant-montreal.jpg",
	"https://media-cdn.tripadvisor.com/media/photo-s/0a/81/96/03/steak-and-lobster.jpg",
	"http://img.aws.livestrongcdn.com/ls-slideshow-main-image/ds-photo/getty/article/94/18/637233918.jpg",
	"http://s3.amazonaws.com/btoimage/prism-thumbnails/articles/bestofrankedlistings/hong-shing-chinese-restaurant-toronto-2e76110d.jpg-resize_then_crop-_frame_bg_color_FFF-h_480-gravity_center-q_70-preserve_ratio_true-w_720_.jpg",
	"http://www.avenuecalgary.com/images/cache/cache_e/cache_1/cache_b/BEST_Restaurant_pics9-92b13b1e.jpeg?ver=1488381227&aspectratio=1.6666666666667",
	"http://www.palkirestaurant.com/wp-content/uploads/2012/06/6kb80VApHMcQij-640m.jpg"
];


function zoomCluster(zoom){
	if (zoom < 18)
	return 40;
	else if (zoom < 25)
	return 0;
}
function resetCharts() {
	markerChart.filterAll();
	starBar.filterAll();
	priceBar.filterAll();
	categoriesBar.filterAll();

	dc.redrawAll(groupname);
}

function pinRestaurant (business_id, name, price_range, stars, cuisine) {
	// put in set of pinned elements so you don't pin it again
	if (pinned[business_id] == true) {
		unpinRestaurant(business_id);
		return;
	}
	else pinned[business_id] = true;
	console.log(pinned)

	var randomImage = randomImageArray[Math.floor(Math.random() * randomImageArray.length)];

	var starsSvg = "";
	for(i=1; i<stars; i++){
		starsSvg += "<img src=\" css\\images\\Red_star.svg.png \" width='10px'>";
	}

	//final star is full
	if (stars % 1 === 0) {
		starsSvg += "<img src=\" css\\images\\Red_star.svg.png \" width='10px'>";
	} else {
		// final star is a half star
		starsSvg += "<img src=\" css\\images\\redHalfStar.svg \" width='10px'>";
	}


	var dollarSigns = "";
	// price range
	for(i=0; i<price_range ; i++){
		dollarSigns += "<img src=\" css\\images\\dollar.png \" width='10px'>";
	}

	var itemHtml = "<div class=\"inRow\" id=\"" + business_id + "\" style=\"width:600px; height:80px; border:1px solid #b3b3b3; margin-bottom:8px;\">"
	+ "<img src=\"" + randomImage + "\" width=\"70px\" style=\"margin-left:10px; margin-right:10px;\">"
	+ "<div class=\"inColumn\" style=\"position:absolute; margin-left:90px; margin-top:5px; \" "
	+ "<p><b>" + name + "</b></p>"
	+ "<p>" + starsSvg + " " + dollarSigns + "  " + cuisine + "</p>"
	+ "<p> <b>Review:</b> 'I was there once and it was lovely! Tasty food and great atmosphere!' </p>"
	+ "</div>"
	+ "<div style=\"margin-left:auto;\"  onmouseover=\"this.style.background='#decdcd';\" "
	+ "onmouseout=\"this.style.background='white';\"  onclick=\" unpinRestaurant(\'" + business_id + "\'); \"  \"> <img src=\"css\\images\\close.svg\" >" + "</div>"
	+ "</div>";

	// there was nothing before so replace old html
	if (Object.keys(pinned).length == 1) {
		$("#pinnedItems").html( itemHtml );
	} else { // add to the top of the pinned list
		$("#pinnedItems").prepend( itemHtml );
	}

}

function unpinRestaurant (business_id) {
	//$("#pinnedItems").remove("#" + business_id );
	$("#" + business_id).remove();
	delete pinned[business_id];
	console.log(pinned);

	if (Object.keys(pinned).length == 0) {
		$("#pinnedItems").html( "	<p> Pin items on the map and from the list on the right to keep track of them here!</p>" );
	}

}


d3.csv("data\\all_cuisine_dupes_removed.csv", function(data) {
	allData = data;
	drawMarkerSelect(allData);
});

function drawMarkerSelect(data) {
	xf = crossfilter(data);

	// Prices bar graph
	priceDimension = xf.dimension(function(d) {
		return d.price_range;
	});

	var priceGroup = priceDimension.group().reduceCount();

	priceBar = dc.barChart(".priceBar",groupname)
	.dimension(priceDimension)
	.group(priceGroup)
	.width(300)
	.height(150)
	.renderLabel(false)
	.x(d3.scale.ordinal())
	.xUnits(dc.units.ordinal)
	.brushOn(true)
	.on('renderlet.barclicker', function(chart, filter){
		updatePagination();
		chart.selectAll('rect.bar').on('click.custom', function(d) {
		});
	})
	.ordinalColors(['#4268f4'])
	.yAxisLabel("# of Restaurants")
	.elasticY(true);


	priceBar.xAxis().tickFormat(function (v) {
		var resultStr = '';

		for(i=0; i<v; i++){
			resultStr +='$';
		}
		return resultStr;
	});

	priceBar.yAxis().ticks(4);


	// Map
	restaurantNamesDimension  = xf.dimension(function(d) {
		return d.name;
	});

	restaurantsGroup = restaurantNamesDimension.group().reduce(
		function(p, v) { // add
			p.name = v.name;
			p.price_range = v.price_range;
			p.stars = v.stars;
			p.latitude = v.latitude;
			p.longitude = v.longitude;
			p.business_id = v.business_id;
			p.cuisine = v.cuisine;
			++p.count;
			return p;
		},
		function(p, v) { // remove
			--p.count;
			return p;
		},
		function() { // init
			return {count: 0};
		}
	);

	markerChart = dc_leaflet.markerChart(".map", groupname)
	.dimension(restaurantNamesDimension)
	.group(restaurantsGroup)
	.width(500)
	.height(400)
	.center([43.733372, -79.354782])
	.zoom(11)
	.cluster(true)
	.clusterOptions({
		disableClusteringAtZoom: 16,
		spiderfyOnMaxZoom: false
	})
	.mapOptions({
		riseOnHover: true
	})
	.valueAccessor(function(kv) {
		return kv.value.count;
	})
	.locationAccessor(function(kv) {
		return [kv.value.latitude,kv.value.longitude]	;
	})
	.filterByArea(true)
	.popup(function(kv,marker) {
		var returnStr = "";

		// Name
		returnStr = "<b>" + kv.value.name + " </b> <br> <br>";

		// Quality
		for(i=1; i<kv.value.stars; i++){
			returnStr += "<img src=\" css\\images\\Red_star.svg.png \" width='10px'>";
		}

		//final star is full
		if (kv.value.stars % 1 === 0) {
			returnStr += "<img src=\" css\\images\\Red_star.svg.png \" width='10px'>";
		} else {
			// final star is a half star
			returnStr += "<img src=\" css\\images\\redHalfStar.svg \" width='10px'>";
		}

		returnStr +="<br>";

		// price range
		for(i=0; i<kv.value.price_range ; i++){
			returnStr += "<img src=\" css\\images\\dollar.png \" width='10px'>";
		}

		// cuisine
		returnStr += " <br>" +  kv.value.cuisine ;

		// review
		returnStr += "<p> Review: \"I was there once and it was lovely! Tasty food and great atmosphere!\"</p>"



		// pin button
		returnStr += "<button type=\"btn\" onclick=\"pinRestaurant(\'"
		+ kv.value.business_id + "\',\'" + kv.value.name + "\',"
		+ kv.value.price_range + "," + kv.value.stars + ",\'"
		+ kv.value.cuisine + "\')\" > "
		+ "Pin / Unpin</button>";

		/*if (pinned[kv.value.business_id] == true) {
		returnStr += "Unpin</button>";
	} else {
	returnStr += "Pin</button>";
}*/

return returnStr;
});


// Stars bar graph
starsDimension = xf.dimension(function(d) {
	return d.stars;
});
var starsGroup = starsDimension.group().reduceCount();

starBar = dc.barChart(".starBar",groupname)
.dimension(starsDimension)
.group(starsGroup)
.width(300)
.height(150)
.renderLabel(false)
.x(d3.scale.ordinal())
.xUnits(dc.units.ordinal)
.brushOn(true)
.on('renderlet.barclicker', function(chart, filter){
	updatePagination();
	chart.selectAll('rect.bar').on('click.custom', function(d) {
	});
})
.ordinalColors(['#f20707'])
.yAxisLabel("# of Restaurants", 30)
.elasticY(true);

starBar.yAxis().ticks(4);


// Categories bar graph
categoriesDimension = xf.dimension(function(d) {
	return d.cuisine;
});
var categoriesGroup = categoriesDimension.group().reduceCount();

categoriesBar = dc.rowChart(".categoriesBar",groupname)
.dimension(categoriesDimension)
.group(categoriesGroup)
.width(300)
.height(700)
.renderLabel(true)
.elasticX(true)
.colors(d3.scale.category20b());

categoriesBar.xAxis().ticks(4);


var addXLabel = function(chartToUpdate, displayText) {
  var textSelection = chartToUpdate.svg()
			.append("text")
			  .attr("class", "x-axis-label")
			  .attr("text-anchor", "middle")
			  .attr("x", chartToUpdate.width() / 2)
			  .attr("y", chartToUpdate.height() - 10)
			  .text(displayText);
  var textDims = textSelection.node().getBBox();
  var chartMargins = chartToUpdate.margins();

  // Dynamically adjust positioning after reading text dimension from DOM
  textSelection
	  .attr("x", chartMargins.left + (chartToUpdate.width()
		- chartMargins.left - chartMargins.right) / 2)
	  .attr("y", chartToUpdate.height() - Math.ceil(textDims.height) / 6);
};

categoriesBar.on("postRender", function(chart) {
   addXLabel(chart, "# of Restaurants");
 });

 categoriesBar.on("renderlet", function(chart) {
	 updatePagination();
 });


// Data table
var dataDim = restaurantNamesDimension;

datatable = dc.dataTable(".data-table", groupname)
.dimension(dataDim)
.group(function(d) { return "";})  //TODO: get rid of this somehow.
.on('renderlet', function(chart, filter){
	$(".dc-table-row").click(function(e){
		$(this).find('.pin')[0].onclick();
		$(this).find('.pin').toggleClass("pinned");
	});
	// d3.select('rowChart').on('click', function(d){
	// 	pinned.push(d);
	// })
})
.columns([
	function(d){
		// if(pinned[d]) then add class pinned to this image
		return " <img class=\"pin\" src=\"css\\images\\pin.png\" width=\"20px\" onclick=\"pinRestaurant(\'"
		+ d.business_id + "\',\'" + d.name + "\',"
		+ d.price_range + "," + d.stars + ",\'"
		+ d.cuisine + "\'); \"  > "
	},
	function(d){
		return d.name
	},
	function (d) {
		var returnStr = "";
		for(i=1; i<d.stars ; i++){
			returnStr += "<img src=\" css\\images\\Red_star.svg.png \" width='10px'>";
		}

		//final star is full
		if (d.stars % 1 === 0) {
			returnStr += "<img src=\" css\\images\\Red_star.svg.png \" width='10px'>";
			return returnStr;
		}

		// final star is a half star
		returnStr += "<img src=\" css\\images\\redHalfStar.svg \" width='10px'>";
		return returnStr;
	},
	function (d) {
		var returnStr = "";
		for(i=0; i<d.price_range ; i++){
			returnStr += "<img src=\" css\\images\\dollar.png \" width='10px'>";
		}
		return returnStr;
	},
	function(d){return d.cuisine}
])
.size(Infinity)
.order(d3.ascending);

updatePagination();

var order = d3.ascending;

// Sorting when a datatable label is clicked
$('.data-table').on('click', '.data-table-head', function() {
	var column = $(this).attr("data-col");
	// keep these! maybe.
	//dataDim.dispose();
	//dataDim = xf.dimension(function(d) {return d[column];});
	//datatable.dimension(dataDim);

	datatable.sortBy(function(d) {
		if(column === "stars" || column === "price_range")
			return parseFloat(d[column]);
		else
			return d[column];
	})
	.order(order);
	datatable.redraw();

	if (order === d3.ascending) {
		order = d3.descending;
	} else {
		order = d3.ascending;
	}
});



dc.renderAll(groupname);


 map = markerChart.map();

  var greenIcon = L.icon({
  iconUrl: 'http://icon-park.com/imagefiles/location_pin_sphere_red.png',

  iconSize:     [20, 45], // size of the icon
  iconAnchor:   [22, 94], // point of the icon which will correspond to marker's location
  shadowAnchor: [4, 62],  // the same for the shadow
  popupAnchor:  [-3, -76] // point from which the popup should open relative to the iconAnchor
  });

  var pinMarker = L.marker([43.7649093, -79.2591327], {icon: greenIcon}).addTo(map);


  setTimeout(function(){

	//   map.eachLayer(function (layer) {
	//       allMarkers.push(layer);
	// 	 // console.log(allMarkers.size());
	//   });

  //var group = new L.featureGroup(restaurantNamesDimension.top(Number.POSITIVE_INFINITY));
 //var bounds = group.getBounds();
    //map.fitBounds(bounds);
  // var bounds = L.latLngBounds(restaurantNamesDimension.top(Number.POSITIVE_INFINITY));
  // map.fitBounds(bounds);
  }, 2000);
  //var group = new L.featureGroup([marker1, marker2, marker3]);
  //map.fitBounds(group.getBounds());
  // var bounds = L.latLngBounds(restaurantsGroup);
  // map.fitBounds(bounds);


}//drawMarkerSelect



// Pagination for the list view
  var ofs = 1, pag = 10;
  function displayPagination() {
      d3.select('#begin')
          .text(ofs);
      d3.select('#end')
          .text(function(){
			  var allNum = restaurantNamesDimension.top(Number.POSITIVE_INFINITY);
			  if(allNum-ofs < pag)
			  return  (allNum-ofs);
			  else return (ofs+pag-1);
		  });
      d3.select('#last')
          .attr('disabled', ofs-pag<0 ? 'true' : null);
      d3.select('#next')
          .attr('disabled', ofs+pag>=restaurantNamesDimension.top(Number.POSITIVE_INFINITY).length ? 'true' : null);
      d3.select('#size').text(restaurantNamesDimension.top(Number.POSITIVE_INFINITY).length);
  }
  function updatePagination() {
      datatable.beginSlice(ofs);
      datatable.endSlice(ofs+pag);
      displayPagination();
  }
  function next() {
      ofs += pag;
      updatePagination();
      datatable.redraw();
  }
  function last() {
      ofs -= pag;
      updatePagination();
      datatable.redraw();
  }
