IRC_SERVER = 'irc.freenode.net';
BOTNAME = 'meteor_logger';
ROOM = '#meteor';
PAGE = 100;

Messages = new Meteor.Collection("messages");

Counters = new Meteor.Collection("counters");

function getCntConditions(startFrom){
  var cnt = 0;
  if (startFrom){
    cnt = startFrom;
  }
  else{
    var counter = Counters.findOne({name: 'messages'});
    if (counter){
      cnt = counter.val - PAGE + 1;
    }
  }
  var cntConds = {$gte: cnt};
  if (startFrom && (!counter || startFrom < (counter.val - PAGE))){
    cntConds['$lt'] = cnt+PAGE;
  }
  return cntConds;
}

if (Meteor.is_client) {

  var MessagesRouter = Backbone.Router.extend({
    routes: {
      "from/:startMsg": "main"
    },

    main: function(startFrom){
      if (startFrom){
        startFrom = parseInt(startFrom, 10);
      }
      Session.set("startFrom", startFrom);
    }

  });

  Router = new MessagesRouter;

  Meteor.startup(function () {
    Backbone.history.start({pushState: true});
  });

  Meteor.autosubscribe(function(){
    var startFrom = Session.get('startFrom');
    Meteor.subscribe('messages', startFrom);
  });

  Meteor.subscribe('counters');

  Template.messages.messages = function(){
    
    lastDate = null;
    var range = getCntConditions(Session.get('startFrom'));
    var cnt = range['$gte'];
    var prev = null;
    if (cnt > 1){
      prev = cnt - PAGE;
      if (prev < 1){
        prev = 1;
      }
    }
    Session.set('previousPage', prev);
    return Messages.find({}, {sort: {time: -1}});
  };

  Template.messages.previousPage = function(){
    return Session.get('previousPage');
  };

  Template.messages.nextPage = function(){
    var startFrom = Session.get('startFrom');
    var counter = Counters.findOne({name: 'messages'});
    if (startFrom && counter && startFrom < counter.val - PAGE){
      return startFrom + PAGE;
    }
    else{
      return null;
    }
  };

}

if (Meteor.is_server) { 
  _.each(['insert', 'update', 'remove'], function(act){
    _.each(['messages', 'counters'], function(coll){
      Meteor.default_server.method_handlers['/'+coll+'/'+act] = function () {};
    });
  });

  var messageCnt = 1;
  if (!Counters.findOne({name: 'messages'})){
    
    _.each(Messages.find({}, {sort: {time: 1}}).fetch(), function(msg){
      Messages.update({_id: msg._id}, {$set: {cnt: messageCnt}});
      messageCnt++;
    });
    Counters.insert({name: 'messages', val: messageCnt});
    
    
  }



  var require = __meteor_bootstrap__.require;
  var path = require("path");
  var fs = require('fs');

  var irc;
  var ircPath = 'node_modules/irc';

  var base = path.resolve('.');
  if (base == '/'){
    base = path.dirname(global.require.main.filename);
  }

  var publicPath = path.resolve(base+'/public/'+ircPath);
  var staticPath = path.resolve(base+'/static/'+ircPath);
  
  if (path.existsSync(publicPath)){
    irc = require(publicPath);
  }
  else if (path.existsSync(staticPath)){
    irc = require(staticPath);
  }
  else{
    console.log("node_modules not found");
  }
  Meteor.startup(function () {
    var client = new irc.Client(IRC_SERVER, BOTNAME, {channels: [ROOM]});
    client.addListener('message', function (from, to, message) {
      Fiber(function(){
        // console.log(from + ' => ' + to + ': ' + message);
        Counters.update({name: 'messages'}, {$inc: {val: 1}});
        messageCnt = Counters.findOne({name: 'messages'}).val;
        Messages.insert({
          cnt: messageCnt,
          time: new Date(),
          from: from, 
          to: to, 
          text: message}
        );
      }).run();
    });
    // client.addListener('raw', function(message){
    //   console.log("Raw: ");
    //   console.log(message);
    // });
  });


  Meteor.publish('messages', function(startFrom){
    var cntConds = getCntConditions(startFrom);
    return Messages.find({cnt: cntConds}, {sort: {time: -1}});
  });

  Meteor.publish('counters', function(){
    return Counters.find({});
  });

}