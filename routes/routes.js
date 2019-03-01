// Dependencies
var express = require("express");
var router = express.Router();
var mongoose = require("mongoose");
var db = require("../models");

// Require axios and cheerio. This makes the scraping possible
var axios = require("axios");
var cheerio = require("cheerio");

// Connect to the Mongo DB
var databaseUrl = "tsnscraper";
mongoose.connect("mongodb://localhost/" + databaseUrl, {
  useNewUrlParser: true
});

// function for executing the scraping process
function scrapingProcess(existingArticles, res) {
  // Make a request via axios for the news section of `tsn.ca`
  axios.get("https://www.tsn.ca/").then(function(response) {
    // Load the html body from axios into cheerio
    var $ = cheerio.load(response.data);
    var newArticles = [];

    // For each element with a "stack-view" class
    $(".stack-view").each(function(i, element) {
      var stackView = $(element);
      // find the "article-content" class descendant
      var articleContent = stackView.find(".article-content");

      // within the "article-content" element, find the headline, lead and link
      var headline = articleContent.find("h3").text();
      var lead = articleContent.find(".lead").text();
      var link = articleContent.find("a").attr("href");

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

      // if the headline is new, and there is both a headline and a lead, insert the article data into the newArticle array
      if (newHeadline && headline && lead) {
        newArticles.push({
          headline: headline,
          lead: lead,
          link: link
        });
      }
    });

    // insert the array of newArticles into the database
    db.Article.insertMany(newArticles, function(err) {
      if (err) throw err;
      console.log("inserted documents!");
      res.send("Scrape Complete");
    });
  });
}

router.get("/", function(req, res) {
  // retrieve all articles already in the database
  db.Article.find({}, function(error, found) {
    // Throw any errors to the console
    if (error) {
      console.log(error);
    }
    // If there are no errors, render the data with index.handlebars
    else {
      //console.log(found);
      var hbsObject = {
        articles: found
      };
      res.render("index", hbsObject);
    }
  });
});

router.delete("/api/delete/:articleId", function(req, res) {
  console.log("req.params.articleId is:");
  console.log(req.params.articleId);
  //db.Article.remove({ _id: db.ObjectId(req.params.articleId) }, function() {
  db.Article.findOneAndDelete(req.params.id, function() {
    console.log("got to delete route");
    res.send("Delete Complete");
  });
});

// Retrieve data from the db
router.get("/api/all", function(req, res) {
  // Find all results from the Article collection in the db
  db.Article.find({}, function(error, found) {
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
  db.Article.find({}, function(error, found) {
    // Throw any errors to the console
    if (error) {
      console.log(error);
    }
    // If there are no errors, proceed with scraping process
    else {
      // pass the set of existing articles to the scraping process
      scrapingProcess(found, res);

      //res.send("Scrape Complete");
    }
  });
});

module.exports = router;
