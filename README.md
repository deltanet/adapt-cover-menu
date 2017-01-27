###adapt-cover-menu-audio

The cover menu is a carousel style menu. It has an optional intro screen that hides the carousel until the user clicks the start button. The menu also includes indicators that show the current selected item, item progress and locked states. The indicators can also be used to navigate between the items.

Since the cover menu requires graphical assets to be present to function correctly, an asset pack is included with this menu to get you started quickly.

###Example JSON

Configuration options are explained below. The "_coverMenu" object replaces the "_graphic" object for each object in contentObjects.json that
appears on the menu.

```
"_coverMenu":{
    "_backgroundGraphic": {
        "alt": "This is a picture of Adapt's origami birds.",
        "src": "course/en/images/menu-item-one.jpg",
        "locked": "course/en/images/menu-item-locked.jpg"
    },
    "_indicatorGraphic": {
        "_isComplete": "course/en/images/origami-menu-three.jpg",
        "_isVisited": "course/en/images/origami-menu-two.jpg",
        "_isLocked":"course/en/images/origami-menu-one.jpg",
        "_default":"course/en/images/origami-menu-one.jpg",
        "_isPassed": "course/en/images/menu_tick.png",
        "_isFailed": "course/en/images/menu_cross.png",
        "_accessibilityEnabled": "course/en/images/origami-menu-one.jpg"
    },
    "_ariaLabels": {
        "menuItemPage": "Page one, tab to View button to enter.",
        "menuViewButton": "Select here to view page one."
    },
    "_audio": {
        "_isEnabled": true,
        "_showControls": true,
        "_autoplay": true,
        "_channel": 0,
        "_media": {
            "src": "course/en/audio/***.mp3"
        }
    }
}
```

###Config options

#####Background Graphic

```
"_backgroundGraphic": {
    "alt": "This is a picture of Adapt's origami birds.",
    "src": "course/en/images/menu-item-one.jpg"
 },
```

Set the background graphic of the item slide. Images are scaled up/down to fill.

####Indicators

```
"_indicatorGraphic": {
    "_isComplete": "course/en/images/menu_btn1_complete.png",
    "_isVisited": "course/en/images/menu_btn1_started.png",
    "_isLocked":"course/en/images/menu_padlock.png",
    "_default":"course/en/images/menu_btn1_notStarted.png",
    "_isPassed": "course/en/images/menu_tick.png",
    "_isFailed": "course/en/images/menu_cross.png",
    "_accessibilityEnabled": "course/en/images/menu_btn1_notStarted.png"
}
```

Graphics are required for the various item states. Locked and accessibility are only required if the menu item has been setup to have that state.

Specify the introduction page and menu page in course.json.

```
"_introCover": {
    "_introScreen": true
}

```

----------------------------
**Version number:**  2.0.7     
**Framework versions supported:**  2.0.0     
**Author / maintainer:** DeltaNet with [contributors](https://github.com/deltanet/adapt-cover-menu-audio/graphs/contributors)     
**Forked from:** City and Guilds Kineo [cgkineo/adapt-cover-menu](https://github.com/cgkineo/adapt-cover-menu)
**Accessibility support:** yes  
**RTL support:** no     
**Authoring tool support:** yes

----------------------------
