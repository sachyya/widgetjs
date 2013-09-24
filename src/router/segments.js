define([], function() {

	// ### Route segment
	//
	// A segment represents a single part of the route. All segments answer `match`
	// that take a URL segments and answers if it match route segment.
	// 
	// Three kind of segments are currently defined:
	//
	//	- **segment:** static segments in the URL
	//	- **parameter:** parameter segment that can be replaced with values.
	//	- **optional parameter:** parameter segments that does not have to exist in URL
	//

	// #### Route Factory
	//
	// Creates segments from strings. Segment strings starting with: 
	//
	//	- '**#**' will return parameter
	//	- '**?**' will return optional parameter
	//
	// Default is a static **segment**. 
	//
	// _Example:_
	//
	// `/foo/#bar/?baz` will be cut down into an array with 3 elements:
	//
	//	- **foo** -> segment
	//	- **bar** -> parameter
	//	- **baz** -> optional parameter
	//
	var segmentFactory = function(segmentString, options) {
		options = options || {};

		var prefix = segmentString[0];
		var name = segmentString.substr(1);

		// Default value
		var defaultValue = options.defaults && options.defaults[name] !== undefined ?
			options.defaults[name] : undefined;

		// Constraints
		var constraint = options.constraints && options.constraints[name] !== undefined ?
			options.constraints[name] : undefined;


		var segmentOptions = {
			name: name,
			defaultValue : defaultValue,
			constraints: constraint ? [constraint] : []
		};

		switch (prefix) {
		case '#':
			return parameter(segmentOptions);
		case '?':
			return optionalParameter(segmentOptions);
		default:
			return segment(segmentString);
		}
	};

	//
	// #### Segment
	// 
	// Static segments match URL segments that are equal to value.
	// Eg. Route '/hello/world' match only URL '/hello/world'
	//
	function segment(value) {
		var that = {};

		that.getName = function () {
			return value;
		};

		that.getValue = function(urlSegment) {
			return value;
		};

		that.isParameter = function() {
			return false;
		};

		that.isOptional = function() {
			return false;
		};

		that.match = function(string) {
			return value === string;
		};

		that.toString = function() {
			return value;
		};

		return that;
	}

	function parameterValidator(constraint) {
		// Custom function that take vale as argument
		if(typeof constraint === 'function') {
			return constraint;
		} 

		// Match against RegExp
		if(constraint instanceof RegExp) {
			var exp = new RegExp(constraint);
			return function(string) { return exp.test(string); };		
		}

		// Match valid options in an array 
		if(Object.prototype.toString.call(constraint) === '[object Array]') {
			var options = constraint.map(function(option) {
				return option.toLowerCase();
			});
			return function(string) {
				var val = string.toLowerCase();
				return options.indexOf(val) !== -1;
			};
		}		
	}

	// #### Parameter
	//
	// Parameters always match a URL segment. The value is the URL segment.
	// Route '/#foo/world' match URLs like '/hello/world', '/a/world', '/b/world' 
	// with 'foo' values 'hello', 'a', 'b'
	// 
	// Note: the leading '#' is *not* part of the name of the
	// segment.
	//
	function parameter(spec, my) {
		spec = spec || {};
		my = my || {};

		my.name = spec.name;
		my.defaultValue = spec.defaultValue;
		my.validators = spec.constraints.map(parameterValidator).filter(Boolean);

		var that = segment(my.name, my);

		that.getValue = function(urlSegment) {
			return urlSegment === undefined ? my.defaultValue : urlSegment;
		};

		that.isParameter = function() {
			return true;
		};

		that.match = function(string) {
			return typeof string === 'string' && that.isValid(string);
		};

		that.isValid = function (string) {
			return my.validators.every(function(validator) { return validator(string);});
		};

		that.toString = function() {
			return 'param(' + that.getName() + ')';
		};

		return that;
	}

	// #### Optional Parameter
	//
	//
	// Match same URL segments as regukar parameter5 except it's not required
	// in the URL.
	//
	// Route '/?foo/world' match URLs like '/hello/world', '/a/world', '/b/world'
	// but also '/world' 
	//
	// and 'foo' values are 'hello', 'a', 'b' and undefined
	// 
	// Note: the leading '?' is *not* part of the name of the
	// segment.
	//
	function optionalParameter(spec, my) {
		spec = spec || {};
		my = my || {};

		var that = parameter(spec, my);

		that.isOptional = function() {
			return true;
		};

		that.toString = function() {
			return 'optional(' + that.getName() + ')';
		};

		return that;
	}

	//
	// An ordered list of segments
	//
	var segmentPath = function (segments, options) {
		var that = segments || [];

		that.findOptional = function() { 
			return segmentPath(that.filter(function(segment) { 
				return segment.isOptional();
			}));
		};

		that.isAllOptional = function() {
			return that.every(function(segment) { 
				return segment.isOptional();
			});
		}; 

		that.lastOptional = function(segment) {
			var matchedOptionals = that.findOptional();
			return matchedOptionals[matchedOptionals.length - 1];
		};

		that.last = function () {
			return that[that.length - 1];
		};

		that.after = function(segment) {
			var index = that.indexOf(segment);
			return index === -1 ? that : segmentPath(that.slice(index + 1));
		};

		that.contains = function(segment) {
			return that.indexOf(segment) !== -1;	
		};

		that.match = function(urlSegments) {
			var match = [];
			for(var segmentIndex = 0; segmentIndex < that.length; segmentIndex++) {
				var urlSegment = urlSegments[segmentIndex]; 
				var routeSegment = that[segmentIndex];
				if(urlSegment === undefined || !routeSegment.match(urlSegment)) {
					break;
				}
				match.push(routeSegment);
			}


			return segmentPath(match);
		};

		that.clone = function() {
			return segmentPath(that.slice());
		};

		that.remove = function(item) {
			that.splice(that.indexOf(item),1); 
		};

		return that;
	}; 

	return {
		segmentFactory: segmentFactory,
		segmentPath: segmentPath,
		segment: segment,
		parameter: parameter,
		optionalParameter: optionalParameter
	};
});