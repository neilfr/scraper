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

// function for executing the scraping process
function scrapingProcess(existingArticles) {
  // Make a request via axios for the news section of `tsn.ca`
  axios.get("https://www.tsn.ca/").then(function(response) {
    // Load the html body from axios into cheerio
    var $ = cheerio.load(response.data);

    // For each element with a "stack-view" class
    $(".stack-view").each(function(i, element) {
      var stackView = $(element);
      // find the "article-content" class descendant
      var articleContent = stackView.find(".article-content");

      // within the "article-content" element, find the headline, lead and link
      var headline = articleContent.find("h3").text();
      var lead = articleContent.find(".lead").text();
      var link = articleContent.find("a").attr("href");
      var newArticle = {
        headline: headline,
        lead: lead,
        link: link
      };

      // prepend the tsn base URL if the link does not include a base URL
      if (link != undefined) {
        if (link.charAt(0) === "/") {
          link = "https://www.tsn.ca" + link;
        }
      }

      // check if scraped headline is already in the database
      var newHeadline = true;
      for (var i = 0; i < existingArticles.length; i++) {
        if (existingArticles[i].headline === headline) {
          newHeadline = false;
        }
      }

      // if the headline is new, and there is both a headline and a lead, insert the article data into the database
      if (newHeadline && headline && lead) {
        db.scrapedData.insert(newArticle, function(err, inserted) {
          if (err) {
            // Log the error if one is encountered during the query
            console.log(err);
          } else {
            // Otherwise, log the inserted data
            console.log(inserted);
          }
        });
      }
    });
  });
}

router.get("/", function(req, res) {
  // retrieve all articles already in the database
  db.scrapedData.find({}, function(error, found) {
    // Throw any errors to the console
    if (error) {
      console.log(error);
    }
    // If there are no errors, render the data with index.handlebars
    else {
      var hbsObject = {
        articles: found
      };
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
  // Get all the existing articles from the database
  // This will be used to check if scraped articles are already in the database
  db.scrapedData.find({}, function(error, found) {
    // Throw any errors to the console
    if (error) {
      console.log(error);
    }
    // If there are no errors, proceed with scraping process
    else {
      // pass the set of existing articles to the scraping process
      scrapingProcess(found);
    }
  });

  // Send a "Scrape Complete" message to the browser
  res.send("Scrape Complete");
});

module.exports = router;
