define(function(require) {

    var Backbone = require('backbone');
    var Adapt = require('coreJS/adapt');
    var MenuView = require('coreViews/menuView');
    var CoverExtensions = require("menu/adapt-cover-menu/js/adapt-cover-extensions");
    
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

                    var isAssessment = assessmentArticle != undefined;
                    if (isAssessment) {
                        var scoreAsPercentage = assessmentArticle.get('_isAssessmentComplete')
                            ? assessmentArticle.get('_lastAttemptScoreAsPercent')
                            : null;
                        var hasScore = (scoreAsPercentage != null && !isNaN(scoreAsPercentage));
                        item.set("_assessment", { 
                            isComplete : assessmentArticle.has('_isAssessmentComplete')
                                ? assessmentArticle.get('_isAssessmentComplete')
                                : false,
                            hasScore: hasScore,
                            scoreAsPercentage : scoreAsPercentage,
                            isPassed : assessmentArticle.has('_isPass') 
                                ? assessmentArticle.get('_isPass') 
                                : false
                        });
                    }

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
            });

            MenuView.prototype.preRender.call(this);
            this.listenTo(Adapt, "indicator:clicked", this.navigateToCurrentIndex);
            this.listenTo(Adapt, "menuView:ready", this.setupIndicatorLayout);
        },
        
        postRender: function() {
            this.listenTo(Adapt, "device:resize", this.setupLayout);
            var nthChild = 0;
            this.model.getChildren().each(_.bind(function(item) {
                if(item.get('_isAvailable')) {
                    nthChild ++;
                    this.renderMenuItems(item, nthChild);
                }
            }, this));
            this.setupLayout();
            this.listenTo(Adapt, 'pageView:ready menuView:ready', this.setupLegacyFocus);
            this.$el.addClass('cover-menu');
        },

        renderMenuItems: function(item, nthChild) {
            item.set({'_nthChild':nthChild, '_siblingsLength':this.model.getChildren().models.length});

            this.$('.menu-item-container-inner').append(new CoverItemView({model:item}).$el);
            this.$('.menu-item-indicator-container-inner').append(new CoverItemIndicatorView({model:item}).$el);
        },

        setupLayout: function() {
            var width = $("#wrapper").width();
            var height = $(window).height() - $(".navigation").height();
            this.model.set({width:width});
            this.$(".menu-intro-screen").css({
                width:width,
                height:height
            });
            this.$('.menu-item-container-inner').css({
                width:width * this.model.getChildren().length + "px",
                height: (height -$(".menu-item-indicator-container").height()) +"px"
            });
            $(".menu").css({
                height:height,
                overflow:"hidden"
            });
            if(this.model.get("_revealedItems")) {
                this.revealItems();
            }
            this.setupNavigation();
        },

        setupNavigation: function() {
            if(!this.model.get("_coverIndex")) {
                this.model.set({_coverIndex:0});
                this.navigateToCurrentIndex(this.model.get("_coverIndex"));
            } else if(this.model.get("_coverIndex")) {
                this.navigateToCurrentIndex(this.model.get("_coverIndex"));
            }
        },

        navigateToCurrentIndex: function(index) {
            this.$('.menu-item-container-inner').velocity({
                marginLeft:-(index * this.model.get("width")) + "px"
            });
            this.model.set({_coverIndex:index});
            Adapt.trigger("cover:navigate", this.model.get("_coverIndex"));
            this.configureNavigationControls(index);
        },

        navigateToIntro: function(event) {
            if(event) event.preventDefault();
            Adapt.navigateToElement(Adapt.course.get("_locationIds")._intro, "contentObjects");
        },

        configureAccessibilityTabbing: function(index) {
            if ($('html').hasClass('accessibility')) {
                this.$(".menu-item-control").addClass("menu-item-control-hide").attr('tabindex', -1);
                $('.menu-item-indicator').attr('tabindex', -1);
            } else {
                this.configureNavigationControls(index);
            }
        },

        configureNavigationControls: function(index) {
            if(index == 0) {
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
            this.model.set({_coverIndex:currentIndex});
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
            this.model.set({_coverIndex:currentIndex});
            this.$('.menu-item-container-inner').velocity({
                marginLeft:-(this.model.get("_coverIndex") * this.model.get("width")) + "px"
            });
            Adapt.trigger("cover:navigate", this.model.get("_coverIndex"));
        },

        revealItems: function(event) {
            if(event) event.preventDefault();
            if(this.model.get("_revealedItems")) {
                this.$(".menu-intro-screen").css({
                    top:"-100%"
                });
                this.$(".menu-item-container").css({
                    opacity:1
                });
            } else {
                this.$(".menu-intro-screen").velocity({
                    top:"-100%"
                }, 1000);
                this.$(".menu-item-container").velocity({
                    opacity:1
                }, 1000);
            }
            this.model.set({_revealedItems: true})
            Adapt.trigger("cover:revealed");
        },

        coverItemIndicatorClicked: function(index) {
            this.navigateToCurrentIndex(index);
        }

    }, {
        template:'cover'
    });

    var CoverItemView = MenuView.extend({

        className: function() {
            return [
                'menu-item',
                'menu-item-' + this.model.get('_id') ,
                'nth-child-' + this.model.get('_nthChild'),
                this.model.get('_nthChild') % 2 === 0  ? 'nth-child-even' : 'nth-child-odd'
            ].join(' ');
        },

        preRender: function() {
            this.listenTo(Adapt, "device:resize", this.setupItemLayout);
        },

        postRender: function() {
            this.setupItemLayout();
            this.setBackgroundImage();
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
            $(".menu-item-" + this.model.get("_id")).css({
                backgroundImage:"url(" + this.model.get("_coverMenu")._backgroundGraphic.src + ")"
            });
        }

    }, {
        template:'cover-item'
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

            var isCompletedAssessment = (this.model.get('_assessment') 
                    && this.model.get('_assessment')._isComplete && !this.model.get('_isComplete'));
            if (isCompletedAssessment) {
                this.model.set('_isComplete', true);
            }
        },

        setVisitedIfBlocksComplete: function() {
            var completedBlock = this.model.findDescendants('blocks').findWhere({'_isComplete': true});
            if (completedBlock != undefined) {
                this.model.set('_isVisited', true);  
            } 
        },

        postRender: function() {
            var numItems = this.model.get('_siblingsLength');
            var width = 100 / numItems;
            $(".menu-item-indicator").css({
                width: width + "%"
            });
            this.$('.menu-item-indicator-graphic').imageready(_.bind(function() {
                Adapt.trigger("indicator:postRender");
                this.setReadyStatus();
            }, this));
        },

        onItemClicked: function(event) {
            if (event) event.preventDefault();
            Adapt.trigger("indicator:clicked", this.$el.index());
        },

        handleNavigation: function(index) {
            if (this.$el.index() == index) {
                this.$el.addClass("selected");
            } else {
                this.$el.removeClass("selected");
            }
        }

    }, {
        template:'cover-item-indicator'
    });
    
    Adapt.on('router:menu', function(model) {
        $('#wrapper').append(new CoverView({model:model}).$el);
        new CoverExtensions({model:model});
    });
    
});