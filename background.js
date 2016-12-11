$(".yt-uix-button").click(function() {
    var menu = $(".yt-ui-menu-item-label");
    console.log(menu.find("li[role='menu-item']"))

    var button = $("<button>")
    button.addClass("yt-ui-menu-item")
    button.addClass("yt-uix-menu-close-on-select")
    button.addClass("dismiss-menu-choice")

    button.text("Add to Queue");
    menu.append(button);

})
