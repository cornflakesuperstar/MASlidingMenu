/*jslint maxerr:1000 */
//Get the app root to avoid path issues 
var _appRoot = Ti.Filesystem.resourcesDirectory;

var _objects = {
	leftView : null,
	menuWin : Ti.UI.createWindow({exitOnClose:false}),
	activeView : null, //the current view... start with 0
    views : [],
    events : {}, //holder for our custom events	,
    // Our Identity Matrix for all animations using transform
	twoD : Ti.UI.create2DMatrix()	
};

var DEFAULT_CONFIG = {
    draggable : true,
    duration : {
        slide: 200,
        swipe: 150,
        bounce: 100,
        change_out: 120,
        change_in: 300
    }        		
};

var _sessionConfig = DEFAULT_CONFIG;

var _session = {
  initialised: false,
	isAndroid : Ti.Platform.osname === 'android',
	platformWidth : Ti.Platform.displayCaps.platformWidth,
    ledge:null,
    threshold : null,
    half : {
        width: undefined,
        height: undefined
    },
    current : 'view',
    sliding : {
        center: 0,
        offset: 0
    }	
};

function setSizes(){
  // set the size after we know what the size is. this should cover orientation too
  _session.half = {
      width: _objects.menuWin.rect.width / 2,
      height: _objects.menuWin.rect.height / 2
  };
}

if (Ti.Platform.osname == 'ipad') {
  // Re-render layout when orientation changes
  Ti.Gesture.addEventListener('orientationchange', function(e){
    _objects.activeView.left = 0;
    _objects.activeView.width = _session.platformWidth = Ti.Platform.displayCaps.platformWidth;
    setSizes();
  });
} else {
  // Fix orientation on handheld devices
  _objects.menuWin.orientationModes = [Titanium.UI.PORTRAIT];
}

_objects.menuWin.addEventListener('postlayout',function(e){
  setSizes();
});

//Extend an object with the properties from another 
//(thanks Dojo - http://docs.dojocampus.org/dojo/mixin)
function mixin(/*Object*/ target, /*Object*/ source){
	var name, s, i,empty = {};
	for(name in source){
		s = source[name];
		if(!(name in target) || (target[name] !== s && (!(name in empty) || empty[name] !== s))){
			target[name] = s;
		}
	}
	return target; // Object
};


