$(document).ready(function() {
  addQueryButtons();
  $(".queue-btn").on("click", function() {
    var object = {};
    var queue = [];
    object["queue"] = queue;

    chrome.storage.sync.get(["queue"], function(queue) {
      chrome.storage.sync.set(object, function() {
        console.log("Video added to queue");
      });
    });
  });
});

function addQueryButtons() {
    var menu = $(".yt-ui-menu-item-label");
    var span = $("<span>");
    var button = $("<button>")

    button.addClass("yt-uix-menu-close-on-select")
          .addClass("yt-ui-menu-item")
          .addClass("dismiss-menu-choice")
          .addClass("queue-btn");

    span.addClass("yt-ui-menu-item-label");
    span.text("Add to Queue");
    span.appendTo(button);

    menu.parent().after(button);

};
