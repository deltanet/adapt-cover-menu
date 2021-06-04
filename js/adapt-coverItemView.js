define([
  'core/js/adapt',
  'core/js/views/menuItemView'
], function(Adapt, MenuItemView) {

  var CoverItemView = MenuItemView.extend({

    events: {
      'click .js-menu-item-click' : 'onClickMenuItemButton',
      'click .js-audio-toggle': 'toggleAudio'
    },

    preRender: function() {
      this.listenTo(Adapt, {
        'remove': this.remove,
        'device:resize': this.setupItemLayout
      });

      if (!this.model.get('_isVisited')) {
        this.setVisitedIfBlocksComplete();
      }
    },

    postRender: function() {
      this.setupItemLayout();
      this.setBackgroundImage();

      this.listenTo(Adapt, {
        'popup:opened notify:opened': this.popupOpened
      });

      if (Adapt.audio && this.model.get("_coverMenuAudio")._audio && this.model.get("_coverMenuAudio")._audio._isEnabled) {
        this.setupAudio();
      }
    },

    setupAudio: function() {
      this.listenTo(Adapt, {
        'audio:configured': this.audioConfigured,
        'audio:updateAudioStatus': this.updateToggle
      });

      this.listenToOnce(Adapt, 'remove', this.removeInViewListeners);

      this.elementId = this.model.get('_id');
      this.audioModel = this.model.get('_coverMenuAudio')._audio;
      this.audioChannel = this.audioModel._channel;
      this.audioFile = this.audioModel._media.src;
      this.audioIcon = Adapt.audio.iconPlay;
      this.pausedTime = 0;
      this.onscreenTriggered = false;
      this.popupIsOpen = false;

      // Autoplay
      if (Adapt.audio.autoPlayGlobal || this.audioModel._autoplay) {
        this.canAutoplay = true;
      } else {
        this.canAutoplay = false;
      }

      this.$('.audio__controls-icon').addClass(this.audioIcon);

      // Hide controls
      if (this.audioModel._showControls == false || Adapt.audio.audioClip[this.audioChannel].status == 0) {
        this.$('.audio__controls').hide();
      }

      // Set listener for when clip ends
      $(Adapt.audio.audioClip[this.audioChannel]).on('ended', _.bind(this.onAudioEnded, this));

      // Add inview listener on audio element
      if (!Adapt.audio.isConfigured) return;

      _.delay(function () {
        $('.covermenu-item__'+this.model.get('_id')).on('onscreen', this.onscreen.bind(this));
      }.bind(this), 1000);
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
      var width = $('.menu__item-container').width();
      var height = $(window).height() - $('.nav').height();
      $(this.el).css({
        width: width + 'px',
        height: height + 'px'
      });
    },

    setBackgroundImage: function() {
      if (this.model.get('_isLocked')) {
        $(this.el).css({
          backgroundImage: 'url(' + this.model.get('_coverMenuAudio')._backgroundGraphic.locked + ')'
        });
      } else {
        $(this.el).css({
          backgroundImage: 'url(' + this.model.get('_coverMenuAudio')._backgroundGraphic.src + ')'
        });
      }
    },

    onAudioEnded: function() {
      Adapt.trigger('audio:audioEnded', this.audioChannel);
    },

    popupOpened: function () {
      this.popupIsOpen = true;
    },

    audioConfigured: function () {
      _.delay(function () {
        this.popupIsOpen = false;
        $(this.el).on('onscreen', this.onscreen.bind(this));
      }.bind(this), 500);
    },

    onscreen: function (event, measurements) {
      if (this.popupIsOpen) return;

      var visible = this.model.get('_isVisible');
      var isOnscreenX = measurements.percentInviewHorizontal > 50;
      var isOnscreen = measurements.onscreen;

      // Check for element coming on screen
      if (visible && isOnscreen && isOnscreenX && this.canAutoplay && !this.onscreenTriggered) {
        // Check if audio is set to on
        if (Adapt.audio.audioClip[this.audioChannel].status == 1) {
          Adapt.trigger('audio:playAudio', this.audioFile, this.elementId, this.audioChannel);
        }
        // Set to true to stop onscreen looping
        this.onscreenTriggered = true;
      }

      // Check when element is off screen
      if (visible && !isOnscreenX) {
        this.onscreenTriggered = false;
        Adapt.trigger('audio:onscreenOff', this.elementId, this.audioChannel);
      }
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

    playAudio: function() {
      // iOS requires direct user interaction on a button to enable autoplay
      // Re-use code from main adapt-audio.js playAudio() function

      Adapt.trigger('media:stop');

      // Stop audio
      Adapt.audio.audioClip[this.audioChannel].pause();

      // Update previous player if there is one
      if (Adapt.audio.audioClip[this.audioChannel].playingID) {
        $('#'+Adapt.audio.audioClip[this.audioChannel].playingID).find('.audio__controls-icon').removeClass(Adapt.audio.iconPause);
        $('#'+Adapt.audio.audioClip[this.audioChannel].playingID).find('.audio__controls-icon').addClass(Adapt.audio.iconPlay);
        $('#'+Adapt.audio.audioClip[this.audioChannel].playingID).removeClass('playing');
      }

      this.$('.audio__controls-icon').removeClass(Adapt.audio.iconPlay);
      this.$('.audio__controls-icon').addClass(Adapt.audio.iconPause);
      this.$('.audio__controls').addClass('playing');

      Adapt.audio.audioClip[this.audioChannel].prevID = Adapt.audio.audioClip[this.audioChannel].playingID;
      Adapt.audio.audioClip[this.audioChannel].src = this.audioFile;
      Adapt.audio.audioClip[this.audioChannel].newID = this.elementId;

      if (Adapt.audio.pauseStopAction == 'pause') {
        Adapt.audio.audioClip[this.audioChannel].play(this.pausedTime);
        this.$('.audio__controls').attr('aria-label', $.a11y_normalize(Adapt.audio.pauseAriaLabel));
      } else {
        Adapt.audio.audioClip[this.audioChannel].play();
        this.$('.audio__controls').attr('aria-label', $.a11y_normalize(Adapt.audio.stopAriaLabel));
      }

      Adapt.audio.audioClip[this.audioChannel].onscreenID = this.elementId;
      Adapt.audio.audioClip[this.audioChannel].playingID = Adapt.audio.audioClip[this.audioChannel].newID;
      Adapt.audio.audioClip[this.audioChannel].isPlaying = true;
    },

    pauseAudio: function() {
      if (Adapt.audio.pauseStopAction == 'pause') {
        this.pausedTime = Adapt.audio.audioClip[this.audioChannel].currentTime;
        Adapt.audio.audioClip[this.audioChannel].pause();
        this.$('.audio__controls-icon').removeClass(Adapt.audio.iconPause);
        this.$('.audio__controls-icon').addClass(Adapt.audio.iconPlay);
        this.$('.audio__controls').removeClass('playing');
      } else {
        Adapt.trigger('audio:pauseAudio', this.audioChannel);
      }
      this.$('.audio__controls').attr('aria-label', $.a11y_normalize(Adapt.audio.playAriaLabel));
    },

    updateToggle: function() {
      if (Adapt.audio.audioClip[this.audioChannel].status == 1 && this.model.get('_coverMenuAudio')._audio._showControls == true) {
        this.$('.audio__controls').show();
      } else {
        this.$('.audio__controls').hide();
      }
    },

    removeInViewListeners: function () {
      $(this.el).off('onscreen');
    },

    onClickMenuItemButton: function(event) {
      if (event && event.preventDefault) event.preventDefault();
      if (this.model.get('_isLocked')) return;
      Backbone.history.navigate('#/id/' + this.model.get('_id'), {trigger: true});
    }

  }, {
    className: 'covermenu-item',
    template: 'cover-item'
  });

  return CoverItemView;

});
