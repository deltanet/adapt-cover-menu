adapt-introcover-menu
===============

The intro cover menu is a carousel style menu with an introduction page. It also has an screen that hides the carousel until the user clicks the start button. The menu also includes indicators that show the current selected item, item progress and locked states. The indicators can also be used to navigate between the items.

Since the cover menu requires graphical assets to be present to function correctly, an asset pack is included with this menu to get you started quickly.

----------------------------
**Version number:**  1.0.1     
**Framework versions supported:**  2.0.0     
**Author / maintainer:** DeltaNet with [contributors](https://github.com/deltanet/adapt-introcover-menu/graphs/contributors)     
**Accessibility support:** no  
**RTL support:** no     
**Authoring tool support:** no

----------------------------

###Example JSON

Configuration options are explained below. The "_coverMenu" object replaces the "_graphic" object for each object in contentObjects.json that
appears on the menu.

Specify the introduction page and menu page in course.json.

```
"_introCover": {
    "_introScreen": true,
    "_introCoverIds": {
        "_intro": "co-05",
        "_menu": "co-10"
    }
}

```

In contentObjects.json, on each object to appear on the menu. This replaces the "_graphic" data object. The value for "_indicatorGraphic" sets the background graphic of the bottm menu items. Graphics are required for the various item states. Locked and accessibility are only required if the menu item has been setup to have that state.

The element "_backgroundGraphic" sets the background graphic of the item slide. Images are scaled up/down to fill.

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





