require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const shortId = require("short-id");
const validUrl = require("valid-url");
const bodyParser = require("body-parser");
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

const uri = process.env.MONGO_URI;
mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
});

const connection = mongoose.connection;
connection.on("error", console.error.bind(console, "connection error"));
connection.once("open", () => {
  console.log("MongoDB database connection established succesfully");
});

const URLSchema = new mongoose.Schema({
  original_url: String,
  short_url: String,
});
const URL = mongoose.model("Url", URLSchema);

app.use(cors());

app.use(
  bodyParser.urlencoded({
    extended: false,
  })
);

app.use(express.json());

app.use("/public", express.static(`${process.cwd()}/public`));

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

app.post("/api/shorturl", async function (req, res) {
  const url = req.body.url;
  const urlCode = shortId.generate();
  // check if the url is valid
  if (!validUrl.isWebUri(url)) {
    res.status(400).json({
      error: "Invalid URL",
    });
  } else {
    try {
      // check if the url is already in the database
      let findOne = await URL.findOne({
        original_url: url,
      });
      if (findOne) {
        res.json({
          original_url: findOne.original_url,
          short_url: findOne.short_url,
        });
      } else {
        // if it's not in the database, create a new short url and return it
        findOne = new URL({
          original_url: url,
          short_url: urlCode,
        });
        await findOne.save();
        res.json({
          original_url: findOne.original_url,
          short_url: findOne.short_url,
        });
      }
    } catch (err) {
      console.error(err);
      res.status(500).json("Server error");
    }
  }
});

app.get("/api/shorturl/:short_url?", async function (req, res) {
  try {
    const urlParams = await URL.findOne({
      short_url: req.params.short_url,
    });
    if (urlParams) {
      return res.redirect(urlParams.original_url);
    } else {
      return res.status(400).json("No URL found");
    }
  } catch (err) {
    console.error(err);
    res.status(500).json("Server error");
  }
});

// Your first API endpoint
app.get("/api/hello", function (req, res) {
  res.json({ greeting: "hello API" });
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
