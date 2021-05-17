const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const getYoutubeTitle = require('get-youtube-title');
const getYoutubeID = require('get-youtube-id');
const api_config = require('./api-config.json');
const mongoose = require('mongoose');

var LyricSchema = new mongoose.Schema({
	lastModifiedTime: { type: Date, default: Date.now },
	youtubeLink: String,
	youtubeTitle: String,
	Lyrics: Object
}, { collection: 'music' });

var LyricModel = mongoose.model('lyric', LyricSchema);

const app = express();
const port = process.env.PORT || 8080;

const MongoURI = "mongodb://" + api_config.userId + ":" + api_config.userPw + "@localhost:27017/sling";

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

mongoose
	.connect(MongoURI, {
		useNewUrlParser: true,
		useCreateIndex: true,
	})
	.then(() => {
		console.log("Connected to MongoDB");
	})
	.catch((err) => {
		console.log(err);
	});

app.post('/getYoutubeTitle', function(req, res) {
	const yt_link = req.body.yt_link;
	var yt_ID = getYoutubeID(yt_link);

	getYoutubeTitle(yt_ID, api_config.key, function(err, title) {
		res.send(title);
	})
});

app.post('/save', function(req, res) {
	const data = new LyricModel({
		youtubeLink: req.body.yt_link,
		youtubeTitle: req.body.yt_title,
		Lyrics: req.body.transcript,
	});
	
	console.log(data);

	data.save(function(err) {
		if (err) {
			console.error(err);
			res.json({result: 0});
			return;
		}

		console.log("Successfully saved to MongoDB");
		res.json({result: 1});
	});
});

app.listen(port, () => console.log('API running ...'));

