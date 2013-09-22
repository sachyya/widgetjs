define(
	['./segments'],
	function(routeSegments) {

		var urlSeparator = '/';

		// ### Route object
		// 
		// Routes are used to match URLs. Routes represent
		// the path taken for which an action has to be taken
		// (registered in the router with an associated callback
		// function).
		//
		// A route have a `segments` array. Some segments are optional and other mandatory. 
		// A route match a URL if the segments matches the route segments. 
		//
		// The strategy to match route against a URL is to try several passes with and 
		// without optional parameters.
		//
		var route = function(spec, my) {
			if(Object.prototype.toString.call(spec) === '[object String]') {
				return routeFactory(spec);
			}

			spec = spec || {};
			my = my || {};

			var segments = spec.segments;

			var that = {};

			my.getSegments = function() {
				return segments;
			};

			that.matchUrl = function(url) {
				// Match URL segments against route segments
				var urlSegments = url.getSegments();
				var matchingSegments = findMatchingPath(urlSegments);
				if(!matchingSegments) {
					return routeNoMatchResult();
				}

				// Get values for each matching parameter and return as result
				var parameters = getParameters(matchingSegments, urlSegments);
				return routeMatchResult({route: that, url: url, parameters: parameters});
			};

			that.toString = function() {
				return 'route(' + segments.join('/') + ')';
			};

			function findMatchingPath(urlSegments) {
				// Try to find a sequene of optional/mandatory 
				// segments that match URL
				var candidates = segments.clone();
				while(true) {
					// Return candidates if all match 
					var matched = candidates.match(urlSegments);
					if(matched.length === candidates.length) {						
						return candidates;
					}

					// Try to strip off last optional segment in match.
					var lastOptional = matched.lastOptional();
					if(!lastOptional) {
						return null; // no more optional parameters to strip off => no match	
					}
					candidates.remove(lastOptional);
				}
			}

			function getParameters(segmentPath, urlSegments) {
				var parameters = {};
				segmentPath.forEach(function(routeSegment, index) {
					if(routeSegment.isParameter()) {
						parameters[routeSegment.getName()] = routeSegment.getValue(urlSegments[index]);
					}
				});

				return parameters;
			}


			return that;
		};

		// ### Route Factory
		//
		// Create route from pattern. A pattern can look like:
		//
		//	`/foo/#bar/?baz`
		//
		// See valid [segments](segments.html)
		//
		var routeFactory = function(routePattern) {
			var segmentStrings = routePattern.split(urlSeparator);
			var segmentArray = segmentStrings.map(function(segmentString) {
				return routeSegments.segmentFactory(segmentString);
			});

			var segments = routeSegments.segmentPath(segmentArray);

			return route({ segments: segments });
		};


		// ### Route result 
		//
		// Route match result are used as the answer of matching
		// a url for a route. 
		//
		// Parameters is a hash with matched segment names as keys
		// and matching url segment values.
		//
		var routeMatchResult = function(spec) {
			spec = spec || {};

			var url = spec.url;
			var route = spec.route;
			var parameters = spec.parameters || null;

			var that = {};

			that.getParameters = function() { return parameters; };

			that.getKeys = function() {
				return Object.keys(parameters);
			};

			that.getValues = function() {
				return that.getKeys().map(function(v) {
					return parameters[v];
				});
			};

			that.getRoute = function () {
				return route;
			};

			that.getUrl = function () {
				return url;
			};

			that.matched = function() {
				return true;
			};

			return that;
		};

		var routeNoMatchResult = function() {
			var that = routeMatchResult();

			that.matched = function() {
				return false;
			};

			return that;
		};


		return route;
	}
);