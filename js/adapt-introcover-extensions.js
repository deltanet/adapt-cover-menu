define(function(require) {

    var Backbone = require('backbone');
    var Adapt = require('coreJS/adapt');
    var MenuView = require('coreViews/menuView');

    /*use this view to add extra funcitonality to Cover*/

    var CoverExtensionsView = Backbone.View.extend({

    	initialize: function() {
    		this.collection = this.model.getChildren();
    		this.listenTo(Adapt, 'remove', this.remove);
    		this.listenTo(Adapt, "cover:revealed", this.itemsRevealed);
    		this.listenTo(Adapt, "cover:navigate", this.handleNavigation);
    	},

    	remove: function() {
    	    this.$el.remove();
    	    this.stopListening();
    	    return this;
    	},

    	/*handles event when menu intro start button is clicked and the menu items are revealed*/
    	itemsRevealed: function() {
    		//console.log("CoverExtensionsView::itemsRevealed");
    	},

    	/*handles navigation left/right event and navigate to current index*/
    	handleNavigation: function(index) {
    		this.currentItemInView(this.collection.models[index]);
    	},

    	/*handles when item is in view*/
    	currentItemInView: function(model) {
    		//console.log("CoverExtensionsView::currentItemInView:", model);
    		var $currentItemInView = $(".menu-item-" + this.model.get("_id"));
            $(".menu-item").removeClass("inview");
            $currentItemInView.addClass("inview");

            //AA
            $(".menu-item").find(".menu-item-route").attr('tabindex', -1);
            $currentItemInView.find(".menu-item-route").attr('tabindex', 0);

    	}

    });

    return CoverExtensionsView;

 });
