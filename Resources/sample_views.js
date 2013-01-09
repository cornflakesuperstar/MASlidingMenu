/*jslint maxerr:1000 */
var menu = require('./SlideOutMenu/MASlidingMenu');
var _isAndroid = Ti.Platform.osname === 'android';

function createiOSToolbar(title){
	var flexSpace = Ti.UI.createButton({
		systemButton:Ti.UI.iPhone.SystemButton.FLEXIBLE_SPACE
	});

	var title = Ti.UI.createLabel({
		text:title, color:'#fff',
		shadowColor:'#666',
		shadowOffset:{x:0.0, y:1.0},
		font:{
			fontSize:24,
			fontWeight:'bold'
		}
	});

	var toMenu = Ti.UI.createButton({
	  	style:Ti.UI.iPhone.SystemButtonStyle.DONE,
		image:'/images/menu.png',
		width:32,
		height:32,
	});

	var bar = Ti.UI.createToolbar({
		items:[toMenu, flexSpace, title, flexSpace],
		top:0, barColor:'#000', height:44
	});

	toMenu.addEventListener('click', function(){
		Ti.App.fireEvent('app:toggle_menu');
	});
	
	return bar;	
};

function createAndroidToolbar(title){

	var toMenu = Ti.UI.createView({
		backgroundImage:'/images/menu.png',
		width:32,height:32,left:3
	});

	var bar = Ti.UI.createView({
		layout:'horizontal',
		top:0, backgroundColor:'#000', height:44
	});
	bar.add(toMenu);
	
	toMenu.addEventListener('click', function(){
		Ti.App.fireEvent('app:toggle_menu');
	});
	
	var title = Ti.UI.createLabel({
		text:title, color:'#fff',
		left:15,
		shadowColor:'#666',
		shadowOffset:{x:0.0, y:1.0},
		font:{
			fontSize:24,
			fontWeight:'bold'
		}
	});
	bar.add(title);	
	
	return bar;	
};

exports.placeholderView = function(args){
	var view = new menu.createMenuView({
		backgroundColor:args.backgroundColor
	});
    
    view.add(Ti.UI.createLabel({
    	text: args.title + ' View',
    	color:'#000',
    	height:24,
    	width:100,
    	textAlign:'center', touchEnabled:false
    }));
		
	view.add(((_isAndroid)? createAndroidToolbar(args.title) :
			  createiOSToolbar(args.title)));
	
	view.addEventListener('dblclick',function(e){
		Ti.App.fireEvent('app:close_menu');							
	});
		
	return view;
};
