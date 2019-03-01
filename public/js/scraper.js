// empty for now
$(".notesBtn").click(function() {
  console.log("notes button was clicked!");
  articleId = $(this).attr("id");
  console.log(articleId);
});

$(".deleteBtn").click(function() {
  console.log("delete button was clicked!");
  articleId = $(this).attr("id");
  console.log(articleId);
  $.ajax({
    url: "/api/delete/" + articleId,
    type: "DELETE"
  });
});
