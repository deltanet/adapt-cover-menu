define([
  'core/js/adapt',
  'core/js/views/menuView',
  'core/js/views/menuItemView'
], function(Adapt, MenuView, MenuItemView) {

  var CoverIntroView = MenuView.extend({

    events: {
      'click .js-covermenu-reveal-btn': 'revealItems',
      'click .js-audio-toggle': 'toggleAudio'
    },

    postRender: function() {
      this.listenTo(Adapt, {
        'remove': this.remove,
        'popup:opened notify:opened': this.popupOpened,
        'audio:configured': this.audioConfigured,
        'audio:updateAudioStatus': this.updateToggle,
        'cover:hidden': this.hideItems,
        'device:resize': this.updateLayout
      });

      this.elementId = this.model.get('_id');
      this.audioModel = this.model.get('_coverMenuAudio')._audio;
      this.audioChannel = this.audioModel._channel;
      this.audioFile = this.audioModel._media.src;
      this.audioIcon = Adapt.audio.iconPlay;
      this.pausedTime = 0;

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

      if (!Adapt.audio.isConfigured) return;

      _.delay(function () {
        this.autoplayAudio();
      }.bind(this), 1000);
    },

    onAudioEnded: function() {
      Adapt.trigger('audio:audioEnded', this.audioChannel);
    },

    audioConfigured: function () {
      _.delay(function () {
        this.autoplayAudio();
      }.bind(this), 500);
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

    autoplayAudio: function () {
      // Check if audio is set to on
      if (Adapt.audio.audioClip[this.audioChannel].status == 1 && this.canAutoplay) {
        Adapt.trigger('audio:playAudio', this.audioFile, this.elementId, this.audioChannel);
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

    setupLayout: function() {
      var width = $('#wrapper').width();
      var height = $(window).height() - $('.navigation').height();

      this.$('.covermenu__intro').css({
        width: width,
        height: height
      });

      $('.menu__item-container').css({
        right: '100%'
      });
    },

    updateLayout: function() {
      var width = $('#wrapper').width();
      var height = $(window).height() - $('.navigation').height();

      this.$('.covermenu__intro').css({
        width: width,
        height: height
      });
    },

    revealItems: function(event) {
      if (event) event.preventDefault();

      this.$('.covermenu__intro').velocity({
        left: '-100%',
        opacity: 0
      }, 1000);

      $('.menu__item-container').velocity({
        right: 0
      }, 1000);
    },

    hideItems: function() {
      this.$('.covermenu__intro').velocity({
        left: 0,
        opacity: 1
      }, 1000);

      $('.menu__item-container').velocity({
        right: '100%'
      }, 1000);

      _.delay(function () {
        this.autoplayAudio();
      }.bind(this), 500);
    }

  }, {
    template: 'cover-intro'
  });

  return CoverIntroView;

});
