describe('ng-jcrop', function(){

    var ngJcropConfigProvider;

    beforeEach(function(){
        angular.module('testApp', function(){}).config(function (_ngJcropConfigProvider_){
            ngJcropConfigProvider = _ngJcropConfigProvider_;
        });

        angular.mock.module('ngJcrop', 'testApp');
    });

    describe('configuration', function(){

        it('should return the new jcrop config', inject(function(ngJcroptDefaultConfig){
            var config = angular.extend({}, ngJcroptDefaultConfig, {jcrop: {maxWidth: 1000, maxHeight: 2000, aspectRadio: 3}});
            ngJcropConfigProvider.setJcropConfig({maxWidth: 1000, maxHeight: 2000, aspectRadio: 3});
            expect(ngJcropConfigProvider.$get().jcrop).toEqual(config.jcrop);
        }));

        it('should return the new config', inject(function(ngJcroptDefaultConfig){
            var config = angular.extend({}, ngJcroptDefaultConfig, {maxWidtwidthLimith: 2, widthHeight: 10, template: 'oi'});
            ngJcropConfigProvider.setConfig({maxWidtwidthLimith: 2, widthHeight: 10, template: 'oi'});
            expect(ngJcropConfigProvider.$get()).toEqual(config);
        }));

        it('should thrown an error if jquery isnt included', function(){
            module(function($provide){
                $provide.value('$window', {jQuery: false});
            });

            var fn = function(){
                inject(function($window){});
            };

            expect(fn).toThrow(new Error("jQuery isn't included"));
        });

        it('should thrown an error if Jcrop isnt included', function(){
            module(function($provide){
                $provide.value('$window', {jQuery: {Jcrop: false}});
            });

            var fn = function(){
                inject(function($window){});
            };

            expect(fn).toThrow(new Error("Jcrop isn't included"));
        });

    });


    describe('ng-jcrop directive', function(){
        var scope;

        beforeEach(inject(function($rootScope){
            scope = $rootScope.$new();
        }));

        it('should be ok', inject(function($compile){
            var div = $compile('<div ng-jcrop selection="[1,2,3,4]"></div>')(scope);
        }));

        it('should fail', inject(function($compile){
            var fn = function(){
                var div = $compile('<div ng-jcrop></div>')(scope);
            };
            expect(fn).toThrow(new Error('ngJcrop: attribute `selection` is mandatory'));

            var fn = function(){
                var div = $compile('<div ng-jcrop selection="123"></div>')(scope);
            };
            expect(fn).toThrow(new Error('ngJcrop: attribute `selection` must be an array'));
        }));
    });


    describe('JcropController', function(){
        var ctrl, scope, el, getController;

        beforeEach(inject(function($controller, $rootScope, $compile){
            scope = $rootScope.$new();
            scope.src = "/base/test/13x13.png";
            scope.thumbnail = true;
            scope.selection = [];
            el = $compile('<div ng-jcrop="src" thumbnail="thumbnail" selection="selection"></div>')(scope);

            getController = function(params){
                params = params || {};
                params.$scope = params.$scope || scope;
                params.$element = params.$element || el;
                return $controller('JcropController', params);
            };

            ctrl = getController();
        }));

        it('updateCurrentSizes', function(){
            var images = [
                {width: 13, height: 13, src: "/base/test/13x13.png"},
                {width: 11, height: 10, src: "/base/test/11x10.gif"},
                {width: 10, height: 11, src: "/base/test/10x11.gif"},
                {width: 185, height: 200, src: "/base/test/370x400.jpg"},
                {width: 163.9344262295082, height: 200, src: "/base/test/350x427.jpg"},
                {width: 236.0097323600973, height: 200, src: "/base/test/485x411.jpg"},
                {width: 300, height: 60, src: "/base/test/1000x200.png"},
                {width: 3888, height: 2592, src: "/base/test/3888x2592.jpg"}
            ];

            angular.forEach(images, function(image){
                runs(function(){
                    var img = new Image();
                    img.onload = function(){
                        scope.updateCurrentSizes(img);
                        expect(scope.imgStyle.width).toBe(image.width);
                        expect(scope.imgStyle.height).toBe(image.height);
                    };

                    img.onerror = function(){
                        expect(image.src).toBe('status 200');
                    };

                    img.src = image.src;
                });
            });

            waits(500);
        });

        it('should reset the config when JcropChangeSrc is triggered', function(){
            spyOn(scope, 'setSelection');
            scope.$emit('JcropChangeSrc', 'new-src.png');

            expect(scope.setSelection).toHaveBeenCalled();
            expect(scope.ngJcrop).toBe('new-src.png');
        });

        it('should transform `selection` into an array in case it\'s not', function(){
            scope.selection = null;
            scope.setSelection({x: 1, y: 1, x2: 1, y2: 1, w: 1, h: 1})
            expect(scope.selection).toEqual([1, 1, 1, 1, 1, 1]);
        });

        it('should reset the selection when `selection` is null', function(){
            scope.$apply();
            scope.jcrop = {setSelect: angular.identity, destroy: angular.identity, release: angular.identity};
            spyOn(scope.jcrop, 'setSelect');
            spyOn(scope.jcrop, 'release');

            scope.selection = [1, 1, 1, 1, 1, 1];
            scope.$apply();
            expect(scope.jcrop.setSelect).toHaveBeenCalled();
            expect(scope.jcrop.release).not.toHaveBeenCalled();

            scope.selection = null;
            scope.$apply();
            expect(scope.jcrop.release).toHaveBeenCalled();
            expect(scope.selection).toBeNull();

            scope.selection = [1, 1, 1, 1, 1, 1];
            scope.$apply();
            expect(scope.selection).toEqual([1, 1, 1, 1, 1, 1]);
        });

        it('should update the selection', function(){
            scope.$apply();
            scope.jcrop = {setSelect: angular.identity, destroy: angular.identity};
            spyOn(scope.jcrop, 'setSelect');

            scope.selection = [1, 2, 3, 4];
            scope.$apply();
            expect(scope.jcrop.setSelect).toHaveBeenCalled();
        });

        describe('showPreview', function(){

            beforeEach(function(){
                scope.selection = [];
                scope.previewImg = angular.element('<img width="100px" />');
            });

            it('should do nothing if thumbnail = false', function(){
                scope.thumbnail = false;
                scope.showPreview({});
                expect(scope.previewImg.css('width')).toBe('0px');
            });

            it('showPreview', function(){
                scope.thumbnail = true;

                var coords = {x: 10, y: 10, w: 10, h: 10},
                    rx = 100 / coords.w,
                    ry = 100 / coords.h;

                scope.showPreview(coords);

                var expectedValues = {
                    width: Math.round(rx * scope.imgStyle.width) + 'px',
                    maxWidth: Math.round(rx * scope.imgStyle.width) + 'px',
                    height: Math.round(ry * scope.imgStyle.height) + 'px',
                    maxHeight: Math.round(ry * scope.imgStyle.height) + 'px',
                    marginLeft: '-' + Math.round(rx * coords.x) + 'px',
                    marginTop: '-' + Math.round(ry * coords.y) + 'px'
                };

                angular.forEach(expectedValues, function(value, key){
                    expect(scope.previewImg.css(key)).toBe(value);
                });

            });

        });

        describe('destroy', function(){

            it('simple execution', function(){
                scope.mainImg = angular.element('<img>');
                scope.jcrop = {'destroy': angular.identity};

                scope.destroy();
                expect(scope.jcrop).toBeNull();
            });

        });

        describe('init', function(){

            it('with no thumbnail', inject(function($compile){
                scope.thumbnail = false;
                scope.init("/base/test/13x13.png");

                expect(scope.mainImg.attr('src')).toBe("/base/test/13x13.png");
                expect(scope.previewImg.attr('src')).toBeUndefined();
            }));

            it('with thumbnail', function(){
                scope.thumbnail = true;
                scope.init("/base/test/13x13.png");

                expect(scope.mainImg.attr('src')).toBe("/base/test/13x13.png");
                expect(scope.previewImg.attr('src')).toBe("/base/test/13x13.png");
            });

            it('with no selection', inject(function($compile){
                scope.selection = null;
                el = $compile('<div ng-jcrop="src" thumbnail="thumbnail" selection="selection"></div>')(scope);
                ctrl = getController();

            }));

        });

    });

    describe('ng-jcrop-input directive', function(){

        it('should be ok', inject(function($compile){
            var div = $compile('<div ng-jcrop-input></div>');
        }));

    });

    describe('JcropInputController', function(){
        var ctrl, scope, el, getController;

        beforeEach(inject(function($controller, $rootScope, $compile){
            scope = $rootScope.$new();
            el = $compile('<input type="file" ng-jcrop-input />')(scope);

            getController = function(params){
                params = params || {};
                params.$scope = params.$scope || scope;
                params.$element = params.$element || el;
                return $controller('JcropInputController', params);
            };

            ctrl = getController();
        }));

        it('should fail if it isnt an input[type="file"]', inject(function($controller, $compile){
            var err = new Error('ngJcropInput directive must be placed with an input[type="file"]');

            var fn = function(){
                el = $compile('<div ng-jcrop-input></div>')(scope);
            };
            expect(fn).toThrow(err);

            fn = function(){
                el = $compile('<input type="text" ng-jcrop-input />')(scope);
            };
            expect(fn).toThrow(err);
        }));

        it('should set a new image', inject(function($rootScope){
            el.trigger('change')
        }));
    });

});
