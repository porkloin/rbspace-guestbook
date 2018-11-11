if (process.env.NODE_ENV !== 'production') {
  require('dotenv').load();
}
var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var mongoose = require('mongoose');
var bodyParser = require('body-parser');

server.listen(8080);

//Json body parser
app.use(bodyParser.json());

// restrict to your preferred origin
// from env var - set to '*'
io.set( 'origins', process.env.SOCKET_IO_ORIGIN );

//DB setup
mongoose.connect("mongodb://mongo:27017");

var messageSchema = new mongoose.Schema({
	message: String,
	location: String,
  timestamp: Number,
});

var messages = mongoose.model('Messages', messageSchema);

app.get('/', function(req, res){
	messages.find({}, function(err, allMessages) {
		res.send(allMessages);
	});
});

io.on('connection', function (socket) {
  // TODO: serve up an initial slice, then grab extra messages when the user scrolls back far enough.
  // If enough messages get into the DB this could be a huge piece of data.
  messages.find({}, function(err, allMessages) {
    io.emit('init', allMessages);
  });
  console.log('new connection!');
  socket.on('message', function(data) {
    console.log(data);
    data = JSON.parse(data);
    if (!data.message || data.message.length < 1) {
      return;
    }
    var newMessage = new messages({
      message: data.message,
      location: data.location ? data.location : 'Somewhere in the universe...',
      timestamp: new Date(),
    });
    newMessage.save(function(err) {
      io.emit('message', newMessage);
      if (err) throw err;
    });
    socket.broadcast.emit(data);
  });
});


app.listen(3000, function(){
  console.log('Server running. Waiting for guestbook entries!');
});

