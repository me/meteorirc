Messages = new Meteor.Collection("messages");

if (Meteor.is_client) {

  var lastDate;

  Handlebars.registerHelper('ifDateChanged', function(date, options){
    if (date){
      var d1 = new Date(date);  
    }
    if (lastDate){
      var d2 = new Date(lastDate);  
    }
    lastDate = date;
    if( !d1 || (d2 && d1.getFullYear() == d2.getFullYear() && d1.getMonth() == d2.getMonth() && d1.getDate() == d2.getDate()) ) {
        return options.inverse(this);
    } else {
        return options.fn(this);
    }
  });

  Handlebars.registerHelper('dateString', function(val, options) {
    if (!val) return "";
    var d = new Date(val);
    return d.toLocaleDateString();
  });

  Handlebars.registerHelper('timeString', function(val, options) {
    if (!val) return "";
    var d = new Date(val);
    var hours = d.getHours();
    if (hours < 10){
      hours = "0"+hours;
    }
    var minutes = d.getMinutes();
    if (minutes < 10){
      minutes = "0"+minutes;
    }

    return hours+":"+minutes;
  });  

  Template.messages.messages = function(){
    return Messages.find({}, {sort: {time: -1}});
  };

}

if (Meteor.is_server) {
  Meteor.default_server.method_handlers['/messages/insert'] = function () {};
  Meteor.default_server.method_handlers['/messages/update'] = function () {};
  Meteor.default_server.method_handlers['/messages/remove'] = function () {};

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
    var client = new irc.Client('irc.freenode.net', 'meteor_logger', {
      channels: ['#meteor']
    });
    client.addListener('message', function (from, to, message) {
      Fiber(function(){
        // console.log(from + ' => ' + to + ': ' + message);
        Messages.insert({
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
}