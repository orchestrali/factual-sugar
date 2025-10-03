const places = "1234567890ETABCD";



$(function() {
  $("#submit").on("click", router);
});

function router() {
  let query = buildquery();
  sendsearch(JSON.stringify(query));
}

function buildquery() {
  let fields = [];
  $('input[type="checkbox"]').each(i => {
    if ($(this).is(":checked")) fields.push($(this).attr("name"));
  });
  let q = $("#query").val();
  if (q.length === 0) q = {};
  let query = {query: q, fields: fields.join(" ")};
  return query;
}

function sendsearch(query) {
  var xhr = new XMLHttpRequest();
  xhr.open('POST', "/find/method", true);
  xhr.send(query);

  xhr.onload = function () {
    console.log("loaded!");
    $("#container").contents().remove();
    $("#container").append("results loaded");
    let res = JSON.parse(xhr.responseText);
    console.log(res);
  }
}
