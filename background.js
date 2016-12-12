
$(document).ready(function() {
    // variables
    var link = "";
    var pageHeight = 0;
    var queue = []

    createQueueButtons();
    $(document).on("scroll", function() {
        oldHeight = pageHeight;
        pageHeight = $(this).outerHeight();
        console.log(pageHeight)
        if(oldHeight != pageHeight) {
            createQueueButtons();
        }
    })
    $("#watch-more-related").click(function() {
        createQueueButtons();
    });

    $(".yt-uix-menu-container").on("click", function() {
        link = $(this).siblings()
                      .closest("h3")
                      .find("a")
                      .attr("href");

        if(typeof(link) === 'undefined') {
            link = $(this).siblings()
                          .closest(".content-wrapper")
                          .find("a")
                          .attr("href");
        }
    });
    function createQueueButtons() {
        var menu = $("li[role='menuitem']");
        menu.each(function() {
            var length = $(this).find(".btn-queue").length;
            if(length == 0) {
                var button = $("<button>")
                button.addClass("yt-ui-menu-item yt-uix-menu-close-on-select")
                button.addClass("btn-queue");
                button.text("Add to Queue");
                $(this).append(button);
            }
        });
    };

    $(".btn-queue").on("click", function() {
        chrome.storage.sync.get("queue", function(q) {
            var obj = {};
            q["queue"].push(link);
            obj["queue"] = q["queue"];
            chrome.storage.sync.set(obj, function() {
                chrome.storage.sync.get("queue", function(p) {
                    console.log(p)
                });
            })
        });

    });

});
