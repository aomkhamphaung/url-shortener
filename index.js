require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const dns = require('dns');
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

mongoose.connect(process.env.MONGO_URI)
        .then(() => console.log("Connected to database"))
        .catch((err) => console.log(err))

const urlSchema = new mongoose.Schema({
  original_url: {
    type: String
  }, 
  short_url: {
    type: Number
  }
})

const Url = mongoose.model('Url', urlSchema);

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

// app.post('/api/shorturl', async(req, res) => {
//   const input_url = req.body.url;
//     try {
//       let url = await Url.findOne({original_url: input_url});
//       if(!url) {
//         const shortUrl = await Url.countDocuments() + 1;
//         url = new Url({original_url: input_url, short_url: shortUrl});
//         await url.save();
//       }
//       res.status(200).json({original_url: url.original_url, short_url: url.short_url});
//     }catch(err) {
//       console.log(err);
//       res.status(500).json({
// 				error: err.message || 'Cannot get Users',
// 			});
//     } 
// })

app.post('/api/shorturl', async(req, res) => {
  const input_url = req.body.url;
  dns.lookup(input_url.hostname, (err) => {
    if(err && err.code === 'ENOTFOUND') {
      console.log(err);
      res.status(500).json({error: "Invalid URL"});
    } else {
      Url.findOne({original_url: input_url}, (err, data) => {
        if(err) {
          console.log(err);
        }
        const shortUrl = Url.countDocuments() + 1;
        const urlData = new Url({
          original_url: input_url,
          short_url: shortUrl
        })
      })

      urlData.save((err) => {
        res.status(500).json("Error saving to database");
      })
      return res.status(200).json({original_url: urlData.original_url, short_url: urlData.short_url});
    }
  })
})

app.post('/api/shorturl/:shorturl', (req, res) => {
  Url.findOne({short_url: req.params.shorturl}, (err, data) => {
    if(err) {
      console.log(err);
    }
    res.redirect(data.original_url);
  })
})

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
