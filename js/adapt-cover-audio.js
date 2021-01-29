define([
  'core/js/adapt',
  'core/js/views/menuView',
  './adapt-coverIntroView',
  './adapt-coverItemView',
  './adapt-coverItemIndicatorView'
], function(Adapt, MenuView, CoverIntroView, CoverItemView, CoverItemIndicatorView) {

  var CoverView = MenuView.extend({

  events: {
      'click .covermenu__control-left': 'navigateLeft',
      'click .covermenu__control-right': 'navigateRight',
      'click .js-covermenu-intro-btn': 'hideItems'
    },

    initialize: function() {
      MenuView.prototype.initialize.apply(this);

      this.listenTo(Adapt, {
        'menuView:ready': this.setupNavigation,
        'indicator:clicked': this.navigateToCurrentIndex
      });
    },

    postRender: function() {
      this.listenTo(Adapt, 'device:resize', this.setupLayout);
      var nthChild = 0;
      this.model.getChildren().each(_.bind(function(item) {
        if (item.get('_isAvailable')) {
          nthChild++;
          this.renderMenuItems(item, nthChild);
        }
      }, this));

      this.setupLayout();

      if (this.model.get('_coverMenuAudio')._introScreen && !this.model.get('_revealedItems')) {

        $(this.el).prepend(new CoverIntroView({
          model: this.model
        }).$el);

        this.model.set({
          _revealedItems: true
        });

      } else {
        this.model.set({
          _revealedItems: true
        });
      }
    },

    renderMenuItems: function(item, nthChild) {
      item.set({
        '_nthChild': nthChild,
        '_siblingsLength': this.model.getChildren().models.length
      });

      this.$('.menu__item-container-inner').append(new CoverItemView({
        model: item
      }).$el);

      this.$('.covermenu-item__indicator-container-inner').append(new CoverItemIndicatorView({
        model: item
      }).$el);
    },

    setupLayout: function() {
      this.model.set('_marginDir', 'left');
      if (Adapt.config.get('_defaultDirection') == 'rtl') {
        this.model.set('_marginDir', 'right');
      }

      var width = this.$('.menu__item-container').width();
      var height = $(window).height() - $('.nav').height();
      this.model.set({
        width: width
      });

      var stage = this.model.get('_stage');
      var margin = -(stage * width);

      this.$('.menu__item-container-inner').css({
        width: width * this.model.getChildren().length + 'px',
        height: (height - $('.covermenu-item__indicator-container').height()) + 'px'
      });

      this.$('.menu__item-container-inner').css(('margin-' + this.model.get('_marginDir')), margin);

      $('.menu').css({
        height: height,
        overflow: 'hidden'
      });

      this.setupNavigation();
    },

    setupNavigation: function() {
      if (!this.model.get('_coverIndex')) {
        this.model.set({
          _coverIndex: 0
        });
        this.navigateToCurrentIndex(this.model.get('_coverIndex'));
      } else if (this.model.get('_coverIndex')) {
        this.navigateToCurrentIndex(this.model.get('_coverIndex'));
      }
    },

    navigateToCurrentIndex: function(index) {
      var movementSize = this.$('.menu__item-container').width();
      var marginDir = {};
      marginDir['margin-' + this.model.get('_marginDir')] = -(movementSize * index);
      this.$('.menu__item-container-inner').velocity('stop', true).velocity(marginDir);
      this.model.set({
        _coverIndex: index
      });
      Adapt.trigger('cover:navigate', this.model.get('_coverIndex'));
      this.configureNavigationControls(index);
    },

    configureNavigationControls: function(index) {
      if (index == 0) {
        this.$('.covermenu__control-left').addClass('u-display-none');
        this.$('.covermenu__control-right').removeClass('u-display-none');
      } else if (index == this.model.getChildren().length - 1) {
        this.$('.covermenu__control-left').removeClass('u-display-none');
        this.$('.covermenu__control-right').addClass('u-display-none');
      } else {
        this.$('.covermenu__control').removeClass('u-display-none');
      }
    },

    navigateLeft: function(event) {
      if (event) event.preventDefault();
      var currentIndex = this.model.get('_coverIndex');
      currentIndex--;
      this.configureNavigationControls(currentIndex);
      this.model.set({
        _coverIndex: currentIndex
      });
      this.navigateToCurrentIndex(this.model.get('_coverIndex'));
    },

    navigateRight: function(event) {
      if (event) event.preventDefault();
      var currentIndex = this.model.get('_coverIndex');
      currentIndex++;
      this.configureNavigationControls(currentIndex);
      this.model.set({
        _coverIndex: currentIndex
      });
      this.navigateToCurrentIndex(this.model.get('_coverIndex'));
    },

    hideItems: function(event) {
      if (event) event.preventDefault();
      Adapt.trigger('cover:hidden');
    },

  }, {
    className: 'covermenu',
    template: 'cover'
  });

  Adapt.on('router:menu', function(model) {
    $('#wrapper').append(new CoverView({
      model: model
    }).$el);
  });

  Adapt.on('menuView:postRender', function(view) {
    $('.nav__back-btn').addClass('u-display-none');
  });

});
