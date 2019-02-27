// Dependencies
var express = require("express");
var router = express.Router();
var mongojs = require("mongojs");

// Require axios and cheerio. This makes the scraping possible
var axios = require("axios");
var cheerio = require("cheerio");

// Database configuration
var databaseUrl = "tsnscraper";
var collections = ["scrapedData"];

// Hook mongojs configuration to the db variable
var db = mongojs(databaseUrl, collections);
db.on("error", function(error) {
  console.log("Database Error:", error);
});

router.get("/", function(req, res) {
  //res.send("Hello world");

  // call the apiRoutes /all route
  db.scrapedData.find({}, function(error, found) {
    // Throw any errors to the console
    if (error) {
      console.log(error);
    }
    // If there are no errors, send the data to the browser as json
    else {
      var hbsObject = {
        articles: found
      };
      console.log(hbsObject);
      res.render("index", hbsObject);
    }
  });
});

// Retrieve data from the db
router.get("/api/all", function(req, res) {
  // Find all results from the scrapedData collection in the db
  db.scrapedData.find({}, function(error, found) {
    // Throw any errors to the console
    if (error) {
      console.log(error);
    }
    // If there are no errors, send the data to the browser as json
    else {
      res.json(found);
    }
  });
});

// Scrape data from one site and place it into the mongodb db
router.get("/api/scrape", function(req, res) {
  // Make a request via axios for the news section of `ycombinator`
  axios.get("https://www.tsn.ca/").then(function(response) {
    // Load the html body from axios into cheerio
    var $ = cheerio.load(response.data);
    // For each element with a "article-content" class
    $(".article-content").each(function(i, element) {
      // Save the text of the h3 header and .lead class elements under .article-content elements
      var articleContent = $(element);
      var headline = articleContent.find("h3").text();
      var lead = articleContent.find(".lead").text();
      var link = articleContent.find("a").attr("href");
      // if there is both a headline and a lead, insert them into the database
      if (headline && lead) {
        db.scrapedData.insert(
          {
            headline: headline,
            lead: lead,
            link: link
          },
          function(err, inserted) {
            if (err) {
              // Log the error if one is encountered during the query
              console.log(err);
            } else {
              // Otherwise, log the inserted data
              console.log(inserted);
            }
          }
        );
      }
    });
  });

  // Send a "Scrape Complete" message to the browser
  res.send("Scrape Complete");
});

module.exports = router;