var eventHelpers = {
	viewTouchstart : function(e) {
		Ti.API.debug('touchstart: '+JSON.stringify(e));
	    _session.sliding.offset = e.x - _session.half.width;
	    _session.sliding.center = _objects.activeView.rect.x + _session.half.width;
	},
	viewTouchmove : function(e) {
		Ti.API.debug('touchmove: '+JSON.stringify(e));
		var delta_x;
		
		delta_x = e.x - _session.sliding.offset + _objects.activeView.rect.x;
		delta_x -= _session.half.width;
		
		touchStarted = false;
		
		// //Minimum movement is 30
		if( delta_x > 30 ){
		    touchStarted = true;
		}
		
		if(touchStarted) {
		
		    exports.fireEvent('sliding', {
		        distance: delta_x
		    });
		
		    if ((delta_x > 0 && !_objects.leftView)) {
		        return;
		    }
		    if (Math.abs(delta_x) > _session.ledge) {
		        return;
		    }
		    if (delta_x > 0 && _session.current !== 'left') {
		        _session.current = 'left';
		        internal.onCurrentChanged();
		    } else if (delta_x === 0 && _session.current !== 'view') {
		        _session.current = 'view';
		            internal.onCurrentChanged();
		        }
		
		        _objects.activeView.animate({
		            transform: _objects.twoD.translate(delta_x, 0),
		            duration: 0
		        });
		
		    }
		
		},
		viewTouchend : function(e) {
			Ti.API.debug('touchend: '+JSON.stringify(e));
		    var delta_x;
		
		    delta_x = e.x - _session.sliding.offset + _objects.activeView.rect.x ;
		    delta_x -= _session.half.width;
		
		    if ((delta_x > 0 && !_objects.leftView)) {
		        return;
		    }
		    if (Math.abs(delta_x) > _session.ledge) {
		        return;
		    }
		
		    if(_session.sliding.center - _session.half.width === 0 && delta_x > _session.threshold) {
		        if (delta_x > 0) {
		            delta_x = _session.ledge;
		            _session.current = 'left';
		        } else {
		            delta_x = 0;
		            _session.current = 'view';
		        }
		
		        _objects.activeView.animate({
		            transform: _objects.twoD.translate(260, 0),
		            duration: _sessionConfig.duration.bounce
		        });
		    } else {
		        delta_x = _session.sliding.center - _session.half.width;
		        if (delta_x === 0) {
		            current = 'view';
		        } else if (delta_x > 0) {
		            current = 'left';
		        }
		        _objects.activeView.animate({
		            transform: _objects.twoD.translate(0, 0),
		            duration: _sessionConfig.duration.swipe
		        });
		    }
		    internal.onCurrentChanged();
		},
		viewAndroidend : function(e) {
			Ti.API.debug('androidend: '+JSON.stringify(e));
			
			if (e.left === e.minLeft || e.left === e.maxLeft) {
				// already there
				_session.current = e.left === e.maxLeft ? 'left':'view';
				return;
			}
		
			if(e.left >= _session.threshold){
				// finish showing menu
				_session.current = 'left';
		        _objects.activeView.animate({
		            left: e.source.maxLeft,
		            duration: _sessionConfig.duration.swipe
		        });
			} else {
				// finish hiding menu
				_session.current = 'view';
		        _objects.activeView.animate({
		            left: 0,
		            duration: _sessionConfig.duration.swipe
		        });
			}
		    internal.onCurrentChanged();
		},
		addEvents : function() {
		    if(_objects.activeView.toString() === "[object TiUIiPhoneNavigationGroup]") {
		        _objects.activeView.window.addEventListener('touchstart', eventHelpers.viewTouchstart);
		        _objects.activeView.window.addEventListener('touchmove', eventHelpers.viewTouchmove);
		        _objects.activeView.window.addEventListener('touchend', eventHelpers.viewTouchend);
		        _objects.activeView.window.addEventListener('touchcancel', eventHelpers.viewTouchend);
		    } else if (_session.isAndroid) {
		        _objects.activeView.addEventListener('end', eventHelpers.viewAndroidend);
		    } else {
		        _objects.activeView.addEventListener('touchstart', eventHelpers.viewTouchstart);
		        _objects.activeView.addEventListener('touchmove', eventHelpers.viewTouchmove);
		        _objects.activeView.addEventListener('touchend', eventHelpers.viewTouchend);
		        _objects.activeView.addEventListener('touchcancel', eventHelpers.viewTouchend);
		    }
		},
		removeEvents : function() {
		    if(_objects.activeView.toString() === "[object TiUIiPhoneNavigationGroup]") {
		        _objects.activeView.window.removeEventListener('touchstart', eventHelpers.viewTouchstart);
		        _objects.activeView.window.removeEventListener('touchmove', eventHelpers.viewTouchmove);
		        _objects.activeView.window.removeEventListener('touchend', eventHelpers.viewTouchend);
		    } else if (_session.isAndroid) {
		        _objects.activeView.removeEventListener('end', eventHelpers.viewAndroidend);
		    } else {
		        _objects.activeView.removeEventListener('touchstart', eventHelpers.viewTouchstart);
		        _objects.activeView.removeEventListener('touchmove', eventHelpers.viewTouchmove);
		        _objects.activeView.removeEventListener('touchend', eventHelpers.viewTouchend);
		    }
		}						
};

var internal = {
	onCurrentChanged : function() {
	   //_sessionConfig.shadow.shadowOffset.x = -4;
	   _objects.leftView.zIndex = -1;
	},
	slideView : function(position) {
	    var delta_xs;
	    delta_xs = {
	        left: _session.ledge,
	        view: 0
	    };
	    if (_session.isAndroid) {
	    	// just slide the view on Android
	        _objects.activeView.animate({
	            left: delta_xs[position],
	            duration: _sessionConfig.duration.slide
	        });
	    } else {
	        _objects.activeView.animate({
	            center: {
	                x: delta_xs[position] + _session.half.width,
	                y: _session.half.height
	            },
	            duration: _sessionConfig.duration.slide
	        });
	    }
	    _session.current = position;
	    internal.onCurrentChanged();
	},	
	changeView : function(newView) {
		if(_objects.activeView === newView){
			exports.hide();
			return;
		}		
		if (_session.isAndroid) {
	        if (_objects.activeView !== newView) {
	            newView.hide();
	            newView.left = _session.platformWidth;
	            newView.width = _session.platformWidth;
	            newView.height = Ti.UI.FILL;
		
		        _objects.activeView.animate({
		            left:_session.platformWidth,
		            duration: _sessionConfig.duration.change_out
		        }, function() {
		
		            if(_sessionConfig.draggable) {
		                eventHelpers.removeEvents();
		            }
		            _objects.activeView.hide();
		            exports.fireEvent('menuClosed', {});
		            _objects.activeView = newView;
		            _session.current = 'view';
		            _objects.activeView.show();
		
		            if(_sessionConfig.draggable) {
		                eventHelpers.addEvents();
		            }
		            _objects.activeView.animate({
		                left:0,
		                duration: _sessionConfig.duration.change_in
		            },function(f){
		            	exports.fireEvent('menuOpened', {});
		            });
		        });
	        } else {
	        	internal.slideView('view');
	        }
		} else {		
	        if (_objects.activeView !== newView) {
	            newView.center = {
	                x: _session.half.width,
	                y: _session.half.height
	            };
	            
	            newView.hide();

	            newView.animate({
	            	transform: _objects.twoD.translate(_session.platformWidth,0),
	            	duration: 0.1
	            });
	            newView.width = _session.platformWidth;
	            newView.height = Ti.UI.FILL;
		
		        _objects.activeView.animate({
		            transform: _objects.twoD.translate(_objects.activeView.rect.x + (_session.platformWidth - _objects.activeView.rect.x), 0), //twoD.translate(delta_x, 0),
		            duration: _sessionConfig.duration.change_out
		        }, function() {
		
		            if(_sessionConfig.draggable) {
		                eventHelpers.removeEvents();
		            }
		            _objects.activeView.hide();
		            exports.fireEvent('menuClosed', {});
		            _objects.activeView = newView;
		            _session.current = 'view';
		            _objects.activeView.show();
		
		            if(_sessionConfig.draggable) {
		                eventHelpers.addEvents();
		            }
		            _objects.activeView.animate({
		                transform: _objects.twoD.translate(0, 0),
		                duration: _sessionConfig.duration.change_in
		            },function(f){
		            	exports.fireEvent('menuOpened', {});
		            });
		        });
	        } else {
	        	internal.slideView('view');
	        }
		}
	}		
};

