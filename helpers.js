if (Meteor.is_client){
  var lastDate;

  Handlebars.registerHelper('ifDateChanged', function(date, options){
    if (date){
      var d1 = new Date(date);  
    }
    if (lastDate){
      var d2 = new Date(lastDate);  
    }
    lastDate = date;
    if((d1 && d2 && (d1.getFullYear() != d2.getFullYear() || d1.getMonth() != d2.getMonth() || d1.getDate() != d2.getDate()))){
      return options.fn(this);
    }
    else{
      return options.inverse(this);
    }
  });

  Handlebars.registerHelper('lastMessageDate', function(options){
    var messagesGte = Session.get('messagesGte');
    var messagesLt = Session.get('messagesLt');
    if (messagesLt){
      var msg = Messages.findOne({cnt: {$gte: messagesGte, $lt: messagesLt}}, {sort: {time: 1}});
    }
    if (msg){
      return options.fn({time: msg.time});
    }
    else{
      return options.inverse(this);
    }
  });



  Handlebars.registerHelper('dateString', function(val, options) {
    if (!val) return "";
    var d = new Date(val);
    return d.toLocaleDateString();
  });

  Handlebars.registerHelper('datePlusOneString', function(val, options) {
    if (!val) return "";
    var d = new Date(val);
    d.setDate(d.getDate()+1);
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

  Handlebars.registerHelper('linkifyText', function(options) {
    var val = this["text"];
    if (!val) return "";
    val = Handlebars._escape(val);

    return Meteor.ui.chunk(function(){

      var replaceText, replacePattern1, replacePattern2, replacePattern3;

      //URLs starting with http://, https://, or ftp://
      replacePattern1 = /(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gim;
      replacedText = val.replace(replacePattern1, '<a href="$1" target="_blank">$1</a>');

      //URLs starting with "www." (without // before it, or it'd re-link the ones done above).
      replacePattern2 = /(^|[^\/])(www\.[\S]+(\b|$))/gim;
      replacedText = replacedText.replace(replacePattern2, '$1<a href="http://$2" target="_blank">$2</a>');

      //Change email addresses to mailto:: links.
      replacePattern3 = /(\w+@[a-zA-Z_]+?\.[a-zA-Z]{2,6})/gim;
      replacedText = replacedText.replace(replacePattern3, '<a href="mailto:$1">$1</a>');

      return replacedText;
      
    });
  });

  Handlebars.registerHelper('iflt', function(lvalue, rvalue, options) {
    if (arguments.length < 3)
        throw new Error("Handlebars Helper iflessthen needs 2 parameters");
    if( lvalue < rvalue ) {
        return options.inverse(this);
    } else {
        return options.fn(this);
    }
  });

}

