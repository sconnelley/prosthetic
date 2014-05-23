var path = require("path"),
    cheerio = require('cheerio'),
    fs = require("fs");

var insert = module.exports = function(payload) {
  var before = "</body>",
      after;

  function insert(body) {
    var out = insert.payload.apply(null, arguments);

    if (!out) {
      // console.log("(empty payload)");
      return body;
    }


    if (before) {
      return body.replace(before, out + before);
    } else if (after) {
      return body.replace(after, after + out);
    } else {
      return body + out;
    }
  }

  insert.payload = function() {
    return (typeof payload === "function")
      ? payload.apply(this, arguments)
      : String(payload);
  };

  insert.before = function(marker) {
    if (!arguments.length) return before;
    //console.log('Before: -> ', marker);
    after = null;
    before = marker;
    return insert;
  };

  insert.after = function(marker) {
    if (!arguments.length) return after;
    before = null;
    after = marker;
    return insert;
  };

  return insert;
};

insert.file = function(filename) {
  var resolved = path.resolve(process.cwd(), filename),
      content,
      cache = false,
      file = insert(function() {
        if (cache && content) return content;
        // console.log("reading:", resolved, "(resolved from: " + filename + ")");
        var _content = fs.readFileSync(resolved).toString();
        return cache
          ? content = _content
          : _content;
      });

  file.cache = function(bool) {
    if (!arguments.length) return cache;
    cache = !!bool;
    return file;
  };

  return file;
};



// insert an HTML element by name
insert.html = function(name, _attrs) {
  var attrs = {},
      closed = false,
      ownLine = true,
      content;

  var html = insert(function() {
    var out = ["<", name];
    if (ownLine) out.unshift("\n");
    for (var key in attrs) {
      if (defined(attrs[key])) {
        out.push(" ", key, '="', escapeAttr(attrs[key]), '"');
      }
    }
    if (content) {
      out.push(">", content, "</", name, ">");
    } else if (closed) {
      out.push("/>");
    } else {
      out.push("></", name, ">");
    }
    if (ownLine) out.push("\n");
    return out.join("");
  });

  html.attrs = function(d) {
    if (!arguments.length) return attrs;
    for (var key in d) {
      attrs[key] = d[key];
    }
    return html;
  };

  html.attr = function(key, val) {
    if (arguments.length === 2) {
      attrs[key] = val;
    } else if (arguments.length === 1) {
      return attrs[key];
    } else {
      throw new Error("Invalid # of arguments (" + arguments.length + ")");
    }
    return html;
  };

  html.content = function(d) {
    if (!arguments.length) return content;
    content = d;
    closed = false;
    return html;
  };

  html.closed = function(d) {
    if (!arguments.length) return closed;
    closed = d;
    return html;
  };

  function escapeAttr(value) {
    return String(value)
      .replace(/"/g, '\\"')
      .replace(/&/g, "&amp;");
  }

  if (typeof _attrs === "object") {
    html.attrs(_attrs);
  }
  return html;
};

// insert a (java)script by URL
insert.script = function(url) {
  // cachbuster
  url = url + "v" + (+new Date());
  return insert.html("script")
    .attr("src", url)
    .before("</head>");
};

// insert a stylesheet by URL
insert.style = function(url, element) {
  url = url + "v" + (+new Date());
  var style;
  switch (element) {
    case "style":
      style = insert.html("style")
        .attr("type", "text/css")
        .content("@import url('" + url + "')");
      break;

    case "link":
    default:
      style = insert.html("link")
        .closed(true)
        .attr("rel", "stylesheet")
        .attr("href", url);
  }

  return style
    .before("</head>");
};


function defined(d) {
  return d !== null && typeof d !== "undefined";
}
