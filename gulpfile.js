var gulp = require("gulp");
var hogan = require('gulp-hogan');
// var md = require("markdown").markdown;
var marked = require('marked');
var less = require("gulp-less");
var minifyCSS = require('gulp-minify-css');
var clean = require('gulp-clean');
var runSeq = require("run-sequence");
var fs = require("fs");
var path = require("path");
var conf = require("./conf/site_conf");

var host = conf.host;
var title = conf.title;
var subtitle = conf.subtitle;

marked.setOptions({
    renderer: new marked.Renderer(),
    gfm: true,
    tables: true,
    breaks: false,
    pedantic: false,
    sanitize: true,
    smartLists: true,
    smartypants: false
});

var opts = {
    conf: "./conf/site_conf",
    src: "source",
    content: "content",
    style: "./style"
};

var writeOpts = {encoding:'utf8', mode: "666", flag: 'w' };

gulp.task('default', function() {
  gulp.src('**/*.hogan')
    .pipe(hogan(opts.conf, null, ".html"))
    .pipe(gulp.dest('.'));
});

var walk = function(path, callback) {
    var files = fs.readdirSync(path);
    files.forEach(function(item) {
        var subpath = path + "/" + item;
        var stat = fs.statSync(subpath);
        if (stat.isDirectory()) {
            walk(subpath, callback);
        } else {
            callback && callback(subpath);
        }
    });
};

var trim = function(str) {
    return str.replace(/^\s+/, "").replace(/\s+$/, "");
};

var getMenuConf = function(content) {
    var m = content.replace(/[\r\n]/g, "").match(/<!-- DESC(.*)DESC-->/);
    if (! m) {
        console.log("no description found");
        return null;
    }

    var ret = {};
    var menuConf = m[1];
    var menuArr = menuConf.split(",");
    for (var key in menuArr) {
        var item = trim(menuArr[key]);
        var index = item.indexOf(":");
        if (index != -1) {
            ret[item.substring(0, index)] = trim(item.substring(index + 1));
        }
    }

    return ret;
};

var getPath = function(file) {
    var index = file.lastIndexOf("/");
    if (index != -1) {
        return {path: file.substring(0, index + 1), name:file.substring(index + 1).replace(".md", "")};
    }

    return null;
};

function mkdirsSync(dirpath, mode) { 
    console.log("make dir: " + dirpath);
    if (! fs.existsSync(dirpath)) {
        var pathtmp;
        dirpath.split("/").forEach(function(dirname) {
            if (pathtmp) {
                pathtmp = path.join(pathtmp, dirname);
            }
            else {
                pathtmp = dirname;
            }
            if (!fs.existsSync(pathtmp)) {
                if (!fs.mkdirSync(pathtmp, mode)) {
                    return false;
                }
            }
        });
    }
    return true; 
}

var pathMd2Html = function(path) {
    return path.replace(/source\/content/, "content").replace(".md", ".html");
};

gulp.task("less", function(cb) {
    gulp.src('./less/hyui.less')
        .pipe(less())
        .pipe(minifyCSS({compatibility: 'ie8'}))
        .pipe(gulp.dest('./style/'));

    cb();
});

gulp.task("layout", function() {
    var menus = [];
    var path = opts.src + "/content";
    var cache = {};

    walk(path, function(item) {
        var content = fs.readFileSync(item, "utf-8");
        if (! content) {
            console.log("no content for file:" + item);
            return;
        }

        var menuConf = getMenuConf(content);
        menuConf.link = host + "/" + pathMd2Html(item);
        if (cache[menuConf.category]) {
            cache[menuConf.category].push(menuConf);
        } else {
            cache[menuConf.category] = [menuConf];
        }
    });

    // generate menus
    for (var i in cache) {
        menus.push({
            category: i,
            articles: cache[i]
        });
    }

    return gulp.src('**/layout.hogan')
        .pipe(hogan({"menus": menus, "host": host, "title": title, "subtitle": subtitle}, null, ".html"))
        .pipe(gulp.dest('.'));

    // console.log("layout generated !");
    // cb();
});

gulp.task("index", function(cb) {
    var layout = fs.readFileSync("tmpl/layout.html", "utf-8");
    var indexContent = marked(fs.readFileSync(opts.src + "/index.md", "utf-8"));
    var out = layout.replace("{CONTENT}", indexContent);
    fs.writeFileSync("index.html", out, writeOpts);

    console.log("index page generated !");
    cb();
});

gulp.task("contents", function(cb) {
    var layout = fs.readFileSync("tmpl/layout.html", "utf-8");
    var path = opts.src + "/content";

    walk(path, function(item) {
        var article = fs.readFileSync(item, "utf-8");
        var descIndex = article.indexOf("DESC-->");
        article = article.substring(descIndex + 8);

        var html = marked(article);
        var out = layout.replace("{CONTENT}", html);
        var outFile = pathMd2Html(item);
        var outDir = getPath(outFile).path;
        if (! fs.existsSync(outDir)) {
            mkdirsSync(outDir);
        }
        fs.writeFileSync(outFile, out, writeOpts);
        console.log(outFile);
    });

    console.log("contents generated !");
    cb();
});

gulp.task("clean", function() {
    return gulp.src([opts.content, "tmpl/**/*.html", "index.html", "style/hyui.css"], {read: false})
        .pipe(clean());
});

gulp.task("default", function() {
    runSeq("clean", "less", "layout", ["index", "contents"], function() {
        console.log("finished !");
    });
});
