// Dependencies
var express = require("express");
var path = require("path");

var PORT = process.env.PORT || 3000;

// Initialize Express
var app = express();

// Serve static content for the app from the "public" directory.
app.use(express.static(path.join(__dirname, "/public")));

// Parse request body as JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Set Handlebars.
var exphbs = require("express-handlebars");
app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

// Import routes and give the server access to them.
var router = require("./routes/routes");

app.use(router);

// Listen on port 3000
app.listen(PORT, function() {
  console.log("App now listening at localhost:" + PORT);
});
