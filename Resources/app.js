/*jslint maxerr:1000 */

//Create our application namespace
var my = {views:{}};
//Import our module
my.menu = require('./SlideOutMenu/MASlidingMenu');

my.sampleView = require('sample_views');
my.views = {
	home : my.sampleView.placeholderView({title:'Home',backgroundColor:'blue'}),
	inbox : my.sampleView.placeholderView({title:'Home',backgroundColor:'green'}),
	sales : my.sampleView.placeholderView({title:'Home',backgroundColor:'yellow'}),
	customers : my.sampleView.placeholderView({title:'Home',backgroundColor:'blue'}),
	about : my.sampleView.placeholderView({title:'About',backgroundColor:'purple'})	
};

// Each row with a view property when clicked will change to that view (any view works except tabgroups and windows)
// If the row does not have a view property, but the switch event still fires
var menuData = [
	{ title:'Home', hasDetail:true, view: my.views.home },
	{ title:'Inbox', hasDetail:true, view: my.views.inbox },	
	{ title:'Sales', hasDetail:true, view: my.views.sales },
	{ title:'Customers', hasDetail:true, view: my.views.customers },
	{ title:'About', hasDetail:true, view: my.views.about },
	{ title:'Logout' }
];

my.menu.addMenuItems(menuData).open();

// event fired when user selects a view from the nav
my.menu.addEventListener('buttonclick', function(e) {
	if (e.index === 2) {
		alert('You clicked on Logout');
	}
});

// event fired when user selects a view from the nav
my.menu.addEventListener('switch', function(e) {
	Ti.API.info('menuRow = ' + JSON.stringify(e.menuRow));	
	Ti.API.info('index = ' + e.index);		
	Ti.API.info('view = ' + JSON.stringify(e.view));
});

// event fired while user is dragging the view to expose the menu
my.menu.addEventListener('sliding', function(e) {
	Ti.API.info('distance = ' + e.distance);
});

Ti.App.addEventListener('app:open_menu',function(e){
	Ti.API.info('App Listener called to open menu');
	my.menu.expose();	
});

Ti.App.addEventListener('app:toggle_menu',function(e){
	Ti.API.info('App Listener called to toggle menu');	
	my.menu.toggle();	
});

Ti.App.addEventListener('app:close_menu',function(e){
	Ti.API.info('App Listener called to close menu');		
	my.menu.close();	
});
