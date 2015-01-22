adapt-introcover-menu
===============

The intro cover menu is a carousel style menu with an introduction page. It also has an screen that hides the carousel until the user clicks the start button. The menu also includes indicators that show the current selected item, item progress and locked states. The indicators can also be used to navigate between the items.

Since the cover menu requires graphical assets to be present to function correctly, an asset pack is included with this menu to get you started quickly.

###Example JSON

Configuration options are explained below. The "_coverMenu" object replaces the "_graphic" object for each object in contentObjects.json that
appears on the menu.

Specify the introduction page and menu page in course.json.

```
"_coverMenu":{
    "_introItemGraphic": {
        "alt": "",
        "src": "course/en/images/retrnImage.png",
        "title": "Intro Page"
    }
}
```

In contentObjects.json, on each object to appear on the menu. This replaces the "_graphic" data object

```
"_coverMenu":{
    "_backgroundGraphic": {
        "alt": "This is a picture of Adapt's origami birds.",
        "src": "course/en/images/menu-item-one.jpg"
    },
    "_indicatorGraphic": {
        "_isComplete": "course/en/images/origami-menu-three.jpg",
        "_isVisited": "course/en/images/origami-menu-two.jpg",
        "_isLocked":"course/en/images/origami-menu-one.jpg",
        "_default":"course/en/images/origami-menu-one.jpg",
        "_accessibilityEnabled": "course/en/images/origami-menu-one.jpg"
    }
}
```

In contentObjects.json these values should be added to the cover menu object.

```
"_coverMenu":{
    "_introItemGraphic": {
        "alt": "",
        "src": "course/en/images/retrnImage.png",
        "title": "Intro Page"
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
    "_isComplete": "course/en/images/origami-menu-three.jpg",
    "_isVisited": "course/en/images/origami-menu-two.jpg",
    "_isLocked":"course/en/images/origami-menu-one.jpg",
    "_default":"course/en/images/origami-menu-one.jpg",
    "_accessibilityEnabled": "course/en/images/origami-menu-one.jpg"
}
```

Graphics are required for the various item states. Locked and accessibility are only required if the menu item has been setup to have that state.



