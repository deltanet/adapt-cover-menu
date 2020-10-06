define([
  'core/js/adapt',
  'core/js/views/menuView',
  './adapt-cover-audio-extensions',
], function(Adapt, MenuView, CoverAudioExtensions) {

  var CoverView = MenuView.extend({

  events: {
      'click .menu-reveal-items': 'revealItems',
      'click .menu-item-control-left': 'navigateLeft',
      'click .menu-item-control-right': 'navigateRight',
      'click .menu-item-intro': 'hideItems'
    },

    preRender: function() {
      MenuView.prototype.preRender.call(this);
      this.listenTo(Adapt, 'indicator:clicked', this.navigateToCurrentIndex);
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
      this.renderAudio();
      this.setupLayout();
      this.listenTo(Adapt, 'pageView:ready menuView:ready', this.setupLegacyFocus);
      this.listenTo(Adapt, 'menuView:ready', this.setupNavigation);
      this.$el.addClass('cover-menu');

      if (this.model.get('_coverMenuAudio')._introScreen && !this.model.get('_revealedItems')) {
        this.$('.menu-item-container').velocity({
          opacity: 0
        }, 1000);
      }
    },

    renderMenuItems: function(item, nthChild) {
      item.set({
        '_nthChild': nthChild,
        '_siblingsLength': this.model.getChildren().models.length
      });

      this.$('.menu-item-container-inner').append(new CoverItemView({
        model: item
      }).$el);
      this.$('.menu-item-indicator-container-inner').append(new CoverItemIndicatorView({
        model: item
      }).$el);
    },

    renderAudio: function() {
      this.$('.menu-container').prepend(new CoverAudioView({
        model: this.model
      }).$el);
    },

    setupLayout: function() {
      this.model.set('_marginDir', 'left');
      if (Adapt.config.get('_defaultDirection') == 'rtl') {
        this.model.set('_marginDir', 'right');
      }

      var width = $('#wrapper').width();
      var height = $(window).height() - $('.navigation').height();
      this.model.set({
        width: width
      });

      var stage = this.model.get('_stage');
      var margin = -(stage * width);

      if (this.model.get('_coverMenuAudio')._introScreen) {
        this.$('.menu-intro-screen').css({
          width: width,
          height: height
        });
      } else {
        this.$('.menu-intro-screen').addClass('u-display-none');
      }

      this.$('.menu-item-container-inner').css({
        width: width * this.model.getChildren().length + 'px',
        height: (height - $('.menu-item-indicator-container').height()) + 'px'
      });

      this.$('.menu-item-container-inner').css(('margin-' + this.model.get('_marginDir')), margin);

      $('.menu').css({
        height: height,
        overflow: 'hidden'
      });

      if (this.model.get('_revealedItems')) {
        this.revealItems();
      }
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
      var movementSize = $('#wrapper').width();
      var marginDir = {};
      marginDir['margin-' + this.model.get('_marginDir')] = -(movementSize * index);
      this.$('.menu-item-container-inner').velocity('stop', true).velocity(marginDir);
      this.model.set({
        _coverIndex: index
      });
      Adapt.trigger('cover:navigate', this.model.get('_coverIndex'));
      this.configureNavigationControls(index);
    },

    configureNavigationControls: function(index) {
      if (index == 0) {
        this.$('.menu-item-control-left').addClass('menu-item-control-hide');
        this.$('.menu-item-control-right').removeClass('menu-item-control-hide');
      } else if (index == this.model.getChildren().length - 1) {
        this.$('.menu-item-control-left').removeClass('menu-item-control-hide');
        this.$('.menu-item-control-right').addClass('menu-item-control-hide');
      } else {
        this.$('.menu-item-control').removeClass('menu-item-control-hide');
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

    revealItems: function(event) {
      if (event) event.preventDefault();
      if (this.model.get('_revealedItems')) {
        this.$('.menu-intro-screen').css({
          top: '-100%'
        });
        this.$('.menu-item-container').css({
          opacity: 1
        });
      } else {
        this.$('.menu-intro-screen').velocity({
          top: '-100%'
        }, 1000);
        this.$('.menu-item-container').velocity({
          opacity: 1
        }, 1000);
      }
      this.model.set({
        _revealedItems: true
      });
      Adapt.trigger('cover:revealed');
    },

    hideItems: function(event) {
      if (event) event.preventDefault();

      this.$('.menu-intro-screen').velocity({
        top: '0'
      }, 1000);

      this.$('.menu-item-container').velocity({
        opacity: 0
      }, 1000);

      this.model.set({
        _revealedItems: false
      });
      Adapt.trigger('cover:hidden');
    },

    coverItemIndicatorClicked: function(index) {
      this.navigateToCurrentIndex(index);
    }

  }, {
    template: 'cover'
  });

  var CoverItemView = MenuView.extend({

    events: {
      'click button': 'onClickMenuItemButton'
    },

    className: function() {
      return [
        'menu-item',
        'menu-item-' + this.model.get('_id'),
        this.model.get('_isLocked') ? 'is-locked' : '',
        'nth-child-' + this.model.get('_nthChild'),
        this.model.get('_nthChild') % 2 === 0 ? 'nth-child-even' : 'nth-child-odd'
      ].join(' ');
    },

    preRender: function() {
      this.listenTo(Adapt, 'device:resize', this.setupItemLayout);
      if (!this.model.get('_isVisited')) {
        this.setVisitedIfBlocksComplete();
      }
    },

    postRender: function() {
      this.setupItemLayout();
      this.setBackgroundImage();
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

    setupItemLayout: function() {
      var width = $('#wrapper').width();
      var height = $(window).height() - $('.nav').height();
      $('.menu-item').css({
        width: width + 'px',
        height: height + 'px'
      });
    },

    setBackgroundImage: function() {
      if (this.model.get('_isLocked')) {
        $('.menu-item-' + this.model.get('_id')).css({
          backgroundImage: 'url(' + this.model.get('_coverMenuAudio')._backgroundGraphic.locked + ')'
        });
      } else {
        $('.menu-item-' + this.model.get('_id')).css({
          backgroundImage: 'url(' + this.model.get('_coverMenuAudio')._backgroundGraphic.src + ')'
        });
      }
    },

    onClickMenuItemButton: function(event) {
      if (event && event.preventDefault) event.preventDefault();
      if (this.model.get('_isLocked')) return;
      Backbone.history.navigate('#/id/' + this.model.get('_id'), {
        trigger: true
      });
    }

  }, {
    template: 'cover-item'
  });

  var CoverAudioView = MenuView.extend({

    events: {
      'click .audio-toggle': 'toggleAudio'
    },

    className: 'audio-controls',

    postRender: function() {
      this.listenTo(Adapt, {
        'cover:navigate': this.playItemAudio,
        'cover:revealed': this.autoplayAudio,
        'cover:hidden': this.autoplayAudio,
        'audio:configured': this.autoplayAudio,
        'audio:updateAudioStatus': this.updateToggle
      });

      this.elementId = this.model.get('_id');
      this.audioModel = this.model.get('_coverMenuAudio')._audio;
      this.audioChannel = this.audioModel._channel;
      this.audioFile = this.audioModel._media.src;
      Adapt.audio.audioClip[this.audioChannel].newID = this.elementId;
      Adapt.audio.audioClip[this.audioChannel].onscreenID = '';

      // Autoplay
      if (Adapt.audio.autoPlayGlobal || this.audioModel._autoplay) {
        this.canAutoplay = true;
      } else {
        this.canAutoplay = false;
      }

      this.$('.audio-toggle').addClass(Adapt.audio.iconPlay);

      // Hide controls
      if (this.audioModel._showControls == false || Adapt.audio.audioClip[this.audioChannel].status == 0) {
        this.$('.audio-inner button').hide();
      }

      // Set listener for when clip ends
      $(Adapt.audio.audioClip[this.audioChannel]).on('ended', _.bind(this.onAudioEnded, this));

      if (!Adapt.audio.isConfigured) return;

      this.autoplayAudio();
    },

    onAudioEnded: function() {
      Adapt.trigger('audio:audioEnded', this.audioChannel);
    },

    toggleAudio: function(event) {
      if (event) event.preventDefault();

      Adapt.audio.audioClip[this.audioChannel].onscreenID = '';
      if ($(event.currentTarget).hasClass('playing')) {
        this.pauseAudio();
      } else {
        this.playAudio();
      }
    },

    autoplayAudio: function() {
      if (this.model.get('_revealedItems')) {
        this.playItemAudio(this.model.get('_coverIndex'));
      } else {
        this.audioChannel = this.model.get('_coverMenuAudio')._audio._channel;
        this.audioFile = this.model.get('_coverMenuAudio')._audio._media.src;

        if (this.canAutoplay && Adapt.audio.audioClip[this.audioChannel].status == 1) {
          Adapt.audio.audioClip[this.audioChannel].onscreenID = '';
          Adapt.trigger('audio:playAudio', this.audioFile, this.elementId, this.audioChannel);
        }
      }
    },

    playAudio: function() {
      // iOS requires direct user interaction on a button to enable autoplay
      // Re-use code from main adapt-audio.js playAudio() function

      Adapt.trigger('media:stop');

      // Stop audio
      Adapt.audio.audioClip[this.audioChannel].pause();

      // Update previous player if there is one
      if (Adapt.audio.audioClip[this.audioChannel].playingID) {
        $('#' + Adapt.audio.audioClip[this.audioChannel].playingID).removeClass(Adapt.audio.iconPause);
        $('#' + Adapt.audio.audioClip[this.audioChannel].playingID).addClass(Adapt.audio.iconPlay);
        $('#' + Adapt.audio.audioClip[this.audioChannel].playingID).removeClass('playing');
      }

      this.$('.audio-toggle').removeClass(Adapt.audio.iconPlay);
      this.$('.audio-toggle').addClass(Adapt.audio.iconPause);
      this.$('.audio-toggle').addClass('playing');

      Adapt.audio.audioClip[this.audioChannel].prevID = Adapt.audio.audioClip[this.audioChannel].playingID;
      Adapt.audio.audioClip[this.audioChannel].src = this.audioFile;
      Adapt.audio.audioClip[this.audioChannel].newID = this.elementId;

      if (Adapt.audio.pauseStopAction == 'pause') {
        Adapt.audio.audioClip[this.audioChannel].play(this.pausedTime);
        this.$('.audio-toggle').attr('aria-label', $.a11y_normalize(Adapt.audio.pauseAriaLabel));
      } else {
        Adapt.audio.audioClip[this.audioChannel].play();
        this.$('.audio-toggle').attr('aria-label', $.a11y_normalize(Adapt.audio.stopAriaLabel));
      }

      Adapt.audio.audioClip[this.audioChannel].onscreenID = this.elementId;
      Adapt.audio.audioClip[this.audioChannel].playingID = Adapt.audio.audioClip[this.audioChannel].newID;
      Adapt.audio.audioClip[this.audioChannel].isPlaying = true;
    },

    pauseAudio: function() {
      if (Adapt.audio.pauseStopAction == 'pause') {
        this.pausedTime = Adapt.audio.audioClip[this.audioChannel].currentTime;
        Adapt.audio.audioClip[this.audioChannel].pause();
        this.$('.audio-toggle').removeClass(Adapt.audio.iconPause);
        this.$('.audio-toggle').addClass(Adapt.audio.iconPlay);
        this.$('.audio-toggle').removeClass('playing');
      } else {
        Adapt.trigger('audio:pauseAudio', this.audioChannel);
      }
      this.$('.audio-toggle').attr('aria-label', $.a11y_normalize(Adapt.audio.playAriaLabel));
    },

    updateToggle: function() {
      if (Adapt.audio.audioClip[this.audioChannel].status == 1 && this.model.get('_coverMenuAudio')._audio._showControls == true) {
        this.$('.audio-inner button').show();
      } else {
        this.$('.audio-inner button').hide();
      }
    },

    playItemAudio: function(index) {
      this.currentItemInView(this.model.getChildren().models[index]);
    },

    currentItemInView: function(model) {
      if (!this.model.get('_revealedItems')) return;

      this.audioChannel = model.get('_coverMenuAudio')._audio._channel;
      this.audioFile = model.get('_coverMenuAudio')._audio._media.src;

      if (model.get('_coverMenuAudio')._audio._isEnabled && model.get('_coverMenuAudio')._audio._autoplay) {
        if (Adapt.audio.audioClip[this.audioChannel].status == 1) {
          Adapt.audio.audioClip[this.audioChannel].onscreenID = '';
          Adapt.trigger('audio:playAudio', this.audioFile, this.elementId, this.audioChannel);
        }
      }
    }

  }, {
    template: 'cover-item-audio'
  });

  var CoverItemIndicatorView = MenuView.extend({

    className: function() {
      return [
        'menu-item-indicator',
        'menu-item-indicator-' + this.model.get('_id'),
        'nth-child-' + this.model.get('_nthChild'),
        this.model.get('_nthChild') % 2 === 0 ? 'nth-child-even' : 'nth-child-odd'
      ].join(' ');
    },

    events: {
      'click .menu-item-indicator-graphic': 'onItemClicked'
    },

    preRender: function() {
      this.listenTo(Adapt, 'cover:navigate', this.handleNavigation);
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

      this.$('.menu-item-indicator-graphic').imageready(_.bind(function() {
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
    template: 'cover-item-indicator'
  });

  Adapt.on('router:menu', function(model) {
    $('#wrapper').append(new CoverView({
      model: model
    }).$el);
    new CoverAudioExtensions({
      model: model
    });
  });

  Adapt.on('menuView:postRender', function(view) {
    $('.navigation-back-button').addClass('u-display-none');
  });

});
