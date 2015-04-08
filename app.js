//DEPENDENCIES
var express = require("express");
var bp = require("body-parser");
var app = express();

//SETUP
app.use(bp.urlencoded());
app.use(express.static(__dirname + "/static"));
app.set("views", __dirname + "/views");
app.set("view engine",'ejs');
var server = app.listen(3000,function(){
	console.log("Listening on port 3000");
});

//DB
var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/quotingDojo');
var QuoteSchema = new mongoose.Schema({
	name: String,
	quote: String,
	like_count: Number
});
var Quote = mongoose.model('Quote',QuoteSchema);
QuoteSchema.path("name").required(true, "Name Cannot Be Blank");
QuoteSchema.path("quote").required(true, "Quote Cannot Be Blank");

//ROUTES
app.get('/',function(req,res){
	res.render('index', {errors: undefined});
});

app.post('/quotes',function(req,res){
	console.log(req.body);
	var quote = new Quote({
		name: req.body.name,
		quote: req.body.quote,
		like_count: 0
	});
	quote.save(function(err){
		if(err){
			console.log("Something Went Wrong",err);
			res.render('index',{errors: err});
		} else {
			console.log("Successfully added a new quote");
			res.redirect('/quotes');
		}
	});
});

app.get('/quotes',function(req,res){
	Quote.find({},function(err,quotes){
		if(err) {
			console.log("there was an error");
		} else {
			var bubbleSort = function(a) {
				for(var i = 0; i < a.length; i++) {
					for(var j = 0; j < a.length - 1; j++) {
						if(a[j].like_count < a[j + 1].like_count) {
							var temp = a[j];
							a[j] = a[j + 1];
							a[j + 1] = temp;
						}
					}
				}
			return a;
			};

			var sortedQuotes = bubbleSort(quotes);

			// for (var quote in sortedQuotes) {
			// 	console.log(sortedQuotes[quote]);
			// }

			res.render('quotes',{quotes: sortedQuotes});
		}
	});
});

//SOCKETS
var io = require("socket.io").listen(server);
io.sockets.on("connection",function(socket){
	socket.on('new_like',function(like_id){
		Quote.find({_id: Object(like_id.id)},function(err,quote){
			var count = quote[0].like_count;
			count++;
			Quote.update({_id: Object(like_id.id)},{like_count: count},function(err){
				if(err){
					console.log(err);
				} else {
					Quote.find({},function(err,quotes){
						var bubbleSort = function(a) {
							for(var i = 0; i < a.length; i++) {
								for(var j = 0; j < a.length - 1; j++) {
									if(a[j].like_count < a[j + 1].like_count) {
										var temp = a[j];
										a[j] = a[j + 1];
										a[j + 1] = temp;
									}
								}
							}
						return a;
						};

						var sortedQuotes = bubbleSort(quotes);

						// for (var quote in sortedQuotes) {
						// 	console.log(sortedQuotes[quote]);
						// }
						console.log(sortedQuotes);
						socket.emit("updated_like_count",{quotes: sortedQuotes});
				});
			}
		});
		// Quote.update({_id: like_id},{})
	});
});
});



