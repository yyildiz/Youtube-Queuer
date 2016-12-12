
$(document).ready(function() {
    // variables

    // If the page height has changed, more items have been added
    // and they need to be given the add to queue button to them
    var pageHeight = 0;
    var yqVideo = "";
    var videoOver = false;

    // A mutation oberserver that checks if a class has been add/removed from an element
    (function($) {
        var MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;

        $.fn.attrchange = function(callback) {
            if (MutationObserver) {
                var options = {
                    subtree: false,
                    attributes: true
                };
                var observer = new MutationObserver(function(mutations) {
                    mutations.forEach(function(e) {
                        callback.call(e.target, e.attributeName);
                    });
                });
                return this.each(function() {
                    observer.observe(this, options);
                });
            }
        }
    })(jQuery);

    function createQueueSidebar() {
        chrome.storage.local.get("queue", function(obj) {
            var sidebar = $("#watch7-sidebar-modules");
            var section = $("<div>").addClass("watch-sidebar-section");
            var header = $("<h4>").addClass("watch-sidebar-head").text("Queue");
            var body = $("<div>").addClass("watch-sidebar-body");
            var list = $("<ul>").addClass("video-list yq-list").attr("id", "watch-related");

            $.each(obj['queue'], function() {
                var item = $("<li>").addClass("video-list-item related-list-item related-list-item-compact-video")
                item.append(this)
                list.append(item)
            })
            body.append(list);
            section.append(header)
            section.append(body)
            sidebar.prepend(section)
        });
    }

    // Creating the queue buttons on all lists
    function createQueueButtons() {
        var menu = $(".yt-lockup-content li[role='menuitem'], .related-item-dismissable li[role='menuitem']");
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

    createQueueButtons();
    createQueueSidebar();
    // making sure that if more videos are added then we create the queue
    // buttons for the new content
    $(document).on("scroll", function() {
        oldHeight = pageHeight;
        pageHeight = $(this).outerHeight();
        if(oldHeight != pageHeight) {
            createQueueButtons();
        }
    })

    // When the watch more related button is clicked
    $("#watch-more-related").click(function() {
        createQueueButtons();
    });

    $(".yt-uix-menu-container").on("click", function() {
        yqVideo = $(this).siblings().parents(".video-list-item").html();
        console.log($(this))
    });


    // When the "Add to queue" button is clicked
    $(".btn-queue").on("click", function() {
        chrome.storage.local.get("queue", function(obj) {
            obj["queue"].push(yqVideo);
            chrome.storage.local.set(obj);
        });
        var item = $("<li>").addClass("video-list-item related-list-item related-list-item-compact-video")
        item.append(yqVideo);
        $(item).find(".yt-uix-menu-container .yt-ui-menu-item").remove();
        var button = $("<button>")
        button.addClass("yt-ui-menu-item yt-uix-menu-close-on-select")
        button.addClass("btn-remove-queue");
        button.text("Remove from Queue");
        $(item).find("li[role='menuitem']").append(button);
        $(".yq-list").append(item);
    });

    $(".btn-remove-queue").on("click", function() {
        console.log("hi")
        var item = $(this).parents(".video-list-item");
        var list = $(item).parents().find(".video-list yq-list");
        console.log(getIndex($(item)));
        list.remove(item);
    })

    function getIndex(node) {
        var i = 0;
        while(node = node.prev() != null){
            i++;
        }
        return i;
    }

    // When the video is over
    $(".html5-video-player").attrchange(function(attr) {
        // when a yt video is over, it is given the class of ended-mode
        if($(this).hasClass("ended-mode") && videoOver == false) {
            videoOver = true;
            setTimeout(function(){ playNextVideo() }, 2000);
        }
    });

    // playing the next video
    function playNextVideo() {
        chrome.storage.local.get("queue", function(obj) {
            var queue = obj['queue'];
            var href = $(queue[0]).find(".content-link").attr("href");
            var link = "http://www.youtube.com" + href;
            if(typeof(href) != 'undefined')
                chrome.runtime.sendMessage({redirect: link});
        })
    }

    // remove individual video from queue
    function removeVideo(index) {
        chrome.storage.local.get("queue", function(obj){
            // removing from the element
            obj["queue"].splice(index, 1);
            chrome.storage.local.set(obj);
        });
    }

    // remove all elements from queue
    function resetQueue() {
        chrome.storage.local.set({"queue" : []});
    }

    // TODO
    // remove a video from list
    // remove all videos from list
    // redisplay queue on new page load

    // add on homepage link to first video
    // also add a link to view the list on the homepage
    // add upNext style playing

    // DONE -  autoplay video when another video is over

    // Save as playlist?...

});
