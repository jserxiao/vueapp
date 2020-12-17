var express = require('express');
var router = express.Router();
var fs = require('fs');
var path = require('path');
var multiparty = require('multiparty');

/* GET home page. */
router.get('/', function(req, res, next) {
	res.render('index', {
		title: 'Express'
	});
});

router.post('/upload/chunk', function(req, res, next) {
	const tempDir = path.resolve(__dirname, '../upload/temp');
	if (!fs.existsSync(tempDir)) {
		fs.mkdirSync(tempDir)
	}
	const form = new multiparty.Form();
	form.parse(req,function(err,fileds,files){
		console.log(files.chunk)
		const [hash] = fileds.hash;
		const [filename] = fileds.filename;
		const [chunk] = files.chunk;
		const chunkReadSteam = fs.createReadStream(chunk.path);
		const chunkPath = tempDir + '/' + hash;
		fs.writeFileSync(chunkPath, null);
		const chunkWriteSteam = fs.createWriteStream(chunkPath)
		chunkReadSteam.pipe(chunkWriteSteam);
		res.send(JSON.stringify({
			msg: '上传成功'
		}));
	})
	


});

router.post('/upload/merge', function(req, res, next) {
	const tempDir = path.resolve(__dirname, '../upload/temp');
	const filename = req.body.filename;
	const chunkSize = req.body.chunkSize;
	const size = req.body.size;
	const filepath = path.resolve(tempDir, '../', filename);
	console.log(chunkSize, size)
	const fileChunkList = fs.readdirSync(tempDir).filter(name => name.match(new RegExp(filename))).sort((a, b) => a.split(
		'_')[1] - b.split('_')[1]);
	fs.writeFileSync(filepath, null);

	fileChunkList.forEach((name, index) => {
		const chunkReadStream = fs.createReadStream(tempDir + '/' + name);
		const fileWriteStream = fs.createWriteStream(filepath, {
			flags: 'w',
			start: index * chunkSize,
			end: (index + 1) * chunkSize,
		})
		chunkReadStream.on('end', () => {
			// fs.unlinkSync(tempDir+'/'+name)
		})
		chunkReadStream.pipe(fileWriteStream);
	})
	res.send(JSON.stringify({
		msg: '合并成功'
	}));
});


module.exports = router;
