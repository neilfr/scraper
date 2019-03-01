// empty for now
$(".notesBtn").click(function() {
  console.log("notes button was clicked!");
  articleId = $(this).attr("id");
  console.log(articleId);
});

// call delete route and pass the id of the article who's delete button was clicked
$(".deleteBtn").click(function() {
  console.log("delete button was clicked!");
  articleId = $(this).attr("id");
  console.log(articleId);
  $.ajax({
    url: "/api/delete/" + articleId,
    type: "DELETE"
  });
});
