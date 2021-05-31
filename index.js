const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const getYoutubeTitle = require('get-youtube-title');
const getYoutubeID = require('get-youtube-id');
const api_config = require('./api-config.json');
const mongoose = require('mongoose');

var LyricSchema = new mongoose.Schema({
	lastModifiedTime: String,
	youtubeLink: String,
	youtubeTitle: String,
	youtubeID: String,
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
	var yt_ID = getYoutubeID(req.body.yt_link);
	var now = new Date().getTime();
	now += 9 * 60 * 60 * 1000;
	now = new Date(now);

	let year = now.getFullYear();
	let month = now.getMonth() + 1;
	let date = now.getDate();
	var day = now.getDay();

	if (day == 0) day = '일';
	else if (day == 1) day = '월';
	else if (day == 2) day = '화';
	else if (day == 3) day = '수';
	else if (day == 4) day = '목';
	else if (day == 5) day = '금';
	else day = '토';

	let hours = now.getHours();
	let minutes = now.getMinutes();
	let seconds = now.getSeconds();
	
	const nowDate = year + '년 ' + month + '월 ' + date + '일 (' + day + ')' + ' ' + 
			hours + '시 ' + minutes + '분 ' + seconds + '초';

	console.log('date : ' + nowDate);

	const data = new LyricModel({
		youtubeLink: req.body.yt_link,
		youtubeTitle: req.body.yt_title,
		youtubeID: yt_ID,
		Lyrics: req.body.transcript,
		lastModifiedTime: nowDate
	});
	
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

app.post('/find', function(req, res) {
	var title = req.body.search_key.split(' ');
	var regexquery = ".*";

	for (var i = 0; i < title.length; i++) {
		regexquery = regexquery + title[i] + ".*";
	}
	
	console.log(regexquery);

	LyricModel.find({youtubeTitle: {$regex: regexquery, $options: "i"}}, {_id: 1, youtubeLink: 1, youtubeTitle: 1}, function(err, lyric){
		if(err) return res.status(500).json({error: err});
		res.json(lyric);
	});

	console.log('Successfully Found.');
});

app.post('/find/lyric', function(req, res) {
	
	LyricModel.find({"_id": req.body._id}, function(err, lyric) {
		if (err) {
			return res.status(500).json({error: err});
		}
		res.json(lyric);
	});

	console.log('Successfully Found lyric.');
});

app.post('/find/uri', function(req, res) {
	var yt_ID = getYoutubeID(req.body.youtubeLink);

	LyricModel.find({"youtubeID": yt_ID}, { _id: 1 }, function(err, lyric) {
		if (err) {
			console.log('Error occurred with Find URI');
			return res.json({result: 0});
		}
		else if (lyric.length == 0) {
			console.log('FIND URI API : NONE');
			return res.json({result: 0});
		}
		console.log('Successfully Found URI');
		res.json({_id: lyric[0]._id, result: 1});
	});
})

app.post('/edit/lyric', function(req, res) {
	var _id = req.body._id;
	var Lyrics = req.body.Lyrics;
	var now = new Date().getTime();
        now += 9 * 60 * 60 * 1000;
        now = new Date(now);

        let year = now.getFullYear();
        let month = now.getMonth() + 1;
        let date = now.getDate();
        var day = now.getDay();

        if (day == 0) day = '일';
        else if (day == 1) day = '월';
        else if (day == 2) day = '화';
        else if (day == 3) day = '수';
        else if (day == 4) day = '목';
        else if (day == 5) day = '금';
        else day = '토';

        let hours = now.getHours();
        let minutes = now.getMinutes();
        let seconds = now.getSeconds();

        const nowDate = year + '년 ' + month + '월 ' + date + '일 (' + day + ')' + ' ' +
                        hours + '시 ' + minutes + '분 ' + seconds + '초';

        console.log('date : ' + nowDate);


	LyricModel.update({"_id": _id}, {"lastModifiedTime": nowDate, "Lyrics": Lyrics}, function(err) {
		if (err) {
			console.log('Error Occurred (' + _id + ')');
			return res.json({result: 0});
		}

		console.log('Successfully Updated');
		res.json({result: 1});
	});
});

app.listen(port, () => console.log('API running ...'));

