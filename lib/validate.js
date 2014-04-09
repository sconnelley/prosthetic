var validate = module.exports = {};

validate.path = function(path) {
  //var pattern = new RegExp(path.replace(/^\*$/g, ".*"));
  var pattern = new RegExp("^" + path + "$", "g");
  return function(req) {
    //console.log('MATCH: ', req.path, path, (!!(req.path.match(pattern))));
    //console.log("Pattern-> ", pattern);
    //return req.path == path;
    return !!req.path.match(pattern);
  };
};

validate.header = function(header, value) {
  if (arguments.length === 1) {
    var parts = header.split(": ", 2);
    header = parts[0];
    value = parts[1];
  }
  return function(req) {
    return req.headers[name.toLowerCase()] === value;
  };
};

validate.headers = function(headers) {
  var tests = [];
  if (Array.isArray(headers)) {
    tests = headers.map(validate.header);
  } else {
    for (var header in headers) {
      tests.push(validate.header(header, headers[header]));
    }
  }
  return and.apply(null, tests);
};

validate.query = function(data) {
  var tests = Object.keys(data)
    .map(function(key) {
      return function(req) {
        return req.query && req.query[key] == data[key];
      };
    });
  return and.apply(null, tests);
};

