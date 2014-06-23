(function(window, undefined) {
	
	var _VERSION_ = '##version##';	

	/*  @private Simple type-checking functions */ 
	var Type = {
		
		N : 'number', S : 'string', O : 'object', A :'array', B : 'boolean', R : 'regexp', F : 'function',
		
		// From: http://javascriptweblog.wordpress.com/2011/08/08/fixing-the-javascript-typeof-operator/ 
		get : function(obj) {
			
			if (typeof obj == 'undefined') return null;
			return ({}).toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase();
		},
		
		// Returns true if the object is of type 'type', otherwise false
		 
		is : function(obj,type) {
			
			return Type.get(obj) === type;
		},
		
		// Throws TypeError if not the correct type, else returns true
		ok : function(obj,type) {
			
			if (Type.get(obj) != type) {
				
				throw TypeError('Expected '+(type ? type.toUpperCase() : type+E)
					+ ", but received "+(obj ? Type.get(obj).toUpperCase() : obj+E));
			}
			
			return true;
		}
		
	},  is = Type.is, ok = Type.ok; // alias

	var Easing = { // Penner's canonical set
	
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
	
				return 1 - (--k) * k * k * k;	
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
	
				return Math.sqrt( 1 - (--k) * k );	
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

	var Interpolation = {
	
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
			} 
			else {
	
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
	
				};
			})(),
	
			CatmullRom: function ( p0, p1, p2, p3, t ) {
	
				var v0 = ( p2 - p0 ) * 0.5, v1 = ( p3 - p1 ) * 0.5, t2 = t * t, t3 = t * t2;
				return ( 2 * p1 - 2 * p2 + v0 + v1 ) * t3 + ( - 3 * p1 + 3 * p2 - 2 * v0 - v1 ) * t2 + v0 * t + p1;
			}
		}
	};
		
	// ////////////////////////////////////////////////////////////
	// RiTa object (singleton)
	// ////////////////////////////////////////////////////////////

	RiTa = {

		/* The current version of the RiTa tools */
		VERSION : _VERSION_,

		/* For tokenization, Can't -> Can not, etc. */
		SPLIT_CONTRACTIONS : false,
		
		// :::: For RiTaEvents :::::::::
	
	    MOVE_TO : "MoveTo",
	    COLOR_TO : "ColorTo",
	    FADE_IN : "FadeIn",
	    FADE_OUT : "FadeOut",
	    TEXT_TO : "TextTo",
	    TIMER : "Timer",
	    SCALE_TO : "ScaleTo",
	    ROTATE_TO : "RotateTo",
	    TEXT_ENTERED : "TextEntered",
	    BOUNDING_ALPHA : "BoundingAlpha",
	    DATA_LOADED : "DataLoaded",
	    UNKNOWN : "Unknown",
	    INTERNAL : "Internal",
		LERP : "Lerp",

	  	JAVA : 1, JS : 2, NODE : 3,

		// :::: RiText Constants  ::::::::: 

		LEFT : 37, UP : 38, RIGHT : 39, DOWN : 40,  CENTER : 3,
	
		// :::: Animation types :::::::::
	
		LINEAR : Easing.Linear.None, 
		
		EASE_IN :  Easing.Exponential.In,
		EASE_OUT :  Easing.Exponential.Out, 
		EASE_IN_OUT :  Easing.Exponential.InOut,
		
		EASE_IN_EXPO :  Easing.Exponential.In,
		EASE_OUT_EXPO :  Easing.Exponential.Out,
		EASE_IN_OUT_EXPO :  Easing.Exponential.InOut,
		
		EASE_IN_SINE : Easing.Sinusoidal.In,
		EASE_OUT_SINE : Easing.Sinusoidal.Out,
		EASE_IN_OUT_SINE : Easing.Sinusoidal.InOut,
		
		EASE_IN_CUBIC :  Easing.Cubic.In,
		EASE_OUT_CUBIC : Easing.Cubic.Out,
		EASE_IN_OUT_CUBIC :  Easing.Cubic.InOut,
		
		EASE_IN_QUARTIC :  Easing.Quartic.In,
		EASE_OUT_QUARTIC :  Easing.Quartic.Out,
		EASE_IN_OUT_QUARTIC :  Easing.Quartic.InOut,
		
		EASE_IN_QUINTIC : Easing.Quintic.In,
		EASE_OUT_QUINTIC : Easing.Quintic.Out,
		EASE_IN_OUT_QUINTIC : Easing.Quintic.InOut,
		
		BACK_IN : Easing.Back.In,
		BACK_OUT : Easing.Back.Out,
		BACK_IN_OUT : Easing.Back.InOut,
		
		BOUNCE_IN : Easing.Bounce.In,
		BOUNCE_OUT : Easing.Bounce.Out,
		BOUNCE_IN_OUT : Easing.Bounce.InOut,
		
		CIRCULAR_IN : Easing.Circular.In,
		CIRCULAR_OUT : Easing.Circular.Out,
		CIRCULAR_IN_OUT : Easing.Circular.InOut,
		
		ELASTIC_IN : Easing.Elastic.In,
		ELASTIC_OUT : Easing.Elastic.Out,
		ELASTIC_IN_OUT : Easing.Elastic.InOut,

		// For Conjugator =================================

		PHONEMES : 'phonemes',
		
		STRESSES : 'stresses',
		
		SYLLABLES : 'syllables',
		
		FIRST_PERSON : 1,

		SECOND_PERSON : 2,

		THIRD_PERSON : 3,

		PAST_TENSE : 4,

		PRESENT_TENSE : 5,

		FUTURE_TENSE : 6,

		SINGULAR : 7,

		PLURAL : 8,

		NORMAL : 9,

		FEATURE_DELIM : ':',
	
		STRESSED : '1',
	
		UNSTRESSED : '0',
	
		PHONEME_BOUNDARY : '-', 
	
		WORD_BOUNDARY : " ", 
	
		SYLLABLE_BOUNDARY : "/", 
	
		SENTENCE_BOUNDARY : "|",
	
		VOWELS : "aeiou",
		
		ABBREVIATIONS : [   "Adm." ,"Capt." ,"Cmdr." ,"Col." ,"Dr." ,"Gen." ,"Gov." ,"Lt." ,"Maj." ,"Messrs." ,"Mr.","Mrs." ,"Ms." ,"Prof." ,"Rep." ,"Reps." ,"Rev." ,"Sen." ,"Sens." ,"Sgt." ,"Sr." ,"St.","a.k.a." ,"c.f." ,"i.e." ,"e.g." ,"vs." ,"v.", "Jan." ,"Feb." ,"Mar." ,"Apr." ,"Mar." ,"Jun." ,"Jul." ,"Aug." ,"Sept." ,"Oct." ,"Nov." ,"Dec." ],

		/* The infinitive verb form  - 'to eat an apple' */
		INFINITIVE : 1,

		/* Gerund form of a verb  - 'eating an apple' */
		GERUND : 2,

		/* The imperative verb form - 'eat an apple!' */
		IMPERATIVE : 3,

		/* Bare infinitive verb form - 'eat an apple' */
		BARE_INFINITIVE : 4,

		/* The subjunctive verb form */
		SUBJUNCTIVE : 5,
 
		/* Set to true to disable all console output */
		SILENT : false,
		
		// Start Methods =================================
		
		start : function() { /* no-op, just for api */ },

		untokenize : function(arr, delim, adjustPunctuationSpacing) {
			 
			delim = delim || SP;
			adjustPunctuationSpacing = adjustPunctuationSpacing || 1;
			
			if (adjustPunctuationSpacing) {
				
				var newStr = arr[0] || E;
				for ( var i = 1; i < arr.length; i++) {
					if (arr[i]) {
						if (!RiTa.isPunctuation(arr[i]))
							newStr += delim;
						newStr += arr[i];
					}
				}
				
				return newStr.trim();
			}
 
			return arr.join(delim);  
		},

		random : function() {
			
			var currentRandom = Math.random();
			if (arguments.length === 0) return currentRandom;
			if (arguments.length === 1) return currentRandom * arguments[0];
			var aMin = arguments[0], aMax = arguments[1];
			
			return currentRandom * (aMax - aMin) + aMin;
		},
		
		 randomItem : function(arr) {
			
			return arr[Math.floor(Math.random()*arr.length)];
		 }, 
	
		distance : function(x1,y1,x2,y2) {
			
			var dx = x1 - x2, dy = y1 - y2;
			return Math.sqrt(dx * dx + dy * dy);
		},
		
		// TODO: test (with and w'out callback)
		timer : function(period, callback) {
			 
			var a = arguments;
			
			// if 1st arg is an object (e.g., 'this'), ignore it...
			if (a.length && is(a[0], O)) 
				a = Array.prototype.slice.call(a, 1);
			
			if (a.length < 1)
				throw Error("Bad args to RiTa.timer("+a+")");
				
			var callback = a.length > 1 ? a[1] : null;
				
			var timer = new Timer(
				function() {       					
					RiTaEvent(RiTa, 'tick')._fire(callback);  
			}, [a[0]] * 1000, true);
			
			timer.go();
			var id = timer.id(); 
			timers[id] = timer;
			
			return id;
		}, 
		
		// TODO: test
		stopTimer : function(id) { 
			
			// TODO: THIS DEFINITELY BROKEN
			if (timers[id])  
				timers[id].stop();
			else
				warn('no timer with id: '+id);
		}, 

		// TODO: test
		pauseTimer : function(id, pauseSec) {  
		 
		 	//console.log("id: "+id);
		 	
			pauseSec = is(pauseSec, N) ? pauseSec : Number.MAX_VALUE;
			
			if (timers[id])  {
				
				timers[id].pause();
				
				var theId = id;
				
				//console.log("OK-theId: "+theId);
				
				setTimeout(function() { 
					if (timers[theId])
						timers[theId].play(); 
					else
						warn("no timer!!!");
				}, pauseSec*1000);
				
				return theId;
			}
			else {
				
				warn('no timer with id: '+id);
			}
			 
			return -1; 
		},   

		_isPosTag : function(tag) {
		
			return PosTagger.isTag(tag);
		},
	
		_tagForPENN : function(words) {
		
			if (!words || !words.length) return EA;
			var arr = is(words,S) ? RiTa.tokenize(words) : words;
			return PosTagger.tag(arr);
		},
		
		_tagForWordNet  : function(words) {
			
			posArr = RiTa._tagForPENN(words);
			if (words && posArr.length) {
			
				for ( var i = 0; i < posArr.length; i++) {
					var pos = posArr[i];
					posArr[i] = '-'; // default=other
					if (PosTagger.isNoun(pos))      	posArr[i] =  'n';
					else if (PosTagger.isVerb(pos))		posArr[i] =  'v';
					else if (PosTagger.isAdverb(pos))	posArr[i] =  'r';
					else if (PosTagger.isAdj(pos))		posArr[i] =  'a';
				}	
				return posArr;  
			}
			return EA; 
		},

		getPosTags : function(words, useWordNetTags) {    
			
			return (useWordNetTags)  ? RiTa._tagForWordNet(words) : RiTa._tagForPENN(words);
		},
		
		// TODO: example
		getPosTagsInline : function(words, delimiter) { 
			
			if (!words || !words.length) return E;
			
			delimiter = delimiter || '/';
			words = is(words,S) ? RiTa.tokenize(words) : words;
			
			var sb = E, tags = RiTa.getPosTags(words);
			for (var i = 0; i < words.length; i++) {

				sb += (words[i]);
				if (!RiTa.isPunctuation(words[i])) {
					sb +=  delimiter + tags[i];
				}
				sb += SP;
			}
			
			return sb.trim();
		},

		// TODO: example
		posToWordNet : function(tag) {
			
			if (!strOk(tag)) return E;

			if (PosTagger.isNoun(tag))    
				return 'n';
			else if (PosTagger.isVerb(tag))
				return 'v';
			else if (PosTagger.isAdverb(tag))
				return  'r';
			else if (PosTagger.isAdj(tag))
				return  'a';
			else  {
				warn(tag+" is not a valid pos-tag");
				return  '-';
			}
		},

		getPresentParticiple : function(verb) { 
			
			// TODO: need to call stem() and try again if first try fails
			return Conjugator().getPresentParticiple(verb);
		},

		getPastParticiple : function(verb) { 
			
			// TODO: need to call stem() and try again if first try fails
			return Conjugator().getPastParticiple(verb);
		},

		// TODO: 2 examples

		conjugate : function(verb, args) {

			return Conjugator().conjugate(verb, args);            
		},
		
		upperCaseFirst : function(s) {
			
    		return s.charAt(0).toUpperCase() + s.substring(1);
		},

		// TODO: 2 examples (regular & irregular) in javadoc
		pluralize : function(word) {

			if (!strOk(word)) return E;
			
			var i, rule, rules = PLURAL_RULES;

			if (inArray(MODALS, word.toLowerCase())) {
				return word;
			}

			for (var i = 0; i < rules.length; i++) {
				rule = rules[i];
				if (rule.applies(word.toLowerCase())) {
					return rule.fire(word);
				}
			}

			return DEFAULT_PLURAL_RULE.fire(word);            
		},
		
		// TODO: 2 examples (regular & irregular) in javadoc        

		singularize : function(word) {

			if (!strOk(word)) return E;

			//// TODO: WHY IS THIS NOT IN JAVA? ////
			var i, rule, rules = SINGULAR_RULES;

			if (inArray(MODALS, word.toLowerCase())) {
				return word;
			}

			i = rules.length;
			while (i--) {
				rule = rules[i];
				if (rule.applies(word.toLowerCase())) {
					return rule.fire(word);
				}
			}
			////////////////////////////////////////

			return this.stem(word, 'Pling');
		},

		trim : function(str) {
			
			return trim(str); // delegate to private
		},

		tokenize : function(words, regex) {
			
			//TODO: 2 examples for doc comment, one with 1 arg, one with 2 (a regex that splits on spaces)

			if (regex) return words.split(regex);
			
			words = trim(words).replace(/``/g, "`` ");
			words = words.replace(/''/g, "  ''");
			words = words.replace(/([\\?!\"\\.,;:@#$%&])/g, " $1 ");
			words = words.replace(/\\.\\.\\./g, " ... ");
			words = words.replace(/\\s+/g, SP);
			words = words.replace(/,([^0-9])/g, " , $1");
			words = words.replace(/([^.])([.])([\])}>\"']*)\\s*$/g, "$1 $2$3 ");
			words = words.replace(/([\[\](){}<>])/g, " $1 ");
			words = words.replace(/--/g, " -- ");
			words = words.replace(/$/g, SP);
			words = words.replace(/^/g, SP);
			words = words.replace(/([^'])' /g, "$1 ' ");
			words = words.replace(/'([SMD]) /g, " '$1 ");
 
			if (RiTa.SPLIT_CONTRACTIONS) { // SAVE
				words = words.replace(/'ll /g, " 'll "); 
				words = words.replace(/'re /g, " 're "); 
				words = words.replace(/'ve /g, " have ");
				words = words.replace(/n't /g, " not "); 
				
				words = words.replace(/'LL /g, " 'LL "); 
				words = words.replace(/'RE /g, " 'RE "); 
				words = words.replace(/'VE /g, " 'VE "); 
				words = words.replace(/N'T /g, " N'T "); 
			}
			
			words = words.replace(/ ([Cc])an't /g, " $1an not ");
			words = words.replace(/ ([Cc])annot /g, " $1an not ");
			words = words.replace(/ ([Dd])idn't /g, " $1id not ");
			words = words.replace(/ ([CcWw])ouldn't /g, " $1ould not ");
			

			// "Nicole I. Kidman" gets tokenized as "Nicole I . Kidman"
			words = words.replace(/ ([A-Z]) \\./g, " $1. ");
			words = words.replace(/\\s+/g, SP);
			words = words.replace(/^\\s+/g, E);
			
			return trim(words).split(/\s+/); // DCH: fixed bug here, 6/3/12
		},

		
		// TODO: test and (probably) re-implement from RiTa (RiSplitter.java)
		splitSentences : function(text, regex) {

			var arr = text.match(/(\S.+?[.!?])(?=\s+|$)/g);

			return (text.length && arr && arr.length) ? arr : [ text ];
			
		},

		/*
		 * Returns true if and only if the string matches 'pattern'
		 * 
		 * @param {string} string string to test
		 * @param {string | regex} pattern object containing regular expression
		 * @returns {boolean} true if matched, else false
		 */
		_regexMatch : function(string, pattern) {
			
			if (!string || !pattern)
				return false;
			
			if (typeof pattern === S)
				pattern = new RegExp(pattern);
			
			return pattern.test(string);
			
		},

		_regexReplace : function(string, pattern, replacement) {
			
			if (!string || !pattern)
				return E;
			if (typeof pattern === S)
				pattern = new RegExp(pattern); // TODO: is this necessary?
			return string.replace(pattern, replacement);
			
		},
			 
		isAbbreviation : function(input, caseSensitive) {
			
			caseSensitive = caseSensitive || false;
			input = caseSensitive ? input : RiTa._titleCase(input);
			return inArray(this.ABBREVIATIONS, input);
		},
		
		// TODO: add tests
		_loadStringNode : function(url, callback, linebreakChars) {
			
			var data='', lb = linebreakChars || SP, isUrl = /.+?:\/\/.+/.test(url), me = this;
			
			//log("Using Node for: "+url +" isUrl="+isUrl);
			
			if (isUrl) {

				var httpcb = function(response) {
					response.on('data', function(chunk) {
						data += chunk;
					});
					response.on('error', function(e) {
						throw e;
					});					
					response.on('end', function() {
						data = data.toString('utf-8').replace(/[\r\n]+/g, lb).trim();
						me.fireDataLoaded(url, callback, data);
					});
				}

				//var req = require('http').get(url, httpcb); // or this?
				var req = require('http').request(url, httpcb);
				req.on('socket', function (socket) { // shouldnt be needded
			    	socket.setTimeout(3000);  // ?
			    	socket.on('timeout', function() {
			    		req.abort();
			    		throw Error("[RiTa] loadString timed-out and aborted request");
			      	});
			    });
			    req.end();
			}
			else {
				
				// try with node file-system
				var rq = require('fs');
				rq.readFile(url, function(e, data) {
					if (e || !data) {
						err("[Node] Error reading file: "+url+"\n"+e);
						throw e;
					}	
   					data = data.toString('utf-8').replace(/[\r\n]+/g, lb).trim();
					me.fireDataLoaded(url, callback, data);	
				});		
			}	
		},
		
		// hack to load a text file from the DOM via an invisible iframe
		_loadStringDOM : function(url, callback, linebreakChars) {
			
			var lb = linebreakChars || SP, cwin, iframe, me = this;
			
			//log("Using iFrame-hack for: "+url);

			if (typeof document == 'undefined' || !document) 
				throw Error("Document 'undefined' (are you running in a browser?)");

			iframe = document.createElement("iframe");
			iframe.setAttribute('src', url);
			iframe.setAttribute('style', 'display: none');
			
			if (!document.body) {
				console.error('[RiTa] loadString() found null document.body!');
				return E;
			}
			
			function htmlDecode(input){
				var e = document.createElement('div');
				e.innerHTML = input;
				return e.childNodes.length === 0 ? E : e.childNodes[0].nodeValue;
			}
			
			document.body.appendChild(iframe);
			cwin = iframe.contentWindow || iframe.contentDocument.parentWindow;
			cwin.onload = function() {
								
				var data = "[RiTa] loadString() unexpected error!";
				if (cwin && cwin.document && cwin.document.body && 
					cwin.document.body.childNodes && cwin.document.body.childNodes.length) 
				{
					data = cwin.document.body.childNodes[0].innerHTML;
				}
				else
					console.error('[RiTa] loadString('+url+') failed trying iFrame-load');
					
				if (!data) {
					
					console.error('[RiTa] loadString('+url+') unable to load text from: '+url);
					return E;
				}
				
				data = htmlDecode(data.replace(/[\r\n]+/g, lb).trim());
			
				me.fireDataLoaded(url, callback, data);
			}
		},	
		
		loadStrings : function(url, callback) {
			
			if (is(url, A)) 
				throw Error("RiTa.loadStrings() does not accept multiple urls");
				
			var fireDataLoaded = this.fireDataLoaded;
			this.loadString(url, function(d) {
				 var lines = d.split('\n');
				 fireDataLoaded(url, callback, lines); 
			}, '\n');
		},
						
		// TODO: add NodeJS tests for all loadXX methods
		loadString : function(url, callback, linebreakChars) {
			
			var lb = linebreakChars || SP, cwin, iframe;// me = this;

			var fun = isNode() ? this._loadStringNode : this._loadStringDOM;

			if (is(url, A)) { // array of files/urls
				
				var allData = '', last = url[url.length-1];
				
				for (var i=0,j=url.length; i<j; i++) {
					
					var fireDataLoaded = this.fireDataLoaded;
					
					fun.call(this, url[i], function(t,u) {
						
						allData += t;
						
						if (u === last)
							fireDataLoaded(url, callback, allData);
						 
					}, linebreakChars);
				};
				
				return;
			}
			else if (ok(url, S)) {
			
				fun.call(this, url, callback, linebreakChars); // single-url
			}
		},
		
		fireDataLoaded : function(url, callback, data) {

			//log('fireDataLoaded: '+url);
			return (callback) ? callback(data, url) :
				RiTaEvent({ name: 'RiTaLoader', urls: is(url, S) ? [url] : url }, RiTa.DATA_LOADED, data)._fire();
		},

		isQuestion : function(sentence) {
			
			var sentenceArr = RiTa.tokenize((sentence));
			
			for (var i = 0; i < QUESTION_STARTS.length; i++) {
				
				if (equalsIgnoreCase(sentenceArr[0], QUESTION_STARTS[i]))
					return true;
			}
			return false;
			
		},

		isSentenceEnd : function(currentWord, nextWord) {

			if ( !is(currentWord,S) || !is(nextWord,S) )
				return false;
			
			var cw = currentWord.charAt(0), cWL = currentWord.length; 
			
			// token is a mid-sentence abbreviation (mainly, titles) --> middle of sent
			if (RiTa.isAbbreviation(currentWord))
				return false;
			
			if (cWL > 1 && cw.indexOf("`'\"([{<") != -1 && RiTa.isAbbreviation(currentWord.substring(1)))
				return false;
		
			if (cWL > 2 && ((currentWord.charAt(0) == '\'' && currentWord.charAt(1) == '\'') || (currentWord.charAt(0) == '`' && currentWord.charAt(1) == '`')) && RiTa.isAbbreviation(currentWord.substring(2)))
			{
				return false;
			}
			
			var nTL = nextWord.length,
				currentToken0 = currentWord.charAt(cWL - 1), 
				currentToken1 = (cWL > 1) ? currentWord.charAt(cWL - 2) : ' ', 
				currentToken2 = (cWL > 2) ? currentWord.charAt(cWL - 3) : ' ',
				nextToken0 = nextWord.charAt(0), 
				nextToken1 = (nTL > 1) ? nextWord.charAt(1) : ' ',
				nextToken2 = (nTL > 2) ? nextWord.charAt(2) : ' ';
		
			// nextToken does not begin with an upper case,
			// [`'"([{<] + upper case, `` + upper case, or < -> middle of sent.
			if (!  (nextToken0 == nextToken0.toUpperCase()
				|| (nextToken1 == nextToken1.toUpperCase() && nextToken0.indexOf("`'\"([{<") != -1)
				|| (nextToken2 == nextToken2.toUpperCase() && ((nextToken0 == '`' && nextToken1 == '`') 
				|| (nextToken0 == '\'' && nextToken1 == '\'')))
				||  nextWord == "_" || nextToken0 == '<'))
			  return false;
		
			// ends with ?, !, [!?.]["'}>)], or [?!.]'' -> end of sentence
			if (currentToken0 == '?'
				|| currentToken0 == '!'
				|| (currentToken1.indexOf("?!.") != -1 && currentToken0.indexOf("\"'}>)") != -1)
				|| (currentToken2.indexOf("?!.") != -1 && currentToken1 == '\'' && currentToken0 == '\''))
			return true;

			// last char not "." -> middle of sentence
			if (currentToken0 != '.') return false;
		
			// Note: wont handle Q. / A. at start of sentence, as in a news wire
			//if (startOfSentence && (currentWord.equalsIgnoreCase("Q.") 
			  //|| currentWord.equalsIgnoreCase("A.")))return true; 
			
			// single upper-case alpha + "." -> middle of sentence
			if (cWL == 2 && currentToken1 == currentToken1.toUpperCase())
				return false;
		
			// double initial (X.Y.) -> middle of sentence << added for ACE
			if (cWL == 4 && currentToken2 == '.'&& (currentToken1 == currentToken1.toUpperCase() && currentWord.charAt(0) == currentWord.charAt(0).toUpperCase() ))
				return false;
		
			// U.S. or U.N. -> middle of sentence
			//if (currentToken.equals("U.S.") || currentToken.equals("U.N."))
			  //return false; // dch
			  
			//if (Util.isAbbreviation(currentToken)) return false;
			
			// (for XML-marked text) next char is < -> end of sentence
		   // if (nextToken0 == '<') return true;
			
			return true;

		},
		
		isW_Question : function(sentence) {    
			var sentenceArr = RiTa.tokenize((sentence));
			for (var i = 0; i < W_QUESTION_STARTS.length; i++)
				if (equalsIgnoreCase(sentenceArr[0], W_QUESTION_STARTS[i]))
					return true;
			return false;
			
		},
		
 		unescapeHTML : function(input) {
 			
 			if (!input || !input.length) return input;
 			
			var sfccp = String.fromCharCodePoint, answer = input
 				.replace(/&lt;/g, "<")
		        .replace(/&gt;/g, ">")
				.replace(/&amp;/g, "&")
		        .replace(/&quot;/g, "\"");

			String.fromCharCodePoint = function() { // uggh
			    var codeunits= [];
			    for (var i= 0; i<arguments.length; i++) {
			        var c= arguments[i];
			        if (arguments[i]<0x10000) {
			            codeunits.push(arguments[i]);
			        } else if (arguments[i]<0x110000) {
			            c-= 0x10000;
			            codeunits.push((c>>10 & 0x3FF) + 0xD800);
			            codeunits.push((c&0x3FF) + 0xDC00);
			        }
			    }
			    return String.fromCharCode.apply(String, codeunits);
			};

			answer = answer.replace(/&#(\d+);/g, function(_, n) {
				return String.fromCharCodePoint(parseInt(n, 10));
					}).replace(/&#x([0-9a-f]+);/gi, function(_, n) {
						return String.fromCharCodePoint(parseInt(n, 16));
			});

		    String.fromCharCodePoint = sfccp;  // uggh
	
			return answer;
		},

		randomOrdering : function(num) {    
			
			var o = [];
			
			if (num) {
				
				for (var z = 0; z < num; z++) o.push(z);
				
				// Array shuffle, from Jonas Raoni Soares Silva (http://jsfromhell.com/array/shuffle)
				for (var j, x, i = o.length; i; j = parseInt(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x) {}
			}

			return o;
		},

		stripPunctuation : function(text) {    

			return (text === E) ? E : text.replace(PUNCTUATION_CLASS, E); 
		},
		
		// PUNCTUATION : "����`'""\",;:!?)([].#\"\\!@$%&}<>|+=-_\\/*{^",
		
		//  Trims punctuation from each side of the token (does not trim whitespace or internal punctuation).
		trimPunctuation : function(text) {
			
			// TODO: replace all this with 1 regex

			var c;

			// from the front
			while (text.length > 0) {
				c = text.charAt(0);
				if (!RiTa.isPunctuation(c)) 
					break;
				text = text.substr(1);
			}
			
			// from the back
			while (text.length > 0) {
				c = text.charAt(text.length - 1);
				if (!RiTa.isPunctuation(c)) 
					break;
				text = text.substring(0, text.length - 1);
			}

			return text;
		},
		
		// TEST: PUNCTUATION : "����`'""\",;:!?)([].#\"\\!@$%&}<>|+=-_\\/*{^",
		isPunctuation : function(text) { 
			
			if (!text || !text.length) return false;
  
			return ONLY_PUNCT.test(text); 
			
		},
		
		// TEST: PUNCTUATION : "����`'""\",;:!?)([].#\"\\!@$%&}<>|+=-_\\/*{^",
		hasPunctuation : function(text) { 
			
			if (!text || !text.length) return false;
  
			return ONLY_PUNCT.test(text); 
		},
		
		asList : function(o) {    
		
    		return (!o) ? '[]' : o.join(', ').trim();
		},
		
		env : function() {

			return isNode() ? RiTa.NODE : RiTa.JS;
		},
		
		chomp : function(txt) {
			
			return txt.replace(/\s+$|^\s+/g, E);
		},

		getPhonemes : function(words) {

			return RiString(words).analyze().get(RiTa.PHONEMES);
			
		},

		getStresses : function(words) {

			return RiString(words).analyze().get(RiTa.STRESSES);
		},

		getSyllables : function(words) {

			return RiString(words).analyze().get(RiTa.SYLLABLES);

		},
		
		getWordCount : function(words) {
			
			return RiTa.tokenize(words).length;

		},

		stem : function(word, type) {
			
			type = type || 'Lancaster';  // USE CONSTANTS
			
			if (type != 'Lancaster' && type != 'Porter' && type != 'Pling')
				err('Bad stemmer type: '+type);
			
			var stemImpl = Stemmer['stem_'+type];
			
			if (word.indexOf(SP) < 0) return stemImpl(word);
			
			// dump non-words && multiple white-space - http://qaa.ath.cx/porter_js_demo.html
			word = word.replace(/[^\w]/g, SP);
			word = word.replace(/\s+/g, SP); 
			
			var res = [], words = word.split(SP);
			
			for ( var i = 0; i < words.length; i++) {
				
				res.push(stemImpl(words[i]));
			}
			
			return res.join(SP);
		},
		
		p5Compatible : function(value) {  // TODO: remove? yes, no one cares (cnage to autoLoop() or similar)
			
			if (!arguments.callee.setupAndDraw) {
				
				arguments.callee.setupAndDraw = function() {
					if (typeof window.setup == F) setup();
					if (typeof window.draw == F) RiText.loop();
				};
			}

			if (typeof window != 'undefined' && window) {
				
				// TODO: add mouse-handling methods here?
				if (typeof window.mouseClicked == F) 
					window.onmouseup = window.mouseClicked;
				if (typeof window.mousePressed == F) 
					window.onmousedown = window.mousePressed;
				if (typeof window.mouseReleased == F) 
					window.onmouseup = window.mouseReleased;
				if (typeof window.mouseMoved == F) 
					window.onmousemove = window.mouseMoved;
			}

			if (value) {

				if (typeof window != 'undefined' && window && !hasProcessing) { 
					
					if (!window.LEFT) window.LEFT = RiTa.LEFT;
					if (!window.RIGHT) window.RIGHT = RiTa.RIGHT;
					if (!window.CENTER) window.CENTER = RiTa.CENTER;	
					if (!window.onload) window.onload = arguments.callee.setupAndDraw;					
				}
			}
			else { // non-compatible mode (clear extra stuff)

				if (typeof window != 'undefined' && window && !hasProcessing)  {
					
					if (window.RIGHT === RiTa.RIGHT) delete window.RIGHT;
					if (window.LEFT === RiTa.LEFT) delete window.LEFT;
					if (window.CENTER === RiTa.CENTER) delete window.CENTER;
					if (window.onload && (window.onload == arguments.callee.setupAndDraw))
						window.onload = undefined; // ?
				}
			}
		},
		
		// Converts 'input' to Titlecase (1st letter upper, rest lower)
		_titleCase : function(input) {
			
			if (!input || !input.length) return input;
			
			return input.substring(0,1).toUpperCase() + input.substring(1);
		},
		
		/*
		 * Takes pair of strings or string-arrays and returns the min-edit distance
		 * @param normalized based on max-length if 3rd (optional) parameter is true (default=f).
		 */
		minEditDist : function(a, b, adjusted) { // TODO: add to docs/tests
			
			return (!adjusted ? MinEditDist.computeRaw : MinEditDist.computeAdjusted)(a,b);
		}
		
	}; // end RiTa object

	// ////////////////////////////////////////////////////////////
	// RiMarkov
	// ////////////////////////////////////////////////////////////
	
	var RiMarkov = makeClass();

	 /* constant for max # of tries for a generation */
  	RiMarkov.MAX_GENERATION_ATTEMPTS = 1000;
  
	RiMarkov._SSRE =  /"?[A-Z][a-z"',;`-]*/;  
	
	RiMarkov._SSDLM =  'D=l1m_';     // TODO:  (OR use HTML-style tag) ??

	RiMarkov.prototype = {

		/*
		 * @function
		 * @name RiMarkov 
		 * 
		 * Construct a Markov chain (or n-gram) model and set its n-Factor
		 * 
		 * @param {number} nFactor for the model (an int)
		 * @param {boolean} recognizeSentences whether the model will attempt to recognize (English) sentences (optional, default=true)
		 * @param {boolean} allowDuplicates whether the model allow duplicates in its output (optional, default=true)		 
		 */
		init : function(nFactor, recognizeSentences, allowDuplicates) {

			var a = this._initArgs.apply(this, arguments);
			
			ok(a[0], N);
			
			this._n = a[0];
			this.pathTrace = [];
			this.sentenceList = [];
			this.sentenceStarts = [];
			this.minSentenceLength = 6;
			this.maxSentenceLength = 35;
			this.maxDuplicatesToSkip = 10000;
			this.root = new TextNode(null, 'ROOT');
			this.isSentenceAware = (a.length > 1 && !a[1]) ? false : true;
			this.allowDuplicates = (a.length > 2 && !a[2]) ? false : true;
			this.printIgnoredText = false;
			this.smoothing = false;
		},
		
		_initArgs : function() {

			var a = arguments, t = Type.get(a[0]);
		
			//console.error("a[0]="+t+" a.length="+a.length+" type="+t+" analyze="+typeof a[0].text);
			
			if (a.length && (t===O || t==='global' || t==='window')) {
				
				// recurse, ignore 'this'
				var shifted = Array.prototype.slice.call(a, 1);

				return this._initArgs.apply(this, shifted);
			}
			
			return a;
		},

		getProbability : function(data) {
			
			if (!this.root) err("Model not initd: null root!");
			
			var tn = is(data,S) ? this.root.lookup(data) : this._findNode(data);

			return (tn) ? tn.probability() : 0;
			
		},
		
		getProbabilities : function(path) {

			if (is(path,S)) path = [path];

			if (path.length > this._n) {
				
				path = path.slice(Math.max(0, path.length-(this._n-1)), path.length);
			}
			
			var probs = {}, tn = this._findNode(path);
			
			if (!tn) return {};

			var nexts = tn.childNodes();
			for (var i = 0; i < nexts.length; i++) {
				var node = nexts[i];
				if (node)  {
					probs[node.token] = node.probability();
				}
			}
			
			return probs;
		},
		
		getCompletions : function(pre, post) {

			var tn, result=[], node, atest, nexts;
			
			if (post) { // fill the center
	
				if (pre.length + post.length > this._n) {
	
					err('Sum of pre.length && post.length must be < N, was ' + (pre.length + post.length));
				}
	
				tn = this._findNode(pre);
				if (!tn) return null;
	
				nexts = tn.childNodes();
				for ( var i = 0; i < nexts.length; i++) {
	
					node = nexts[i];
					
					atest = pre.slice(0); // clone
	
					atest.push(node.token);
					
					for ( var j = 0; j < post.length; j++)
						atest.push(post[j]);
	
					if (this._findNode(atest)) result.push(node.token);
				}
				return result;
			}
			else { // fill the end
	
				var hash = this.getProbabilities(pre);
				var keys = okeys(hash);
				return keys.sort(function(a, b) {
	
					return hash[b] - hash[a];
				});
			}
		},

		generateUntil : function(regex, minLength, maxLength){

			minLength = minLength || 1;
			maxLength = maxLength || Number.MAX_VALUE;
			
			var mn, tokens, tries=0, maxTries=999;
			
			OUT: while (++tries < maxTries) {
			
				// generate the min number of tokens
				tokens = this.generateTokens(minLength);

				// keep adding one and checking until we pass the max
				while (tokens.length < maxLength) {
					
					mn = this._nextNodeForArr(tokens);
					
					if (!mn || !mn.token)   
						continue OUT;// fail, restart
					
					tokens.push(mn.token);
					
					// check against our regex
					if (mn.token.search(regex) >-1 )
						return tokens;
				}
			}
			
			// uh-oh, we failed
			if (tries >= maxTries) 
				err("\nRiMarkov failed to complete after "+tries+" attempts\n");

			return tokens;

		},

		generateTokens: function(targetNumber) {

			var tries = 0, maxTries = 500, tokens = [];

			OUT: while(++tries < maxTries) {

				var mn = this.root.selectChild(null, true);
				if (!mn || !mn.token) continue OUT;
				tokens.push(mn);

				while(tokens.length < targetNumber) {

					mn = this._nextNodeForArr(tokens);
					if (!mn || !mn.token) { // hit the end
						tokens = []; // start over
						continue OUT;
					}

					tokens.push(mn);
				}

				break;
			}

			// uh-oh, looks like we failed...
			if (tokens.length < targetNumber) {
				err('\nRiMarkov failed to complete after ' + tries +' tries, '
					+'with only ' + tokens.length + ' successful generations...\n');
			}

			var res = [];
			for(var i = 0; i < tokens.length; i++) {
				res[i] = tokens[i].token;
			}

			return res;
		},

		useSmoothing : function(value) {
			
			if (arguments.length) {
				
				this.smoothing = value;
				return this;
			}
			return this.smoothing;
		},

		sentenceAware : function() {
			
			if (arguments.length>0)
			  throw Error('sentenceAware() takes no arguments, instead '+
			  	'use the constructor RiMarkov(n, recognizeSentences);');
			return this.isSentenceAware;
		},

		getN : function() {
			
			return this._n;
		},

		print : function() {
			
			if (console) console.log(this.root.asTree(false));
			return this;
		},
		
		ready : function(url) {
			
			return this.size() > 0;
		},
			
		loadFrom : function(url, multiplier, regex, callback) {
			
			// TODO: check multiplier and regex, if function, then use as callback
			
			var me = this;
			
			is(url,S) || ok(url,A);
			
			RiTa.loadString(url, function(data) {
	
				me.loadText(data, multiplier, regex);
				callback && is(callback, F) && (callback(data));
			});
		},

		loadText : function(text, multiplier, regex) {
			
			//log("loadText: "+text.length + " "+this.isSentenceAware);
			
			ok(text,S);
			
			multiplier = multiplier || 1;

			if (multiplier < 1 || multiplier != Math.floor(multiplier)) // TODO: really?
		    	err('Multiplier must be an positive integer, found: '+multiplier); 
			
			var result = !this.isSentenceAware ? 
				this.loadTokens(RiTa.tokenize(text, regex), multiplier) :
				this._loadSentences(RiTa.splitSentences(text), multiplier);
				
			return result;
		},

		loadTokens: function(tokens, multiplier) {

			//log("loadTokens: smooth="+this.smoothing);
			
			multiplier = multiplier || 1;

			if (multiplier < 1 || multiplier != Math.floor(multiplier))
		    	err('multiplier must be an positive integer, found: '+multiplier); 

			this.root.count += tokens.length; // here?
			
			for (var toAdd, k = 0; k < tokens.length; k++) {
				toAdd = [];

				for (var j = 0; j < this._n; j++) {
					if ((k + j) < tokens.length) toAdd[j] = (!undef(tokens[k + j])) ? tokens[k + j] : null;
					else toAdd[j] = null;
				}

				// hack to deal with multiplier...
				for (var l = 0; l < multiplier; l++) {

					var node = this.root;
					for (var i = 0; i < toAdd.length; i++) {
						if (node.token) { 
							node = node.addChild(toAdd[i], this.smoothing ? 2 : 1);
						}
					}
				}
			}

			return this;
		},
		
		generateSentences: function(num) {

		    if (!this.isSentenceAware) {
		      err('generateSentences() can only be called when the model is '
		        + 'in \'sentence-aware\' mode, otherwise use generateTokens()');
		    }
    		
			var mn = this._getSentenceStart(), s = mn.token + SP, result = [], 
				tries = 0, totalTries = 0, wordsInSentence = 1;
			
			while (result.length < num) {
				
				if (wordsInSentence >= this.maxSentenceLength) { 
					
					//System.out.println("MarkovModel.generateSentences().reject:: too long!");
					
					mn = this._getSentenceStart(); 
					s = mn.token + SP;
					wordsInSentence = 1;
				}

				if (mn.isLeaf()) {
					mn = this._tracePathFromRoot(mn);
					continue;
				}

				mn = this._nextNodeForNode(mn);
				
				if (mn.isSentenceStart) {
					
					if (wordsInSentence >= this.minSentenceLength) {
						
						var candidate = RiTa.untokenize(s.trim().split(/\s+/));
						
						// deals with incorrect output: "word( next" -> "word (next" 
						candidate = candidate.replace(/(.)\( /,"$1 ("); // added DCH: 5/2/14

						if (this._validateSentence(candidate)) {
							
							// got one, store and reset the counters
							if (result.indexOf(candidate) < 0) 
								result.push(candidate);
								
							//log(result.length+" RESULTS SO FAR");
							totalTries += tries; 
							tries = 0;
						} 
					}
					mn = this._getSentenceStart(); 
					s = mn.token + SP;
					wordsInSentence = 1;
					continue;
				}
				
				// add the next word
				wordsInSentence++;
				s += mn.token + SP;

				// check if its time to give up
				if (++tries >= RiMarkov.MAX_GENERATION_ATTEMPTS) {
					
					this._onGenerationIncomplete(totalTries+=tries, result.length);
					break; // give-up
				}
			}

			return result;
		},
		
		_validateSentence : function(sent) {
			
		    var tokens = RiTa.tokenize(sent), first = tokens[0],
				last = tokens[tokens.length-1];
 
		    if (!first.match(/[A-Z]\S*/)) {
		      if (this.printIgnoredText)
		      	log("Skipping: bad first char in '"+sent+"'");
		      return false;
		    }      
		    
		    if (!last.match(/[!?.]/)) {
		      if (this.printIgnoredText) 
		      	log("Bad last token: '"+last+"' in: "+sent);   
		      return false;
		    }
		    
		    if (!this.allowDuplicates) 
		    {
		      if (!this.isSentenceAware) {
		        err('Invalid state: allowDuplicates must be'
		        	 +' true when not generating sentences');
		      }
		      
		      if (this.sentenceList.indexOf(sent)>-1) 
		      {
		        if (++this.skippedDups == this.maxDuplicatesToSkip) {
		          warn('Hit skip-maximum (RiMarkov.maxDuplicatesToSkip='+this.maxDuplicatesToSkip
		              +') after skipping '+ this.maxDuplicatesToSkip+', now allowing duplicates!');
		          this.allowDuplicates = true;	
		        }
		        
				if (this.printIgnoredText) 
					log('Ignoring duplicate: '+sent);
				  
		        return false;
		      }
		    }
		    
		    var words = sent.split(/\s+/);
		    if (RiTa.isAbbreviation(words[words.length-1])) {
      			//log("BAD SENTENCE: "+sent);
      			return false;
      		}

		    return true;
		},

		_tracePathFromRoot : function(node) { 
		    
		    // (TODO: change this
		    node.pathFromRoot(this.pathTrace);
		    
		    this.pathTrace.pop(); // ignore the first element
		    var mn = this.root;    
		    while ( this.pathTrace.length) {
		      var search =  this.pathTrace.pop();
		      mn = mn.lookup(search);
		    }     
		    return mn;
		},
  		
		_nextNodeForArr: function(previousTokens) {

			//if (!is(previousTokens,A)) return this.root;
			
			// Follow the seed path down the tree
			var firstLookupIdx = Math.max(0, previousTokens.length - (this._n - 1)),
				node = this.root.lookup(previousTokens[firstLookupIdx++]);

			for (var i = firstLookupIdx; i < previousTokens.length; i++) {

				if (node) node = node.lookup(previousTokens[i]);
			}

			// Now select the next node
			return node ? node.selectChild(null, true) : null;
		},
		
		_nextNodeForNode : function(current) {         
			
		    var attempts = 0, selector, pTotal=0, nodes = current.childNodes();
		    
		    while (true) {
		    	
		        pTotal = 0;
		        selector = Math.random();   
		        //System.out.println("current="+current+", selector="+selector);
		        for(var i=0,j=nodes.length; i<j; i++){
				  var child = nodes[i]
				 
		          //System.out.println("child="+child);
		          pTotal += child.probability();
		          
		          //System.out.println("pTotal="+pTotal);
		          if (current.isRoot() && (this.isSentenceAware && !child.isSentenceStart())) {
		            //System.out.println("continuing...");
		            continue;
		          }
		          if (selector < pTotal) {
		            //System.out.println("returning "+child+"\n====================");
		            return child;
		          }
		          //System.out.println("selector >= pTotal\n====================");
		        }
		        
		        attempts++; 
		        warn('Prob. miss (#\'+attempts+\') in RiMarkov.nextNode().'
		        		+ ' Make sure there are a sufficient\n       # of sentences'
		        		+ ' in the model that are longer than \'minSentenceLength\'');
		        		
		        if (attempts == MAX_PROB_MISSES)
		          err  // should never happen
		            ('PROB. MISS'+current+ ' total='+pTotal+' selector='+selector);  
		      }      
		},
		
		_clean : function(sentence) {

			return RiTa.trim(sentence.replace(/\s+/, SP));
		},
		
		_onGenerationIncomplete : function(tries, successes) {
			
    		if (!RiTa.SILENT) warn('\nRiMarkov failed to complete after ' + tries +
    			' tries\n       Giving up after '+successes+' successful generations\n');
  		},	

		// Loads a sentence[] into the model; each element must be a single sentence
		_loadSentences : function(sentences, multiplier) {
			
			ok(sentences, A);
			
			multiplier = multiplier || 1;
			multiplier = Math.min(multiplier, 1);
			
			// log("_loadSentences("+sentences.length+", multiplier="+multiplier+" "+this.allowDuplicates+")");
			
			var i, j, tokens, sentence, allWords = [];

			// do the cleaning/splitting first ---------------------

			for (i = 0; i < sentences.length; i++) {
				
				sentence = this._clean(sentences[i]);
				
				// do we need this?
				if (!this.allowDuplicates) this.sentenceList.push(sentence);
				
				tokens = RiTa.tokenize(sentence);

				if (!this._validSentenceStart(tokens[0])) {
					
					if (this.printIgnoredText)
						warn("Skipping (bad sentence start): " + tokens);
					continue;
				}
				
				//log("Added sentence start] " + tokens);
		
				allWords.push(RiMarkov._SSDLM + tokens[0]); // bad hack for sentence-starts
				
				for (j = 1; j < tokens.length; j++)
					allWords.push(tokens[j]);
			}

			// ------------------------------------------------

			var toAdd, words = allWords, nFactor = this.getN();

			for (i = 0; i < words.length; i++) {
				
				toAdd = [];
				for (j = 0; j < nFactor; j++) {
					if ((i + j) < words.length)
						toAdd[j] = words[i + j];
				}

				// hack to deal with multiplier...
				for (j = 0; j < multiplier; j++)
					this._addSentenceSequence(toAdd);
			}

			this.root.count += words.length;

			return this;
		},
		
		size : function() {
			
			return this.root.count;
		},		  
		
		_validSentenceStart : function(word) {      
 
			return (!this.isSentenceAware || word && word.match(RiMarkov._SSRE)); 
		},
		
		_addSentenceSequence : function(toAdd) {
			
			//log("_addSentenceSequence: "+toAdd.length);
			
			var node = this.root;

			//this.root.count += toAdd.length; // here?

			for(var i = 0; i < toAdd.length; i++) {

				if (!toAdd[i]) continue;

				if (node.token) {

					var add = toAdd[i];

					if (startsWith(add, RiMarkov._SSDLM)) {

						add = add.substring(RiMarkov._SSDLM.length); 
						var parent = node;

						node = node.addChild(add, this.smoothing ? 2 : 1);
						node.isSentenceStart = true;

						if (parent.isRoot()) {
							this.sentenceStarts.push(node.token);
						}

					} else 
						node = node.addChild(add, this.smoothing ? 2 : 1);
				}
			}			
		},
		

		_getSentenceStart : function() {
			
			if (!this.isSentenceAware) {
      			err("getSentenceStart() can only "
        			+ "be called when the model is in 'sentence-aware' mode...");
    		}
			if (!this.sentenceStarts || !this.sentenceStarts.length)
				err('No sentence starts found! genSen='+this.isSentenceAware);
			
			var start = RiTa.randomItem(this.sentenceStarts);
			
			return this.root.lookup(start);
		},

		_findNode: function(path) {

			//log("RiMarkov.findNode("+path.toString()+")");

			if (!path || !is(path, A) || !path.length) 
				return null;

			var nFactor = this._n;
			var numNodes = Math.min(path.length, nFactor - 1);
			var firstLookupIdx = Math.max(0, path.length - (nFactor - 1));
			var node = this.root.lookup(path[firstLookupIdx++]);

			if (!node) return null;

			var idx = 0; // found at least one good node
			var nodes = [];
			nodes[idx++] = node;
			for (var i = firstLookupIdx; i < path.length; i++) {
				node = node.lookup(path[i]);
				if (!node) return null;
				nodes[idx++] = node;
			}

			return nodes ? nodes[nodes.length - 1] : null;
		}

	}
	
	///////////////////////////////////////////////////////////////////////////
	// RiTaEvent class 
	///////////////////////////////////////////////////////////////////////////
	
	var RiTaEvent = makeClass();
	
	RiTaEvent._callbacksDisabled = false;
	
	RiTaEvent.prototype = {
 
		init : function(source, eventType, data) {
			
			is(source, O) || ok(source, S);
			
			var fn = RiTaEvent.prototype.init;
			if (!fn.ID) fn.ID = 0;
			this._id = ++(fn.ID);
			
			this._data = data;
			this._source = source;
			this._type = eventType || RiTa.UNKNOWN;
		},
		
		toString : function() {
			
			var s = 'RiTaEvent[#'+this._id+' type=' + 
				'(' + this._type + ') source='+this._source.toString();
				
			s += !this._data ? s += ' data=null' :
				(' data-length='+this._data.toString().length);

			return s + ']';
		},

		source : function() {
			
			return this._source;  
		},
		
		data : function() {
			
			return this._data;  
		},
		
		type : function() {
			
			return this._type;  
		},
		
		isType : function(t) {
			
			return this._type === t;  
		},
		
		_fire : function(callback) {
			
			callback = callback || window.onRiTaEvent;
			
			// check if callback is inside the Processing sketch
			if (!callback) {
				var g = RiText._graphics();
				if (g && g.onRiTaEvent)
					callback = g.onRiTaEvent;
			} 
 
			if (callback && is(callback,F)) {

				try {
					callback(this); // first arg should be ??
					return this;
					
				} catch(err) {

					RiTaEvent._callbacksDisabled = true; 
					warn("RiTaEvent: error calling '"+callback+"': " + err);
					throw err;
				}
			}
			 
			RiTaEvent._callbacksDisabled = true; 

			//else if (!RiTaEvent._callbacksDisabled) warn("RiTaEvent: no '"+callback+"' callback found...");
				
			return this;
		}
	}
	
	// ////////////////////////////////////////////////////////////
	// RiWordNet (stub)
	// ////////////////////////////////////////////////////////////
	
	var RiWordNet = makeClass();

	RiWordNet.prototype = {
		
		init: function() {
			
			throw Error("RiWordNet is not yet implemented in JavaScript!");
		}
	}
	
	// ////////////////////////////////////////////////////////////
	// RiLexicon
	// ////////////////////////////////////////////////////////////
	
	var RiLexicon = makeClass();

	// ////////////////////////////////////////////////////////////
	// Static variables
	// ////////////////////////////////////////////////////////////   
	
	RiLexicon.data = undefined; // shared static var
	
	// ////////////////////////////////////////////////////////////
	// Member functions
	// ////////////////////////////////////////////////////////////
	
	RiLexicon.prototype = {
		
		init: function() {

			if (!RiLexicon.data) {

				if (typeof _RiTa_DICT != 'undefined') {

					//log('[RiTa] Loading lexicon data...');

					RiLexicon.data = {}; // TODO: test perf. of this
					for (var word in _RiTa_DICT) {
						RiLexicon.data[word] = _RiTa_DICT[word]; // needed?
					}
				} else {

					err("Dictionary not found! Make sure to include it in your sketch...");
				}
			}
		},
			
		clear : function() {
			
			RiLexicon.data = undefined;
			
			for (var word in RiLexicon.data) 
				delete RiLexicon.data[word];
		},
	 
		addWord : function(word, pronunciationData, posData) {
			
			RiLexicon.data[word.toLowerCase()] = [pronunciationData.toLowerCase(), posData.toLowerCase()];
			return this;
		},

		removeWord : function(word) {
			
			delete RiLexicon.data[word.toLowerCase()];
			return this;
		},

		similarByLetter: function(input, minAllowedDist, preserveLength) {

			var minVal = Number.MAX_VALUE, minLen = 2, result = [];

			if (!(input && input.length)) return EA;

			input = input.toLowerCase();
			minAllowedDist = minAllowedDist || 1;
			preserveLength = preserveLength || false;
			
			var med, inputS = input + 's', inputES = input + 'es', inputLen = input.length;

			for (var entry in RiLexicon.data) {

				if (entry.length < minLen) 
					continue;
					
				if (preserveLength && (entry.length != inputLen)) 
					continue;

				if (entry == input || entry == inputS || entry == inputES) 
					continue;

				med = MinEditDist.computeRaw(entry, input);

				if (!med) continue; // same word (shouldnt happen)

				// we found something even closer
				if (med >= minAllowedDist && med < minVal) {

					minVal = med;
					result = [ entry ];
				}

				// we have another best to add
				else if (med == minVal) {
					
					result.push(entry);
				}
			}

			return result;
		},

		similarBySound: function(input, minEditDist) { 

			minEditDist = minEditDist || 1;

			var minVal = Number.MAX_VALUE, entry, result = [], minLen = 2,
				phonesArr, phones = RiTa.getPhonemes(input), med,
				targetPhonesArr = phones ? phones.split('-') : [];

			if (!targetPhonesArr[0] || !(input && input.length)) return EA;

			for (entry in RiLexicon.data) {

				if (entry.length < minLen) 
					continue;

				entry = entry.toLowerCase();

				if (entry == input || entry == (input + "s") || entry == (input + "es")) 
					continue;

				phones = this._getRawPhones(entry);

				if (!phones.length) {

					phones = RiString._syllabify(LetterToSound().getPhones(entry));
					if (!phones) return EA;
				}

				phonesArr = phones.replace(/1/g, E).replace(/ /g, "-").split('-');

				med = MinEditDist.computeRaw(phonesArr, targetPhonesArr);

				if (med == 0) continue; // same phones 

				// found something even closer
				if (med >= minEditDist && med < minVal) {

					minVal = med;
					result = [entry];
				}
				// another best to add
				else if (med == minVal) {

					result.push(entry);
				}
			}

			return result;
		},

		substrings: function(word, minLength) { 
			
			minLength = minLength || (minLength === 0) || 4;
			
			var entry, result =[];
			for  (entry in RiLexicon.data){
				if (entry == word || entry.length < minLength ) continue;        
				if (word.indexOf(entry) >=0) result.push(entry);
			}
			
			return result;
		},

		superstrings: function(word) { 
			
			var entry, result =[];
			
			for  (entry in RiLexicon.data){
				if (entry == word) continue;
				if (entry.indexOf(word) >= 0) 
					result.push(entry);
			}
			
			return result;
		},
		
		similarBySoundAndLetter: function(word) { 
			
			var simSound, simLetter, result = [];

			simSound = this.similarBySound(word);
			simLetter = this.similarByLetter(word);
			
			if (!simSound || !simLetter) 
				return result;
			
			for (var i=0; i<simSound.length; i++) {
				
				for (var j=0; j<simLetter.length; j++) {
					
					if (simSound[i] == simLetter[j]) 
						result.push(simLetter[j]);
				}
			}
			
			return result;
		},

		words : function() {
			
			var a = arguments, sorted = false, regex = undefined, 
				wordArr = [], words = okeys(RiLexicon.data);
			
			switch (a.length) {
				
				case 2:
					
					if (is(a[0],B)) {
						sorted = a[0];
						regex = (is(a[1],R)) ? a[1] : new RegExp(a[1]);
					} 
					else {
						sorted = a[1];
						regex = (is(a[0],R)) ? a[0] : new RegExp(a[0]);
					}

					break;
					
				case 1:
										
					if (is(a[0],B)) {
						return a[0] ? shuffle(words) : okeys(words);
					}
					
					regex = (is(a[0],R)) ? a[0] : new RegExp(a[0]);
					
					break;
					
				case 0:
					
					return shuffle(words);
			}

			for (var i = 0; i < words.length; i++) {
				
				if (words[i].match(regex)) {
					
					wordArr.push(words[i]);
				}
			}
			
			// TODO: make sure we have a test for both sorted=false/true

			return sorted ? wordArr : shuffle(wordArr);  
		},
		
		/*
		 * Returns true if c is a vowel
		 */
		_isVowel : function(c) {

			return (strOk(c) && RiTa.VOWELS.indexOf(c) > -1);
		},

		/*
		 * Returns true if c is a consonant
		 */
		_isConsonant : function(p) {

			return (typeof p == S && p.length==1 && 
				RiTa.VOWELS.indexOf(p) < 0 && /^[a-z\u00C0-\u00ff]+$/.test(p));  
		},

		containsWord : function(word) {

			return (strOk(word) && RiLexicon.data && !undef(RiLexicon.data[word.toLowerCase()]));
		},

		isRhyme : function(word1, word2, useLTS) {

			if ( !strOk(word1) || !strOk(word2) || equalsIgnoreCase(word1, word2))
				return false;
			
			var p1 = this._lastStressedPhoneToEnd(word1, useLTS), 
				p2 = this._lastStressedPhoneToEnd(word2, useLTS);
			
			return (strOk(p1) && strOk(p2) && p1 === p2);  
		},

		rhymes : function(word) {

			if (this.containsWord(word)) {

				var p = this._lastStressedPhoneToEnd(word);
				var entry, entryPhones, results = [];

				for (entry in RiLexicon.data) {
					if (entry === word)
						continue;
					entryPhones = this._getRawPhones(entry);

					if (strOk(entryPhones) && endsWith(entryPhones, p)) {
						results.push(entry);
					}
				}
				return (results.length > 0) ? results : EA; 
			}
			
			return EA; 
		},

		alliterations : function(word, matchMinLength) {
			
			matchMinLength = matchMinLength || 4;
			
			if (this.containsWord(word)) { // RODO: else useLTS ??

				var c2, entry, results = [];
				var c1 = this._firstConsonant(this._firstStressedSyllable(word));

				for (entry in RiLexicon.data) {
					
					c2 = this._firstConsonant(this._firstStressedSyllable(entry));
					
					if (c2 && c1 === c2 && entry.length > matchMinLength) {
						results.push(entry);
					}
				}
				return results; 
			}

			
			return EA;
		},

		isAlliteration : function(word1, word2) {

			if (!strOk(word1) || !strOk(word2)) return false;

			if (equalsIgnoreCase(word1, word2)) return true;

			var c1 = this._firstConsonant(this._firstStressedSyllable(word1)),
				c2 = this._firstConsonant(this._firstStressedSyllable(word2));

			//log("'"+c1+"'=?'"+c2+"'");
			
			return (strOk(c1) && strOk(c2) && c1 === c2);  
		},

		/*
		 * Returns the first stressed syllable of the input word
		 */
		_firstStressedSyllable : function(word) {

			var raw = this._getRawPhones(word), idx = -1, c, firstToEnd;

			if (!strOk(raw)) return E; // return null?
			
			idx = raw.indexOf(RiTa.STRESSED);

			if (idx < 0) return E; // no stresses... return null?
			
			c = raw.charAt(--idx);

			while (c != ' ') {
				if (--idx < 0) {
					// single-stressed syllable
					idx = 0;
					break;
				}
				c = raw.charAt(idx);
			}
			
			firstToEnd = idx === 0 ? raw : trim(raw.substring(idx));
			idx = firstToEnd.indexOf(' ');

			return idx < 0 ? firstToEnd : firstToEnd.substring(0, idx);
		},
		
		isVerb: function(word) {

			return this._checkType(word, PosTagger.VERBS);
		},
 
		isNoun : function(word) {

			return this._checkType(word, PosTagger.NOUNS);
		},
		
		isAdverb : function(word) {

			return this._checkType(word, PosTagger.ADV);
		},
		
		isAdjective : function(word) {
			
			return this._checkType(word, PosTagger.ADJ);
		},
		
		size : function() {
			
			return RiLexicon.data ? okeys(RiLexicon.data).length : 0
		},

		_checkType: function(word, tagArray) {

			if (word && word.indexOf(SP) != -1) 
				 throw Error("[RiTa] _checkType() expects a single word, found: "+word); 

			var psa = this._getPosArr(word);
			for (var i = 0; i < psa.length; i++) {
				if (tagArray.indexOf(psa[i]) > -1)
					return true;
			} 
			
			return false;  
		 },
		 
		/*
		 * Returns a String containing the phonemes for each syllable of each word of the input text, 
		 * delimited by dashes (phonemes) and semi-colons (words). 
		 * For example, the 4 syllables of the phrase 
		 * 'The dog ran fast' are "dh-ax:d-ao-g:r-ae-n:f-ae-s-t".
		 * 
		 * @param {string} word
		 * 
		 * @returns {string} the phonemes for each syllable of each word
		 */
		_getSyllables : function(word) {
			
			// TODO: use feature cache?
			
			if (!strOk(word)) return E;
			
			var wordArr = RiTa.tokenize(word), raw = [];
			
			for (var i=0; i< wordArr.length; i++) {
				
				raw[i] = this._getRawPhones(wordArr[i]).replace(/\s/g, '/');
			}
			
			return RiTa.untokenize(raw).replace(/1/g, E).trim();
		},

		/*
		 * Returns a String containing all phonemes for the input text, delimited by semi-colons
		 * 
		 * @example "dh:ax:d:ao:g:r:ae:n:f:ae:s:t"
		 * 
		 * @param {string} word
		 * 
		 * @returns {string} all phonemes,
		 */
		_getPhonemes : function(word) {
			
			// TODO: use feature cache?

			if (!strOk(word)) return E;
			
			var wordArr = RiTa.tokenize(word), raw = [];
			
			for (var i=0; i< wordArr.length; i++)
			{

				if (RiTa.isPunctuation(wordArr[i])) continue;

				// raw[i] = wordArr[i].length
				raw[i] = this._getRawPhones(wordArr[i]);

				if (!raw[i].length) return E;
					//err("Unable to lookup (need LTSEngine): "+wordArr[i]);

				raw[i] = raw[i].replace(/ /g, "-");
			}

			return RiTa.untokenize(raw).replace(/1/g, E).trim(); 
		},

		/*
		 * Returns a String containing the stresses for each syllable of the input text, delimited by semi-colons, 
		 * @example "0:1:0:1", with 1's meaning 'stressed', and 0's meaning 'unstressed', 
		 * 
		 * @param {string} word
		 * 
		 * @returns {string} stresses for each syllable
		 */
		_getStresses : function(word) {

			var stresses = [], phones, raw = [],
				wordArr = is(word,A) ? word : RiTa.tokenize(word);

			if (!strOk(word)) return E;
			
			for (var i=0; i< wordArr.length; i++) {
				
				if (!RiTa.isPunctuation(wordArr[i]))
					raw[i] = this._getRawPhones(wordArr[i]);
			}

			for (var i = 0; i < raw.length; i++) {

				if (raw[i]) { // ignore undefined array items (eg Punctuation)
					
					phones = raw[i].split(SP);
					for (var j = 0; j < phones.length; j++) {

						var isStress = (phones[j].indexOf(RiTa.STRESSED) > -1) 
							? RiTa.STRESSED : RiTa.UNSTRESSED;
						
						if (j > 0) isStress = "/" + isStress;

						stresses.push(isStress);            
					}
				}
			}
			
			return stresses.join(SP).replace(/ \//g, "/");
		},
		
		lexicalData : function(dictionaryDataObject) {

			
			if (arguments.length == 1) {
				RiLexicon.data = dictionaryDataObject;
				return this;
			}

			return RiLexicon.data;
		},
		
		/*
		 * Returns the raw (RiTa-format) dictionary entry for the given word 
		 * 
		 * @param {string} word
		 * 
		 * @returns {array} a 2-element array of strings, 
		 * the first is the stress and syllable data, 
		 * the 2nd is the pos data, or null if the word is not found
		 */
		_lookupRaw : function(word) {

			word = word.toLowerCase();

			if (RiLexicon.data && RiLexicon.data[word]) 
				return RiLexicon.data[word];
			
			//log("[RiTa] No lexicon entry for '" + word + "'");
			
			return null;
		},
		

		_getRawPhones : function(word, useLTS) {
			
			// TODO: test this with useLTS=true
			
			var data = this._lookupRaw(word);
			useLTS = useLTS || false;
			
			var phones, data = this._lookupRaw(word);
			if (data && useLTS)
			{
				if (!RiTa.SILENT)
					log("[RiTa] Using letter-to-sound rules for: " + word);

				phones = LetterToSound.getInstance().getPhones(word);
				
				//System.out.println("phones="+RiTa.asList(phones));
				if (phones && phones.length)
					return RiString.syllabify(phones);

			}
			return (data && data.length==2) ? data[0] : E; 
		},


		_getPosData : function(word) {
			
			var data = this._lookupRaw(word);
			return (data && data.length==2) ? data[1] : E; 
		},

		
		_getPosArr : function(word) { 
			
			var pl = this._getPosData(word);
			
			if (!strOk(pl)) return EA;
			
			return pl.split(SP);  
		},

		_getBestPos : function(word) { 
			
			var pl = this._getPosArr(word);
			
			return (pl.length > 0) ? pl[0] : [];
		},


		
		_firstConsonant : function(rawPhones) {

			if (!strOk(rawPhones)) return E; 
			
			var phones = rawPhones.split(RiTa.PHONEME_BOUNDARY);
			// var phones = rawPhones.split(PHONEME_BOUNDARY);
			
			if (phones) {
				
				for (var j = 0; j < phones.length; j++) {
					if (this._isConsonant(phones[j].charAt(0))) // first letter only
						return phones[j];
				}
			}
			return E; // return null?  
		},
		

		_lastStressedPhoneToEnd : function(word, useLTS) {

			if (!strOk(word)) return E; // return null?
			
			var idx, c, result;
			var raw = this._getRawPhones(word, useLTS);

			if (!strOk(raw)) return E; // return null?
			
			idx = raw.lastIndexOf(RiTa.STRESSED);
			
			if (idx < 0) return E; // return null?
			
			c = raw.charAt(--idx);
			while (c != '-' && c != ' ') {
				if (--idx < 0) {
					return raw; // single-stressed syllable
				}
				c = raw.charAt(idx);
			}
			result = raw.substring(idx + 1);
			
			return result;
		},

		randomWord : function() {  // takes nothing, pos, syllableCount, or both 
			
			var found = false, a = arguments, wordArr = okeys(RiLexicon.data),
				ran = Math.floor(Math.random() * okeys(RiLexicon.data).length),
				ranWordArr = shuffle(wordArr);
			
			switch (a.length) {
					
				case 2: //a[0]=pos  a[1]=syllableCount
					
						a[0] = trim(a[0]); 
						
						for (var j = 0; j < PosTagger.TAGS.length; j++) { 
							
							if (PosTagger.TAGS[j] == a[0]) found = true;
						} 
						

						if (found) { 
							
							a[0] = a[0].toLowerCase(); 
							
							for (var i=0; i< ranWordArr.length; i++){
								
								var data = this._lookupRaw(ranWordArr[i]);
								var posTag = RiTa.getPosTags(ranWordArr[i]);
								
								if (data[0].split(SP).length == a[1] && a[0] == this._getBestPos(ranWordArr[i])) {
									return ranWordArr[i];
								}
							} 
						} 
						
						return E;
						
					break;
					
				case 1:
					
					if (is(a[0],S)) { // a[0] = pos
						
						a[0] = trim(a[0]); 
						
						for(var j = 0; j < PosTagger.TAGS.length; j++) {
							
							if (PosTagger.TAGS[j] == a[0]) found = true;
						} 
						
						if (found) { 
							
							a[0] = a[0].toLowerCase();

							
							for(var i=0; i< ranWordArr.length; i++){
								
								var thePos = this._getBestPos(ranWordArr[i]);
								if (a[0] == thePos) {
									return ranWordArr[i];
								}
							} 
						} 
					}
					
					else { // a[0] = syllableCount    
						
						for(var i=0; i< ranWordArr.length; i++) {
							
							var data = this._lookupRaw(ranWordArr[i]);
							
							if (data[0].split(SP).length == a[0]) {
								
								return ranWordArr[i];
							}
						} 
					}
					
					break;
					
				case 0:
					
					return wordArr[ran];
			}
			
			return E;
		}
	}
	

	
	////////////////////////////////////////////////////////////////
	// RiString
	////////////////////////////////////////////////////////////////
	
	var RiString = makeClass();
	
	RiString.phones = {
		
		  consonants: [ 'b', 'ch', 'd', 'dh', 'f', 'g', 'hh', 'jh', 'k', 'l', 'm', 'n', 
						'ng', 'p', 'r', 's', 'sh', 't', 'th', 'v', 'w', 'y', 'z', 'zh' ],

		  vowels: [ 'aa', 'ae', 'ah', 'ao', 'aw', 'ax', 'ay', 'eh', 'er', 'ey', 'ih', 'iy',
					'ow', 'oy', 'uh', 'uw' ],

		  onsets: [ 'p', 't', 'k', 'b', 'd', 'g', 'f', 'v', 'th', 'dh', 's', 'z', 'sh', 'ch', 'jh', 'm',
					'n', 'r', 'l', 'hh', 'w', 'y', 'p r', 't r', 'k r', 'b r', 'd r', 'g r', 'f r',
					'th r', 'sh r', 'p l', 'k l', 'b l', 'g l', 'f l', 's l', 't w', 'k w', 'd w', 
					's w', 's p', 's t', 's k', 's f', 's m', 's n', 'g w', 'sh w', 's p r', 's p l',
					's t r', 's k r', 's k w', 's k l', 'th w', 'zh', 'p y', 'k y', 'b y', 'f y', 
					'hh y', 'v y', 'th y', 'm y', 's p y', 's k y', 'g y', 'hh w', '' ],
	
		  digits: [ 'z-ih-r-ow', 'w-ah-n', 't-uw', 'th-r-iy', 'f-ao-r', 'f-ay-v', 's-ih-k-s', 
					's-eh1-v-ax-n', 'ey-t', 'n-ih-n' ]
	}
	
	RiString._syllabify = function(input) { // adapted from FreeTTS
	   
		var dbug, None=undefined, internuclei = [], syllables = [],   // returned data structure.
			sylls = ((typeof (input) == 'string') ? input.split('-') : input);

		for (var i = 0; i < sylls.length; i++) {
		
			var phoneme = sylls[i].trim(), stress = None;

			if (!phoneme.length) continue;
			
			if ( isNum(last(phoneme)) ) {
				
				stress = parseInt(last(phoneme));
				phoneme = phoneme.substring(0, phoneme.length-1);
			}
			
			if (dbug)log(i+")"+phoneme + ' stress='+stress+' inter='+internuclei.join(':'));
			
			if (inArray(RiString.phones.vowels, phoneme)) {
	 
				// Split the consonants seen since the last nucleus into coda and onset.            
				var coda = None, onset = None;
				
				// Make the largest onset we can. The 'split' variable marks the break point.
				for (var split = 0; split < internuclei.length+1; split++) {
					
					coda  = internuclei.slice(0, split);
					onset = internuclei.slice(split, internuclei.length);
					
					if (dbug)log('  '+split+') onset='+onset.join(':')+
						'  coda='+coda.join(':')+'  inter='+internuclei.join(':'));
					
					// If we are looking at a valid onset, or if we're at the start of the word
					// (in which case an invalid onset is better than a coda that doesn't follow
					// a nucleus), or if we've gone through all of the onsets and we didn't find
					// any that are valid, then split the nonvowels we've seen at this location.
					var bool = inArray(RiString.phones.onsets, onset.join(" "));
					if (bool || syllables.length == 0 || onset.length == 0) {
						if (dbug)log('  break '+phoneme);
					   break;
					}
				}
				
				//if (dbug)log('  onset='+join(',',onset)+'  coda='+join(',',coda));
				
				// Tack the coda onto the coda of the last syllable. Can't do it if this
				// is the first syllable.
				if (syllables.length > 0 ) {
					
					//syllables[syllables.length-1][3] = syllables[syllables.length-1][3] || [];
					//log('  len='+syllables[syllables.length-1][3].length);
					extend(syllables[syllables.length-1][3], coda);
					if (dbug) log('  tack: '+coda+' -> len='+syllables[syllables.length-1][3].length+" ["+syllables[syllables.length-1][3]+"]");
				}
				
				// Make a new syllable out of the onset and nucleus.

				var toPush = [ [stress], onset, [phoneme], [] ];
				syllables.push(toPush);
					
				// At this point we've processed the internuclei list.
				internuclei = [];
			}
			
			else if (!inArray(RiString.phones.consonants, phoneme) && phoneme != " ") {
				throw Error('Invalid phoneme: ' + phoneme);
			}
				
			else { // a consonant
				
				//log('inter.push: '+phoneme);
				internuclei.push(phoneme)
			}
		}
	  
		
		// Done looping through phonemes. We may have consonants left at the end.
		// We may have even not found a nucleus.
		if (internuclei.length > 0) {

			if (syllables.length == 0) {
				
				syllables.push([ [None], internuclei, [], [] ]);
			}
			else {
				
				extend(syllables[syllables.length-1][3], internuclei);
			}
				
		}

		return RiString._stringify(syllables);
	}
	  
	/*
	 * Takes a syllabification and turns it into a string of phonemes, 
	 * delimited with dashes, with spaces between syllables 
	 */
	RiString._stringify = function(syllables) {
			
		var ret = [];
		for (var i = 0; i < syllables.length; i++) {
			
			var syl = syllables[i];
			var stress = syl[0][0];
			var onset = syl[1];
			var nucleus = syl[2];
			var coda = syl[3];
		  
			if (stress != undefined && nucleus.length) // dch
				nucleus[0] += (E+stress);
			
			var data = [];
			for (var j = 0; j < onset.length; j++) 
				data.push(onset[j]);
			
			for (var j = 0; j < nucleus.length; j++) 
			   data.push(nucleus[j]);
			
			for (var j = 0; j < coda.length; j++) 
			   data.push(coda[j]);
			
			ret.push(data.join('-'));
		}
		
		return ret.join(SP);
	}
	
	// ////////////////////////////////////////////////////////////
	// Member functions
	// ////////////////////////////////////////////////////////////
	
	RiString.prototype = {

		init : function(text) {
			
			if (is(text,N)) {
				
				text = String.fromCharCode(text);
			}
			
			ok(text,S);
			this._text = text;
			this._features = undefined;
		},
		
		copy : function() {

			var rs = RiString(this._text), feats = this.features();

			rs._features = {};

			for(var prop in feats) {

    			rs._features[prop] = feats[prop];
			}
			return rs;
		},

		features : function() {
			
		   this._features || this.analyze();
		   return this._features;
		},
		
		_initFeatureMap : function() {

			if (!this._features) {
				
				this._features = {};
			}
			else {
				delete this._features.tokens;
				delete this._features.stresses;
				delete this._features.phonemes;
				delete this._features.syllables;
				delete this._features.pos;
			}			
					    
		    //this._features.mutable = "true";
		    this._features.text = this.text();
		},

		
		analyze : function() {
	
			var phonemes = E, syllables = E, stresses = E, slash = '/',  delim = '-',
				phones, lts, ltsPhones, useRaw, words = RiTa.tokenize(this._text), 
				lts, stressyls, lex = RiLexicon();//._getInstance(); 
			
			if (!this._features) this._initFeatureMap();
			
			for (var i = 0, l = words.length; i < l; i++) {
				
				useRaw = false;
				
				phones = lex._getRawPhones(words[i]); 
				
				if (!phones) {
					
					if (words[i].match(/[a-zA-Z]+/))
						log("[RiTa] Used LTS-rules for '"+words[i]+"'");
					
					lts = lts || LetterToSound();
					
					
					ltsPhones = lts.getPhones(words[i]);
					
					if (ltsPhones && ltsPhones.length>0) {
						
						phones = RiString._syllabify(ltsPhones);
					}
					else {
						phones = words[i];
						useRaw = true;
					} 
				}
 
				phonemes += phones.replace(/[0-2]/g, E).replace(/ /g, delim) + SP;
				syllables += phones.replace(/ /g, slash).replace(/1/g, E) + SP;

				if (!useRaw) {
					stressyls = phones.split(SP);   
					for (var j = 0; j < stressyls.length; j++) {
	
						if (!stressyls[j].length) continue;
						
						stresses += (stressyls[j].indexOf(RiTa.STRESSED) > -1) 
							? RiTa.STRESSED : RiTa.UNSTRESSED;
						
						if (j < stressyls.length-1) stresses += slash;      
					}
				}
				else {
					
					stresses += words[i];
				}
				
				if (!endsWith(stresses, SP)) stresses += SP;     
			}
			
			this._features.tokens = words.join(SP);
			this._features.stresses = stresses.trim();
			this._features.phonemes = phonemes.trim().replace(/\\s+/, SP);
			this._features.syllables = syllables.trim().replace(/\\s+/, SP);
			this._features.pos = RiTa.getPosTags(this._text).join(SP);
			
			return this;
		},

		get : function(featureName) {
			
			this._features || this.analyze();
			var s = this._features[featureName]; 
			if (!s && !this._features.hasOwnProperty(featureName)) {
				this.analyze();
				s = this._features[featureName]; 
			}
			return s;
		},
		
		set : function(featureName, featureValue) {
			
			this._features || (this._features = {}); 
			this._features[featureName] = featureValue;
			//log(this._features);  
			return this;
		},

		endsWith : function(substr) {
			
			return endsWith(this._text, substr);  
		},

		equals : function(arg) {
			
			return (typeof arg === S) ? arg === this._text :  arg.text() === this._text; 
		},

		equalsIgnoreCase : function(arg) {
			
			if (typeof arg === S) {
				
				return arg.toLowerCase() === this._text.toLowerCase();
			} 
			else {
				
				return arg.text().toLowerCase() === this._text.toLowerCase();
			}
		},

		text : function(theText) {
			
			if (arguments.length>0) {
				this._text = theText;
				this._initFeatureMap();
				return this;
			}
			return this._text;
		},

		pos : function() {
				   
			var words = RiTa.tokenize((this._text)); // was getPlaintext()
			var tags = PosTagger.tag(words); 
  
			for ( var i = 0, l = tags.length; i < l; i++) {
				if (!strOk(tags[i])) 
					err("RiString: can't parse pos for:" + words[i]);
			}
		
			return tags;            
		},

		posAt : function(index) {
			
			var tags = this.pos();

			if (!tags || !tags.length || index < 0 || index >= tags.length)
				return E;
			
			return tags[index];
		},

		wordAt : function(index) {
			
			var words = this.words();
			if (index < 0 || index >= words.length)
				return E;
			return words[index];  
		},

		wordCount : function() {
			
			return this._text.length ? this.words().length : 0 ;
		},

		words : function() {
			
			return RiTa.tokenize(this._text);  
		},

		indexOf : function(searchstring, start) {
			
			return this._text.indexOf(searchstring, start);   
		},

		lastIndexOf : function(searchstring, start) {
			
			return this._text.lastIndexOf(searchstring, start);
		},

		length : function() {
			
			return this._text.length;  
		},

		match : function(regex) {
			
			return this._text.match(regex) || [];
		},

		slice : function(begin, end) {
			
			return this._text.slice(begin, end) || E;  
		},

		replaceAll : function(pattern, replacement) {
			
			if (pattern && (replacement || replacement==='')) {
				this._text = replaceAll(this._text, pattern, replacement);
			}
			return this;   
		},

		insertChar : function(idx, toInsert) {
			
			var s = this.text();
			
			if (idx > s.length || idx < -s.length) {
				warn("RiString.insertChar: bad index="+idx);
				return this;
			}

			 
			idx = idx < 0 ? idx += s.length : idx;
			var beg = s.substring(0, idx);
			var end = s.substring(idx);
		 
			if (toInsert) beg += toInsert;

			return this.text(beg+end);
		},

		removeChar : function(idx) { 
			
			var s = this.text();
			
			if (idx > s.length || idx < -s.length) {
				warn("RiString.removeChar: bad index="+idx);
				return this;
			}
			idx = idx < 0 ? idx += s.length : idx;
			
			this.text(this._text.substring(0, idx).concat(this._text.substring(idx + 1)));
			return this;   
		},

		replaceChar : function(idx, replaceWith) {
			
			var s = this.text();
			
			if (idx > s.length || idx < -s.length) {
				warn("RiString.replaceChar: bad index="+idx);
				return this;
			}
			idx = idx < 0 ? idx += s.length : idx;
				
			var s = this.text();
			var beg = s.substring(0, idx);
			var end = s.substring(idx + 1);
		 
			if (replaceWith)
				beg += replaceWith;

			return this.text(beg+end);
		},

		replaceFirst : function(regex, replaceWith) {
			
			this._text = this._text.replace(regex, replaceWith);
			return this;  
		},

		replaceLast : function(regex, replaceWith) {
			
			//TODO: this fails for '?', other regex chars? Make TEST
			
			if (!regex) return this;
			
			var ret = this._text;

			if (is(regex, S)) {

				var len = regex.length, idx = ret.lastIndexOf(regex);
				if (idx >= 0) {
					
					this._text = ret.substring(0, idx) + replaceWith + ret.substring(idx + len);
				}	
			} 
			else {

				var matches = ret.match(regex);
				if (matches) {

					var target = matches.pop(), tmp = this._text.split(target), last = tmp.pop();
					tmp[tmp.length - 1] += replaceWith + last;
					ret = tmp.join(target);
				}

				this._text = ret;
			}

			return this;
		},

		removeWord : function(wordIdx) {
			
			return this.replaceWord(wordIdx, E);
		},    

		insertWord : function(wordIdx, newWord) {

			var words = this.words(); //  tokenize
			
			if (wordIdx < 0) wordIdx += words.length;
			
			// log("insertWord("+ newWord+', '+wordIdx+") -> words["+wordIdx+"] = " + words[wordIdx]);
			
			if (newWord && newWord.length>=0 && wordIdx >= 0 && wordIdx < words.length) {
				
				words[wordIdx] = newWord + SP + words[wordIdx];
				
				this.text(RiTa.untokenize(words));
			}
			
			return this;  
		},

		replaceWord : function(wordIdx, newWord) {
			
			//log("replaceWord: "+wordIdx+", '"+newWord+"'");
			
			var words = this.words(); //  tokenize
			
			if (wordIdx < 0) wordIdx += words.length;
			
			if ((newWord || newWord===E) && wordIdx >= 0 && wordIdx < words.length) {
				
				words[wordIdx] = newWord;
				
				this.text(RiTa.untokenize(words));
			}
			
			return this;  
		}, 

		split : function(separator, limit) {
			
			var parts = this._text.split(separator, limit);
			var rs = [];
			for ( var i = 0; i < parts.length; i++) {
				if (parts[i])
					rs.push(new RiString(parts[i]));
			}
			return rs;  
		},

		startsWith : function(substr) {
			
			return this.indexOf(substr) == 0;  
		},

		substr : function(start, length) {
			
			return this._text.substr(start, length);
			// return this.text(res);
		},


		substring : function(from, to) {

			// return this.text(this._text.substring(from, to));
			return this._text.substring(from, to);
		},

		
		toLowerCase : function() {
			
			return this.text(this._text.toLowerCase());
		},

		toString : function() {
			
			return "RiString["+this._text+"]";
		},

		toUpperCase : function() {
			
			return this.text(this._text.toUpperCase());
		},

		trim : function() {
			
			return this.text(trim(this._text));
		},

		charAt : function(index) {

			return this._text.charAt(index);  
		},

		concat : function(riString) {
			
			return this._text.concat(riString.text());  
		}
			   
	}

	// ////////////////////////////////////////////////////////////
	// RiGrammar
	// ////////////////////////////////////////////////////////////

	var RiGrammar = makeClass();
	
	RiGrammar.START_RULE = "<start>";
	RiGrammar.PROB_PATT = /(.*[^\s])\s*\[([0-9.]+)\](.*)/;
	RiGrammar.EXEC_PATT = /(.*?)(`[^`]+?\(.*?\);?`)(.*)/;
	RiGrammar.STRIP_TICKS = /`([^`]*)`/g;
	RiGrammar.OR_PATT = /\s*\|\s*/;
	
	RiGrammar.prototype = {
		
		init : function(grammar) {

			this._rules = {};
			this.execDisabled = false;
			
			if (grammar) {
				
				// a String or Object, but make sure its not a PApplet (e.g., this)
				if (is(grammar, S) || (is(grammar, O) && typeof grammar.loadStrings !== F)) 
					this.load(grammar);	
			}
		},

		ready : function(url) {
			
			return (Object.keys(this._rules).length > 0);
		},
		
		loadFrom : function(url, callback) {

			RiTa.loadString(url, function(data) {
	
				this.load(data);
				is(callback, F) && (callback(data));
				
			}.bind(this));
		},

		load : function(grammar) {

			var ex; 
			
			this.reset();
			
			if (is(grammar, S)) {

				try {
					grammar = JSON.parse(grammar);

				}
				catch (e) {
					
					ex = e;
				}
			}
			
			if (ex || !is(grammar, O)) {  
				
				err('Grammar appears to be invalid JSON, please check'
					+ ' it! (http://jsonlint.com/)\n' + grammar);
					
				return;
			}

			for (var rule in grammar)				 
				this.addRule(rule, grammar[rule]);
			
			return this;
		},

		addRule : function(name, theRule, weight) 
		{
			var dbug = false;
	
			weight = weight || 1.0; // default

			if (dbug) log('addRule: "'+name+ '" : "'+theRule+'"       ['+Type.get(theRule)+']');

			var ruleset = theRule;
			if (!is(theRule, A)) 
				ruleset = theRule.split(RiGrammar.OR_PATT);
			
			for ( var i = 0; i < ruleset.length; i++) {
				
				var rule = ruleset[i];
				var prob = weight;
				var m = RiGrammar.PROB_PATT.exec(rule);
	
				if (m != null) // found weighting
				{
					if (dbug) {
						log("Found weight for " + rule);
						for (i = 0; i < m.length; i++)
							log("  " + i + ") '" + m[i] + "'");
					}
					
					rule = m[1] + m[3];
					prob = m[2];
					
					if (dbug) log("weight=" + prob + " rule='" + rule + "'");
				}
	
				if (this.hasRule(name)) {
					
					if (dbug)log("rule exists");
					var temp = this._rules[name];
					temp[rule] = prob;
				} 
				else {
					
					var temp2 = {};
					temp2[rule] = prob;
					this._rules[name] = temp2;
					
					if (dbug)log("added rule: "+name);
				}
			}
			
			return this;
		},
					
		removeRule : function(name)  {
			
			delete this._rules[name];
			return this;
			
		},

		_copy: function() {  // NIAPI
			
			var tmp = RiGrammar();
			for(var name in this._rules) {
				tmp._rules[name] = this._rules[name];
			}
			return tmp;

		},
			
		reset : function() {
			
		   this._rules = {};
		   return this;
		   
		},

		doRule : function(pre) {

			var cnt = 0, name = E, rules = this._rules[pre];
			
			if (!rules) return null;
			
			for (name in rules) cnt++;
			
			if (!cnt) return null;
			
			return (cnt == 1) ? name : this._getStochasticRule(rules); 
		},
		
		
		getGrammar : function() { 
			
			var s = E;
			for (var name in this._rules) {
				s += (name + "\n");
				var choices = this._rules[name];
				for (var p in choices) {
					s += ("  '" + p + "' [" + choices[p] + "]\n");
				}
			}
			return RiTa.chomp(s);
		},
			
		print : function() {  
			
			if (console) {
				var ln = "------------------------------";
				console.log(ln+"\n"+this.getGrammar()+ln);
			}
			return this;
			
		},
		
		hasRule : function(name) {

			return (typeof this._rules[name] !== 'undefined');
		},
		
		expandWith : function(literal, symbol) { // TODO: finish 

			var name, gr = this._copy(), match = false;
			
			for (name in gr._rules) {
				
				if (name===symbol) {
					
					var obj = {};
					obj[literal] = 1.0;
					gr._rules[name] = obj;
					match = true;
				}
			}
			
			if (!match) 
				err("Rule '"+symbol+"' not found in grammar");

			// TODO: tmp, awful hack, write this correctly
			var tries, maxTries = 1000;
			for (tries = 0 ;tries < maxTries; tries++) {
				var s = gr.expand();
				if (s.indexOf(literal)>-1)
					return s;
			}
			err("RiGrammar failed to complete after "+tries+" tries\n");
			
		},
		
		expand : function(context) {

			return this.expandFrom(RiGrammar.START_RULE, context);
		}, 
		
		expandFrom : function(rule, context) {
 
    		if (!Object.keys(this._rules).length)
		      err("(RiGrammar) No grammar rules found!");
		      
		    if (!this.hasRule(rule))
		      err("Rule not found: "+rule+"\nRules:\n"+JSON.stringify(this._rules));
		    
		    var parts, theCall, callResult, tries = 0, maxIterations = 1000;
		    while (++tries < maxIterations)
		    {
		      var next = this._expandRule(rule);
 
 		      if (next && next.length) { // matched a rule
		      	
		        rule = next;
		        continue;
		      }
		      
		      if (this.execDisabled) break; // return
		      
		      // finished rules, check for back-ticked exec calls
		      
		      parts = RiGrammar.EXEC_PATT.exec(rule);
	      
		      if (!parts || !parts.length) break; // return, no evals
		      
		      if (parts.length > 2) {
		        
		        theCall = parts[2];
				
				if (this._countTicks(theCall) != 2) {
				
					warn("Unable to parse recursive exec: " + theCall + "...");
					return null;
				}

		        callResult = this._handleExec(theCall, context);
		        
		        if (!callResult) {
		          
		          if (0==1) log("[WARN] (RiGrammar.expandFrom) Unexpected"
		              +" state: eval("+theCall+") :: returning '"+rule+"'");
		          
		          break; // return
		        }
		        
		        rule = parts[1] + callResult;
		            
		        (parts.length > 3) && (rule += parts[3]);
		      }
		    }
		    
    		if (tries >= maxIterations && !RiTa.SILENT) 
		      log("[WARN] max number of iterations reached: "+maxIterations);
		
		    return RiTa.unescapeHTML(rule); 
		},
		
		_countTicks : function(theCall) {
	
			var count = 0;
		    for (var i = 0; i < theCall.length; i++) {
		      if (theCall.charAt(i) == '`')
		        count ++;
		    }
		    return count;	
		},
		
		openEditor : function() {
			
			warn("Editor not yet implemented in JavaScript");
			return this;
		},
	 
		_handleExec : function(input, context) { 

			//log("_handleExec: "+input+ " "+ (typeof eval));

			if (!input || !input.length) return null;
			
			// strip backticks and eval
			var res, exec = input.replace(RiGrammar.STRIP_TICKS, '$1');
			
			try {
				// TODO: See issue #9 [https://github.com/dhowe/RiTaJS/issues?state=open]
				// if (typeof module != 'undefined' && module.exports) // for node	 
				// 		return require("vm").runInThisContext(exec,context);
				
				res = eval(exec); // try in global context
				
				return res ? res + E : null;	
			}
			catch (e) {

				// try with the PApplet context
				// TODO: clean this up
				// TODO: do we need to explicitly check window[funName] in the browser? 
				var parts = exec.split('(');
				if (parts && parts.length == 2) {
					
					var funName = parts[0];
					var argStr = parts[1].replace(/\)/,E);
					var g = context || RiText._graphics();
					if (g && g[funName] && is(g[funName],F)) {
						
						var args = argStr.split(',');
						//log("calling "+funName + "("+argStr+");");
						res = g[funName].apply(g, args);
						return res ? res + E : null;	
					}		
				}
				
				warn("RiGrammar failed parsing: "+input+"\n  -> "+e.message);
				return null;
			}
		},

		_expandRule : function(prod) { 
			
			var entry, idx, pre, expanded, post, dbug = 0;
			
			if (dbug) log("_expandRule(" + prod + ")");
			
			for ( var name in this._rules) {
				
				entry = this._rules[name];
				
				if (dbug) log("  name=" + name+"  entry=" + entry+"  prod=" + prod+"  idx=" + idx);
				
				idx = prod.indexOf(name);
				
				if (idx >= 0) {  // got a match, split into 3 parts
					
					pre = prod.substring(0, idx) || E;
					expanded = this.doRule(name) || E;
					post = prod.substring(idx + name.length) || E;
					
					if (dbug) log("  pre=" + pre+"  expanded=" + expanded+
						"  post=" + post+"  result=" + pre + expanded + post);
	
					return pre + expanded + post;
				}
			}
			
			return null; // no rules matched
		},

		// private?? (add structure test case)
		_getStochasticRule : function(temp)    { // map
	 
			var dbug = false;
			
			if (dbug) log("_getStochasticRule(" + temp + ")");
			
			var p = Math.random();
			var result, total = 0;
			for ( var name in temp) {
				total += parseFloat(temp[name]);
			}
			
			if (dbug) log("total=" + total+"p=" + p);
			
			 for ( var name in temp) {
				if (dbug) log("  name=" + name);
				var amt = temp[name] / total;
				
				if (dbug) log("amt=" + amt);
				
				if (p < amt) {
					result = name;
					if (dbug)log("hit!=" + name);
					break;
				} else {
					p -= amt;
				}
			}
			return result;
		}
		
	
	} // end RiGrammar
	
	
	//////////////////////////////////////////////////////////////////////
	//  RiText   
	////////////////////////////////////////////////////////////////////// 
	
	var RiText = makeClass();
			
	RiText._defaults = { 
		// TODO(v2.0): change fontSize to _fontSize; 
		fill : { r : 0, g : 0, b : 0, a : 255 }, fontFamily: 'Times New Roman',  
		alignment : RiTa.LEFT, motionType : RiTa.LINEAR, _font: null, fontSize: 14,
		paragraphLeading : 0, paragraphIndent: 30, indentFirstParagraph : false,
		boundingStroke : null, boundingStrokeWeight : 1, showBounds : false, 
		leadingFactor: 1.2, rotateX:0, rotateY:0, rotateZ:0, scaleX:1, scaleY:1, scaleZ:1, 
		metrics : {"name":"Times New Roman","size":14,"ascent":9.744,"descent":3.024,"widths":
		{ "0":7,"1":7,"2":7,"3":7,"4":7,"5":7,"6":7,"7":7,"8":7,"9":7,"!":5,"\"":6,"#":7,"$":7,
		"%":12,"&":11,"'":3,"(":5,")":5,"*":7,"+":8,",":4,"-":5,".":4,"/":4,":":4,";":4,"<":8,
		"=":8,">":8,"?":6,"@":13,"A":10,"B":9,"C":9,"D":10,"E":9,"F":8,"G":10,"H":10,"I":5,
		"J":5,"K":10,"L":9,"M":12,"N":10,"O":10,"P":8,"Q":10,"R":9,"S":8,"T":9,"U":10,"V":10,
		"W":13,"X":10,"Y":10,"Z":9,"[":5,"\\":4,"]":5,"^":7,"_":7,"`":5,"a":6,"b":7,"c":6,"d":7,
		"e":6,"f":5,"g":7,"h":7,"i":4,"j":4,"k":7,"l":4,"m":11,"n":7,"o":7,"p":7,"q":7,"r":5,
		"s":5,"t":4,"u":7,"v":7,"w":10,"x":7,"y":7,"z":6,"{":7,"|":3,"}":7," ":4 } }
	};
		
	//////////////////////////////////////////////////////////////////////
	// RiText statics
	////////////////////////////////////////////////////////////////////// 
	
	/* Static container for properties related to the update/render loop */
	RiText._animator = {
		
		loopId : -1,
		actualFPS : 0,
		targetFPS : 60,
		isLooping : false,
		frameCount : 0,
		loopStarted : false,
		framesSinceLastFPS : 0,
		callbackDisabled : false,
		timeSinceLastFPS : Date.now()
	}
	
	/* Returns the current graphics context, either a canvas 2d-context or ProcessingJS instance */
	RiText._graphics = function() {
		
		return RiText.renderer ? RiText.renderer._getGraphics() : null;
	}
	
	RiText.loop = function(callbackFun, fps) {   // TODO: REMOVE?
		
		var a = arguments, 
			g = RiText.renderer,  
			an = RiText._animator, 
			callback = undef(window) ? null : window['draw'];
		
		if (g._type() === 'Processing') return; // let P5 do its own loop
  
		if (an.loopStarted) return;
		
		switch (a.length) {
			
			case 1:
				
				if (a[0]) {
					var type = Type.get(a[0]);
					if (type == F) {
						callback = a[0];
					}
					else if (type == N) {
						an.targetFPS = a[0];
					}
				}
				break;
				
			case 2:
				
				if (a[0]) {
					
					var type = Type.get(a[0]);
					if (type == F) {
						callback = a[0];
					}
					type = Type.get(a[1])
					if (type == N) {
						an.targetFPS = a[1];
					}
				}
				break;
		}

		an.timeSinceLastFPS = Date.now(), an.framesSinceLastFPS = 0, mps =  1E3 / an.targetFPS;
		
		if (callback && !an.callbackDisabled && window) {
			
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
					warn("Unable to invoke callback: "+callback);
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
	
	RiText.randomColor = function(min,max,includeAlpha) {
		
		min = min || 0, max = max || 256;
		var col = [RiText.random(min,max),RiText.random(min,max),RiText.random(min,max)];
		if (includeAlpha) col.push(RiText.random(min,max));
		return col;
	}

	RiText.random = function() {
		
		return RiTa.random.apply(this ,arguments);
	}	

	RiText.picked = function(x, y) {
		
	  var hits = [];
	  for (var i = 0; i < RiText.instances.length; i++)
	  {
		var rt = RiText.instances[i];
		rt.contains(x, y) && hits.push(rt);
	  }
	  return hits;
	}

	RiText.dispose = function(toDelete) {
		
	   is(toDelete,A) && RiText._disposeArray(toDelete);
	   is(toDelete,O) && RiText._disposeOne(toDelete);
	}

	RiText.disposeAll = function() {
		
		for ( var i = 0; i < RiText.instances.length; i++) {

			if (RiText.instances[i]) {
				
				delete(RiText.instances[i]._rs);
				delete(RiText.instances[i]);
			}
		}
		
		RiText.instances = [];
	}
	
	RiText.createWords = function(txt, x, y, w, h, fontObj, leading) {

		return RiText._createRiTexts(txt, x, y, w, h, fontObj, leading, RiText.prototype.splitWords);
 	}

	RiText.createLetters = function(txt, x, y, w, h, fontObj, leading) {

		return RiText._createRiTexts(txt, x, y, w, h, fontObj, leading, RiText.prototype.splitLetters);
	}
	
	RiText.defaultFontSize = function(size) {
		
		if (!arguments.length) 
			return RiText.defaults.fontSize;
    	
    	if (RiText.defaults.fontSize != size) { 
    	
			RiText.defaults.fontSize = size;
			RiText.defaults._font = null;
		}
	}
  
	RiText.defaultFont = function(font, size) {

		var a = arguments;
		
		if (a.length > 1) {
			var sz = Number(a[1]);
			if (!sz) a = [a[0]];
		}
			
		if (a.length == 1) { // 1-arg
	
			if (typeof a[0] == O) {
				
				if (isNode() && a[0].widths) {// use no-op
					RiText.renderer.font = a[0];
					
					//log('setting RiText.renderer.font');
				}
				a[0].name && (RiText.defaults.fontFamily = a[0].name);
			  	RiText.defaults._font = a[0];
			}	
			
			// RiText.defaultFont(name);
			if (typeof a[0] == S) {
				
				RiText.defaults.fontFamily = a[0];
				RiText.defaults._font = RiText.renderer._createFont(a[0], RiText.defaults.fontSize);
			}
		}

		// RiText.defaultFont(name, size);
		else if (a.length > 1) { // > 1 args
			  
			if (typeof a[0] == S) {
			  RiText.defaults.fontFamily = a[0];
			  RiText.defaults._font = RiText.renderer._createFont(a[0], a[1]);
			}
		}
		
		// RiText.defaultFont();
		else if (a.length == 0 && !RiText.defaults._font) { // 0-args
						
			// TODO: What if defaults.fontSize has changed since defaults.font was created? 
			RiText.defaults._font = isNode() ? RiText.defaults.metrics 
				: RiText.renderer._createFont(RiText.defaults.fontFamily, RiText.defaults.fontSize);
		}

		return RiText.defaults._font;
	}
	
	/*
	 * Returns json-formatted string representing the font metrics for the default font,
	 *  with the following fields: { name, size, ascent, descent, widths }
	 * 
	 * @param chars (optional) array or string, characters for which widths should be calculated 
	 */
	RiText._fontMetrics = function(chars) {
		
		var i, j, c, gwidths={}, pf=RiText.defaultFont();

		if (!(chars && chars.length)) {
	    	chars = [];
	    	for (j = 33; j < 126; j++) {
	      		chars.push(String.fromCharCode(j));
			}    	
	    }
	    
	    if (is(chars, S)) chars = chars.split(E); // split into array
	    	    
		for (i = 0; i < chars.length; i++) {
	      //log(c +" -> "+pf.measureTextWidth(c))
	      c = chars[i];
	      gwidths[c] = pf.measureTextWidth(c);
	    }
	    
	    gwidths[SP] = pf.measureTextWidth(SP);
	    
	    return  { name: pf.name, size: pf.size, 
	    	ascent: pf.ascent,  descent: pf.descent, widths: gwidths 
	   	};
	}
	
	RiText._createFont = function(fontName, fontSize) {
		
		if (!fontName) err('RiText._createFont requires fontName');
		
		fontSize = fontSize || RiText.defaults.fontSize;

		return RiText.renderer._createFont(fontName, fontSize);
	}

	RiText.drawAll = function(array) {
		
		if (arguments.length == 1 && is(array,A)) { 
			for ( var i = 0; i < array.length; i++)
				array[i] && array[i].draw();
		}
		else {
			for ( var i = 0; i < RiText.instances.length; i++)
				RiText.instances[i] && RiText.instances[i].draw();
		}   
	}

	RiText.defaultFill = function(r, g, b, a) {
 
		if (arguments.length) { 
			RiText.defaults.fill = parseColor.apply(null, arguments);
		}
		return toColArr(RiText.defaults.fill);
	}
		
	
	// private statics ///////////////////////////////////////////////////////////////
	
	RiText._layoutArray = function(lines, x, y, w, h, pfont, leading) {
	
		if (!is(arguments[0], A)) { // ignore first (PApplet) argument
	    	var a = arguments;
	    	lines = a[1], x = a[2], y = a[3], w = a[4], h = a[5], pfont = a[6], leading = a[7];
	    }
	    
		var ritexts = [];
	    if (!lines || !lines.length) return ritexts;

	    for (var i = 0; i < lines.length; i++)
	      ritexts.push(RiText(lines[i], x+1, y).font(pfont));
	
	    return RiText._constrainLines(ritexts, y, h, leading);
	}
	
	RiText._constrainLines = function(ritexts, y, h, leading) {

		var ascent = ritexts[0].textAscent();
	    var descent = ritexts[0].textDescent();
	    var lastOk, next, maxY = y + h, currentY = y + ascent + 1;

	    // set y-pos for those that fit
	    for (lastOk = 0; lastOk < ritexts.length; lastOk++)
	    {
	      next = ritexts[lastOk];
	      next.y = currentY; 
	      //log(lastOk+") "+currentY);
	      if (!RiText._withinBoundsY(currentY, leading, maxY, descent))
	        break;
	      currentY += leading;
	    }   
	    
	    var toKill = ritexts.slice(lastOk+1);
	    
	    // and delete the rest
	    RiText.dispose(toKill);
	    	    	      
	 	var result = ritexts.slice(0, lastOk);
	 	
	 	//log("lastOk="+lastOk+"/"+ritexts.length + " toKill="+toKill.length+" result="+result.length);
	    
	 	return result;
  	}
  	
  	RiText.resetDefaults = function() {
  	
		RiText.defaults = RiText._defaults;
	}

	RiText.createLines = function(txt, x, y, w, h, pfont, leading) {
	
		var a = arguments, t = Type.get(a[0]), g = RiText.renderer;

		if (t != S && t != A) { // ignore first (PApplet/window) argument, shift
			txt = a[1], x = a[2], y = a[3], w = a[4], 
			h = a[5], pfont = a[6], leading = a[7];
		}

		if (!txt || !txt.length) return EA;

		h = h || Number.MAX_VALUE;
		pfont = pfont || RiText.defaultFont();

		leading = leading || pfont.size * RiText.defaults.leadingFactor;

		if (is(txt, A)) {
			
			if (!w) { // no width, so respect the line-breaks in the array
			 
				return RiText._layoutArray(txt, x, y, w, h, pfont, leading);
			}
			txt = txt.join(SP); // else join into single string
		}
		
		if (!w && g && g.width) w = g.width - x; // TODO: how to get width of sketch in Node renderer?
		
		if (w < 0) w = Number.MAX_VALUE;

		var ascent, descent, leading, startX = x, currentX, currentY, 
			rlines = [], sb = E, words = [], next, yPos = 0, rt = null,
			newParagraph = false, forceBreak = false, firstLine = true, 
			maxW = x + w, maxH = y + h;

		// for ascent/descent in canvas renderer
		if (!g || !g.p) rt = RiText(SP, 0, 0, pfont);

		// remove line breaks & add spaces around html
		txt = txt.replace(/&gt;/g, '>');
		txt = txt.replace(/&lt;/g, '<');
		txt = txt.replace(/ ?(<[^>]+>) ?/g, " $1 ");
		txt = txt.replace(/[\r\n]/g, SP);

		// split into reversed array of words
		RiText._addToStack(txt, words);
		if (!words.length)
			return RiText.EMPTY_ARRAY;

		//log("txt.len="+txt.length+" x="+x+" y="+y+" w="+w+" h="+h+" lead="+leading);log(pfont);

		g._textFont(pfont);
		
		// for ascent & descent
		ascent = g.p ? g.p.textAscent() : g._textAscent(rt, true);
		descent = g.p ? g.p.textDescent() : g._textDescent(rt, true);

		//log(g._type()+'.ascent/descent='+ascent+'/'+descent);

		currentY = y + ascent;
	
		if (RiText.defaults.indentFirstParagraph)
			startX += RiText.defaults.paragraphIndent;

		while (words.length > 0) {
			
			next = words.pop();

			if (!next.length) continue;

			// check for HTML-style tags
			if (/<[^>]+>/.test(next)) {
				if (next == RiText.NON_BREAKING_SPACE) {
					sb += SP;
				} 
				else if (next == RiText.PARAGRAPH_BREAK) {
					newParagraph = true;
				} 
				else if (next == RiText.LINE_BREAK) {
					forceBreak = true;
				}
				continue;
			}

			// re-calculate our X position
			currentX = startX + g._textWidth(pfont, sb + next);

			// check it against the line-width
			if (!newParagraph && !forceBreak && currentX < maxW) {
				sb += next + SP;
				// add-word
			} 
			else {
				
				// check yPosition to see if its ok for another line?
				if (RiText._withinBoundsY(currentY, leading, maxH, descent, firstLine)) {

					yPos = firstLine ? currentY : currentY + leading;
					rt = RiText._newRiTextLine(sb, pfont, startX, yPos);
					rlines.push(rt);

					currentY = newParagraph ? rt.y + RiText.defaults.paragraphLeading : rt.y;
					startX = x;
					// reset

					if (newParagraph)
						startX += RiText.defaults.paragraphIndent;

					sb = next + SP;
					// reset with next word

					newParagraph = false;
					forceBreak = false;
					firstLine = false
				} 
				else {

					// we've run out of y-space, break the loop and finish
					words.push(next);
					// not needed
					break;
				}
			}
		}

		// check if leftover words can make a new line
		if (RiText._withinBoundsY(currentY, leading, maxH, descent, firstLine)) {

			// TODO: what if there is are tags in here -- is it possible?)
			yPos = firstLine ? currentY : currentY + leading;
			rlines.push(RiText._newRiTextLine(sb, pfont, x, currentY));
			sb = E;
		} 
		else {

			RiText._addToStack(sb, words);
			// save for next (not needed?)
		}

		return rlines;
	}

	RiText._withinBoundsY = function(currentY, leading, maxY, descent, firstLine) {
		
    	if (!firstLine) 
    		return currentY + leading <= maxY - descent;
		return currentY <= maxY - descent;
  	}
  
	RiText._addToStack = function(txt, words) {

		var tmp = txt.split(SP)
		for ( var i = tmp.length - 1; i >= 0; i--)
			words.push(tmp[i]);
	}
	  
	RiText._newRiTextLine = function(s, pf, xPos, nextY) {
		
	    // strip trailing spaces
	    while (s != null && s.length > 0 && endsWith(s, SP))
	      s = s.substring(0, s.length - 1);
	    
	    return RiText(s, xPos, nextY, pf);
	    //log(rt);return rt;
	}
	
	RiText._createRiTexts = function(txt, x, y, w, h, fontObj, lead, splitFun) {  

		var rlines = RiText.createLines(txt, x, y, w, h, fontObj, lead);
		if (!rlines || rlines.length < 1) return EA;

		var result = [];
		var font = rlines[0].font();
		for (var i = 0; i < rlines.length; i++) {
			
			var rts = splitFun.call(rlines[i]);
			for (var j = 0; j < rts.length; j++) {
				
				result.push(rts[j].font(fontObj)); 
			}
			
			RiText.dispose(rlines[i]);
		}

		return result;
	}

	// Returns the pixel x-offset for the word at 'wordIdx' 
	RiText._wordOffsetFor = function(rt, words, wordIdx) { 

		if (wordIdx < 0 || wordIdx >= words.length)
			throw new Error("Bad wordIdx=" + wordIdx + " for " + words);
		
		rt.g._pushState();

		var xPos = rt.x;

		if (wordIdx > 0) {
			
			var pre = words.slice(0, wordIdx);
			var preStr = '';
			for ( var i = 0; i < pre.length; i++) {
				preStr += pre[i] + ' ';
			}

			var tw = rt.g._textWidth(rt._font, preStr);

			//log("x="+xPos+" pre='"+preStr+"' tw=" + tw); 

			switch (rt._alignment) {
				case RiTa.LEFT:
					xPos = rt.x + tw;
					break;
				case RiTa.RIGHT:
					xPos = rt.x - tw;
					break;
				case RiTa.CENTER:
					warn("TODO: test center-align here");
					xPos = rt.x; // ?
					break;
			}
		}
		rt.g._popState();

		return xPos;
	}
	
	RiText._handleLeading = function(fontObj, rts, startY) {

		if(!rts || !rts.length) return;

		fontObj = fontObj || RiText._getDefaultFont();

		//log('handleLeading: '+fontObj.leading);

		var nextHeight = startY;
		rts[0].font(fontObj);
		for(var i = 0; i < rts.length; i++) {

			//if(fontObj) rts[i].font(fontObj); // set the font
			rts[i].y = nextHeight; // adjust y-pos
			nextHeight += fontObj.leading;
		}

		return rts;
	}
	
	RiText._disposeOne = function(toDelete) {
		
		var items = RiText.instances;
		
		while (items.indexOf(toDelete) !== -1) {
			items.splice(items.indexOf(toDelete), 1);
		}
		
		if (toDelete) {
			delete(toDelete._rs);
			delete(toDelete);
			toDelete._rs = {};
			toDelete = {};
		}

	}  

	RiText._disposeArray = function(toDelete) {
		
		for ( var i = 0; i < toDelete.length; i++) {
			
			RiText._disposeOne(toDelete[i]);
		}
		
		toDelete = [];
	}
	
	// TODO: test this font default across all platforms and browsers
	
	RiText._getDefaultFont = function() {
		
		//log("RiText._getDefaultFont1: "+RiText.defaults._font+","+RiText.defaults.fontFamily+","+RiText.defaults.fontSize);

		RiText.defaults._font = RiText.defaults._font || 
			RiText.renderer._createFont(RiText.defaults.fontFamily, RiText.defaults.fontSize);

		return RiText.defaults._font;
	}

	RiText.timer = RiTa.timer;
	RiText.pauseTimer = RiTa.pauseTimer;
	RiText.stopTimer = RiTa.stopTimer;
	
	// PUBLIC statics   ///////////////////////////////////////////
   
    // TODO: make into regex that matches '<p>', '<p/>', '&lt;p&gt;', and '&lt;p/&gt;' 
	RiText.NON_BREAKING_SPACE = "<sp/>";
	RiText.PARAGRAPH_BREAK = "<p/>";  //   regex: /<p\/?>/g;
	RiText.LINE_BREAK = "<br/>";
	RiText.instances = [];

	RiText.defaults = RiText._defaults;

	RiText.prototype = {

		init : function(text, x, y, font) { 
						
			if (!RiText.renderer) 
				err("No graphics context, RiText unavailable");
			
			this._color = { 
				r : RiText.defaults.fill.r, 
				g : RiText.defaults.fill.g, 
				b : RiText.defaults.fill.b, 
				a : RiText.defaults.fill.a 
			};
			
			this._boundingStrokeWeight = RiText.defaults.boundingStrokeWeight;
			
			var bbs = RiText.defaults.boundingStroke;
			this._boundingStroke = { 
				r : (bbs && bbs.r) || this._color.r, 
				g : (bbs && bbs.g) || this._color.g, 
				b : (bbs && bbs.b) || this._color.b, 
				a : this._color.a
			};
			
			this._boundingFill = RiText.defaults.boundingFill;

			this._showBounds = RiText.defaults.showBounds;
			this._motionType = RiText.defaults.motionType;
			this._alignment = RiText.defaults.alignment;
	
			this._rotateX = RiText.defaults.rotateX;
			this._rotateY = RiText.defaults.rotateY;
			this._rotateZ = RiText.defaults.rotateZ;
			
			this._scaleX = RiText.defaults.scaleX;
			this._scaleY = RiText.defaults.scaleY;
			this._scaleZ = 1;
	 
			this._behaviors = [];
			
			this.g = RiText.renderer;
			
			// handle the arguments
			var args = this._initArgs.apply(this,arguments);

			this.font(args[3]);
			this.text(args[0]);

			// center by default
			this.x = is(args[1], N) ? args[1] : this._screenCenterX();
			var screenH =  (this.g && this.g.p) ? (this.g.p.height / 2) : 50;  // TODO: what to do for Node?
			this.y = is(args[2],N) ? args[2] : screenH + (this.textHeight() / 2.0) ;
			this.z = 0;
			
			//log('RiText: '+this._rs._text +"("+this.x+","+this.y+")"+" / "+ this._font.name);

			RiText.instances.push(this);
			
			return this;
		},
		
		_initArgs : function() {

			var a = arguments, t = Type.get(a[0]);
		
			//console.error("a[0]="+t+" a.length="+a.length+" type="+t+" analyze="+typeof a[0].text);
			
			if (a.length && (t===O || t==='global' || t==='window') && typeof a[0].analyze != F) {
				
				// recurse, ignore 'this'
				var shifted = Array.prototype.slice.call(a, 1);

				return this._initArgs.apply(this, shifted);
			}

			var parsed = [E, null, null, null];
			if (a.length) {

				if (is(a[0], S))   // String
					parsed[0] = a[0];
				
				else if (is(a[0], O) && typeof a[0].text == F)
					parsed[0] = a[0].text(); // RiString
				
				else if (is(a[0], N)) // Number
					parsed[0] = String.fromCharCode(a[0]);
					
				else
				  console.error("Unexpected arg in RiText("+a[0]+" [type="+(typeof a[0])+"])");
			}
			
			if (a.length > 1) parsed[1] = a[1];
			if (a.length > 2) parsed[2] = a[2];
			if (a.length > 3) parsed[3] = a[3];

			return parsed;
		},
		
		_screenCenterX : function() {  // to match java
			
			var scx = (this.g && this.g.p) ? this.g.p.width / 2.0 : -1; // TODO: what to do for Node?
			
			if (this._alignment == RiTa.LEFT)
      			scx -= (this.textWidth() / 2.0);
    		else if (this._alignment == RiTa.RIGHT)
      			scx += (this.textWidth() / 2.0);
      			
      		return scx;
		},

		get : function(fn) {
			
			return this._rs.get(fn);
		},
		
		features : function() {
			
		   return this._rs.features();
		},

		draw : function() {
		  this._update()._render();   
		  if (this.textToCopy)
			  this.textToCopy.draw();
		  return this;
		},
		
		_update : function() {
			
			if (this._behaviors.length)
				this._updateBehaviors();
			return this;
		},
		
		_render : function() {
			
			var g = this.g;
			
			if (!g) err('no-renderer');
			
			if (this._rs && this._rs.length) {
			
				g._pushState();
				
				var bb = g._getBoundingBox(this); // cache this!
				
				g._translate(this.x, this.y);
				g._translate(bb.width/2, bb.height/-4);
				g._rotate(this._rotateZ);				
				g._translate(bb.width/-2, bb.height/4);
				g._scale(this._scaleX, this._scaleY, this._scaleZ); 
			 
				// Set color
				g._fill(this._color.r, this._color.g, this._color.b, this._color.a);

				// Set font params
				g._textFont(this._font);
				g._textAlign(this._alignment);
		
				// Draw text
				g._text(this._rs._text, 0, 0);
				
				// And the bounding box
				if (this._showBounds) {
					
					// push/popStyle
					if (!this._boundingFill)// &&this._boundingFill.r < 0 && this._boundingFill.g < 0 && this._boundingFill.b < 0)
						g._noFill();
					else
						g._fill(this._boundingFill.r, this._boundingFill.g, this._boundingFill.b, this._color.a);
	
					g._stroke(this._boundingStroke.r, this._boundingStroke.g, 
							this._boundingStroke.b, this._color.a);

  					g._strokeWeight(this._boundingStrokeWeight);

					// shift bounds based on alignment  
					switch(this._alignment) { // this should be part of updateBoundingBox() (see Java)
						
						case RiTa.RIGHT:
							g._translate(-bb.width,0);
							break;
						case RiTa.CENTER:
							g._translate(-bb.width/2,0);
							break;
					}
					g._rect(0, bb.y, bb.width, bb.height); // what??
				}
				
				g._popState();
			}
	
			return this;
		},
		
		///////////////////////////////// Text Behaviors ////////////////////////////////////

		motionType : function (motionType) {
			if (arguments.length) {
				this._motionType = motionType;
				return this;
			}
			return this._motionType;
		},

		fadeIn : function(seconds, delay, callback) {
			
			return this.colorTo(toColArr(c, 255),
				seconds, delay, null, RiTa.FADE_IN, false);
		},

		fadeOut : function(seconds, delay, callback, destroyOnComplete) {
	
			destroyOnComplete = destroyOnComplete || false;
			return this.colorTo(toColArr(c, 0), 
				seconds, delay, null, RiTa.FADE_OUT, destroyOnComplete);
		},

		scaleTo : function(theScale, seconds, delay, callback) {

			var rt = this;
			delay = delay || 0;
			seconds = seconds || 1.0;
				
			var id = setTimeout(function() {
				
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
						   RiTaEvent(rt, RiTa.SCALE_TO)._fire(callback);                    
					});
			
				tb.start();
				
			}, delay*1000);
				
			return id;
		},
		
		rotateTo : function(angleInRadians, seconds, delay, callback) {

			var rt = this;
			delay = delay || 0;
			seconds = seconds || 1.0;
				
			var id = setTimeout(function() {
				
				var tb = new TextBehavior(rt)
					.to( { _rotateZ: angleInRadians  }, seconds*1000)
					.easing(rt._motionType)
					.onUpdate( function () {
					
						rt._rotateZ = this._rotateZ;
					})
					//.delay(delay*1000)
					.onComplete( 
						function () {
						   RiTaEvent(rt, RiTa.ROTATE_TO)._fire(callback);                    
					});
			
				tb.start();
				
			}, delay*1000);
				
			return id;
		},
		
		textTo: function(newText, seconds, startTime, callback) {

			// grab the start alpha if needed
			var c = this._color, startAlpha = 0, endAlpha = c.a;

			if (this.textToCopy) {
				
				startAlpha = this.textToCopy.alpha();
				RiText.dispose(this.textToCopy);
			}

			// use the copy to fade out
			this.textToCopy = this.copy();
			this.textToCopy.colorTo( toColArr(c,0),
				 seconds/2.0, startTime, null, RiTa.INTERNAL, true); // fade-out
				 
			RiText.dispose(this.textToCopy.textToCopy);	// no turtles [js-only]

			// and use 'this' to fade in
			this.text(newText).alpha(startAlpha);

			return this.colorTo(toColArr(c, endAlpha), seconds * .95, 
				startTime, callback, RiTa.TEXT_TO, false);
		},

		colorTo : function(colors, seconds, delay, callback, _type, _destroyOnComplete) {             

			// DH: omitting last 2 args from docs as they are private

			if (!is(colors,A))  err('arg#1 to colorTo() must be an array');
			
			//log(colors[0], g: colors[1], b: colors[2], a: colors[3], seconds);

			delay = delay || 0;
			seconds = seconds || 1.0;
			colors = parseColor.apply(this, colors);
			_type = _type || RiTa.COLOR_TO;            

			var rt = this, id = setTimeout(function() {

				new TextBehavior(rt, rt._color)
					.to( { r: colors.r, g: colors.g, b: colors.b, a: colors.a }, seconds*1000)
					.easing(rt._motionType)
					.onUpdate( function () {
					   rt._color.r = this.r;
					   rt._color.g = this.g;
					   rt._color.b = this.b;
					   rt._color.a = this.a;
					   rt._boundingStroke.a = this.a;
					})
					.onComplete( 
						
						function () {
							
							if (_type != RiTa.INTERNAL)
								RiTaEvent(rt, _type)._fire(callback);  
								  
							if (_destroyOnComplete) {
								RiText.dispose(rt);
								
							}
						})
					.start();
				
			}, delay*1000);
			
			return id;
		},
	   
		moveTo : function(newX,newY,seconds,delay,callback) {
			
			var rt = this;
			
			delay = delay || 0;
			seconds = seconds || 1.0;
			
			var id = setTimeout(function() {
				
				new TextBehavior(rt)
					.to( { x: newX, y: newY }, seconds*1000)
					.easing(rt._motionType)
					.onUpdate( function () {
						rt.x = this.x ;
						rt.y = this.y ;
					})
					.delay(delay).onComplete( 
						function () {
							RiTaEvent(rt, RiTa.MOVE_TO)._fire(callback);                    
						})
					.start();
				
			}, delay*1000);
			
			return id;
		},

		analyze : function() {
	
			this._rs.analyze();
			return this;
		},
		
		text : function(txt) {
			
			if (arguments.length == 1) {
				
				var theType = Type.get(txt);
				
				if (theType == N) {
					txt = String.fromCharCode(txt);
				}
				else if (theType == O && typeof txt.text == F) { 
					txt = txt.text();
				}
				this._rs = (this._rs) ? this._rs.text(txt) : new RiString(txt);
	
				return this;
			}
			
			return this._rs._text;
		},
		
		match : function(regex) {
			
			return this._rs.match(regex);
			
		},

		charAt : function(index) {

			return this._rs.charAt(index);
			
		},

		concat : function(riText) {

			return this._rs._text.concat(riText.text());
			
		},

		containsWord : function(text) {
			
			return this._rs.indexOf(text) > -1;
			
		},

		endsWith : function(substr) {
			
			return endsWith(this._rs._text, substr);
			
		},

		equals : function(RiText) {
			
			return RiText._rs._text === this._rs._text;
			
		},

		equalsIgnoreCase : function(str) {
			
			if (typeof str === S) {
				
				return str.toLowerCase() === this._rs._text.toLowerCase();
			} 
			else {
				
				return str.text().toLowerCase() === this._rs._text.toLowerCase();
			}
			
		},

		indexOf : function(searchstring, start) {
			
			return this._rs._text.indexOf(searchstring, start);
			
		},

		lastIndexOf : function(searchstring, start) {
			
			return this._rs._text.lastIndexOf(searchstring, start);
			
		},

		length : function() {
			
			return this._rs._text.length;
			
		},

		pos : function() {
				   
			var words = RiTa.tokenize((this._rs._text)); // was getPlaintext()
			var tags = PosTagger.tag(words); 
  
			for ( var i = 0, l = tags.length; i < l; i++) {
				if (!strOk(tags[i])) 
					err("RiText: can't parse pos for:" + words[i]);
			}
		
			return tags;
			
		},

		posAt : function(index) {
			
			var tags = this._rs.pos();

			if (!tags || !tags.length || index < 0 || index >= tags.length)
				return E;
			
			return tags[index];
			
		},

		insertChar : function(ind, theChar) { 
			
			this._rs.insertChar(ind, theChar);
			return this;
			
		},

		removeChar : function(ind) { 
			
			this._rs.removeChar(ind);
			return this;
			
		},
		
		replaceChar : function(idx, replaceWith) {
			
			this._rs.replaceChar(idx, replaceWith);
			return this;
		},

		replaceFirst : function(regex, replaceWith) {
			
			if (replaceWith) 
				this._rs._text = this._rs._text.replace(regex,replaceWith);
			return this;
			
		},
		
		replaceLast : function(regex, replaceWith) {
		   
			if (replaceWith) {

				if (this._rs._text.lastIndexOf(regex) >= 0) { //TODO: this do not work for regex..
					var ind = this._rs._text.lastIndexOf(regex);
					var before = this._rs._text.substring(0, ind);
					var after = this._rs._text.substring(ind + regex.length);

					var finished = before + replaceWith + after;
					this._rs._text = finished;

					return this;
				}
			};
		},

		replaceAll : function(pattern, replacement) {
			
			// SHOULD BE: this._rs._text.replace(pattern, replacement)
			if (pattern && (replacement || replacement==='')) {
				this._rs._text = replaceAll(this._rs._text, pattern, replacement);
			}
			return this;
			
		},

		replaceWord : function(wordIdx, newWord) {

			this._rs.replaceWord.apply(this,arguments);
			
			return this; // TODO: check that all RiText methods use the delegate 
						//  (like above) for methods that exist in RiString
		},	 

		removeWord : function(wordIdx) {
			
			this._rs.removeWord.apply(this,arguments);
			return this;
		},   

		insertWord : function(wordIdx, newWord) {
			
			this._rs.insertWord.apply(this, arguments);
			return this;            
		},

		slice : function(begin, end) {
			
			var res = this._rs._text.slice(begin, end) || E;
			return this._rs.text(res);
			 
		},

		startsWith : function(substr) {
			
			return this._rs.indexOf(substr) == 0;
			
		},

		substring : function(from, to) {

			return this._rs.text(this._rs._text.substring(from, to));
			
		},

		substr : function(start, length) {
			
			var res = this._rs._text.substr(start, length);
			return this._rs.text(res);
			
		},

		toLowerCase : function() {
			
			return this._rs.text(this._rs._text.toLowerCase());
			
		},

		toUpperCase : function() {
			
			return this._rs.text(this._rs._text.toUpperCase());
			
		},

		trim : function() {
			
			return this._rs.text(trim(this._rs._text));
			
		},

		wordAt : function(index) {
			
			var words = RiTa.tokenize((this._rs._text));
			if (index < 0 || index >= words.length)
				return E;
			return words[index];
			
		},

		wordCount : function() {
			
			if (!this._rs._text.length) return 0;
			return this.words().length;
		},

		words : function() { 
			
			return RiTa.tokenize(this._rs._text);
		},

		distanceTo : function(a,b) {
			
	      var p2x, p2y, p1 = this.center();
	       
	      if (a.length == 1 && is(a.center,F)) {
		     p2 = a.center();
		     p2x = p2[0];
		     p2y = p2[1];
		  }
		  else {
		  	 p2x = a;
		     p2y = b;
		  }
		  
		  return RiTa.distance(p1[0], p1[1],  p2x,  p2y);
		},

		center : function() {
			
			var bb = this.boundingBox(); // note: this is different than RiTa (TODO: sync)
			return [ bb[0] + bb[2]/2.0, bb[1]  + bb[3]/2.0 ];
		},

		splitWords : function(regex) {
			
			regex = regex || SP;
			
			(typeof regex == S) && (regex = new RegExp(regex));  
			
			var l = [];
			var txt = this._rs._text;
			var words = txt.split(regex);
	
			for ( var i = 0; i < words.length; i++) {
				if (words[i].length < 1) continue;
				var tmp = this.copy();
				tmp.text(words[i]);
				var mx = RiText._wordOffsetFor(this, words, i);
				tmp.position(mx, this.y);
				l.push(tmp);
			}
	
			return l;
		},
	
		splitLetters : function() {
	
			var l = [];
			var chars = [];
			var txt = this.text();
			var len = txt.length;
			for (var t = 0; t < len; t++) {
				chars[t] = txt.charAt(t);
			}
	
			for ( var i = 0; i < chars.length; i++) {
				if (chars[i] == SP) continue;
				var tmp = this.copy();
				tmp.text(chars[i]);
				var mx = this.charOffset(i);
				tmp.position(mx, this.y);
				l.push(tmp);
			}
	
			return l;
		},

		contains : function(mx, my) {

		   var bb = this.boundingBox(true);
		   bb[0] += this.x;
		   bb[1] += this.y;
		   
		   return (!(mx<bb[0] || mx > bb[0]+bb[2] || my < bb[1] || my > bb[1]+bb[3]));
		},

		copy : function() {

			var c = new RiText(this.text(), this.x, this.y, this._font);
			c.fill(this._color.r, this._color.g, this._color.b, this._color.a);

			for (var prop in this) {
				if (typeof this[prop] ==  F || typeof this[prop] ==  O) 
					continue;
				c[prop] = this[prop];
			}

			return c;
		},

		align : function(align) {
			if (arguments.length) {
				this._alignment = align;
				return this;
			}
			return this._alignment;
		},

		font : function(font, size) { // TODO: cases for when arg1 is object & string
			
			var a = arguments;
			
			if (a.length == 1) {
			
				this._font = font || RiText._getDefaultFont();
				this._font.size = this._font.size || RiText.defaults.fontSize;

				return this;
			}
			else if (a.length == 2) {
				
				return this.font(RiText.renderer._createFont(a[0], a[1]));
			}

			return this._font;
		},    

		showBounds : function(trueOrFalse) {
		   if (arguments.length == 1) {
			   this._showBounds = trueOrFalse;
			   return this;
		   }
		   return this._showBounds;
		},

		fill : function(cr, cg, cb, ca) {
			//log("fill");
			if (arguments.length == 0) 
				return this._color;
			this._color = parseColor.apply(this, arguments);
			return this;
		},

		isVisible : function() { 
			
			if (arguments.length)
				 err('isVisible() takes no arguments');
			
			return this._color.a > 0;
		},

		alpha : function(a) {
			if (arguments.length==1) {
				this._color.a = a;
				return this;
			}
			else return this._color.a;
		},

		position : function(x, y) {
			
			//TODO: add Z
			 
			if (!arguments.length) 
				return [ this.x, this.y ];
			this.x = x;
			this.y = y;
			return this;
		},

		rotate : function(rotate) {
			
			//TODO: add X,Y ??
		  if (!arguments.length) 
			  return this._rotateZ
		  this._rotateZ = rotate;
		  return this;
		},

		scale : function(theScaleX, theScaleY) {
			
			if (!arguments.length) return { x:this._scaleX, y:this._scaleY }; //TODO: add Z
				
			if (arguments.length == 1) theScaleY = theScaleX;
			
			this._scaleX = theScaleX;
			this._scaleY = theScaleY;
			
			return this;
		},

		charOffset : function(charIdx) {
	
			var theX = this.x;
	
			if (charIdx > 0) {
	
				var txt = this.text();
	
				var len = txt.length;
				if (charIdx > len) // -1?
				charIdx = len;
	
				var sub = txt.substring(0, charIdx);
				theX = this.x + this.g._textWidth(this._font, sub);
			}

			return theX;
		},

		wordOffset : function(wordIdx) { 
			
			return RiText._wordOffsetFor(this, this.words(), wordIdx);
		},

		boundingBox : function(noTransform) { // argument is not part of api

			var g = this.g, bb = this.g._getBoundingBox(this);

			g._pushState(); // really, do we need all this here? 
			
			// make function (here and in draw)
			g._translate(this.x, this.y);
			g._translate(bb.width/2, bb.height/-4);
			g._rotate(this._rotateZ);				
			g._translate(bb.width/-2, bb.height/4);
			g._scale(this._scaleX, this._scaleY, this._scaleZ);
			 
			// Set font params
			g._textFont(this._font);
			g._textAlign(this._alignment);

			if (!noTransform) {
				bb.x += this.x;
				bb.y += this.y;
				bb.width *= this._scaleX;
				bb.height *= this._scaleY;
			}
			g._popState();

			return [bb.x,bb.y,bb.width,bb.height];
		},

		textWidth : function() { 
			
			return this.g._textWidth(this._font,this._rs._text);
		},

		textHeight : function() { 
			
			return this.g._textHeight(this);
		},

		fontSize : function(f) {
 
			if (!arguments.length) {
				
				return this._font ? this._font.size : -1;
			}
			
			// DCH: changed:
			//return (arguments.length) ? this.scale( sz / this._font.size) 
				//: (this._font.size * this._scaleX);
			
			if (this._font && (this._font.size == f)) 
				return this; // no-op
			    	
	    	var name = RiText.defaults.fontFamily;
	    	if (this._font && this._font.name)
	    		name = this._font.name;
	    		
	    	this.font(name, f);	// recreate	from name/sz	      	

		    return this;
		},

		textAscent : function() { 
			
			return this.g._textAscent(this);
		},

		textDescent : function() { 
			
			return this.g._textDescent(this);
		},
		 
		/*
		 * Adds a new text behavior to the object  
		 * @returns {array} 
		 */
		_addBehavior: function ( behavior ) {

			this._behaviors.push( behavior );

		},
		
		/*
		 * Returns the specified text behavior  
		 * @param {number} the behavior id
		 */
		_getBehavior: function ( id ) {

			for (var i = 0; i < this._behaviors.length; i++) {
				if (this._behaviors[i].id == id)
					return this._behaviors[i].id;
			}
			
			return null;
		},

		stopBehavior: function ( id ) {

			var behavior = this._getBehavior(id);
			
			if (behavior) {
				var i = this._behaviors.indexOf(behavior);
				if ( i !== -1 ) {
	
					this._behaviors.splice( i, 1 );
	
				}
			}
			return this;
		},

		stopBehaviors: function () {

			this._behaviors = [];
			return this;
		},
		
		/*
		 * Updates existing text behaviors for the object 
		 * @param {string} the behaviors
		 */
		_updateBehaviors: function (time) {

			var i = 0;
			var num = this._behaviors.length;
			var time = time || Date.now();

			while ( i < num ) {

				if (this._behaviors[i].update(time) ) {
					i++;

				} else {

					this._behaviors.splice(i, 1);
					num --;

				}
			}
		},
		
		toString : function() {
			
			var s =  (this._rs && this._rs._text) || 'undefined';
			return '['+Math.round(this.x)+","+Math.round(this.y)+",'"+s+"']";
		}
	}
	
	/////////////////////////////////////////////////////////////////////////
	// RiLetterToSound (adapted from FreeTTS text-to-speech)
	/////////////////////////////////////////////////////////////////////////
	
	var LetterToSound = makeClass();
	
	/*
	 * Entry in file represents the total number of states in the file. This
	 * should be at the top of the file. The format should be "TOTAL n" where n is
	 * an integer value.
	 */
	LetterToSound.TOTAL = "TOTAL";
	
	/*
	 * Entry in file represents the beginning of a new letter index. This should
	 * appear before the list of a new set of states for a particular letter. The
	 * format should be "INDEX n c" where n is the index into the state machine
	 * array and c is the character.
	 */
	LetterToSound.INDEX = "INDEX";
	
	/*
	 * Entry in file represents a state. The format should be "STATE i c t f"
	 * where 'i' represents an index to look at in the decision string, c is the
	 * character that should match, t is the index of the state to go to if there
	 * is a match, and f is the of the state to go to if there isn't a match.
	 */
	LetterToSound.STATE = "STATE";
	
	/*
	 * Entry in file represents a final state. The format should be "PHONE p"
	 * where p represents a phone string that comes from the phone table.
	 */
	LetterToSound.PHONE = "PHONE";
	
	/*
	 * If true, the state string is tokenized when it is first read. The side
	 * effects of this are quicker lookups, but more memory usage and a longer
	 * startup time.
	 */
	LetterToSound.tokenizeOnLoad = true;
	
	/*
	 * If true, the state string is tokenized the first time it is referenced. The
	 * side effects of this are quicker lookups, but more memory usage.
	 */
	LetterToSound.tokenizeOnLookup = false;

	LetterToSound.WINDOW_SIZE = 4;

	LetterToSound.prototype = {

		init : function() {
			
			/*
			 * The indices of the starting points for letters in the state machine.
			 */
			this.letterIndex = {};
			
			/*
			 * An array of characters to hold a string for checking against a rule. This
			 * will be reused over and over again, so the goal was just to have a single
			 * area instead of new'ing up a new one for every word. The name choice is to
			 * match that in Flite's <code>cst_lts.c</code>.
			 */
		   this.fval_buff = [];
	
			/*
			 * The LTS state machine. Entries can be String or State. An ArrayList could
			 * be used here -- I chose not to because I thought it might be quicker to
			 * avoid dealing with the dynamic resizing.
			 */
			this.stateMachine = null;
	
			/*
			 * The number of states in the state machine.
			 */
			this.numStates = 0;
			
			// verify that the lts rules are included
			if (!LetterToSound.RULES) LetterToSound.RULES = _RiTa_LTS;
			
			if (!LetterToSound.RULES.length) 
				throw Error("[RiTa] No LTS-rules found!");
			
			// add the rules to the object (static?)
			for ( var i = 0; i < LetterToSound.RULES.length; i++) {
				
				this.parseAndAdd(LetterToSound.RULES[i]);
			}
		},
		
		_createState : function(type, tokenizer) {
		 
			if (type === LetterToSound.STATE)
			{
			  var index = parseInt(tokenizer.nextToken());
			  var c = tokenizer.nextToken();
			  var qtrue = parseInt(tokenizer.nextToken());
			  var qfalse = parseInt(tokenizer.nextToken());
			  
			  return new DecisionState(index, c.charAt(0), qtrue, qfalse);
			}
			else if (type === LetterToSound.PHONE)
			{
			  return new FinalState(tokenizer.nextToken());
			}
			
			throw Error("Unexpected type: "+type);
		},
		
		/* Creates a word from the given input line and add it to the state machine.
		   It expects the TOTAL line to come before any of the states.*/
		 parseAndAdd : function(line) {
			 
		  var tokenizer = new StringTokenizer(line, SP);
		  var type = tokenizer.nextToken();

		  if (type == LetterToSound.STATE || type == LetterToSound.PHONE)
		  {
			if (LetterToSound.tokenizeOnLoad)
			{
			  this.stateMachine[this.numStates] = this._createState(type, tokenizer);
			} 
			else
			{
			  this.stateMachine[this.numStates] = line;
			}
			this.numStates++;
		  } 
		  else if (type==LetterToSound.INDEX)
		  {
			var index = parseInt(tokenizer.nextToken());
			if (index != this.numStates)
			{
			  throw Error("Bad INDEX in file.");
			} 
			else
			{
			  var c = tokenizer.nextToken();
			  this.letterIndex[c] = index;
			  
			}
			//log(type+" : "+c+" : "+index + " "+this.letterIndex[c]);
		  } 
		  else if (type==LetterToSound.TOTAL)
		  {
			this.stateMachine = [];
			this.stateMachineSize = parseInt(tokenizer.nextToken());
		  }
		},

		getPhones : function(input, delim) {
			
			var ph, result = []; 
			
			delim = delim || '-';
			
			if (is(input, S)) {
				
				if (!input.length) return E; 
				
				input = RiTa.tokenize(input);
			}
  
			for (var i = 0; i < input.length; i++) {
				
				ph = this._computePhones(input[i]);
				result[i] = ph ? ph.join(delim) : E;
			}
			
			return result.join(delim);  
		},

		_computePhones : function(word) {
			
		  var dig, phoneList = [], full_buff, tmp, currentState, startIndex, stateIndex, c;
		  
		  if (!word || !word.length || RiTa.isPunctuation(word))
			  return null;
		  
		  word = word.toLowerCase();
		  
		  if (isNum(word)) {
			  
			  word = (word.length>1) ? word.split(E) : [word];
			  
			  for (var i = 0; i < word.length; i++) {
				  
				  dig = parseInt(word[i]);
				  if (dig < 0 || dig > 9)
					  throw Error("Attempt to pass multi-digit number to LTS: '"+word+"'");
				  
				  phoneList.push(RiString.phones.digits[dig]);
			  }
			  
			  return phoneList;
		  }
	
		  // Create "000#word#000", uggh
		  tmp = "000#"+word.trim()+"#000", full_buff = tmp.split(E);
		  
		  // For each character in the word, create a WINDOW_SIZE
		  // context on each size of the character, and then ask the
		  // state machine what's next
		  for (var pos = 0; pos < word.length; pos++) {
			  
			for (var i = 0; i < LetterToSound.WINDOW_SIZE; i++) {
				
			  this.fval_buff[i] = full_buff[pos + i];
			  this.fval_buff[i + LetterToSound.WINDOW_SIZE] = 
			  	full_buff[i + pos + 1 + LetterToSound.WINDOW_SIZE];
			}
			
			c = word.charAt(pos);
			startIndex = this.letterIndex[c];
			
			// must check for null here, not 0
			if (startIndex==null) {
				warn("Unable to generate LTS for '"+word+"'\n       No LTS index for character: '"
					+ c + "', isDigit=" + isNum(c) + ", isPunct=" + RiTa.isPunctuation(c));
				return null;
			}

			stateIndex = parseInt(startIndex);
			
			currentState = this.getState(stateIndex);
			
			while (! (currentState instanceof FinalState) ) {
				
			  stateIndex = currentState.getNextState(this.fval_buff);
			  currentState = this.getState(stateIndex);
			}
			
			currentState.append(phoneList);
		  }
		  
		  return phoneList;
		},
		
		getState : function(i) {

			if (is(i,N)) {
				
				var state = null;
				
				// WORKING HERE: this check should fail :: see java
				if (is(this.stateMachine[i],S)) {
					
				  state = this.getState(this.stateMachine[i]);
				  if (LetterToSound.tokenizeOnLookup)
					  this.stateMachine[i] = state;
				} 
				else
				  state = this.stateMachine[i];
		 
				return state;
			}
			else {
				
				var tokenizer = new StringTokenizer(i, " ");
				return this.getState(tokenizer.nextToken(), tokenizer);
			}
		}   
	}
	
	/////////////////////////////////////////////////////////////////////////
	// DecisionState
	/////////////////////////////////////////////////////////////////////////
	
	var DecisionState = makeClass();
	
	DecisionState.TYPE = 1;
	
	DecisionState.prototype = {
	
		/*
		 * Class constructor.
		 * 
		 * @param index
		 *          the index into a string for comparison to c
		 * @param c
		 *          the character to match in a string at index
		 * @param qtrue
		 *          the state to go to in the state machine on a match
		 * @param qfalse
		 *          the state to go to in the state machine on no match
		 */
		init : function(index, c, qtrue, qfalse) {
			
			this.c = c;
			this.index = index;
			this.qtrue = qtrue;
			this.qfalse = qfalse;
		},
		
		type : function() {
			
			return "DecisionState";
		},
	
		/*
		 * Gets the next state to go to based upon the given character sequence.
		 * 
		 * @param chars the characters for comparison
		 * 
		 * @returns an index into the state machine.
		 */
		//public var getNextState(char[] chars)
		getNextState : function(chars) {
			
		  return (chars[this.index] == this.c) ? this.qtrue : this.qfalse;
		},
	
		/*
		 * Outputs this <code>State</code> as though it came from the text input
		 * file. 
		 */
		toString : function() {
		  return this.STATE + " " + this.index + " " + this.c + " " + this.qtrue + " " + this.qfalse;
		}, 

	
		/*
		 * Compares this state to another state for debugging purposes.
		 */
		compare : function(other) {
			
		  if (other instanceof DecisionState)
		  {
			var otherState = other;
			return index == otherState.index && c == otherState.c
				&& qtrue == otherState.qtrue && qfalse == otherState.qfalse;
		  }
		  return false;
		}
		
	}// end DecisionState
	
	// ///////////////////////////////////////////////////////////////////////
	// FinalState
	// ///////////////////////////////////////////////////////////////////////
	
	var FinalState = makeClass();
	
	FinalState.TYPE = 2;
	
	FinalState.prototype = {
		
		/*
		 * Constructor: the string "epsilon" is used to indicate an empty list.
		 */
		init : function(phones) {
			
			this.phoneList = [];
			
			if (phones===("epsilon"))
			{
				this.phoneList = null;
			} 
			else if (is(phones,A)) {
				
				this.phoneList = phones;
			}
			else
			{
			  var i = phones.indexOf('-');
			  if (i != -1)
			  {
				  this.phoneList[0] = phones.substring(0, i); 
				  this.phoneList[1] = phones.substring(i + 1);
			  } 
			  else
			  {
				  this.phoneList[0] = phones;
			  }
			}
		},
		
		type : function() {
			
			return "FinalState";
		},
	
		/*
		 * Appends the phone list for this state to the given <code>ArrayList</code>.
		 */
		append : function(array) {
			
			if (!this.phoneList) return;
	
			for (var i = 0; i < this.phoneList.length; i++)
				array.push(this.phoneList[i]);
		},
	
		/*
		 * Outputs this <code>State</code> as though it came from the text input
		 * file. The string "epsilon" is used to indicate an empty list.
		 */
		toString : function() {
			
		  if (!this.phoneList)
		  {
			return LetterToSound.PHONE + " epsilon";
		  } 
		  else if (this.phoneList.length == 1)
		  {
			return LetterToSound.PHONE + " " + this.phoneList[0];
		  } 
		  else
		  {
			return LetterToSound.PHONE + " " + this.phoneList[0] + "-" + this.phoneList[1];
		  }
		},
	
		/*
		 * Compares this state to another state for debugging purposes.
		 * 
		 * @param other
		 *          the other state to compare against
		 */
		compare : function(other)
		{
		  if (other instanceof FinalState)
		  {
			var otherState = other;
			if (!phoneList)
			{
			  return (otherState.phoneList == null);
			} 
			else
			{
			  for (var i = 0; i < phoneList.length; i++)
			  {
				if (!phoneList[i].equals(otherState.phoneList[i]))
				{
				  return false;
				}
			  }
			  return true;
			}
		  }
		  return false;
		}
	}
	
	/////////////////////////////////////////////////////////////////////////
	//StringTokenizer
	/////////////////////////////////////////////////////////////////////////
	
	var StringTokenizer = makeClass();  
	
	StringTokenizer.prototype = {
	
		init : function(str, delim) {
			
			this.idx = 0;
			this.text = str;
			this.delim = delim || " ";
			this.tokens = str.split(delim);
		},
		
		nextToken : function() {
			
			return (this.idx < this.tokens.length) ? this.tokens[this.idx++] : null;
		}
	}
	
	////////////////////////// PRIVATE CLASSES ///////////////////////////////

	// ///////////////////////////////////////////////////////////////////////
	// RiText_Node Renderer (for headless operation, eg. in Node.js)
	// ///////////////////////////////////////////////////////////////////////

	var RiText_Node = makeClass();

	RiText_Node.prototype = {  // TODO: get rid of all no-op methods...

		init : function(metrics) {
			
			this.font = metrics;
		},
		
		_size : function() {
			
			return this.font.size;
		},
		
		_getGraphics : function() {
			
			warn("NodeRenderer._getGraphics() returning null graphics context!");
			return null;
		},
		
		_pushState : function() {
			// no-op
			return this;
		},
		
		_popState : function() {
			// no-op
			return this;
		},

		_textAlign : function(align) {
			// no-op
			return this;
		},
		
		_scale : function(sx, sy) {
			//warn("scale("+sx+","+sy+") not yet implemented");
		},
		
		_translate : function(tx, ty) {
			//warn("translate("+tx+","+ty+") not yet implemented");
		},
		
		_rotate : function(zRot) {
			//warn("rotate() not yet implemented");
		},
		
		_text : function(str, x, y) {
			// no-op
		},
		
		_fill : function(r,g,b,a) {
			// no-op			
		},
		
		_stroke : function(r,g,b,a) {
			// no-op			
		},
		
		_noFill : function() {
			// no-op
		},
		
		_strokeWeight : function() {
			// no-op
		},
		
		_background : function(r,g,b,a) {
			// no-op			
		},

		// actual creation: only called from RiText.createDefaultFont();!
		_createFont : function(fontName, fontSize) {

			return this.font;
		},

		_rect : function(x,y,w,h) {
			// no-op
		},
		
		_textFont : function(fontObj) {
			// TODO: apply one of the (cached?) fonts?
			this.font = fontObj;
		},
		
		_textWidth : function(fontObj, str) {
		
			var w = 0;
			var def = this.font.widths["i"];
			if (str && str.length) {
				for (var i = 0; i < str.length; i++)  {
					var c = str.charAt(i);
					if (c == '\n' || c == '\r') continue;
					var k = this.font.widths[c];
					if (!k) {
					  warn("No glyph for \""+c+"\"in word: "+str);
					  k = def;
					}
					w += k;
				}
			}
			return w;
		},
		
		_textHeight : function(rt) {
			
			return this._textAscent() + this._textDescent();
		},
		
		_textAscent : function(rt,ignoreContext) {
			
			return this.font.ascent;
		},
		
		_textDescent : function(rt) {
			
			return this.font.descent;
		},

		// TODO: what about scale/rotate?
		_getBoundingBox : function(rt) {
			
			// bc of no translate(), we use the actual x,y
			return { x: rt.x, y: rt.y-this._textAscent()-1, 
				width: this._textWidth(), height: this._textHeight()+1 };
		},
		
		_type : function() {
			
			return "Node";
		},
			
		toString : function() {
			
			return "RiText_"+this._type();
		}
	}


	
	// ////////////////////////////////////////////////////////////
	// Timer
	// ////////////////////////////////////////////////////////////
	
	var timers = new Object(); // static

	// Timer - modified from Resig's JQuery-Timer
	var Timer = function(func, time, autostart) {
			
		this.timerImpl = isNode() ? require("timers") : window;
		
		this.set = function(func, time, autostart) {
			
			this.init = true;
			if (typeof func == 'function') this.action = func;
			if (!isNaN(time)) this.intervalTime = time;
			if (autostart && !this.isActive) {
				this.isActive = true;
				this.setTimer();
			}
			return this;
		};
		
		this.once = function(time) {
			
			var timer = this;
			if (isNaN(time)) time = 0;
			this.timerImpl.setTimeout(function() { timer.action(); }, time);
			return this;
		};
		
		this.play = function(reset) {
			
			if (!this.isActive) {
				if (reset) this.setTimer();
				else this.setTimer(this.remaining);
				this.isActive = true;
			}
			return this;
		};
		
		this.pause = function() {
			
			if (this.isActive) {
				this.isActive = false;
				this.remaining -= new Date() - this.last;
				this.clearTimer();
			}
			return this;
		};
		
		this.stop = function() {
			
			this.isActive = false;
			this.remaining = this.intervalTime;
			this.clearTimer();
			return this;
		};
		
		this.toggle = function(reset) {
			
			if (this.isActive) this.pause();
			else if (reset) this.play(true);
			else this.play();
			return this;
		};
		
		this.reset = function() {
			
			this.isActive = false;
			this.play(true);
			return this;
		};
		
		this.id = function() {
			return this.timeoutObject;
		};
			
		this.clearTimer = function() { // private
			
			this.timerImpl.clearTimeout(this.timeoutObject);
		};
		
		this.setTimer = function(time) {
			
			var timer = this;
			if (typeof this.action != 'function') return;
			if (isNaN(time)) time = this.intervalTime;
			this.remaining = time;
			this.last = new Date();
			this.clearTimer();
			this.timeoutObject = this.timerImpl.setTimeout
				(function() { timer.go(); }, time);
		};
		
		this.go = function() {
			if (this.isActive) {
				this.action();
				this.setTimer();
			}
		};
		
		return (this.init) ? new Timer(func, time, autostart) :
			this.set(func, time, autostart);
	};
		
	// ////////////////////////////////////////////////////////////
	// TextNode
	// ////////////////////////////////////////////////////////////
	
	var TextNode = makeClass();

	TextNode.prototype = {

		init : function(parent, token) {
			
			this.count = 0;
			this.children = {};
			this.parent = parent;
			this.token = token;
		},
		
		pathFromRoot : function(result) {       
		    var mn = this;
		    while (true) {
		      if (mn.isRoot()) break;
		      result.push(mn.token);      
		      mn = mn.parent;          
		    }   
		},
				
		selectChild : function(regex, probabalisticSelect) {
			
			var ps = probabalisticSelect || true;
			return this.children ? this._select(this.childNodes(regex), ps) : null;
		},
		
		_select : function (arr, probabalisticSelect) {
			
			if (!arr) throw TypeError("bad arg to '_select()'");
			
			probabalisticSelect = probabalisticSelect || false;
			
			return (probabalisticSelect ? this._probabalisticSelect(arr) 
				: arr[Math.floor((Math.random()*arr.length))]);    
		},
		
		_probabalisticSelect : function(arr)  {    
			
			if (!arr) throw TypeError("bad arg to '_probabalisticSelect()'");
			
			//log("RiTa.probabalisticSelect("+c+", size="+c.size()+")");
			if (!arr.length) return null;
			if (arr.length == 1) return arr[0];

			// select from multiple options based on frequency
			var pTotal = 0, selector = Math.random();
			for ( var i = 0; i < arr.length; i++) {
				
				pTotal += arr[i].probability();
				if (selector < pTotal)
					return arr[i];
			}
			err("Invalid State in RiTa.probabalisticSelect()");   
		},

		addChild : function(newToken, initialCount) {

		  initialCount = initialCount || 1;

		  var key = this._key(newToken), node = this.children[key];

		  //  add first instance of this token 
		  if (!node) {
		  	
			node = new TextNode(this, newToken);
			node.count = initialCount;
			this.children[key] = node;   
		  }
		  else {      
		  	   
			node.count++;
		  }
		  
		  return node;
		},
		
		asTree : function(sort) {
			
		  var s = this.token+" ";
		  if (!this.isRoot()) 
			s+= "("+this.count+")->"; 
		  s += "{";
		  if (!this.isLeaf())
			return this.childrenToString(this, s, 1, sort);
		  return s + "}";
		},
		
		isRoot : function() {
			
			return !this.parent;
		},
		
		isLeaf : function() {
			
			return this.childCount() == 0;
		},
		
		probability : function() {
			
			//log('probability: '+ this.count+'/'+this.siblingCount());
			return this.count/this.siblingCount();
		},
		

		childNodes : function(regex) {
			
			if (!this.children) return EA;
			
			regex = is(regex,S) ? new RegExp(regex) : regex;
			
			var res = [];
			for (var k in this.children)  {
				var nd = this.children[k];
				if (!regex || (nd && nd.token && nd.token.search(regex)>-1)) {
					res.push(nd);
				}
			}
			
			return res;
		},        
		
		siblingCount : function() {
			
		  if (this.isRoot()) err("Illegal siblingCount on ROOT!");
		  
		  if (!this.parent) err("Null parent for: "+this.token);
		  
		  return this.parent.childCount();
		},

		uniqueCount : function() {
		
			var sum = 0;
			for (var k in this.children) sum++;
			return sum;
		},
		
		childCount : function() {
			
			//return this.childNodes().length;
			
			if (!this.children) return 0;
			
			var sum = 0;
			for (var k in this.children) {
				if (k && this.children[k])
					sum += this.children[k].count;
			}
			
			return sum;
		},        
		
		/*
		 * takes node or string, returns node
		 */
		lookup : function(obj) {   
			
		  if (!obj) return null;
		  
		  obj = (typeof obj != S && obj.token) ? obj.token : obj;
		  
		  var key = this._key(obj);
		  
		  //log(this.token+".lookup("+this._key(obj)+") :: "+this.children[key]);
		  
		  return obj ? this.children[key] : null; 
		},
		
	
		_key : function(str) {

			return str;//(str && TextNode.ignoreCase) ? str.toLowerCase() : str;
		},

		childrenToString : function(textNode, str, depth, sort)  {

		  var mn = textNode, l = [], node = null, indent = "\n";
		  
		  sort = sort || false;
		  
		  for (var k in textNode.children) {
			  l.push(textNode.children[k]);
		  }
		  
		  if (!l.length) return str;
		  
		  if (sort) l.sort();
					
		  for (var j = 0; j < depth; j++) 
			indent += "  ";
		  
		  for (var i = 0; i < l.length; i++) {
			  
			node = l[i];
			
			if (!node) break;
			
			var tok = node.token;      
			if (tok) {         
			  (tok == "\n") && (tok = "\\n");
			  (tok == "\r") && (tok = "\\r");
			  (tok == "\t") && (tok = "\\t");
			  (tok == "\r\n") && (tok = "\\r\\n");
			}
			
			str += indent +"'"+tok+"'";
			
			if (!node.count) 
			  err("ILLEGAL FREQ: "+node.count+" -> "+mn.token+","+node.token);
			
			if (!node.isRoot())
			  str += " ["+node.count + ",p=" +//formatter.format
				(node.probability().toFixed(3)) + "]->{"; 
			
			if (node.children)
			  str = this.childrenToString(node, str, depth+1, sort);  
			else 
				str += "}";
		  }
		  
		  indent = "\n";
		  for (var j = 0; j < depth-1; j++) 
			indent += "  ";
		  
		  return str + indent + "}";
		},
		
		toString : function() {
			return '[ '+this.token+" ("+this.count+'/'+this.probability().toFixed(3)+'%)]';
		} 
	}

	// ////////////////////////////////////////////////////////////
	// Conjugator
	// ////////////////////////////////////////////////////////////
	
	var Conjugator = makeClass();
	
	Conjugator.prototype = {

		init : function() {
			
			// TODO: get rid of these and make static method ?
			
			this.perfect = this.progressive = this.passive = this.interrogative = false;
			this.tense = RiTa.PRESENT_TENSE;
			this.person = RiTa.FIRST_PERSON;
			this.number = RiTa.SINGULAR;
			this.form = RiTa.NORMAL;
			this.head = E;

		},

		// Conjugates the verb based on the current state of the conjugator.
		// !@# Removed (did not translate) incomplete/non-working java
		// implementation of modals handling.
		// !@# TODO: add handling of past tense modals.
		conjugate : function(verb, args) {

			var s = E, actualModal = null, conjs = [], frontVG = verb, verbForm;
			
			if (!verb || !verb.length) return E;
			
			if (!args) return verb;

			// ------------------ handle arguments ------------------
			
			args.number && (this.number = args.number);
			args.person && (this.person = args.person);
			args.tense && (this.tense = args.tense);
			args.form && (this.form = args.form);
			args.passive && (this.passive = args.passive);
			args.progressive && (this.progressive = args.progressive);
			args.interrogative && (this.interrogative = args.interrogative);
			args.perfect && (this.perfect = args.perfect);
			
			// ----------------------- start ---------------------------
			if (this.form == RiTa.INFINITIVE) {
				actualModal = "to";
			}

			if (this.tense == RiTa.FUTURE_TENSE) {
				actualModal = "will";
			}

			if (this.passive) {
				conjs.push(this.getPastParticiple(frontVG));
				frontVG = "be"; 
			}

			if (this.progressive) {
				conjs.push(this.getPresentParticiple(frontVG));
				frontVG = "be"; 
			}

			if (this.perfect) {
				conjs.push(this.getPastParticiple(frontVG));
				frontVG = "have";
			}

			if (actualModal) {
				// log("push: "+frontVG);
				conjs.push(frontVG);
				frontVG = null;
			}

			// Now inflect frontVG (if it exists) and push it on restVG
			if (frontVG) {

				if (this.form === RiTa.GERUND) { // gerund - use ING form
					
					var pp = this.getPresentParticiple(frontVG);

					// !@# not yet implemented! ??? WHAT?
					conjs.push(pp);
					
				}
				else if (this.interrogative && !(verb == "be") && conjs.length < 1) {

					conjs.push(frontVG);
					
				}
				else {

					verbForm = this.getVerbForm(frontVG, this.tense, this.person, this.number);
					conjs.push(verbForm);
				}
			}

			// add modal, and we're done
			actualModal && conjs.push(actualModal);

			var s = E;
			for ( var i = 0; i < conjs.length; i++) {
				
				s = conjs[i] + " " + s;
			}

			// !@# test this
			endsWith(s, "peted") && err("Unexpected output: " + this.toString());

			return trim(s);
		},

		checkRules : function(ruleSet, verb) {

			var res, name = ruleSet.name, rules = ruleSet.rules, defRule = ruleSet.defaultRule || null;

			//TODO: remove comments            
			//log(ruleSet.name+' -> '+ruleSet.doubling);
			
			if (!rules) err("no rule: "+ruleSet.name+' of '+verb);
			
			if (inArray(MODALS, verb)) return verb;

			for ( var i = 0; i < rules.length; i++) {

				//log("checkRules2("+name+").fire("+i+")="+rules[i].regex);
				if (rules[i].applies(verb)) {

					var got = rules[i].fire(verb);

				//log("HIT("+name+").fire("+i+")="+rules[i].regex+"_returns: "+got);
					return got;
				}
			}
			//log("NO HIT!");

			if (ruleSet.doubling && inArray(VERB_CONS_DOUBLING, verb)) {

			//log("doDoubling!");
				verb = this.doubleFinalConsonant(verb);
			}

			res = defRule.fire(verb);

			//log("checkRules("+name+").returns: "+res);
			
			return res;
		},

		doubleFinalConsonant : function(word) {
			var letter = word.charAt(word.length - 1);
			return word + letter;
		},

		getPast : function(verb, pers, numb) {

			if (verb.toLowerCase() == "be") {

				switch (numb) {

				case RiTa.SINGULAR:

					switch (pers) {

					case RiTa.FIRST_PERSON:
						break;

					case RiTa.THIRD_PERSON:
						return "was";

					case RiTa.SECOND_PERSON:
						return "were";

					}
					break;

				case RiTa.PLURAL:

					return "were";
				}
			}

			var got = this.checkRules(PAST_TENSE_RULESET, verb);

			return got;
		},

		getPresent : function(verb, person, number) {

			person = person || this.person;
			number = number || this.number;

			if ((person == RiTa.THIRD_PERSON) && (number == RiTa.SINGULAR)) {

				return this.checkRules(PRESENT_TENSE_RULESET, verb);
			} 
			else if (verb == "be") {

				if (number == RiTa.SINGULAR) {

					switch (person) {

					case RiTa.FIRST_PERSON:
						return "am";

					case RiTa.SECOND_PERSON:
						return "are";

					case RiTa.THIRD_PERSON:
						return "is";

						// default: ???
					}

				} else {
					return "are";
				}
			}
			return verb;
		},

		getPresentParticiple : function(verb) {
			
			return strOk(verb) ? this.checkRules(PRESENT_PARTICIPLE_RULESET, verb) : E;
		},

		getPastParticiple : function(verb) {
			
			var res = strOk(verb) ? this.checkRules(PAST_PARTICIPLE_RULESET, verb) : E;
			return res;
		},

		getVerbForm : function(verb, tense, person, number) {

			switch (tense) {

			case RiTa.PRESENT_TENSE:
				return this.getPresent(verb, person, number);

			case RiTa.PAST_TENSE:
				return this.getPast(verb, person, number);

			default:
				return verb;
			}
		},

		getPerson : function() {
			return CONJUGATION_NAMES[this.person];
		},

		// Returns a String representing the current number from one of
		// (singular, plural)
		getNumber : function() {
			return CONJUGATION_NAMES[this.number];
		},

		// Returns a String representing the current tense from one of
		// (past, present, future)
		getTense : function() {
			return CONJUGATION_NAMES[this.tense];
		},

		// Returns the current verb
		getVerb : function() {
			return this.head;
		},

		// Returns whether the conjugation will use passive tense
		isPassive : function() {
			return this.passive;
		},
		// Returns whether the conjugation will use perfect tense
		isPerfect : function() {
			return this.perfect;
		},
		// Returns whether the conjugation will use progressive tense
		isProgressive : function() {
			return this.progressive;
		},

		// Sets the person for the conjugation, from one of the
		// constants: [RiTa.FIRST_PERSON, RiTa.SECOND_PERSON, RiTa.THIRD_PERSON]
		setPerson : function(personConstant) {
			this.person = personConstant;
		},

		// Sets the number for the conjugation, from one of the
		// constants: [RiTa.SINGULAR, RiTa.PLURAL]
		setNumber : function(numberConstant) {
			this.number = numberConstant;
		},

		// Sets the tense for the conjugation, from one of the
		// constants: [RiTa.PAST_TENSE, RiTa.PRESENT_TENSE, RiTa.FUTURE_TENSE]
		setTense : function(tenseConstant) {
			this.tense = tenseConstant;
		},

		// Sets the verb to be conjugated
		setVerb : function(verb) {
			var v = this.head = verb.toLowerCase();
			if (v === "am" || v === "are" || v === "is" || v === "was" || v === "were") {
				this.head = "be";
			}
		},

		// Sets whether the conjugation should use passive tense
		setPassive : function(bool) {
			this.passive = bool;
		},

		// Sets whether the conjugation should use perfect tense
		setPerfect : function(bool) {
			this.perfect = bool;
		},

		// Sets whether the conjugation should use progressive tense
		setProgressive : function(bool) {
			this.progressive = bool;
		},

		toString : function() {
			return "  ---------------------\n" + "  Passive = " + this.isPassive() + "\n"
					+ "  Perfect = " + this.isPerfect() + "\n" + "  Progressive = "
					+ this.isProgressive() + "\n" + "  ---------------------\n" + "  Number = "
					+ this.getNumber() + "\n" + "  Person = " + this.getPerson() + "\n"
					+ "  Tense = " + this.getTense() + "\n" + "  ---------------------\n";
		}

	}

	// ////////////////////////////////////////////////////////////
	// PosTagger  (singleton)
	// ////////////////////////////////////////////////////////////
	var PosTagger = {

		// Penn Pos types ------------------------------ (40+UKNOWN)

		UNKNOWN : [ '???', 'unknown' ],
		N : [ 'n', 'NOUN_KEY' ],
		V : [ 'v', 'VERB_KEY' ],
		R : [ 'r', 'ADVERB_KEY' ],
		A : [ 'a', 'ADJECTIVE_KEY' ],
		CC : [ 'cc', 'Coordinating conjunction' ],
		CD : [ 'cd', 'Cardinal number' ],
		DT : [ 'dt', 'Determiner' ],
		EX : [ 'ex', 'Existential there' ],
		FW : [ 'fw', 'Foreign word' ],
		IN : [ 'in', 'Preposition or subordinating conjunction' ],
		JJ : [ 'jj', 'Adjective' ],
		JJR : [ 'jjr', 'Adjective, comparative' ],
		JJS : [ 'jjs', 'Adjective, superlative' ],
		LS : [ 'ls', 'List item marker' ],
		MD : [ 'md', 'Modal' ],
		NN : [ 'nn', 'Noun, singular or mass' ],
		NNS : [ 'nns', 'Noun, plural' ],
		NNP : [ 'nnp', 'Proper noun, singular' ],
		NNPS : [ 'nnps', 'Proper noun, plural' ],
		PDT : [ 'pdt', 'Predeterminer' ],
		POS : [ 'pos', 'Possessive ending' ],
		PRP : [ 'prp', 'Personal pronoun' ],
		PRP$ : [ 'prp$', 'Possessive pronoun (prolog version PRP-S)' ],
		RB : [ 'rb', 'Adverb' ],
		RBR : [ 'rbr', 'Adverb, comparative' ],
		RBS : [ 'rbs', 'Adverb, superlative' ],
		RP : [ 'rp', 'Particle' ],
		SYM : [ 'sym', 'Symbol' ],
		TO : [ 'to', 'to' ],
		UH : [ 'uh', 'Interjection' ],
		VB : [ 'vb', 'Verb, base form' ],
		VBD : [ 'vbd', 'Verb, past tense' ],
		VBG : [ 'vbg', 'Verb, gerund or present participle' ],
		VBN : [ 'vbn', 'Verb, past participle' ],
		VBP : [ 'vbp', 'Verb, non-3rd person singular present' ],
		VBZ : [ 'vbz', 'Verb, 3rd person singular present' ],
		WDT : [ 'wdt', 'Wh-determiner' ],
		WP : [ 'wp', 'Wh-pronoun' ],
		WP$ : [ 'wp$', 'Possessive wh-pronoun (prolog version WP-S)' ],
		WRB : [ 'wrb', 'Wh-adverb' ],

		TAGS : [ 'cc', 'cd', 'dt', 'ex', 'fw', 'in', 'jj', 
				'jjr', 'jjs', 'ls', 'md', 'nn', 'nns', 'nnp', 
				'nnps', 'pdt', 'pos', 'prp', 'prp$', 'rb', 
				'rbr', 'rbs', 'rp', 'sym', 'to', 
				 'uh', 'vb', 'vbd', 'vbg', 'vbn', 'vbp', 'vbz', 'wdt', 
				 'wp', 'wp$', 'wrb', 'unknown' ],

		NOUNS : [ 'nn', 'nns', 'nnp', 'nnps' ],
		VERBS : [ 'vb', 'vbd', 'vbg', 'vbn', 'vbp', 'vbz' ],
		ADJ : [ 'jj', 'jjr', 'jjs' ],
		ADV : [ 'rb', 'rbr', 'rbs', 'rp' ],

		isVerb : function(tag) {
			
			return inArray(this.VERBS, tag);
		},

		isNoun : function(tag) {
			
			return inArray(this.NOUNS, tag);
		},

		isAdverb : function(tag) {
			return inArray(this.ADV, tag);
		},

		isAdj : function(tag) {
			return inArray(this.ADJ, tag);
		},

		isTag : function(tag) {
			return inArray(this.TAGS, tag);
		},

		hasTag : function(choices, tag) {
			ok(choices,A);
			var choiceStr = choices.join();
			return (choiceStr.indexOf(tag) > -1);
		},
		
		 // Returns an array of parts-of-speech from the Penn tagset, each corresponding to one word of input
		tag : function(words) {
			
			var result = [], choices2d = [], lex = RiLexicon();//._getInstance(); 
			
			words = is(words,A) ?  words : [ words ];
			
			for (var i = 0, l = words.length; i < l; i++) {
	 
				if (!strOk(words[i])) {
					choices2d[i] = [];
					continue;
				}
				
				var data = lex._getPosArr(words[i]);

				if (!data || !data.length) {
					
					if (words[i].length == 1) {
						
						result.push(isNum(words[i].charAt(0)) ? "cd" : words[i]);
					} 
					else {
						
						result.push("nn");
					}
					choices2d[i] = [];  // TODO: OK?
				} 
				else {
					result.push(data[0]);
					choices2d[i] = data;
				}
			}

			// Adjust pos according to transformation rules
			return this._applyContext(words, result, choices2d);	
		},

		
		// Applies a customized subset of the Brill transformations
		_applyContext : function(words, result, choices) {
			
			//log("_applyContext("+words+","+result+","+choices+")");

			// Shortcuts for brevity/readability
			var sW = startsWith, eW = endsWith, PRINT_CUSTOM_TAGS = (0 && !RiTa.SILENT);

			// Apply transformations
			for (var i = 0, l = words.length; i < l; i++) {

				// transform 1: DT, {VBD | VBP | VB} --> DT, NN
				if (i > 0 && (result[i - 1] == "dt")) {
					if (sW(result[i], "vb")) {
						if (PRINT_CUSTOM_TAGS) {
							log("PosTagger: changing verb to noun: " + words[i]);
						}
						result[i] = "nn";
					}

					// transform 1: DT, {RB | RBR | RBS} --> DT, {JJ |
					// JJR | JJS}
					else if (sW(result[i], "rb")) {
						if (PRINT_CUSTOM_TAGS) 
							log("PosTagger: custom tagged '"+words[i]+"', "+ result[i]);
						result[i] = (result[i].length > 2) ? "jj" + result[i].charAt(2) : "jj";
						if (PRINT_CUSTOM_TAGS) {
							log(" -> " + result[i]);
						}
					}
				}

				// transform 2: convert a noun to a number (cd) if it is
				// all digits and/or a decimal "."
				if (sW(result[i], "n") && choices[i] == null) {
					if (isNum(words[i])) {
						result[i] = "cd";
					} // mods: dch (add choice check above) <---- ? >
				}

				// transform 3: convert a noun to a past participle if
				// words[i] ends with "ed"
				if (sW(result[i], "n") && eW(words[i], "ed")) {
					result[i] = "vbn";
				}

				// transform 4: convert any type to adverb if it ends in "ly";
				if (eW(words[i], "ly")) {
					result[i] = "rb";
				}

				// transform 5: convert a common noun (NN or NNS) to a
				// adjective if it ends with "al", special-case for mammal
				if (sW(result[i], "nn") && eW(words[i], "al") && words[i] != 'mammal') {
					result[i] = "jj";
				}

				// transform 6: convert a noun to a verb if the
				// preceeding word is "would"
				if (i > 0 && sW(result[i], "nn") && equalsIgnoreCase(words[i - 1], "would")) {
					result[i] = "vb";
				}

				// transform 7: if a word has been categorized as a
				// common noun and it ends with "s", then set its type to plural common noun (NNS)
				if ((result[i] == "nn") && words[i].match(/^.*[^s]s$/)) {
					if (!NULL_PLURALS.applies(words[i])) 
						result[i] = "nns";
				}

				// transform 8: convert a common noun to a present
				// participle verb (i.e., a gerund)
				if (sW(result[i], "nn") && eW(words[i], "ing")) {
					// DH: fixed here -- add check on choices for any verb: eg. // 'morning'
					if (this.hasTag(choices[i], "vb")) {
						result[i] = "vbg";
					} else if (PRINT_CUSTOM_TAGS) {
						log("[RiTa] PosTagger tagged '" + words[i] + "' as " + result[i]);
					}
				}
				
				// transform 9(dch): convert plural nouns (which are also 3sg-verbs) to 
      			// 3sg-verbs when following a singular noun (the dog dances, Dave dances, he dances) 
				if (i>0 && result[i] == "nns" && this.hasTag(choices[i], "vbz") && result[i-1].match(/^(nn|prp|nnp)$/)) {
					result[i] = "vbz";
				}

				// transform 10(dch): convert common nouns to proper
				// nouns when they start w' a capital and (?are not a
				// sentence start?)
				if (/*i > 0 && */sW(result[i], "nn") && (words[i].charAt(0) == words[i].charAt(0).toUpperCase())) 
				{
					result[i] = eW(result[i], "s") ? "nnps" : "nnp";
				}

				// DISABLED: transform 10(dch): convert plural nouns (which are
				// also 3sg-verbs) to 3sg-verbs when followed by adverb
				/*if (i < result.length - 1 && result[i] == "nns" && sW(result[i + 1], "rb")
						&& this.hasTag(choices[i], "vbz")) {
					result[i] = "vbz";
				}*/
			}
		 
			return result;
		}

	}// end PosTagger

	var Stemmer = {};
	
	// Stemming demo/comparison - http://text-processing.com/demo/stem/
	
	/*  
	 *  Porter stemmer in Javascript: from https://github.com/kristopolous/Porter-Stemmer
	 *  Ported from Porter, 1980, An algorithm for suffix stripping, Program, Vol. 14,
	 *  no. 3, pp 130-137, see also http:www.tartarus.org/~martin/PorterStemmer
	 */
	Stemmer.stem_Porter = (function() {
		
		var step2list = {
				'ational' : 'ate',
				'tional' : 'tion',
				'enci' : 'ence',
				'anci' : 'ance',
				'izer' : 'ize',
				'bli' : 'ble',
				'alli' : 'al',
				'entli' : 'ent',
				'eli' : 'e',
				'ousli' : 'ous',
				'ization' : 'ize',
				'ation' : 'ate',
				'ator' : 'ate',
				'alism' : 'al',
				'iveness' : 'ive',
				'fulness' : 'ful',
				'ousness' : 'ous',
				'aliti' : 'al',
				'iviti' : 'ive',
				'biliti' : 'ble',
				'logi' : 'log'
			},
	
			step3list = {
				'icate' : 'ic',
				'ative' : '',
				'alize' : 'al',
				'iciti' : 'ic',
				'ical' : 'ic',
				'ful' : '',
				'ness' : ''
			},
	
			c = '[^aeiou]',          // consonant
			v = '[aeiouy]',          // vowel
			C = c + '[^aeiouy]*',    // consonant sequence
			V = v + '[aeiou]*',      // vowel sequence
	
			mgr0 = '^(' + C + ')?' + V + C,                      // [C]VC... is m>0
			meq1 = '^(' + C + ')?' + V + C + '(' + V + ')?$',  // [C]VC[V] is m=1
			mgr1 = '^(' + C + ')?' + V + C + V + C,         // [C]VCVC... is m>1
			s_v = '^(' + C + ')?' + v;                   // vowel in stem
	
		return function (w) {
			var stem, suffix, firstch, re, re2, re3, re4, origword = w;
	
			if (w.length < 3) { return w; }
	
			firstch = w.substr(0,1);
			if (firstch == "y") {
				w = firstch + w.substr(1);
			}
	
			// Step 1a
			re = /^(.+?)(ss|i)es$/;
			re2 = /^(.+?)([^s])s$/;
	
			if (re.test(w)) { w = w.replace(re,"$1$2"); }
			else if (re2.test(w)) { w = w.replace(re2,"$1$2"); }
	
			// Step 1b
			re = /^(.+?)eed$/;
			re2 = /^(.+?)(ed|ing)$/;
			if (re.test(w)) {
				var fp = re.exec(w);
				re = new RegExp(mgr0);
				if (re.test(fp[1])) {
					re = /.$/;
					w = w.replace(re,E);
				}
			} else if (re2.test(w)) {
				var fp = re2.exec(w);
				stem = fp[1];
				re2 = new RegExp(s_v);
				if (re2.test(stem)) {
					w = stem;
					re2 = /(at|bl|iz)$/;
					re3 = new RegExp("([^aeiouylsz])\\1$");
					re4 = new RegExp("^" + C + v + "[^aeiouwxy]$");
					if (re2.test(w)) { w = w + "e"; }
					else if (re3.test(w)) { re = /.$/; w = w.replace(re,E); }
					else if (re4.test(w)) { w = w + "e"; }
				}
			}
	
			// Step 1c
			re = /^(.+?)y$/;
			if (re.test(w)) {
				var fp = re.exec(w);
				stem = fp[1];
				re = new RegExp(s_v);
				if (re.test(stem)) w = stem + "i";
			}
	
			// Step 2
			re = /^(.+?)(ational|tional|enci|anci|izer|bli|alli|entli|eli|ousli|ization|ation|ator|alism|iveness|fulness|ousness|aliti|iviti|biliti|logi)$/;
			if (re.test(w)) {
				var fp = re.exec(w);
				stem = fp[1];
				suffix = fp[2];
				re = new RegExp(mgr0);
				if (re.test(stem)) {
					w = stem + step2list[suffix];
				}
			}
	
			// Step 3
			re = /^(.+?)(icate|ative|alize|iciti|ical|ful|ness)$/;
			if (re.test(w)) {
				var fp = re.exec(w);
				stem = fp[1];
				suffix = fp[2];
				re = new RegExp(mgr0);
				if (re.test(stem)) {
					w = stem + step3list[suffix];
				}
			}
	
			// Step 4
			re = /^(.+?)(al|ance|ence|er|ic|able|ible|ant|ement|ment|ent|ou|ism|ate|iti|ous|ive|ize)$/;
			re2 = /^(.+?)(s|t)(ion)$/;
			if (re.test(w)) {
				var fp = re.exec(w);
				stem = fp[1];
				re = new RegExp(mgr1);
				if (re.test(stem)) {
					w = stem;
				}
			} else if (re2.test(w)) {
				var fp = re2.exec(w);
				stem = fp[1] + fp[2];
				re2 = new RegExp(mgr1);
				if (re2.test(stem)) {
					w = stem;
				}
			}
	
			// Step 5
			re = /^(.+?)e$/;
			if (re.test(w)) {
				var fp = re.exec(w);
				stem = fp[1];
				re = new RegExp(mgr1);
				re2 = new RegExp(meq1);
				re3 = new RegExp("^" + C + v + "[^aeiouwxy]$");
				if (re.test(stem) || (re2.test(stem) && !(re3.test(stem)))) {
					w = stem;
				}
			}
	
			re = /ll$/;
			re2 = new RegExp(mgr1);
			if (re.test(w) && re2.test(w)) {
				re = /.$/;
				w = w.replace(re,E);
			}
	
			// and turn initial Y back to y
	
			(firstch == "y") && (w = firstch.toLowerCase() + w.substr(1));
				
			return w;
		}
	})();

	Stemmer.stem_Lancaster = (function() {
		
		function accept(token) {
			
			return (token.match(/^[aeiou]/)) ?
				(token.length > 1) : (token.length > 2 && token.match(/[aeiouy]/));
		}
		
		// take a token, look up the applicable rule and do the stem
		function applyRules(token, intact) {

			var section = token.substr(-1), rules = ruleTable[section], input = token;
	
			if (rules) {
				
				for (var i = 0; i < rules.length; i++) {
					
				 // only apply intact rules to intact tokens
					if ((intact || !rules[i].intact) && token.substr(0 - rules[i].pattern.length) == rules[i].pattern) {
						
						// hack off only as much as the rule indicates
						var result = token.substr(0, token.length - rules[i].size);
	
						// if the rules wants us to apply an appendage do so
						if (rules[i].appendage) {
							result += rules[i].appendage;
						}
	
						if (accept(result)) {
							
							token = result;
	
							// see what the rules wants to do next
							if (rules[i].continuation) {
								
								// this rule thinks there still might be stem left. keep at it.
								// since we've applied a change we'll pass false in for intact
								return applyRules(result, false);
								
							} else {
								
								// the rule thinks we're done stemming. drop out.
								return result;
							}
						}
					}
				}
			}
			// else // warn('No stemming rules (LancasterImpl) found for: '+input);
	
			return token;
		}
	
		var ruleTable = { // indexed by last character of word
			
			"a": [
				{
					"continuation": false, 
					"intact": true, 
					"pattern": "ia", 
					"size": "2"
				}, 
				{
					"continuation": false, 
					"intact": true, 
					"pattern": "a", 
					"size": "1"
				}
			], 
			"b": [
				{
					"continuation": false, 
					"intact": false, 
					"pattern": "bb", 
					"size": "1"
				}
			], 
			"c": [
				{
					"appendage": "s", 
					"continuation": false, 
					"intact": false, 
					"pattern": "ytic", 
					"size": "3"
				}, 
				{
					"continuation": true, 
					"intact": false, 
					"pattern": "ic", 
					"size": "2"
			   }, 
				{
					"appendage": "t", 
					"continuation": true, 
					"intact": false, 
					"pattern": "nc", 
					"size": "1"
				}
			], 
			"d": [
				{
					"continuation": false, 
					"intact": false, 
					"pattern": "dd", 
					"size": "1"
				}, 
				{
					"appendage": "y", 
					"continuation": true, 
					"intact": false, 
					"pattern": "ied", 
					"size": "3"
				}, 
				{
					"appendage": "s", 
					"continuation": false, 
					"intact": false, 
					"pattern": "ceed", 
					"size": "2"
				}, 
				{
					"continuation": false, 
					"intact": false, 
					"pattern": "eed", 
					"size": "1"
				}, 
				{
					"continuation": true, 
					"intact": false, 
					"pattern": "ed", 
					"size": "2"
				}, 
				{
					"continuation": true, 
					"intact": false, 
					"pattern": "hood", 
					"size": "4"
				}
			], 
			"e": [
				{
					"continuation": true, 
					"intact": false, 
					"pattern": "e", 
					"size": "1"
				}
			], 
			"f": [
				{
					"appendage": "v", 
					"continuation": false, 
					"intact": false, 
					"pattern": "lief", 
					"size": "1"
				}, 
				{
					"continuation": true, 
					"intact": false, 
					"pattern": "if", 
					"size": "2"
				}
			], 
			"g": [
				{
					"continuation": true, 
					"intact": false, 
					"pattern": "ing", 
					"size": "3"
				}, 
				{
					"appendage": "y", 
					"continuation": false, 
					"intact": false, 
					"pattern": "iag", 
					"size": "3"
				}, 
				{
					"continuation": true, 
					"intact": false, 
					"pattern": "ag", 
					"size": "2"
				}, 
				{
					"continuation": false, 
					"intact": false, 
					"pattern": "gg", 
					"size": "1"
				}
			], 
			"h": [
				{
					"continuation": false, 
					"intact": true, 
					"pattern": "th", 
					"size": "2"
				}, 
				{
					"appendage": "c", 
					"continuation": false, 
					"intact": false, 
					"pattern": "guish", 
					"size": "5"
				}, 
				{
					"continuation": true, 
					"intact": false, 
					"pattern": "ish", 
					"size": "3"
				}
			], 
			"i": [
				{
					"continuation": false, 
					"intact": true, 
					"pattern": "i", 
					"size": "1"
				}, 
				{
					"appendage": "y", 
					"continuation": true, 
					"intact": false, 
					"pattern": "i", 
					"size": "1"
				}
			], 
			"j": [
				{
					"appendage": "d", 
					"continuation": false, 
					"intact": false, 
					"pattern": "ij", 
					"size": "1"
				}, 
				{
					"appendage": "s", 
					"continuation": false, 
					"intact": false, 
					"pattern": "fuj", 
					"size": "1"
				}, 
				{
					"appendage": "d", 
					"continuation": false, 
					"intact": false, 
					"pattern": "uj", 
					"size": "1"
				}, 
				{
					"appendage": "d", 
					"continuation": false, 
					"intact": false, 
					"pattern": "oj", 
					"size": "1"
				}, 
				{
					"appendage": "r", 
					"continuation": false, 
					"intact": false, 
					"pattern": "hej", 
					"size": "1"
				}, 
				{
					"appendage": "t", 
					"continuation": false, 
					"intact": false, 
					"pattern": "verj", 
					"size": "1"
				}, 
				{
					"appendage": "t", 
					"continuation": false, 
					"intact": false, 
					"pattern": "misj", 
					"size": "2"
				}, 
				{
					"appendage": "d", 
					"continuation": false, 
					"intact": false, 
					"pattern": "nj", 
					"size": "1"
				}, 
				{
					"appendage": "s", 
					"continuation": false, 
					"intact": false, 
					"pattern": "j", 
					"size": "1"
				}
			], 
			"l": [
				{
					"continuation": false, 
					"intact": false, 
					"pattern": "ifiabl", 
					"size": "6"
				}, 
				{
					"appendage": "y", 
					"continuation": false, 
					"intact": false, 
					"pattern": "iabl", 
					"size": "4"
				}, 
				{
					"continuation": true, 
					"intact": false, 
					"pattern": "abl", 
					"size": "3"
				}, 
				{
					"continuation": false, 
					"intact": false, 
					"pattern": "ibl", 
					"size": "3"
				}, 
				{
					"appendage": "l", 
					"continuation": true, 
					"intact": false, 
					"pattern": "bil", 
					"size": "2"
				}, 
				{
					"continuation": false, 
					"intact": false, 
					"pattern": "cl", 
					"size": "1"
				}, 
				{
					"appendage": "y", 
					"continuation": false, 
					"intact": false, 
					"pattern": "iful", 
					"size": "4"
				}, 
				{
					"continuation": true, 
					"intact": false, 
					"pattern": "ful", 
					"size": "3"
				}, 
				{
					"continuation": false, 
					"intact": false, 
					"pattern": "ul", 
					"size": "2"
				}, 
				{
					"continuation": true, 
					"intact": false, 
					"pattern": "ial", 
					"size": "3"
				}, 
				{
					"continuation": true, 
					"intact": false, 
					"pattern": "ual", 
					"size": "3"
				}, 
				{
					"continuation": true, 
					"intact": false, 
					"pattern": "al", 
					"size": "2"
				}, 
				{
					"continuation": false, 
					"intact": false, 
					"pattern": "ll", 
					"size": "1"
				}
			], 
			"m": [
				{
					"continuation": false, 
					"intact": false, 
					"pattern": "ium", 
					"size": "3"
				}, 
				{
					"continuation": false, 
					"intact": true, 
					"pattern": "um", 
					"size": "2"
				}, 
				{
					"continuation": true, 
					"intact": false, 
					"pattern": "ism", 
					"size": "3"
				}, 
				{
					"continuation": false, 
					"intact": false, 
					"pattern": "mm", 
					"size": "1"
				}
			], 
			"n": [
				{
					"appendage": "j", 
					"continuation": true, 
					"intact": false, 
					"pattern": "sion", 
					"size": "4"
				}, 
				{
					"appendage": "c", 
					"continuation": false, 
					"intact": false, 
					"pattern": "xion", 
					"size": "4"
				}, 
				{
					"continuation": true, 
					"intact": false, 
					"pattern": "ion", 
					"size": "3"
				}, 
				{
					"continuation": true, 
					"intact": false, 
					"pattern": "ian", 
					"size": "3"
				}, 
				{
					"continuation": true, 
					"intact": false, 
					"pattern": "an", 
					"size": "2"
				}, 
				{
					"continuation": false, 
					"intact": false, 
					"pattern": "een", 
					"size": "0"
				}, 
				{
					"continuation": true, 
					"intact": false, 
					"pattern": "en", 
					"size": "2"
				}, 
				{
					"continuation": false, 
					"intact": false, 
					"pattern": "nn", 
					"size": "1"
				}
			], 
			"p": [
				{
					"continuation": true, 
					"intact": false, 
					"pattern": "ship", 
					"size": "4"
				}, 
				{
					"continuation": false, 
					"intact": false, 
					"pattern": "pp", 
					"size": "1"
				}
			], 
			"r": [
				{
					"continuation": true, 
					"intact": false, 
					"pattern": "er", 
					"size": "2"
				}, 
				{
					"continuation": false, 
					"intact": false, 
					"pattern": "ear", 
					"size": "0"
				}, 
				{
					"continuation": false, 
					"intact": false, 
					"pattern": "ar", 
					"size": "2"
				}, 
				{
					"continuation": true, 
					"intact": false, 
					"pattern": "or", 
					"size": "2"
				}, 
				{
					"continuation": true, 
					"intact": false, 
					"pattern": "ur", 
					"size": "2"
				}, 
				{
					"continuation": false, 
					"intact": false, 
					"pattern": "rr", 
					"size": "1"
				}, 
				{
					"continuation": true, 
					"intact": false, 
					"pattern": "tr", 
					"size": "1"
				}, 
				{
					"appendage": "y", 
					"continuation": true, 
					"intact": false, 
					"pattern": "ier", 
					"size": "3"
				}
			], 
			"s": [
				{
					"appendage": "y", 
					"continuation": true, 
					"intact": false, 
					"pattern": "ies", 
					"size": "3"
				}, 
				{
					"continuation": false, 
					"intact": false, 
					"pattern": "sis", 
					"size": "2"
				}, 
				{
					"continuation": true, 
					"intact": false, 
					"pattern": "is", 
					"size": "2"
				}, 
				{
					"continuation": true, 
					"intact": false, 
					"pattern": "ness", 
					"size": "4"
				}, 
				{
					"continuation": false, 
					"intact": false, 
					"pattern": "ss", 
					"size": "0"
				}, 
				{
					"continuation": true, 
					"intact": false, 
					"pattern": "ous", 
					"size": "3"
				}, 
				{
					"continuation": false, 
					"intact": true, 
					"pattern": "us", 
					"size": "2"
				}, 
				{
					"continuation": true, 
					"intact": true, 
					"pattern": "s", 
					"size": "1"
				}, 
				{
					"continuation": false, 
					"intact": false, 
					"pattern": "s", 
					"size": "0"
				}
			], 
			"t": [
				{
					"appendage": "y", 
					"continuation": false, 
					"intact": false, 
					"pattern": "plicat", 
					"size": "4"
				}, 
				{
					"continuation": true, 
					"intact": false, 
					"pattern": "at", 
					"size": "2"
				}, 
				{
					"continuation": true, 
					"intact": false, 
					"pattern": "ment", 
					"size": "4"
				}, 
				{
					"continuation": true, 
					"intact": false, 
					"pattern": "ent", 
					"size": "3"
				}, 
				{
					"continuation": true, 
					"intact": false, 
					"pattern": "ant", 
					"size": "3"
				}, 
				{
					"appendage": "b", 
					"continuation": false, 
					"intact": false, 
					"pattern": "ript", 
					"size": "2"
				}, 
				{
					"appendage": "b", 
					"continuation": false, 
					"intact": false, 
					"pattern": "orpt", 
					"size": "2"
				}, 
				{
					"continuation": false, 
					"intact": false, 
					"pattern": "duct", 
					"size": "1"
				}, 
				{
					"continuation": false, 
					"intact": false, 
					"pattern": "sumpt", 
					"size": "2"
				}, 
				{
					"appendage": "i", 
					"continuation": false, 
					"intact": false, 
					"pattern": "cept", 
					"size": "2"
				}, 
				{
					"appendage": "v", 
					"continuation": false, 
					"intact": false, 
					"pattern": "olut", 
					"size": "2"
				}, 
				{
					"continuation": false, 
					"intact": false, 
					"pattern": "sist", 
					"size": "0"
				}, 
				{
					"continuation": true, 
					"intact": false, 
					"pattern": "ist", 
					"size": "3"
				}, 
				{
					"continuation": false, 
					"intact": false, 
					"pattern": "tt", 
					"size": "1"
				}
			], 
			"u": [
				{
					"continuation": false, 
					"intact": false, 
					"pattern": "iqu", 
					"size": "3"
				}, 
				{
					"continuation": false, 
					"intact": false, 
					"pattern": "ogu", 
					"size": "1"
				}
			], 
			"v": [
				{
					"appendage": "j", 
					"continuation": true, 
					"intact": false, 
					"pattern": "siv", 
					"size": "3"
				}, 
				{
					"continuation": false, 
					"intact": false, 
					"pattern": "eiv", 
					"size": "0"
				}, 
				{
					"continuation": true, 
					"intact": false, 
					"pattern": "iv", 
					"size": "2"
				}
			], 
			"y": [
				{
					"continuation": true, 
					"intact": false, 
					"pattern": "bly", 
					"size": "1"
				}, 
				{
					"appendage": "y", 
					"continuation": true, 
					"intact": false, 
					"pattern": "ily", 
					"size": "3"
				}, 
				{
					"continuation": false, 
					"intact": false, 
					"pattern": "ply", 
					"size": "0"
				}, 
				{
					"continuation": true, 
					"intact": false, 
					"pattern": "ly", 
					"size": "2"
				}, 
				{
					"continuation": false, 
					"intact": false, 
					"pattern": "ogy", 
					"size": "1"
				}, 
				{
					"continuation": false, 
					"intact": false, 
					"pattern": "phy", 
					"size": "1"
				}, 
				{
					"continuation": false, 
					"intact": false, 
					"pattern": "omy", 
					"size": "1"
				}, 
				{
					"continuation": false, 
					"intact": false, 
					"pattern": "opy", 
					"size": "1"
				}, 
				{
					"continuation": true, 
					"intact": false, 
					"pattern": "ity", 
					"size": "3"
				}, 
				{
					"continuation": true, 
					"intact": false, 
					"pattern": "ety", 
					"size": "3"
				}, 
				{
					"continuation": false, 
					"intact": false, 
					"pattern": "lty", 
					"size": "2"
				}, 
				{
					"continuation": false, 
					"intact": false, 
					"pattern": "istry", 
					"size": "5"
				}, 
				{
					"continuation": true, 
					"intact": false, 
					"pattern": "ary", 
					"size": "3"
				}, 
				{
					"continuation": true, 
					"intact": false, 
					"pattern": "ory", 
					"size": "3"
				}, 
				{
					"continuation": false, 
					"intact": false, 
					"pattern": "ify", 
					"size": "3"
				}, 
				{
					"appendage": "t", 
					"continuation": true, 
					"intact": false, 
					"pattern": "ncy", 
					"size": "2"
				}, 
				{
					"continuation": true, 
					"intact": false, 
					"pattern": "acy", 
					"size": "3"
				}
			], 
			"z": [
				{
					"continuation": true, 
					"intact": false, 
					"pattern": "iz", 
					"size": "2"
				}, 
				{
					"appendage": "s", 
					"continuation": false, 
					"intact": false, 
					"pattern": "yz", 
					"size": "1"
				}
			]
		};
		
		return function(token) {
			
			return applyRules(token.toLowerCase(), true);
		}
		
	})();
	
	// TODO: remove these eventually
	Array.prototype._arrayContains = function (searchElement ) {
		return Array.prototype.indexOf(searchElement) > -1;
	} 
	
	String.prototype._endsWith = function(suffix) {
		return this.indexOf(suffix, this.length - suffix.length) !== -1;
	};

	/*From the PlingStemmer stemmer implementation included in the Java Tools package (see http://mpii.de/yago-naga/javatools). */
	Stemmer.stem_Pling = (function() {
		
		/* Words that are both singular and plural */
		var categorySP = ["acoustics", "aestetics", "aquatics", "basics", "ceramics", "classics", "cosmetics", "dermatoglyphics", "dialectics", "deer", "dynamics", "esthetics", "ethics", "harmonics", "heroics", "isometrics", "mechanics", "metrics", "statistics", "optic", "people", "physics", "polemics", "propaedeutics", "pyrotechnics", "quadratics", "quarters", "statistics", "tactics", "tropics"];
	
		/* Words that end in "-se" in their plural forms (like "nurse" etc.) */
		var categorySE_SES = ["nurses", "cruises"];
	
		/* Words that do not have a distinct plural form (like "atlas" etc.) */
		var category00 = ["alias", "asbestos", "atlas", "barracks", "bathos", "bias", "breeches", "britches", "canvas", "chaos", "clippers", "contretemps", "corps", "cosmos", "crossroads", "diabetes", "ethos", "gallows", "gas", "graffiti", "headquarters", "herpes", "high-jinks", "innings", "jackanapes", "lens", "means", "measles", "mews", "mumps", "news", "pathos", "pincers", "pliers", "proceedings", "rabies", "rhinoceros", "sassafras", "scissors", "series", "shears", "species", "tuna"];
	
		/* Words that change from "-um" to "-a" (like "curriculum" etc.), listed in their plural forms */
		var categoryUM_A = ["addenda", "agenda", "aquaria", "bacteria", "candelabra", "compendia", "consortia", "crania", "curricula", "data", "desiderata", "dicta", "emporia", "enconia", "errata", "extrema", "gymnasia", "honoraria", "interregna", "lustra", "maxima", "media", "memoranda", "millenia", "minima", "momenta", "optima", "ova", "phyla", "quanta", "rostra", "spectra", "specula", "stadia", "strata", "symposia", "trapezia", "ultimata", "vacua", "vela"];
	
		/* Words that change from "-on" to "-a" (like "phenomenon" etc.), listed in their plural forms */
		var categoryON_A = ["aphelia", "asyndeta", "automata", "criteria", "hyperbata", "noumena", "organa", "perihelia", "phenomena", "prolegomena"];
	
		/* Words that change from "-o" to "-i" (like "libretto" etc.), listed in their plural forms */
		var categoryO_I = ["alti", "bassi", "canti", "contralti", "crescendi", "libretti", "soli", "soprani", "tempi", "virtuosi"];
	
		/*  Words that change from "-us" to "-i" (like "fungus" etc.), listed in their plural forms		 */
		var categoryUS_I = ["alumni", "bacilli", "cacti", "foci", "fungi", "genii", "hippopotami", "incubi", "nimbi", "nuclei", "nucleoli", "octopi", "radii", "stimuli", "styli", "succubi", "syllabi", "termini", "tori", "umbilici", "uteri"];
	
		/* Words that change from "-ix" to "-ices" (like "appendix" etc.), listed in their plural forms */
		var categoryIX_ICES = ["appendices", "cervices"];
	
		/* Words that change from "-is" to "-es" (like "axis" etc.), listed in their plural forms, plus everybody ending in theses */
		var categoryIS_ES = ["analyses", "axes", "bases", "crises", "diagnoses", "ellipses", "em_PHASEs", "neuroses", "oases", "paralyses", "synopses"];
	
		/* Words that change from "-oe" to "-oes" (like "toe" etc.), listed in their plural forms*/
		var categoryOE_OES = ["aloes", "backhoes", "beroes", "canoes", "chigoes", "cohoes", "does", "felloes", "floes", "foes", "gumshoes", "hammertoes", "hoes", "hoopoes", "horseshoes", "leucothoes", "mahoes", "mistletoes", "oboes", "overshoes", "pahoehoes", "pekoes", "roes", "shoes", "sloes", "snowshoes", "throes", "tic-tac-toes", "tick-tack-toes", "ticktacktoes", "tiptoes", "tit-tat-toes", "toes", "toetoes", "tuckahoes", "woes"];
	
		/* Words that change from "-ex" to "-ices" (like "index" etc.), listed in their plural forms*/
		var categoryEX_ICES = ["apices", "codices", "cortices", "indices", "latices", "murices", "pontifices", "silices", "simplices", "vertices", "vortices"];
	
		/* Words that change from "-u" to "-us" (like "emu" etc.), listed in their plural forms*/
		var categoryU_US = ["apercus", "barbus", "cornus", "ecrus", "emus", "fondus", "gnus", "iglus", "mus", "nandus", "napus", "poilus", "quipus", "snafus", "tabus", "tamandus", "tatus", "timucus", "tiramisus", "tofus", "tutus"];
	
		/* Words that change from "-sse" to "-sses" (like "finesse" etc.), listed in their plural forms,plus those ending in mousse*/
		var categorySSE_SSES = ["bouillabaisses", "coulisses", "crevasses", "crosses", "cuisses", "demitasses", "ecrevisses", "fesses", "finesses", "fosses", "impasses", "lacrosses", "largesses", "masses", "noblesses", "palliasses", "pelisses", "politesses", "posses", "tasses", "wrasses"];
	
		/* Words that change from "-che" to "-ches" (like "brioche" etc.), listed in their plural forms*/
		var categoryCHE_CHES = ["adrenarches", "attaches", "avalanches", "barouches", "brioches", "caches", "caleches", "caroches", "cartouches", "cliches", "cloches", "creches", "demarches", "douches", "gouaches", "guilloches", "headaches", "heartaches", "huaraches", "menarches", "microfiches", "moustaches", "mustaches", "niches", "panaches", "panoches", "pastiches", "penuches", "pinches", "postiches", "psyches", "quiches", "schottisches", "seiches", "soutaches", "synecdoches", "thelarches", "troches"];
	
		/* Words that end with "-ics" and do not exist as nouns without the 's' (like "aerobics" etc.)*/
		var categoryICS = ["aerobatics", "aerobics", "aerodynamics", "aeromechanics", "aeronautics", "alphanumerics", "animatronics", "apologetics", "architectonics", "astrodynamics", "astronautics", "astrophysics", "athletics", "atmospherics", "autogenics", "avionics", "ballistics", "bibliotics", "bioethics", "biometrics", "bionics", "bionomics", "biophysics", "biosystematics", "cacogenics", "calisthenics", "callisthenics", "catoptrics", "civics", "cladistics", "cryogenics", "cryonics", "cryptanalytics", "cybernetics", "cytoarchitectonics", "cytogenetics", "diagnostics", "dietetics", "dramatics", "dysgenics", "econometrics", "economics", "electromagnetics", "electronics", "electrostatics", "endodontics", "enterics", "ergonomics", "eugenics", "eurhythmics", "eurythmics", "exodontics", "fibreoptics", "futuristics", "genetics", "genomics", "geographics", "geophysics", "geopolitics", "geriatrics", "glyptics", "graphics", "gymnastics", "hermeneutics", "histrionics", "homiletics", "hydraulics", "hydrodynamics", "hydrokinetics", "hydroponics", "hydrostatics", "hygienics", "informatics", "kinematics", "kinesthetics", "kinetics", "lexicostatistics", "linguistics", "lithoglyptics", "liturgics", "logistics", "macrobiotics", "macroeconomics", "magnetics", "magnetohydrodynamics", "mathematics", "metamathematics", "metaphysics", "microeconomics", "microelectronics", "mnemonics", "morphophonemics", "neuroethics", "neurolinguistics", "nucleonics", "numismatics", "obstetrics", "onomastics", "orthodontics", "orthopaedics", "orthopedics", "orthoptics", "paediatrics", "patristics", "patristics", "pedagogics", "pediatrics", "periodontics", "pharmaceutics", "pharmacogenetics", "pharmacokinetics", "phonemics", "phonetics", "phonics", "photomechanics", "physiatrics", "pneumatics", "poetics", "politics", "pragmatics", "prosthetics", "prosthodontics", "proteomics", "proxemics", "psycholinguistics", "psychometrics", "psychonomics", "psychophysics", "psychotherapeutics", "robotics", "semantics", "semiotics", "semitropics", "sociolinguistics", "stemmatics", "strategics", "subtropics", "systematics", "tectonics", "telerobotics", "therapeutics", "thermionics", "thermodynamics", "thermostatics"];
	
		/* Words that change from "-ie" to "-ies" (like "auntie" etc.), listed in their plural forms*/
		var categoryIE_IES = ["aeries", "anomies", "aunties", "baddies", "beanies", "birdies", "boccies", "bogies", "bolshies", "bombies", "bonhomies", "bonxies", "booboisies", "boogies", "boogie-woogies", "bookies", "booties", "bosies", "bourgeoisies", "brasseries", "brassies", "brownies", "budgies", "byrnies", "caddies", "calories", "camaraderies", "capercaillies", "capercailzies", "cassies", "catties", "causeries", "charcuteries", "chinoiseries", "collies", "commies", "cookies", "coolies", "coonties", "cooties", "corries", "coteries", "cowpies", "cowries", "cozies", "crappies", "crossties", "curies", "dachsies", "darkies", "dassies", "dearies", "dickies", "dies", "dixies", "doggies", "dogies", "dominies", "dovekies", "eyries", "faeries", "falsies", "floozies", "folies", "foodies", "freebies", "gaucheries", "gendarmeries", "genies", "ghillies", "gillies", "goalies", "goonies", "grannies", "grotesqueries", "groupies", "hankies", "hippies", "hoagies", "honkies", "hymies", "indies", "junkies", "kelpies", "kilocalories", "knobkerries", "koppies", "kylies", "laddies", "lassies", "lies", "lingeries", "magpies", "magpies", "marqueteries", "mashies", "mealies", "meanies", "menageries", "millicuries", "mollies", "facts1", "moxies", "neckties", "newbies", "nighties", "nookies", "oldies", "organdies", "panties", "parqueteries", "passementeries", "patisseries", "pies", "pinkies", "pixies", "porkpies", "potpies", "prairies", "preemies", "premies", "punkies", "pyxies", "quickies", "ramies", "reveries", "rookies", "rotisseries", "scrapies", "sharpies", "smoothies", "softies", "stoolies", "stymies", "swaggies", "sweeties", "talkies", "techies", "ties", "tooshies", "toughies", "townies", "veggies", "walkie-talkies", "wedgies", "weenies", "weirdies", "yardies", "yuppies", "zombies"];
	
		/* Maps irregular Germanic English plural nouns to their singular form */
		var categoryIRR = ["beefs", "beef", "beeves", "beef", "brethren", "brother", "busses", "bus", "cattle", "cattlebeast", "children", "child", "corpora", "corpus", "ephemerides", "ephemeris", "firemen", "fireman", "genera", "genus", "genies", "genie", "genii", "genie", "kine", "cow", "lice", "louse", "men", "man", "mice", "mouse", "mongooses", "mongoose", "monies", "money", "mythoi", "mythos", "octopodes", "octopus", "octopuses", "octopus", "oxen", "ox", "people", "person", "soliloquies", "soliloquy", "throes", "throes", "trilbys", "trilby", "women", "woman"];
	
		/* Tells whether a noun is plural. */
		function isPlural(s) { return (!s === stem(s)); }
	
		/* Tells whether a word form is singular. Note that a word can be both plural and singular */
		function isSingular(s) { return (categorySP._arrayContains(s.toLowerCase()) || !isPlural(s)); }
	
		/*
		 * Tells whether a word form is the singular form of one word and at
		 * the same time the plural form of another.
		 */
		function isSingularAndPlural(s) {
			return (categorySP._arrayContains(s.toLowerCase()));
		}
	
		/* Cuts a suffix from a string (that is the number of chars given by the suffix) */
		function cut(s, suffix) {
			return (s.substring(0, s.length - suffix.length));
		}
	
		/* Returns true if a word is probably not Latin */
		function noLatin(s) {
			return (s.indexOf('h') > 0 || s.indexOf('j') > 0 || s.indexOf('k') > 0 || s.indexOf('w') > 0 || s.indexOf('y') > 0 || s.indexOf('z') > 0 || s.indexOf("ou") > 0 || s.indexOf("sh") > 0 || s.indexOf("ch") > 0 || s._endsWith("aus"));
		}
	
		/* Returns true if a word is probably Greek */
		function greek(s) {
			return (s.indexOf("ph") > 0 || s.indexOf('y') > 0 && s._endsWith("nges"));
		}
	
		function stem(s) {

			if (!strOk(s)) return E;
	
			// Handle irregular ones
			var irreg = categoryIRR[s];
			
			if (irreg) return (irreg);
	
			// -on to -a
			if (categoryON_A._arrayContains(s))
				return (cut(s, "a") + "on");
	
			// -um to -a
			if (categoryUM_A._arrayContains(s))
				return (cut(s, "a") + "um");
	
			// -x to -ices
			if (categoryIX_ICES._arrayContains(s))
				return (cut(s, "ices") + "ix");
	
			// -o to -i
			if (categoryO_I._arrayContains(s))
				return (cut(s, "i") + "o");
	
			// -se to ses
			if (categorySE_SES._arrayContains(s))
				return (cut(s, "s"));
	
			// -is to -es
			if (categoryIS_ES._arrayContains(s) || s._endsWith("theses"))
				return (cut(s, "es") + "is");
	
			// -us to -i
			if (categoryUS_I._arrayContains(s))
				return (cut(s, "i") + "us");
			//Wrong plural
			if (s._endsWith("uses") && (categoryUS_I._arrayContains(cut(s, "uses") + "i") || s === ("genuses") || s === ("corpuses")))
				return (cut(s, "es"));
	
			// -ex to -ices
			if (categoryEX_ICES._arrayContains(s))
				return (cut(s, "ices") + "ex");
	
			// Words that do not inflect in the plural
			if (s._endsWith("ois") || s._endsWith("itis") || category00._arrayContains(s) || categoryICS._arrayContains(s))
				return (s);
	
			// -en to -ina
			// No other common words end in -ina
			if (s._endsWith("ina"))
				return (cut(s, "en"));
	
			// -a to -ae
			// No other common words end in -ae
			if (s._endsWith("ae"))
				return (cut(s, "e"));
	
			// -a to -ata
			// No other common words end in -ata
			if (s._endsWith("ata"))
				return (cut(s, "ta"));
	
			// trix to -trices
			// No common word ends with -trice(s)
			if (s._endsWith("trices"))
				return (cut(s, "trices") + "trix");
	
			// -us to -us
			//No other common word ends in -us, except for false plurals of French words
			//Catch words that are not latin or known to end in -u
			if (s._endsWith("us") && !s._endsWith("eaus") && !s._endsWith("ieus") && !noLatin(s) && !categoryU_US._arrayContains(s))
				return (s);
	
			// -tooth to -teeth
			// -goose to -geese
			// -foot to -feet
			// -zoon to -zoa
			//No other common words end with the indicated suffixes
			if (s._endsWith("teeth"))
				return (cut(s, "teeth") + "tooth");
			if (s._endsWith("geese"))
				return (cut(s, "geese") + "goose");
			if (s._endsWith("feet"))
				return (cut(s, "feet") + "foot");
			if (s._endsWith("zoa"))
				return (cut(s, "zoa") + "zoon");
	
			// -eau to -eaux
			//No other common words end in eaux
			if (s._endsWith("eaux"))
				return (cut(s, "x"));
	
			// -ieu to -ieux
			//No other common words end in ieux
			if (s._endsWith("ieux"))
				return (cut(s, "x"));
	
			// -nx to -nges
			// Pay attention not to kill words ending in -nge with plural -nges
			// Take only Greek words (works fine, only a handfull of exceptions)
			if (s._endsWith("nges") && greek(s))
				return (cut(s, "nges") + "nx");
	
			// -[sc]h to -[sc]hes
			//No other common word ends with "shes", "ches" or "she(s)"
			//Quite a lot end with "che(s)", filter them out
			if (s._endsWith("shes") || s._endsWith("ches") && !categoryCHE_CHES._arrayContains(s))
				return (cut(s, "es"));
	
			// -ss to -sses
			// No other common singular word ends with "sses"
			// Filter out those ending in "sse(s)"
			if (s._endsWith("sses") && !categorySSE_SSES._arrayContains(s) && !s._endsWith("mousses"))
				return (cut(s, "es"));
	
			// -x to -xes
			// No other common word ends with "xe(s)" except for "axe"
			if (s._endsWith("xes") && !s === ("axes"))
				return (cut(s, "es"));
	
			// -[nlw]ife to -[nlw]ives
			//No other common word ends with "[nlw]ive(s)" except for olive
			if (s._endsWith("nives") || s._endsWith("lives") && !s._endsWith("olives") || s._endsWith("wives"))
				return (cut(s, "ves") + "fe");
	
			// -[aeo]lf to -ves  exceptions: valve, solve
			// -[^d]eaf to -ves  exceptions: heave, weave
			// -arf to -ves      no exception
			if (s._endsWith("alves") && !s._endsWith("valves") || s._endsWith("olves") && !s._endsWith("solves") || s._endsWith("eaves") && !s._endsWith("heaves") && !s._endsWith("weaves") || s._endsWith("arves"))
				return (cut(s, "ves") + "f");
	
			// -y to -ies
			// -ies is very uncommon as a singular suffix
			// but -ie is quite common, filter them out
			if (s._endsWith("ies") && !categoryIE_IES._arrayContains(s))
				return (cut(s, "ies") + "y");
	
			// -o to -oes
			// Some words end with -oe, so don't kill the "e"
			if (s._endsWith("oes") && !categoryOE_OES._arrayContains(s))
				return (cut(s, "es"));
	
			// -s to -ses
			// -z to -zes
			// no words end with "-ses" or "-zes" in singular
			if (s._endsWith("ses") || s._endsWith("zes"))
				return (cut(s, "es"));
	
			// - to -s
			if (s._endsWith("s") && !s._endsWith("ss") && !s._endsWith("is"))
				return (cut(s, "s"));
	
			return (s);
		}
	
		return function(token) {
	
			return stem(token.toLowerCase());
		}
		
	})();

	/*
	 * Minimum-Edit-Distance (or Levenshtein distance) is a measure of the similarity 
	 * between two strings, the source string and the target string (t). The distance 
	 * is the number of deletions, insertions, or substitutions required to transform 
	 * the source into the target / avg_string_length<p> 
	 * 
	 * Adapted from Michael Gilleland's algorithm
	 */
	var MinEditDist = {

		_min3 : function(a,b,c) { 

			var min = a;
			if (b < min) min = b;
			if (c < min) min = c;
			return min;
		},

		/* Computes min-edit-distance between 2 string arrays where each array element either matches or does not */
		_computeRawArray : function(srcArr, trgArr) { // TODO: make private to class

			//log((srcArr)+" "+(trgArr));
			
			var matrix = []; // matrix
			var sI; // ith element of s
			var tJ; // jth element of t
			var cost; // cost
			var i, j, sl, tl;

			// Step 1 ----------------------------------------------

			if (!srcArr.length) return trgArr.length;

			if (!trgArr.length) return srcArr.length;

			// Step 2 ----------------------------------------------

			for (i = 0, sl=srcArr.length; i<=sl; i++) {

				matrix[i] = [];
				matrix[i][0] = i;
			}

			for (j=0, tl=trgArr.length; j<=tl; j++) 
				matrix[0][j] = j;

			// Step 3 ----------------------------------------------

			for (i=1, sl=srcArr.length; i<=sl; i++) {
			
				sI = srcArr[i - 1];

				// Step 4 --------------------------------------------
				
				for (j=1, tl=trgArr.length; j<=tl; j++) {
				
					tJ = trgArr[j - 1];

					// Step 5 ------------------------------------------

					cost = (sI === tJ) ? 0 : 1;

					// Step 6 ------------------------------------------
					
					matrix[i][j] = this._min3(
						matrix[i - 1][j] + 1, 
						matrix[i][j - 1] + 1, 
						matrix[i - 1][j - 1] + cost);
				}
			}

			// Step 7 ----------------------------------------------

			return matrix[srcArr.length][trgArr.length];
		},

		
		/*
		 * Compute min-edit-distance between 2 strings (or 2 arrays)
		 */ 
		computeRaw : function(source, target) { 

			if (Type.get(source)===A) return this._computeRawArray(source, target);
			
			if (!source.length && !target.length) return 0;

			var matrix = []; // matrix
			var cost; // cost
			var sI; // ith character of s
			var tJ; // jth character of t
			
			// Step 1 ----------------------------------------------
			
			var sourceLength = source.length;
			var targetLength = target.length;

			if (!sourceLength) return targetLength;

			if (!targetLength) return sourceLength;

			// Step 2 ----------------------------------------------

			for (var i = 0; i <= sourceLength; i++) {
				matrix[i] = [];
				matrix[i][0] = i;
			}

			for (var j = 0; j <= targetLength; j++)   
				matrix[0][j] = j;

			// Step 3 ----------------------------------------------

			for (var i = 1; i <= sourceLength; i++)
			{
				sI = source.charAt(i - 1);

				// Step 4 --------------------------------------------

				for (var j = 1; j <= targetLength; j++)
				{
					tJ = target.charAt(j - 1);

					// Step 5 ------------------------------------------

					cost = (sI == tJ) ? 0 : 1;

					// Step 6 ------------------------------------------
					matrix[i][j] = this._min3(
						matrix[i - 1][j] + 1, 
						matrix[i][j - 1] + 1, 
						matrix[i - 1][j - 1] + cost);
				}
			}

			// Step 7 ----------------------------------------------

			return matrix[sourceLength][targetLength];
			
		},

		/*
		 * Compute min-edit-distance between 2 strings (or 2 arrays of strings) 
		 * divided by the max of their lengths.
		 */ 
		computeAdjusted : function(source, target) {

			var st = Type.get(source), tt = Type.get(source);
			if (st === tt) {

				if (tt===S) {
					
					if (!source.length && !target.length) return 0;
					//log(this.computeRaw(source, target)+'/'+(source.length + target.length));
					return this.computeRaw(source, target) / Math.max(source.length, target.length);
				}
				else if (tt===A) {
					
					if (!source.length && !target.length) return 0;
					//log(_computeRawArray(source, target)+'/'+(source.length + target.length));
					return this._computeRawArray(source, target) / Math.max(source.length,target.length);
				}
			}
			
			err('Unexpected args: '+source+"/"+target);
		}
	}

	//////////////////////////////////////////////////////////////////
	//////// RE 
	////////////////////////////////////////////////////////////////

	var RE = makeClass();

	RE.prototype = {
		
		init : function(regex, offset, suffix) {
			
			this.regex = new RegExp(regex);
			this.offset = offset;
			this.suffix = suffix;
		},
		
		applies : function(word) {

			return this.regex.test(trim(word));
		},
		
		fire : function(word) {

			return this.truncate(trim(word)) + this.suffix;
		},
		
		analyze : function(word) {
			
			return ((this.suffix != E) && endsWith(word, this.suffix)) ? true : false;
		},
		
		truncate : function(word) {

			return (this.offset == 0) ? word : word.substr(0, word.length - this.offset);
		}
	}
	
	
	
	//////////////////////////////////////////////////////////////////////////////////////
	// adapted from: https://github.com/sole/tween.js
	//////////////////////////////////////////////////////////////////////////////////////    

	var TextBehavior = function (rt, object) {
	
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
		}
	
		this.start = function ( time ) {
	
			if (_parent) 
				_parent._addBehavior( this );
			else
				err('Unable to add tween');
	
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
		}
	
		this.stop = function () {
	
			if (_parent) _parent.stopBehavior( this );
			return this;
		}
	
		this.delay = function ( amount ) {
	
			_delayTime = amount;
			return this;
		}
	
		this.easing = function ( easing ) {
	
			_easingFunction = easing;
			return this;
		}
	
		this.interpolation = function ( interpolation ) {
	
			_interpolationFunction = interpolation;
			return this;
		}
	
		this.chain = function ( chainedTween ) {
	
			_chainedTween = chainedTween;
			return this;
		}
	
		this.onUpdate = function ( onUpdateCallback ) {
	
			_onUpdateCallback = onUpdateCallback;
			return this;
	
		}
	
		this.onComplete = function ( onCompleteCallback ) {
	
			_onCompleteCallback = onCompleteCallback;
			return this;
		}
	
		this.update = function ( time ) {
	
			if ( time < _startTime ) return true;
	
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
	
			if (_onUpdateCallback) {

				_onUpdateCallback.call( _object, value );
			}
	
			if ( elapsed == 1 ) {
	
				if ( _onCompleteCallback !== null ) {
	
					_onCompleteCallback.call( _object );
				}
	
				if ( _chainedTween !== null ) {
	
					_chainedTween.start();
				}
	
				return false;
	
			}
	
			return true;
		}
	
	}

	var RiText_P5 = makeClass();

	RiText_P5.prototype = {

		init : function(p, ctx) {
			
			this.p = p;
			if (!ctx) console.error("no canvas-context!");
			this.ctx = ctx;
			
		},
		
		_size : function() {
			
			return this.p.size.apply(this, arguments);
		},
		
		_getGraphics : function() {
			
			return this.p;
		},
		
 		
		_pushState : function() {
			
			// TODO: what about the matrix?
			
			//this.p.pushStyle(); 
			this.ctx.save();
			
			//this.p.pushMatrix();
			
			return this;
		},
		
		_popState : function() {
			
			
			//this.p.popMatrix();
			
			this.ctx.restore();
			//this.p.popStyle();
			
			return this;
		},

		_textAlign : function(align) {
			
			this.p.textAlign.apply(this,arguments);
			return this;
		},
		
		_scale : function(sx, sy) {
			sy = sy || 1;
			this.p.scale(sx, sy, 1);
		},
		
		_translate : function(tx, ty) {
			ty = ty || 0;
			this.p.translate(tx, ty, 0);
		},
		
		_rotate : function(zRot) {
 
			this.p.rotate(zRot);
		},
		
		_text : function(str, x, y) {
			
			this.p.text.apply(this, arguments);
		},
		
		_fill : function(r,g,b,a) {
			
			this.p.fill.apply(this,arguments);
		},
		
		_stroke : function(r,g,b,a) {
			
			this.p.stroke.apply(this,arguments);
		},
		
		_noFill : function() {
			
			this.p.noFill();
		},
		
		_rect : function(x,y,w,h) {
			
			this.p.rect.apply(this, arguments);
		},
		
		_strokeWeight : function(f) {
//console.log("p.strokeWeight: "+f);
			this.p.strokeWeight.apply(this,arguments);
		},
		
		_background : function(r,g,b,a) {
			
			this.p.background.apply(this,arguments);
		},

		// actual creation: only called from RiText.defaultFont()!
		_createFont : function(fontName, fontSize) {
			
			//log("[P5] Creating font: "+fontName+"-"+fontSize);
			
			return this.p.createFont(fontName, fontSize);                
		},

		_textFont : function(fontObj) {
			
			if (!is(fontObj,O)) 
				err("_textFont takes object!");
			this.p.textFont(fontObj, fontObj.size);
		},
		
		_textSize : function(sz) {
			
			this.p.textSize(sz);
		},
		
		_textWidth : function(fontObj, str) {
			
			//this.p.pushStyle(); ////////
			this.ctx.save(); // ?? why?
			this.p.textFont(fontObj, fontObj.size); // was _textFont
			var tw = this.p.textWidth(str);
			//this.p.popStyle();
			this.ctx.restore();
			//log(str+" -> "+tw);
			return tw;
		},
		
		_textHeight : function(rt) {
			
			this.ctx.save();
			var h = this._getBoundingBox(rt).height;
			this.ctx.restore();
			return h;
		},
		
		_textAscent : function(rt,ignoreContext) {
			
			ignoreContext = ignoreContext || false;
			
			if (!ignoreContext) {
			  //this.p.pushStyle();
			  this.ctx.save();
			  this.p.textFont(rt._font, rt._font.size);
			}
			var asc = this.p.textAscent();
			if (!ignoreContext) {
			  this.ctx.restore();
			  //this.p.popStyle();
			}

			return asc;
		},
		
		_textDescent : function(rt) {
			
			//this.p.pushStyle(); ////////
			this.ctx.save();
			this.p.textFont(rt._font, rt._font.size);
			var dsc = this.p.textDescent();
			//this.p.popStyle();
			this.ctx.restore();
			return dsc;
		},
		
		// TODO: what about scale?
		_getBoundingBox : function(rt) {
			
			//this.p.pushStyle(); ////////
			//this.ctx.save();

			this.ctx.save();
			this.p.textFont(rt._font, rt._font.size);
			
			//this.p.popStyle(); ////////
			
			var ascent  =   this.p.textAscent(),
				descent =   this.p.textDescent(),
				width   =   this.p.textWidth(rt.text());
			
			this.ctx.restore();		

			return { x: 0, y: -ascent-1, width: width, 
				height: (ascent+descent+1) };
		},
		
		_type : function() {
			
			return "Processing";
		},
		
		toString : function() {
			
			return "RiText_"+this._type();
		}
	}
	
	////////////////////////////////// End Classes ///////////////////////////////////

	// TODO: clean this mess up... wrap in Constants, and EnglishConstants?
	
	var QUESTION_STARTS = ["Was", "What", "When", "Where", "How", "Which", "If", "Who", "Is", "Could", "Might", "Will", "Does", "Why", "Are" ];    
	
	var W_QUESTION_STARTS = ["Was", "What", "When", "Where", "How", "Which", "Why", "Who", "Will"];
	
	var PUNCTUATION_CLASS = /[`~\"\/'_\-[\]{}()*+!?%&.,\\^$|#@<>|+=;:]/g; // TODO: missing smart-quotes
	
	var ONLY_PUNCT = /^[^0-9A-Za-z\s]*$/, RiTextCallbacksDisabled = false;
	
	var ALL_PUNCT = /^[-[\]{}()*+!?%&.,\\^$|#@<>|+=;:]+$/g, DeLiM = ':DeLiM:', EA = new Array();
	
	var SP = ' ', E = '', N = Type.N, S = Type.S, O = Type.O, A = Type.A, B = Type.B, R = Type.R, F = Type.F;
	
	var DEFAULT_PLURAL_RULE = RE("^((\\w+)(-\\w+)*)(\\s((\\w+)(-\\w+)*))*$", 0, "s");
	
	var NULL_PLURALS = RE( // these don't change for plural/singular
		"^(bantu|bengalese|bengali|beninese|boche|bonsai|digitalis|mess|"
		+ "burmese|chinese|colossus|congolese|discus|emphasis|gabonese|guyanese|japanese|javanese|"
		+ "lebanese|maltese|olympics|portuguese|senegalese|siamese|singhalese|innings|"
		+ "sinhalese|sioux|sudanese|swiss|taiwanese|togolese|vietnamese|aircraft|"
		+ "anopheles|apparatus|asparagus|barracks|bellows|bison|bluefish|bob|bourgeois|"
		+ "bream|brill|butterfingers|cargo|carp|catfish|chassis|clothes|chub|cod|codfish|"
		+ "coley|contretemps|corps|crawfish|crayfish|crossroads|cuttlefish|dace|deer|dice|"
		+ "dogfish|doings|dory|downstairs|eldest|earnings|economics|electronics|finnan|"
		+ "firstborn|fish|flatfish|flounder|fowl|fry|fries|works|globefish|goldfish|golf|"
		+ "grand|grief|gudgeon|gulden|haddock|hake|halibut|headquarters|herring|hertz|horsepower|"
		+ "goods|hovercraft|hundredweight|ironworks|jackanapes|kilohertz|kurus|kwacha|ling|lungfish|"
		+ "mackerel|means|megahertz|moorfowl|moorgame|mullet|nepalese|offspring|pampas|parr|pants|"
		+ "patois|pekinese|penn'orth|perch|pickerel|pike|pince-nez|plaice|precis|quid|rand|"
		+ "rendezvous|revers|roach|roux|salmon|samurai|series|seychelles|seychellois|shad|"
		+ "sheep|shellfish|smelt|spacecraft|species|starfish|stockfish|sunfish|superficies|"
		+ "sweepstakes|swordfish|tench|tennis|[a-z]+osis|[a-z]+itis|[a-z]+ness|"
		+ "tobacco|tope|triceps|trout|tuna|tunafish|tunny|turbot|trousers|"
		+ "undersigned|veg|waterfowl|waterworks|waxworks|whiting|wildfowl|woodworm|"
		+ "yen|aries|pisces|forceps|lieder|jeans|physics|mathematics|news|odds|politics|remains|"
		+ "surroundings|thanks|statistics|goods|aids|wildlife)$", 0, E); 
		
	var SINGULAR_RULES = [
		  NULL_PLURALS,
		  RE("^(oxen|buses)$",2,E),
		  RE("^(toes|taxis)$",1,E),
		  RE("^series$",0,E),
		  RE("(men|women)$",2,"an"),
		  RE("^[lm]ice$",3,"ouse"),
		  RE("^children",3,E),
		  RE("^(appendices|indices|matrices)", 3, "x"),
		  RE("^(stimuli|alumni)$", 1, "us"),
		  RE("^(data)$", 1, "um"),
		  RE("^(memoranda|bacteria|curricula|minima|"
			  + "maxima|referenda|spectra|phenomena|criteria)$", 1, "um"),
		  RE("monies", 3, "ey"),
		  RE("people", 4, "rson"),
		  RE("^meninges|phalanges$", 3, "x"),
		  RE("schemata$", 2, "s"),
		  RE("^corpora$", 3, "us"),
		  RE("^(curi|formul|vertebr|larv|uln|alumn|signor|alg)ae$", 1, E),
		  RE("^apices|cortices$", 4, "ex"),
		  RE("^teeth$", 4, "ooth"),
		  RE("^feet$", 3, "oot"),
		  RE("femora", 3, "ur"),
		  RE("geese", 4, "oose"),
		  RE("crises", 2, "is"),
		  RE("(human|german|roman)$", 0, "s")
	];
	
  	var ANY_STEM = "^((\\w+)(-\\w+)*)(\\s((\\w+)(-\\w+)*))*$";
  	var C = "[bcdfghjklmnpqrstvwxyz]", VL = "[lraeiou]";
  	
	var PLURAL_RULES = [ // TODO: extract all these consts to single file for js/java
		  NULL_PLURALS,
	      RE("^(piano|photo|solo|ego|tobacco|cargo|golf|grief)$", 0,"s"),
	      RE("^(wildlife)$", 0, "s"),
	      RE(C + "o$", 0, "es"),
	      RE(C + "y$", 1, "ies"),
	      RE("^ox$", 0, "en"),
	      RE("^(stimulus|alumnus)$", 2, "i"),
	      RE("^corpus$", 2, "ora"),
	      RE("(xis|sis)$", 2, "es"),
	      RE("([zsx]|ch|sh)$", 0, "es"),
	      RE(VL + "fe$", 2, "ves"),
	      RE(VL + "f$", 1, "ves"),
	      RE("(eu|eau)$", 0, "x"),
	      
	      RE("(man|woman)$", 2, "en"),
	      RE("money$", 2, "ies"),
	      RE("person$", 4, "ople"),
	      RE("motif$", 0, "s"),
	      RE("^meninx|phalanx$", 1, "ges"),
	      
	      RE("schema$", 0, "ta"),
	      RE("^bus$", 0, "ses"),
	      RE("child$", 0, "ren"),
	      RE("^(curi|formul|vertebr|larv|uln|alumn|signor|alg)a$", 0,"e"),
	      RE("^(maharaj|raj|myn|mull)a$", 0, "hs"),
	      RE("^aide-de-camp$", 8, "s-de-camp"),
	      RE("^apex|cortex$", 2, "ices"),
	      RE("^weltanschauung$", 0, "en"),
	      RE("^lied$", 0, "er"),
	      RE("^tooth$", 4, "eeth"),
	      RE("^[lm]ouse$", 4, "ice"),
	      RE("^foot$", 3, "eet"),
	      RE("femur", 2, "ora"),
	      RE("goose", 4, "eese"),
	      RE("(human|german|roman)$", 0, "s"),
	      RE("^(monarch|loch|stomach)$", 0, "s"),
	      RE("^(taxi|chief|proof|ref|relief|roof|belief)$", 0, "s"),
	      RE("^(co|no)$", 0, "'s"),
		  RE("^blond$", 0, "es"),

	      // Latin stems
	      RE("^(memorandum|bacterium|curriculum|minimum|"
	          + "maximum|referendum|spectrum|phenomenon|criterion)$", 2,"a"),
	      RE("^(appendix|index|matrix)", 2, "ices")
		],

	ANY_STEM = "^((\\w+)(-\\w+)*)(\\s((\\w+)(-\\w+)*))*$", CONS = "[bcdfghjklmnpqrstvwxyz]",
	VERBAL_PREFIX = "((be|with|pre|un|over|re|mis|under|out|up|fore|for|counter|co|sub)(-?))",
	AUXILIARIES = [ "do", "have", "be" ],
	MODALS = [ "shall", "would", "may", "might", "ought", "should" ],
	SYMBOLS = [ "!", "?", "$", "%", "*", "+", "-", "=" ],

	ING_FORM_RULES = [ 
		  RE(CONS + "ie$", 2, "ying", 1),
		  RE("[^ie]e$", 1, "ing", 1),
		  RE("^bog-down$", 5, "ging-down", 0),
		  RE("^chivy$", 1, "vying", 0),
		  RE("^trek$", 1, "cking", 0), 
		  RE("^bring$", 0, "ing", 0),
		  RE("^be$", 0, "ing", 0), 
		  RE("^age$", 1, "ing", 0), 
		  RE("(ibe)$", 1, "ing", 0) 
	],

	PAST_PARTICIPLE_RULES = [     
		
		RE(CONS + "y$", 1, "ied", 1),
		RE("^" + VERBAL_PREFIX + "?(bring)$", 3, "ought", 0),
		RE("^" + VERBAL_PREFIX + "?(take|rise|strew|blow|draw|drive|know|give|"
			+ "arise|gnaw|grave|grow|hew|know|mow|see|sew|throw|prove|saw|quartersaw|"
			+ "partake|sake|shake|shew|show|shrive|sightsee|strew|strive)$",
			0, "n", 0),
		RE("^" + VERBAL_PREFIX + "?[gd]o$", 0, "ne", 1),
		RE("^(beat|eat|be|fall)$", 0, "en", 0),
		RE("^(have)$", 2, "d", 0),
		RE("^" + VERBAL_PREFIX + "?bid$", 0, "den", 0),
		RE("^" + VERBAL_PREFIX + "?[lps]ay$", 1, "id", 1),
		RE("^behave$", 0, "d", 0),
		RE("^" + VERBAL_PREFIX + "?have$", 2, "d", 1),
		RE("(sink|slink|drink|shrink|stink)$", 3, "unk", 0),
		RE("(([sfc][twlp]?r?|w?r)ing|hang)$", 3, "ung", 0),
		RE("^" + VERBAL_PREFIX + "?(shear|swear|bear|wear|tear)$",3,"orn",0),
		RE("^" + VERBAL_PREFIX + "?(bend|spend|send|lend)$", 1, "t", 0),
		RE("^" + VERBAL_PREFIX + "?(weep|sleep|sweep|creep|keep$)$", 2,"pt", 0),
		RE("^" + VERBAL_PREFIX + "?(sell|tell)$", 3, "old", 0),
		RE("^(outfight|beseech)$", 4, "ought", 0),
		RE("^bethink$", 3, "ought", 0),
		RE("^buy$", 2, "ought", 0),
		RE("^aby$", 1, "ought", 0),
		RE("^tarmac", 0, "ked", 0),
		RE("^abide$", 3, "ode", 0),
		RE("^" + VERBAL_PREFIX + "?(speak|(a?)wake|break)$", 3, "oken", 0),
		RE("^backbite$", 1, "ten", 0),
		RE("^backslide$", 1, "den", 0),
		RE("^become$", 3, "ame", 0),
		RE("^begird$", 3, "irt", 0),
		RE("^outlie$", 2, "ay", 0),
		RE("^rebind$", 3, "ound", 0),
		RE("^relay$", 2, "aid", 0),
		RE("^shit$", 3, "hat", 0),
		RE("^bereave$", 4, "eft", 0),
		RE("^foreswear$", 3, "ore", 0),
		RE("^overfly$", 1, "own", 0),
		RE("^beget$", 2, "otten", 0),
		RE("^begin$", 3, "gun", 0),
		RE("^bestride$", 1, "den", 0),
		RE("^bite$", 1, "ten", 0),
		RE("^bleed$", 4, "led", 0),
		RE("^bog-down$", 5, "ged-down", 0),
		RE("^bind$", 3, "ound", 0),
		RE("^(.*)feed$", 4, "fed", 0),
		RE("^breed$", 4, "red", 0),
		RE("^brei", 0, "d", 0),
		RE("^bring$", 3, "ought", 0),
		RE("^build$", 1, "t", 0),
		RE("^come", 0, E, 0),
		RE("^catch$", 3, "ught", 0),
		RE("^chivy$", 1, "vied", 0),
		RE("^choose$", 3, "sen", 0),
		RE("^cleave$", 4, "oven", 0),
		RE("^crossbreed$", 4, "red", 0),
		RE("^deal", 0, "t", 0),
		RE("^dow$", 1, "ught", 0),
		RE("^dream", 0, "t", 0),
		RE("^dig$", 3, "dug", 0),
		RE("^dwell$", 2, "lt", 0),
		RE("^enwind$", 3, "ound", 0),
		RE("^feel$", 3, "elt", 0),
		RE("^flee$", 2, "ed", 0),
		RE("^floodlight$", 5, "lit", 0),
		RE("^fly$", 1, "own", 0),
		RE("^forbear$", 3, "orne", 0),
		RE("^forerun$", 3, "ran", 0),
		RE("^forget$", 2, "otten", 0),
		RE("^fight$", 4, "ought", 0),
		RE("^find$", 3, "ound", 0),
		RE("^freeze$", 4, "ozen", 0),
		RE("^gainsay$", 2, "aid", 0),
		RE("^gin$", 3, "gan", 0),
		RE("^gen-up$", 3, "ned-up", 0),
		RE("^ghostwrite$", 1, "ten", 0),
		RE("^get$", 2, "otten", 0),
		RE("^grind$", 3, "ound", 0),
		RE("^hacksaw", 0, "n", 0),
		RE("^hear", 0, "d", 0),
		RE("^hold$", 3, "eld", 0),
		RE("^hide$", 1, "den", 0),
		RE("^honey$", 2, "ied", 0),
		RE("^inbreed$", 4, "red", 0),
		RE("^indwell$", 3, "elt", 0),
		RE("^interbreed$", 4, "red", 0),
		RE("^interweave$", 4, "oven", 0),
		RE("^inweave$", 4, "oven", 0),
		RE("^ken$", 2, "ent", 0),
		RE("^kneel$", 3, "elt", 0),
		RE("^lie$", 2, "ain", 0),
		RE("^leap$", 0, "t", 0),
		RE("^learn$", 0, "t", 0),
		RE("^lead$", 4, "led", 0),
		RE("^leave$", 4, "eft", 0),
		RE("^light$", 5, "lit", 0),
		RE("^lose$", 3, "ost", 0),
		RE("^make$", 3, "ade", 0),
		RE("^mean", 0, "t", 0),
		RE("^meet$", 4, "met", 0),
		RE("^misbecome$", 3, "ame", 0),
		RE("^misdeal$", 2, "alt", 0),
		RE("^mishear$", 1, "d", 0),
		RE("^mislead$", 4, "led", 0),
		RE("^misunderstand$", 3, "ood", 0),
		RE("^outbreed$", 4, "red", 0),
		RE("^outrun$", 3, "ran", 0),
		RE("^outride$", 1, "den", 0),
		RE("^outshine$", 3, "one", 0),
		RE("^outshoot$", 4, "hot", 0),
		RE("^outstand$", 3, "ood", 0),
		RE("^outthink$", 3, "ought", 0),
		RE("^outgo$", 2, "went", 0),
		RE("^overbear$", 3, "orne", 0),
		RE("^overbuild$", 3, "ilt", 0),
		RE("^overcome$", 3, "ame", 0),
		RE("^overfly$", 2, "lew", 0),
		RE("^overhear$", 2, "ard", 0),
		RE("^overlie$", 2, "ain", 0),
		RE("^overrun$", 3, "ran", 0),
		RE("^override$", 1, "den", 0),
		RE("^overshoot$", 4, "hot", 0),
		RE("^overwind$", 3, "ound", 0),
		RE("^overwrite$", 1, "ten", 0),
		RE("^plead$", 2, "d", 0),
		//RE("^run$", 3, "ran", 0), //DH
		//RE("^rerun$", 3, "run", 0),
		RE("^rebuild$", 3, "ilt", 0),
		RE("^red$", 3, "red", 0),
		RE("^redo$", 1, "one", 0),
		RE("^remake$", 3, "ade", 0),
		RE("^resit$", 3, "sat", 0),
		RE("^rethink$", 3, "ought", 0),
		RE("^rewind$", 3, "ound", 0),
		RE("^rewrite$", 1, "ten", 0),
		RE("^ride$", 1, "den", 0),
		RE("^reeve$", 4, "ove", 0),
		RE("^sit$", 3, "sat", 0),
		RE("^shoe$", 3, "hod", 0),
		RE("^shine$", 3, "one", 0),
		RE("^shoot$", 4, "hot", 0),
		RE("^ski$", 1, "i'd", 0),
		RE("^slide$", 1, "den", 0),
		RE("^smite$", 1, "ten", 0),
		RE("^seek$", 3, "ought", 0),
		RE("^spit$", 3, "pat", 0),
		RE("^speed$", 4, "ped", 0),
		RE("^spellbind$", 3, "ound", 0),
		RE("^spoil$", 2, "ilt", 0),
		RE("^spotlight$", 5, "lit", 0),
		RE("^spin$", 3, "pun", 0),
		RE("^steal$", 3, "olen", 0),
		RE("^stand$", 3, "ood", 0),
		RE("^stave$", 3, "ove", 0),
		RE("^stride$", 1, "den", 0),
		RE("^strike$", 3, "uck", 0),
		RE("^stick$", 3, "uck", 0),
		RE("^swell$", 3, "ollen", 0),
		RE("^swim$", 3, "wum", 0),
		RE("^teach$", 4, "aught", 0),
		RE("^think$", 3, "ought", 0),
		RE("^tread$", 3, "odden", 0),
		RE("^typewrite$", 1, "ten", 0),
		RE("^unbind$", 3, "ound", 0),
		RE("^underbuy$", 2, "ought", 0),
		RE("^undergird$", 3, "irt", 0),
		RE("^undergo$", 1, "one", 0),
		RE("^underlie$", 2, "ain", 0),
		RE("^undershoot$", 4, "hot", 0),
		RE("^understand$", 3, "ood", 0),
		RE("^unfreeze$", 4, "ozen", 0),
		RE("^unlearn", 0, "t", 0),
		RE("^unmake$", 3, "ade", 0),
		RE("^unreeve$", 4, "ove", 0),
		RE("^unstick$", 3, "uck", 0),
		RE("^unteach$", 4, "aught", 0),
		RE("^unthink$", 3, "ought", 0),
		RE("^untread$", 3, "odden", 0),
		RE("^unwind$", 3, "ound", 0),
		RE("^upbuild$", 1, "t", 0),
		RE("^uphold$", 3, "eld", 0),
		RE("^upheave$", 4, "ove", 0),
		RE("^waylay$", 2, "ain", 0),
		RE("^whipsaw$", 2, "awn", 0),
		RE("^withhold$", 3, "eld", 0),
		RE("^withstand$", 3, "ood", 0),
		RE("^win$", 3, "won", 0),
		RE("^wind$", 3, "ound", 0),
		RE("^weave$", 4, "oven", 0),
		RE("^write$", 1, "ten", 0),
		RE("^trek$", 1, "cked", 0),
		RE("^ko$", 1, "o'd", 0),
		RE("^win$", 2, "on", 0),
		
		RE("e$", 0, "d", 1),
		
		// Null past forms
		RE("^" + VERBAL_PREFIX
		+ "?(cast|thrust|typeset|cut|bid|upset|wet|bet|cut|hit|hurt|inset|let|cost|burst|beat|beset|set|upset|hit|offset|put|quit|"
		+ "wed|typeset|wed|spread|split|slit|read|run|rerun|shut|shed)$", 0, E, 0)

		],
			
		PAST_TENSE_RULES = [
							RE("^(reduce)$", 0, "d", 0),
			RE("e$", 0, "d", 1),
			RE("^" + VERBAL_PREFIX + "?[pls]ay$", 1, "id", 1),
			RE(CONS + "y$", 1, "ied", 1),
			RE("^(fling|cling|hang)$", 3, "ung", 0),
			RE("(([sfc][twlp]?r?|w?r)ing)$", 3, "ang", 1),
			RE("^" + VERBAL_PREFIX + "?(bend|spend|send|lend|spend)$", 1, "t", 0),
			RE("^" + VERBAL_PREFIX + "?lie$", 2, "ay", 0),
			RE("^" + VERBAL_PREFIX + "?(weep|sleep|sweep|creep|keep)$", 2, "pt",
			0),
			RE("^" + VERBAL_PREFIX + "?(sell|tell)$", 3, "old", 0),
			RE("^" + VERBAL_PREFIX + "?do$", 1, "id", 0),
			RE("^" + VERBAL_PREFIX + "?dig$", 2, "ug", 0),
			RE("^behave$", 0, "d", 0),
			RE("^(have)$", 2, "d", 0),
			RE("(sink|drink)$", 3, "ank", 0),
			RE("^swing$", 3, "ung", 0),
			RE("^be$", 2, "was", 0),
			RE("^outfight$", 4, "ought", 0),
			RE("^tarmac", 0, "ked", 0),
			RE("^abide$", 3, "ode", 0),
			RE("^aby$", 1, "ought", 0),
			RE("^become$", 3, "ame", 0),
			RE("^begird$", 3, "irt", 0),
			RE("^outlie$", 2, "ay", 0),
			RE("^rebind$", 3, "ound", 0),
			RE("^shit$", 3, "hat", 0),
			RE("^bereave$", 4, "eft", 0),
			RE("^foreswear$", 3, "ore", 0),
			RE("^bename$", 3, "empt", 0),
			RE("^beseech$", 4, "ought", 0),
			RE("^bethink$", 3, "ought", 0),
			RE("^bleed$", 4, "led", 0),
			RE("^bog-down$", 5, "ged-down", 0),
			RE("^buy$", 2, "ought", 0),
			RE("^bind$", 3, "ound", 0),
			RE("^(.*)feed$", 4, "fed", 0),
			RE("^breed$", 4, "red", 0),
			RE("^brei$", 2, "eid", 0),
			RE("^bring$", 3, "ought", 0),
			RE("^build$", 3, "ilt", 0),
			RE("^come$", 3, "ame", 0),
			RE("^catch$", 3, "ught", 0),
			RE("^clothe$", 5, "lad", 0),
			RE("^crossbreed$", 4, "red", 0),
			RE("^deal$", 2, "alt", 0),
			RE("^dow$", 1, "ught", 0),
			RE("^dream$", 2, "amt", 0),
			RE("^dwell$", 3, "elt", 0),
			RE("^enwind$", 3, "ound", 0),
			RE("^feel$", 3, "elt", 0),
			RE("^flee$", 3, "led", 0),
			RE("^floodlight$", 5, "lit", 0),
			RE("^arise$", 3, "ose", 0),
			RE("^eat$", 3, "ate", 0),
			RE("^backbite$", 4, "bit", 0),
			RE("^backslide$", 4, "lid", 0),
			RE("^befall$", 3, "ell", 0),
			RE("^begin$", 3, "gan", 0),
			RE("^beget$", 3, "got", 0),
			RE("^behold$", 3, "eld", 0),
			RE("^bespeak$", 3, "oke", 0),
			RE("^bestride$", 3, "ode", 0),
			RE("^betake$", 3, "ook", 0),
			RE("^bite$", 4, "bit", 0),
			RE("^blow$", 3, "lew", 0),
			RE("^bear$", 3, "ore", 0),
			RE("^break$", 3, "oke", 0),
			RE("^choose$", 4, "ose", 0),
			RE("^cleave$", 4, "ove", 0),
			RE("^countersink$", 3, "ank", 0),
			RE("^drink$", 3, "ank", 0),
			RE("^draw$", 3, "rew", 0),
			RE("^drive$", 3, "ove", 0),
			RE("^fall$", 3, "ell", 0),
			RE("^fly$", 2, "lew", 0),
			RE("^flyblow$", 3, "lew", 0),
			RE("^forbid$", 2, "ade", 0),
			RE("^forbear$", 3, "ore", 0),
			RE("^foreknow$", 3, "new", 0),
			RE("^foresee$", 3, "saw", 0),
			RE("^forespeak$", 3, "oke", 0),
			RE("^forego$", 2, "went", 0),
			RE("^forgive$", 3, "ave", 0),
			RE("^forget$", 3, "got", 0),
			RE("^forsake$", 3, "ook", 0),
			RE("^forspeak$", 3, "oke", 0),
			RE("^forswear$", 3, "ore", 0),
			RE("^forgo$", 2, "went", 0),
			RE("^fight$", 4, "ought", 0),
			RE("^find$", 3, "ound", 0),
			RE("^freeze$", 4, "oze", 0),
			RE("^give$", 3, "ave", 0),
			RE("^geld$", 3, "elt", 0),
			RE("^gen-up$", 3, "ned-up", 0),
			RE("^ghostwrite$", 3, "ote", 0),
			RE("^get$", 3, "got", 0),
			RE("^grow$", 3, "rew", 0),
			RE("^grind$", 3, "ound", 0),
			RE("^hear$", 2, "ard", 0),
			RE("^hold$", 3, "eld", 0),
			RE("^hide$", 4, "hid", 0),
			RE("^honey$", 2, "ied", 0),
			RE("^inbreed$", 4, "red", 0),
			RE("^indwell$", 3, "elt", 0),
			RE("^interbreed$", 4, "red", 0),
			RE("^interweave$", 4, "ove", 0),
			RE("^inweave$", 4, "ove", 0),
			RE("^ken$", 2, "ent", 0),
			RE("^kneel$", 3, "elt", 0),
			RE("^^know$$", 3, "new", 0),
			RE("^leap$", 2, "apt", 0),
			RE("^learn$", 2, "rnt", 0),
			RE("^lead$", 4, "led", 0),
			RE("^leave$", 4, "eft", 0),
			RE("^light$", 5, "lit", 0),
			RE("^lose$", 3, "ost", 0),
			RE("^make$", 3, "ade", 0),
			RE("^mean$", 2, "ant", 0),
			RE("^meet$", 4, "met", 0),
			RE("^misbecome$", 3, "ame", 0),
			RE("^misdeal$", 2, "alt", 0),
			RE("^misgive$", 3, "ave", 0),
			RE("^mishear$", 2, "ard", 0),
			RE("^mislead$", 4, "led", 0),
			RE("^mistake$", 3, "ook", 0),
			RE("^misunderstand$", 3, "ood", 0),
			RE("^outbreed$", 4, "red", 0),
			RE("^outgrow$", 3, "rew", 0),
			RE("^outride$", 3, "ode", 0),
			RE("^outshine$", 3, "one", 0),
			RE("^outshoot$", 4, "hot", 0),
			RE("^outstand$", 3, "ood", 0),
			RE("^outthink$", 3, "ought", 0),
			RE("^outgo$", 2, "went", 0),
			RE("^outwear$", 3, "ore", 0),
			RE("^overblow$", 3, "lew", 0),
			RE("^overbear$", 3, "ore", 0),
			RE("^overbuild$", 3, "ilt", 0),
			RE("^overcome$", 3, "ame", 0),
			RE("^overdraw$", 3, "rew", 0),
			RE("^overdrive$", 3, "ove", 0),
			RE("^overfly$", 2, "lew", 0),
			RE("^overgrow$", 3, "rew", 0),
			RE("^overhear$", 2, "ard", 0),
			RE("^overpass$", 3, "ast", 0),
			RE("^override$", 3, "ode", 0),
			RE("^oversee$", 3, "saw", 0),
			RE("^overshoot$", 4, "hot", 0),
			RE("^overthrow$", 3, "rew", 0),
			RE("^overtake$", 3, "ook", 0),
			RE("^overwind$", 3, "ound", 0),
			RE("^overwrite$", 3, "ote", 0),
			RE("^partake$", 3, "ook", 0),
			RE("^" + VERBAL_PREFIX + "?run$", 2, "an", 0),
			RE("^ring$", 3, "ang", 0),
			RE("^rebuild$", 3, "ilt", 0),
			RE("^red", 0, E, 0),
			RE("^reave$", 4, "eft", 0),
			RE("^remake$", 3, "ade", 0),
			RE("^resit$", 3, "sat", 0),
			RE("^rethink$", 3, "ought", 0),
			RE("^retake$", 3, "ook", 0),
			RE("^rewind$", 3, "ound", 0),
			RE("^rewrite$", 3, "ote", 0),
			RE("^ride$", 3, "ode", 0),
			RE("^rise$", 3, "ose", 0),
			RE("^reeve$", 4, "ove", 0),
			RE("^sing$", 3, "ang", 0),
			RE("^sink$", 3, "ank", 0),
			RE("^sit$", 3, "sat", 0),
			RE("^see$", 3, "saw", 0),
			RE("^shoe$", 3, "hod", 0),
			RE("^shine$", 3, "one", 0),
			RE("^shake$", 3, "ook", 0),
			RE("^shoot$", 4, "hot", 0),
			RE("^shrink$", 3, "ank", 0),
			RE("^shrive$", 3, "ove", 0),
			RE("^sightsee$", 3, "saw", 0),
			RE("^ski$", 1, "i'd", 0),
			RE("^skydive$", 3, "ove", 0),
			RE("^slay$", 3, "lew", 0),
			RE("^slide$", 4, "lid", 0),
			RE("^slink$", 3, "unk", 0),
			RE("^smite$", 4, "mit", 0),
			RE("^seek$", 3, "ought", 0),
			RE("^spit$", 3, "pat", 0),
			RE("^speed$", 4, "ped", 0),
			RE("^spellbind$", 3, "ound", 0),
			RE("^spoil$", 2, "ilt", 0),
			RE("^speak$", 3, "oke", 0),
			RE("^spotlight$", 5, "lit", 0),
			RE("^spring$", 3, "ang", 0),
			RE("^spin$", 3, "pun", 0),
			RE("^stink$", 3, "ank", 0),
			RE("^steal$", 3, "ole", 0),
			RE("^stand$", 3, "ood", 0),
			RE("^stave$", 3, "ove", 0),
			RE("^stride$", 3, "ode", 0),
			RE("^strive$", 3, "ove", 0),
			RE("^strike$", 3, "uck", 0),
			RE("^stick$", 3, "uck", 0),
			RE("^swim$", 3, "wam", 0),
			RE("^swear$", 3, "ore", 0),
			RE("^teach$", 4, "aught", 0),
			RE("^think$", 3, "ought", 0),
			RE("^throw$", 3, "rew", 0),
			RE("^take$", 3, "ook", 0),
			RE("^tear$", 3, "ore", 0),
			RE("^transship$", 4, "hip", 0),
			RE("^tread$", 4, "rod", 0),
			RE("^typewrite$", 3, "ote", 0),
			RE("^unbind$", 3, "ound", 0),
			RE("^unclothe$", 5, "lad", 0),
			RE("^underbuy$", 2, "ought", 0),
			RE("^undergird$", 3, "irt", 0),
			RE("^undershoot$", 4, "hot", 0),
			RE("^understand$", 3, "ood", 0),
			RE("^undertake$", 3, "ook", 0),
			RE("^undergo$", 2, "went", 0),
			RE("^underwrite$", 3, "ote", 0),
			RE("^unfreeze$", 4, "oze", 0),
			RE("^unlearn$", 2, "rnt", 0),
			RE("^unmake$", 3, "ade", 0),
			RE("^unreeve$", 4, "ove", 0),
			RE("^unspeak$", 3, "oke", 0),
			RE("^unstick$", 3, "uck", 0),
			RE("^unswear$", 3, "ore", 0),
			RE("^unteach$", 4, "aught", 0),
			RE("^unthink$", 3, "ought", 0),
			RE("^untread$", 4, "rod", 0),
			RE("^unwind$", 3, "ound", 0),
			RE("^upbuild$", 3, "ilt", 0),
			RE("^uphold$", 3, "eld", 0),
			RE("^upheave$", 4, "ove", 0),
			RE("^uprise$", 3, "ose", 0),
			RE("^upspring$", 3, "ang", 0),
			RE("^go$", 2, "went", 0),
			RE("^wiredraw$", 3, "rew", 0),
			RE("^withdraw$", 3, "rew", 0),
			RE("^withhold$", 3, "eld", 0),
			RE("^withstand$", 3, "ood", 0),
			RE("^wake$", 3, "oke", 0),
			RE("^win$", 3, "won", 0),
			RE("^wear$", 3, "ore", 0),
			RE("^wind$", 3, "ound", 0),
			RE("^weave$", 4, "ove", 0),
			RE("^write$", 3, "ote", 0),
			RE("^trek$", 1, "cked", 0),
			RE("^ko$", 1, "o'd", 0),
			RE("^bid", 2, "ade", 0),
			RE("^win$", 2, "on", 0),
			RE("^swim", 2, "am", 0),
			
			// Null past forms
			RE("^" + VERBAL_PREFIX
				+ "?(cast|thrust|typeset|cut|bid|upset|wet|bet|cut|hit|hurt|inset|"
				+ "let|cost|burst|beat|beset|set|upset|offset|put|quit|wed|typeset|"
				+ "wed|spread|split|slit|read|run|shut|shed|lay)$", 0, E, 0) ],

		PRESENT_TENSE_RULES = [ 
			RE("^aby$", 0, "es", 0),
			RE("^bog-down$", 5, "s-down", 0),
			RE("^chivy$", 1, "vies", 0),
			RE("^gen-up$", 3, "s-up", 0),
			RE("^prologue$", 3, "gs", 0),
			RE("^picknic$", 0, "ks", 0),
			//RE("^swim$", 0, "s", 0), 
			RE("^ko$", 0, "'s", 0),
			RE("[osz]$", 0, "es", 1), 
			RE("^have$", 2, "s", 0),
			RE(CONS + "y$", 1, "ies", 1), 
			RE("^be$", 2, "is"),
			RE("([zsx]|ch|sh)$", 0, "es", 1) 
		],

		VERB_CONS_DOUBLING = [ "abat", "abet", "abhor", "abut", "accur", "acquit", "adlib",
		   "admit", "aerobat", "aerosol", "agendaset", "allot", "alot", "anagram",
		   "annul", "appal", "apparel", "armbar", "aver", "babysit", "airdrop", "appal",
		   "blackleg", "bobsled", "bur", "chum", "confab", "counterplot", "curet", "dib",
		   "backdrop", "backfil", "backflip", "backlog", "backpedal", "backslap",
		   "backstab", "bag", "balfun", "ballot", "ban", "bar", "barbel", "bareleg",
		   "barrel", "bat", "bayonet", "becom", "bed", "bedevil", "bedwet", "beenhop",
		   "befit", "befog", "beg", "beget", "begin", "bejewel", "bemedal", "benefit",
		   "benum", "beset", "besot", "bestir", "bet", "betassel", "bevel", "bewig",
		   "bib", "bid", "billet", "bin", "bip", "bit", "bitmap", "blab", "blag", "blam",
		   "blan", "blat", "bles", "blim", "blip", "blob", "bloodlet", "blot", "blub",
		   "blur", "bob", "bodypop", "bog", "booby-trap", "boobytrap", "booksel",
		   "bootleg", "bop", "bot", "bowel", "bracket", "brag", "brig", "brim", "bud",
		   "buffet", "bug", "bullshit", "bum", "bun", "bus", "but", "cab", "cabal", "cam",
		   "can", "cancel", "cap", "caracol", "caravan", "carburet", "carnap", "carol",
		   "carpetbag", "castanet", "cat", "catcal", "catnap", "cavil", "chan", "chanel",
		   "channel", "chap", "char", "chargecap", "chat", "chin", "chip", "chir",
		   "chirrup", "chisel", "chop", "chug", "chur", "clam", "clap", "clearcut",
		   "clip", "clodhop", "clog", "clop", "closet", "clot", "club", "co-occur",
		   "co-program", "co-refer", "co-run", "co-star", "cob", "cobweb", "cod", "coif",
		   "com", "combat", "comit", "commit", "compel", "con", "concur", "confer",
		   "confiscat", "control", "cop", "coquet", "coral", "corbel", "corral", "cosset",
		   "cotransmit", "councel", "council", "counsel", "court-martial", "crab", "cram",
		   "crap", "crib", "crop", "crossleg", "cub", "cudgel", "cum", "cun", "cup",
		   "cut", "dab", "dag", "dam", "dan", "dap", "daysit", "de-control", "de-gazet",
		   "de-hul", "de-instal", "de-mob", "de-program", "de-rig", "de-skil", "deadpan",
		   "debag", "debar", "log", "decommit", "decontrol", "defer", "defog", "deg",
		   "degas", "deinstal", "demit", "demob", "demur", "den", "denet", "depig",
		   "depip", "depit", "der", "deskil", "deter", "devil", "diagram", "dial", "dig",
		   "dim", "din", "dip", "disbar", "disbud", "discomfit", "disembed", "disembowel",
		   "dishevel", "disinter", "dispel", "disprefer", "distil", "dog", "dognap",
		   "don", "doorstep", "dot", "dowel", "drag", "drat", "driftnet", "distil",
		   "egotrip", "enrol", "enthral", "extol", "fulfil", "gaffe", "golliwog", "idyl",
		   "inspan", "drip", "drivel", "drop", "drub", "drug", "drum", "dub", "duel",
		   "dun", "dybbuk", "earwig", "eavesdrop", "ecolabel", "eitherspigot",
		   "electroblot", "embed", "emit", "empanel", "enamel", "endlabel", "endtrim",
		   "enrol", "enthral", "entrammel", "entrap", "enwrap", "equal", "equip", "estop",
		   "exaggerat", "excel", "expel", "extol", "fag", "fan", "farewel", "fat",
		   "featherbed", "feget", "fet", "fib", "fig", "fin", "fingerspel", "fingertip",
		   "fit", "flab", "flag", "flap", "flip", "flit", "flog", "flop", "fob", "focus",
		   "fog", "footbal", "footslog", "fop", "forbid", "forget", "format",
		   "fortunetel", "fot", "foxtrot", "frag", "freefal", "fret", "frig", "frip",
		   "frog", "frug", "fuel", "fufil", "fulfil", "fullyfit", "fun", "funnel", "fur",
		   "furpul", "gab", "gad", "gag", "gam", "gambol", "gap", "garot", "garrot",
		   "gas", "gat", "gel", "gen", "get", "giftwrap", "gig", "gimbal", "gin", "glam",
		   "glenden", "glendin", "globetrot", "glug", "glut", "gob", "goldpan", "goostep",
		   "gossip", "grab", "gravel", "grid", "grin", "grip", "grit", "groundhop",
		   "grovel", "grub", "gum", "gun", "gunrun", "gut", "gyp", "haircut", "ham",
		   "han", "handbag", "handicap", "handknit", "handset", "hap", "hareleg", "hat",
		   "headbut", "hedgehop", "hem", "hen", "hiccup", "highwal", "hip", "hit",
		   "hobnob", "hog", "hop", "horsewhip", "hostel", "hot", "hotdog", "hovel", "hug",
		   "hum", "humbug", "hup", "hushkit", "hut", "illfit", "imbed", "immunblot",
		   "immunoblot", "impannel", "impel", "imperil", "incur", "infer", "infil",
		   "inflam", "initial", "input", "inset", "instil", "inter", "interbed",
		   "intercrop", "intercut", "interfer", "instal", "instil", "intermit", "japan",
		   "jug", "kris", "manumit", "mishit", "mousse", "mud", "interwar", "jab", "jag",
		   "jam", "jar", "jawdrop", "jet", "jetlag", "jewel", "jib", "jig", "jitterbug",
		   "job", "jog", "jog-trot", "jot", "jut", "ken", "kennel", "kid", "kidnap",
		   "kip", "kissogram", "kit", "knap", "kneecap", "knit", "knob", "knot", "kor",
		   "label", "lag", "lam", "lap", "lavel", "leafcut", "leapfrog", "leg", "lem",
		   "lep", "let", "level", "libel", "lid", "lig", "lip", "lob", "log", "lok",
		   "lollop", "longleg", "lop", "lowbal", "lug", "mackerel", "mahom", "man", "map",
		   "mar", "marshal", "marvel", "mat", "matchwin", "metal", "micro-program",
		   "microplan", "microprogram", "milksop", "mis-cal", "mis-club", "mis-spel",
		   "miscal", "mishit", "mislabel", "mit", "mob", "mod", "model", "mohmam",
		   "monogram", "mop", "mothbal", "mug", "multilevel", "mum", "nab", "nag", "nan",
		   "nap", "net", "nightclub", "nightsit", "nip", "nod", "nonplus", "norkop",
		   "nostril", "not", "nut", "nutmeg", "occur", "ocur", "offput", "offset", "omit",
		   "ommit", "onlap", "out-general", "out-gun", "out-jab", "out-plan", "out-pol",
		   "out-pul", "out-put", "out-run", "out-sel", "outbid", "outcrop", "outfit",
		   "outgas", "outgun", "outhit", "outjab", "outpol", "output", "outrun",
		   "outship", "outshop", "outsin", "outstrip", "outswel", "outspan", "overcrop",
		   "pettifog", "photostat", "pouf", "preset", "prim", "pug", "ret", "rosin",
		   "outwit", "over-commit", "over-control", "over-fil", "over-fit", "over-lap",
		   "over-model", "over-pedal", "over-pet", "over-run", "over-sel", "over-step",
		   "over-tip", "over-top", "overbid", "overcal", "overcommit", "overcontrol",
		   "overcrap", "overdub", "overfil", "overhat", "overhit", "overlap", "overman",
		   "overplot", "overrun", "overshop", "overstep", "overtip", "overtop", "overwet",
		   "overwil", "pad", "paintbal", "pan", "panel", "paperclip", "par", "parallel",
		   "parcel", "partiescal", "pat", "patrol", "pedal", "peewit", "peg", "pen",
		   "pencil", "pep", "permit", "pet", "petal", "photoset", "phototypeset", "phut",
		   "picket", "pig", "pilot", "pin", "pinbal", "pip", "pipefit", "pipet", "pit",
		   "plan", "plit", "plod", "plop", "plot", "plug", "plumet", "plummet", "pod",
		   "policyset", "polyfil", "ponytrek", "pop", "pot", "pram", "prebag",
		   "predistil", "predril", "prefer", "prefil", "preinstal", "prep", "preplan",
		   "preprogram", "prizewin", "prod", "profer", "prog", "program", "prop",
		   "propel", "pub", "pummel", "pun", "pup", "pushfit", "put", "quarel", "quarrel",
		   "quickskim", "quickstep", "quickwit", "quip", "quit", "quivertip", "quiz",
		   "rabbit", "rabit", "radiolabel", "rag", "ram", "ramrod", "rap", "rat",
		   "ratecap", "ravel", "re-admit", "re-cal", "re-cap", "re-channel", "re-dig",
		   "re-dril", "re-emit", "re-fil", "re-fit", "re-flag", "re-format", "re-fret",
		   "re-hab", "re-instal", "re-inter", "re-lap", "re-let", "re-map", "re-metal",
		   "re-model", "re-pastel", "re-plan", "re-plot", "re-plug", "re-pot",
		   "re-program", "re-refer", "re-rig", "re-rol", "re-run", "re-sel", "re-set",
		   "re-skin", "re-stal", "re-submit", "re-tel", "re-top", "re-transmit",
		   "re-trim", "re-wrap", "readmit", "reallot", "rebel", "rebid", "rebin", "rebut",
		   "recap", "rechannel", "recommit", "recrop", "recur", "recut", "red", "redril",
		   "refer", "refit", "reformat", "refret", "refuel", "reget", "regret", "reinter",
		   "rejig", "rekit", "reknot", "relabel", "relet", "rem", "remap", "remetal",
		   "remit", "remodel", "reoccur", "rep", "repel", "repin", "replan", "replot",
		   "repol", "repot", "reprogram", "rerun", "reset", "resignal", "resit", "reskil",
		   "resubmit", "retransfer", "retransmit", "retro-fit", "retrofit", "rev",
		   "revel", "revet", "rewrap", "rib", "richochet", "ricochet", "rid", "rig",
		   "rim", "ringlet", "rip", "rit", "rival", "rivet", "roadrun", "rob", "rocket",
		   "rod", "roset", "rot", "rowel", "rub", "run", "runnel", "rut", "sab", "sad",
		   "sag", "sandbag", "sap", "scab", "scalpel", "scam", "scan", "scar", "scat",
		   "schlep", "scrag", "scram", "shall", "sled", "smut", "stet", "sulfuret",
		   "trepan", "unrip", "unstop", "whir", "whop", "wig", "scrap", "scrat", "scrub",
		   "scrum", "scud", "scum", "scur", "semi-control", "semi-skil", "semi-skim",
		   "semiskil", "sentinel", "set", "shag", "sham", "shed", "shim", "shin", "ship",
		   "shir", "shit", "shlap", "shop", "shopfit", "shortfal", "shot", "shovel",
		   "shred", "shrinkwrap", "shrivel", "shrug", "shun", "shut", "side-step",
		   "sideslip", "sidestep", "signal", "sin", "sinbin", "sip", "sit", "skid",
		   "skim", "skin", "skip", "skir", "skrag", "slab", "slag", "slam", "slap",
		   "slim", "slip", "slit", "slob", "slog", "slop", "slot", "slowclap", "slug",
		   "slum", "slur", "smit", "snag", "snap", "snip", "snivel", "snog", "snorkel",
		   "snowcem", "snub", "snug", "sob", "sod", "softpedal", "son", "sop", "spam",
		   "span", "spar", "spat", "spiderweb", "spin", "spiral", "spit", "splat",
		   "split", "spot", "sprag", "spraygun", "sprig", "springtip", "spud", "spur",
		   "squat", "squirrel", "stab", "stag", "star", "stem", "sten", "stencil", "step",
		   "stir", "stop", "storytel", "strap", "strim", "strip", "strop", "strug",
		   "strum", "strut", "stub", "stud", "stun", "sub", "subcrop", "sublet", "submit",
		   "subset", "suedetrim", "sum", "summit", "sun", "suntan", "sup", "super-chil",
		   "superad", "swab", "swag", "swan", "swap", "swat", "swig", "swim", "swivel",
		   "swot", "tab", "tag", "tan", "tansfer", "tap", "tar", "tassel", "tat", "tefer",
		   "teleshop", "tendril", "terschel", "th'strip", "thermal", "thermostat", "thin",
		   "throb", "thrum", "thud", "thug", "tightlip", "tin", "tinsel", "tip", "tittup",
		   "toecap", "tog", "tom", "tomorrow", "top", "tot", "total", "towel", "traget",
		   "trainspot", "tram", "trammel", "transfer", "tranship", "transit", "transmit",
		   "transship", "trap", "travel", "trek", "trendset", "trim", "trip", "tripod",
		   "trod", "trog", "trot", "trousseaushop", "trowel", "trup", "tub", "tug",
		   "tunnel", "tup", "tut", "twat", "twig", "twin", "twit", "typeset", "tyset",
		   "un-man", "unban", "unbar", "unbob", "uncap", "unclip", "uncompel", "undam",
		   "under-bil", "under-cut", "under-fit", "under-pin", "under-skil", "underbid",
		   "undercut", "underlet", "underman", "underpin", "unfit", "unfulfil", "unknot",
		   "unlip", "unlywil", "unman", "unpad", "unpeg", "unpin", "unplug", "unravel",
		   "unrol", "unscrol", "unsnap", "unstal", "unstep", "unstir", "untap", "unwrap",
		   "unzip", "up", "upset", "upskil", "upwel", "ven", "verbal", "vet", "victual",
		   "vignet", "wad", "wag", "wainscot", "wan", "war", "water-log", "waterfal",
		   "waterfil", "waterlog", "weasel", "web", "wed", "wet", "wham", "whet", "whip",
		   "whir", "whiteskin", "whiz", "whup", "wildcat", "win", "windmil", "wit",
		   "woodchop", "woodcut", "wor", "worship", "wrap", "wiretap", "yen", "yak",
		   "yap", "yarnspin", "yip", "yodel", "zag", "zap", "zig", "zig-zag", "zigzag",
		   "zip", "ztrip", "hand-bag", "hocus", "hocus-pocus" ],

	PAST_PARTICIPLE_RULESET = {
		name : "PAST_PARTICIPLE",
		defaultRule : RE(ANY_STEM, 0, "ed", 2),
		rules : PAST_PARTICIPLE_RULES,
		doubling : true
	},

	PRESENT_PARTICIPLE_RULESET = {
		name : "ING_FORM",
		defaultRule : RE(ANY_STEM, 0, "ing", 2),
		rules : ING_FORM_RULES,
		doubling : true
	},

	PAST_TENSE_RULESET = {
		name : "PAST_TENSE",
		defaultRule : RE(ANY_STEM, 0, "ed", 2),
		rules : PAST_TENSE_RULES,
		doubling : true
	},

	PRESENT_TENSE_RULESET = {
		name : "PRESENT_TENSE",
		defaultRule : RE(ANY_STEM, 0, "s", 2),
		rules : PRESENT_TENSE_RULES,
		doubling : false
	};

	// ////////////////////////////////////////////////////////////
	// Global util functions (private)
	// ////////////////////////////////////////////////////////////

	function toColArr(obj, overrideAlpha) {
		var a = (typeof overrideAlpha === 'undefined') ? obj.a || 255 : overrideAlpha;
		return [ obj.r, obj.g, obj.b, a ];
	}
	
	function isNum(n) {
		
	  return !isNaN(parseFloat(n)) && isFinite(n);
	}
	
	function okeys(obj) {
	
		var keys = [];  // replaces Object.keys();
		for(var k in obj) keys.push(k);
		return keys;
	}
   
	function dump(obj) {

		var properties = E;
		for ( var propertyName in obj) {

			properties += propertyName + ": ";

			// Check if its NOT a function
			if (!(obj[propertyName] instanceof Function)) {
				properties += obj.propertyName;
			} else {
				properties += "function()";
			}
			properties += ", ";
		}
		return properties;
	}

	function undef(obj) {
		
		return (typeof obj=='undefined' || obj == null || !obj);
	}

	function err(msg) {
		
		console.log("err(msg) :: "+typeof console.trace);
		
		(!RiTa.SILENT) && console && console.trace(this);
		
		throw Error("[RiTa] " + msg);
	}
	
	function warn() {
		
		if (RiTa.SILENT || !console) return;
		
		if (arguments && arguments.length) {
			console.warn("[WARN] "+arguments[0]);
			for (var i = 1; i < arguments.length; i++) 
				console.warn('  '+arguments[i]);
		}
	}
 
	function log() {
	
		if (RiTa.SILENT || !console) return;        
		
		for ( var i = 0; i < arguments.length; i++) 
			console.log(arguments[i]);
	}

	function strOk(str) {
		
		return (typeof str === S && str.length > 0);
	}

	function trim(str) {
		
		// faster version from: http://blog.stevenlevithan.com/archives/faster-trim-javascript
		return str.replace(/^\s\s*/, '').replace(/\s\s*$/, ''); 
		//return str.replace(/^\s*(\S*(?:\s+\S+)*)\s*$/, "$1");
	}

	function last(word) { // last char of string
		
		if (!word || !word.length) return E;
		return word.charAt(word.length-1);
	}

	function extend(l1,l2) { // python extend
		
		for (var i = 0; i < l2.length; i++) {
		 
			l1.push(l2[i]);
		}
	}

    // TODO: remove
	function replaceAll(theText, replace, withThis) {
		
		return theText && is(replace, S) ?  
			theText.replace(new RegExp(replace, 'g'), withThis) : theText;
	}

	// TODO: replace body w regex?
	function endsWith(str, ending) { 
		
		if (!is(str,S)) return false;
		return str.slice(-ending.length) == ending;
	}
	
	// TODO: replace body w regex?	
	function startsWith(text, substr) {

		if (!is(text,S)) return false;
		return text.slice(0, substr.length) == substr;
	}
	
	function err(msg) {
		throw Error("[RiTa] "+msg);
	}
	
	function equalsIgnoreCase(str1, str2) {
		
		return (is(str1,S) && is(str2,S)) ?
			(str1.toLowerCase() === str2.toLowerCase()) : false;
	}

	function makeClass() { // By John Resig (MIT Licensed)

		return function(args) {
			
			if (this instanceof arguments.callee) {

				if (typeof this.init == "function") {
					
					this.init.apply(this, args && args.callee ? args : arguments);
				}
			} 
			else {
				return new arguments.callee(arguments);
			}
		};
	}
	
	function parseColor() {
   
		var a = arguments, len = a.length;
		
		var alpha = (this && this.alpha) ? this.alpha() : 255;
		
		var color = { r: 0, g: 0, b: 0, a: alpha };

		if (!len) return color;

		if (len == 1 && is(a[0],A)) {
			return parseColor.apply(this, a[0]);
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
	}
	
	function addSpaces(str, num) {
		
		for ( var i = 0; i < num; i++)
			str += " ";
		return str;
	}

	// Arrays ////////////////////////////////////////////////////////////////////////
	
	function shuffle(oldArray) {
		var newArray = oldArray.slice();
		var len = newArray.length;
		var i = len;
		 while (i--) {
			var p = parseInt(Math.random()*len);
			var t = newArray[i];
			newArray[i] = newArray[p];
			newArray[p] = t;
		}
		return newArray; 
	}
			
	/*
	 * Returns true if NodeJS is the current environment
	 */
	function isNode() {
		
		return (typeof module != 'undefined' && module.exports);
	}
	
	// Array Remove - from John Resig (MIT Licensed)
	function remove(array, from, to) { // we have this elsewhere on array proto
		
	  // remove? only used once
	  var rest = array.slice((to || from) + 1 || array.length);
	  array.length = from < 0 ? array.length + from : from;
	  return array.push.apply(array, rest);
	}
 	/*
	function insert(array, item, idx) {
		
	  array.slice(idx,0,item);
	  return array;
	}
	
	function removeFromArray(items, element) {
		
		while (items.indexOf(element) !== -1) {
			items.splice(items.indexOf(element), 1);
		}
	}*/
	
	function inArray(array, val) {
		if (!array) return false;
		return array.indexOf(val)>-1;
	}

	// ///////////////////////////// End Functions ////////////////////////////////////

	var context2d, hasProcessing = (typeof Processing !== 'undefined');
	//log('hasProcessing='+hasProcessing);
	
	// Processing Renderer
	if (hasProcessing) {

		Processing.registerLibrary("RiTa", {
			
			attach : function(p5) {
				//p = p5;
				//log("Processing.registerLibrary.attach");log(p.externals);log(p.externals['canvas']);
				var context2d = p5.externals['canvas'].getContext("2d");
				RiText.renderer = new RiText_P5(p5, context2d);
			}
			/*p : null, 
			init : function(obj) {},
			detach : function(p5) {},
			exports : [] // export global function names?*/
		})
	}
	/* Renderer
	else if (typeof document !== 'undefined') {
		
		var cnv = document.getElementsByTagName('canvas')[0];
		try {
			var context2d = cnv.getContext('2d');
			RiText.renderer = new RiText_Canvas(context2d);
		}
		catch(e) {
			console.warn("[RiTa] No object w' name='canvas' in DOM, renderer unavailable");
		}
	}*/
	else if (isNode()) {
		RiText.renderer = RiText_Node(RiText.defaults.metrics);
	}
	else {
		warn('Unknown Env: not Processing(JS), Node, or Android; renderer is null');
		RiText.renderer = RiText_Node(RiText.defaults.metrics);
	}
	
	if (!RiTa.SILENT)
		console && console.log('[INFO] RiTaJS.version ['+RiTa.VERSION+']');
	
	/////////////////////////////////////////////////////////////////////////////////////////
	// Core RiTa objects (in global namespace)
	/////////////////////////////////////////////////////////////////////////////////////////

	if (window) { // for browser
		
		window['RiTa'] = RiTa;
		window['RiText'] = RiText;
		window['RiString'] = RiString;
		window['RiLexicon'] = RiLexicon;
		window['RiGrammar'] = RiGrammar;
		window['RiMarkov'] = RiMarkov;
		window['RiTaEvent'] = RiTaEvent;
		window['RiWordNet'] = RiWordNet;
	}
	
	if (typeof module != 'undefined' && module.exports) { // for node

		module.exports['RiTa'] = RiTa;		
		module.exports['RiText'] = RiText;
		module.exports['RiString'] = RiString;
		module.exports['RiLexicon'] = RiLexicon;
		module.exports['RiGrammar'] = RiGrammar;
		module.exports['RiMarkov'] = RiMarkov;
		module.exports['RiTaEvent'] = RiTaEvent;
		module.exports['RiWordNet'] = RiWordNet;
		//module.exports['MinEditDist'] = MinEditDist;
	}

	RiTa.p5Compatible(false);

})(typeof window !== 'undefined' ? window : null);

