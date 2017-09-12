define([
    'core/js/adapt',
    'core/js/views/menuView',
    './adapt-cover-extensions'
], function(Adapt, MenuView, CoverExtensions) {

    // once we return to the menu from a page we do not want to see the intro screen
    var doNotShowIntro = false;

    var CoverView = MenuView.extend({

        events:{
            "click .menu-reveal-items":"revealItems",
            "click .menu-item-control-left":"navigateLeft",
            "click .menu-item-control-right":"navigateRight",
            "click .menu-item-intro": "navigateToIntro"
        },

        preRender: function() {
            var nthChild = 0;
            this.model.getChildren().each(function(item) {
                if(item.get('_isAvailable')) {
                    var assessmentArticle = item.getChildren().find(function(article) {
                        return article.has('_assessment');
                    });

                    var isAssessment = assessmentArticle !== undefined;
                    if (isAssessment) {
                        var scoreAsPercentage = assessmentArticle.get('_isAssessmentComplete') ? assessmentArticle.get('_lastAttemptScoreAsPercent') : null;
                        var hasScore = (scoreAsPercentage !== null && !isNaN(scoreAsPercentage));
                        item.set("_assessment", {
                            isComplete : assessmentArticle.has('_isAssessmentComplete') ? assessmentArticle.get('_isAssessmentComplete') : false,
                            hasScore: hasScore,
                            scoreAsPercentage : scoreAsPercentage,
                            isPassed : assessmentArticle.has('_isPass') ? assessmentArticle.get('_isPass') : false
                        });
                    }

                    if (!item.checkLocking) {// fall back to use internal locking logic if Adapt 2.0.9 or earlier
                        item.set("_isLocked", false);
                        if (item.get("_lock")) {
                            var contentObjects = item.get("_lock");
                            var completeCount = 0;
                            for( var i = 0; i < contentObjects.length; i++) {
                                if (Adapt.contentObjects.findWhere({_id:contentObjects[i]}).get("_isComplete")) {
                                    completeCount++;
                                }
                            }
                            if (completeCount < contentObjects.length) {
                                item.set("_isLocked", true);
                            }
                        }
                    }
                }
            });

            MenuView.prototype.preRender.call(this);
            this.listenTo(Adapt, "indicator:clicked", this.navigateToCurrentIndex);
        },

        postRender: function() {
            this.listenTo(Adapt, "device:resize", this.setupLayout);

            var nthChild = 0;
            this.model.getChildren().each(_.bind(function(item) {
                if(item.get('_isAvailable')) {
                    this.renderMenuItems(item, ++nthChild);
                    if(Adapt.config.get('_audio') && Adapt.config.get('_audio')._isEnabled) {
                        this.renderAudioItems(item);
                    }
                }
            }, this));

            this.setupLayout();
            this.listenTo(Adapt, "menuView:ready", this.setupNavigation);
        },

        renderMenuItems: function(item, nthChild) {
            item.set({ '_nthChild':nthChild, '_siblingsLength': this.model.getChildren().models.length });

            this.$('.menu-item-container-inner').append(new CoverItemView({model:item}).$el);
            this.$('.menu-item-indicator-container-inner').append(new CoverItemIndicatorView({model:item}).$el);
        },

        renderAudioItems: function(item) {
            if(item.get('_audio') && item.get('_audio')._isEnabled) {
                this.$('.menu-item-'+item.get("_id")).prepend(new CoverItemAudioView({model:item}).$el);
            }
        },

        setupLayout: function() {
          this.model.set('_marginDir', 'left');
          if (Adapt.config.get('_defaultDirection') == 'rtl') {
              this.model.set('_marginDir', 'right');
          }

            var width = $("#wrapper").width();
            var height = $(window).height() - $(".navigation").height();
            this.model.set({ width: width });
            this.$(".menu-intro-screen").css({
                width: width,
                height: height
            });
            this.$('.menu-item-container-inner').css({
                width: width * this.model.getChildren().length + "px",
                height: height +"px"
            });

            this.$('.menu-item-container-inner').css(('margin-' + this.model.get('_marginDir')), margin);

            $(".menu").css({
                height: height,
                overflow: "hidden"
            });
            if(!this.model.get('_showIntro')) {
                this.revealItems();
            }
            doNotShowIntro = true;
            this.setupNavigation();
        },

        setupNavigation: function() {
            if(!this.model.get("_coverIndex")) {
                this.model.set({ _coverIndex: 0 });
                this.navigateToCurrentIndex(this.model.get("_coverIndex"));
            } else if(this.model.get("_coverIndex")) {
                this.navigateToCurrentIndex(this.model.get("_coverIndex"));
            }
        },

        navigateToCurrentIndex: function(index) {
            this.$('.menu-item-container-inner').velocity({
                marginLeft:-(index * this.model.get("width")) + "px"
            });
            this.model.set({ _coverIndex: index });
            Adapt.trigger("cover:navigate", this.model.get("_coverIndex"));
            this.configureNavigationControls(index);
        },

        navigateToIntro: function(event) {
            if(event) event.preventDefault();
            Adapt.navigateToElement(Adapt.course.get("_start")._id, "contentObjects");
        },

        configureNavigationControls: function(index) {
            if(index === 0) {
                this.$(".menu-item-control-left").addClass("menu-item-control-hide");
                this.$(".menu-item-control-right").removeClass("menu-item-control-hide");
            } else if(index == this.model.getChildren().length - 1) {
                this.$(".menu-item-control-left").removeClass("menu-item-control-hide");
                this.$(".menu-item-control-right").addClass("menu-item-control-hide");
            } else {
                this.$(".menu-item-control").removeClass("menu-item-control-hide");
            }
        },

        navigateLeft: function(event) {
            if(event) event.preventDefault();

            var currentIndex = this.model.get("_coverIndex");
            currentIndex--;

            this.configureNavigationControls(currentIndex);

            this.model.set({ _coverIndex: currentIndex });

            this.$('.menu-item-container-inner').velocity({
                marginLeft:-(this.model.get("_coverIndex") * this.model.get("width")) + "px"
            });

            Adapt.trigger("cover:navigate", this.model.get("_coverIndex"));
        },

        navigateRight: function(event) {
            if(event) event.preventDefault();

            var currentIndex = this.model.get("_coverIndex");
            currentIndex++;

            this.configureNavigationControls(currentIndex);

            this.model.set({ _coverIndex: currentIndex });

            this.$('.menu-item-container-inner').velocity({
                marginLeft:-(this.model.get("_coverIndex") * this.model.get("width")) + "px"
            });

            Adapt.trigger("cover:navigate", this.model.get("_coverIndex"));
        },

        revealItems: function(event) {
            if(event) event.preventDefault();

            this.$(".menu-intro-screen").velocity({
                top:"-100%"
            }, event ? 1000 : 0);
            this.$(".menu-item-container").velocity({
                opacity:1
            }, event ? 1000 : 0);

            Adapt.trigger("cover:revealed");
        },

        coverItemIndicatorClicked: function(index) {
            this.navigateToCurrentIndex(index);
        }

    }, {
        template:'cover'
    });

    var CoverItemView = MenuView.extend({

        events:{
            'click button' : 'onClickMenuItemButton'
        },

        className: function() {
            return [
                'menu-item',
                'menu-item-' + this.model.get('_id') ,
                this.model.get('_isLocked') ? 'locked' : '',
                'nth-child-' + this.model.get('_nthChild'),
                this.model.get('_nthChild') % 2 === 0  ? 'nth-child-even' : 'nth-child-odd'
            ].join(' ');
        },

        preRender: function() {
            this.listenTo(Adapt, "device:resize", this.setupItemLayout);
            if (!this.model.get('_isVisited')) {
                this.setVisitedIfBlocksComplete();
            }

            $(".menu-item").find(".page-level-progress-menu-item-indicator-bar .aria-label").attr('tabindex', -1);
        },

        postRender: function() {
            this.setupItemLayout();
            this.setBackgroundImage();
        },

        setVisitedIfBlocksComplete: function() {
            var completedBlock = this.model.findDescendants('components').findWhere({_isComplete: true, _isOptional: false});
            if (completedBlock != undefined) {
                this.model.set('_isVisited', true);
            }
        },

        setupItemLayout: function() {
            var width = $("#wrapper").width();
            var height = $(window).height() - $(".navigation").height();
            $(".menu-item").css({
                width:width + "px",
                height:height + "px"
            });
        },

        setBackgroundImage: function() {
            if(this.model.get('_isLocked')) {
                $(".menu-item-" + this.model.get("_id")).css({
                    backgroundImage:"url(" + this.model.get("_coverMenuAudio")._backgroundGraphic.locked + ")"
                });
            } else {
                $(".menu-item-" + this.model.get("_id")).css({
                    backgroundImage:"url(" + this.model.get("_coverMenuAudio")._backgroundGraphic.src + ")"
                });
            }
        },

        onClickMenuItemButton: function(event) {
            if(event && event.preventDefault) event.preventDefault();
            if(this.model.get('_isLocked')) return;
            Backbone.history.navigate('#/id/' + this.model.get('_id'), {trigger: true});
        }

    }, {
        template:'cover-item'
    });

    var CoverItemAudioView = MenuView.extend({

        events:{
            'click .audio-toggle': 'toggleAudio'
        },

        className: "audio-controls",

        preRender: function() {
            this.listenTo(Adapt, 'audio:updateAudioStatus', this.updateToggle);
        },

        postRender: function() {
            this.audioChannel = this.model.get('_coverMenuAudio')._audio._channel;
            this.elementId = this.model.get("_id");
            // Hide controls
            if(this.model.get('_coverMenuAudio')._audio._showControls==false){
                this.$('.audio-toggle').addClass('hidden');
            }
            try {
                this.audioFile = this.model.get("_coverMenuAudio")._audio._media.src;
            } catch(e) {
                console.log('An error has occured loading audio');
            }
            // Hide icon if audio is turned off
            if(Adapt.audio.audioClip[this.audioChannel].status==0){
                this.$('.audio-toggle').addClass('hidden');
            }
            // Set clip ID
            Adapt.audio.audioClip[this.audioChannel].newID = this.elementId;
        },

        onAudioEnded: function() {
            Adapt.trigger('audio:audioEnded', this.audioChannel);
        },

        toggleAudio: function(event) {
            if (event) event.preventDefault();

            if ($(event.currentTarget).hasClass('playing')) {
                Adapt.trigger('audio:pauseAudio', this.audioChannel);
            } else {
                Adapt.trigger('audio:playAudio', this.audioFile, this.elementId, this.audioChannel);
            }
        },

        updateToggle: function(){
            if(Adapt.audio.audioStatus == 1 && this.model.get('_coverMenuAudio')._audio._showControls==true){
                this.$('.audio-toggle').removeClass('hidden');
            } else {
                this.$('.audio-toggle').addClass('hidden');
            }
        }

    }, {
        template:'cover-item-audio'
    });

    var CoverItemIndicatorView = MenuView.extend({

        className: function() {
            return [
                'menu-item-indicator',
                'menu-item-indicator-' + this.model.get('_id') ,
                'nth-child-' + this.model.get('_nthChild'),
                this.model.get('_nthChild') % 2 === 0  ? 'nth-child-even' : 'nth-child-odd'
            ].join(' ');
        },

        events: {
            "click .menu-item-indicator-graphic":"onItemClicked"
        },

        preRender: function() {
            this.listenTo(Adapt, "cover:navigate", this.handleNavigation);
            if (!this.model.get('_isComplete') && !this.model.get('_isVisited')) {
                this.setVisitedIfBlocksComplete();
            }

            var isCompletedAssessment = (this.model.get('_assessment') &&
                this.model.get('_assessment')._isComplete &&
                !this.model.get('_isComplete'));

            if (isCompletedAssessment) {
                this.model.set('_isComplete', true);
            }
        },

        setVisitedIfBlocksComplete: function() {
            var completedBlock = this.model.findDescendants('components').findWhere({_isComplete: true, _isOptional: false});
            if (completedBlock != undefined) {
                this.model.set('_isVisited', true);
            }
        },

        postRender: function() {
            var numItems = this.model.get('_siblingsLength');
            var width = 100 / numItems;

            this.$('.menu-item-indicator-graphic').imageready(_.bind(function() {
                Adapt.trigger("indicator:postRender");
                this.setReadyStatus();
            }, this));
        },

        onItemClicked: function(event) {
            if (event) event.preventDefault();
            if(this.model.get("_coverMenuAudio")._introItemGraphic.src) {
              Adapt.trigger("indicator:clicked", this.$el.index() - 1);
            } else {
              Adapt.trigger("indicator:clicked", this.$el.index());
            }
        },

        handleNavigation: function(index) {
          if(this.model.get("_coverMenuAudio")._introItemGraphic.src) {
            if (this.$el.index() == index + 1) {
                this.$el.addClass("selected");
            } else {
                this.$el.removeClass("selected");
            }
          } else {
            if (this.$el.index() == index) {
                this.$el.addClass("selected");
            } else {
                this.$el.removeClass("selected");
            }
          }
        }

    }, {
        template:'cover-item-indicator'
    });

    Adapt.once('router:page', function(model) {
        doNotShowIntro = true;
    });

    Adapt.on('router:menu', function(model) {
        // on course launch show intro screen if navigating directly to the menu
        model.set('_showIntro', !doNotShowIntro);

        $('#wrapper').append(new CoverView({model:model}).$el);
        new CoverAudioExtensions({model:model});
    });

    Adapt.on('menuView:postRender', function(view) {
        $('.navigation-back-button').addClass('display-none');
    });

});
