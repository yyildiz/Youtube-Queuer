
$(document).ready(function() {
    // variables

    // If the page height has changed, more items have been added
    // and they need to be given the add to queue button to them
    var pageHeight = 0;
    var yqVideo = "";
    var currentVideo = "";

    setInterval(function() {
        updateSidebar();
        createQueueButtons();
    }, 500);

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

    $.fn.exists = function () {
        return this.length !== 0;
    }

    function updateSidebar() {
      chrome.storage.local.get("queue", function(obj) {
          if(obj["queue"].length == 0) {
            $(".queue-section").remove();
          } else {
            var list = $(".yq-list");
            if(list.length == 0) {
              createQueueSidebar();
            }
            if(list.find("li").length < obj["queue"].length) {
                $.each(obj['queue'], function() {
                    var item = $("<li>").addClass("video-list-item related-list-item related-list-item-compact-video")
                    item.append(this);
                    list.append(item);
                });
            }
        }
      });
    }

    function createQueueSidebar() {
        if($("#watch7-sidebar-modules").find(".yq-list").length == 0) {
          var sidebar = $("#watch7-sidebar-modules");
          var autoplayStyle = $("<div>").addClass("autoplay-bar").css("margin-bottom", "15px")
          var section = $("<div>").addClass("watch-sidebar-section queue-section");
          var header = $("<h4>").addClass("watch-sidebar-head").text("Queue");
          var checkbox = $(".checkbox-on-off").clone();
          var body = $("<div>").addClass("watch-sidebar-body");
          var list = $("<ul>").addClass("video-list yq-list").attr("id", "watch-related");
          var hr = $("<hr>").addClass("watch-sidebar-separation-line");
          body.append(list);
          autoplayStyle.append(checkbox)
          autoplayStyle.append(header)
          autoplayStyle.append(body)
          section.append(autoplayStyle)
          section.append(hr);
          sidebar.prepend(section);
        }
    }
    // When the "Add to queue" button is clicked
    $(document.body).on('click', '.btn-queue' ,function(){
        chrome.storage.local.get("queue", function(obj) {
            obj["queue"].push(yqVideo);
            chrome.storage.local.set(obj);
        });
        var item = $("<li>").addClass("video-list-item related-list-item related-list-item-compact-video")
        item.append(yqVideo);
        $(".yq-list").append(item);
    });

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
    // making sure that if more videos are added then we create the queue
    // buttons for the new content
    $(document).on("scroll", function() {
        oldHeight = pageHeight;
        pageHeight = $(this).outerHeight();
        if(oldHeight != pageHeight) {
            createQueueButtons();
        }
    });

    // When the watch more related button is clicked
    $("#watch-more-related").click(function() {
        createQueueButtons();
    });

    $(document.body).on('click', '.yt-uix-menu-container', function(){
        var video = $(this).siblings().parents(".video-list-item").clone();
        $(video).find(".yt-uix-menu").remove();
        //$(video).find(".yt-uix-menu-container .yt-ui-menu-item").remove();
        //var button = $("<button>")
        //button.addClass("yt-ui-menu-item yt-uix-menu-close-on-select")
        //button.addClass("btn-remove-queue");
        //button.text("Remove from Queue");
        var button = $("<button>").addClass("yt-uix-button yt-uix-button-size-default yt-uix-button-opacity yt-uix-button-empty yt-uix-button-has-icon dismiss-menu-choice yt-uix-tooltip").attr({
          type: "Button",
          title: "Remove from queue",
          "aria-lable": "Remove from queue",
          "data-tooltip-text": "Remove from queue"
        }).css("margin-left", "20px");
        var span = $("<span>").addClass("yt-uix-button-icon-wrapper");
        var innerSpan = $("<span>").addClass("yt-uix-button-icon yt-uix-button-icon-dismissal yt-sprite yq-delete-icon").appendTo(span);
        span.appendTo(button);
        $(video).find(".yt-uix-menu-container").append(button);
        yqVideo = video.html();
    });


    $(document.body).on('click', '.yq-delete-icon' ,function(){
        var vid = $(this).closest("li.video-list-item");
        var index = getIndex(vid);
        removeVideo(index);
        vid.remove();
    })

    function getIndex(node) {
        var i = 0
        node = $(node);
        while(node.exists()){
            node = $(node).prev();
            i++;

        }
        return i - 1;

    }

    // When the video is over
    $(".html5-video-player").attrchange(function(attr) {
        var currentTime = $(".ytp-time-current").text();
        var endTime = $(".ytp-time-duration").text();
        // when a yt video is over
        if(currentTime == endTime && endTime != "0:00") {
            setTimeout(function(){ playNextVideo() }, 2000);
        }
    });

    // playing the next video
    function playNextVideo() {
        chrome.storage.local.get("queue", function(obj) {
            var queue = obj['queue'];
            var href = $(queue[0]).find(".content-link").attr("href");
            var link = "http://www.youtube.com" + href;
            if(typeof(href) != 'undefined') {
                chrome.runtime.sendMessage({redirect: link});
                removeVideo(0);
            }
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



    // turn home page video to queue video format
    // make autoplay logic work

    // add on homepage link to first video
    // also add a link to view the list on the homepage
    // add upNext style playing
    // remove all videos from list

    // DONE -  autoplay video when another video is over
    // DONE - if list size is 0, remove list from page or show 'no videos' message
    // DONE - remove a video from list
    // DONE - redisplay queue on new page load

    // FUTURE
    // Save as playlist?...

});
