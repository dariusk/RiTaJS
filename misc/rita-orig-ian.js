/*  Notes/TODO/questions/known bugs:

	RiTa:
		splitSentences(): Can't use the lib from java for sentence parsing.
			Implemented a simple regex. What's a better alternative?

	RiText: Re-add as conditional include
	
		Fix behaviors: Problem with jump after first interpolate()!
		
		Add: fadeToText(string, sec)
		Add: scaleTo(scale, sec)
		Add: rotateTo(radians, sec)  [lets ignore rotate stuff for now]
		
	TextBehavior: Re-add
		timerName: Where is this (where should this be) set by user? [id or name, not both]

	RiLexicon:
		Need to better deal with words not found in dictionary (getStresses, getPhonemes, getSyllables)
		Finish: Get random word by part of speech

	Conjugator:
		Why are exceptions not accurate? Sleep is returning "sleeped" not "slept"
			Why is it apparently only reaching two types of rules?

	Add: RiMarkov

	Add: RiHTMLParser / Google Search / MsNgramClient
		fetch()
		fetchImage()
		Google search good to go, with API key. Should take this as argument

==================================================================================================================
 */

(function() {
	
	// privates ---------------------------------------
	
	var INTEGER_MIN_VALUE = -2147483648;
	var INTEGER_MAX_VALUE = 2147483647;
	  
    function properties(obj) {
        var properties = "";
        for ( var propertyName in obj) {
            // Check if its NOT a function
            if (!(obj[propertyName] instanceof Function)) {
                properties += propertyName + ", ";
            }
        }
        return properties;
    }
    
    function isNull(obj) {
    	return (typeof obj === 'undefined' || obj===null);
    }

    function applicate(obj, props) {
        var i, j;
        for (i in props) {
            obj[i] = props[i];
        }
    }
    function checkMinLen(minLength, dataArray) {
        if (dataArray.length < minLength) {
            throw ("Expecting array of size " + minLength + ", but instead found size: " + dataArray.length);
        }
        return true;
    }
    function cleanArray(dataArray, deleteValue) {

        for ( var i = 0, l = dataArray.length; i < l; i++) {
            if (dataArray[i] === deleteValue) {
                dataArray.splice(i, 1);
                i--;
            }
        }
        return dataArray;
    }
    function endsWith(str, ending) { // test this!
        return (str.match(ending + "$") == ending);
    }
    function equalsIgnoreCase(str1, str2) {
        return (str1.toLowerCase() == str2.toLowerCase());
    }
    function inArray(array, val) {
        var i = array.length;
        while (i--) {
            if (array[i] == val) {
                return true;
            }
        }
        return false;
    }
    function isDigit(num) {
        if (num.length > 1) {
            return false;
        }
        var string = "1234567890";
        if (string.indexOf(num) != -1) {
            return true;
        }
        return false;
    }

    function strOk(str) {
    	return (typeof str === 'string' && str.length > 0);
    }
    function inherit(proto) {
	  function F() {}
	  F.prototype = proto;
	  return new F;
    }
    function assign(obj, defaultValue) {
    	return isNull(obj) ? defaultValue : obj;
    }
    function isNum(str) {
        var j, c;
        j = str.length;
        while (j--) {
            c = word.charAt(j);
            if (!(isDigit(c) || c == '.')) {
                return false;
            }
        }
        return true;
    }    
    function removeFromArray(dataArray, value) {  // BROKEN? TEST ME!!
        var idx = dataArray.indexOf(value);
        if (idx != -1) {
            dataArray.splice(idx, 1);
            return true;
        }
        return false;
    }
    function startsWith(str, prefix) { //TEST ME!!
        return str.indexOf(prefix) === 0;
    }

    function toMs(sec) {
        return sec * 1000;
    }
    function trim(str) {
        return str.replace(/^\s*(\S*(?:\s+\S+)*)\s*$/, "$1");
    }
    function typeOf(value) {
        var s = typeof value;
        if (s === 'object') {
            if (value) {
                if (typeof value.length === 'number' && 
                		!(value.propertyIsEnumerable('length')) && typeof value.splice === 'function') 
                {
                    s = 'array';
                }
            } else {
                s = 'null';
            }
        }
        return s;
    }    
	function replaceAll(theText, replace, withThis) {
		if (typeof theText !== 'string') // for debugging
			throw new Error(theText + " is not a string!");
		return theText.replace(new RegExp(replace, 'g'), withThis);
	}
    
    function handleLeading(font, ritexts, startY, leading) // PApplet specific? no (move to RiText pk)
    {
      if (isNull(ritexts) || ritexts.length < 1) return;

      if (!isNull(font))  ritexts[0].textFont(font);

      // calculate the leading  
      var yOff = ritexts[0].textHeight() * 1.4; // RANDOM_CONSTANT, yuck
      if (leading >= 0) yOff = ritexts[0].textAscent() + leading;
      
      //console.log("handleLeading1("+font.name+"/"+font.size+"/leading:"+yOff+")");

      // handle the line y-spacing
      var nextHeight = startY;
      for ( var i = 0; i < ritexts.length; i++) {
    	if (!isNull(font)) 
    	  ritexts[i].textFont(font); // set the specified font
        ritexts[i].y = nextHeight; // adjust y-pos
        nextHeight += yOff;
      }
    }
    
    // !@# kept outside main library to get around scope problem
    var RegexRule = function RegexRule(regex, offset, suffix) {
        this.regex = new RegExp(regex);
        this.offset = offset;
        this.suffix = suffix;
    };

    RegexRule.prototype = {
        applies : function(word) {
            return this.regex.test(trim(word));
        },
        fire : function(word) {
            return this.truncate(trim(word)) + this.suffix;
        },
        analyze : function(word) {
            return ((suffix != "") && endsWith(word, suffix)) ? true : false;
        },
        truncate : function(word) {
            return (this.offset == 0) ? word : word.substr(0, word.length - this.offset);
        }
    };

    // !@# "RiTaLibrary" here avoids naming problems created by use of the more
    // obvious/intuitive "RiTa" 
    // DELETED 'var RiTaLibrary' DCH, FEB 27 2012
    // THIS NEEDS TO BE CONDITIONAL IF WE ARE USING PROCESSING: DCH
    
    Processing.lib.RiTaLibrary = function() {   // install in 'Processing.lib' namespace?

        // !@# "with()" necessary for now due to pjs
        with (this) 
        {

            // ///////////////
            // Constants //
            // ///////////////

            // !@# references to constants elsewhere in RiTa look like this:
            // RC.LEFT
            RC = {
                
                // from PConstants (DCH: ugly -- how can we use them directly?)
                    
                LEFT:      37,
                UP:        38,
                RIGHT:     39,
                DOWN:      40,

                SLEEP_PER_FRAME_MS : 1000/30, // 30 FPS

                // ==== RiTaEvent ============

                UNKNOWN : -1,
                TEXT_ENTERED : 1,
                BEHAVIOR_COMPLETED : 2,
                TIMER_TICK : 3,

                // ==== TextBehavior ============

                MOVE : 1,
                FADE_COLOR : 2,
                FADE_IN : 3,
                FADE_OUT : 4,
                FADE_TO_TEXT : 5,
                TIMER : 6,
                SCALE_TO : 7,
                LERP : 8,

                // ==== Animation types ============

                LINEAR : 0,
                EASE_IN_OUT : 1,
                EASE_IN : 2,
                EASE_OUT : 3,
                EASE_IN_OUT_CUBIC : 4,
                EASE_IN_CUBIC : 5,
                EASE_OUT_CUBIC : 6,
                EASE_IN_OUT_QUARTIC : 7,
                EASE_IN_QUARTIC : 8,
                EASE_OUT_QUARTIC : 9,
                EASE_IN_OUT_EXPO : 10,
                EASE_IN_EXPO : 11,
                EASE_OUT_EXPO : 12,
                EASE_IN_OUT_SINE : 13,
                EASE_IN_SINE : 14,
                EASE_OUT_SINE : 15,

                // ==== RiLexicon ==============

                /*SPC : " ",
                DATA_DELIM : '|',
                STRESSED : '1',
                UNSTRESSED : '0',
                PHONEME_BOUNDARY : '-',
                WORD_BOUNDARY : " ",
                SYLLABLE_BOUNDARY : "/",
                SENTENCE_BOUNDARY : "|",
                VOWELS : "aeiou",*/

                // ==== Tagger =============

                MAXENT_POS_TAGGER : 0, // Type-constant for a maximum entropy-based tagger
                
                BRILL_POS_TAGGER : 1, // Type-constant for a rule or
                
                // tranformation-based tagger
                PLING_STEMMER : 0, // Type-constant for the Pling-based stemmer
                PORTER_STEMMER : 1, // Type-constant for the Porter-based stemmer
                
                PRINT_CUSTOM_TAGS : true,

                // ==== Pluralizer =============

                DEFAULT_PLURAL_RULE : new RegexRule("^((\\w+)(-\\w+)*)(\\s((\\w+)(-\\w+)*))*$", 0, "s"),

                PLURAL_RULES : [
                        new RegexRule("^(piano|photo|solo|ego|tobacco|cargo|golf|grief)$", 0, "s"),
                        new RegexRule("^(wildlife)$", 0, "s"),
                        new RegexRule("[bcdfghjklmnpqrstvwxyz]o$", 0, "es"),
                        new RegexRule("[bcdfghjklmnpqrstvwxyz]y$", 1, "ies"),
                        new RegexRule("([zsx]|ch|sh)$", 0, "es"),
                        new RegexRule("[lraeiou]fe$", 2, "ves"),
                        new RegexRule("[lraeiou]f$", 1, "ves"),
                        new RegexRule("(eu|eau)$", 0, "x"),
                        new RegexRule("(man|woman)$", 2, "en"),
                        new RegexRule("money$", 2, "ies"),
                        new RegexRule("person$", 4, "ople"),
                        new RegexRule("motif$", 0, "s"),
                        new RegexRule("^meninx|phalanx$", 1, "ges"),
                        new RegexRule("(xis|sis)$", 2, "es"),
                        new RegexRule("schema$", 0, "ta"),
                        new RegexRule("^bus$", 0, "ses"),
                        new RegexRule("child$", 0, "ren"),
                        new RegexRule("^(curi|formul|vertebr|larv|uln|alumn|signor|alg)a$", 0, "e"),
                        new RegexRule("^corpus$", 2, "ora"),
                        new RegexRule("^(maharaj|raj|myn|mull)a$", 0, "hs"),
                        new RegexRule("^aide-de-camp$", 8, "s-de-camp"),
                        new RegexRule("^apex|cortex$", 2, "ices"),
                        new RegexRule("^weltanschauung$", 0, "en"),
                        new RegexRule("^lied$", 0, "er"),
                        new RegexRule("^tooth$", 4, "eeth"),
                        new RegexRule("^[lm]ouse$", 4, "ice"),
                        new RegexRule("^foot$", 3, "eet"),
                        new RegexRule("femur", 2, "ora"),
                        new RegexRule("goose", 4, "eese"),
                        new RegexRule("(human|german|roman)$", 0, "s"),
                        new RegexRule("(crisis)$", 2, "es"),
                        new RegexRule("^(monarch|loch|stomach)$", 0, "s"),
                        new RegexRule("^(taxi|chief|proof|ref|relief|roof|belief)$", 0, "s"),
                        new RegexRule("^(co|no)$", 0, "'s"),
                        new RegexRule("^(memorandum|bacterium|curriculum|minimum|" + "maximum|referendum|spectrum|phenomenon|criterion)$", 2, "a"),
                        new RegexRule("^(appendix|index|matrix)", 2, "ices"),
                        new RegexRule("^(stimulus|alumnus)$", 2, "i"),
                        new RegexRule("^(Bantu|Bengalese|Bengali|Beninese|Boche|bonsai|" + "Burmese|Chinese|Congolese|Gabonese|Guyanese|Japanese|Javanese|"
                                + "Lebanese|Maltese|Olympics|Portuguese|Senegalese|Siamese|Singhalese|" + "Sinhalese|Sioux|Sudanese|Swiss|Taiwanese|Togolese|Vietnamese|aircraft|"
                                + "anopheles|apparatus|asparagus|barracks|bellows|bison|bluefish|bob|bourgeois|" + "bream|brill|butterfingers|carp|catfish|chassis|clothes|chub|cod|codfish|"
                                + "coley|contretemps|corps|crawfish|crayfish|crossroads|cuttlefish|dace|dice|" + "dogfish|doings|dory|downstairs|eldest|earnings|economics|electronics|finnan|"
                                + "firstborn|fish|flatfish|flounder|fowl|fry|fries|works|globefish|goldfish|" + "grand|gudgeon|gulden|haddock|hake|halibut|headquarters|herring|hertz|horsepower|"
                                + "goods|hovercraft|hundredweight|ironworks|jackanapes|kilohertz|kurus|kwacha|ling|lungfish|"
                                + "mackerel|means|megahertz|moorfowl|moorgame|mullet|nepalese|offspring|pampas|parr|(pants$)|"
                                + "patois|pekinese|penn'orth|perch|pickerel|pike|pince-nez|plaice|precis|quid|rand|"
                                + "rendezvous|revers|roach|roux|salmon|samurai|series|seychelles|seychellois|shad|"
                                + "sheep|shellfish|smelt|spacecraft|species|starfish|stockfish|sunfish|superficies|"
                                + "sweepstakes|swordfish|tench|tennis|tope|triceps|trout|tuna|tunafish|tunny|turbot|trousers|"
                                + "undersigned|veg|waterfowl|waterworks|waxworks|whiting|wildfowl|woodworm|" + "yen|aries|pisces|forceps|lieder|jeans|physics|mathematics|news|odds|politics|remains|"
                                + "surroundings|thanks|statistics|goods|aids)$", 0, "", 0) ],

                // ==== Tokenizer =============

                SPLIT_CONTRACTIONS : false,

                // ==== Sentence splitter =============

                MAX_CHARS_PERS_SENTENCE : 384,
                MIN_CHARS_PERS_SENTENCE : 8,
                ADD_SENTENCE_TAGS : false,
                REMOVE_QUOTATIONS : false,

                // ==== Conjugator =============

                ANY_STEM : "^((\\w+)(-\\w+)*)(\\s((\\w+)(-\\w+)*))*$",
                CONS : "[bcdfghjklmnpqrstvwxyz]",
                VERBAL_PREFIX : "((be|with|pre|un|over|re|mis|under|out|up|fore|for|counter|co|sub)(-?))",

                FIRST_PERSON : 0,
                SECOND_PERSON : 1,
                THIRD_PERSON : 2,
                PAST_TENSE : 3,
                PRESENT_TENSE : 4,
                FUTURE_TENSE : 5,
                SINGULAR : 6,
                PLURAL : 7,

                CONJUGATION_NAMES : [ "1st", "2nd", "3rd", "past", "present", "future", "singular", "plural" ],

                PERSONS : [ "FIRST_PERSON", "SECOND_PERSON", "THIRD_PERSON" ],
                TENSES : [ "PAST_TENSE", "PRESENT_TENSE", "FUTURE_TENSE" ],
                NUMBERS : [ "SINGULAR", "PLURAL" ],

                NORMAL : 0,
                INFINITIVE : 1, // The infinitive form - 'to eat an apple'
                GERUND : 2, // Gerund form of the VP - 'eating an apple'
                IMPERATIVE : 3, // The imperative form - 'eat an apple!'
                BARE_INFINITIVE : 4, // Bare infinitive VP - 'eat an apple'
                SUBJUNCTIVE : 5, // Subjunctive form - 'if I were a rich man'

                AUXILIARIES : [ "do", "have", "be" ],
                MODALS : [ "shall", "would", "may", "might", "ought", "should" ], // also
                // used
                // by
                // pluralizer
                SYMBOLS : [ "!", "?", "$", "%", "*", "+", "-", "=" ],

                ING_FORM_RULES : [ new RegexRule(this.CONS + "ie$", 2, "ying", 1), new RegexRule("[^ie]e$", 1, "ing", 1), new RegexRule("^bog-down$", 5, "ging-down", 0),
                        new RegexRule("^chivy$", 1, "vying", 0), new RegexRule("^gen-up$", 3, "ning-up", 0), new RegexRule("^trek$", 1, "cking", 0), new RegexRule("^ko$", 0, "'ing", 0),
                        new RegexRule("^(age|be)$", 0, "ing", 0), new RegexRule("(ibe)$", 1, "ing", 0) ],

                PAST_PARTICIPLE_RULES : [
                        new RegexRule("e$", 0, "d", 1),
                        new RegexRule(this.CONS + "y$", 1, "ied", 1),
                        new RegexRule("^" + this.VERBAL_PREFIX + "?(bring)$", 3, "ought", 0),
                        new RegexRule("^" + this.VERBAL_PREFIX + "?(take|rise|strew|blow|draw|drive|know|give|" + "arise|gnaw|grave|grow|hew|know|mow|see|sew|throw|prove|saw|quartersaw|"
                                + "partake|sake|shake|shew|show|shrive|sightsee|strew|strive)$", 0, "n", 0),
                        new RegexRule("^" + this.VERBAL_PREFIX + "?[gd]o$", 0, "ne", 1),
                        new RegexRule("^(beat|eat|be|fall)$", 0, "en", 0),
                        new RegexRule("^(have)$", 2, "d", 0),
                        new RegexRule("^" + this.VERBAL_PREFIX + "?bid$", 0, "den", 0),
                        new RegexRule("^" + this.VERBAL_PREFIX + "?[lps]ay$", 1, "id", 1),
                        new RegexRule("^behave$", 0, "d", 0),
                        new RegexRule("^" + this.VERBAL_PREFIX + "?have$", 2, "d", 1),
                        new RegexRule("(sink|slink|drink)$", 3, "unk", 0),
                        new RegexRule("(([sfc][twlp]?r?|w?r)ing|hang)$", 3, "ung", 0),
                        new RegexRule("^" + this.VERBAL_PREFIX + "?(shear|swear|bear|wear|tear)$", 3, "orn", 0),
                        new RegexRule("^" + this.VERBAL_PREFIX + "?(bend|spend|send|lend)$", 1, "t", 0),
                        new RegexRule("^" + this.VERBAL_PREFIX + "?(weep|sleep|sweep|creep|keep$)$", 2, "pt", 0),
                        new RegexRule("^" + this.VERBAL_PREFIX + "?(sell|tell)$", 3, "old", 0),
                        new RegexRule("^(outfight|beseech)$", 4, "ought", 0),
                        new RegexRule("^bethink$", 3, "ought", 0),
                        new RegexRule("^buy$", 2, "ought", 0),
                        new RegexRule("^aby$", 1, "ought", 0),
                        new RegexRule("^tarmac", 0, "ked", 0),
                        new RegexRule("^abide$", 3, "ode", 0),
                        new RegexRule("^" + this.VERBAL_PREFIX + "?(speak|(a?)wake|break)$", 3, "oken", 0),
                        new RegexRule("^backbite$", 1, "ten", 0),
                        new RegexRule("^backslide$", 1, "den", 0),
                        new RegexRule("^become$", 3, "ame", 0),
                        new RegexRule("^begird$", 3, "irt", 0),
                        new RegexRule("^outlie$", 2, "ay", 0),
                        new RegexRule("^rebind$", 3, "ound", 0),
                        new RegexRule("^relay$", 2, "aid", 0),
                        new RegexRule("^shit$", 3, "hat", 0),
                        new RegexRule("^bereave$", 4, "eft", 0),
                        new RegexRule("^foreswear$", 3, "ore", 0),
                        new RegexRule("^overfly$", 1, "own", 0),
                        new RegexRule("^beget$", 2, "otten", 0),
                        new RegexRule("^begin$", 3, "gun", 0),
                        new RegexRule("^bestride$", 1, "den", 0),
                        new RegexRule("^bite$", 1, "ten", 0),
                        new RegexRule("^bleed$", 4, "led", 0),
                        new RegexRule("^bog-down$", 5, "ged-down", 0),
                        new RegexRule("^bind$", 3, "ound", 0),
                        new RegexRule("^(.*)feed$", 4, "fed", 0),
                        new RegexRule("^breed$", 4, "red", 0),
                        new RegexRule("^brei", 0, "d", 0),
                        new RegexRule("^bring$", 3, "ought", 0),
                        new RegexRule("^build$", 1, "t", 0),
                        new RegexRule("^come", 0, "", 0),
                        new RegexRule("^catch$", 3, "ught", 0),
                        new RegexRule("^chivy$", 1, "vied", 0),
                        new RegexRule("^choose$", 3, "sen", 0),
                        new RegexRule("^cleave$", 4, "oven", 0),
                        new RegexRule("^crossbreed$", 4, "red", 0),
                        new RegexRule("^deal", 0, "t", 0),
                        new RegexRule("^dow$", 1, "ught", 0),
                        new RegexRule("^dream", 0, "t", 0),
                        new RegexRule("^dig$", 3, "dug", 0),
                        new RegexRule("^dwell$", 2, "lt", 0),
                        new RegexRule("^enwind$", 3, "ound", 0),
                        new RegexRule("^feel$", 3, "elt", 0),
                        new RegexRule("^flee$", 2, "ed", 0),
                        new RegexRule("^floodlight$", 5, "lit", 0),
                        new RegexRule("^fly$", 1, "own", 0),
                        new RegexRule("^forbear$", 3, "orne", 0),
                        new RegexRule("^forerun$", 3, "ran", 0),
                        new RegexRule("^forget$", 2, "otten", 0),
                        new RegexRule("^fight$", 4, "ought", 0),
                        new RegexRule("^find$", 3, "ound", 0),
                        new RegexRule("^freeze$", 4, "ozen", 0),
                        new RegexRule("^gainsay$", 2, "aid", 0),
                        new RegexRule("^gin$", 3, "gan", 0),
                        new RegexRule("^gen-up$", 3, "ned-up", 0),
                        new RegexRule("^ghostwrite$", 1, "ten", 0),
                        new RegexRule("^get$", 2, "otten", 0),
                        new RegexRule("^grind$", 3, "ound", 0),
                        new RegexRule("^hacksaw", 0, "n", 0),
                        new RegexRule("^hear", 0, "d", 0),
                        new RegexRule("^hold$", 3, "eld", 0),
                        new RegexRule("^hide$", 1, "den", 0),
                        new RegexRule("^honey$", 2, "ied", 0),
                        new RegexRule("^inbreed$", 4, "red", 0),
                        new RegexRule("^indwell$", 3, "elt", 0),
                        new RegexRule("^interbreed$", 4, "red", 0),
                        new RegexRule("^interweave$", 4, "oven", 0),
                        new RegexRule("^inweave$", 4, "oven", 0),
                        new RegexRule("^ken$", 2, "ent", 0),
                        new RegexRule("^kneel$", 3, "elt", 0),
                        new RegexRule("^lie$", 2, "ain", 0),
                        new RegexRule("^leap$", 0, "t", 0),
                        new RegexRule("^learn$", 0, "t", 0),
                        new RegexRule("^lead$", 4, "led", 0),
                        new RegexRule("^leave$", 4, "eft", 0),
                        new RegexRule("^light$", 5, "lit", 0),
                        new RegexRule("^lose$", 3, "ost", 0),
                        new RegexRule("^make$", 3, "ade", 0),
                        new RegexRule("^mean", 0, "t", 0),
                        new RegexRule("^meet$", 4, "met", 0),
                        new RegexRule("^misbecome$", 3, "ame", 0),
                        new RegexRule("^misdeal$", 2, "alt", 0),
                        new RegexRule("^mishear$", 1, "d", 0),
                        new RegexRule("^mislead$", 4, "led", 0),
                        new RegexRule("^misunderstand$", 3, "ood", 0),
                        new RegexRule("^outbreed$", 4, "red", 0),
                        new RegexRule("^outrun$", 3, "ran", 0),
                        new RegexRule("^outride$", 1, "den", 0),
                        new RegexRule("^outshine$", 3, "one", 0),
                        new RegexRule("^outshoot$", 4, "hot", 0),
                        new RegexRule("^outstand$", 3, "ood", 0),
                        new RegexRule("^outthink$", 3, "ought", 0),
                        new RegexRule("^outgo$", 2, "went", 0),
                        new RegexRule("^overbear$", 3, "orne", 0),
                        new RegexRule("^overbuild$", 3, "ilt", 0),
                        new RegexRule("^overcome$", 3, "ame", 0),
                        new RegexRule("^overfly$", 2, "lew", 0),
                        new RegexRule("^overhear$", 2, "ard", 0),
                        new RegexRule("^overlie$", 2, "ain", 0),
                        new RegexRule("^overrun$", 3, "ran", 0),
                        new RegexRule("^override$", 1, "den", 0),
                        new RegexRule("^overshoot$", 4, "hot", 0),
                        new RegexRule("^overwind$", 3, "ound", 0),
                        new RegexRule("^overwrite$", 1, "ten", 0),
                        new RegexRule("^run$", 3, "ran", 0),
                        new RegexRule("^rebuild$", 3, "ilt", 0),
                        new RegexRule("^red$", 3, "red", 0),
                        new RegexRule("^redo$", 1, "one", 0),
                        new RegexRule("^remake$", 3, "ade", 0),
                        new RegexRule("^rerun$", 3, "ran", 0),
                        new RegexRule("^resit$", 3, "sat", 0),
                        new RegexRule("^rethink$", 3, "ought", 0),
                        new RegexRule("^rewind$", 3, "ound", 0),
                        new RegexRule("^rewrite$", 1, "ten", 0),
                        new RegexRule("^ride$", 1, "den", 0),
                        new RegexRule("^reeve$", 4, "ove", 0),
                        new RegexRule("^sit$", 3, "sat", 0),
                        new RegexRule("^shoe$", 3, "hod", 0),
                        new RegexRule("^shine$", 3, "one", 0),
                        new RegexRule("^shoot$", 4, "hot", 0),
                        new RegexRule("^ski$", 1, "i'd", 0),
                        new RegexRule("^slide$", 1, "den", 0),
                        new RegexRule("^smite$", 1, "ten", 0),
                        new RegexRule("^seek$", 3, "ought", 0),
                        new RegexRule("^spit$", 3, "pat", 0),
                        new RegexRule("^speed$", 4, "ped", 0),
                        new RegexRule("^spellbind$", 3, "ound", 0),
                        new RegexRule("^spoil$", 2, "ilt", 0),
                        new RegexRule("^spotlight$", 5, "lit", 0),
                        new RegexRule("^spin$", 3, "pun", 0),
                        new RegexRule("^steal$", 3, "olen", 0),
                        new RegexRule("^stand$", 3, "ood", 0),
                        new RegexRule("^stave$", 3, "ove", 0),
                        new RegexRule("^stride$", 1, "den", 0),
                        new RegexRule("^strike$", 3, "uck", 0),
                        new RegexRule("^stick$", 3, "uck", 0),
                        new RegexRule("^swell$", 3, "ollen", 0),
                        new RegexRule("^swim$", 3, "wum", 0),
                        new RegexRule("^teach$", 4, "aught", 0),
                        new RegexRule("^think$", 3, "ought", 0),
                        new RegexRule("^tread$", 3, "odden", 0),
                        new RegexRule("^typewrite$", 1, "ten", 0),
                        new RegexRule("^unbind$", 3, "ound", 0),
                        new RegexRule("^underbuy$", 2, "ought", 0),
                        new RegexRule("^undergird$", 3, "irt", 0),
                        new RegexRule("^undergo$", 1, "one", 0),
                        new RegexRule("^underlie$", 2, "ain", 0),
                        new RegexRule("^undershoot$", 4, "hot", 0),
                        new RegexRule("^understand$", 3, "ood", 0),
                        new RegexRule("^unfreeze$", 4, "ozen", 0),
                        new RegexRule("^unlearn", 0, "t", 0),
                        new RegexRule("^unmake$", 3, "ade", 0),
                        new RegexRule("^unreeve$", 4, "ove", 0),
                        new RegexRule("^unstick$", 3, "uck", 0),
                        new RegexRule("^unteach$", 4, "aught", 0),
                        new RegexRule("^unthink$", 3, "ought", 0),
                        new RegexRule("^untread$", 3, "odden", 0),
                        new RegexRule("^unwind$", 3, "ound", 0),
                        new RegexRule("^upbuild$", 1, "t", 0),
                        new RegexRule("^uphold$", 3, "eld", 0),
                        new RegexRule("^upheave$", 4, "ove", 0),
                        new RegexRule("^waylay$", 2, "ain", 0),
                        new RegexRule("^whipsaw$", 2, "awn", 0),
                        new RegexRule("^withhold$", 3, "eld", 0),
                        new RegexRule("^withstand$", 3, "ood", 0),
                        new RegexRule("^win$", 3, "won", 0),
                        new RegexRule("^wind$", 3, "ound", 0),
                        new RegexRule("^weave$", 4, "oven", 0),
                        new RegexRule("^write$", 1, "ten", 0),
                        new RegexRule("^trek$", 1, "cked", 0),
                        new RegexRule("^ko$", 1, "o'd", 0),
                        new RegexRule("^win$", 2, "on", 0),
                        // Null past forms
                        new RegexRule("^" + this.VERBAL_PREFIX + "?(cast|thrust|typeset|cut|bid|upset|wet|bet|cut|" + "hit|hurt|inset|let|cost|burst|beat|beset|set|upset|hit|offset|put|quit|"
                                + "wed|typeset|wed|spread|split|slit|read|run|shut|shed)$", 0, "", 0) ],

                PAST_TENSE_RULES : [
                        new RegexRule("^(reduce)$", 0, "d", 0),
                        new RegexRule("e$", 0, "d", 1),
                        new RegexRule("^" + this.VERBAL_PREFIX + "?[pls]ay$", 1, "id", 1),
                        new RegexRule(this.CONS + "y$", 1, "ied", 1),
                        new RegexRule("^(fling|cling|hang)$", 3, "ung", 0),
                        new RegexRule("(([sfc][twlp]?r?|w?r)ing)$", 3, "ang", 1),
                        new RegexRule("^" + this.VERBAL_PREFIX + "?(bend|spend|send|lend|spend)$", 1, "t", 0),
                        new RegexRule("^" + this.VERBAL_PREFIX + "?lie$", 2, "ay", 0),
                        new RegexRule("^" + this.VERBAL_PREFIX + "?(weep|sleep|sweep|creep|keep)$", 2, "pt", 0),
                        new RegexRule("^" + this.VERBAL_PREFIX + "?(sell|tell)$", 3, "old", 0),
                        new RegexRule("^" + this.VERBAL_PREFIX + "?do$", 1, "id", 0),
                        new RegexRule("^" + this.VERBAL_PREFIX + "?dig$", 2, "ug", 0),
                        new RegexRule("^behave$", 0, "d", 0),
                        new RegexRule("^(have)$", 2, "d", 0),
                        new RegexRule("(sink|drink)$", 3, "ank", 0),
                        new RegexRule("^swing$", 3, "ung", 0),
                        new RegexRule("^be$", 2, "was", 0),
                        new RegexRule("^outfight$", 4, "ought", 0),
                        new RegexRule("^tarmac", 0, "ked", 0),
                        new RegexRule("^abide$", 3, "ode", 0),
                        new RegexRule("^aby$", 1, "ought", 0),
                        new RegexRule("^become$", 3, "ame", 0),
                        new RegexRule("^begird$", 3, "irt", 0),
                        new RegexRule("^outlie$", 2, "ay", 0),
                        new RegexRule("^rebind$", 3, "ound", 0),
                        new RegexRule("^shit$", 3, "hat", 0),
                        new RegexRule("^bereave$", 4, "eft", 0),
                        new RegexRule("^foreswear$", 3, "ore", 0),
                        new RegexRule("^bename$", 3, "empt", 0),
                        new RegexRule("^beseech$", 4, "ought", 0),
                        new RegexRule("^bethink$", 3, "ought", 0),
                        new RegexRule("^bleed$", 4, "led", 0),
                        new RegexRule("^bog-down$", 5, "ged-down", 0),
                        new RegexRule("^buy$", 2, "ought", 0),
                        new RegexRule("^bind$", 3, "ound", 0),
                        new RegexRule("^(.*)feed$", 4, "fed", 0),
                        new RegexRule("^breed$", 4, "red", 0),
                        new RegexRule("^brei$", 2, "eid", 0),
                        new RegexRule("^bring$", 3, "ought", 0),
                        new RegexRule("^build$", 3, "ilt", 0),
                        new RegexRule("^come$", 3, "ame", 0),
                        new RegexRule("^catch$", 3, "ught", 0),
                        new RegexRule("^clothe$", 5, "lad", 0),
                        new RegexRule("^crossbreed$", 4, "red", 0),
                        new RegexRule("^deal$", 2, "alt", 0),
                        new RegexRule("^dow$", 1, "ught", 0),
                        new RegexRule("^dream$", 2, "amt", 0),
                        new RegexRule("^dwell$", 3, "elt", 0),
                        new RegexRule("^enwind$", 3, "ound", 0),
                        new RegexRule("^feel$", 3, "elt", 0),
                        new RegexRule("^flee$", 3, "led", 0),
                        new RegexRule("^floodlight$", 5, "lit", 0),
                        new RegexRule("^arise$", 3, "ose", 0),
                        new RegexRule("^eat$", 3, "ate", 0),
                        new RegexRule("^awake$", 3, "oke", 0),
                        new RegexRule("^backbite$", 4, "bit", 0),
                        new RegexRule("^backslide$", 4, "lid", 0),
                        new RegexRule("^befall$", 3, "ell", 0),
                        new RegexRule("^begin$", 3, "gan", 0),
                        new RegexRule("^beget$", 3, "got", 0),
                        new RegexRule("^behold$", 3, "eld", 0),
                        new RegexRule("^bespeak$", 3, "oke", 0),
                        new RegexRule("^bestride$", 3, "ode", 0),
                        new RegexRule("^betake$", 3, "ook", 0),
                        new RegexRule("^bite$", 4, "bit", 0),
                        new RegexRule("^blow$", 3, "lew", 0),
                        new RegexRule("^bear$", 3, "ore", 0),
                        new RegexRule("^break$", 3, "oke", 0),
                        new RegexRule("^choose$", 4, "ose", 0),
                        new RegexRule("^cleave$", 4, "ove", 0),
                        new RegexRule("^countersink$", 3, "ank", 0),
                        new RegexRule("^drink$", 3, "ank", 0),
                        new RegexRule("^draw$", 3, "rew", 0),
                        new RegexRule("^drive$", 3, "ove", 0),
                        new RegexRule("^fall$", 3, "ell", 0),
                        new RegexRule("^fly$", 2, "lew", 0),
                        new RegexRule("^flyblow$", 3, "lew", 0),
                        new RegexRule("^forbid$", 2, "ade", 0),
                        new RegexRule("^forbear$", 3, "ore", 0),
                        new RegexRule("^foreknow$", 3, "new", 0),
                        new RegexRule("^foresee$", 3, "saw", 0),
                        new RegexRule("^forespeak$", 3, "oke", 0),
                        new RegexRule("^forego$", 2, "went", 0),
                        new RegexRule("^forgive$", 3, "ave", 0),
                        new RegexRule("^forget$", 3, "got", 0),
                        new RegexRule("^forsake$", 3, "ook", 0),
                        new RegexRule("^forspeak$", 3, "oke", 0),
                        new RegexRule("^forswear$", 3, "ore", 0),
                        new RegexRule("^forgo$", 2, "went", 0),
                        new RegexRule("^fight$", 4, "ought", 0),
                        new RegexRule("^find$", 3, "ound", 0),
                        new RegexRule("^freeze$", 4, "oze", 0),
                        new RegexRule("^give$", 3, "ave", 0),
                        new RegexRule("^geld$", 3, "elt", 0),
                        new RegexRule("^gen-up$", 3, "ned-up", 0),
                        new RegexRule("^ghostwrite$", 3, "ote", 0),
                        new RegexRule("^get$", 3, "got", 0),
                        new RegexRule("^grow$", 3, "rew", 0),
                        new RegexRule("^grind$", 3, "ound", 0),
                        new RegexRule("^hear$", 2, "ard", 0),
                        new RegexRule("^hold$", 3, "eld", 0),
                        new RegexRule("^hide$", 4, "hid", 0),
                        new RegexRule("^honey$", 2, "ied", 0),
                        new RegexRule("^inbreed$", 4, "red", 0),
                        new RegexRule("^indwell$", 3, "elt", 0),
                        new RegexRule("^interbreed$", 4, "red", 0),
                        new RegexRule("^interweave$", 4, "ove", 0),
                        new RegexRule("^inweave$", 4, "ove", 0),
                        new RegexRule("^ken$", 2, "ent", 0),
                        new RegexRule("^kneel$", 3, "elt", 0),
                        new RegexRule("^^know$$", 3, "new", 0),
                        new RegexRule("^leap$", 2, "apt", 0),
                        new RegexRule("^learn$", 2, "rnt", 0),
                        new RegexRule("^lead$", 4, "led", 0),
                        new RegexRule("^leave$", 4, "eft", 0),
                        new RegexRule("^light$", 5, "lit", 0),
                        new RegexRule("^lose$", 3, "ost", 0),
                        new RegexRule("^make$", 3, "ade", 0),
                        new RegexRule("^mean$", 2, "ant", 0),
                        new RegexRule("^meet$", 4, "met", 0),
                        new RegexRule("^misbecome$", 3, "ame", 0),
                        new RegexRule("^misdeal$", 2, "alt", 0),
                        new RegexRule("^misgive$", 3, "ave", 0),
                        new RegexRule("^mishear$", 2, "ard", 0),
                        new RegexRule("^mislead$", 4, "led", 0),
                        new RegexRule("^mistake$", 3, "ook", 0),
                        new RegexRule("^misunderstand$", 3, "ood", 0),
                        new RegexRule("^outbreed$", 4, "red", 0),
                        new RegexRule("^outgrow$", 3, "rew", 0),
                        new RegexRule("^outride$", 3, "ode", 0),
                        new RegexRule("^outshine$", 3, "one", 0),
                        new RegexRule("^outshoot$", 4, "hot", 0),
                        new RegexRule("^outstand$", 3, "ood", 0),
                        new RegexRule("^outthink$", 3, "ought", 0),
                        new RegexRule("^outgo$", 2, "went", 0),
                        new RegexRule("^outwear$", 3, "ore", 0),
                        new RegexRule("^overblow$", 3, "lew", 0),
                        new RegexRule("^overbear$", 3, "ore", 0),
                        new RegexRule("^overbuild$", 3, "ilt", 0),
                        new RegexRule("^overcome$", 3, "ame", 0),
                        new RegexRule("^overdraw$", 3, "rew", 0),
                        new RegexRule("^overdrive$", 3, "ove", 0),
                        new RegexRule("^overfly$", 2, "lew", 0),
                        new RegexRule("^overgrow$", 3, "rew", 0),
                        new RegexRule("^overhear$", 2, "ard", 0),
                        new RegexRule("^overpass$", 3, "ast", 0),
                        new RegexRule("^override$", 3, "ode", 0),
                        new RegexRule("^oversee$", 3, "saw", 0),
                        new RegexRule("^overshoot$", 4, "hot", 0),
                        new RegexRule("^overthrow$", 3, "rew", 0),
                        new RegexRule("^overtake$", 3, "ook", 0),
                        new RegexRule("^overwind$", 3, "ound", 0),
                        new RegexRule("^overwrite$", 3, "ote", 0),
                        new RegexRule("^partake$", 3, "ook", 0),
                        new RegexRule("^" + this.VERBAL_PREFIX + "?run$", 2, "an", 0),
                        new RegexRule("^ring$", 3, "ang", 0),
                        new RegexRule("^rebuild$", 3, "ilt", 0),
                        new RegexRule("^red", 0, "", 0),
                        new RegexRule("^reave$", 4, "eft", 0),
                        new RegexRule("^remake$", 3, "ade", 0),
                        new RegexRule("^resit$", 3, "sat", 0),
                        new RegexRule("^rethink$", 3, "ought", 0),
                        new RegexRule("^retake$", 3, "ook", 0),
                        new RegexRule("^rewind$", 3, "ound", 0),
                        new RegexRule("^rewrite$", 3, "ote", 0),
                        new RegexRule("^ride$", 3, "ode", 0),
                        new RegexRule("^rise$", 3, "ose", 0),
                        new RegexRule("^reeve$", 4, "ove", 0),
                        new RegexRule("^sing$", 3, "ang", 0),
                        new RegexRule("^sink$", 3, "ank", 0),
                        new RegexRule("^sit$", 3, "sat", 0),
                        new RegexRule("^see$", 3, "saw", 0),
                        new RegexRule("^shoe$", 3, "hod", 0),
                        new RegexRule("^shine$", 3, "one", 0),
                        new RegexRule("^shake$", 3, "ook", 0),
                        new RegexRule("^shoot$", 4, "hot", 0),
                        new RegexRule("^shrink$", 3, "ank", 0),
                        new RegexRule("^shrive$", 3, "ove", 0),
                        new RegexRule("^sightsee$", 3, "saw", 0),
                        new RegexRule("^ski$", 1, "i'd", 0),
                        new RegexRule("^skydive$", 3, "ove", 0),
                        new RegexRule("^slay$", 3, "lew", 0),
                        new RegexRule("^slide$", 4, "lid", 0),
                        new RegexRule("^slink$", 3, "unk", 0),
                        new RegexRule("^smite$", 4, "mit", 0),
                        new RegexRule("^seek$", 3, "ought", 0),
                        new RegexRule("^spit$", 3, "pat", 0),
                        new RegexRule("^speed$", 4, "ped", 0),
                        new RegexRule("^spellbind$", 3, "ound", 0),
                        new RegexRule("^spoil$", 2, "ilt", 0),
                        new RegexRule("^speak$", 3, "oke", 0),
                        new RegexRule("^spotlight$", 5, "lit", 0),
                        new RegexRule("^spring$", 3, "ang", 0),
                        new RegexRule("^spin$", 3, "pun", 0),
                        new RegexRule("^stink$", 3, "ank", 0),
                        new RegexRule("^steal$", 3, "ole", 0),
                        new RegexRule("^stand$", 3, "ood", 0),
                        new RegexRule("^stave$", 3, "ove", 0),
                        new RegexRule("^stride$", 3, "ode", 0),
                        new RegexRule("^strive$", 3, "ove", 0),
                        new RegexRule("^strike$", 3, "uck", 0),
                        new RegexRule("^stick$", 3, "uck", 0),
                        new RegexRule("^swim$", 3, "wam", 0),
                        new RegexRule("^swear$", 3, "ore", 0),
                        new RegexRule("^teach$", 4, "aught", 0),
                        new RegexRule("^think$", 3, "ought", 0),
                        new RegexRule("^throw$", 3, "rew", 0),
                        new RegexRule("^take$", 3, "ook", 0),
                        new RegexRule("^tear$", 3, "ore", 0),
                        new RegexRule("^transship$", 4, "hip", 0),
                        new RegexRule("^tread$", 4, "rod", 0),
                        new RegexRule("^typewrite$", 3, "ote", 0),
                        new RegexRule("^unbind$", 3, "ound", 0),
                        new RegexRule("^unclothe$", 5, "lad", 0),
                        new RegexRule("^underbuy$", 2, "ought", 0),
                        new RegexRule("^undergird$", 3, "irt", 0),
                        new RegexRule("^undershoot$", 4, "hot", 0),
                        new RegexRule("^understand$", 3, "ood", 0),
                        new RegexRule("^undertake$", 3, "ook", 0),
                        new RegexRule("^undergo$", 2, "went", 0),
                        new RegexRule("^underwrite$", 3, "ote", 0),
                        new RegexRule("^unfreeze$", 4, "oze", 0),
                        new RegexRule("^unlearn$", 2, "rnt", 0),
                        new RegexRule("^unmake$", 3, "ade", 0),
                        new RegexRule("^unreeve$", 4, "ove", 0),
                        new RegexRule("^unspeak$", 3, "oke", 0),
                        new RegexRule("^unstick$", 3, "uck", 0),
                        new RegexRule("^unswear$", 3, "ore", 0),
                        new RegexRule("^unteach$", 4, "aught", 0),
                        new RegexRule("^unthink$", 3, "ought", 0),
                        new RegexRule("^untread$", 4, "rod", 0),
                        new RegexRule("^unwind$", 3, "ound", 0),
                        new RegexRule("^upbuild$", 3, "ilt", 0),
                        new RegexRule("^uphold$", 3, "eld", 0),
                        new RegexRule("^upheave$", 4, "ove", 0),
                        new RegexRule("^uprise$", 3, "ose", 0),
                        new RegexRule("^upspring$", 3, "ang", 0),
                        new RegexRule("^go$", 2, "went", 0),
                        new RegexRule("^wiredraw$", 3, "rew", 0),
                        new RegexRule("^withdraw$", 3, "rew", 0),
                        new RegexRule("^withhold$", 3, "eld", 0),
                        new RegexRule("^withstand$", 3, "ood", 0),
                        new RegexRule("^wake$", 3, "oke", 0),
                        new RegexRule("^win$", 3, "won", 0),
                        new RegexRule("^wear$", 3, "ore", 0),
                        new RegexRule("^wind$", 3, "ound", 0),
                        new RegexRule("^weave$", 4, "ove", 0),
                        new RegexRule("^write$", 3, "ote", 0),
                        new RegexRule("^trek$", 1, "cked", 0),
                        new RegexRule("^ko$", 1, "o'd", 0),
                        new RegexRule("^bid", 2, "ade", 0),
                        new RegexRule("^win$", 2, "on", 0),
                        new RegexRule("^swim", 2, "am", 0),
                        // Null past forms
                        new RegexRule("^" + this.VERBAL_PREFIX + "?(cast|thrust|typeset|cut|bid|upset|wet|bet|cut|hit|hurt|inset|" + "let|cost|burst|beat|beset|set|upset|offset|put|quit|wed|typeset|"
                                + "wed|spread|split|slit|read|run|shut|shed|lay)$", 0, "", 0) ],

                PRESENT_TENSE_RULES : [ new RegexRule("^aby$", 0, "es", 0), new RegexRule("^bog-down$", 5, "s-down", 0), new RegexRule("^chivy$", 1, "vies", 0),
                        new RegexRule("^gen-up$", 3, "s-up", 0), new RegexRule("^prologue$", 3, "gs", 0), new RegexRule("^picknic$", 0, "ks", 0), new RegexRule("^ko$", 0, "'s", 0),
                        new RegexRule("[osz]$", 0, "es", 1), new RegexRule("^have$", 2, "s", 0), new RegexRule(this.CONS + "y$", 1, "ies", 1), new RegexRule("^be$", 2, "is"),
                        new RegexRule("([zsx]|ch|sh)$", 0, "es", 1) ],

                VERB_CONS_DOUBLING : [ "abat", "abet", "abhor", "abut", "accur", "acquit", "adlib", "admit", "aerobat", "aerosol", "agendaset", "allot", "alot", "anagram", "annul", "appal",
                        "apparel", "armbar", "aver", "babysit", "airdrop", "appal", "blackleg", "bobsled", "bur", "chum", "confab", "counterplot", "curet", "dib", "backdrop", "backfil", "backflip",
                        "backlog", "backpedal", "backslap", "backstab", "bag", "balfun", "ballot", "ban", "bar", "barbel", "bareleg", "barrel", "bat", "bayonet", "becom", "bed", "bedevil", "bedwet",
                        "beenhop", "befit", "befog", "beg", "beget", "begin", "bejewel", "bemedal", "benefit", "benum", "beset", "besot", "bestir", "bet", "betassel", "bevel", "bewig", "bib", "bid",
                        "billet", "bin", "bip", "bit", "bitmap", "blab", "blag", "blam", "blan", "blat", "bles", "blim", "blip", "blob", "bloodlet", "blot", "blub", "blur", "bob", "bodypop", "bog",
                        "booby-trap", "boobytrap", "booksel", "bootleg", "bop", "bot", "bowel", "bracket", "brag", "brig", "brim", "bud", "buffet", "bug", "bullshit", "bum", "bun", "bus", "but",
                        "cab", "cabal", "cam", "can", "cancel", "cap", "caracol", "caravan", "carburet", "carnap", "carol", "carpetbag", "castanet", "cat", "catcal", "catnap", "cavil", "chan",
                        "chanel", "channel", "chap", "char", "chargecap", "chat", "chin", "chip", "chir", "chirrup", "chisel", "chop", "chug", "chur", "clam", "clap", "clearcut", "clip", "clodhop",
                        "clog", "clop", "closet", "clot", "club", "co-occur", "co-program", "co-refer", "co-run", "co-star", "cob", "cobweb", "cod", "coif", "com", "combat", "comit", "commit",
                        "compel", "con", "concur", "confer", "confiscat", "control", "cop", "coquet", "coral", "corbel", "corral", "cosset", "cotransmit", "councel", "council", "counsel",
                        "court-martial", "crab", "cram", "crap", "crib", "crop", "crossleg", "cub", "cudgel", "cum", "cun", "cup", "cut", "dab", "dag", "dam", "dan", "dap", "daysit", "de-control",
                        "de-gazet", "de-hul", "de-instal", "de-mob", "de-program", "de-rig", "de-skil", "deadpan", "debag", "debar", "log", "decommit", "decontrol", "defer", "defog", "deg", "degas",
                        "deinstal", "demit", "demob", "demur", "den", "denet", "depig", "depip", "depit", "der", "deskil", "deter", "devil", "diagram", "dial", "dig", "dim", "din", "dip", "disbar",
                        "disbud", "discomfit", "disembed", "disembowel", "dishevel", "disinter", "dispel", "disprefer", "distil", "dog", "dognap", "don", "doorstep", "dot", "dowel", "drag", "drat",
                        "driftnet", "distil", "egotrip", "enrol", "enthral", "extol", "fulfil", "gaffe", "golliwog", "idyl", "inspan", "drip", "drivel", "drop", "drub", "drug", "drum", "dub", "duel",
                        "dun", "dybbuk", "earwig", "eavesdrop", "ecolabel", "eitherspigot", "electroblot", "embed", "emit", "empanel", "enamel", "endlabel", "endtrim", "enrol", "enthral",
                        "entrammel", "entrap", "enwrap", "equal", "equip", "estop", "exaggerat", "excel", "expel", "extol", "fag", "fan", "farewel", "fat", "featherbed", "feget", "fet", "fib", "fig",
                        "fin", "fingerspel", "fingertip", "fit", "flab", "flag", "flap", "flip", "flit", "flog", "flop", "fob", "focus", "fog", "footbal", "footslog", "fop", "forbid", "forget",
                        "format", "fortunetel", "fot", "foxtrot", "frag", "freefal", "fret", "frig", "frip", "frog", "frug", "fuel", "fufil", "fulfil", "fullyfit", "fun", "funnel", "fur", "furpul",
                        "gab", "gad", "gag", "gam", "gambol", "gap", "garot", "garrot", "gas", "gat", "gel", "gen", "get", "giftwrap", "gig", "gimbal", "gin", "glam", "glenden", "glendin",
                        "globetrot", "glug", "glut", "gob", "goldpan", "goostep", "gossip", "grab", "gravel", "grid", "grin", "grip", "grit", "groundhop", "grovel", "grub", "gum", "gun", "gunrun",
                        "gut", "gyp", "haircut", "ham", "han", "handbag", "handicap", "handknit", "handset", "hap", "hareleg", "hat", "headbut", "hedgehop", "hem", "hen", "hiccup", "highwal", "hip",
                        "hit", "hobnob", "hog", "hop", "horsewhip", "hostel", "hot", "hotdog", "hovel", "hug", "hum", "humbug", "hup", "hushkit", "hut", "illfit", "imbed", "immunblot", "immunoblot",
                        "impannel", "impel", "imperil", "incur", "infer", "infil", "inflam", "initial", "input", "inset", "instil", "inter", "interbed", "intercrop", "intercut", "interfer", "instal",
                        "instil", "intermit", "japan", "jug", "kris", "manumit", "mishit", "mousse", "mud", "interwar", "jab", "jag", "jam", "jar", "jawdrop", "jet", "jetlag", "jewel", "jib", "jig",
                        "jitterbug", "job", "jog", "jog-trot", "jot", "jut", "ken", "kennel", "kid", "kidnap", "kip", "kissogram", "kit", "knap", "kneecap", "knit", "knob", "knot", "kor", "label",
                        "lag", "lam", "lap", "lavel", "leafcut", "leapfrog", "leg", "lem", "lep", "let", "level", "libel", "lid", "lig", "lip", "lob", "log", "lok", "lollop", "longleg", "lop",
                        "lowbal", "lug", "mackerel", "mahom", "man", "map", "mar", "marshal", "marvel", "mat", "matchwin", "metal", "micro-program", "microplan", "microprogram", "milksop", "mis-cal",
                        "mis-club", "mis-spel", "miscal", "mishit", "mislabel", "mit", "mob", "mod", "model", "mohmam", "monogram", "mop", "mothbal", "mug", "multilevel", "mum", "nab", "nag", "nan",
                        "nap", "net", "nightclub", "nightsit", "nip", "nod", "nonplus", "norkop", "nostril", "not", "nut", "nutmeg", "occur", "ocur", "offput", "offset", "omit", "ommit", "onlap",
                        "out-general", "out-gun", "out-jab", "out-plan", "out-pol", "out-pul", "out-put", "out-run", "out-sel", "outbid", "outcrop", "outfit", "outgas", "outgun", "outhit", "outjab",
                        "outpol", "output", "outrun", "outship", "outshop", "outsin", "outstrip", "outswel", "outspan", "overcrop", "pettifog", "photostat", "pouf", "preset", "prim", "pug", "ret",
                        "rosin", "outwit", "over-commit", "over-control", "over-fil", "over-fit", "over-lap", "over-model", "over-pedal", "over-pet", "over-run", "over-sel", "over-step", "over-tip",
                        "over-top", "overbid", "overcal", "overcommit", "overcontrol", "overcrap", "overdub", "overfil", "overhat", "overhit", "overlap", "overman", "overplot", "overrun", "overshop",
                        "overstep", "overtip", "overtop", "overwet", "overwil", "pad", "paintbal", "pan", "panel", "paperclip", "par", "parallel", "parcel", "partiescal", "pat", "patrol", "pedal",
                        "peewit", "peg", "pen", "pencil", "pep", "permit", "pet", "petal", "photoset", "phototypeset", "phut", "picket", "pig", "pilot", "pin", "pinbal", "pip", "pipefit", "pipet",
                        "pit", "plan", "plit", "plod", "plop", "plot", "plug", "plumet", "plummet", "pod", "policyset", "polyfil", "ponytrek", "pop", "pot", "pram", "prebag", "predistil", "predril",
                        "prefer", "prefil", "preinstal", "prep", "preplan", "preprogram", "prizewin", "prod", "profer", "prog", "program", "prop", "propel", "pub", "pummel", "pun", "pup", "pushfit",
                        "put", "quarel", "quarrel", "quickskim", "quickstep", "quickwit", "quip", "quit", "quivertip", "quiz", "rabbit", "rabit", "radiolabel", "rag", "ram", "ramrod", "rap", "rat",
                        "ratecap", "ravel", "re-admit", "re-cal", "re-cap", "re-channel", "re-dig", "re-dril", "re-emit", "re-fil", "re-fit", "re-flag", "re-format", "re-fret", "re-hab", "re-instal",
                        "re-inter", "re-lap", "re-let", "re-map", "re-metal", "re-model", "re-pastel", "re-plan", "re-plot", "re-plug", "re-pot", "re-program", "re-refer", "re-rig", "re-rol",
                        "re-run", "re-sel", "re-set", "re-skin", "re-stal", "re-submit", "re-tel", "re-top", "re-transmit", "re-trim", "re-wrap", "readmit", "reallot", "rebel", "rebid", "rebin",
                        "rebut", "recap", "rechannel", "recommit", "recrop", "recur", "recut", "red", "redril", "refer", "refit", "reformat", "refret", "refuel", "reget", "regret", "reinter",
                        "rejig", "rekit", "reknot", "relabel", "relet", "rem", "remap", "remetal", "remit", "remodel", "reoccur", "rep", "repel", "repin", "replan", "replot", "repol", "repot",
                        "reprogram", "rerun", "reset", "resignal", "resit", "reskil", "resubmit", "retransfer", "retransmit", "retro-fit", "retrofit", "rev", "revel", "revet", "rewrap", "rib",
                        "richochet", "ricochet", "rid", "rig", "rim", "ringlet", "rip", "rit", "rival", "rivet", "roadrun", "rob", "rocket", "rod", "roset", "rot", "rowel", "rub", "run", "runnel",
                        "rut", "sab", "sad", "sag", "sandbag", "sap", "scab", "scalpel", "scam", "scan", "scar", "scat", "schlep", "scrag", "scram", "shall", "sled", "smut", "stet", "sulfuret",
                        "trepan", "unrip", "unstop", "whir", "whop", "wig", "scrap", "scrat", "scrub", "scrum", "scud", "scum", "scur", "semi-control", "semi-skil", "semi-skim", "semiskil",
                        "sentinel", "set", "shag", "sham", "shed", "shim", "shin", "ship", "shir", "shit", "shlap", "shop", "shopfit", "shortfal", "shot", "shovel", "shred", "shrinkwrap", "shrivel",
                        "shrug", "shun", "shut", "side-step", "sideslip", "sidestep", "signal", "sin", "sinbin", "sip", "sit", "skid", "skim", "skin", "skip", "skir", "skrag", "slab", "slag", "slam",
                        "slap", "slim", "slip", "slit", "slob", "slog", "slop", "slot", "slowclap", "slug", "slum", "slur", "smit", "snag", "snap", "snip", "snivel", "snog", "snorkel", "snowcem",
                        "snub", "snug", "sob", "sod", "softpedal", "son", "sop", "spam", "span", "spar", "spat", "spiderweb", "spin", "spiral", "spit", "splat", "split", "spot", "sprag", "spraygun",
                        "sprig", "springtip", "spud", "spur", "squat", "squirrel", "stab", "stag", "star", "stem", "sten", "stencil", "step", "stir", "stop", "storytel", "strap", "strim", "strip",
                        "strop", "strug", "strum", "strut", "stub", "stud", "stun", "sub", "subcrop", "sublet", "submit", "subset", "suedetrim", "sum", "summit", "sun", "suntan", "sup", "super-chil",
                        "superad", "swab", "swag", "swan", "swap", "swat", "swig", "swim", "swivel", "swot", "tab", "tag", "tan", "tansfer", "tap", "tar", "tassel", "tat", "tefer", "teleshop",
                        "tendril", "terschel", "th'strip", "thermal", "thermostat", "thin", "throb", "thrum", "thud", "thug", "tightlip", "tin", "tinsel", "tip", "tittup", "toecap", "tog", "tom",
                        "tomorrow", "top", "tot", "total", "towel", "traget", "trainspot", "tram", "trammel", "transfer", "tranship", "transit", "transmit", "transship", "trap", "travel", "trek",
                        "trendset", "trim", "trip", "tripod", "trod", "trog", "trot", "trousseaushop", "trowel", "trup", "tub", "tug", "tunnel", "tup", "tut", "twat", "twig", "twin", "twit",
                        "typeset", "tyset", "un-man", "unban", "unbar", "unbob", "uncap", "unclip", "uncompel", "undam", "under-bil", "under-cut", "under-fit", "under-pin", "under-skil", "underbid",
                        "undercut", "underlet", "underman", "underpin", "unfit", "unfulfil", "unknot", "unlip", "unlywil", "unman", "unpad", "unpeg", "unpin", "unplug", "unravel", "unrol", "unscrol",
                        "unsnap", "unstal", "unstep", "unstir", "untap", "unwrap", "unzip", "up", "upset", "upskil", "upwel", "ven", "verbal", "vet", "victual", "vignet", "wad", "wag", "wainscot",
                        "wan", "war", "water-log", "waterfal", "waterfil", "waterlog", "weasel", "web", "wed", "wet", "wham", "whet", "whip", "whir", "whiteskin", "whiz", "whup", "wildcat", "win",
                        "windmil", "wit", "woodchop", "woodcut", "wor", "worship", "wrap", "wiretap", "yen", "yak", "yap", "yarnspin", "yip", "yodel", "zag", "zap", "zig", "zig-zag", "zigzag", "zip",
                        "ztrip", "hand-bag", "hocus", "hocus-pocus" ]
            };

            // !@# placed outside main constants statement as a workaround to a
            // js scope issue
            RC.PAST_PARTICIPLE_RULESET = {
                name : "PAST_PARTICIPLE",
                defaultRule : new RegexRule(RC.ANY_STEM, 0, "ed", 2),
                rules : RC.PAST_PARTICIPLE_RULES,
                doubling : false
            };

            RC.PRESENT_PARTICIPLE_RULESET = {
                name : "ING_FORM",
                defaultRule : new RegexRule(RC.ANY_STEM, 0, "ing", 2),
                rules : RC.ING_FORM_RULES,
                doubling : false
            };

            RC.PAST_TENSE_RULESET = {
                name : "PAST_TENSE",
                defaultRule : new RegexRule(RC.ANY_STEM, 0, "ed", 2),
                rules : RC.PAST_TENSE_RULES,
                doubling : false
            };

            RC.PRESENT_TENSE_RULESET = {
                name : "PRESENT_TENSE",
                defaultRule : new RegexRule(RC.ANY_STEM, 0, "s", 2),
                rules : RC.PRESENT_TENSE_RULES,
                doubling : true
            };
            
   
            // //////////////////////
            // Main RiTa object //
            // //////////////////////

            RiTa = {

            	VERSION : 11,
            	
            	// false to handle animations manually
            	AUTO_STEP : true,
            	
                // Counter for unique object IDs
                ID_GEN : 0, // should be private!
                           
                step : function() {
	             	var i, t, isComplete, b = TextBehavior.instances;
	
	                if (b.length > 0) {
	                    i = b.length;
	                    while (i--) {
	                        isComplete = b[i].update();
	                        if (isComplete) {
	                            removeFromArray(TextBehavior.instances, TextBehavior.instances[i]);
	                            TextBehavior.instances[i] = null;
	                        }
	                    }
	                }
                },
                
                nextId : function() { return ++this.ID_GEN; },

                // Timestamp functions
                //millisOffset : Date.now(),
                
                //millis : function() { return Date.now(); }, // - this.millisOffset; },

                // Container for all behaviors
                //behaviors : [], // moved to RiText

                //riTextInstances : [],

                // Delete all behaviors on a RiText. If called without argument,
                // deletes all behaviors on all RiTexts.
//                disposeBehaviors : function(rt) {
//
//                    var b = RiTa.behaviors, l = b.length;
//
//                    while (l--) {
//                        if (rt) {
//                            if (b[l].rt === rt) {
//                                b[l].destroy();
//                            }
//                        } else {
//                            b[l].destroy();
//                        }
//                    }
//                },

                // Runs onRiTaEvent function in user sketch, if it exists
                fireEvent : function(re) {
                    if (typeof onRiTaEvent == "function") {
                        onRiTaEvent(re);
                        return true;
                    } else {
                        return false;
                    }
                },

                // Runs once per frame
                interval : window.setInterval(function() {
                	if (RiTa.AUTO_STEP) RiTa.step();
//                 	var i, t, isComplete, b = TextBehavior.instances;
//                	
//	                if (b.length > 0) {
//	                    i = b.length;
//	                    while (i--) {
//	                        isComplete = b[i].update();
//	                        if (isComplete) {
//	                            removeFromArray(TextBehavior.instances, TextBehavior.instances[i]);
//	                            TextBehavior.instances[i] = null;
//	                        }
//	                    }
//	                }

                }, RC.SLEEP_PER_FRAME_MS),

                // Pluralizes a word according to rules in constants
                pluralize : function(word) {

                    var i, rule, result, rules = RC.PLURAL_RULES;

                    if (inArray(RC.MODALS, word.toLowerCase())) {
                        return word;
                    }

                    i = rules.length;
                    while (i--) {
                        rule = rules[i];
                        if (rule.applies(word.toLowerCase())) {
                            return rule.fire(word);
                        }
                    }

                    return RC.DEFAULT_PLURAL_RULE.fire(word);
                },

                // Tokenizes the string according to Penn Treebank conventions
                tokenize : function(words) {

                    words = words.replace(/``/g, "`` ");
                    words = words.replace(/''/g, "  ''");
                    words = words.replace(/([\\?!\"\\.,;:@#$%&])/g, " $1 ");
                    words = words.replace(/\\.\\.\\./g, " ... ");
                    words = words.replace(/\\s+/g, RC.SPC);
                    words = words.replace(/,([^0-9])/g, " , $1");
                    words = words.replace(/([^.])([.])([\])}>\"']*)\\s*$/g, "$1 $2$3 ");
                    words = words.replace(/([\[\](){}<>])/g, " $1 ");
                    words = words.replace(/--/g, " -- ");
                    words = words.replace(/$/g, RC.SPC);
                    words = words.replace(/^/g, RC.SPC);
                    words = words.replace(/([^'])' /g, "$1 ' ");
                    words = words.replace(/'([SMD]) /g, " '$1 ");

                    if (RC.SPLIT_CONTRACTIONS) {
                        words = words.replace(/'ll /g, " 'll ");
                        words = words.replace(/'re /g, " 're ");
                        words = words.replace(/'ve /g, " 've ");
                        words = words.replace(/n't /g, " n't ");
                        words = words.replace(/'LL /g, " 'LL ");
                        words = words.replace(/'RE /g, " 'RE ");
                        words = words.replace(/'VE /g, " 'VE ");
                        words = words.replace(/N'T /g, " N'T ");
                    }

                    words = words.replace(/ ([Cc])annot /g, " $1an not ");
                    words = words.replace(/ ([Dd])'ye /g, " $1' ye ");
                    words = words.replace(/ ([Gg])imme /g, " $1im me ");
                    words = words.replace(/ ([Gg])onna /g, " $1on na ");
                    words = words.replace(/ ([Gg])otta /g, " $1ot ta ");
                    words = words.replace(/ ([Ll])emme /g, " $1em me ");
                    words = words.replace(/ ([Mm])ore'n /g, " $1ore 'n ");
                    words = words.replace(/ '([Tt])is /g, " $1 is ");
                    words = words.replace(/ '([Tt])was /g, " $1 was ");
                    words = words.replace(/ ([Ww])anna /g, " $1an na ");

                    // "Nicole I. Kidman" gets tokenized as "Nicole I . Kidman"
                    words = words.replace(/ ([A-Z]) \\./g, " $1. ");
                    words = words.replace(/\\s+/g, RC.SPC);
                    words = words.replace(/^\\s+/g, "");

                    return trim(words).split(RC.SPC);
                },

                // Implementation of the Porter Stemming Algorithm by Martin
                // Porter
                // Transforms a word into its root form.
                // The original paper is in Porter, 1980, An algorithm for
                // suffix stripping, Program, Vol. 14, no. 3, pp 130-137
                // See also http://www.tartarus.org/~martin/PorterStemmer

                stem : function(word) {

                    var a, b = [], ch, i, j, k, z;

                    // cons(i) is true <=> b[i] is a consonant.
                    function cons(t) {
                        switch (b[t]) {
                        case 'a':
                            return false;
                        case 'e':
                            return false;
                        case 'i':
                            return false;
                        case 'o':
                            return false;
                        case 'u':
                            return false;
                        case 'y':
                            return (t == 0) ? true : !cons(t - 1);
                        default:
                            return true;
                        }
                    }

                    // m() measures the number of consonant sequences between 0
                    // and j. if c is a
                    // consonant sequence and v a vowel sequence, and <..>
                    // indicates arbitrary presence,
                    // <c><v> gives 0 <c>vc<v> gives 1 <c>vcvc<v> gives 2
                    // <c>vcvcvc<v> gives 3
                    function m() {
                        var n = 0, t = 0;
                        while (true) {
                            if (t > j) {
                                return n;
                            }
                            if (!cons(t)) {
                                break;
                            }
                            t++;
                        }
                        t++;
                        while (true) {
                            while (true) {
                                if (t > j) {
                                    return n;
                                }
                                if (cons(t)) {
                                    break;
                                }
                                t++;
                            }
                            t++;
                            n++;
                            while (true) {
                                if (t > j) {
                                    return n;
                                }
                                if (!cons(t)) {
                                    break;
                                }
                                t++;
                            }
                            t++;
                        }
                        return false;
                    }

                    // vowelinstem() is true <=> 0,...j contains a vowel
                    function vowelinstem() {
                        for ( var t = 0; t <= j; t++) {
                            if (!cons(t)) {
                                return true;
                            }
                        }
                        return false;
                    }

                    // doublec(j) is true <=> j,(j-1) contain a double
                    // consonant.
                    function doublec(j) {
                        if (j < 1) {
                            return false;
                        }
                        if (b[j] != b[j - 1]) {
                            return false;
                        }
                        return cons(j);
                    }

                    // cvc(i) is true <=> i-2,i-1,i has the form consonant -
                    // vowel - consonant and
                    // also if the second c is not w,x or y. this is used when
                    // trying to restore
                    // an e at the end of a short word. e.g. => cav(e), lov(e),
                    // hop(e), crim(e), but snow, box, tray.
                    function cvc(t) {
                        if (t < 2 || !cons(t) || cons(t - 1) || !cons(t - 2)) {
                            return false;
                        }
                        if (b[t] == 'w' || b[t] == 'x' || b[t] == 'y') {
                            return false;
                        }
                        return true;
                    }

                    function ends(s) {
                        var l = s.length, o = k - l + 1, t;
                        if (o < 0) {
                            return false;
                        }
                        for (t = 0; t < l; t++) {
                            if (b[o + t] != s.charAt(t)) {
                                return false;
                            }
                        }
                        j = k - l;
                        return true;
                    }

                    // setto(s) sets (j+1),...k to the characters in the string
                    // s, readjusting k.
                    function setto(s) {
                        var l = s.length, o = j + 1, t;
                        for (t = 0; t < l; t++) {
                            b[o + t] = s.charAt(t);
                        }
                        k = j + l;
                    }

                    function r(s) {
                        if (m() > 0) {
                            setto(s);
                        }
                    }

                    // Step 1 gets rid of plurals and -ed or -ing. e.g. ::
                    // caresses -> caress ponies -> poni ties -> ti
                    // caress -> caress cats -> cat feed -> feed agreed -> agree
                    // disabled -> disable matting -> mat
                    // mating -> mate meeting -> meet milling -> mill messing ->
                    // mess meetings -> meet
                    function step1() {
                        if (b[k] == 's') {
                            if (ends("sses")) {
                                k -= 2;
                            } else if (ends("ies")) {
                                setto("i");
                            } else if (b[k - 1] != 's') {
                                k--;
                            }
                        }

                        if (ends("eed")) {
                            if (m() > 0) {
                                k--;
                            }
                        }

                        else if ((ends("ed") || ends("ing")) && vowelinstem()) {
                            k = j;
                            if (ends("at")) {
                                setto("ate");
                            } else if (ends("bl")) {
                                setto("ble");
                            } else if (ends("iz")) {
                                setto("ize");
                            } else if (doublec(k)) {
                                k--;
                                ch = b[k];
                                if (ch == 'l' || ch == 's' || ch == 'z') {
                                    k++;
                                }
                            } else if (m() == 0 && cvc(k)) {
                                setto("e");
                            }
                        }
                    }

                    // Step 2 turns terminal y to i when there is another vowel
                    // in the stem.
                    function step2() {
                        if (ends("y") && vowelinstem()) {
                            b[k] = 'i';
                        }
                    }

                    // Step 3 maps double suffices to single ones. so -ization (
                    // = -ize plus
                    // -ation) maps to -ize etc. note that the string before the
                    // suffix must give m() > 0.
                    function step3() {
                        if (k !== 0) {
                            switch (b[k - 1]) {
                            case 'a':
                                if (ends("ational")) {
                                    r("ate");
                                    break;
                                }
                                if (ends("tional")) {
                                    r("tion");
                                    break;
                                }
                                break;
                            case 'c':
                                if (ends("enci")) {
                                    r("ence");
                                    break;
                                }
                                if (ends("anci")) {
                                    r("ance");
                                    break;
                                }
                                break;
                            case 'e':
                                if (ends("izer")) {
                                    r("ize");
                                    break;
                                }
                                break;
                            case 'l':
                                if (ends("bli")) {
                                    r("ble");
                                    break;
                                }
                                if (ends("alli")) {
                                    r("al");
                                    break;
                                }
                                if (ends("entli")) {
                                    r("ent");
                                    break;
                                }
                                if (ends("eli")) {
                                    r("e");
                                    break;
                                }
                                if (ends("ousli")) {
                                    r("ous");
                                    break;
                                }
                                break;
                            case 'o':
                                if (ends("ization")) {
                                    r("ize");
                                    break;
                                }
                                if (ends("ation")) {
                                    r("ate");
                                    break;
                                }
                                if (ends("ator")) {
                                    r("ate");
                                    break;
                                }
                                break;
                            case 's':
                                if (ends("alism")) {
                                    r("al");
                                    break;
                                }
                                if (ends("iveness")) {
                                    r("ive");
                                    break;
                                }
                                if (ends("fulness")) {
                                    r("ful");
                                    break;
                                }
                                if (ends("ousness")) {
                                    r("ous");
                                    break;
                                }
                                break;
                            case 't':
                                if (ends("aliti")) {
                                    r("al");
                                    break;
                                }
                                if (ends("iviti")) {
                                    r("ive");
                                    break;
                                }
                                if (ends("biliti")) {
                                    r("ble");
                                    break;
                                }
                                break;
                            case 'g':
                                if (ends("logi")) {
                                    r("log");
                                    break;
                                }
                            }
                        }
                    }

                    // Step 4 deals with -ic-, -full, -ness etc. similar
                    // strategy to step 3.
                    function step4() {
                        switch (b[k]) {
                        case 'e':
                            if (ends("icate")) {
                                r("ic");
                                break;
                            }
                            if (ends("ative")) {
                                r("");
                                break;
                            }
                            if (ends("alize")) {
                                r("al");
                                break;
                            }
                            break;
                        case 'i':
                            if (ends("iciti")) {
                                r("ic");
                                break;
                            }
                            break;
                        case 'l':
                            if (ends("ical")) {
                                r("ic");
                                break;
                            }
                            if (ends("ful")) {
                                r("");
                                break;
                            }
                            break;
                        case 's':
                            if (ends("ness")) {
                                r("");
                                break;
                            }
                            break;
                        }
                    }

                    // Step 5 takes off -ant, -ence etc., in context <c>vcvc<v>.
                    function step5() {
                        if (k !== 0) {
                            switch (b[k - 1]) {
                            case 'a':
                                if (ends("al")) {
                                    z = 1;
                                    break;
                                }
                                break;
                            case 'c':
                                if (ends("ance")) {
                                    z = 1;
                                    break;
                                }
                                if (ends("ence")) {
                                    z = 1;
                                    break;
                                }
                                break;
                            case 'e':
                                if (ends("er")) {
                                    z = 1;
                                    break;
                                }
                                break;
                            case 'i':
                                if (ends("ic")) {
                                    z = 1;
                                    break;
                                }
                                break;
                            case 'l':
                                if (ends("able")) {
                                    z = 1;
                                    break;
                                }
                                if (ends("ible")) {
                                    z = 1;
                                    break;
                                }
                                break;
                            case 'n':
                                if (ends("ant")) {
                                    z = 1;
                                    break;
                                }
                                if (ends("ement")) {
                                    z = 1;
                                    break;
                                }
                                if (ends("ment")) {
                                    z = 1;
                                    break;
                                }
                                if (ends("ent")) {
                                    z = 1;
                                    break;
                                }
                                break;
                            case 'o':
                                if (ends("ion") && j >= 0 && (b[j] == 's' || b[j] == 't')) {
                                    z = 1;
                                    break;
                                }
                                if (ends("ou")) {
                                    z = 1;
                                    break;
                                }
                                break;
                            case 's':
                                if (ends("ism")) {
                                    z = 1;
                                    break;
                                }
                                break;
                            case 't':
                                if (ends("ate")) {
                                    z = 1;
                                    break;
                                }
                                if (ends("iti")) {
                                    z = 1;
                                    break;
                                }
                                break;
                            case 'u':
                                if (ends("ous")) {
                                    z = 1;
                                    break;
                                }
                                break;
                            case 'v':
                                if (ends("ive")) {
                                    z = 1;
                                    break;
                                }
                                break;
                            case 'z':
                                if (ends("ize")) {
                                    z = 1;
                                    break;
                                }
                                break;
                            }
                            if (z && m() > 1) {
                                k = j;
                            }
                        }
                    }

                    // Step 6 removes a final -e if m() > 1.
                    function step6() {
                        j = k;
                        if (b[k] == 'e') {
                            a = m();
                            if (a > 1 || (a == 1 && !cvc(k - 1))) {
                                k--;
                            }
                        }
                        if (b[k] == 'l' && doublec(k) && m() > 1) {
                            k--;
                        }
                    }

                    k = word.length - 1;
                    for (i = 0, l = word.length; i < l; i++) {
                        b[i] = word.charAt(i);
                    }
                    if (k > 1) {
                        step1();
                        step2();
                        step3();
                        step4();
                        step5();
                        step6();
                    }
                    return (b.splice(0, k + 1)).join('');

                },

                // !@# TODO: replace this barely-there placeholder impl.
                splitSentences : function(text) {
                	
                	if (isNull(text)) return [];
                	
                    var arr = text.match(/(\S.+?[.!?])(?=\s+|$)/g);
                    
                    if (isNull(arr) || arr.length == 0) return [];
                    
                    return arr;
                }

            };

            // ///////////////
            // RiGrammar //
            // ///////////////

            var PROB_PATTERN = /(.*[^\s])\s*\[([0-9.]+)\](.*)/;
            var START_RULE = "<start>";
            var OR_PATTERN = /\s*\|\s*/;

            RiGrammar = function RiGrammar() {
                this.rules = {};

                try // look for a grammar object
                {
                    if (grammar) // D: can we set this dynamically?
                    {
                        for ( var rule in grammar) {
                            // console.log(rule+ " -> "+grammar[rule]);
                            this.addRule(rule, grammar[rule]);
                        }
                    }
                } catch (e) {
                    // in case we are specifying grammar with strings-only
                    console.warn("[WARN] No 'grammar' object found");
                }
            };
  
            RiGrammar.prototype = {
                
                addRule : function(name, ruleStr, weight) {

                    var dbug = false;

                    if (!weight)
                        weight = 1.0; // default

                    var ruleset = ruleStr.split(OR_PATTERN);

                    for ( var i = 0; i < ruleset.length; i++) {
                        var rule = ruleset[i];
                        var prob = weight;
                        var m = PROB_PATTERN.exec(rule);

                        if (m != null) // found weighting
                        {
                            if (dbug) {
                                console.log("Found weight! for " + rule);
                                for (i = 0; i < m.length; i++)
                                    console.log("  " + i + ") '" + m[i] + "'");
                            }
                            rule = m[1] + m[3];
                            prob = m[2];
                            if (dbug)
                                console.log("weight=" + prob + " rule='" + rule + "'");
                        }

                        if (this.hasRule(name)) {
                            // console.log("rule exists");
                            var temp = this.rules[name];
                            temp[rule] = prob;
                        } else {
                            // console.log("new rule");
                            temp2 = {};
                            temp2[rule] = prob;
                            this.rules[name] = temp2;
                        }
                    }
                },
//                clearRules : function() {  
//                    this.rules = {};
//                },
                getRule : function(pre) {
                    // console.log("getRule("+pre+")");
                    var tmp = this.rules[pre];
                    var name, cnt = 0;
                    for (name in tmp) {
                        // console.log("TMP: "+name+"="+tmp[name]);
                        cnt++;
                    }
                    // console.log("cnt="+cnt);
                    if (cnt == 1) {
                        return name;
                    } else {
                        return this.getStochasticRule(tmp);
                    }

                    return tmp;
                },
                getStochasticRule : function(temp) // map
                {
                    var dbug = false;
                    if (dbug)
                        console.log("getStochasticRule(" + temp + ")");
                    var p = Math.random();
                    var result, total = 0;
                    for ( var name in temp) {
                        // console.log("TMP: "+name+"="+temp[name]);
                        total += parseFloat(temp[name]);
                    }
                    if (dbug)
                        console.log("total=" + total);
                    if (dbug)
                        console.log("p=" + p);
                    for ( var name in temp) {
                        if (dbug)
                            console.log("  name=" + name);
                        var amt = temp[name] / total;
                        if (dbug)
                            console.log("amt=" + amt);
                        if (p < amt) {
                            result = name;
                            if (dbug)
                                console.log("hit!=" + name);
                            break;
                        } else {
                            p -= amt;
                        }
                    }
                    return result;
                },
                dump : function() {
                    // console.log("dump()");
                    console.log("Grammar----------------")
                    for ( var name in this.rules) {
                        var prob = this.rules[name];
                        console.log("  '" + name + "' -> ");
                        for ( var x in prob) {
                            console.log("    '" + x + "' [" + prob[x] + "]");
                        }
                    }
                    console.log("-----------------------");
                },
                hasRule : function(name) {
                    return (typeof this.rules[name] !== 'undefined');
                },
                expandRule : function(prod) {
                    var dbug = false;
                    if (dbug)
                        console.log("expandRule(" + prod + ")");
                    for ( var name in this.rules) {
                        var entry = this.rules[name];
                        if (dbug)
                            console.log("  name=" + name);
                        if (dbug)
                            console.log("  entry=" + entry);
                        if (dbug)
                            console.log("  prod=" + prod);
                        var idx = prod.indexOf(name);
                        if (dbug)
                            console.log("  idx=" + idx);
                        if (idx >= 0) {
                            var pre = prod.substring(0, idx);
                            var expanded = this.getRule(name);
                            var post = prod.substring(idx + name.length);
                            if (dbug)
                                console.log("  pre=" + pre);
                            if (dbug)
                                console.log("  expanded=" + expanded);
                            if (dbug)
                                console.log("  post=" + post);
                            if (dbug)
                                console.log("  result=" + pre + expanded + post);
                            return (pre + expanded + post);
                        }
                    }
                    return null;
                },
                expand : function() {
                    return this.expandFrom(START_RULE);
                },
                expandWith : function() {
                    throw new Error("Not implemented");
                },
                expandFrom : function(rule) {
                    if (!this.hasRule(rule)) {
                        console.log("[WARN] Definition not found: " + rule + "\nRules:");
                        // throw new RiTaException("Definition not found:
                        // "+rule+"\nRules:\n"+rules);
                        dump();
                    }

                    var iterations = 0;
                    var maxIterations = 100;
                    while (++iterations < maxIterations) {
                        var next = this.expandRule(rule);
                        if (next == null)
                            break;
                        rule = next;
                    }

                    if (iterations >= maxIterations)
                        console.log("[WARN] max number of iterations reached: " + maxIterations);

                    // System.out.println("# Iterations="+iterations);

                    return rule;
                }
            /*
             * setGrammarFromString : function(grammarStr) { return
             * "setGrammarFromString()"; } getGrammarFileName : function() {
             * return this.fileName; }
             */
            };

            // ////////////
            // RiText //
            // ////////////

            // !@# RiText functions which are not "getters" return a reference
            // to the RiText, allowing compact js chaining syntax:
            // myRitext.setText("hello").setColor(100,100,100,255).draw();
            // Should be included in docs.

            // Container for all created RiText objects

            RiText = function RiText(text, xPos, yPos, font) {
            	return this.init(text, xPos, yPos, font); 
            }
            
            RiText.instances = [];
        		
            RiText.defaults = {
                x : 0, y : 0, z : 0,
                color : { r : 0, g : 0, b : 0, a : 255 },
                alignment : RC.LEFT,
                motionType : RC.LINEAR,
                boundingBoxVisible : false,
                font : createFont("Arial", 12),
                scaleX : 1, scaleY : 1, scaleZ : 1,
                rotateX : 0, rotateY : 0, rotateZ : 0
                //theFontSize : 10,  
            };

            // !@# does this need an interface?
            RiText.callbacksDisabled = false;

            // Set of (static) functions to be called on RiText class, not on instances

            RiText.disposeAll = function() {
            	for (var i = 0; i < RiText.instances.length; i++)
            		delete(RiText.instances[i]);
                RiText.instances = [];
                return true;
            };
            
            RiText.dispose = function(riTextArray) { // BROKEN: 3.2.12: DCH
            	var ok = true;
            	for (var i = 0; i < riTextArray.length; i++) {
            		if (!riTextArray[i].dispose()) 
            			ok = false;
            	}
            	return ok;
            };
            
            // ======================================================
            RiText.createLines = function(txt, x, y, maxW, maxH, leading, pf) {
            	
            	// remove line breaks
            	txt = replaceAll(txt, "\n", " ");

            	// 	adds spaces around html tokens
            	txt = replaceAll(txt, " ?(<[^>]+>) ?", " $1 ");
            	
            	// split into array of words
            	var tmp = txt.split(" ");
            	      	
            	var words = [];
            	for (var i = tmp.length - 1; i >= 0; i--)
            		words.push(tmp[i]);
            	
            	if (words.length < 1) return new Array();
            	    
                var tmp = new RiText(" ");
                var theFont = assign(theFont, RiText.defaults.font);
                tmp.textFont(theFont);
                var textH = tmp.textHeight();
                tmp.dispose();
            	
     
                var currentH = 0, currentW = 0;
                var newParagraph = false; 
                var forceBreak = false;
                
                var strLines = new Array();
                
                var sb = RiText.indentFirstParagraph ? RiText.PARAGRAPH_INDENT : "";
                while (words.length > 0) 
                { 
                	
                  var next = words.pop();
                  if (next.length == 0)
                    continue;
                  
                  if (startsWith(next,'<') && endsWith(next,">"))
                  {
                  	//println("HTML: "+next);

                    if (next === RiText.NON_BREAKING_SPACE || next === "</sp>")
                    {
                      sb += " ";
                    }
                    else if (next === RiText.PARAGRAPH || next === "</p>")
                    {
                      if (sb.length > 0)      // case: paragraph break
                        newParagraph = true;
                      else if (RiText.indentFirstParagraph) 
                    	  sb += RiText.PARAGRAPH_INDENT;
                    }
                    else if (endsWith(next, RiText.LINE_BREAK) || next === "</br>") {
                      forceBreak = true;
                    }
                    continue;
                  }
                  
                  textFont(theFont);
                  currentW = textWidth(sb + next);
                  
                  // check line-length & add a word
                  if (!newParagraph && !forceBreak && currentW < maxW)
                  {
        			sb += next + " "; // was addWord(sb, next);
                  }
                  else // new paragraph or line-break
                  {
                    // check vertical space, add line & next word
                    if (RiText.checkLineHeight(currentH, textH, maxH))
                    {
                      RiText.addLine(strLines, sb);
                      sb = "";
                      
                      if (newParagraph)  { // do indent
    
                    	sb += RiText.PARAGRAPH_INDENT;
                        if (RiText.PARAGRAPH_LEADING>0) {
                          sb += '|'; // dirty
                        }
                      }
                      newParagraph = false;
                      forceBreak = false;
                      sb += next + " ";//addWord(sb, next);
                      
                      currentH += textH; // DCH: changed(port-to-js), 3.3.12 
                      // currentH += lineHeight; 
                    }
                    else {
                      if (next != null)
                        words.push(next);
                      break;
                    }
                  }
              }
                  
              // check if leftover words can make a new line
              if (RiText.checkLineHeight(currentH, textH, maxH)) {
            	  RiText.addLine(strLines, sb);
            	  sb = "";
              }
              else {
            	  RiText.pushLine(words, sb.split(" "));
              }
              
              var rts = RiText.createLinesByCharCountFromArray
                (strLines, x + 1, y + textH - 2, -1, leading, pf);
              
              // set the paragraph spacing
              if (RiText.PARAGRAPH_LEADING > 0)  {
            	var lead = 0;
                for (var i = 0; i < rts.length; i++)
                {
                  var str = rts[i].getText();
                  var idx = str.indexOf('|');
                  if (idx > -1) {
                    lead += RiText.PARAGRAPH_LEADING;
                    rts[i].removeCharAt(idx);
                  }
                  rts[i].y += lead;
                }
              }
              
              // double-check that all the lines are in the rect (yuk!)
              var check = rts[rts.length - 1];
              while (check.y > y + maxH)
              {
                var chkArr = check.getText().split(" ");
                rts.pop().dispose();
                RiText.pushLine(words, chkArr); // re-add words to stack
                check = rts[rts.length - 1];
              }
                
              return rts;
            };

            // doesnt have a test
            RiText.createLinesByCharCountFromArray = function(txtArr, startX, startY, maxCharsPerLine, leading, font) 
            {
                //console.log("RiText.createLinesByCharCountFromArray("+txtArr+", maxChars="+maxCharsPerLine+")");

				if (maxCharsPerLine == -1)
				{
				  var ritexts = [];
				  for (var i = 0; i < txtArr.length; i++)
				  {
					var rr = new RiText(txtArr[i], startX, startY);
				    if (!isNull(font))
				    {
				      rr.textFont(font);
				    }
				    ritexts.push(rr);
				  }
				
				  if (ritexts.length < 1) return [];
				
				  handleLeading(font, ritexts, startY, leading);
				
				  return ritexts;
				}
				// will this ever happen?
				else
				  return createLines(txtArr, startX, startY, maxCharsPerLine, leading, font);
            };
            
            RiText.createLinesByCharCount = function(txt, startX, startY, maxCharsPerLine, leading, pFont) 
            { 
                //console.log("RiText.createLinesByCharCount("+txt+", "+startX+","+startY+", "+maxCharsPerLine+", "+leading+", "+pFont+")");
            	
                if (isNull(pFont)) pFont = RiText.defaults.font;
                	
                if (isNull(maxCharsPerLine) || maxCharsPerLine < 1)
                    maxCharsPerLine = INTEGER_MAX_VALUE;

                if (txt == null || txt.length == 0) 
                	return new Array();

                if (txt.length < maxCharsPerLine)
                    return [ new RiText(txt, startX, startY) ];

                // remove any line breaks from the original
                txt = replaceAll(txt, "\n", " ");

                var texts = [];
                while (txt.length > maxCharsPerLine) {
                    var toAdd = txt.substring(0, maxCharsPerLine);
                    txt = txt.substring(maxCharsPerLine, txt.length);

                    var idx = toAdd.lastIndexOf(" ");
                    var end = "";
                    if (idx >= 0) {
                        end = toAdd.substring(idx, toAdd.length);
                        if (maxCharsPerLine < INTEGER_MAX_VALUE)
                            end = end.trim();
                        toAdd = toAdd.substring(0, idx);
                    }
                    texts.push(new RiText(toAdd.trim(), startX, startY));
                    txt = end + txt;
                }

                if (txt.length > 0) {
                    if (maxCharsPerLine < INTEGER_MAX_VALUE)
                    	txt = txt.trim();
                    texts.push(new RiText(txt, startX, startY));
                }

                handleLeading(pFont, texts, startY, leading);

                return texts;
            };
            
            // privates ! ============================================
            RiText.PARAGRAPH_INDENT = '    ';
            RiText.PARAGRAPH_LEADING = 0;
            RiText.indentFirstParagraph = true;
            RiText.NON_BREAKING_SPACE = "<sp>";
            RiText.LINE_BREAK = "<br>";
            RiText.PARAGRAPH = "<p>";
           
            RiText.addSpaces = function(str, num)
            {
              for (var i = 0; i < num; i++)
            	  str += " ";
              return str;
            };
     	   RiText.checkLineHeight = function(currentH, lineH, maxH)
            {
              return currentH + lineH <= maxH;
            };
            RiText.pushLine = function(arr, tmp)
            {
              for (var i = tmp.length - 1; i >= 0; i--) // reverse?
            	  arr.push(tmp[i]);
            };
            RiText.addLine = function( l,  s) // remove?
            {
              //println("addLine("+l+")");
              if (!isNull(s))
              { 
                // strip trailing spaces (regex?)
                while (s.length > 0 && endsWith(s, " "))
                  s = s.substring(0, s.length- 1);
                l.push(s); // add && clear the builder
              }
    
            }  //  ! ============================================

            
            RiText.setDefaultMotionType = function(motionType) {
                RiText.defaults.motionType = motionType;
                return this;
            };

            RiText.setDefaultBoundingBoxVisible = function(value) {
                RiText.defaults.boundingBoxVisible = value;
            };

            RiText.setDefaultFont = function(pfont) {
                RiText.defaults.font = pfont;
            };

            RiText.setDefaultFontSize = function(size) {
            	console.warn("RiText.setDefaultFontSize() " +
            		"deprecated, use setDefaultFont() instead");
            };
            
            RiText.setDefaultAlignment = function(align) {
                RiText.defaults.alignment = align;
            };
            
            RiText.createWords = function(txt, x, y, w, h, lead, pfont)
            {
            	return RiText.createRiTexts
            	  (txt, x, y, w, h, lead, pfont, RiText.prototype.splitWords);
            };
            
            RiText.createLetters = function(txt, x, y, w, h, lead, pfont)
            {
            	return RiText.createRiTexts 
            	  (txt, x, y, w, h, lead, pfont, RiText.prototype.splitLetters);
            };
            
            RiText.createRiTexts = function(txt, x, y, w, h, lead, pfont, splitFun) // private 
            {
            	if (isNull(txt) || txt.length == 0) return [];
                
                var theFont = assign(theFont, RiText.defaults.font);
                var rlines = RiText.createLines(txt, x, y, w, h, lead, pfont);
                if (isNull(rlines)) return [];
                
                var result = [];
                for (var i = 0; i < rlines.length; i++)
                {
                  var rts = splitFun.call(rlines[i]);
                  for (var j = 0; j < rts.length; j++)
                    result.push(rts[j].textFont(theFont)); // add the words
                  rlines[i].dispose();
                }
                
                return result;
            };
            
            RiText.drawAll = function() {
                //for (var i = 0; i < RiTa.riTextInstances.length; i++)
                  //RiTa.riTextInstances[i].draw();
                for (var i = 0; i < RiText.instances.length; i++)
                	RiText.instances[i].draw();
            };
                  
            RiText.setDefaultColor = function(r, g, b, a) {
                if (arguments.length >= 3) {
                    if (typeof (r) === 'number') {
                        RiText.defaults.color.r = r;
                    }
                    if (typeof (g) === 'number') {
                        RiText.defaults.color.g = g;
                    }
                    if (typeof (b) === 'number') {
                        RiText.defaults.color.b = b;
                    }
                }
                if (arguments.length == 4) {
                    if (typeof (a) === 'number') {
                        RiText.defaults.color.a = a;
                    }
                }
                if (arguments.length <= 2) {
                    if (typeof (r) === 'number') {
                        RiText.defaults.color.r = r;
                        RiText.defaults.color.g = r;
                        RiText.defaults.color.b = r;
                    }
                }
                if (arguments.length == 2) {
                    if (typeof (g) === 'number') {
                        RiText.defaults.color.a = g;
                    }
                }
                return this;
            };

            RiText.prototype = {
				
            	toString : function() {
					return "['" + this.getText() + "']";
				},
				
	            init : function(text, xPos, yPos, font) {

	            	//RiText.instances = [];
	            	
	                this.color = {
	                    r : RiText.defaults.color.r,
	                    g : RiText.defaults.color.g,
	                    b : RiText.defaults.color.b,
	                    a : RiText.defaults.color.a
	                };
	                
	                this.boundingBoxVisible = RiText.defaults.boundingBoxVisible;
	                this.motionType = RiText.defaults.motionType;
	                this.alignment = RiText.defaults.alignment;
	                this.textFont(!isNull(font) ? font : RiText.defaults.font);

	                this.behaviors = [];
	                this.scaleX = RiText.defaults.scaleX;
	                this.scaleY = RiText.defaults.scaleY;
	                
	                // this.hidden = false;
	                // this.fontSize = RiText.defaults.fontSize;
	                //this.riString = new RiString();
	                //this.rotateX = RiText.defaults.rotateX;
	                //this.rotateY = RiText.defaults.rotateY;
	                //this.rotateZ = RiText.defaults.rotateZ;
	                //this.scaleZ = RiText.defaults.scaleZ;
	                
	                //RiTa.riTextInstances.push(this);
	                RiText.instances.push(this);

	                if (typeof (text) == 'string') {
	                    this.riString = new RiString(text);
	                }
	                else if (typeof (text) == 'object' && typeof (text.text == 'undefined')) {
	                    this.riString = new RiString(text.text);
	                    applicate(this, text);
	                }
	                else throw new Error("RiText expects 'string' or RiString, got: "+text);

	                this.x = (assign(xPos, (width / 2) - this.textWidth()/2.0));
	                this.y = (assign(yPos,  height / 2));
	                
	                return this;
	            },
	            
				// these functions delegate to processing.js (!@# only functions
				// in the lib that do) =====
				draw : function() {

                    pushStyle();
                    
                    // Orient the pjs renderer (D: what if we are in 3D??)
                    pushMatrix();

	                    // DCH: need to add scale? FIXED 8/16
	
	                    translate(this.x, this.y);
	                    // rotate(this.rotateZ);  
	                    scale(this.scaleX, this.scaleY);
	
	                    // Set color
	                    fill(this.color.r, this.color.g, this.color.b, this.color.a);
	
	                    // Set font params
	                    textAlign(this.alignment);
	                    textFont(this.font, this.fontSize);

	                    // Draw text
	                    text(this.riString.getText(), 0, 0);
	         
	                    // And the bounding box
	                    if (this.boundingBoxVisible) 
	                    { 
	                    	noFill();
	                        stroke(this.color.r, this.color.g, this.color.b, this.color.a);
	                        rect(0, -this.textHeight()+textDescent(), this.textWidth(), this.textHeight());
	                    }

                    popMatrix();
                    popStyle();

                    return this;
                },
                
                dispose : function() {   // BROKEN?
                	var ok = removeFromArray(RiText.instances, this);
                	if (!ok) console.trace("FAIL");
                	delete(this.riString);
                	delete(this);
                	return ok;
                },
                
                removeCharAt : function(idx) {
                	this.riString.removeCharAt(idx);
                },
            
                equals : function(check) {
                	if (isNull(check)) return false;
                	return (this.id === check.id && this.getText() === check.getText());
                },
                
                textWidth : function() {
                    var result = -1;
                    pushStyle();
                    	textFont(this.font, this.fontSize);
                        result = textWidth(this.getText());
                    popStyle();
                    return result;
                },
                                
                // remove? duplicate of p5
                textAscent : function() {
                    var result = -1;
                    pushStyle();
                    	textFont(this.font, this.fontSize);
                    	result = textAscent();
                    popStyle();
                    return result;
                },

                // remove? duplicate of p5
                textDescent : function() {
                    var result = -1;
                    pushStyle();
                    	textFont(this.font, this.fontSize);
                    	result = textDescent();
                    popStyle();
                    return result;
                },
                

                textHeight : function() {
                    var result = -1;
                    pushStyle();
                 		textFont(this.font, this.fontSize);
                 		result = textDescent()+textAscent();
                    popStyle();
                    return result;
                },
                
                // end processing.js delegates
                
                // ===========================================================

                getX : function() {
                    return this.x;
                },

                getY : function() {
                    return this.y;
                },
                
                getFont : function() {
                    return this.font;
                },
                
                getFontSize : function() {
                    return this.fontSize;
                },
                
                splitWords : function() { 
                	
                  var l = [];
                  var txt = this.getText();
                  var words = txt.split(' ');
  
                  for (var i = 0; i < words.length; i++)
                  {
                	if (words[i].length < 1) continue;
                    var tmp = this.clone();
                    tmp.setText(words[i]);
                    var mx = this.getWordOffset(words, i);
                    tmp.setPosition(mx, this.y);
                    l.push(tmp);
                  }
                  
                  return l;
                },
                
                splitLetters : function()
                {               
                  var l = [];
                  var chars = [];
                  var txt = this.getText();
                  var len = txt.length;
                  for (t = 0; t < len; t++) {
                      chars[t] = txt.charAt(t);
                  }

                  for (var i = 0; i < chars.length; i++)
                  {
                    if (chars[i] == ' ') continue;
                    var tmp = this.clone();
                    tmp.setText(chars[i]);
                    var mx = this.getCharOffset(i);
                    tmp.setPosition(mx, this.y);
                    
                    l.push(tmp);
                  }
                  
                  return l;
                },
                
                // DCH: THIS IS JUST TMP -- IS THERE A BETTER JS WAY?
                clone : function() {
                    var c = new RiText(this.getText(), this.x, this.y);
                    // need to clone all the parameters!!!
                    c.fill(this.r, this.g, this.b, this.a);
                    c.textFont(this.font);
                    c.textSize(this.fontSize);
                    return c;
                }, 

                textAlign : function(align) {
                    this.alignment = align;
                    return this;
                },

                textSize : function(size) {
                    this.fontSize = size;
                    return this;
                },

                textFont : function(pfont) {
                    if (isNull(pfont)) {
                    	console.trace();
                    	throw new Error("Null font!");
                    	return;
                    }
                    this.font = pfont;
                    this.fontSize = pfont.size;
                    return this;
                },

                showBoundingBox : function(trueOrFalse) {
                    this.boundingBoxVisible = trueOrFalse;
                    return this;
                },

                getText : function() {
                    return this.riString.getText();
                },

                setText : function(t) {
                    this.riString.setText(t);
                    return this;
                },

                setMotionType : function(motionType) {
                    this.motionType = motionType;
                },

                getColor : function() {
                    return this.color;
                },

                // D: changed setColor to fill
                fill : function(r, g, b, a) {
                    if (arguments.length >= 3) {
                        if (typeof (r) === 'number') {
                            this.color.r = r;
                        }
                        if (typeof (g) === 'number') {
                            this.color.g = g;
                        }
                        if (typeof (b) === 'number') {
                            this.color.b = b;
                        }
                    }
                    if (arguments.length == 4) {
                        if (typeof (a) === 'number') {
                            this.color.a = a;
                        }
                    }
                    if (arguments.length <= 2) {
                        if (typeof (r) === 'number') {
                            this.color.r = r;
                            this.color.g = r;
                            this.color.b = r;
                        }
                    }
                    if (arguments.length == 2) {
                        if (typeof (g) === 'number') {
                            this.color.a = g;
                        }
                    }
                    return this;
                },

                isVisible : function() {
                    return this.color.a > 0;
                },

                setAlpha : function(a) {
                    this.color.a = a;
                    return this;
                },

                getPosition : function() {
                    return [ this.x, this.y ];
                },

                setPosition : function(x, y) {
                    this.x = x;
                    this.y = y;
                    return this;
                },

//              rotate : function(rotate) {
//                  this.rotateZ = rotate;
//                  return this;
//              },
                
                scale : function(scale) {
                    this.scaleX = scale;
                    this.scaleY = scale;
                    return this;
                },

                fadeIn : function(sec) {
                    this.fadeColor(null, null, null, 255, sec, RC.FADE_IN);
                    return this;
                },

                fadeOut : function(sec) {
                    this.fadeColor(null, null, null, 0, sec, RC.FADE_OUT);
                    return this;
                },

                // !@# TODO: add delay attributes to the two functions below
                fadeColor : function(r, g, b, a, sec, type/* , delay */) {
                    var fxType = type || RC.FADE_COLOR; // ms // !@#
                    
                    var delay = 0; // delete this line when delay added
                    anim = new ColorFader(this, [ r, g, b, a ], delay, toMs(sec), fxType);

                    // D: what is going on here? Why 2 sets?
                    // RiTa.behaviors.push(anim);                    
                    this.behaviors.push(anim);

                    return this;
                },

                moveTo : function(x, y, sec) {

                    // console.log("moveTo("+x+ ", "+y+", "+sec+")");

                    var delay = 0, // ms // !@# delete this when delay added
                    anim = new TextMotion2D(this, x, y, delay, toMs(sec));

                    this.behaviors.push(anim);

                    return this; // or return the bejavior? (no, inconsistent)
                },

//                disposeBehaviors : function() {
//                    TextBehavior.dispose(this);
//                },

                
                getCharOffset : function(charIdx) {
                      var theX = this.x;
                      
                      pushStyle();
                      textFont(this.font, this.fontSize);
                      
                      if (charIdx > 0) {
                          
                          var txt = this.getText();
                          
                          var len = txt.length;
                          if (charIdx > len) // -1?
                            charIdx = len;
                          
                          var sub = txt.substring(0, charIdx);
                          theX = this.x + textWidth(sub);
                      }
                      
                      popStyle();
                      
                      return theX;
                },
                
                getWordOffset : function(words, wordIdx)
                {          
                	//console.log("getWordOffset("+words+","+wordIdx+")");
                	
                    if (wordIdx < 0 || wordIdx >= words.length)
                        throw new Error("Bad wordIdx="+wordIdx+" for "+words);

                    pushStyle();
                    textFont(this.font, this.fontSize);

                    var xPos = this.x;

                    if (wordIdx > 0) {
                        var pre = words.slice(0, wordIdx);
                        var preStr = '';
                        for ( var i = 0; i < pre.length; i++) {
                            preStr += pre[i] + ' ';
                            //if (addSpacesBetween)preStr += ' ';
                        }

                        var tw = textWidth(preStr);
                        
                        //console.log("x="+xPos+" pre='"+preStr+"' tw=" + tw); 
                        
                        switch (this.alignment) {
                        case LEFT:
                            xPos = this.x + tw;
                            break;
                        case RIGHT:
                            xPos = this.x - tw;
                            break;
                        default: // fix this
                            throw new Error("getWordOffset() only supported for "+
                                "LEFT & RIGHT alignments, found: "+this.alignment);
                        }
                    }
                    popStyle();
                    
                    return xPos;
                }

            };
            

            // //////////////
            // RiString //
            // //////////////

            RiString = function RiString(s) {
                this.text = (typeof (s) === 'string') ? s : '';
            };

            RiString.prototype = {

                getText : function() {
                    return this.text;
                },

                setText : function(text) {
                    this.text = text;
                    return this;
                },

                getStresses : function() {
                    var a = this.getPlaintext().split(" "), result = [];

                    for ( var i = 0, l = a.length; i < l; i++) {
                        result.push(RiLexicon.getStresses(a[i]));
                    }
                    return result;
                },

                getPhonemes : function() {
                    var a = this.getPlaintext().split(" "), result = [];

                    for ( var i = 0, l = a.length; i < l; i++) {
                        result.push(RiLexicon.getPhonemes(a[i]));
                    }
                    return result;
                },

                getSyllables : function() {
                    var a = this.getPlaintext().split(" "), result = [];

                    for ( var i = 0, l = a.length; i < l; i++) {
                        result.push(RiLexicon.getSyllables(a[i]));
                    }
                    return result;
                },

                getPos : function() {
                    return this.getPosList().join(" ");
                },

                getPosList : function() {
                    var words = RiTa.tokenize(this.getPlaintext());
                    var i, tag = RiPosTagger.tag(words);
                    for (i = 0, l = tag.length; i < l; i++) {
                        if (!okStr(tag[i]))
                        	throw new Error("RiString: can't parse pos for:" + words[i]);
                    }
                    return tag;
                },

                getPlaintext : function() {
                    var text = this.getText(); // why are we doing this?
                    return trim(text.replace(/[\.,-\/#!?$%\^&\*;:{}=\-_`~()]/g, "").replace(/\s{2,100}/g, " "));
                },
                
                removeCharAt : function(ind) { 
                    var text = this.getText();
                	var string_one = text.slice(0, ind);
                	var string_two = text.slice(ind + 1, this.length);
                	this.text = string_one.concat(string_two);
                	return this;
                }

            };

            // ///////////////
            // RiLexicon //
            // ///////////////

            RiLexicon = {

                DATA_DELIM : '|',
                STRESSED : '1',
                UNSTRESSED : '0',
                PHONEME_BOUNDARY : '-',
                WORD_BOUNDARY : " ",
                SYLLABLE_BOUNDARY : "/",
                SENTENCE_BOUNDARY : "|",
                VOWELS : "aeiou", // moved constants here as test...
                    
                isVowel : function(p) {
                	if (!strOk(p)) return false; // what about 'y'?
                    return RiLexicon.VOWELS.indexOf(p.substring(0, 1)) != -1;
                },

                isConsonant : function(p) {
                	if (!strOk(p)) return false;
                    return !this.isVowel(p);
                },

                //isSilence : function(p) { // remove, no tts
                  //  return (p === "pau");
                //},
                
                contains : function(word) {
                	if (!strOk(word)) return false;
   
                    return (!isNull(RiTa_DICTIONARY[word]));
                },

                isRhyme : function(word1, word2) {
                	
                	if (!strOk(word1) || !strOk(word2)) return false;
                    if (equalsIgnoreCase(word1, word2))
                        return false;
                    var p1 = this.lastStressedPhoneToEnd(word1);
                    var p2 = this.lastStressedPhoneToEnd(word2);
                    return (strOk(p1) && strOk(p2) && p1 === p2);
                },

                getRhymes : function(word) {
                 	
                	this.buildWordlist();
                 	
                    if (this.contains(word)) {

                        var p = this.lastStressedPhoneToEnd(word);
                        var entry, entryPhones, results = [];

                        for (entry in RiTa_DICTIONARY) {
                            if (entry === word) continue;
                            entryPhones = this.getRawPhones(entry);

                            if (strOk(entryPhones) && endsWith(entryPhones, p)) {
                                results.push(entry);
                            }
                        } 
                        return (results.length > 0) ? results : null; // return null?
                    }
                    return null;  // return null?
                },

                getAlliterations : function(word) {
                	
                    if (this.contains(word)) {
                    	
                    	var c2, entry, results = [];
                        var c1 = this.firstConsonant(this.firstStressedSyllable(word));
                        
                        for (entry in RiTa_DICTIONARY) {
                            c2 = this.firstConsonant(this.firstStressedSyllable(entry));
                            if (c2 !== null && (c1 === c2)) {
                                results.push(entry);
                            }
                        }
                        return (results.length > 0) ? results : null; // return null?
                    }
                    return null; // return null?
                },

                isAlliteration : function(word1, word2) {
                	
                	if (!strOk(word1) || !strOk(word2)) return false;

                    if (equalsIgnoreCase(word1, word2)) return true;

                    var c1 = this.firstConsonant(this.firstStressedSyllable(word1));
                    var c2 = this.firstConsonant(this.firstStressedSyllable(word2));

                    return (strOk(c1) && strOk(c2) && c1 === c2);  
                },

                firstStressedSyllable : function(word) {
                	
                    var raw = this.getRawPhones(word);
                    var idx = -1, c, firstToEnd, result;
                    
                  	if (!strOk(raw))  return null; // return null?
                    
                    idx = raw.indexOf(RiLexicon.STRESSED);

                    if (idx < 0) return null; // no stresses...  return null?

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

                getSyllables : function(word) {
                	
                	var phones, i;
                    var raw = this.getRawPhones(word);

                  	if (!strOk(raw))  return null; // return null?
                	
                    raw = raw.replace(/1/g, "");
                    phones = raw.split(" ");
                    
                    return phones.join(":");
                },

                getPhonemes : function(word) {
                	
                	var phones, i;
                    var raw = this.getRawPhones(word);
                    

                	if (!strOk(raw))  return null; // return null?
                	
                    raw = raw.replace(/-/g, " ").replace(/1/g, "");
                    phones = raw.split(" ");
                    
                    return phones.join(":");
                },

                getStresses : function(word) {
                	var stresses = [], phones, i;
                    var raw = this.getRawPhones(word);
                    

                   	if (!strOk(raw))  return null; // return null?

                    phones = raw.split(" ");
                    for (i = 0; i < phones.length; i++) 
                        stresses[i] = (phones[i].indexOf(RiLexicon.STRESSED) > -1) ? "1" : "0";
                    
                    return stresses.join(":");
                },

                lookupRaw : function(word) {
                	
                 	if (!strOk(word))  return null; // return null?
                    
                 	word = word.toLowerCase();
                    
                    this.buildWordlist();
                    
                    if (!isNull(RiTa_DICTIONARY[word]))
                       return RiTa_DICTIONARY[word];
                    else {
            			console.log("[WARN] No lexicon entry for '" + word + "'");
            			return null; // return null?
                    }
                },

                getRawPhones : function(word) {
                    var data = this.lookupRaw(word);
                    return (!isNull(data)) ? data[0] : null;
                },

                getPos : function(word) {
                    var data = this.lookupRaw(word);
                   	return  (isNull(data)) ? null : data[1]; // return null?
                },

                getPosArr : function(word) {
                    var pl = this.getPos(word);
                 	if (!strOk(pl))  return null; // return null?
                    return pl.split(" ");
                },

                firstConsonant : function(rawPhones) {
                	
                	if (!strOk(rawPhones))  return null; // return null?

                    var phones = rawPhones.split(RiLexicon.PHONEME_BOUNDARY);
                    //var phones = rawPhones.split(RC.PHONEME_BOUNDARY);
                    if (!isNull(phones)) {
                        for (j = 0; j < phones.length; j++) {
                            if (this.isConsonant(phones[j]))
                                return phones[j];
                        }
                    }
                    return null; // return null?
                },

                lastStressedPhoneToEnd : function(word) {
                	
                	if (!strOk(word))  return null; // return null?
                	
                    var idx, c, result;
                    var raw = this.getRawPhones(word);
                    
                    if (!strOk(raw))  return null; // return null?

                    idx = raw.lastIndexOf(RiLexicon.STRESSED);
                    if (idx < 0)
                        return null; // return null?
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
                
                getRandomWord : function(pos) {
                    /*
                     * var word, found = false, t; if(pos) { pos =
                     * trim(pos.toLowerCase()); for(t in RiLexicon.TAGS){ if
                     * (t[0].toLowerCase === pos) { found = true; } } if(!found) {
                     * throw "RiTa RiLexicon.getRandomWord: POS '" + pos + "'
                     * not valid!"; } } if(pos)
                     */
                    this.buildWordlist();
                    return RiLexicon.wordlist[Math.floor(Math.random() * RiLexicon.wordlist.length)];
                },

                buildWordlist : function() {
                    
                    if (!RiLexicon.wordlist) {
                    	
                        if ((typeof RiTa_DICTIONARY != 'undefined') && RiTa_DICTIONARY) {
                            RiLexicon.wordlist = [];
                            for ( var w in RiTa_DICTIONARY) 
                                RiLexicon.wordlist.push(w);
                            console.log("[RiTa] Loaded lexicon(#"+RiLexicon.wordlist.length+")...");
                        } else {
                            throw "[RiTa] No dictionary found!";
                        }
                    }

                }
            };

            // /////////////////
            // RiPosTagger //
            // /////////////////

            RiPosTagger = {

                // !@# these constants are not kept in RC due to scope problems
                // created by internal "this" references
                UNKNOWN : [ "???", "UNKNOWN" ],
                N : [ "N", "NOUN_KEY" ],
                V : [ "V", "VERB_KEY" ],
                R : [ "R", "ADVERB_KEY" ],
                A : [ "A", "ADJECTIVE_KEY" ],
                CC : [ "CC", "Coordinating conjunction" ],
                CD : [ "CD", "Cardinal number" ],
                DT : [ "DT", "Determiner" ],
                EX : [ "EX", "Existential there" ],
                FW : [ "FW", "Foreign word" ],
                IN : [ "IN", "Preposition or subordinating conjunction" ],
                JJ : [ "JJ", "Adjective" ],
                JJR : [ "JJR", "Adjective, comparative" ],
                JJS : [ "JJS", "Adjective, superlative" ],
                LS : [ "LS", "List item marker" ],
                MD : [ "MD", "Modal" ],
                NN : [ "NN", "Noun, singular or mass" ],
                NNS : [ "NNS", "Noun, plural" ],
                NNP : [ "NNP", "Proper noun, singular" ],
                NNPS : [ "NNPS", "Proper noun, plural" ],
                PDT : [ "PDT", "Predeterminer" ],
                POS : [ "POS", "Possessive ending" ],
                PRP : [ "PRP", "Personal pronoun" ],
                PRP$ : [ "PRP$", "Possessive pronoun (prolog version PRP-S)" ],
                RB : [ "RB", "Adverb" ],
                RBR : [ "RBR", "Adverb, comparative" ],
                RBS : [ "RBS", "Adverb, superlative" ],
                RP : [ "RP", "Particle" ],
                SYM : [ "SYM", "Symbol" ],
                TO : [ "TO", "to" ],
                UH : [ "UH", "Interjection" ],
                VB : [ "VB", "Verb, base form" ],
                VBD : [ "VBD", "Verb, past tense" ],
                VBG : [ "VBG", "Verb, gerund or present participle" ],
                VBN : [ "VBN", "Verb, past participle" ],
                VBP : [ "VBP", "Verb, non-3rd person singular present" ],
                VBZ : [ "VBZ", "Verb, 3rd person singular present" ],
                WDT : [ "WDT", "Wh-determiner" ],
                WP : [ "WP", "Wh-pronoun" ],
                WP$ : [ "WP$", "Possessive wh-pronoun (prolog version WP-S)" ],
                WRB : [ "WRB", "Wh-adverb" ],

                TAGS : [ this.CC, this.CD, this.DT, this.EX, this.FW, this.IN, this.JJ, this.JJR, this.JJS, this.LS, this.MD, this.NN, this.NNS, this.NNP, this.NNPS, this.PDT, this.POS, this.PRP,
                        this.PRP$, this.RB, this.RBR, this.RBS, this.RP, this.SYM, this.TO, this.UH, this.VB, this.VBD, this.VBG, this.VBN, this.VBP, this.VBZ, this.WDT, this.WP, this.WP$, this.WRB,
                        this.UNKNOWN ],
                NOUNS : [ this.NN, this.NNS, this.NNP, this.NNPS ],
                VERBS : [ this.VB, this.VBD, this.VBG, this.VBN, this.VBP, this.VBZ ],
                ADJ : [ this.JJ, this.JJR, this.JJS ],
                ADV : [ this.RB, this.RBR, this.RBS, this.RP ],

                isVerb : function(tag) {
                    return inArray(this.VERB, tag);
                },

                isNoun : function(tag) {
                    return inArray(this.NOUN, tag);
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

                // Returns an array of parts-of-speech from the Penn tagset each
                // corresponding to one word of input.
                tag : function(words) {

                    var result = [], choices = [], word, data, size, i;

                    if (!(words instanceof Array)) { // << !@# test this
                        words = [ words ];
                        console.log("RiPosTagger: NOT ARRAY");
                    }

                    for (i = 0, l = words.length; i < l; i++) {
                        word = words[i];
                        data = RiLexicon.getPosArr(word);

                        if (data == null || data.length == 0) {
                            if (word.length == 1) {
                                result[i] = isDigit(word.charAt(0)) ? "cd" : word;
                            } else {
                                result[i] = "nn";
                            }
                            choices[i] = null;
                        } else {
                            result[i] = data[0];
                            choices[i] = data;
                        }
                    }

                    // Adjust pos according to transformation rules
                    return this.applyContext(words, result, choices);
                },

                hasTag : function(choices, tag) {
                    var choiceStr = choices.join();
                    return (choiceStr.indexOf(tag) > -1);
                },

                // Applies a customized subset of the Brill transformations
                applyContext : function(words, result, choices) {

                    // Shortcuts for brevity/readability
                    var sW = startsWith, eW = endsWith, PRINT = RC.PRINT_CUSTOM_TAGS, firstLetter, i;

                    // Apply transformations
                    for (i = 0, l = words.length; i < l; i++) {

                        firstLetter = words[i].charAt(0);

                        // transform 1: DT, {VBD | VBP | VB} --> DT, NN
                        if (i > 0 && (result[i - 1] == "dt")) {
                            if (sW(result[i], "vb")) {
                                if (PRINT) {
                                    console.log("BrillPosTagger: changing verb to noun: " + words[i]);
                                }
                                result[i] = "nn";
                            }

                            // transform 1: DT, {RB | RBR | RBS} --> DT, {JJ |
                            // JJR | JJS}
                            else if (sW(result[i], "rb")) {
                                if (PRINT) {
                                    console.log("BrillPosTagger:  custom tagged '" + words[i] + "', " + result[i]);
                                }
                                result[i] = (result[i].length > 2) ? "jj" + result[i].charAt(2) : "jj";
                                if (PRINT) {
                                    console.log(" -> " + result[i]);
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

                        // transform 4: convert any type to adverb if it ends in
                        // "ly";
                        if (eW(words[i], "ly")) {
                            result[i] = "rb";
                        }

                        // transform 5: convert a common noun (NN or NNS) to a
                        // adjective if it ends with "al"
                        if (sW(result[i], "nn") && eW(words[i], "al")) {
                            result[i] = "jj";
                        }

                        // transform 6: convert a noun to a verb if the
                        // preceeding word is "would"
                        if (i > 0 && sW(result[i], "nn") && equalsIgnoreCase(words[i - 1], "would")) {
                            result[i] = "vb";
                        }

                        // transform 7: if a word has been categorized as a
                        // common noun and it ends
                        // with "s", then set its type to plural common noun
                        // (NNS)
                        if ((result[i] == "nn") && eW(words[i], "s")) {
                            result[i] = "nns";
                        }

                        // transform 8: convert a common noun to a present
                        // participle verb (i.e., a gerund)
                        if (sW(result[i], "nn") && eW(words[i], "ing")) {
                            // fix here -- add check on choices for any verb: eg
                            // 'morning'
                            if (this.hasTag(choices[i], "vb")) {
                                result[i] = "vbg";
                            } else if (PRINT) {
                                console.log("[INFO] um tagged '" + words[i] + "' as " + result[i]);
                            }
                        }

                        // transform 9(dch): convert common nouns to proper
                        // nouns when they start w' a capital and are not a
                        // sentence start
                        if (i > 0 && sW(result[i], "nn") && words[i].length > 1 && (firstLetter == firstLetter.toUpperCase())) {
                            result[i] = eW(result[i], "s") ? "nnps" : "nnp";
                        }

                        // transform 10(dch): convert plural nouns (which are
                        // also 3sg-verbs) to 3sg-verbs when followed by adverb
                        // (jumps, dances)
                        if (i < result.length - 1 && result[i] == "nns" && sW(result[i + 1], "rb") && this.hasTag(choices[i], "vbz")) {
                            result[i] = "vbz";
                        }
                    }
                    return result;
                }

            };// end RiPosTagger

            // Handles verb conjugation based on tense, person, number
            // for simple, passive, progressive, and perfect forms.
            // An example:
            // RiConjugator rc = new RiConjugator(this);
            // rc.setNumber("plural");
            // rc.setPerson("2nd");
            // rc.setTense("past");
            // rc.setPassive(true);
            // rc.setPerfect(true);
            // rc.setProgressive(false);
            // String c = rc.conjugate("announce");

            // Note: this implementation is based closely on rules found in the
            // MorphG package,
            // further described here:<p>
            // Minnen, G., Carroll, J., and Pearce, D. (2001). Applied
            // Morphological Processing of English.
            // Natural Language Engineering 7(3): 207--223.

            RiConjugator = function RiConjugator() {

                this.perfect = this.progressive = this.passive = this.interrogative = false;

                this.tense = RC.PRESENT_TENSE;
                this.person = RC.FIRST_PERSON;
                this.number = RC.SINGULAR;
                this.head = "";

                // int form = NORMAL; // other forms?? GERUND, INFINITIVE // !@#
                // this comment from java version - add/handle here?
            };

            RiConjugator.prototype = {

                // Conjugates the verb based on the current state of the
                // conjugator.

                // !@# Removed (did not translate) incomplete/non-working java
                // implementation of modals handling.
                // !@# TODO: add handling of past tense modals.

                conjugate : function(verb, number, person, tense) {

                    var actualModal = null, // Compute modal -- this affects
                    // tense
                    conjs = [], frontVG = verb, verbForm, s;

                    if (number) {
                        this.setNumber(number);
                    }
                    if (person) {
                        this.setPerson(person);
                    }
                    if (tense) {
                        this.setTense(tense);
                    }

                    if (verb == null || verb.length < 1) {
                        throw new RiTaException("Make sure to set the head verb before calling conjugate()!");
                    }

                    if (this.form == RC.INFINITIVE) {
                        actualModal = "to";
                    }
                    if (this.tense == RC.FUTURE_TENSE) {
                        actualModal = "will";
                    }

                    if (this.passive) {
                        conjs.push(this.getPastParticiple(frontVG));
                        frontVG = "be"; // Conjugate
                    }

                    if (this.progressive) {
                        conjs.push(this.getPresentParticiple(frontVG));
                        frontVG = "be"; // Conjugate
                    }

                    if (this.perfect) {
                        conjs.push(this.getPastParticiple(frontVG));
                        frontVG = "have";
                    }

                    if (actualModal) {
                        conjs.push(frontVG);
                        frontVG = null;
                    }

                    // Now inflect frontVG (if it exists) and push it on restVG
                    if (frontVG) {
                        if (this.form == RC.GERUND) {// gerund - use ING form
                            // !@# not yet
                            // implemented!
                            conjs.push(this.getPresentParticiple(frontVG));
                        }

                        // / when could this happen, examples??? // !@# <--
                        // comment from original java. ???
                    } else if (this.interrogative && !(verb == "be") && conjs.length == 0) {
                        conjs.push(frontVG);

                    } else {
                        verbForm = this.getVerbForm(frontVG, tense, person, number);
                        conjs.push(verbForm);
                    }

                    // add modal, and we're done
                    if (actualModal) {
                        conjs.push(actualModal);
                    }

                    s = trim(conjs.join());

                    // !@# test this
                    if (endsWith(s, "peted")) {
                        throw (this.toString());
                    }
                    return s;
                },

                checkRules : function(ruleSet, verb) {

                    var result = null, defaultRule = ruleSet.defaultRule || null, rules = ruleSet.rules, i;

                    if (inArray(RC.MODALS, verb)) {
                        return verb;
                    }

                    i = rules.length;
                    while (i--) {
                        if (rules[i].applies(verb)) {
                            return rules[i].fire(verb);
                        }
                    }

                    if (ruleSet.doubling || inArray(RC.VERB_CONS_DOUBLING, verb)) {
                        verb = this.doubleFinalConsonant(verb);
                    }
                    return defaultRule.fire(verb);
                },

                doubleFinalConsonant : function(word) {
                    var letter = word.charAt(word.length - 1);
                    return word + letter;
                },

                getPast : function(verb, pers, numb) {

                    if (verb.toLowerCase() == "be") {
                        switch (numb) {
                        case RC.SINGULAR:
                            switch (pers) {
                            case RC.FIRST_PERSON:
                                break;
                            case RC.THIRD_PERSON:
                                return "was";
                            case RC.SECOND_PERSON:
                                return "were";
                            }
                            break;
                        case RC.PLURAL:
                            return "were";
                        }
                    }
                    return this.checkRules(RC.PAST_TENSE_RULESET, v);
                },

                getPastParticiple : function(verb) {
                    return this.checkRules(RC.PAST_PARTICIPLE_RULESET, verb);
                },

                getPresent : function(verb, person, number) {

                    // Defaults if unset
                    if (typeof (person) === 'undefined') {
                        person = this.person;
                    }
                    if (typeof (number) === 'undefined') {
                        number = this.number;
                    }

                    if ((person == RC.THIRD_PERSON) && (number == RC.SINGULAR)) {
                        return this.checkRules(RC.PRESENT_TENSE_RULESET, verb);

                    } else if (verb == "be") {
                        if (number == RC.SINGULAR) {
                            switch (person) {
                            case RC.FIRST_PERSON:
                                return "am";
                                break;
                            case RC.SECOND_PERSON:
                                return "are";
                                break;
                            case RC.THIRD_PERSON:
                                return "is";
                                break;
                            }
                        } else {
                            return "are";
                        }
                    }
                    return verb;
                },

                getPresentParticiple : function(verb) {
                    return this.checkRules(RC.PRESENT_PARTICIPLE_RULESET, verb);
                },

                getVerbForm : function(verb, tense, person, number) {
                    switch (tense) {
                    case RC.PRESENT_TENSE:
                        return getPresent(verb, person, number);
                    case RC.PAST_TENSE:
                        return getPast(verb, person, number);
                    default:
                        return verb;
                    }
                },

                // Returns a String representing the current person from one of
                // (first, second, third)
                getPerson : function() {
                    return RC.CONJUGATION_NAMES[RC[this.person]];
                },

                // Returns a String representing the current number from one of
                // (singular, plural)
                getNumber : function() {
                    return RC.CONJUGATION_NAMES[RC[this.number]];
                },

                // Returns a String representing the current tense from one of
                // (past, present, future)
                getTense : function() {
                    return RC.CONJUGATION_NAMES[RC[this.tense]];
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
                // constants: [FIRST_PERSON, SECOND_PERSON, THIRD_PERSON]
                setPerson : function(personConstant) {
                    this.person = RC[personConstant];
                },

                // Sets the number for the conjugation, from one of the
                // constants: [SINGULAR, PLURAL]
                setNumber : function(numberConstant) {
                    this.number = RC[numberConstant];
                },

                // Sets the tense for the conjugation, from one of the
                // constants: [PAST_TENSE, PRESENT_TENSE, FUTURE_TENSE]
                setTense : function(tenseConstant) {
                    this.tense = RC[tenseConstant];
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

                // Creates a readable representation of data for logging
                toString : function() {
                    return "  ---------------------\n" + "  Passive = " + this.isPassive() + "\n" + "  Perfect = " + this.isPerfect() + "\n" + "  Progressive = " + this.isProgressive() + "\n"
                            + "  ---------------------\n" + "  Number = " + this.getNumber() + "\n" + "  Person = " + this.getPerson() + "\n" + "  Tense = " + this.getTense() + "\n"
                            + "  ---------------------\n";
                },

                // Returns all possible conjugations of the specified verb
                // (contains duplicates)
                conjugateAll : function(verb) {

                    var results = [], i, j, k, l, m, n;
                    this.setVerb(verb);

                    for (i = 0; i < RC.TENSES.length; i++) {
                        this.setTense(RC.TENSES[i]);
                        for (j = 0; j < RC.NUMBERS.length; j++) {
                            this.setNumber(RC.NUMBERS[j]);
                            for (k = 0; k < RC.PERSONS.length; k++) {
                                this.setPerson(RC.PERSONS[k]);
                                for (l = 0; l < 2; l++) {
                                    this.setPassive(l == 0 ? true : false);
                                    for (m = 0; m < 2; m++) {
                                        this.setProgressive(m == 0 ? true : false);
                                        for (n = 0; n < 2; n++) {
                                            this.setPerfect(n == 0 ? true : false);
                                            results.push(this.conjugate(verb));
                                        }
                                    }
                                }
                            }
                        }
                    }
                    // console.log("all="+results.length);
                    return results;
                }

            };// end RiConjugator

            // =====================================================================================================================
            // EVENTS AND BEHAVIORS
            // =====================================================================================================================

            // ///////////////
            // RiTaEvent //
            // ///////////////

            RiTaEvent = function RiTaEvent(source, type, data) {

                this.id = -1;
                this.tag = "";
                this.type = type;
                this.source = source; // RiText
                this.data = (typeof (data) === 'object') ? data : null;

                if (typeof (data) === 'object') {
                    this.tag = data.toString();
                    if (data instanceof TextBehavior) {
                        this.tag = data.getName();
                        this.id = data.getId();
                    }
                }

                // Set unique ID
                if (this.id < 0) {
                    this.id = RiTa.nextId();
                }
            };

            RiTaEvent.prototype = {

                // Creates a readable representation of data for logging
                toString : function() {
                    return "RiTaEvent[type=" + this.type + ", tag=" + this.tag + " data=" + this.getData() + ", source=" + this.source + "]";
                },

                // Returns one of the event types specified in the RiConstants
                // [RC] interface, e.g., BEHAVIOR_COMPLETED, or
                // SPEECH_COMPLETED.
                // To test, use the following syntax: if (re.getType() ==
                // RC.BEHAVIOR_COMPLETED)
                getType : function() {
                    return this.type;
                },

                // Returns RiText object
                getSource : function() {
                    return this.source;
                },

                // Returns auxillary data that varies based on the different
                // event types:
                // - SPEECH_COMPLETED: a string with the last spoken text.
                // - TEXT_ENTERED: a string with the entered text.
                // - BEHAVIOR_COMPLETED or TIMER_COMPLETED: the TextBehavior
                // object that has just completed.
                getData : function() {
                    return this.data;
                },

                // !@# handling of event names is incomplete. Need to determine
                // where/how names are (to be) set.

                // Return the user-specified name for this event, or for the
                // associated TextBehavior. For example, if
                // a name has been assigned to a RiTa timer which generated this
                // event, it will be accessible here.
                getName : function() {
                    return tag;
                },

                getId : function() {
                    return id;
                }

            };

            // ////////////////
            // Interpolator //
            // ////////////////

            // Handles math and logic for interpolation. Never used directly by user.

            Interpolator = function Interpolator(startValue, targetValue, startOffsetInMs, durationInMs, motionType) {
                this.reset(startValue, targetValue, startOffsetInMs, durationInMs, motionType);
            };

            Interpolator.prototype = {

                // Penner's easing equations
                equations : {
                    linear : function(t, b, c, d) {
                        return t * (c / d) + b;
                    },
                    easeInQuad : function(t, b, c, d) {
                        return c * (t /= d) * t + b;
                    },
                    easeOutQuad : function(t, b, c, d) {
                        return -c * (t /= d) * (t - 2) + b;
                    },
                    easeInOutQuad : function(t, b, c, d) {
                        if ((t /= d / 2) < 1) {
                            return c / 2 * t * t + b;
                        }
                        return -c / 2 * ((--t) * (t - 2) - 1) + b;
                    },
                    easeInCubic : function(t, b, c, d) {
                        return c * (Math.pow(t / d, 3) + b);
                    },
                    easeOutCubic : function(t, b, c, d) {
                        return c * ((Math.pow(t / d - 1, 3) + 1) + b);
                    },
                    easeInOutCubic : function(t, b, c, d) {
                        if ((t /= d / 2) < 1) {
                            return (c / 2 * Math.pow(t, 3) + b);
                        }
                        return (c / 2 * (Math.pow(t - 2, 3) + 2) + b);
                    },
                    easeInQuart : function(t, b, c, d) {
                        return (c * Math.pow(t / d, 4) + b);
                    },
                    easeOutQuart : function(t, b, c, d) {
                        return (-c * (Math.pow(t / d - 1, 4) - 1) + b);
                    },
                    easeInOutQuart : function(t, b, c, d) {
                        if ((t /= d / 2) < 1) {
                            return (c / 2 * Math.pow(t, 4) + b);
                        }
                        return (-c / 2 * (Math.pow(t - 2, 4) - 2) + b);
                    },
                    easeInSine : function(t, b, c, d) {
                        return (c * (1 - Math.cos(t / d * (Math.PI / 2))) + b);
                    },
                    easeOutSine : function(t, b, c, d) {
                        return (c * Math.sin(t / d * (Math.PI / 2)) + b);
                    },
                    easeInOutSine : function(t, b, c, d) {
                        return (c / 2 * (1 - Math.cos(Math.PI * t / d)) + b);
                    },
                    easeInCirc : function(t, b, c, d) {
                        return (-c * (Math.sqrt(1 - (t /= d) * t) - 1) + b); // hmm??
                    },
                    easeOutCirc : function(t, b, c, d) {
                        return (c * Math.sqrt(1 - (t - d) * (t - d) / (d * d)) + b);
                    },
                    easeInOutCirc : function(t, b, c, d) {
                        if (t < d / 2) {
                            return (-c / 2 * (Math.sqrt(1 - 4 * t * t / (d * d)) - 1) + b);
                        }
                        return (c / 2 * (Math.sqrt(1 - 4 * (t - d) * (t - d) / (d * d)) + 1) + b);
                    },
                    easeInExpo : function(t, b, c, d) {
                        var flip = 1;
                        if (c < 0) {
                            flip *= -1;
                            c *= -1;
                        }
                        return (flip * (Math.exp(Math.log(c) / d * t)) + b);
                    },
                    easeOutExpo : function(t, b, c, d) {
                        var flip = 1;
                        if (c < 0) {
                            flip *= -1;
                            c *= -1;
                        }
                        return (flip * (-Math.exp(-Math.log(c) / d * (t - d)) + c + 1) + b);
                    },
                    easeInOutExpo : function(t, b, c, d) {
                        var flip = 1;
                        if (c < 0) {
                            flip *= -1;
                            c *= -1;
                        }
                        if (t < d / 2) {
                            return (flip * (Math.exp(Math.log(c / 2) / (d / 2) * t)) + b);
                        }
                        return (flip * (-Math.exp(-2 * Math.log(c / 2) / d * (t - d)) + c + 1) + b);
                    }
                },

                reset : function(startVal, targetVal, startOffsetInMs, durationInMs, motionType) {
                    this.running = true;
                    this.completed = false;
                    this.startValue = this.currentValue = startVal;
                    this.targetValue = targetVal;
                    this.change = targetVal - startVal;
                    this.duration = durationInMs;
                    this.startTime = Date.now() + startOffsetInMs;
                    this.equation = this.getEquation(motionType);
                    //console.log("this.equation("+motionType+") ="+this.equation);
                },
                
                getEquation : function(motionType) {
                    switch (motionType) { // ugly, use an array instead?
	                    case RC.LINEAR:
	                        return this.equations.linear;
	                    case RC.EASE_IN_OUT:
	                        return this.equations.easeInOutQuad;
	                    case RC.EASE_IN:
	                        return this.equations.easeInQuad;
	                    case RC.EASE_OUT:
	                        return this.equations.easeOutQuad;
	                    case RC.EASE_IN_OUT_CUBIC:
	                        return this.equations.easeInOutCubic;
	                    case RC.EASE_IN_CUBIC:
	                        return this.equations.easeInCubic;
	                    case RC.EASE_OUT_CUBIC:
	                        return this.equations.easeOutCubic;
	                    case RC.EASE_IN_OUT_QUARTIC:
	                        return this.equations.easeInOutQuart;
	                    case RC.EASE_IN_QUARTIC:
	                        return this.equations.easeInQuart;
	                    case RC.EASE_OUT_QUARTIC:
	                        return this.equations.easeOutQuart;
	                    case RC.EASE_IN_OUT_EXPO:
	                        return this.equations.easeInOutExpo;
	                    case RC.EASE_IN_EXPO:
	                        return this.equations.easeInExpo;
	                    case RC.EASE_OUT_EXPO:
	                        return this.equations.easeOutExpo;
	                    case RC.EASE_IN_OUT_SINE:
	                        return this.equations.easeInOutSine;
	                    case RC.EASE_IN_SINE:
	                        return this.equations.easeInSine;
	                    case RC.EASE_OUT_SINE:
	                        return this.equations.easeOutSine;
	                    default:
	                        throw new Error("Unknown MotionType: " + motionType);
                    }
                },

                update : function() {

                    var msElapsed = Date.now();
                    var a = msElapsed - this.startTime;
                    var b = this.startValue;
                    var c = this.change;
                    var d = this.duration;

                    // Have we finished or not started yet?
                    if (this.completed || msElapsed < this.startTime) {
                        return this.running = false;
                    }

                    // Or have we run out of time?
                    if (msElapsed > (this.startTime + this.duration)) {
                        this.finish();
                        return this.running = false;
                    }

                    // Ok, we are actually updating
                    this.running = true;

                    // Check if we've started
                    if (msElapsed >= this.startTime) {  
                    	this.currentValue = this.equation(a,b,c,d);
                    }
                    
                    return this.running; 
                },

                stop : function() {
                    this.running = false;
                },

                finish : function() {
                    this.currentValue = this.targetValue;
                    this.completed = true;
                },

                isCompleted : function() {
                    return this.completed;
                },

                getValue : function() {
                    return this.currentValue;
                },

                getStartValue : function() {
                    return this.startValue;
                },

                getTarget : function() {
                    return this.targetValue;
                }

            }; // end Interpolator
            
            
            // DCH: class should be removed and replaced with Array.foreach() calls?

            // /////////////////
            // InterpolatorArray // delegates to Interpolator 
            // /////////////////

            // Creates & controls an arbitrary number of interpolators
            // with shared duration & motionType
            // 'dataArray' array format: [ [initialValue, targetValue],  [initialValue, targetValue], ... ]

            InterpolatorArray = function InterpolatorArray(dataArray, startOffsetInMs, durationInMs, motionType) {
            	
                this.initValues = dataArray;
                //this.initDuration = durationInMs;
                this.interpolators = [];
                this.interpolatorCount = dataArray.length;
                this.motionType = motionType || RiText.defaults.motionType;

                var i = this.interpolatorCount;
                while (i--) {
                	var nt = new Interpolator(dataArray[i][0], dataArray[i][1], startOffsetInMs, durationInMs, this.motionType);
                    this.interpolators.push(nt);
                }
            };

            InterpolatorArray.prototype = { 

                // Reset the set of interpolators. If arguments not given (or
                // null), fn defaults to instantiation values for
                // start values, target values, and duration. If startOffsetMs
                // not given, that defaults to 0: running immediately.
                reset : function(values, startOffsetMs, durationInMs) {

                    values = values || this.initValues;
                    durationInMs = durationInMs;//  || this.initDuration;
                    startOffsetMs = startOffsetMs || 0;

                    checkMinLen(values, this.interpolatorCount);

                    var i = this.interpolatorCount;
                    while (i--) {
                        this.interpolators[i].reset(values[i][0], values[i][0], startOffsetMs, durationInMs, this.motionType);
                    }
                },

                update : function() {
                    var running = true, i = this.interpolatorCount;
                    while (i--) {
                        running = (this.interpolators[i].update()) ? running : false;
                    }
                    return running;
                },

                finish : function() {
                    var i = this.interpolatorCount;
                    while (i--) {
                        this.interpolators[i].finish();
                    }
                },

                stop : function() {
                    var i = this.interpolatorCount;
                    while (i--) {
                        this.interpolators[i].stop();
                    }
                },

                // Returns true if ANY of the set of interpolators is completed
                isCompleted : function() {
                    var complete = true, i = this.interpolatorCount;
                    while (i--) {
                        complete = (this.interpolators[i].isCompleted());
                    }
                    return complete;
                },

                getValues : function() {
                    var values = [], i = this.interpolatorCount;
                    while (i--) {
                        values.push(this.interpolators[i].getValue());
                    }
                    return values;
                },

                getTargets : function() {
                    var targets = [], i = this.interpolatorCount;
                    while (i--) {
                        targets.push(this.interpolators[i].getTargetValue());
                    }
                    return targets;
                },

                setMotionType : function(motionType) {
                    this.motionType = motionType;
                },

                getMotionType : function(motionType) {
                    return this.motionType;
                }

            };

            // //////////////////
            // TextBehavior //
            // //////////////////

            // !@# TODO: rewrite this documentation
            // An abstract superclass for an extensible set of text behaviors
            // including a variety of interpolation algorithms for moving,
            // fading, scaling [!@# not yet implemented], color-change, etc.
            //
            // Included in the rita.* package primarily to document callbacks as
            // follows:<br>
            //
            // public void onRiTaEvent(re) {
            // // do something with the RiText whose behavior has finished
            // var rt = re.getSource();
            // ...
            // // do something with the Behavior directly
            // var rtb = re.getData();
            // ...
            // }

            // Needs to exist in child objects: fn updateRiText()

            TextBehavior = function TextBehavior() {};

            // Container for TextBehaviors, used by meta methods below
            TextBehavior.instances = [];

            TextBehavior.prototype = {

                completed : false,
                duration : 0,
                id : -1,
                // initDuration : 0,  // why?  so you can call reset without a value
                //initRepeating : false, // DCH // why???
                interpolator : new InterpolatorArray([]),
                listeners : [],
                name : null,
                pauseFor : 0,
                remainingAfterPauseMs : 0,
                repeating : false,
                reusable : false,
                running : true,
                rt : null,
                startOffset : 0,
                type : -1,

                // ================== Constructor ==================

                // Constructor function to be run "manually" by child objects
                init : function(rt, timerName, startOffsetInSec, durationInSeconds, repeating) {
                	
                	if (startOffsetInSec > 0)
                		throw new Error("offset not yet tested...");

                	TextBehavior.instances.push(this);
                    
                    this.rt = rt;
                    this.id = RiTa.nextId();
                    this.repeating = assign(repeating, false); // DCH
                    if (!isNull(timerName)) this.name = timerName; // DCH
                    if (isNull(durationInSeconds) || durationInSeconds < 0) return; // DCH
                    
                    /* this.initRepeating = this.repeating; // DCH
                    if (typeof (durationInSeconds) === 'undefined') {
                        durationInSeconds = -1; // use isNull
                    }*/
                    
                    this.duration = durationInSeconds;
                    //this.initDuration = durationInSeconds;
                    this.startOffset = startOffsetInSec;
                    this.startTime = Date.now();  // update for delay
                    
                    //console.log("TextBehavior.add: id=#"+this.id+" of "+TextBehavior.instances.length);
                },

                // ================== Control methods ==================

                update : function() {
  
                    if (this.duration <= 0 || this.completed || this.isPaused()) {
                        return;
                    }

                    if (this.interpolator.update()) { // true if running
                        this.updateRiText();
                    }
                    this.checkForCompletion();
                },

                // Causes the behavior to be (immediately) repeated with its
                // initial params and the specified 'duration'. 
                // Ignores startOffset and restarts immediately.
                reset : function(durationInSeconds) {

                    this.completed = false;
                    this.running = true;

                    if (durationInSeconds < 0)
                        return;

                    this.duration = durationInSeconds;
                    this.startTime = Date.now();
                    this.pauseFor = 0;

                    this.interpolator.reset(null, 0, toMs(durationSec));
                },

                finish : function() {
                    if (!isNull(this.interpolator)) this.interpolator.finish();
                    this.completed = true;
                },

                stop : function() {
                	if (!isNull(this.interpolator)) this.interpolator.stop();
                    this.running = false;
                    this.duration = -1;
                },

                // Pauses the behavior for 'pauseTime' seconds
                pause : function(pauseTime) {
                    this.pauseFor = pauseTime;
                },

                // ================== Get methods ==================

                // Returns the total duration for the behavior
                getDuration : function() {
                    return this.duration;
                },

                // Returns the unique id for this behavior
                getId : function() {
                    return this.id;
                },

                // Returns the user-assigned name for this behavior
                getName : function() {
                    return this.name;
                },

                // Returns the RiText object in which this behavior is operating
                getRiText : function() {
                    return this.rt;
                },

                // Returns the original startOffset for the behavior
                getStartOffset : function() {
                    return this.startOffset;
                },

                // Return target values of interpolator(s)
                getTargets : function() {
                    return this.interpolator.getTargets();
                },

                // Returns the type for the behavior
                getType : function() {
                    return this.type;
                },

                // Returns values for associated interpolator(s)
                getValues : function() {
                    return this.interpolator.getValues();
                },

                // Returns whether this behavior has completed
                isCompleted : function() {
                    return this.completed;
                },

                // Returns the paused status for the behavior
                isPaused : function() {
                    return (this.pauseFor > 0);
                },

                // Returns whether behavior will repeat (indefinitely) when
                // finished
                isRepeating : function() {
                    return this.repeating;
                },

                // Returns the paused status for the behavior
                isRunning : function() {
                    return this.running;
                },

                // Returns whether behavior has started
                isWaiting : function() {
                    return (Date.now() < this.startTime);
                },

                // ================== Set methods ==================

                setId : function(id) {
                    this.id = id;
                },

                // Sets a (user-assigned) name for this behavior.
                setName : function(name) {
                    this.name = name;
                },

                // Sets the paused status for the behavior
                setPaused : function(pausedVal) {
                    var soFar, pauseFor;
                    if (pausedVal) {

                        // Compute how long its been running, and how much remaining
                        pauseFor = INTEGER_MAX_VALUE;
                        soFar = (Date.now() - this.startTime);
                        this.remainingAfterPauseMs = (duration * 1000 - soFar);

                    } else {
                        this.reset(remainingAfterPauseMs / 1000);
                    }
                },

                // Sets whether the behavior should repeat (indefinitely) when
                // finished
                setRepeating : function(repeating) {
                    this.repeating = repeating;
                },

                setRunning : function(b) {
                    this.running = b;
                },

                setType : function(type) {
                    this.type = type;
                },

                setMotionType : function(motionType) {
                    this.interpolator.setMotionType(motionType);
                },

                // ============ Completion / deletion methods ============

                // Checks for completion, and if so, fires the callback
                checkForCompletion : function() {
                    this.completed = this.interpolator.isCompleted();
                    if (this.running && this.completed && !this.isPaused()) {
                        this.updateRiText();
                        this.fireCallback();
                    }
                },

                fireCallback : function() {

                    var behaviorType = this.getType(), eventType = RC.BEHAVIOR_COMPLETED, ok;

                    this.running = false;

                    if (behaviorType == RC.TIMER) eventType = RC.TIMER_TICK;

                    if (this.rt != null && !RiText.callbacksDisabled) {

                        ok = RiTa.fireEvent(new RiTaEvent(this.rt, eventType, this));

                        if (!ok) {
                            if (behaviorType == RC.TIMER) {
                                console.log("\n[WARN] Possible coding error? You appear to have created"
                                		+ " a callback timer,\n       but not implemented the method: "
                                        + "'void onRiTaEvent(RiTaEvent rt)'");
                            }
                            RiText.callbacksDisabled = true;

                        }
                    }

                    this.notifyListeners(); // Now tell any listeners

                    if (this.isRepeating()) this.reset(this.duration);
                },

                // Adds a listener for events fired from this behavior, e.g.,
                // completion, upon which it will behaviorCompleted();
                addListener : function(bl) { // behaviorListener // <<-- !@#
                    // test this
                    this.listeners.push(bl);
                },

                notifyListeners : function() {
                    if (this.listeners.length > 0) {
                        for ( var l in this.listeners) {
                            l.behaviorCompleted(this);
                        }
                    }
                },

                // !@# had to change from "delete" in java version because
                // "delete" is reserved in js
                dispose : function() {
                    this.running = false;
                    this.complete = true;
                    this.stop();
                    if (!isNull(this.rt) && !isNull(this.rt.behaviors)) {
                       // removeFromArray(RiTa.behaviors, this);
                        removeFromArray(this.rt.behaviors, this);
                    }
                    removeFromArray(TextBehavior.instances, this);
                },

                // ================== Meta methods ==================

                // Stops and deletes all the behaviors for a specified RiText
                // object that are of types
                /* FADE_IN, FADE_OUT and FADE_TO_TEXT.
                disposeFades : function(rt) {

                    // DCH: DO WE NEED THIS ONE“??
                    var behaviors = rt.getBehaviors(), rtb;

                    if (behaviors == null) {
                        return;
                    }

                    for (rtb in behaviors) {
                        if (rtb != null && (rtb.type == RC.FADE_IN || rtb.type == RC.FADE_OUT || rtb.type == RC.FADE_COLOR || rtb.type == RC.FADE_TO_TEXT)) {
                            rtb.dispose();
                        }
                    }
                },*/

                // Calls destroy() on all existing behaviors
                disposeAll : function() {
                    for ( var i in TextBehavior.instances) {
                        i.dispose();
                    }
                },

                // Pauses/un-pauses all existing behaviors (takes boolean)
                pauseAll : function(paused) {
                    for ( var i in TextBehavior.instances) {
                        i.setPaused(paused);
                    }
                },

                findById : function(id) {
                    if (TextBehavior.instances == null)
                        return null;
                    for ( var rtb in TextBehavior.instances) {
                        if (rtb != null && rtb.getId() == id) {
                            return rtb;
                        }
                    }
                    return null;
                },

                findByName : function(name) {
                    if (TextBehavior.instances == null)
                        return null;
                    for ( var rtb in TextBehavior.instances) {
                        if (rtb != null && rtb.getName() == name)
                            return rtb;
                    }
                    return null;
                },

                findByType : function(type) {
                    var l = [], rtb;
                    if (TextBehavior.instances == null)
                        return l;
                    for (rtb in TextBehavior.instances) {
                        if (rtb != null && rtb.getType() == type)
                            l.push(rtb);
                    }
                    return l;
                }

            };// end TextBehavior

            // ////////////////
            // TextMotion2D // extends TextBehavior
            // ////////////////

            // Creates a text motion behavior. Not accessed directly by user.

            TextMotion2D = function TextMotion2D(rt, targetX, targetY, offsetMs, durationInMs) {
                this.init(rt, "TextMotion2D", offsetMs, durationInMs, false);
                this.setMotionType(rt.motionType);
                this.setType(RC.MOVE);
                this.interpolator = new InterpolatorArray(
                		[ [ rt.getX(), targetX ], [ rt.getY(), targetY ] ],
                		offsetMs, durationInMs, rt.motionType);

                // [ rt.getY(), targetY ] ], offsetMs, durationInMs); // DCH:
                // fixed bug here (no motion-type)
            };

            TextMotion2D.prototype = new TextBehavior();
            TextMotion2D.prototype.constructor = TextMotion2D;

            TextMotion2D.prototype.updateRiText = function() {
                var values = this.getValues();
                this.rt.setPosition(Math.round(values[0]), Math.round(values[1]));
            };

            // //////////////
            // ColorFader // extends TextBehavior
            // //////////////

            // Creates a color fading behavior. Not accessed directly by user.

            ColorFader = function ColorFader(rt, colors, offsetMs, durationInMs, type) {

                var current = rt.getColor();
                
                //console.log("current="+current.r+", "+current.g+","+current.b+", "+current.a);

                var r, g, b, a; // targets

                this.init(rt, "ColorFader", offsetMs, durationInMs, false);
                
                this.setType(type);

                if (type == RC.FADE_IN || type == RC.FADE_OUT) 
                {
                    // a = colors[0]; // D: this was a bug
                    a = colors[3];
                    this.interpolator = new InterpolatorArray
                      ([ [ current.a, a ] ], offsetMs, durationInMs);
                }
                else if (type == RC.FADE_COLOR) {
                    r = (typeof colors[0] === 'number') ? colors[0] : current.r;
                    g = (typeof colors[1] === 'number') ? colors[1] : current.g;
                    b = (typeof colors[2] === 'number') ? colors[2] : current.b;
                    a = (typeof colors[3] === 'number') ? colors[3] : current.a;

                    this.interpolator = new InterpolatorArray(
                    		[ [ current.r, r ], 
                    		  [ current.g, g ], 
                    		  [ current.b, b ], 
                    		  [ current.a, a ] ], 
                    		offsetMs, durationInMs);
                }
            };

            ColorFader.prototype = new TextBehavior();
            ColorFader.prototype.constructor = ColorFader;

            ColorFader.prototype.updateRiText = function() {
                var values = this.getValues();

                if (this.getType() == RC.FADE_IN || this.getType() == RC.FADE_OUT) 
                {
                    this.rt.color.a = Math.round(values[0]);
                }
                else 
                {
                    this.rt.fill(
                    		Math.round(values[0]), 
                    		Math.round(values[1]), 
                    		Math.round(values[2]), 
                    		Math.round(values[3]));
                }
            };
            
            // WALKTHRU (move elsewhere) =========================================================
            
            // ////////////////
            // Movable // extends RiText
            // ////////////////
            Movable = function(txt, xPos, yPos, font) {
            	console.log("Movable("+txt+","+xPos+","+yPos+","+font+")");
            	RiText.apply(this, arguments);
	        };
	          
	        // inherit
	        Movable.prototype = inherit(RiText.prototype);
	        

            // ////////////////
            // Player // extends Movable
            // ////////////////
	        
	        Player = function(txt, xPos, yPos, font) {
            	console.log("Player("+txt+","+xPos+","+yPos+","+font+")");
            	Movable.apply(this, arguments);
	        };
	        
	        Player.prototype = inherit(Movable.prototype);

	        assert = function(exp, msg) { // hack: p5 makes this diff.
	        	if (!isNull(exp)) {
	        	//if (!exp) {
		        	var callee = arguments.callee.caller.toString();
		        	msg = assign(msg, "");
		        	throw new Error("[ASSERT-FAIL] "+msg+'\n\n'+callee);
	        	}
	        }
	                    
         } // end with()
        
     }; // end RiTaLibrary
    
    //if (!isNull(Processing) && !isNull(Processing.lib)) Processing.lib.RiTaLibrary = RiTaLibrary; // install in p5
    
})();
