// call scrape route and then redraw the page
$("#btnScrape").click(function() {
  $.post("/api/scrape").then(function() {
    window.location.href = "/";
  });
});

// see notes for this article
$(".notesBtn").click(function() {
  console.log("notes button was clicked!");
  articleId = $(this).val();
  console.log(articleId);
  // window.location.href = "/notes/" + articleId;
});

$("#brb").click(function() {
  console.log("hit big red button");
});

// add note to this article
$("#addNoteBtn").click(function() {
  console.log("add note button was clicked!");
  articleId = $(this).val();
  console.log(articleId);
  var newNote = $("#newNote").val();
  console.log("new note is: ");
  console.log(newNote);

  $.post("/notes/" + articleId, { noteDescription: newNote }).then(function() {
    //window.location.href = "/notes/" + articleId;
  });
  /*($.ajax({
    url: "/notes",
    type: "POST"
  }).then(function() {
    window.location.href = "/";
  });
  */
  //window.location.href = "/notes/" + articleId;
});

// call delete route and pass the id of the article who's delete button was clicked
$(".deleteArticleBtn").click(function() {
  console.log("delete button was clicked!");
  articleId = $(this).val();
  console.log(articleId);
  $.ajax({
    url: "/api/delete/" + articleId,
    type: "DELETE"
  }).then(function() {
    //   window.location.href = "/";
  });
});
