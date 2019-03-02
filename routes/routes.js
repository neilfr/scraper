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
      res.end();
    });
  });
}

router.get("/notes/:articleId", function(req, res) {
  var articleId = req.params.articleId;
  console.log("article Id is:");
  console.log(articleId);
  var notesToDisplay = [];
  //! how to i get the list of noteDescriptions instead of IDs?
  db.Article.findById(req.params.articleId)
    .populate("notes")
    .exec(function(err, found) {
      console.log("found that matches the article findbyid is:");
      console.log(found);
      var hbsObject = {
        articleId: articleId,
        notes: found.notes
      };
      console.log("hbsobject is:");
      console.log(hbsObject);
      //!why can't i render this as a modal?
      res.render("notes", hbsObject);
    });
});

router.post("/notes/:articleId", function(req, res) {
  var articleId = req.params.articleId;
  var newNote = req.body;
  console.log("article Id is:");
  console.log(articleId);
  console.log("newNote is:");
  console.log(newNote);
  db.Note.create(req.body).then(function(data) {
    console.log("the data is:");
    console.log(data);
    console.log("data._id is");
    console.log(data._id);
    //! should i post the description and not just the id?
    db.Article.findByIdAndUpdate(
      req.params.articleId,
      { $push: { notes: data } },
      { new: true },
      function(err, found) {
        res.send("post finished");
      }
    );
  });
});

router.get("/", function(req, res) {
  // retrieve all articles already in the database
  db.Article.find({}, function(error, found) {
    // Throw any errors to the console
    if (error) {
      console.log(error);
    }
    // If there are no errors, render the data with index.handlebars
    else {
      var hbsObject = {
        articles: found
      };
      //res.render("index", hbsObject);
      //console.log("hbs object is:");
      //     console.log(hbsObject);
      res.render("index", hbsObject);
    }
  });
});

router.delete("/api/article/delete/:articleId", function(req, res) {
  console.log("in article delete router");
  console.log("req.params.articleId is: ");
  console.log(req.params.articleId);
  db.Article.deleteOne(
    { _id: new mongoose.Types.ObjectId(req.params.articleId) },
    function(err) {
      console.log("error", err);
      res.end();
    }
  );
});

router.delete("/api/note/delete/:noteId/:articleId", function(req, res) {
  console.log("in note delete router");
  console.log("req.params.noteId is: ");
  console.log(req.params.noteId);
  //!deleting notes but NOT the related note ids in the articles
  //!so what is the model for???
  //  db.Note.findByIdAndDelete(req.params.noteId, function() {
  //    res.send("done delete");
  //  });
  db.Article.findByIdAndUpdate(
    req.params.articleId,
    { $pullAll: { notes: [new mongoose.Types.ObjectId(req.params.noteId)] } },
    function(err) {
      console.log("error:", err);
      res.send("done delete");
    }
  );
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
router.post("/api/scrape", function(req, res) {
  // Get all the existing articles from the database
  // This will be used to check if scraped articles are already in the database
  db.Article.find({}, function(error, found) {
    // Throw any errors to the console
    if (error) {
      console.log(error);
    }
    // If there are no errors, proceed with scraping process
    else {
      // pass the set of existing articles, and the res object, to the scraping process
      scrapingProcess(found, res); // ! how do i use a callback on my own function???
    }
  });
});

module.exports = router;
