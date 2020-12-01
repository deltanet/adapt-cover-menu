define([
  'core/js/adapt',
  'core/js/views/menuView',
  'core/js/views/menuItemView'
], function(Adapt, MenuView, MenuItemView) {

  var CoverItemIndicatorView = MenuView.extend({

    events: {
      'click .covermenu-item__indicator-graphic': 'onItemClicked'
    },

    preRender: function() {
      this.listenTo(Adapt, {
        'remove': this.remove,
        'cover:navigate': this.handleNavigation
      });

      if (!this.model.get('_isComplete') && !this.model.get('_isVisited')) {
        this.setVisitedIfBlocksComplete();
      }

      var isCompletedAssessment = (this.model.get('_assessment') &&
        this.model.get('_assessment')._isComplete && !this.model.get('_isComplete'));
      if (isCompletedAssessment) {
        this.model.set('_isComplete', true);
      }
    },

    setVisitedIfBlocksComplete: function() {
      var completedBlock = _.findWhere(this.model.findDescendantModels('components'), {
        _isComplete: true,
        _isOptional: false
      });
      if (completedBlock != undefined) {
        this.model.set('_isVisited', true);
      }
    },

    postRender: function() {
      var numItems = this.model.get('_siblingsLength');
      var width = 100 / numItems;

      this.$('.covermenu-item__indicator-graphic').imageready(_.bind(function() {
        Adapt.trigger('indicator:postRender');
        this.setReadyStatus();
        Adapt.trigger('device:resize');
      }, this));
    },

    onItemClicked: function(event) {
      if (event) event.preventDefault();
      if (this.model.getParent().get('_coverMenuAudio')._introItemGraphic.src) {
        Adapt.trigger('indicator:clicked', this.$el.index() - 1);
      } else {
        Adapt.trigger('indicator:clicked', this.$el.index());
      }
    },

    handleNavigation: function(index) {
      if (this.model.getParent().get('_coverMenuAudio')._introItemGraphic.src) {
        if (this.$el.index() == index + 1) {
          this.$el.addClass('selected');
        } else {
          this.$el.removeClass('selected');
        }
      } else {
        if (this.$el.index() == index) {
          this.$el.addClass('selected');
        } else {
          this.$el.removeClass('selected');
        }
      }
    }

  }, {
    className: 'covermenu-item__indicator',
    template: 'cover-item-indicator'
  });

  return CoverItemIndicatorView;

});
