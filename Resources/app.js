/*jslint maxerr:1000 */

//Create our application namespace
var my = {menu:{},views:{}};
//Import our module
my.slidingMenu = require('MASlidingMenu');

my.sampleView = require('sample_views');
my.views = {
	home : my.sampleView.HomeView(),
	about : my.sampleView.AboutView()
};

// Each row with a view property when clicked will change to that view (any view works except tabgroups and windows)
// If the row does not have a view property, but the switch event still fires
var data = [
	{ title:'Home', hasDetail:true, view: my.views.home },
	{ title:'About', hasDetail:true, view: my.views.about },
	{ title:'Button' }
];

my.slidingMenu.addMenuItems(data).open();

// event fired when user selects a view from the nav
my.slidingMenu.addEventListener('buttonclick', function(e) {
	if (e.index === 2) {
		alert('You clicked on Button');
	}
});

// event fired when user selects a view from the nav
my.slidingMenu.addEventListener('switch', function(e) {
	// alert(e.menuRow);
	// alert(e.index);
	//alert(e.view); // This is the new view your switching to
});

// event fired while user is dragging the view to expose the menu
my.slidingMenu.addEventListener('sliding', function(e) {
	//alert(e.distance);
});

Ti.App.addEventListener('app:open_menu',function(e){
	my.slidingMenu.expose();	
});

Ti.App.addEventListener('app:toggle_menu',function(e){
	my.slidingMenu.toggle();	
});

Ti.App.addEventListener('app:close_menu',function(e){
	my.slidingMenu.close();	
});
