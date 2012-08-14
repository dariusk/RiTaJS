/*  
    NEXT: 
    
        -- remove dependency for 1 function (getMetrics()) on jquery...
                
        -- add memoizing of functions: textWidth, textAscent, textDescent, getBoundingBox, etc
            -- fonts and bounds

        -- re-add requestAnimationFrame?
  
     $Id: ritext.js,v 1.1 2012/06/19 16:07:45 dev Exp $
 */
    
(function(window, undefined) {
    
    // ///////////////////////////////////////////////////////////////////////
    // RiText Canvas 2D Renderer
    // ///////////////////////////////////////////////////////////////////////
    
    var RiText_Canvas = makeClass();
    RiText_Canvas.prototype = {

        __init__ : function(ctx) {
            this.ctx = ctx;
        },
        
        __getGraphics : function() {
            return this.ctx;
        },
        
        __pushState : function() {
            this.ctx.save();
            return this;
        },
        
        __popState : function() {
            this.ctx.restore();
            return this;
        },
        
        __background : function(r,g,b,a) {
            this.__fill(r,g,b,a);
            this.ctx.fillRect(0,0,this.ctx.canvas.width,this.ctx.canvas.height);
        },

        __scale : function(sx, sy) {
            if(DBUG) console.log("scale: "+sx+","+sy+","+1);
            this.ctx.scale(sx, sy, 1);
        },
        
        __translate : function(tx, ty) {
            if(DBUG)console.log("translate: "+tx+","+ty+","+0);
            this.ctx.translate(tx, ty, 0);
        },
        
        __rotate : function(zRot) {
            this.ctx.rotate(0,0,zRot);
        },
        
        __line : function(x1,y1,x2,y2,lw) {
            
      
            lw = lw || 1; // canvas hack for crisp lines
            x1 = Math.round(x1), x2 = Math.round(x2);
            y1 = Math.round(y1), y2 = Math.round(y2);
            
            //console.log('line: ('+(x1)+","+(y1)+","+(x2)+","+(y2)+")");
            
            this.ctx.save();
            
            if (x1 === x2) {
                if (y1 > y2) {
                    var swap = y1;
                    y1 = y2;
                    y2 = swap;
                }
                y2++;
                if (lw % 2 === 1)
                    this.ctx.translate(0.5, 0);
            } 
            else if (y1 === y2) {
                if (x1 > x2) {
                    var swap = x1;
                    x1 = x2;
                    x2 = swap;
                }
                x2++;
                if (lw % 2 === 1) 
                    this.ctx.translate(0, 0.5);
            }
            
            
            this.ctx.beginPath();
            this.ctx.moveTo(x1 || 0, y1 || 0);
            this.ctx.lineTo(x2 || 0, y2 || 0);
            this.ctx.lineWidth = lw;
            this.ctx.stroke();
            
            this.ctx.restore();
        },
        
        __rect : function(x,y,w,h) {
  
            this.__line(x,y,x+w,y);
            this.__line(x,y+h,x+w,y+h);
            this.__line(x,y,x,y+h);
            this.__line(x+w,y,x+w,y+h)

            // TODO: add test with filled bounding boxes and check
            this.ctx.fillRect(x+1,y+1,w-1,h-1); // [hack] 
        },
        
        __size : function(w, h, renderer) {
            this.ctx.canvas.width = w;
            this.ctx.canvas.height = h;
            if (renderer) console.warn("Renderer arg ignored");
        },
        
        __createFont : function(fontName, fontSize, fontLeading) {
            var font = {
                name:       fontName, 
                size:       fontSize || RiText.defaults.font.size, 
                leading:    fontLeading || (fontSize * RiText.defaults.leadingFactor) 
            };
            return font;
        },
        
        __width : function() {
            return this.ctx.canvas.width || 200;
        },
        
        __height : function() {
            return this.ctx.canvas.height || 200;
        },
        
        __fill : function(r,g,b,a) {
            this.ctx.fillStyle="rgba("+Math.round(r)+","+Math.round(g)+","+Math.round(b)+","+(a/255)+")";
        },
        
        __stroke : function(r,g,b,a) {
            this.ctx.strokeStyle = (getType(r) == 'string') ? r
                : "rgba("+Math.round(r)+","+Math.round(g)+","+Math.round(b)+","+(a/255)+")";
        },
        
        __textAlign : function(align) {
            switch (align) {
                case RiText.LEFT:
                    this.ctx.textAlign = 'left';
                    break;
                case RiText.CENTER:
                    this.ctx.textAlign = 'center';
                    break;
                case RiText.RIGHT:
                    this.ctx.textAlign = 'right';
                    break;
            }
        },
        
        __type : function() { return "Canvas"; },
        
        // only applies the font to the context!
        __textFont : function(fontObj) {
            if (getType(fontObj)!='object') 
                throw Error("__textFont expects object, but got: "+fontObj);
            this.ctx.font = "normal "+fontObj.size+"px "+fontObj.name;
            if(DBUG) console.log("__textFont: "+this.ctx.font);
        },
        
        __textAscent : function(rt) {
            return this.__getMetrics(rt).ascent;
        },
        
        __textDescent : function(rt) {
            return this.__getMetrics(rt).descent;

        },

        // should operate on the RiText itself (take rt as arg?)
        __text : function(str, x, y) {
            if(DBUG) console.log("text: "+str+","+x+","+y+","+this.ctx.textAlign);
            this.ctx.baseline = 'alphabetic';
            this.ctx.fillText(str, x, y);
            //this.ctx.strokeText(str, x, y);
        },

        __textWidth : function(fontObj, str) {
            this.ctx.save();
            this.__textFont(fontObj);
            var tw = this.ctx.measureText(str).width;
            this.ctx.restore();
            if(DBUG)console.log("measureText: "+tw);
            return tw;
        },

        __textHeight : function(rt) {
            return this.__getBoundingBox(rt).height;
        },
        
        //  hack to deal with lack of metrics in the canvas
        __getBoundingBox : function(rt) {

            this.ctx.save();
            this.__textFont(rt._font);
            var w = this.ctx.measureText(rt.text()).width;
            var metrics = this.__getMetrics(rt);
            //console.log('[CTX] ascent='+metrics.ascent+' descent='+metrics.descent+" h="+(metrics.ascent+metrics.descent));
            this.ctx.restore();
            return { x: 0, y: metrics.descent-1, width: w, height: metrics.ascent+metrics.descent+1 };
        },

        __getMetrics : function(rt) {// does this need font.size? no

            var fontObj = rt._font, str = rt.text();
            
            //console.log('__getMetrics:'+fontObj+","+str);
            var text = $('<span style="font-size: '+fontObj.size+'; font-family: '+fontObj.name+'">'+str+'</span>');
            var block = $('<div style="display: inline-block; width: 1px; height: 0px;"></div>');

            var div = $('<div></div>');
            div.append(text, block);

            var body = $('body');
            body.append(div);

            try {
                var result = {};

                block.css({ verticalAlign: 'baseline' });
                result.ascent = block.offset().top - text.offset().top + 1;

                block.css({ verticalAlign: 'bottom' });
                var height = block.offset().top - text.offset().top;

                result.descent = (height - result.ascent);
                result.ascent -=  result.descent;

            } finally {
                div.remove();
            }

            //console.log(result);
            return result;
        },
        
        toString : function() {
            return "RiText_"+this.__type;
        }
        
    };
    
    //////////////////////////////////////////////////////////////////////////////////////
    // adapted from: https://github.com/sole/tween.js
    //////////////////////////////////////////////////////////////////////////////////////    
    
    TextBehavior = function (rt, object) {
    
        var _parent = rt;
        var _object = object || _parent;
        var _valuesStart = {};
        var _valuesEnd = {};
        var _duration = 1000;
        var _delayTime = 0;
        var _startTime = null;
        var _easingFunction = Easing.Linear.None;
        var _interpolationFunction = Interpolation.Linear;
        var _chainedTween = null;
        var _onUpdateCallback = null;
        var _onCompleteCallback = null;
    
        this.to = function ( properties, duration ) {
    
            if ( duration !== null ) {
    
                _duration = duration;
            }
    
            _valuesEnd = properties;
            return this;
        };
    
        this.start = function ( time ) {
    
            if (_parent) 
                _parent.addBehavior( this );
            else
                throw Error('Unable to add tween');
    
            _startTime = time !== undefined ? time : Date.now();
            _startTime += _delayTime;
    
            for ( var property in _valuesEnd ) {
    
                // This prevents the engine from interpolating null values
                if ( _object[ property ] === null ) {
                    console.error('null value in interpolater for: '+property);
                    continue;
    
                }
    
                // check if an Array was provided as property value
                if ( _valuesEnd[ property ] instanceof Array ) {
    
                    if ( _valuesEnd[ property ].length === 0 ) {
    
                        continue;
                    }
    
                    // create a local copy of the Array with the start value at the front
                    _valuesEnd[ property ] = [ _object[ property ] ].concat( _valuesEnd[ property ] );
                }
    
                _valuesStart[ property ] = _object[ property ];
            }
    
            return this;
    
        };
    
        this.stop = function () {
    
            if (_parent) _parent.removeBehavior( this );
            return this;
    
        };
    
        this.delay = function ( amount ) {
    
            _delayTime = amount;
            return this;
    
        };
    
        this.easing = function ( easing ) {
    
            _easingFunction = easing;
            //console.log('_easingFunction='+_easingFunction);
            return this;
    
        };
    
        this.interpolation = function ( interpolation ) {
    
            _interpolationFunction = interpolation;
            return this;
    
        };
    
        this.chain = function ( chainedTween ) {
    
            _chainedTween = chainedTween;
            return this;
    
        };
    
        this.onUpdate = function ( onUpdateCallback ) {
    
            _onUpdateCallback = onUpdateCallback;
            return this;
    
        };
    
        this.onComplete = function ( onCompleteCallback ) {
    
            _onCompleteCallback = onCompleteCallback;
            return this;
    
        };
    
        this.update = function ( time ) {
    
            if ( time < _startTime ) {
    
                return true;
    
            }
    
            var elapsed = ( time - _startTime ) / _duration;
            elapsed = elapsed > 1 ? 1 : elapsed;
    
            var value = _easingFunction( elapsed );
    
            for ( var property in _valuesStart ) {
    
                var start = _valuesStart[ property ];
                var end = _valuesEnd[ property ];
    
                if ( end instanceof Array ) {
    
                    _object[ property ] = _interpolationFunction( end, value );
    
                } else {
    
                    _object[ property ] = start + ( end - start ) * value;
    
                }
            }
    
            if ( _onUpdateCallback !== null ) {
    
                _onUpdateCallback.call( _object, value );
            }
    
            if ( elapsed == 1 ) {
    
                if ( _onCompleteCallback !== null ) {
                    //console.log(_onCompleteCallback+'.call('+ _object+' )');
                    _onCompleteCallback.call( _object );
    
                }
    
                if ( _chainedTween !== null ) {
    
                    _chainedTween.start();
    
                }
    
                return false;
    
            }
    
            return true;
        };
    
    };
    
    Easing = {
    
        Linear: {
    
            None: function ( k ) {
    
                return k;
    
            }
    
        },
    
        Quadratic: {
    
            In: function ( k ) {
    
                return k * k;
    
            },
    
            Out: function ( k ) {
    
                return k * ( 2 - k );
    
            },
    
            InOut: function ( k ) {
    
                if ( ( k *= 2 ) < 1 ) return 0.5 * k * k;
                return - 0.5 * ( --k * ( k - 2 ) - 1 );
    
            }
    
        },
    
        Cubic: {
    
            In: function ( k ) {
    
                return k * k * k;
    
            },
    
            Out: function ( k ) {
    
                return --k * k * k + 1;
    
            },
    
            InOut: function ( k ) {
    
                if ( ( k *= 2 ) < 1 ) return 0.5 * k * k * k;
                return 0.5 * ( ( k -= 2 ) * k * k + 2 );
    
            }
    
        },
    
        Quartic: {
    
            In: function ( k ) {
    
                return k * k * k * k;
    
            },
    
            Out: function ( k ) {
    
                return 1 - --k * k * k * k;
    
            },
    
            InOut: function ( k ) {
    
                if ( ( k *= 2 ) < 1) return 0.5 * k * k * k * k;
                return - 0.5 * ( ( k -= 2 ) * k * k * k - 2 );
    
            }
    
        },
    
        Quintic: {
    
            In: function ( k ) {
    
                return k * k * k * k * k;
    
            },
    
            Out: function ( k ) {
    
                return --k * k * k * k * k + 1;
    
            },
    
            InOut: function ( k ) {
    
                if ( ( k *= 2 ) < 1 ) return 0.5 * k * k * k * k * k;
                return 0.5 * ( ( k -= 2 ) * k * k * k * k + 2 );
    
            }
    
        },
    
        Sinusoidal: {
    
            In: function ( k ) {
    
                return 1 - Math.cos( k * Math.PI / 2 );
    
            },
    
            Out: function ( k ) {
    
                return Math.sin( k * Math.PI / 2 );
    
            },
    
            InOut: function ( k ) {
    
                return 0.5 * ( 1 - Math.cos( Math.PI * k ) );
    
            }
    
        },
    
        Exponential: {
    
            In: function ( k ) {
    
                return k === 0 ? 0 : Math.pow( 1024, k - 1 );
    
            },
    
            Out: function ( k ) {
    
                return k === 1 ? 1 : 1 - Math.pow( 2, - 10 * k );
    
            },
    
            InOut: function ( k ) {
    
                if ( k === 0 ) return 0;
                if ( k === 1 ) return 1;
                if ( ( k *= 2 ) < 1 ) return 0.5 * Math.pow( 1024, k - 1 );
                return 0.5 * ( - Math.pow( 2, - 10 * ( k - 1 ) ) + 2 );
    
            }
    
        },
    
        Circular: {
    
            In: function ( k ) {
    
                return 1 - Math.sqrt( 1 - k * k );
    
            },
    
            Out: function ( k ) {
    
                return Math.sqrt( 1 - --k * k );
    
            },
    
            InOut: function ( k ) {
    
                if ( ( k *= 2 ) < 1) return - 0.5 * ( Math.sqrt( 1 - k * k) - 1);
                return 0.5 * ( Math.sqrt( 1 - ( k -= 2) * k) + 1);
    
            }
    
        },
    
        Elastic: {
    
            In: function ( k ) {
    
                var s, a = 0.1, p = 0.4;
                if ( k === 0 ) return 0;
                if ( k === 1 ) return 1;
                if ( !a || a < 1 ) { a = 1; s = p / 4; }
                else s = p * Math.asin( 1 / a ) / ( 2 * Math.PI );
                return - ( a * Math.pow( 2, 10 * ( k -= 1 ) ) * Math.sin( ( k - s ) * ( 2 * Math.PI ) / p ) );
    
            },
    
            Out: function ( k ) {
    
                var s, a = 0.1, p = 0.4;
                if ( k === 0 ) return 0;
                if ( k === 1 ) return 1;
                if ( !a || a < 1 ) { a = 1; s = p / 4; }
                else s = p * Math.asin( 1 / a ) / ( 2 * Math.PI );
                return ( a * Math.pow( 2, - 10 * k) * Math.sin( ( k - s ) * ( 2 * Math.PI ) / p ) + 1 );
    
            },
    
            InOut: function ( k ) {
    
                var s, a = 0.1, p = 0.4;
                if ( k === 0 ) return 0;
                if ( k === 1 ) return 1;
                if ( !a || a < 1 ) { a = 1; s = p / 4; }
                else s = p * Math.asin( 1 / a ) / ( 2 * Math.PI );
                if ( ( k *= 2 ) < 1 ) return - 0.5 * ( a * Math.pow( 2, 10 * ( k -= 1 ) ) * Math.sin( ( k - s ) * ( 2 * Math.PI ) / p ) );
                return a * Math.pow( 2, -10 * ( k -= 1 ) ) * Math.sin( ( k - s ) * ( 2 * Math.PI ) / p ) * 0.5 + 1;
    
            }
    
        },
    
        Back: {
    
            In: function ( k ) {
    
                var s = 1.70158;
                return k * k * ( ( s + 1 ) * k - s );
    
            },
    
            Out: function ( k ) {
    
                var s = 1.70158;
                return --k * k * ( ( s + 1 ) * k + s ) + 1;
    
            },
    
            InOut: function ( k ) {
    
                var s = 1.70158 * 1.525;
                if ( ( k *= 2 ) < 1 ) return 0.5 * ( k * k * ( ( s + 1 ) * k - s ) );
                return 0.5 * ( ( k -= 2 ) * k * ( ( s + 1 ) * k + s ) + 2 );
    
            }
    
        },
    
        Bounce: {
    
            In: function ( k ) {
    
                return 1 - Easing.Bounce.Out( 1 - k );
    
            },
    
            Out: function ( k ) {
    
                if ( k < ( 1 / 2.75 ) ) {
    
                    return 7.5625 * k * k;
    
                } else if ( k < ( 2 / 2.75 ) ) {
    
                    return 7.5625 * ( k -= ( 1.5 / 2.75 ) ) * k + 0.75;
    
                } else if ( k < ( 2.5 / 2.75 ) ) {
    
                    return 7.5625 * ( k -= ( 2.25 / 2.75 ) ) * k + 0.9375;
    
                } else {
    
                    return 7.5625 * ( k -= ( 2.625 / 2.75 ) ) * k + 0.984375;
    
                }
    
            },
    
            InOut: function ( k ) {
    
                if ( k < 0.5 ) return Easing.Bounce.In( k * 2 ) * 0.5;
                return Easing.Bounce.Out( k * 2 - 1 ) * 0.5 + 0.5;
    
            }
    
        }
    
    };
    
    Interpolation = {
    
        Linear: function ( v, k ) {
    
            var m = v.length - 1, f = m * k, i = Math.floor( f ), fn = Interpolation.Utils.Linear;
    
            if ( k < 0 ) return fn( v[ 0 ], v[ 1 ], f );
            if ( k > 1 ) return fn( v[ m ], v[ m - 1 ], m - f );
    
            return fn( v[ i ], v[ i + 1 > m ? m : i + 1 ], f - i );
    
        },
    
        Bezier: function ( v, k ) {
    
            var b = 0, n = v.length - 1, pw = Math.pow, bn = Interpolation.Utils.Bernstein, i;
    
            for ( i = 0; i <= n; i++ ) {
                b += pw( 1 - k, n - i ) * pw( k, i ) * v[ i ] * bn( n, i );
            }
    
            return b;
    
        },
    
        CatmullRom: function ( v, k ) {
    
            var m = v.length - 1, f = m * k, i = Math.floor( f ), fn = Interpolation.Utils.CatmullRom;
    
            if ( v[ 0 ] === v[ m ] ) {
    
                if ( k < 0 ) i = Math.floor( f = m * ( 1 + k ) );
    
                return fn( v[ ( i - 1 + m ) % m ], v[ i ], v[ ( i + 1 ) % m ], v[ ( i + 2 ) % m ], f - i );
    
            } else {
    
                if ( k < 0 ) return v[ 0 ] - ( fn( v[ 0 ], v[ 0 ], v[ 1 ], v[ 1 ], -f ) - v[ 0 ] );
                if ( k > 1 ) return v[ m ] - ( fn( v[ m ], v[ m ], v[ m - 1 ], v[ m - 1 ], f - m ) - v[ m ] );
    
                return fn( v[ i ? i - 1 : 0 ], v[ i ], v[ m < i + 1 ? m : i + 1 ], v[ m < i + 2 ? m : i + 2 ], f - i );
    
            }
    
        },
    
        Utils: {
    
            Linear: function ( p0, p1, t ) {
    
                return ( p1 - p0 ) * t + p0;
    
            },
    
            Bernstein: function ( n , i ) {
    
                var fc = Interpolation.Utils.Factorial;
                return fc( n ) / fc( i ) / fc( n - i );
    
            },
    
            Factorial: ( function () {
    
                var a = [ 1 ];
    
                return function ( n ) {
    
                    var s = 1, i;
                    if ( a[ n ] ) return a[ n ];
                    for ( i = n; i > 1; i-- ) s *= i;
                    return a[ n ] = s;
    
                }
    
            } )(),
    
            CatmullRom: function ( p0, p1, p2, p3, t ) {
    
                var v0 = ( p2 - p0 ) * 0.5, v1 = ( p3 - p1 ) * 0.5, t2 = t * t, t3 = t * t2;
                return ( 2 * p1 - 2 * p2 + v0 + v1 ) * t3 + ( - 3 * p1 + 3 * p2 - 2 * v0 - v1 ) * t2 + v0 * t + p1;
    
            }
    
        }
    
    };

    // /////////////////////////////////////////////////////////////////////// 

    var DBUG = false, E = "", SP = " "; // DUP
    
    // /////////////////////////////////////////////////////////////////////// 

    function makeClass() { // DUP
        
        return function(args) {
            
            if (this instanceof arguments.callee) {
                
                if (typeof this.__init__ == "function") {
                    
                    this.__init__.apply(this, args && args.callee ? args : arguments);
                }
            } 
            else {
                return new arguments.callee(arguments);
            }
        };
    }

    function replaceAll(theText, replace, withThis) { // DUP?
        if (!theText) throw Error("no text!")
        return theText.replace(new RegExp(replace, 'g'), withThis);
    }

    function startsWith(str, prefix) { // DUP
        return str.indexOf(prefix) === 0;
    }
    
    function endsWith(str, ending) { // DUP
        return (str.match(ending + "$") == ending);
    }
    
    function isNull(obj) { // DUP
        
        return (typeof obj === 'undefined' || obj === null);
    }

    function getType(obj) { // DUP

        // http://javascriptweblog.wordpress.com/2011/08/08/fixing-the-javascript-typeof-operator/    
        return ({}).toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase();
    };
    
    //////////////////////////// RiText ///////////////////////////////////
    
    /*
     * Returns the pixel x-offset for the word at 'wordIdx'
     */
    wordOffsetFor = function(rt, words, wordIdx) { 

        //console.log("wordOffset("+words+","+wordIdx+")");

        if (wordIdx < 0 || wordIdx >= words.length)
            throw new Error("Bad wordIdx=" + wordIdx + " for " + words);
        
        rt.g.__pushState();
        //g.__textFont(this._font);

        var xPos = rt.x;

        if (wordIdx > 0) {
            
            var pre = words.slice(0, wordIdx);
            var preStr = '';
            for ( var i = 0; i < pre.length; i++) {
                preStr += pre[i] + ' ';
            }

            var tw = rt.g.__textWidth(rt._font, preStr);

            //console.log("x="+xPos+" pre='"+preStr+"' tw=" + tw); 

            switch (rt._alignment) {
                case RiText.LEFT:
                    xPos = rt.x + tw;
                    break;
                case RiText.RIGHT:
                    xPos = rt.x - tw;
                    break;
                case RiText.CENTER:
                    console.warn("TODO: test center-align here");
                    xPos = rt.x; // ?
                    break;
            }
        }
        rt.g.__popState();

        return xPos;
    };
    
    handleLeading = function(fontObj, rts, startY)  {
        
      if (!rts || !rts.length) return;

      fontObj = fontObj || RiText.getDefaultFont();
      
      var nextHeight = startY;
      rts[0].font(fontObj);
      for ( var i = 0; i < rts.length; i++) {
          
        if (fontObj) rts[i].font(fontObj); // set the font
        rts[i].y = nextHeight; // adjust y-pos
        nextHeight += fontObj.leading;
      }
      
      return rts;
    };
    
    disposeOne = function(toDelete) {
        
        removeFromArray(RiText.instances, toDelete);
        if (toDelete && toDelete.hasOwnProperty["_rs"])
            delete(toDelete._rs);
        else
            console.warn('no RiString in disposeOne()?');
        if (toDelete)
            delete(toDelete);
    };
    

    disposeArray = function(toDelete) {
        
        for ( var i = 0; i < toDelete.length; i++) {
            
            disposeOne(toDelete[i]);
        }
    };
    
    parseColor = function() {
   
        var a = arguments, len = a.length;
        
        //console.log('parseColor:'+len);
        
        var color = { r: 0, g: 0, b: 0, a: 255 };

        if (!len) return color;

        if (len == 1 && getType(a[0])==='array') {
            return color.apply(this,cr);
        }
    
        if (len >= 3) {
            color.r = a[0];
            color.g = a[1];
            color.b = a[2];
        }
        if (len == 4) {
            color.a = a[3];
        }
        if (len <= 2) {
            color.r = a[0];
            color.g = a[0];
            color.b = a[0];
        }
        if (len == 2) {
            color.a = a[1];
        }

        return color;
    };
    
    
    addSpaces = function(str, num) {
        
        for ( var i = 0; i < num; i++)
            str += " ";
        return str;
    };
    
    removeFromArray = function(items, element)
    {
        while (items.indexOf(element) !== -1) {
            items.splice(items.indexOf(element), 1);
        }
    }
    
    // make a sub-case of createLinesByCharCount() ?
    createLinesByCharCountFromArray = function(txtArr, startX, startY, fontObj) {

        //console.log('createLinesByCharCountFromArray('+txtArr.length+','+startX+','+startY+','+maxCharsPerLine+','+fontObj+')');

        fontObj = fontObj || RiText.getDefaultFont();

        var rts = [];
        for ( var i = 0; i < txtArr.length; i++) {
            //console.log(i+")"+txtArr[i]);
            rts.push(new RiText(txtArr[i], startX, startY, fontObj));
        }

        if (rts.length < 1) return [];

        return handleLeading(fontObj, rts, startY);
    };
    
 
    // The RiText class  //////////////////////////////////////////////////////////// 
    
    var RiText = makeClass();
    var RiTaEvent = makeClass();
    
    // 'Static' Methods ///////////////////////////////////////////////////////////// 
    
   
    /**
     * Starts a timer that calls 'onRiTaEvent' or the specified callback every 'period'
     * seconds
     * 
     * @param number period
     * @param function called every 'period' seconds
     * @returns number - the unique id for the timer
     */
    RiText.timer = function(period, callback) {
        
        var id = setInterval(function(){
            
            RiTaEvent(RiTa, 'tick').fire(callback);  
            
        }, period * 1000);
        
        return id;
    }, // TODO: copy to RiTa
    
    /**
     * Container for properties related to the animation loop 
     */
    RiText.animator = {
        loopId : -1,
        actualFPS : 0,
        targetFPS : 60,
        isLooping : false,
        frameCount : 0,
        loopStarted : false,
        framesSinceLastFPS : 0,
        callbackDisabled : false,
        timeSinceLastFPS : Date.now(),
    };
    
    /**
     * Immediately stops the current animation loop and clears 
     * @returns number - the number of frames that have happened
     */
    RiText.frameCount = function() {
        return RiText.animator.frameCount;
    }
    
    /**
     * Immediately stops the current animation loop and clears 
     */
    RiText.noLoop = function() {
        var an = RiText.animator;
        an.isLooping = false;
        an.loopStarted = false;
        an.clearInterval(loopId);
    }
        
    /**
     * Starts an animation loop that calls the specified callback (usually 'draw') 
     * at the specified fps  
     * 
     * @param callback - the animation callback (optional, default=60)
     * @param number - the target framesPerSecond (optional, default='draw')
     * <pre>
     * Examples:
     *  RiText.loop();
     *  RiText.loop('draw');
     *  RiText.loop(30);
     *  RiText.loop(draw, 10);
     * </pre>
     */
    RiText.loop = function(callbackFun, fps) {
        
        var a = arguments, g = RiText.renderer,  an = RiText.animator, callback = window['draw'];
        
        if (g.__type() === 'Processing') return; // let P5 do its own loop?
  
        if (an.loopStarted) return;
        
        switch (a.length) {
            
            case 1:
                
                if (a[0]) {
                    var type = getType(a[0]);
                    if (type == 'function') {
                        callback = a[0];
                    }
                    else if (type == 'number') {
                        an.targetFPS = a[0];
                    }
                }
                break;
                
            case 2:
                
                if (a[0]) {
                    
                    var type = getType(a[0]);
                    if (type == 'function') {
                        callback = a[0];
                    }
                    type = getType(a[1])
                    if (type == 'number') {
                        an.targetFPS = a[1];
                    }
                }
                break;
        }

        an.timeSinceLastFPS = Date.now(), an.framesSinceLastFPS = 0, mps =  1E3 / an.targetFPS;
        
        if (callback && !an.callbackDisabled) {
            
            an.loopId = window.setInterval(function() {
                
              try {
                
                 callback();
                 
                 var sec = (Date.now() - an.timeSinceLastFPS) / 1E3;
                 var fps = ++an.framesSinceLastFPS / sec;
                 
                 if (sec > 0.5) {
                     an.timeSinceLastFPS = Date.now();
                     an.framesSinceLastFPS = 0;
                     an.actualFPS = fps;
                 }
                 an.frameCount++;
                
              } catch(ex) {
                  
                if (!an.callbackDisabled) {
                    console.warn("Unable to invoke callback: "+callback);
                    an.callbackDisabled = true;
                }
                window.clearInterval(an.loopId);
                console.trace(this);
                throw ex;
              }
            }, mps);
            
            an.isLooping = true;
            an.loopStarted = true;
        }

    }
    
    /**
     * Convenience method to get the height of the current drawing surface
     * @returns number - height
     */
    RiText.width = function() { return RiText.renderer.__width(); };
     

    /**
     * Convenience method to get the height of the current drawing surface
     */
    RiText.height = function() { return RiText.renderer.__height(); };
 
    /**
     * Convenience method to get the distance between 2 points
     * @param number - x1
     * @param number - y1
     * @param number - x2
     * @param number - y2
     */
    RiText.dist = function(x1,y1,x2,y2) {
        var dx = x1 - x2, dy = y1 - y2;
        return Math.sqrt(dx * dx + dy * dy);
    };
    
    /**
     * Convenience method to draw a crisp line on the drawing surface
     * @param number - x1
     * @param number - y1
     * @param number - x2
     * @param number - y2
     * @param number - lineWidth (optional: default=1)
     */ 
    RiText.line = function(x1, y1, x2, y2, lineWidth) {

        var g = RiText.renderer;
        g.__pushState();
        g.__line(x1, y1, x2, y2, lineWidth || 1);
        g.__popState();
    };
    
// RiText.line = function(x1, y1, x2, y2, lineWidth) {
//        
//        var g = RiText.renderer, p = g.__getGraphics(), swap = undefined;
//        
//        x1 = Math.round(x1), x2 = Math.round(x2);
//        y1 = Math.round(y1), y2 = Math.round(y2);
//
//        lineWidth = lineWidth || 1;
//        
//        g.__pushState();
//        
//        if (x1 === x2) {
//            if (y1 > y2) {
//                swap = y1;
//                y1 = y2;
//                y2 = swap
//            }
//            y2++;
//            if (lineWidth % 2 === 1) g.__translate(0.5, 0)
//        } 
//        else if (y1 === y2) {
//            if (x1 > x2) {
//                swap = x1;
//                x1 = x2;
//                x2 = swap
//            }
//            x2++;
//            if (lineWidth % 2 === 1) g.__translate(0, 0.5)
//        }
//
//        p.lineWidth = lineWidth;
//        p.beginPath();
//        p.moveTo(x1 || 0, y1 || 0);
//        p.lineTo(x2 || 0, y2 || 0);
//        p.stroke();
//
//        g.__popState();
//    };
      
    /**
     * Convenience method to set the size of the drawing surface in the current 
     * renderer context 
     * @param number - width
     * @param number - height
     */
    RiText.size = function(w,h/*renderer*/) {
        
        RiText.renderer.__size(w,h/*renderer*/);
    }
    
    /**
     * Returns the current graphics context, either a canvas 2d'-context or ProcessingJS instance 
     * @returns object
     */
    RiText.graphics = function() {
        
        return RiText.renderer.__getGraphics();
    }
    
    /**
     * Returns a random color in which the 3 values for rgb (or rgba if 'includeAlpha' is true), 
     * are between min and max 
     * 
     * @param number - min value
     * @param number - max value
     * @param boolean - true if includes alpha
     * @returns array of numbers - [r,g,b] or [r,g,b,a]
     */
    RiText.randomColor = function(min,max,includeAlpha) {
        
        min = min || 0, max = max || 256;
        var col = [RiText.random(min,max),RiText.random(min,max),RiText.random(min,max)];
        if (includeAlpha) col.push(RiText.random(min,max));
        //console.log('res='+col);
        return col;
    }
    
    /**
     * Returns a random number between 'min' (default 0) and 'max
     * @retruns number
     */
    RiText.random = function() {
        
        return RiTa.random.apply(this,arguments);
    }
    
    /**
     * Convenience method to fill drawing surface background with specified color
     * @param r
     * @param g
     * @param b
     * @param a
     */
    RiText.background = function(r,g,b,a) {
        
        var br, bg, bb, ba=255, r = (typeof r == 'number') ? r : 255;
        
        if (arguments.length >= 3) {
            br = r;
            bg = g;
            bb = b;
        }
        if (arguments.length == 4) {
                ba = a;
        }
        if (arguments.length <= 2) {
                br = r;
                bg = r;
                bb = r;
        }
        if (arguments.length == 2) {
                ba = g;
        }
 
        RiText.renderer.__background(br,bg,bb,ba);
    }
    
    
    /**
     * Returns the mouse position from a mouse event
     * in a cross-browser -ompatible fashion
     * @param mouseEvent
     * @returns object - mouse position with x,y properties
     */
    RiText.mouse = function(e) {
        
        var posX = -1,posY = -1;
        
        if (!e) var e = window.event;
        if (!e && !RiText.mouse.printedWarning) { 
            console.warn("Unable to determine mouse position without an event!");
            RiText.mouse.printedWarning = true;
        }        
        
        if (e.pageX) {
            posX = e.pageX;
        }
        else if (e.clientX)    {
            posX = e.clientX + document.body.scrollLeft
                + document.documentElement.scrollLeft;
        }

        if (e.pageY) {
            posY = e.pageY;
        }
        else if (e.clientY)    {
            posY = e.clientY + document.body.scrollTop
                + document.documentElement.scrollTop;
        }
 
 
        return {x:posX,y:posY};
    }

//    /**
//     * Returns the mouseY position from a mouse event
//     * in a cross-browser compatible fashion
//     * @param mouseEvent
//     */
//    RiText.mouseY = function(e) {
//
//        return posY;
//    }
//    
    /**
     * Returns all RiTexts that contain the point x,y or null if none do.
     * <p>
     * Note: this will return an array even if only one item is picked, therefore,
     * you should generally use it as follows:
     * <pre>
     *   RiText picked = null;
     *   RiText[] rts = RiText.getPicked(mx, my);
     *   if (rts != null)
     * picked = rts[0];
     *
     * <pre>
     * @returns RiText[] 1 or more RiTexts containing
     * the point, or null if none do.
     */
    RiText.picked = function(x, y)
    {
      var hits = [];
      for (var i = 0; i < RiText.instances.length; i++)
      {
        var rt = RiText.instances[i];
        rt.contains(x, y) && hits.push(rt);
      }
      return hits;
    }
    
    RiText.dispose = function(toDelete) {
        
        if (!toDelete) return;
        
        //console.log('dispose('+toDelete+')');
        
        if (arguments.length==1) {
            if (getType(toDelete) === 'array')
                disposeArray(toDelete);
            else if (getType(toDelete) === 'object')
                disposeOne(toDelete);

            else
                throw Error("Unexpected type: "+toDelete);
        }
    }
    
    RiText.disposeAll = function() {
        
        for ( var i = 0; i < RiText.instances.length; i++) {
            
            if (RiText.instances[i] && RiText.instances[i].hasOwnProperty["_rs"]) // yuk
                delete(RiText.instances[i]._rs);
            else
                console.warn('no RiString in RiText.disposeAll()?');
            
            if (RiText.instances[i])
                delete(RiText.instances[i]);
        }
        RiText.instances = [];
    };
    
    // TODO: if txt is an array, maintain line breaks... ?
    RiText.createLines = function(txt, x, y, maxW, maxH, theFont) { 
   
        // remove line breaks
        txt = replaceAll(txt, "[\r\n]", SP);

        //  adds spaces around html tokens
        txt = replaceAll(txt," ?(<[^>]+>) ?", " $1 ");

        // split into array of words
        var tmp = txt.split(SP), words = [];
        for ( var i = tmp.length - 1; i >= 0; i--)
            words.push(tmp[i]);

        if (!words.length) return [];
        
        var g = RiText.renderer;
        var fn = RiText.createLines;
        
        // helper functions ////////////////////////////////////////
        
        fn.checkLineHeight = fn.checkLineHeight || function(currentH, lineH, maxH) {
            
            return currentH + lineH <= maxH;
        };
        
        fn.addLine = fn.addLine || function(arr, s) {
            if (s && s.length) {
                // strip trailing spaces (regex?)
                while (s.length > 0 && endsWith(s, " "))
                    s = s.substring(0, s.length - 1);
                arr.push(s); 
            }
        };
        
        // the guts ////////////////////////////////////////////////

        theFont = theFont || RiText.getDefaultFont();
        
        var tmp = new RiText('_',0,0,theFont), textH = tmp.textHeight();
        RiText.dispose(tmp);

        var currentH = 0, currentW = 0, newParagraph = false, forceBreak = false, strLines = [], 
            sb = RiText.defaults.indentFirstParagraph ? RiText.defaults.paragraphIndent : E;
        
        while (words.length > 0) {

            var next = words.pop();
            
            if (next.length == 0) continue;

            if (startsWith(next, '<') && endsWith(next, ">")) {
         
                if (next === RiText.NON_BREAKING_SPACE || next === "</sp>") {
                    
                    sb += SP;
                }
                else if (next === RiText.PARAGRAPH || next === "</p>") {
                    
                    if (sb.length > 0) {// case: paragraph break
                        
                        newParagraph = true;
                    }
                    else if (RiText.indentFirstParagraph) {
                    
                        sb += RiText.defaults.paragraphIndent;
                    }
                }
                else if (endsWith(next, RiText.LINE_BREAK) || next === "</br>") {
                    
                    forceBreak = true;
                }
                continue;
            }

            currentW = g.__textWidth(theFont, sb + next);

            // check line-length & add a word
            if (!newParagraph && !forceBreak && currentW < maxW) {
                
                sb += next + " "; 
            }
            else // new paragraph or line-break
            {
                // check vertical space, add line & next word
                if (fn.checkLineHeight(currentH, textH, maxH)) {
                    
                    fn.addLine(strLines, sb);
                    sb = E;

                    if (newParagraph) { // do indent

                        sb += RiText.defaults.paragraphIndent;
                        if (RiText.defaults.paragraphLeading > 0) {
                            sb += '|'; // filthy
                        }
                    }
                    newParagraph = false;
                    forceBreak = false;
                    sb += next + SP;//addWord(sb, next);

                    currentH += textH; // DCH: changed(port-to-js), 3.3.12 
                    // currentH += lineHeight; 
                }
                else {
                    
                    if (next != null) words.push(next);
                    break;
                }
            }
        }

        // check if leftover words can make a new line
        if (fn.checkLineHeight(currentH, textH, maxH)) {
            
            fn.addLine(strLines, sb);
            sb = E;
        }
        else {
            var tmp = sb.split(SP);
            for ( var i = tmp.length - 1; i >= 0; i--) {
                words.push(tmp[i]);
            }
            //fn.pushLine(words, sb.split(SP));
        }

        if (!strLines.length) {
            throw Error('Unexpected failure in createLines: '+strLines.length);
            return [];
        }
        
        
        // lay out the lines
        var rts = createLinesByCharCountFromArray(strLines, x, y+textH, theFont);

        // set the paragraph spacing
        if (RiText.defaults.paragraphLeading > 0)  {
            
          var lead = 0;
          for (var i = 0; i < rts.length; i++) {
              
            var str = rts[i].text();
            var idx = str.indexOf('|');
            if (idx > -1) {
              lead += RiText.defaults.paragraphLeading;
              rts[i].removeCharAt(idx);
            }
            rts[i].y += lead;
          }
        }
        
        // check all the lines are still in the rect
        var toKill = [];
        var check = rts[rts.length - 1];   
        for (var z = 1; check.y > y + maxH; z++) {
            
            toKill.push(check);
            var idx = rts.length - 1 - z;
            if (idx < 0) break;
            check = rts[idx];
        }
        
        // remove the dead ones
        for (var z = 0; z < toKill.length; z++) {
            
            removeFromArray(rts,toKill[z]);
        }
        disposeArray(toKill);


        return rts;
    };


    // TODO: if txt is an array, maintain line breaks... ?
    RiText.createLinesByCharCount = function(txt, startX, startY, maxCharsPerLine, fontObj) {

        //console.log("RiText.createLinesByCharCount("+txt+", "+startX+","+startY+", "+maxCharsPerLine+", "+fontObj+")");

        if (!maxCharsPerLine || maxCharsPerLine<0) maxCharsPerLine = Number.MAX_VALUE;

        if (txt == null || txt.length == 0) return new Array();

        if (txt.length < maxCharsPerLine) return [ new RiText(txt, startX, startY) ];

        // remove any line breaks from the original
        txt = replaceAll(txt,"\n", " ");

        var texts = [];
        while (txt.length > maxCharsPerLine) {
            var toAdd = txt.substring(0, maxCharsPerLine);
            txt = txt.substring(maxCharsPerLine, txt.length);

            var idx = toAdd.lastIndexOf(" ");
            var end = "";
            if (idx >= 0) {
                end = toAdd.substring(idx, toAdd.length);
                if (maxCharsPerLine < Number.MAX_VALUE) end = end.trim();
                toAdd = toAdd.substring(0, idx);
            }
            texts.push(new RiText(toAdd.trim(), startX, startY));
            txt = end + txt;
        }

        if (txt.length > 0) {
            if (maxCharsPerLine < Number.MAX_VALUE) txt = txt.trim();
            texts.push(new RiText(txt, startX, startY));
        }

        return handleLeading(fontObj, texts, startY);
    };
    
    RiText.defaultMotionType = function(motionType) {

        if (arguments.length==1) 
            RiText.defaults.motionType = motionType;
        return RiText.defaults.motionType;
    };

    RiText.showBoundingBoxes = function(value) {
        if (arguments.length==1) 
            RiText.defaults.boundingBoxVisible = value;
        return RiText.defaults.boundingBoxVisible;
    };

    RiText.defaultFont = function() {
        
        var a = arguments;
        if (a.length == 1 && typeof a[0] == 'object') {
            RiText.defaults.font = a[0];
        }
        else if (a.length > 1) {
            
            RiText.defaults.font = RiText.renderer.__createFont.apply(RiText.renderer,a);
        }
        return RiText.defaults.font;
    };
    
    RiText.createFont = function(fontName, fontSize, leading) {
        
        if (!fontName) throw Error('RiText.createFont requires fontName');
        
        fontSize = fontSize || RiText.defaults.fontSize;
        
        return RiText.renderer.__createFont(fontName, fontSize, leading);
    };

    RiText.defaultAlignment = function(align) {

        if (arguments.length==1)
            RiText.defaults.alignment = align;
        
        return RiText.defaults.alignment;
    };

    RiText.createWords = function(txt, x, y, w, h, fontObj) {

        return createRiTexts(txt, x, y, w, h, fontObj, RiText.prototype.splitWords);
    };

    RiText.createLetters = function(txt, x, y, w, h, fontObj) {

        return createRiTexts(txt, x, y, w, h, fontObj, RiText.prototype.splitLetters);
    };

    createRiTexts = function(txt, x, y, w, h, fontObj, splitFun) // private 
    {
        if (!txt || !txt.length) return [];
        fontObj = fontObj || RiText.getDefaultFont();

        var rlines = RiText.createLines(txt, x, y, w, h, fontObj);
        if (!rlines) return [];

        var result = [];
        for ( var i = 0; i < rlines.length; i++) {
            
            var rts = splitFun.call(rlines[i]);
            for ( var j = 0; j < rts.length; j++)
                result.push(rts[j].font(fontObj)); // add the words
            
            RiText.dispose(rlines[i]);
        }

        return result;
    };

    
    /**
     * A convenience method to call a member function on each RiText in the array,
     * or all existing RiText objects (with no argument)
     * @param array - defaults to all riText if an array is not supplied (optional, default=all)
     */
    RiText.foreach = function(theFunction) {
        
        if (arguments.length == 1 && getType(array) === 'array') { 
            for ( var i = 0; i < array.length; i++)
                array[i] && array[i].theFunction();
        }
        else {
            for ( var i = 0; i < RiText.instances.length; i++)
                RiText.instances[i] && RiText.instances[i].theFunction();
        }
        
    }
    
    /**
     * A convenience method to draw all existing RiText objects (with no argument)
     * or an array of RiText objects (if supplied as an argument)
     * @param array - draws only the array if supplied (optional)
     */
    RiText.drawAll = function(array) {
        
        if (arguments.length == 1 && getType(array) === 'array') { 
            for ( var i = 0; i < array.length; i++)
                array[i] && array[i].draw();
        }
        else {
            for ( var i = 0; i < RiText.instances.length; i++)
                RiText.instances[i] && RiText.instances[i].draw();
        }
        
    }
    
    RiText.defaultColor = function(r, g, b, a) {
 
        if (arguments.length) { 
            RiText.defaults.color = parseColor.apply(this,arguments);
        }
        return RiText.defaults.color;
        
//        
//        if (arguments.length == 1 && getType(r)==='array') {
//            
//            return RiText.defaultColor.apply(this,r); // split
//        }
//        
//        if (arguments.length >= 3) {
//            if (typeof (r) === 'number') {
//                RiText.defaults.color.r = r;
//            }
//            if (typeof (g) === 'number') {
//                RiText.defaults.color.g = g;
//            }
//            if (typeof (b) === 'number') {
//                RiText.defaults.color.b = b;
//            }
//        }
//        if (arguments.length == 4) {
//            if (typeof (a) === 'number') {
//                RiText.defaults.color.a = a;
//            }
//        }
//        if (arguments.length <= 2) {
//            if (typeof (r) === 'number') {
//                RiText.defaults.color.r = r;
//                RiText.defaults.color.g = r;
//                RiText.defaults.color.b = r;
//            }
//        }
//        if (arguments.length == 2) {
//            if (typeof (g) === 'number') {
//                RiText.defaults.color.a = g;
//            }
//        }

    };
    
    // TODO: test this font default across all platforms and browsers 
    RiText.getDefaultFont = function() { // make private??
        //console.log("RiText.getDefaultFont: "+RiText.defaults.fontFamily+","+RiText.defaults.font.size);
        RiText.defaults.font = RiText.defaults.font || 
            RiText.renderer.__createFont(RiText.defaults.fontFamily, RiText.defaults.fontSize, RiText.defaults.fontLeading);
        return RiText.defaults.font;
    },

    // PUBLIC statics (TODO: clean up) ///////////////////////////////////////////
   
    RiText.NON_BREAKING_SPACE = "<sp>";
    RiText.LINE_BREAK = "<br>";
    RiText.PARAGRAPH = "<p>";
    
    RiText.instances = [];

    RiText.LEFT = 37; RiText.UP = 38; RiText.RIGHT = 39; RiText.DOWN = 40,  RiText.CENTER = 3;

    // ==== RiTaEvent ============

    RiText.UNKNOWN = -1; RiText.TEXT_ENTERED = 1; RiText.BEHAVIOR_COMPLETED = 2; RiText.TIMER_TICK = 3;

    // ==== TextBehavior ============

    RiText.MOVE_TO = 1; RiText.FADE_COLOR = 2; RiText.FADE_IN = 3; RiText.FADE_OUT = 4; RiText.FADE_TO_TEXT = 5; 
    RiText.TIMER = 6; RiText.SCALE_TO = 7; RiText.LERP = 8;

    // ==== Animation types ============

    RiText.LINEAR = Easing.Linear.None; 
    
    RiText.EASE_IN =  Easing.Exponential.In;
    RiText.EASE_OUT =  Easing.Exponential.Out; 
    RiText.EASE_IN_OUT =  Easing.Exponential.InOut;
    
    RiText.EASE_IN_EXPO =  Easing.Exponential.In;
    RiText.EASE_OUT_EXPO =  Easing.Exponential.Out;
    RiText.EASE_IN_OUT_EXPO =  Easing.Exponential.InOut;
    
    RiText.EASE_IN_SINE = Easing.Sinusoidal.In;
    RiText.EASE_OUT_SINE = Easing.Sinusoidal.Out;
    RiText.EASE_IN_OUT_SINE = Easing.Sinusoidal.InOut;
    
    RiText.EASE_IN_CUBIC =  Easing.Cubic.In;
    RiText.EASE_OUT_CUBIC = Easing.Cubic.Out;
    RiText.EASE_IN_OUT_CUBIC =  Easing.Cubic.InOut;
    
    RiText.EASE_IN_QUARTIC =  Easing.Quartic.In;
    RiText.EASE_OUT_QUARTIC =  Easing.Quartic.Out;
    RiText.EASE_IN_OUT_QUARTIC =  Easing.Quartic.InOut;
    
    RiText.EASE_IN_QUINTIC = Easing.Quintic.In;
    RiText.EASE_OUT_QUINTIC = Easing.Circular.Out;
    RiText.EASE_IN_OUT_QUINTIC = Easing.Circular.InOut;
    
    RiText.BACK_IN = Easing.Back.In;
    RiText.BACK_OUT = Easing.Back.Out;
    RiText.BACK_IN_OUT = Easing.Back.InOut;
    
    RiText.BOUNCE_IN = Easing.Bounce.In;
    RiText.BOUNCE_OUT = Easing.Bounce.Out;
    RiText.BOUNCE_IN_OUT = Easing.Bounce.InOut;
    
    RiText.CIRCULAR_IN = Easing.Circular.In;
    RiText.CIRCULAR_OUT = Easing.Circular.Out;
    RiText.CIRCULAR_IN_OUT = Easing.Circular.InOut;
    
    RiText.ELASTIC_IN = Easing.Elastic.In;
    RiText.ELASTIC_OUT = Easing.Elastic.Out;
    RiText.ELASTIC_IN_OUT = Easing.Elastic.InOut;
    
    RiText.defaults = { 
        
        color : { r : 0, g : 0, b : 0, a : 255 }, font:null, scaleX:1, scaleY:1,
        alignment : RiText.LEFT, motionType : RiText.LINEAR, rotateZ:0, 
        paragraphLeading :  0, paragraphIndent: '    ', indentFirstParagraph: false,
        fontFamily: "Times New Roman", fontSize: 14, fontLeading : 16, leadingFactor : 1.1,
        boundingBoxStroke : null, boundingBoxFill: null, boundingBoxVisible : false
    };

    
    RiText.prototype = {

        __init__ : function(text, x, y, font) { 
            
            text = text || E;
      
            this._color = { 
                r : RiText.defaults.color.r, 
                g : RiText.defaults.color.g, 
                b : RiText.defaults.color.b, 
                a : RiText.defaults.color.a 
            };
            
            var bbs = RiText.defaults.boundingBoxStroke;
            this._boundingBoxStroke = { 
                r : (bbs && bbs.r) || this._color.r, 
                g : (bbs && bbs.g) || this._color.g, 
                b : (bbs && bbs.b) || this._color.b, 
                a : (bbs && bbs.a) || this._color.a
            };
            
            var bbf = RiText.defaults.boundingBoxFill;
            this._boundingBoxFill = { 
                r : (bbf && bbf.r) || this._color.r, 
                g : (bbf && bbf.g) || this._color.g, 
                b : (bbf && bbf.b) || this._color.b, 
                a : (bbf && bbf.a) || 0
            };
    
            this._boundingBoxVisible = RiText.defaults.boundingBoxVisible;
            this._motionType = RiText.defaults.motionType;
            
            this._alignment = RiText.defaults.alignment;
            
            this._rotateZ = RiText.defaults.rotateZ;
            this._scaleX = RiText.defaults.scaleX;
            this._scaleY = RiText.defaults.scaleY;
     
            this._behaviors = [];
            this.font(font);
            //console.log('RiText) '+text);
            this.text(text);
            
            this.g = RiText.renderer;

            //console.log('RiText) '+this._rs.text +" / "+ this._font.name);
 
            this.x = arguments.length>1 ? x : this.g.__width() / 2 - this.textWidth() / 2.0;
            this.y = arguments.length>1 ? y : this.g.__height() / 2;
            
            //console.log("pos="+this.x+","+this.y+","+this._motionType);
            
            RiText.instances.push(this);
            
            return this;
        },
        
        draw : function() {
          this.update();
          this.render();   
          if (this.fadeToTextCopy)
              this.fadeToTextCopy.draw();
        },
        
        update : function() {
            
            var time = Date.now();
            this.updateBehaviors(time);

        },
//
//        updateMousePosition : function(curElement, event) {
//            var offset = calculateOffset(window, event);
//            p.mouseX = event.pageX - offset.X;
//            p.mouseY = event.pageY - offset.Y
//        },
        
        render : function() {
            
            var g = this.g;
            
            if (!g) throw Error('no-renderer');
            
            g.__pushState();
            
            if (this._rs && this._rs.length) {
            
                g.__pushState();
                
                // order: scale, center-point-trans, rotate,-center-point-trans,translate?
                
                g.__rotate(this._rotateZ);
                g.__translate(this.x, this.y);
                g.__scale(this._scaleX, this._scaleY, this.scaleZ); 
             
                // Set color
                g.__fill(this._color.r, this._color.g, this._color.b, this._color.a);
      
                // Set font params
                g.__textFont(this._font);
                g.__textAlign(this._alignment);
        
                // Draw text
                g.__text(this._rs.text, 0, 0);
        
                // And the bounding box
                if (this._boundingBoxVisible) {
                    
                    g.__fill(this._boundingBoxFill.r, this._boundingBoxFill.g, 
                        this._boundingBoxFill.b, this._boundingBoxFill.a);
                    
                    g.__stroke(this._boundingBoxStroke.r, this._boundingBoxStroke.g, 
                            this._boundingBoxStroke.b, this._boundingBoxStroke.a);
                    
                    var bb = g.__getBoundingBox(this);
                    
                    // shift bounds based on alignment
                    switch(this._alignment) {
                        case RiText.RIGHT:
                            g.__translate(-bb.width,0);
                            break;
                        case RiText.CENTER:
                            g.__translate(-bb.width/2,0);
                            break;
                    }
                    g.__rect(bb.x, bb.y, bb.width, -bb.height);
                }
                
                g.__popState();
            }
    
            return this;
        },
    
        /**
         * Sets/gets the animation <code>motionType</code> for this RiText
         * according to one of the following functions: <br>
         * <ul>
         * <li>RiText.LINEAR
         * <li>
         * <li>RiText.EASE_IN
         * <li>RiText.EASE_OUT
         * <li>RiText.EASE_IN_OUT
         * <li>
         * <li>RiText.EASE_IN_EXPO
         * <li>RiText.EASE_OUT_EXPO
         * <li>RiText.EASE_IN_OUT_EXPO
         * <li>
         * <li>RiText.EASE_IN_SINE
         * <li>RiText.EASE_OUT_SINE
         * <li>RiText.EASE_IN_OUT_SINE
         * <li>
         * <li>RiText.EASE_IN_CUBIC
         * <li>RiText.EASE_OUT_CUBIC
         * <li>RiText.EASE_IN_OUT_CUBIC
         * <li>
         * <li>RiText.EASE_IN_QUARTIC
         * <li>RiText.EASE_OUT_QUARTIC
         * <li>RiText.EASE_IN_OUT_QUARTIC
         * <li>
         * <li>RiText.EASE_IN_QUINTIC
         * <li>RiText.EASE_OUT_QUINTIC
         * <li>RiText.EASE_IN_OUT_QUINTIC
         * <li>
         * <li>RiText.BACK_IN
         * <li>RiText.BACK_OUT
         * <li>RiText.BACK_IN_OUT
         * <li>
         * <li>RiText.BOUNCE_IN
         * <li>RiText.BOUNCE_OUT
         * <li>RiText.BOUNCE_IN_OUT
         * <li>
         * <li>RiText.CIRCULAR_IN
         * <li>RiText.CIRCULAR_OUT
         * <li>RiText.CIRCULAR_IN_OUT
         * <li>
         * <li>RiText.ELASTIC_IN
         * <li>RiText.ELASTIC_OUT
         * <li>RiText.ELASTIC_IN_OUT                  
         * </ul>
         * 
         * @param number - motionType
         * @returns number - motionType
         */
        motionType : function (motionType)
        {
            if (arguments.length == 1) {
                this._motionType = motionType;
                return this;
            }
            return this._motionType;
        },
        
        /**
         * Fades in current text over <code>seconds</code> starting at
         * <code>startTime</code>. Interpolates from the current color {r,g,b,a}
         * to {r,g,b,255}.
         * 
         * @param number - startTime
         *          time in future to start
         * @param number - seconds
         *          time for fade
         * @returns number - a unique id for this behavior
         */
        fadeIn : function(seconds, delay, callback) {
            
            return this.fadeColor
                ([this._color.r, this._color.g, this._color.b, 255], seconds, delay, null, 'fadeIn', false);
        },
    
        /**
         * Fades out current text over <code>seconds</code> starting at
         * <code>startTime</code>. Interpolates from the current color {r,g,b,a} 
         * to {r,g,b,0}.
         *
         * @param number - seconds
         *          time for fade
         * @param number - delay 
         *          (optional, default=0),  # of seconds in the future that the fade will start 
         *          
         * @param function - the callback to be invoked when the behavior has completed (optional: default=onRiTaEvent(e)
         * 
         * @param boolean - removeOnComplete
         *          (optional, default=false), destroys the object when the behavior completes
         * @returns number - the unique id for this behavior
         */
        fadeOut : function(seconds, delay, callback, destroyOnComplete) {
    
            destroyOnComplete = destroyOnComplete || false;
            return this.fadeColor
                ([this._color.r, this._color.g, this._color.b, 0], seconds, delay, null, 'fadeOut', destroyOnComplete);
        },
    
        /**
         * Transitions to 'color' (rgba) over 'seconds' starting at 'delay' seconds in the future
         * 
         * @param array - (length 1-4)  r,g,b,a (0-255)
         * 
         * @param number - delay 
         *          (optional, default=0),  # of seconds in the future that the fade will start 
         * @param number - seconds
         *          time for fade
         * @param function - the callback to be invoked when the behavior has completed (optional: default=onRiTaEvent(e)
         * @returns object - this RiText
         */
        fadeColor : function(colors, seconds, delay, callback, type, destroyOnComplete) {

            if (getType(colors) != 'array') 
                throw Error('arg-1 to fadeColor must be an array');
            
            //console.log(colors[0], g: colors[1], b: colors[2], a: colors[3], seconds);
            var rt = this;
            
            delay = delay || 0;
            seconds = seconds || 1.0;
            type = type || 'fadeColor';            
            colors = parseColor.apply(this, colors);

            setTimeout(function() {

                new TextBehavior(rt, rt._color)
                    .to( { r: colors.r, g: colors.g, b: colors.b, a: colors.a }, seconds*1000)
                    .easing(rt._motionType)
                    .onUpdate( function () {
                       rt._color.r = this.r;
                       rt._color.g = this.g;
                       rt._color.b = this.b;
                       rt._color.a = this.a
                    })
                    //.delay(delay)
                    .onComplete( 
                        function () {
                            RiTaEvent(rt, type+'Complete').fire(callback);    
                            if (destroyOnComplete) RiText.dispose(rt);
                        })
                    .start();
                
            }, delay*1000);
            
            return this;
        },
        
        /**
         * Scales to 'theScale' over 'seconds' starting at 'delay' seconds in the future
         * 
         * @param number - delay 
         *          (optional, default=0),  # of seconds in the future that the fade will start 
         *          
         * @param number - seconds
         *          time for fade
         *          
         * @param function - the callback to be invoked when the behavior has completed (optional: default=onRiTaEvent(e)
         * 
         * @returns object - this RiText
         */
        scaleTo : function(theScale, seconds, delay, callback) {

            var rt = this;
            
            delay = delay || 0;
            seconds = seconds || 1.0;
                
            setTimeout(function() {
                
                var tb = new TextBehavior(rt)
                    .to( { _scaleX: theScale, _scaleY: theScale }, seconds*1000)
                    .easing(rt._motionType)
                    .onUpdate( function () {
                        rt._scaleX = this._scaleX;
                        rt._scaleY = this._scaleY;
                    })
                    //.delay(delay*1000)
                    .onComplete( 
                        function () {
                           RiTaEvent(rt, 'scaleToComplete').fire(callback);                    
                    });
            
                tb.start();
                
            }, delay*1000);
                
            return this;
        },
        
        /**
         * Rotates to 'radians' over 'seconds' starting at 'delay' seconds in the future
         * 
         * @param number - delay 
         *          (optional, default=0),  # of seconds in the future that the fade will start 
         *          
         * @param number - seconds
         *          time for fade
         *          
         * @param function - the callback to be invoked when the behavior has completed (optional: default=onRiTaEvent(e)
         * 
         * @returns object - this RiText
         */
        rotateTo : function(angleInRadians, seconds, delay, callback) {

            var rt = this;
            
            delay = delay || 0;
            seconds = seconds || 1.0;
                
            setTimeout(function() {
                
                var tb = new TextBehavior(rt)
                    .to( { _rotateZ: angleInRadians  }, seconds*1000)
                    .easing(rt._motionType)
                    .onUpdate( function () {
                        rt._rotateZ = this._rotateZ;
                    })
                    //.delay(delay*1000)
                    .onComplete( 
                        function () {
                           RiTaEvent(rt, 'rotateToComplete').fire(callback);                    
                    });
            
                tb.start();
                
            }, delay*1000);
                
            return this;
        },
        
        
        
        /**
         * Fades out the current text and fades in the <code>newText</code> over
         * <code>seconds</code> starting at 'startTime' seconds in the future
         * 
         * @param String - newText
         *          to be faded in
         * @param number - seconds
         *          time for fade
         * @param number - delay 
         *          (optional, default=0),  # of seconds in the future that the fade will start
         *           
         * @param number - endAlpha 
         *  (optional, default=255), the alpha to end on
         *  
         * @param function - the callback to be invoked when the behavior has completed (optional: default=onRiTaEvent(e)
         * 
         *
         * @returns this RiText
         */
        fadeToText : function(newText, seconds, delay, endAlpha, callback)
        {
          // grab the alphas if needed
          var c = this._color, startAlpha = 0, endAlpha = endAlpha || 255; // this._color.a
          
          if (this.fadeToTextCopy) 
          {
            startAlpha = this.fadeToTextCopy.alpha();
            RiText.dispose(this.fadeToTextCopy); // stop any currents
          }
        
          // use the copy to fade out
          this.fadeToTextCopy = this.clone().fadeOut(seconds, 0, true);
          RiText.dispose(this.fadeToTextCopy.fadeToTextCopy); // avoid the turtles
          
          // and use 'this' to fade in
          this.text(newText).alpha(startAlpha);
          return this.fadeColor(c.r, c.g, c.b, endAlpha, seconds * .95, delay, 'fadeToText');
        },
       
        /**
         * Move to new x,y position over 'seconds'
         * <p>
         * Note: uses the current <code>motionType</code> for this object, starting at 'delay' seconds in the future
         * 
         * @param number - newX
         * @param number - newY
         * @param number - seconds
         * @param number - delay
         * @param function - the callback to be invoked when the behavior has completed (optional: default=onRiTaEvent(e)
         * 
         * @returns this RiText
         */
        moveTo : function(newX,newY,seconds,delay,callback) {
            
            var rt = this;
            
            delay = delay || 0;
            seconds = seconds || 1.0;
            
            setTimeout(function() {
                
                new TextBehavior(rt)
                    .to( { x: newX, y: newY }, seconds*1000)
                    .easing(rt._motionType)
                    .onUpdate( function () {
                        rt.x = this.x ;
                        rt.y = this.y ;
                    })
                    .delay(delay).onComplete( 
                        function () {
                            RiTaEvent(rt, 'moveToCompleted').fire(callback);                    
                        })
                    .start();
                
            }, delay*1000);
            
            return this;
        },
        
        /**
         * Set/gets the text for this RiText
         * 
         * @param string - the new text (optional)
         * 
         * @returns this RiText (for sets) or the current text (for gets)
         */
        text : function(txt) {
            
            if (arguments.length == 1) {
                
                var theType = getType(txt);
                if (theType == 'number') {
                    txt = String.fromCharCode(txt);
                }
                else if (theType == 'object' && typeof txt.getText == 'function') { 
                    txt = txt.getText();
                }
                this._rs = (this._rs) ? this._rs.setText(txt) : new RiString(txt);
     
                return this;
            }
            
            return this._rs.text;
        },
        
        /**
         * Returns the distance between the center points of this and another RiText
         * @returns number - the distance
         */
        distanceTo : function(riText)
        {
          var p1 = this.center(), p2 = riText.center();
          return RiText.dist( p1.x,  p1.y,  p2.x,  p2.y);
        },
      
        /**
         * Returns the center point of this RiText as derived from its bounding box
         * @returns object - { x, y }
         */
        center : function() {
            
            var bb = boundingBox();
            return { x: bb.x+bb.width/2, y: bb.y - bb.height/2 };
        },
        
        toString : function() {
            
            var s =  (this._rs && this._rs.text) || "undefined";
            return '['+Math.round(this.x)+","+Math.round(this.y)+",'"+s+"']";
        },
        
        /**
         * Splits the object into an array of RiTexts, one per word
         * tokenized with the supplied regex.
         * @param regex - object or string on which to split
         */
        splitWords : function(regex) {
            
            regex = regex || ' ';
            
            (typeof regex == 'string') && (regex = new RegExp(regex));  
            
            var l = [];
            var txt = this._rs.text;
            var words = txt.split(regex);
    
            for ( var i = 0; i < words.length; i++) {
                if (words[i].length < 1) continue;
                var tmp = this.clone();
                tmp.text(words[i]);
                var mx = wordOffsetFor(this, words, i);
                tmp.position(mx, this.y);
                l.push(tmp);
            }
    
            return l;
        },
    
        /**
         * Splits the object into an array of RiTexts, one per letter.
         * @returns array of RiTexts
         */
        splitLetters : function() {
    
            var l = [];
            var chars = [];
            var txt = this.text();
            var len = txt.length;
            for (var t = 0; t < len; t++) {
                chars[t] = txt.charAt(t);
            }
    
            for ( var i = 0; i < chars.length; i++) {
                if (chars[i] == ' ') continue;
                var tmp = this.clone();
                tmp.text(chars[i]);
                var mx = this.charOffset(i);
                tmp.position(mx, this.y);
    
                l.push(tmp);
            }
    
            return l;
        },
        
        /**
         * Returns true if the bounding box for this RiText contains the point mx/my
         * 
         * @param number - mx
         * @param number - my
         * @return boolean
         */
        contains : function(mx, my) {
                        
           var bb = this.g.__getBoundingBox(this);
           
//           // TODO: need to test this with point
//           if (!my && getType(mx.x) == 'Number' && getType(mx.y) == 'Number') {
//               mx = mx.x;
//               my = mx.y;
//           }
//           
           bb.x += this.x;
           bb.y += this.y;
           
           return (!(mx<bb.x || mx > bb.x+bb.width || my > bb.y || my < bb.y-bb.height));
        },
        
        /**
         * Creates and returns a new (copy) of this RiText
         * @returns RiText
         */
        clone : function() {

            var c = new RiText(this.text(), this.x, this.y, this._font);
            c.color(this._color.r, this._color.g, this._color.b, this._color.a);

            for (prop in this) {
                if (typeof this[prop] ==  'function' || typeof this[prop] ==  'object') 
                    continue;
                c[prop] = this[prop];
            }

            return c;
        },
        
        /**
         * Set/gets the alignment for this RiText (RiText.LEFT || RiText.CENTER || RiText.RIGHT)
         * 
         * @param align - the alignment (optional)
         * @returns this RiText (set) or the current font (get)
         */
        align : function(align) {
            if (arguments.length) {
                this._alignment = align;
                return this;
            }
            return this._alignment;
        },

        
        /**
         * Set/gets the font for this RiText
         * 
         * @param object - containing the font data (optional) OR
         * @param string - containing the font name AND
         * @param number - containing the font size (optional)
         * @returns this RiText (set) or the current font (get)
         */
        font : function(font,size) {
            var a = arguments;
            if (a.length == 2) {
                return this.font(RiText.createFont(a[0],a[1]));
            }
            else if (a.length == 1) {

                this._font = font || RiText.getDefaultFont();
                this._font.size = this._font.size || RiText.defaults.fontSize;
                this._font.leading = this._font.leading || this._font.size * RiText.defaults.leadingFactor;
                return this;
            }
            else if (a.length == 0) {
                return this._font;
            }
        },    
        

        /**
         * Set/gets the boundingbox visibility for this RiText
         * 
         * @param boolean - true or false (optional)
         * @returns this RiText (set) or the current boolean value (get)
         */
        showBoundingBox : function(trueOrFalse) {
           if (arguments.length == 1) {
               this._boundingBoxVisible = trueOrFalse;
               return this;
           }
           return this._boundingBoxVisible;
        },

        /**
         * Set/gets the color for this RiText
         * 
         * @param takes 1-4 number values for rgba, or an array of size 1-4
         * 
         * @returns object - either this RiText (for sets) or the current color object (for gets)
         */
        color : function(cr, cg, cb, ca) {
            
            if (arguments.length == 0) 
                return this._color;
            this._color = parseColor.apply(this, arguments);
            return this;
        },
    
        /**
         * Returns false if the alpha value of this object is <= 0, else true if the objects is not hidden
         * @returns boolean 
         */
        visible : function() {  // isVisible?
            if (arguments.length)
                 throw Error('visible() takes no arguments');
            return this._color.a > 0;
        },
        
        /**
         * Set/gets the alpha (transparency) for this RiText
         * 
         * @param number (optional) input (0-255) 
         * @returns object - either this RiText (for set) or number - the current alpha value (for get)
         */
        alpha : function(a) {
            if (arguments.length==1) {
                this._color.a = a;
                return this;
            }
            else return this._color.a;
        },
    
        /**
         * Set/gets the x/y position for this RiText
         * 
         * @param number (optional) X coordinate
         * @param number (optional) Y coordinate
         * @returns array of number, the [X, Y] postition
         */
        position : function(x,y) {
            if (arguments.length==2) {
                this.x = x;
                this.y = y;
                return this;
            }
            else return [ this.x, this.y ];
        },
     
        /**
         * Sets/gets the 2d rotation for this RiText
         * 
         * @param number degree to rotate
         * 
         * @returns object - either this RiText (for set) or number - the current degree to rotation (for get)
         */
        rotate : function(rotate) {
          this._rotateZ = rotate;
          return this;
        },
    
        /**
         * Set the x/y scale for this RiText
         * 
         * @param number scale ratio
         * 
         */
        scale : function(theScale) {
    
            this._scaleX = theScale;
            this._scaleY = theScale;
            return this;
        },
    
        /**
         * Returns the pixel x-offset for the character at 'charIdx'
         * 
         * @param number charIdx
         * @returns number - the pixel x-offset
         */
        charOffset : function(charIdx) {
    
            var theX = this.x;
    
            if (charIdx > 0) {
    
                var txt = this.text();
    
                var len = txt.length;
                if (charIdx > len) // -1?
                charIdx = len;
    
                var sub = txt.substring(0, charIdx);
                theX = this.x + this.g.__textWidth(this._font, sub);
            }

            return theX;
        },
        
        /**
         * Returns the pixel x-offset for the word at 'wordIdx'
         * @param number wordIdx
         * @returns number - the pixel x-offset
         */
        wordOffset : function(wordIdx) { 
            var words =  this.text().split(' ');
            return wordOffsetFor(this, words, wordIdx);
        },

        /**
         * Returns the bounding box for the current text.
         * @returns object - x,y,width,height 
         */
        boundingBox : function() {
          var bb = this.g.__getBoundingBox(this);
//          if (0 && transformed) { // tmp: do with matrix
//              bb.x += this.x;
//              bb.y += this.y;
//              bb.width *= this._scaleX;
//              bb.height *= this._scaleY;
//          }
//          * @param boolean (optional, default=false) 
//          *   if true, bounding box is first transformed (rotate,translate,scale) 
//          * according to the RiTexts current matrix
          return bb;
        },
        
        /**
         * Returns the current width of the text (derived from the bounding box)
         * @returns number - the width of the text
         */
        //@param boolean (optional, default=false) if true, width is first scaled
        textWidth : function() { 
            
            return this.g.__textWidth(this._font,this._rs.text);
        },
        
        /**
         * Returns the current height of the text (derived from the bounding box)
         * @returns number - the current height of the text
         */
        // * @param boolean (optional, default=false) if true, height is first scaled
        textHeight : function() { 
            
            return this.g.__textHeight(this);
        },
        
        /**
         * Sets/gets the size of the current font. Note that this method only
         * effects only scaleX/Y, not the font's internal properties 
         * 
         * @param number -  font size (optional)
         * @returns object - either this RiText (for set) or number - the current font size (for get)
         */
        fontSize : function(sz) {
            
            return (arguments.length==1) ? this.scale(sz/this._font.size) : this.font.size*this.scaleX; 
        },
        
        /**
         * Returns the ascent of the current font 
         * @returns number - the ascent of the current font
         */
        textAscent : function() { 
            return this.g.__textAscent(this);
        },
        
        /**
         * Returns the descent of the current font 
         * @returns number - the descent of the current font 
         */
        textDescent : function() { 
            return this.g.__textDescent(this);
        },
    
        /**
         * Removes the character at the specified index
         * 
         * @param number - the index
         * @returns RiText
         */
        removeCharAt : function(ind) { 
            
            this._rs.removeCharAt(ind);
            return this;
            
        },
        
        /**
         * Returns all existing text behaviors for the object  
         * @returns Array
         */
        behaviors: function () {

            return this._behaviors;

        },
        /**
         * Removes all text behaviors for the object  
         * @returns Array
         */
        removeBehaviors: function () {

            this._behaviors = [];

        },
        /**
         * Adds a new text behaviors to the object  
         * @returns Array
         */
        addBehavior: function ( behavior ) {

            this._behaviors.push( behavior );

        },
        
        /**
         * Removes the text behaviors for the object  
         * @param String - the behaviors
         */
        removeBehavior: function ( behavior ) {

            var i = this._behaviors.indexOf(behavior);

            if ( i !== -1 ) {

                this._behaviors.splice( i, 1 );

            }

        },
        
        // TODO: make PRIVATE
        /**
         * Updates existing text behaviors for the object 
         * @param String - the behaviors
         */
        updateBehaviors: function (time) {

            var i = 0;
            var num = this._behaviors.length;
            var time = time || Date.now();

            while ( i < num ) {

                if (this._behaviors[ i ].update(time) ) {
                    i++;

                } else {

                    this._behaviors.splice(i, 1);
                    num --;

                }
            }
        }
    }
    
    var RiText_P5 = makeClass();

    RiText_P5.prototype = {

        __init__ : function(p) {
            this.p = p;
            this.xxx = p;
            console.log('init:'+this.p);
        },
        
        __size : function() {
            return this.p.size.apply(this, arguments);
        },
        
        __getGraphics : function() {
            return this.p;
        },
        
        __pushState : function(str) {
            this.p.pushStyle();
            this.p.pushMatrix();
            return this;
        },
        
        __popState : function() {
            this.p.popStyle();
            this.p.popMatrix();
            return this;
        },

        __textAlign : function(align) {
            this.p.textAlign.apply(this,arguments);
            return this;
        },
        
        __scale : function(sx, sy) {
            this.p.scale(sx, sy, 1);
        },
        
        __translate : function(tx, ty) {
            this.p.translate(tx, ty, 0);
        },
        
        __rotate : function(zRot) {
 
            this.p.rotate(zRot);
        },
        
        __text : function(str, x, y) {
            this.p.text.apply(this,arguments);
        },
        
        __fill : function(r,g,b,a) {
            //console.log('__fill:'+r+','+g+','+b+','+a);
            this.p.fill.apply(this,arguments);
        },
        
        __stroke : function(r,g,b,a) {
            //console.log('__stroke:'+r+','+g+','+b+','+a);
            this.p.stroke.apply(this,arguments);
        },
        
        __background : function(r,g,b,a) {
            this.p.background.apply(this,arguments);
        },

        // actual creation: only called from RiText.createDefaultFont();!
        __createFont : function(fontName, fontSize, leading) { // ignores leading
            
            //console.log("[P5] Creating font: "+fontName+"-"+fontSize+"/"+leading);
            var font = this.p.createFont(fontName, fontSize);            
            //console.log("[P5] Created font: "+font.name+"-"+font.size+"/"+font.leading);
            
            return font;
        },

        __rect : function(x,y,w,h) {
            this.p.rect.apply(this,arguments);
        },
        
        __line : function(x1,y1,x2,y2,lw) {
            if (lw) p.strokeWeight(lw);
            this.p.line.apply(this,arguments);
        },
        
        __textFont : function(fontObj) {
            if (getType(fontObj)!='object') throw Error("__textFont takes object!");
            this.p.textFont(fontObj, fontObj.size);
        },
        
        __textWidth : function(fontObj, str) {
            this.p.pushStyle();
            this.p.textFont(fontObj,fontObj.size); // was __textFont
            var tw = this.p.textWidth(str);
            this.p.popStyle();
            return tw;
        },
        
        __textHeight : function(rt) {
            return this.__getBoundingBox(rt).height;
        },
        
        __textAscent : function(rt) {
            this.p.pushStyle();
            this.p.textFont(rt._font, rt._font.size);
            var asc = this.p.textAscent();
            this.p.popStyle();
            return asc;
        },
        
        __textDescent : function(rt) {
            this.p.pushStyle();
            this.p.textFont(rt._font, rt._font.size);
            var dsc = this.p.textDescent();
            this.p.popStyle();
            return dsc;
        },

        __width : function() {

            return this.p.width;
        },
        
        __height : function() {

            return this.p.height;
        },
        
        // what about scale?
        __getBoundingBox : function(rt) {
            
            this.p.pushStyle();
            
            var ascent  =   Math.round(this.p.textAscent());
            var descent =   Math.round(this.p.textDescent());
            //console.log('[P5] ascent='+ascent+' descent='+descent+" h="+(ascent+descent));

            var width   =   Math.round(this.p.textWidth(rt.text()));
            
            this.p.popStyle();
            
            return { x: 0, y: descent-1, width: width, height: (ascent+descent)+1 };
        },
        
        __type : function() {
            return "Processing";
        },
        
        toString : function() {
            return "RiText_"+this.__type;
        }
    };

    if (typeof Processing !== 'undefined') {
        
        Processing.registerLibrary("RiTaP5", {
            
            //console.log("Processing.registerLibrary()");
            p : null, 
            
            init : function(obj) {
              //console.log("Processing.registerLibrary.init: ");
            },
        
            attach : function(p5) {
                p = p5;
                //console.log("Processing.registerLibrary.attach: ");
                RiText.renderer = new RiText_P5(p5);
            },
            
            detach : function(p5) {
                console.log("Processing.registerLibrary.detach: ");
            },
            
            //exports : [] // export global function names?
               
        });
    }
    else {
        var cnv = document.getElementsByTagName("canvas")[0];
        try {
            var context2d = cnv.getContext("2d");
            RiText.renderer = new RiText_Canvas(context2d);
        }
        catch(e) {
            throw Error("[RiText] No object with id='canvas' in DOM");
        }
    }
    
    //////////////////////////////////////////////////////////////////////////////////////
    
    RiTaEvent.callbacksDisabled = false;
    
    RiTaEvent.prototype = {
        
        __init__ : function(sourceRiText, eventType) //, data) {
        {
            var fn = RiTaEvent.prototype.__init__;
            if (!fn.ID) fn.ID = 0;
            //console.log('fn.ID='+fn.ID);
            this._id = ++(fn.ID);
            this._source = sourceRiText;
            this._type = eventType || RiText.UNKNOWN;
            //this._data = data;
        }, 
        
        toString : function() {
            //console.log(this._source);
            return "RiTaEvent[#"+this._id+" type="+this._type+" src="+this._source.toString()+"]";//+", data="+this._data+"]";
        },
        
        source : function() {
            return this._source;
        },
        
        type : function() {
            return this._type;
        },
        
        fire : function(callback) {

            callback = callback || window.onRiTaEvent || RiText.graphics().onRiTaEvent; // last is for P5
            
            if (typeof callback === 'function') {
               try {
                   callback.apply(this,[this]);
               }
                catch(err) {
                    RiTaEvent.callbacksDisabled = true;
                    console.warn("RiTaEvent: error calling 'onRiTaEvent' "+err);
                    throw err;
                }                
            }
            else if (!RiTaEvent.callbacksDisabled) {
                console.warn("RiTaEvent: no 'onRiTaEvent' callback found");
                RiTaEvent.callbacksDisabled = true;
            }
        },
    }
    
    //////////////////////////////////////////////////////////////////////////////////////


    if (0 && !window.requestAnimationFrame) { // not used at moment
        
        window.requestAnimationFrame = (function () {
            return window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            window.oRequestAnimationFrame ||
            window.msRequestAnimationFrame ||
            function ( callback,element) {
                window.setTimeout(callback, 1000 / RiText.frameRate); // Fallback timeout
            };
        })();
    }
    
    
    //////////////////////////////////////////////////////////////////////////////////////
    
    if (RiTa.P5_COMPATIBLE) {
        
        // alias P5 member delegates 
        RiText.prototype.fill       = RiText.prototype.color;
        RiText.prototype.setColor   = RiText.prototype.color;
        RiText.prototype.textAlign  = RiText.prototype.align;
        RiText.prototype.textFont   = RiText.prototype.font;
        RiText.prototype.textSize   = RiText.prototype.size;
        RiText.prototype.setText    = RiText.prototype.text;
        
        // alias P5 static delegates 
        RiText.setDefaultFont = RiText.defaultFont;
        RiText.setDefaultColor = RiText.defaultColor;
        RiText.setDefaultAlignment = RiText.defaultAlignment;
        RiText.setCallbackTimer = RiText.timer;
        
        // p5-compatible mode ???? (pollution)
        window.line = RiText.line;
        window.size = RiText.size;
        window.width = RiText.width;
        window.height = RiText.height;
        window.createFont = RiText.createFont;
        window.background = RiText.background;
        window.random = RiText.random;
        window.RIGHT = RiText.RIGHT;
        window.LEFT = RiText.LEFT;
        window.CENTER = RiText.CENTER;
        
        window.onload = function() {
            if (typeof setup == 'function') setup();
            if (typeof draw == 'function') RiText.loop();
        }
    }
    
    /////////////////////////////////////////////////////////////////////////////////////////

    // expose public objects
    
    window.RiText = RiText;
    RiText.TextBehavior = TextBehavior;  // TODO: remove
    RiText.createLinesByCharCountFromArray = createLinesByCharCountFromArray; // TODO: remove  

})(window);
