require('dotenv').config();

const bodyParser = require('body-parser');
const cors = require('cors');
const dns = require('dns');
const express = require('express');
const mongoose = require('mongoose');

(async function main() {
	const app = express();
	const PORT = process.env.PORT || 3000;

	app.use(bodyParser.json());
	app.use(bodyParser.urlencoded({ extended: true }));
	app.use(cors());
	app.use('/public', express.static(`${process.cwd()}/public`));

	app.get('/', (_, res) => {
		res.sendFile(process.cwd() + '/views/index.html');
	});

	await mongoose
		.connect(process.env.MONGO_URI)
		.then(() => console.log('Connected to database'))
		.catch((err) => console.log(err));

	const urlSchema = new mongoose.Schema({
		original_url: {
			type: String,
		},
		short_url: {
			type: Number,
		},
	});

	const UrlModel = mongoose.model('Url', urlSchema);

	app.post('/api/shorturl', async (req, res) => {
		try {
			const input_url = req.body.url;

			if (!input_url) {
				return res.status(400).json({
					error: 'url must be provided',
				});
			}

			const hostname = new URL(input_url).hostname;
      console.log(hostname);

			dns.lookup(hostname, async (error, address) => {
				if (error) {
					return res.status(400).json({
						error: 'invalid url',
					});
				}

        const validUrl = new URL(input_url);
        console.log(validUrl);

				let url = await UrlModel.findOne({ original_url: input_url });

				if (url) {
					return res.status(200).json({
						original_url: url.original_url,
						short_url: url.short_url,
					});
				}

				const shortUrl = (await UrlModel.countDocuments()) + 1;

				const newUrl = await UrlModel.create({
					original_url: input_url,
					short_url: shortUrl,
				});

				return res.status(200).json({
					original_url: newUrl.original_url,
					short_url: newUrl.short_url,
				});
			});
		} catch (error) {
			console.error(error);

			res.status(400).json({
				error: "invalid url",
			});
		}
	});

	app.get('/api/shorturl/:shorturl', async (req, res) => {
		try {
			const data = await UrlModel.findOne({ short_url: req.params.shorturl });

			if (!data) {
				return res.status(404).json({
					error: 'url not found',
				});
			}

			res.redirect(data.original_url);
		} catch (error) {
			console.error(error);

			res.status(500).json({
				error: error.message,
			});
		}
	});

	app.listen(PORT, function () {
		console.log(`Listening on port ${PORT}`);
	});
})();