exports.addEventListener = function(name, callback) {
  if(typeof _objects.events[name] !== 'array') {
       _objects.events[name] = [];
   }
  _objects.events[name].push(callback);
};

exports.removeEventListener = function(name, callback) {
	if((_objects.events[name] !== undefined) && 
		(_objects.events[name] !== null)){
		delete _objects.events[name];
	}
};

exports.fireEvent = function(name, args) {
   args.event = name;
   for(var callback in _objects.events[name]) {
         _objects.events[name][callback](args);
   }
};

exports.isOpen=function(){
	if(_objects.activeView.rect.x!==undefined){
	   	return !(_objects.activeView.rect.x===0);
	}else{
		return false;
	}	
};
exports.toggle = function(){
	 if(exports.isOpen()){
		 return exports.hide();
	 }else{
		 return exports.expose();
	}
};

exports.loadMenuItems = function(data){
	var rows = [];
		
	function createTableViewRow(rowData){
		var row = Ti.UI.createTableViewRow({
			height:44, navView: rowData.view,
			backgroundColor:'transparent',
			backgroundImage:_appRoot + 'SlideOutMenu/Images/row_bg.png'
		});
	
		var title = Ti.UI.createLabel({
			color:'white',
			left:8,
			width:Ti.UI.FILL,
			height:Ti.UI.FILL,
			text:rowData.title,
			font:{
				fontFamily:'Arial-BoldMT',
				fontWeight:'bold',
				fontSize:19
			}
		});
		row.add(title);
	
		if(rowData.hasDetail){
			var detail = Ti.UI.createImageView({
				right:90, width:8, height:13,
				image: _appRoot + 'SlideOutMenu/Images/arrow.png'
			});
			row.add(detail);
		}
	
		return row;
	};	

	_objects.leftView = Ti.UI.createTableView({
		backgroundImage:_appRoot + 'SlideOutMenu/Images/table_bg.png',
		separatorStyle:Ti.UI.iPhone.TableViewSeparatorStyle.NONE
	});

	for(i=0; i<data.length; i++) {
		rows.push(createTableViewRow(data[i]));
	}

	_objects.leftView.setData(rows);

	return exports;
};

exports.addLeftView=function(view){
	_objects.leftView = view;
	return exports;
};

exports.config=function(args){
	if((args!==undefined)&& (args!==null)){
		_sessionConfig = mixin(DEFAULT_CONFIG,args);
	}
	return exports;
};

exports.expose=function(){
	if(_objects.activeView!==null){
		if(_session.isAndroid){
			var maxLeft = _objects.activeView.maxLeft || _session.platformWidth*0.8;
	        _objects.activeView.animate({
			     left: maxLeft,
			     duration: _sessionConfig.duration.swipe
	        },function(f){
	        	exports.fireEvent('menuOpened', {});
	        });
		}else{
		    _objects.activeView.animate({	    	
		        transform: _objects.twoD.translate(260, 0),
		        duration: _sessionConfig.duration.bounce
		    },function(f){
		    	exports.fireEvent('menuOpened', {});
		    });				
		}
		internal.onCurrentChanged();	
	}
    return exports;
};

