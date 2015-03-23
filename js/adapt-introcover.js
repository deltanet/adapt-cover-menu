/*
* Intro Cover Menu
* License - https://github.com/deltanet/adapt-introcover-menu/blob/master/LICENSE
* Maintainers - Salamat Ali, Dan Gray (dan@delta-net.co.uk)
*/


define(function(require) {

    var Backbone = require('backbone');
    var Adapt = require('coreJS/adapt');
    var MenuView = require('coreViews/menuView');
    var CoverExtensions = require("menu/adapt-introcover-menu/js/adapt-introcover-extensions");
    
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
                    var assessment = _.find(item.getChildren().toJSON(), function(it) { return typeof it._assessment !== "undefined"; } );
                    if (assessment != undefined && typeof assessment.assessmentModel != "undefined") {
                        var scoreAsPercentage = (Adapt.course.get('_isAssessmentAttemptComplete')) ? assessment.assessmentModel.getLastAttemptScoreAsPercent(): null;
                        var hasScore = (scoreAsPercentage != null && !isNaN(scoreAsPercentage));
                        item.set("_assessment", { 
                            isComplete : (typeof Adapt.course.get('_isAssessmentAttemptComplete') !== "undefined")
                                ? Adapt.course.get('_isAssessmentAttemptComplete')
                                : false,
                            hasScore: hasScore,
                            scoreAsPercentage : scoreAsPercentage,
                            isPassed : (typeof Adapt.course.get('_isAssessmentPassed') !== "undefined") ? Adapt.course.get('_isAssessmentPassed') : false
                        });
                    }
                    item.set("_isLocked", false);
                    if (item.get("_lock")) {
                        var contentObjects = item.get("_lock");
                        var completeCount = 0;
                        for( var i = 0; i < contentObjects.length; i++) if (Adapt.contentObjects.findWhere({_id:contentObjects[i]}).get("_isComplete")) completeCount++;
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
        },

        renderMenuItems: function(item, nthChild) {
            this.$('.menu-item-container-inner').append(new CoverItemView({
                model:item, 
                nthChild:nthChild
            }).$el);
            var siblingsLength = this.model.getChildren().models.length;
            this.$('.menu-item-indicator-container-inner').append(new CoverItemIndicatorView({
                model:item, 
                nthChild:nthChild,
                siblingsLength:siblingsLength
            }).$el);
        },

        setupLayout: function() {
            var width = $("#wrapper").width();
            var height = $(window).height() - $(".navigation").height();
            this.model.set({width:width});
            if (Adapt.course.get("_introCover")._introScreen) {
                this.$(".menu-intro-screen").css({
                    width:width,
                    height:height
                });  
            } else {
                this.$(".menu-intro-screen").addClass('display-none');
            }

            this.$('.menu-item-container-inner').css({
                width:width * this.model.getChildren().length + "px",
                height: (height -$(".menu-item-indicator-container").height()) +"px"
            });
            $(".menu").css({
                height:height,
                overflow:"hidden"
            });
            if(this.model.get("_revealedItems") && Adapt.course.get("_introCover")._introScreen) {
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
            Adapt.navigateToElement(Adapt.course.get("_introCover")._introCoverIds._intro, "contentObjects");
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
                'nth-child-' + this.options.nthChild,
                this.options.nthChild % 2 === 0  ? 'nth-child-even' : 'nth-child-odd'
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
            if (this.model.get("_id") !== Adapt.course.get("_introCover")._introCoverIds._intro && this.model.get("_id") !== Adapt.course.get("_introCover")._introCoverIds._menu) {
                $(".menu-item-" + this.model.get("_id")).css({
                    backgroundImage:"url(" + this.model.get("_coverMenu")._backgroundGraphic.src + ")"
                });
            }
        }

    }, {
        template:'cover-item'
    });

    var CoverItemIndicatorView = MenuView.extend({

        className: function() {
            return [
                'menu-item-indicator',
                'menu-item-indicator-' + this.model.get('_id') ,
                'nth-child-' + this.options.nthChild,
                this.options.nthChild % 2 === 0  ? 'nth-child-even' : 'nth-child-odd'
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
            if (this.model.get('_assessment') && Adapt.course.get('_isAssessmentAttemptComplete') && !this.model.get('_isComplete')) {
                this.model.set('_isComplete', true);
            }
        },

        setVisitedIfBlocksComplete: function() {
            var completedBlock = this.model.findDescendants('blocks').findWhere({'_isComplete': true});
            if (completedBlock != undefined)  this.model.set('_isVisited', true);
        },

        postRender: function() {
            var numItems = this.options.siblingsLength
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


    Adapt.on('adapt:initialize', function() {
        //this should really be in the router
        if (Adapt.location._currentLocation === 'course') {
            Adapt.router.set('_canNavigate', true, {pluginName: '_pageLevelProgress'});
            var newRouteId = Adapt.course.get("_introCover")._introCoverIds._intro
            Backbone.history.navigate('#/id/' + newRouteId, {replace: true, trigger: true});
            // Backbone.history.navigate('#/id/' + newRouteId, true);
        } else {
            return;
        }

    }); 


    Adapt.on('router:menu', function(model) {
        $('#wrapper').append(new CoverView({model:model}).$el);
        new CoverExtensions({model:model});
    });

    Adapt.on('menuView:postRender', function(view) {
        if (Adapt.location._currentId == Adapt.course.get("_introCover")._introCoverIds._menu) {
            $('.navigation-back-button').addClass('display-none');
            $('.navigation-drawer-toggle-button').addClass('display-none');
        }
    });


    Adapt.on('pageView:postRender', function(view) {
        if (Adapt.location._currentId == Adapt.course.get("_introCover")._introCoverIds._intro) {
            $('.navigation-back-button').addClass('display-none');
        } else {
            $('.navigation-drawer-toggle-button').removeClass('display-none');
        }
    });

});
