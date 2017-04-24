const Discord = require('discord.js');
var express = require('express');

//simple web server
//var app = express();

//app.set('port', (process.env.PORT || 80));

//app.use(express.static(__dirname + '/public'));

// views is directory for all template files
//app.set('views', __dirname + '/views');
//app.set('view engine', 'ejs');

//app.get('/', function(request, response) {
//  response.render('pages/index');
//});

//app.listen(app.get('port'), function() {
//  console.log('Node app is running on port', app.get('port'));
//});

//

const config = require("./config.json");
const bot = new Discord.Client();

var request = require('request')
  , FeedParser = require('feedparser');

const fs = require('fs');

function parserssby(json){
    console.log("Loading rss news...");
    var data = fs.readFileSync(json, 'utf8');
    var jsonfiledates = JSON.parse(data);
    //console.log(JSON.stringify(jsonfiledates));
    for(var i = 0; i < jsonfiledates.rssfeeds.length; i++) {
        fetch(jsonfiledates.rssfeeds[i], json, jsonfiledates, i);
    }
}

function fetch(feed, jsonfile, jsonstr, index) {
    
    // Define our streams
    var req = request(feed.rssurl, {timeout: 10000, pool: false});
    req.setMaxListeners(50);
    // Some feeds do not respond without user-agent and accept headers.
    req.setHeader('user-agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/31.0.1650.63 Safari/537.36');
    req.setHeader('accept', 'text/html,application/xhtml+xml');

    var feedparser = new FeedParser();

    // Define our handlers
    req.on('error', done);
    req.on('response', function(res) {
    if (res.statusCode != 200) return this.emit('error', new Error('Bad status code'));
    var encoding = res.headers['content-encoding'] || 'identity'
      , charset = getParams(res.headers['content-type'] || '').charset;
    res.pipe(feedparser);
    });

    feedparser.on('error', done);
    
    feedparser.on('readable', function() {
        var post;
        while (post = this.read()) {
            for(var j = 0; j < feed.categories.length; j++){
                var category = feed.categories[j];
                if(post[category.match].match(category.regexstr) && new Date(category.date) < new Date(post[feed.datefield])){
                    category.date = new Date(post[feed.datefield]).toString();
                    console.log("RSS news: "+post.title+ " "+post.link);
                    //console.log(JSON.stringify(post));
                    bot.channels.get('304981707764006932').sendMessage(`${feed.prefix}${post.title}: ${post.link}`);
                }
                //write back to json
                feed.categories[j] = category;
            }
        }
        //jsonstr[index] = feed;
        //console.log(index);

    });
    
    feedparser.on('end', function(){
        jsonstr.rssfeeds[index] = feed;
        jsonstr = JSON.stringify(jsonstr, null, 4);
        fs.writeFileSync(jsonfile, jsonstr, 'utf8');
    });
}

function getParams(str) {
  var params = str.split(';').reduce(function (params, param) {
    var parts = param.split('=').map(function (part) { return part.trim(); });
    if (parts.length === 2) {
      params[parts[0]] = parts[1];
    }
    return params;
  }, {});
  return params;
}

function done(err) {
  if (err) {
    console.log(err, err.stack);
    return process.exit(1);
  }
  process.exit();
}

bot.on('ready', () => {
    console.log(`Initializing...`);
    console.log(`Setting status to ${config.presenceStatus}.`)
    bot.user.setStatus(config.presenceStatus);
    parserssby('rss.json');
    setInterval(function(){ parserssby('rss.json'); }, 1000*60*30);
});


bot.on('message', message => {
    if(!message.content.startsWith(config.prefix)) return;
    
    let command = message.content.split(" ")[0].slice(config.prefix.length);
    
    if (command === 'ping') {
        message.reply('pong');
    }else if (command === 'raul'){
        message.channel.sendMessage(`Origin of RAUL: https://oddshot.tv/s/6QQLeu`);
    }
});

bot.login(config.token);