exports.hide=function(){
	if(_objects.activeView!==null){
		_session.current = 'view';
		if(_session.isAndroid){		            
	        _objects.activeView.animate({
	            left: 0,
	            duration: _sessionConfig.duration.swipe
	        },function(f){
	        	exports.fireEvent('menuClosed', {});
	        });	
		}else{
		    _objects.activeView.animate({
		        transform: _objects.twoD.translate(0, 0),
		        duration: _sessionConfig.duration.bounce
		    },function(f){
		    	exports.fireEvent('menuClosed', {});
		    });		
	   }
	   internal.onCurrentChanged();
	}
    return exports;
};

exports.open = function(args) {
	//Config in case provided here
	exports.config(args);
	
    // Add the menu first
    if(_objects.leftView !== undefined && _objects.leftView.toString().indexOf('TableView') !== -1) {
        _objects.menuWin.add(_objects.leftView);
    } else {
        throw "'left' property must be a Titanium Table view proxy... was:" + _objects.leftView.toString();
    }

    // If this menu has previously been initialised, remove existing table rows so
    // that we can rebuild them 
    if(_session.initialised){
      for(var view_index in _objects.views) {
        var view = _objects.views[view_index];
        if(view){
          _objects.menuWin.remove(view);
        }
      }
      _objects.views = [];
    }

    // Here we will process the table rows just as if they were tabs in a tabgroup
    // Making sure we check all the table sections
    for(var i = 0; i < _objects.leftView.data.length; i++)
    {
        // Make sure we check all the table rows
        for(var j = 0; j < _objects.leftView.data[i].rowCount; j++)
        {
            var row = _objects.leftView.data[i].rows[j];

            //only work with rows that have a view... in case some are buttons or decoration
            if(row.navView !== undefined) {
                var View;

                // here we will accept nything but a window...
                if(row.navView.toString().indexOf('Window') === -1) {
                    View = row.navView;
                } else {
                    throw "ViewSlider can only accept UI Views as the table row view property for now";
                    //Maybe in the future just copy all children of a window to a view?
                }
                View.width = _session.platformWidth;
                View.height = Ti.UI.FILL;

                _objects.views.push(View);
                
                if (!_session.initialised && !_objects.activeView) {
			        _objects.activeView = _objects.views[_objects.views.length-1]; // set the first view we can find
                }

                // Hide all but the first one... but add them to self so they load and reduce lag... just like ios tabgroup...
                _objects.menuWin.add(View);
                if(_objects.views.length > 1 && View != _objects.activeView) {
                    View.visible = false;
                }

            } else {
                _objects.views.push(false); // keep our index correct...
            }
        }
    }
    _session.initialised = true;

    _session.ledge = _objects.activeView.width * 0.8,
    _session.threshold = _objects.activeView.width * 0.2,
    _session.half = {
        width: _objects.activeView.width / 2,
        height: _objects.activeView.size.height / 2
    };
    _objects.leftView.zIndex = 1;
    _objects.activeView.zIndex = 2;

    if(_sessionConfig.draggable) {
        eventHelpers.addEvents();
    }

    _objects.leftView.addEventListener('click', function(e) {
        var newView;
        
        if(_objects.views[e.index]) { // see if it's an object, or a boolean false
            newView = _objects.views[e.index];
            internal.changeView(newView);
            
            exports.fireEvent('switch', {
                view: newView,
                index: _objects.views.indexOf(newView),
                menuRow: e.rowData
            });
        } else {
        	newView = _objects.activeView; // switch back to the old view
        	
			// this row had no view attached, fire an event so the user can do something
            exports.fireEvent('buttonclick', {
                index: e.index,
                rowData: e.rowData,
                source: e.source,
            });
            
            internal.changeView(_objects.activeView);
        }
    });
    exports.addEventListener('open', function() {
        internal.slideView('left');
    });
    exports.addEventListener('close', function() {
        internal.slideView('view');
    });
    exports.addEventListener('toggle', function() {
        if(current === 'view') {
            internal.slideView('left');
        } else {
            internal.slideView('view');
        }
    });
    _objects.menuWin.open();
    
    return exports;
};
        
exports.dispose = function() {
	_objects.menuWin.close();
	return exports;
};

exports.currentView = function() {
    return _objects.activeView;
};

exports.createMenuView=function(args){
	if (_session.isAndroid) {
		var Draggable = require('ti.draggable');			
		// override some arguments
		args.minLeft =  args.minLeft || 0;
		args.maxLeft = args.maxLeft || _session.platformWidth*0.8;
		args.axis = args.axis || 'x';
		
		return new Draggable.createView(args);
				
	} else {
		return Ti.UI.createView(args);
	}
};
