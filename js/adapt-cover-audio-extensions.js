define([
    'core/js/adapt'
], function(Adapt) {

    /*use this view to add extra funcitonality to Cover*/

    var CoverAudioExtensionsView = Backbone.View.extend({

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

        },

        /*handles navigation left/right event and navigate to current index*/
        handleNavigation: function(index) {
            this.currentItemInView(this.collection.models[index]);
        },

        /*handles when item is in view*/
        currentItemInView: function(model) {
            var $currentItemInView = $(".menu-item-" + model.get("_id"));

            $(".menu-item").removeClass("inview");
            $currentItemInView.addClass("inview");

            //AA
            const menuItem = $(".menu-item");
            $(".menu-item").find(".menu-item-route").attr('tabindex', -1);
            Adapt.a11y.toggleAccessible(menuItem.filter('.menu-item-title-inner'), false);
            Adapt.a11y.toggleAccessible(menuItem.filter('.menu-item-body-inner'), false);
            Adapt.a11y.toggleAccessible(menuItem.filter('.menu-item-duration-inner'), false);

            $(".menu-item").find(".page-level-progress-menu-item-indicator-bar .aria-label").attr('tabindex', -1);

            $currentItemInView.find(".menu-item-route").attr('tabindex', 0);
            Adapt.a11y.toggleAccessible($currentItemInView.filter('.menu-item-title-inner'), true);
            Adapt.a11y.toggleAccessible($currentItemInView.filter('.menu-item-body-inner'), true);
            Adapt.a11y.toggleAccessible($currentItemInView.filter('.menu-item-duration-inner'), true);

            $currentItemInView.find(".page-level-progress-menu-item-indicator-bar .aria-label").attr('tabindex', 0);
        }

    });

    return CoverAudioExtensionsView;

 });
