
$(document).ready(function() {

    // variables

    // If the page height has changed, more items have been added
    // and they need to be given the add to queue button to them
    var pageHeight = 0;
    var yqVideo = "";
    var currentVideo = "";
    var isChecked = true;

    // The delete icon on a video has been clicked
    $(document.body).on('click', '.yq-delete-icon' ,function(){
        deleteVideo(this)
    });

    // toggles the checkboxes so that they can't both be autoplaying at the same time.
    function setAutoplay() {
      // if they're both checked at the start of the browser
      // we need to default to queue being the only checked one.
      $("#queue-checkbox").prop("checked", isChecked)

      if(queueChecked() && upNextChecked()) {
        $("#autoplay-checkbox").click();
        $("#autoplay-checkbox").prop("checked", false);
        $("#autoplay-checkbox").removeAttr("checked");
        isChecked = true;
      }
      $(document.body).on('click', '#queue-checkbox', function() {
        if(queueChecked()) {
          $("#autoplay-checkbox").prop("checked", false);
          isChecked = true;
        } else {
          isChecked = false;
        }
      });

      $(document.body).on('click', '#autoplay-checkbox', function() {
        if(upNextChecked()) {
          $("#queue-checkbox").prop("checked", false);
          isChecked = false;
        }
      });
    }

    // When the "Add to queue" button is clicked
    $(document.body).on('click', '.btn-queue' ,function(){
        // The last item clicked is saved at yqVideo and the addToQueue function uses this information.
        addToQueue();
    });

    // making sure that if more videos are added then we create the queue
    // buttons for the new content
    $(document).on("scroll", function() {
      oldHeight = pageHeight;
      pageHeight = $(this).outerHeight();
      if(oldHeight != pageHeight) {
          createQueueButtons();
      }
    });

    setInterval(function() {
        updateSidebar();
        createQueueButtons();
        checkPlayNext();
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

    // is the queue sidebar section autoplay checked
    function queueChecked() {
        return $("#queue-checkbox").prop("checked");
    }

    // is the up next sidebar section autoplay checked
    function upNextChecked() {
        return $("#autoplay-checkbox").prop("checked");
    }

    // Is it okay to play the next video?
    function checkPlayNext() {
        var currentTime = $(".ytp-time-current").text();
        var endTime = $(".ytp-time-duration").text();
        // when a yt video is over && queue autoplay is on.
        if(currentTime == endTime && endTime != "0:00" && queueChecked()) {
            setTimeout(function(){ playNextVideo() }, 2000);
        }
    }

    // A new page has been loaded or a new video has been added to the queue
    function updateSidebar() {
      chrome.storage.local.get("queue", function(obj) {
          if(typeof(obj["queue"]) == "undefined") {
            obj = {};
            obj["queue"] = [];
            chrome.storage.local.set(obj);
          }
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
            // Configure the autoplay logic of the two checkboxes
            setAutoplay();
        }
      });
    }

    // if the sidebar isn't of the page, we must create it
    function createQueueSidebar() {
        if($("#watch7-sidebar-modules").find(".yq-list").length == 0) {
          var sidebar = $("#watch7-sidebar-modules");
          var autoplayStyle = $("<div>").addClass("autoplay-bar").css("margin-bottom", "15px")
          var section = $("<div>").addClass("watch-sidebar-section queue-section");
          var header = $("<h4>").addClass("watch-sidebar-head").text("Live Playlist");

          var checkbox = $(".checkbox-on-off").clone();
          checkbox.find("#autoplay-checkbox").attr("id", "queue-checkbox");
          checkbox.find("#queue-checkbox").prop("checked", isChecked);
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



    function addToQueue() {
        chrome.storage.local.get("queue", function(obj) {
            if(typeof(obj["queue"]) == "undefined") {
              obj = {}
              obj["queue"] = [];
            }
            obj["queue"].push(yqVideo);
            chrome.storage.local.set(obj);
        });
        var item = $("<li>").addClass("video-list-item related-list-item related-list-item-compact-video")
        item.append(yqVideo);
        $(".yq-list").append(item);
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



    // When the watch more related button is clicked
    $("#watch-more-related").click(function() {
        createQueueButtons();
    });

    $(document.body).on('click', '.yt-uix-menu-container', function(){
      saveLastClickedVideo(this);

    });

    function saveLastClickedVideo(container) {
      var video = $(container).siblings().parents(".video-list-item").clone();
      // on homepage the videos are in a different format
      if(video.length == 0) {
        var v = $(container).siblings().parents(".yt-shelf-grid-item").clone();
        video = toVideoQueueFormat(v);
      }

      $(video).find(".yt-uix-menu").remove();
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

    }



    function deleteVideo(video) {
      var vid = $(video).closest("li.video-list-item");
      var index = getIndex(vid);
      removeVideo(index);
      vid.remove();
    }

    // Get the index of a video in the queue by seeing how many siblings came before it.
    function getIndex(node) {
        var i = 0
        node = $(node);
        while(node.length != 0){
            node = $(node).prev();
            i++;
        }
        return i - 1;
    }

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
        });
    }

    // remove individual video from queue
    function removeVideo(index) {
        chrome.storage.local.get("queue", function(obj){
            obj["queue"].splice(index, 1);
            chrome.storage.local.set(obj);
        });
    }

    // remove all elements from queue
    function resetQueue() {
        chrome.storage.local.set({"queue" : []});
    }

    // Change the format of a hme page video to the sidebar video type
    function toVideoQueueFormat(video) {
        var vid = $(video);

        var link = vid.find("a.spf-link").attr("href");
        var link_split = link.split("=");
        var link_last = link_split[link_split - 1];

        var title = vid.find("a.yt-uix-sessionlink:eq(1)").text();
        var length = vid.find(".video-time").text();
        var img = vid.find(".yt-thumb-simple img").attr("src");
        var author_link = vid.find(".yt-lockup-byline a").attr("href");

        var author_name = vid.find(".yt-lockup-byline a").text();
        var views = vid.find(".yt-lockup-meta-info li").first().text();

        var list = author_link.split('/');
        var author_link_last = list[list.length - 1];

        var container = $("<div>").addClass("related-item-dismissable");
        var video_format = '<div class="related-item-dismissable"><div class="content-wrapper"><a href="" class=" content-link spf-link  yt-uix-sessionlink spf-link " data-sessionlink="" title="" rel="spf-prefetch" data-visibility-tracking=""><span dir="ltr" class="title" aria-describedby=""></span><span class="accessible-description" id="">- Duration: </span><span class="stat attribution"><span class="g-hovercard" data-name="relmfu" data-ytid=""></span></span><span class="stat view-count"></span></a></div><div class="thumb-wrapper"><a href="" class="thumb-link spf-link yt-uix-sessionlink spf-link" data-sessionlink="" tabindex="-1" rel="spf-prefetch" data-visibility-tracking="" aria-hidden="true"><span class="yt-uix-simple-thumb-wrap yt-uix-simple-thumb-related" tabindex="0" data-vid=""><img height="94" alt="" src="" width="168" style="top: 0px" aria-hidden="true"></span></a><span class="video-time"></span><button class="yt-uix-button yt-uix-button-size-small yt-uix-button-default yt-uix-button-empty yt-uix-button-has-icon no-icon-markup addto-button video-actions spf-nolink hide-until-delayloaded addto-watch-later-button yt-uix-tooltip" type="button" onclick=";return false;" title="Watch Later" role="button" data-video-ids=""></button><span class="thumb-menu dark-overflow-action-menu video-actions"><button onclick=";return false;" aria-expanded="false" type="button" class="yt-uix-button-reverse flip addto-watch-queue-menu spf-nolink hide-until-delayloaded yt-uix-button yt-uix-button-dark-overflow-action-menu yt-uix-button-size-default yt-uix-button-has-icon no-icon-markup yt-uix-button-empty" aria-haspopup="true"><span class="yt-uix-button-arrow yt-sprite"></span><ul class="watch-queue-thumb-menu yt-uix-button-menu yt-uix-button-menu-dark-overflow-action-menu hid"><li role="menuitem" class="overflow-menu-choice addto-watch-queue-menu-choice addto-watch-queue-play-next yt-uix-button-menu-item" data-action="play-next" onclick=";return false;" data-video-ids=""><span class="addto-watch-queue-menu-text">Play next</span><button class="yt-ui-menu-item yt-uix-menu-close-on-select btn-queue">Add to Queue</button></li><li role="menuitem" class="overflow-menu-choice addto-watch-queue-menu-choice addto-watch-queue-play-now yt-uix-button-menu-item" data-action="play-now" onclick=";return false;" data-video-ids=""><span class="addto-watch-queue-menu-text">Play now</span><button class="yt-ui-menu-item yt-uix-menu-close-on-select btn-queue">Add to Queue</button></li></ul></button></span><button class="yt-uix-button yt-uix-button-size-small yt-uix-button-default yt-uix-button-empty yt-uix-button-has-icon no-icon-markup addto-button addto-queue-button video-actions spf-nolink hide-until-delayloaded addto-tv-queue-button yt-uix-tooltip" type="button" onclick=";return false;" title="Queue" data-video-ids="" data-style="tv-queue"></button></div><div class="yt-uix-menu-container related-item-action-menu"><div class="yt-uix-menu yt-uix-menu-flipped hide-until-delayloaded">  <button class="yt-uix-button yt-uix-button-size-default yt-uix-button-action-menu yt-uix-button-empty yt-uix-button-has-icon no-icon-markup  yt-uix-menu-trigger" type="button" onclick=";return false;" aria-pressed="false" role="button" aria-haspopup="true" aria-label="Action menu."><span class="yt-uix-button-arrow yt-sprite"></span></button><div class="yt-uix-menu-content yt-ui-menu-content yt-uix-menu-content-hidden" role="menu"><ul><li role="menuitem"><div class="service-endpoint-action-container hid"><div class="service-endpoint-replace-enclosing-action-notification hid"><div class="replace-enclosing-action-message"><span aria-label="Video removed: ">Video removed.</span></div><div class="replace-enclosing-action-options"><button class="yt-uix-button yt-uix-button-size-default yt-uix-button-link undo-replace-action" type="button" onclick=";return false;" data-feedback-token=""><span class="yt-uix-button-content">Undo</span></button></div></div></div><button type="button" class="yt-ui-menu-item yt-uix-menu-close-on-select  dismiss-menu-choice" data-feedback-token="AB9zfpLaYZ15WCaqec5GSBBtKIPXKM3tSHnEX-G3CDrGFJ-4YYbyznn5myC7HdFfP5WI0og64b7YkNA495Ym_sQ13p1cWmzotrPdfyDxJxPGI8jBtMiSaW7O9KOr2n3zG3gfj5oCKqlP" data-innertube-clicktracking="CCoQpDAYASITCPP_nNCOiNECFUrAnAodqtQEMSj4HQ" data-action="replace-enclosing-action"><span class="yt-ui-menu-item-label">Not interested</span></button><button class="yt-ui-menu-item yt-uix-menu-close-on-select btn-queue">Add to Queue</button></li></ul></div></div></div></div>'

        var template = $.parseHTML(video_format);
        container.append(template)
        var t = $(container);


        t.find(".content-link").attr("href", link).attr("title", title);
        t.find("span.title").text(title);
        t.find(".accessible-description").text("- Duration: " + length + ".");
        t.find(".g-hovercard").data("ytid", author_link_last).text(author_name);
        t.find("span.view-count").text(views);
        t.find(".thumb-link").attr("href", link);
        t.find(".yt-uix-simple-thumb-wrap").data("vid", link_last);
        t.find(".yt-uix-simple-thumb-wrap img").attr("src", img);
        t.find(".video-time").text(length);
        t.find(".addto-watch-later-button").data("video-ids", link_last);
        t.find(".addto-queue-button").data("video-ids", link_last);

        return t;
    }


    // TODO

    // BUG: If they aren't logged in, the video's don't get the menu options

    // turn home page video to queue video format
        // if the video is from the homepage then a different selector is used
        // this video also has to be able to be moved to the sidebar format.
        // then a video can be saved

    // Make videos draggable

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








    // var li = $("<li>").addClass("video-list-item related-list-item related-list-item-compact-video");
    // var related_item-dismissable = $("<div>").addClass("related-item-dismissable");
    // var content_wrapper = $("<div>").addClass("content-wrapper");
    // var content_link = $("<a>").addClass("content-link spf-link yt-uix-sessionlink spf-link").attr({
    //   href: link,
    //   rel: "spf-prefetch",
    //   title: title
    // });
    // var title_span = $("<span>").attr("dir", "ltr").addClass("title").text(title);
    //
    // var span_attr = $("<span>").addClass("stat attribution");
    // var inner_span_attr = $("<span>").addClass("g-hovercard").attr({
    //     "data-name": "related",
    //     "data-ytid": author_link_last
    // }).text(author_name);
    //
    // var span_views = $("<span>").addClass("stat view-count").text(views);

});
