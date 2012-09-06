/*
 * TODO:
 *
 * -- remove dependency for 1 function (getMetrics()) on jquery...
 *           
 *   -- add memoizing of functions: textWidth, textAscent, textDescent, getBoundingBox, etc
 *       -- fonts and bounds
 *   
 *   -- re-add requestAnimationFrame?
 *
 *  RiTa:
        splitSentences(): Can't use the lib from java for sentence parsing.
            Implemented a simple regex. What's a better alternative?

    RiText: 

        Make sure that color() takes numbers AND strings (e.g., 'black' or '#ffee23');
        Add: rotateTo(radians, sec) 

    RiLexicon:
        Need to better deal with words not found in dictionary (getStresses, getPhonemes, getSyllables)
        Finish: Get-random-word-by-part-of-speech

    Conjugator:
        Why are irregulars not accurate? Sleep is returning "sleeped" not "slept"
            Why is it apparently only reaching two types of rules?
            
    Add: RiHTMLParser / Google Search / MsNgramClient
        fetch()
        fetchImage()
        Google search good to go, with API key. Should take this as argument

        $Id: rita-0.14a.js,v 1.1 2012/06/20 13:22:41 dev Exp $

 */
(function(window, undefined) {
        

    
    /**
     * Simple type-checking framework for arguments and return values
     * Adapted from: 
     *   http://blog.jcoglan.com/2008/01/22/bringing-static-type-checking-to-javascript
     * @private
     */ 
    Types = {
        
        /**
         * from: http://javascriptweblog.wordpress.com/2011/08/08/fixing-the-javascript-typeof-operator/
         */
        get : function(obj) {
            
            var x = ({}).toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase();
            //x = typeof x.toLowerCase == F ? x.toLowerCase() : x;
            //log("calling: "+x+" "+typeof x.toLowerCase +" '"+x.toLowerCase()+"'");
            return x;
        },
        
        sigMatch : function() {
            
            var a = arguments;
            switch (a.length) {
    
                case 0:
                case 1:
                    throw Error("Too few args: " + a.length);
                    break;
    
                case 2:
                    return (a[0] && a[1] && Types.checkSig(a[0], a[1]));
    
                default:
    
                    var theActual = a[a.length - 1];
    
                    for ( var i = 0; i < a.length - 1; i++) {
                        if (Types.checkSig(a[i], theActual))
                            return true;
                    }
                    return false;
            }
        },
        
        checkSig : function(expected, actual) {

            // log( "_checkSig: expected="+expected+" actual:"+actual);
            
            if (arguments.length == 2 && expected === 'array' && actual instanceof Array)
                return true; 
            
            if (actual.length != expected.length) 
                return false;
            
            var n = expected.length, valid, a, b;
            
            for ( var i = 0; i < n; i++) {
                a = actual[i];
                b = expected[i];
                valid = true;
    
                switch (true) {
                        
                    case b instanceof Function:
                        valid = a ? (a.isA ? a.isA(b) : (a instanceof b)) : false;
                        break;
    
                    case typeof b == 'string' || b instanceof String:
                        
                        // allow numbers for booleans (?)
                        valid = ((typeof a == b) || 
                            (b === 'array'      && a instanceof Array) ||
                            (b === 'boolean'    && typeof a === 'number') ||
                            (b === 'regexp'     && Types.get(a) === 'regexp'));
    
                        break;
                }
    
                if (!valid) return false;
            }
    
            return true;
        },
        
        throwError : function(msg) {
            
            console.trace(this);
            throw TypeError(msg);
        },

        
        /**
         * Simple type-checking for argument types 
         * @private
         */  
        expects : function() {
            
            var method = this, expected = []; //arguments;
            
            for ( var i = 0; i < arguments.length; i++) {
                expected[i] = arguments[i];
            }
    
            if (expected.length === 0) expected = [ [] ];
    
            // check for old-style args (not in array), e.g., expects(B,S);
            if (expected.length > 0) {
                for ( var i = 0; i < expected.length; i++) {
                    if (typeof expected[i] === 'string' && expected[i] !== 'array') {
                        Types.throwError("Failed expects(): expected array, found string "
                            + "(perhaps an old-style arguments list?): \n" + method);
                    }
                }
            }
    
            return function() {
    
                var args = [], given = [];
                
                for ( var i = 0; i < expected.length; i++)
                    args.push(expected[i]);
                
                for ( var i = 0; i < arguments.length; i++) 
                    given.push(arguments[i]);
    
                args.push(given); // [[expected1],[expected2],...,[arguments]]
    
                if (!Types.sigMatch.apply(this, args)) {
                    Types.throwError('Invalid arg types: expecting ' + 
                        asList(expected) + ' but found: '+asList(given));
                }
    
                return method.apply(this, arguments);
            };
        },

    
        /**
         * Simple type-checking for return types 
         * @private
         */   
        returns : function() {
            
            if (arguments.length != 1) throw Error
                ('returns() expects 1 arg, found '+arguments.length);
            
            var method = this, expected = arguments[0];
            
            return function() {
                
                var result = method.apply(this, arguments);
                
                if (!Types.checkSig([expected],[result])) {
                    
                    Types.throwError('Invalid return type: ' + result + 
                        ' (' + (Types.get(result))+ '), expected: ' + expected+"\n");
                }
                return result;
            };
        }
        
    } // end Types
    
    // TODO: clean these up after
    Function.prototype.expects = Types.expects;
    Function.prototype.returns = Types.returns;

    // ////////////////////////////////////////////////////////////
    // RiMarkov
    // ////////////////////////////////////////////////////////////
    
    /**
     * @name RiMarkov
     * @class Performs analysis and text generation via Markov chains (aka N-Grams) 
     * with options to process single characters, words, sentences, and 
     * arbitrary regular expressions. 
     */
    /*
     * <p>
     * 
     * Provides a variety of methods specifically 
     * designed for text-generation.
     *  
     * @example usage:<pre>
     *   RiMarkov rm = new RiMarkov(this, 3);
     *   rm.loadFile("war_peace.txt"); // in data dir.
     *   String[] sents = rm.generateSentences(10);
     *   for (int i = 0; i < sents.length; i++) {
     *     System.out.println(sents[i]);
     *   }</pre>
     
     * Note: use RiMarkov.setTokenizerRegex() to control how inputs are tokenized (or split-up). 
     * The default is to use the Penn word-tokenizing conventions (without splitting contractions). 
     * You may wish to simply use whitespace (or some other regular expression), which 
     * can be accomplished as follows:<pre>
     *   RiMarkov rm = new RiMarkov(this, 3);
     *   rm.setTokenizerRegex("\\s");</pre>
     *   
     *   
     * This creates a new model, with n=3, that tokenizes its
     * input on the whitespace characters: [ \t\n\x0B\f\r].
     * 
     * <p> 
     * 
     * Note: use RiMarkov.setAllowDuplicates(false) method to ensure that sentences that exist 
     * in the input test are not output by generate().  This method should be used with care, 
     * as certain sets of input texts (with allowDuplicates=false) may result in decreased performance
     * and/or excessive memory use.
     */
    var RiMarkov = makeClass();
            
    RiMarkov.prototype = {

        /**
         * @function
         * @name RiMarkov 
         * 
         * Construct a Markov chain (or n-gram) model and set its n-Factor
         * 
         * @param {number} nFactor for the model
         * @param {boolean} caseSensitive whether the model should be case-sensitive (optional, default=false)
         */
        constructs : function(nFactor, caseSensitive) {
                       
            this._n = nFactor;
            this.useSmoothing = false;
            this.ignoreCase = !caseSensitive || true;
            this.root = new TextNode(null, 'ROOT');
            
        }.expects([N],[N,B]),
        
        /**
         * Returns either the raw (unigram) probability for a single token in the model (0 if it does not exist)
         * OR (for an array) the probability of obtaining a sequence of k tokens where k <= nFactor,
         * e.g., if nFactor = 3, then valid lengths for the data arrau are 1, 2 & 3.
  
         * @param {string | array} data the string (or sequence of strings) to search for
         * 
         * @returns {number} from 0-1
         */
        getProbability: function(data) {
            
            if (!this.root) throw Error("Model not initialized: null root!");
            
            var tn = (typeof data=='string') ? this.root.lookup(data) : this._findNode(data);

            return (tn) ? tn.probability() : 0;
            
        }.expects([S],[A]).returns(N),
        
        /** 
         * Returns the full set of possible next tokens, as an associative array, 
         * (mapping string -> number (probability)) given an array of tokens 
         * representing the path down the tree (with length less than n).
         * <p>  
         * If the input array length is not less than n, or the path cannot be 
         * found, or the end-node has no children, null is returned.
         * <p>
         * @param {string | array} a single token or array of tokens (strings)
         *
         * @returns {object} associative array mapping tokens to probabilities
         */
        getProbabilities : function(path) {
            
            if (Types.get(path) == 'string') path = [path];
            
            if (path.length < 1 || path.length >= this._n)      
              return {};
            
            var probs = {}, tn = this._findNode(path);
            
            if (!tn) return {};

            var nexts = tn.childNodes();
            for ( var i = 0; i < nexts.length; i++) {
                var node = nexts[i];
                if (node)  {
                    probs[node.token] = node.probability();
                }
            }
            
            return probs;
            
     
            // DEAD: CHANGED IN RiTa 6/16/12 //////////////////////////////////

            /*SAVE: for ( var i = 0; i < nexts.length; i++) {
              var node = nexts[i];   
              if (node) {
                  
                var tok = node.token;   
                var copy = path.slice();
                copy.push(tok);
                var prob = this.getProbability(copy);
                probs[tok] = prob;
              }      
            }
            return probs; */
            
        }.expects([A],[S]).returns(O),
        
        /**
         * Continues generating tokens until a token matches 'regex', assuming
         * the length of the output array is between min and maxLength (inclusive).
         * 
         * @param {string} or {object} regex The regex string or object to match against
         * @param {number} minLength the minimum number of tokens to generate
         * @param {number} maxLength the maximum number of tokens to generate
         * 
         * @returns {array} strings
         */ 
        generateUntil : function(regex, minLength, maxLength){
           
            minLength = minLength || 1, maxLength = maxLength || 99;
            
            var mn, tokens, tries=0, maxTries=500;
            
            OUT: while (++tries < maxTries) {
            
                // generate the min number of tokens
                tokens = this.generateTokens(minLength);

                // keep adding one and checking until we pass the max
                while (tokens.length < maxLength) {
                    
                    mn = this._nextNode(tokens);
                    
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
                throw Error("\n[WARN] RiMarkov failed to complete after "+tries+" attempts\n");

            return tokens;
           
        }.expects([S],[S,N,N]).returns(A), 
            
        /**
         * Generates a string of <pre>length</pre> tokens from the model
         * @param {number} the target number of tokens to generate
         * @returns {array} strings
         */
        generateTokens : function(targetNumber){
            
            var tries = 0, maxTries = 500, tokens = [];
            
            OUT: while (++tries < maxTries) {
                
              var mn = this.root.selectChild(null, true);
              if (!mn || !mn.token) continue OUT;
              tokens.push(mn);
              
              while (tokens.length < targetNumber) {
                  
                mn = this._nextNode(tokens);
                if (!mn || !mn.token)  { // hit the end
                    
                  tokens = []; // start over
                  continue OUT;
                }   
                
                tokens.push(mn);        
              }
              
              break;
            }
            
            // uh-oh, looks like we failed...
            if (tokens.length < targetNumber) {
                 throw Error("\n[WARN] RiMarkov failed to complete after "+tries
                   +" tries, with only "+tokens.length+" successful generations...\n");
            }
   
            var res = [];
            for ( var i = 0; i < tokens.length; i++) {
                res[i] = tokens[i].token;
            }
            
            return res;// this._tokensToString(tokens, true);

        }.expects([N]).returns(A),
        


        /**
         * Sets/gets whether the model ignores case in its comparisons
         * @param {boolean} value sets the value of the flag (optional)
         * @returns {number}
         */
        ignoreCase : function(value){
            
            if (arguments.length) {
                
                // TODO: and do what??
                this.ignoreCase = value;
                return this;
            }
            return this.ignoreCase;
            
        }.expects([B],[]),
        
        /**
         *  TODO: does this make sense as one method?
         * 
         * If only one array parameter is provided, this function returns all possible
         * next words (or tokens), ordered by probability, for the given
         * array. <p>Note: seed arrays of any size (>0) may 
         * be input, but only the last n-1 elements will be considered.   
         *
         * @example var result = getCompletions([ "the","red"]);
         *
         * If two arrays are provided, it returns an unordered list of possible words <i>w</i> 
         * that complete an n-gram consisting of: pre[0]...pre[k], <i>w</i>, post[k+1]...post[n].
         * As an example, the following call:
         * 
         * @example var result = getCompletions([ "the" ], [ "red", "ball" ]);
         * 
         * will return all the single words that occur between 'the' and 'red ball'
         * in the current model (assuming n > 3), e.g., [ 'round', 'big', 'bouncy']).
         * <p> 
         * Note: For this operation to be valid, (pre.length + post.length)
         * must be strictly less than the model's nFactor, otherwise an 
         * exception will be thrown. 
         * 
         * @param {array} pre
         * @param {array} post (optional)
         * 
         * @returns {array}  an unordered list of possible next tokens
         * 
         * @private  TODO: implement me!
         */
        getCompletions : function(pre, post) {
            
            throw Error('not yet implemented in RiTaJS');
            
           /* if (!post) {
                if (pre == null || pre.length >= nFactor)
                    throw new RiTaException("Invalid pre array: "+RiTa.asList(pre));
                  
                  int postLen = post == null ? 0 : post.length;    
                  if (pre.length + postLen > nFactor) {
                    throw new RiTaException("Sum of pre.length" +
                        " && post.length must be < N, was "+(pre.length+postLen));        
                  }
                  
                  TextNode tn = findNode(pre);
                  if (tn == null) return null;
                  
                  List result = new ArrayList();
                  Collection nexts = tn.getChildNodes();
                  for (Iterator it = nexts.iterator(); it.hasNext();)
                  {
                    TextNode node = (TextNode) it.next();
                    String[] test = appendToken(pre, node.getToken());
                    if (test == null) continue;
                    for (int i = 0; i < postLen; i++)
                      test = appendToken(test, post[i]); 
                    if (findNode(test) != null)
                      result.add(node.getToken());      
                  }        
                  return strArr(result);
            }
            else {
                var seed = pre;
                if (seed == null || seed.length == 0) {
                    System.out.println("[WARN] Null (or zero-length) seed passed to getCompletions()");
                    return null;
                }
                int firstLookupIdx = Math.max(0, seed.length-(nFactor-1));         
                TextNode node = rootLookup(seed[firstLookupIdx++]);    
                for (int i = firstLookupIdx; i < seed.length; i++) {
                    if (node == null) return null;
                    node = node.lookup(seed[i]);
                }
                if (node == null) return null;
    
                Collection c = node.getChildMap().values();
                if (c == null || c.size()<1) return null;
                TextNode[] nodes = new TextNode[c.size()];
                nodes = (TextNode[])c.toArray(nodes);
                Arrays.sort(nodes);
                String[] result = new String[nodes.length];
                for (int i = 0; i < result.length; i++)
                    result[i] = nodes[i].getToken();
                return result;
            }*/
        }.expects([A],[A,A]).returns(A),

        /**
         * Returns the current n-value for the model
         * 
         * @returns {number}
         */
        getN : function() {
            
            return this._n;
            
        }.expects([]).returns(N),

        
        /**
         * Returns the number of tokens currently in the model
         * @returns {number}
         */
        numTokens : function() {
            
            return this.root.count;
            
        }.expects([]).returns(N),
        
        /**
         * Prints a formatted version of the model to the console 
         */
        print : function() {
            
            console && console.log(this.root.asTree(false));
            
        }.expects([]),
        
        /**
         * Loads an array of tokens (or words) into the model; each 
         * element in the array must be a single token for proper 
         * construction of the model. 
         * 
         * @param {array} tokens the strings with which to load the model 
         * @param {number} multiplier Weighting for tokens in the array (optional, default=1) <br>
         * @returns {object} this RiMarkov
         */
        loadTokens : function(tokens, multiplier) {
          
          multiplier = multiplier || 1;

          this.root.count += tokens.length; // here?
          
          for (var toAdd, k = 0; k < tokens.length; k++)
          {
            toAdd = [];
            
            for (var j = 0; j < this._n; j++)
            {
              if ((k+j) < tokens.length)   
                toAdd[j] = (!isNull(tokens[k+j])) ? tokens[k+j] : null;
              else 
                toAdd[j] = null;
            }      
            
            // hack to deal with multiplier...
            for (var j = 0; j < multiplier; j++) {
              var node = this.root;          
              for (var i = 0; i < toAdd.length; i++) {
                if (node.token)        
                  node = node.addChild(toAdd[i]);
              }
            }
          }
          
          return this;
          
        }.expects([A],[A,N]).returns(O),
        

        /** @private */
        _findNode : function(path) 
        {
          // log("RiMarkov.findNode("+path.toString()+")");
          if (!path || Types.get(path) != 'array' || !path.length)
              return null;

          var nFactor = this._n;
          var numNodes = Math.min(path.length, nFactor-1);
          var firstLookupIdx = Math.max(0, path.length-(nFactor-1));         
          var node = this.root.lookup(path[firstLookupIdx++]);    
          
          if (!node) return null;
          
          var idx = 0;  // found at least one good node
          var nodes = [];    
          nodes[idx++] = node; 
          for (var i = firstLookupIdx; i < path.length; i++) {       
            node = node.lookup(path[i]);
            if (!node) return null;
            nodes[idx++] = node;
          }
          
          return nodes ? nodes[nodes.length-1] : null;
        },
        
        _nextNode : function(previousTokens)
        { 
          // Follow the seed path down the tree
          var firstLookupIdx = Math.max(0, previousTokens.length-(this._n-1)), 
              node = this.root.lookup(previousTokens[firstLookupIdx++]);
          
          for (var i = firstLookupIdx; i < previousTokens.length; i++) {
              (node) && (node = node.lookup(previousTokens[i]));
          }
          
          // Now select the next node
          return node.selectChild(null, true);
        },
        
        _tokensToString : function(tokens, addSpaces) { // not used at moment
          var result = E; 
          for ( var i = 0; i < tokens.length; i++) {
            if (tokens[i].token) {
                result += tokens[i].token;
                if (i < tokens.length-1 && addSpaces)
                    result += SP;      
            }
          }
          return result;
        }

    };
    
    ///////////////////////////////////////////////////////////////////////////
    // RiTaEvent class 
    ///////////////////////////////////////////////////////////////////////////
    
    /**
     * @name RiTaEvent
     * 
     * @class Simple wrapper for event-based callbacks 
     */
    /*
     * @example A typical usage might be to switch on the type 
     * of a RiTaEvent within a callback:
     <pre>
     function onRiTaEvent(e)
        {
          if (e.Types.get() == RiTa.BEHAVIOR_COMPLETED)
            // ...
          else 
            // ...
        }
        <pre>
     */   
    RiTaEvent = makeClass();
    
    RiTaEvent._callbacksDisabled = false;
    
    RiTaEvent.prototype = {
        
        /**
         * Contructs a new RiTaEvent object with a source and type
         */
        constructs : function(sourceRiText, eventType) {
            
            if (!sourceRiText) throw Error('source required');
            
            var fn = RiTaEvent.prototype.constructs;
            if (!fn.ID) fn.ID = 0;
            this._id = ++(fn.ID);
            
            this._source = sourceRiText;
            this._type = eventType || RiText.UNKNOWN;
            //this._data = data;
            
        }.expects([O],[O,S]),
        
        
        /** @private  */
        toString : function() {
            
            return "RiTaEvent[#"+this._id+" type="+this._type+
                " src="+this._source.toString()+"]";//+", data="+this._data+"]";
            
        }.expects([]),
        
        /**
         * Gets the source for this event
         * @returns {object} the source
         */
        getSource : function() {
            
            return this._source;
            
        }.expects([]),
        
        /**
         * Gets the type for this event
         * @returns {string} the type
         */
        getType : function() {
            
            return this._type;
            
        }.expects([]),
        
        /**
         * Fires an event and directs it to the appropriate callback implementation
         * @param callback
         * @private
         */
        fire : function(callback) {

            callback = callback || window.onRiTaEvent || RiText.graphics().onRiTaEvent; // last is for P5
            
            if (typeof callback === 'function') {
                
               try {
                   callback.apply(this,[this]);
               }
                catch(err) {
                    
                    RiTaEvent._callbacksDisabled = true;
                    console.warn("RiTaEvent: error calling 'onRiTaEvent' "+err);
                    throw err;
                }                
            }
            else if (!RiTaEvent._callbacksDisabled) {
                
                console.warn("RiTaEvent: no 'onRiTaEvent' callback found");
                RiTaEvent._callbacksDisabled = true;
            }
            
        }.expects([],[O])
    }
    
    
    // ////////////////////////////////////////////////////////////
    // RiLexicon
    // ////////////////////////////////////////////////////////////
    
    /**
     * @name RiLexicon
     * 
     * @class Represents the core 'dictionary' (or lexicon) for the RiTa tools. 
     * It contains ~35,000 words augmented with phonemic and syllabic data, as well as a list of valid parts-of-speech for each. 
     * The lexicon can be extended and/or customized for additional words, usages, or pronunciations.
     * 
     * <p> Additionally the lexicon is equipped with implementations of a variety of matching algorithms 
     * (min-edit-distance, soundex, mutone, anagrams, alliteration, rhymes, looks-like, etc.) 
     * based on combinations of letters, syllables and phonemes.
     * <p>
     * Note: For performance, the data for RiLexicon is shared in a single location for ALL created instances (static)
     * <p> 
     * Note: If you wish to modify or customize the lexicon (e.g., add words, or change pronunciations) 
     * you can do so directly, by editing the 'rita_dict.js' file, or programatically, via addWord() and removeWord()
     *
     * @example
        lex = new RiLexicon(this);
        similars = lex.similarBySound("cat");
        rhymes = lex.getSimpleRhymes("cat");
        // etc.
     */
    RiLexicon = makeClass();

    // ////////////////////////////////////////////////////////////
    // Static functions
    // ////////////////////////////////////////////////////////////
    
    /** Clears the whole lexicon */
    RiLexicon.clear = function() {
        
       RiLexicon.data = undefined;
    }
    
    /**
     * Returns the singleton instance of RiLexicon
     * Do we need this? 
     */
    RiLexicon._getInstance = function() {

        var lexicon; 
        
        try {
            lexicon = new RiLexicon();
        }
        catch(e) {
            error("No RiTa lexicon found! Have you included 'rita_dict.js'?");
        }
        
        RiLexicon._getInstance = function() {
            return lexicon;
        };
        
        return lexicon;
    }

    // ////////////////////////////////////////////////////////////
    // Static variables
    // ////////////////////////////////////////////////////////////
   
    // TODO: these need comments
    
    RiLexicon.FEATURE_DELIM = ':';
    
    RiLexicon.STRESSED = '1'; 
    
    RiLexicon.UNSTRESSED = '0';
    
    RiLexicon.PHONEME_BOUNDARY = '-'; 
    
    RiLexicon.WORD_BOUNDARY = " "; 
    
    RiLexicon.SYLLABLE_BOUNDARY = "/"; 
    
    RiLexicon.SENTENCE_BOUNDARY = "|";
    
    RiLexicon.VOWELS = "aeiou";
    
    /** @private */
    RiLexicon.data = undefined; // shared static var
    
    // ////////////////////////////////////////////////////////////
    // Member functions
    // ////////////////////////////////////////////////////////////
    
    RiLexicon.prototype = {
        
        /**
         * Constructs an instance of the RiLexicon class.
         * <p> 
         * Note: For performance, the data for all RiLexicon instances
         * is shared (there is only 1 copy)
         */
        constructs : function() { 
            
           if (!RiLexicon.data) {
            
               //log(typeof RiTa_DICTIONARY);
               if (typeof RiTa_DICTIONARY != 'undefined') 
               {
                 //if (!RiTa.SILENT && console) console.log('[RiTa] Loaded lexicon data...'); 
                 
                 RiLexicon.data = RiTa_DICTIONARY;
               } 
               else {
           
                   error("Dictionary not found! Make sure to add it to your .html:"
                      + ", e.g.,\n\n    <script src=\"path/to/rita_dict.js\"></script>");
               }
           }
               
        }.expects(),
     
        /**
         * Adds a word to the current lexicon (not permanent)
         * 
         * @example lexicon.addWord('abandon','ax-b ae1-n-d ax-n','vb nn vbp');
         * 
         * @param {string} word
         * @param {string} pronunciationData
         * @param {string} posData
         * 
         * @returns {object} this RiLexicon  
         */
        addWord : function(word, pronunciationData, posData) {
            
            RiLexicon.data[word.toLowerCase()] = [pronunciationData,posData];
            return this;
            
        }.expects([S,S,S]).returns(O),
        
        /**
         * Removes a word from the current lexicon (not permanent)
         * 
         * @example removeWord('abandon');
         * 
         * @param {string} word
         * @returns {object} this RiLexicon  
         */
        removeWord : function(word) {
            
            delete RiLexicon.data[word];
            return this;
            
        }.expects([S]).returns(O),
        
        
        /**
         * Compares the characters of the input string  (using a version of the min-edit distance algorithm)
         * to each word in the lexicon, returning the set of closest matches.        
         * 
         * @param {string} word
         * @param {number} minAllowedDist minimum edit distance for matches (optional, default=1)
         * @param {boolean} preserveLength whether to return only words that match the length of the input word (optional, default=true)
         * 
         * @returns {array} matching words 
         */
        similarByLetter : function(input, minAllowedDist, preserveLength) { 
       
                    var minVal = Number.MAX_VALUE, minLen = 2,  result = []; 
                    
                    if (!(input && input.length)) return [];
                    
                    input = input.toLowerCase();
                    minAllowedDist = minAllowedDist || 1;
                    preserveLength = preserveLength || false;
                    
                    for (var entry in RiLexicon.data) {
                    
                      if (preserveLength && entry.length != input.length || entry.length < minLen) 
                          continue; 
                            
                      entry = entry.toLowerCase();
                      
                      if (entry==input || entry==(input+"s")|| entry==(input+"es")) 
                          continue;
                      
                      var med = MinEditDist.computeRaw(entry, input);     
                      
                      if (med == 0) continue; // same word

                      // we found something even closer
                      if (med >= minAllowedDist && med < minVal) {
                          
                          minVal = med;
                          result = [entry];
                      }  
                      
                      // we have another best to add
                      else if (med == minVal) { 
                          result.push(entry);
                      }
                    }        
                    
                    return result;
            
        }.expects([S],[S,N],[S,N,B]).returns(A),
        
        /**
         * Compares the phonemes of the input string 
         * (using a version of the min-edit distance algorithm)
         * to each word in the lexicon, returning the set of closest matches.        
         * 
         * @param {string} input
         * @param {number}  minEditDist (optional) minimum edit distance for matches 
         * @returns {array} matching words 
         */
        similarBySound: function(input, minEditDist) { // take options arg instead?
                  
                var minVal = Number.MAX_VALUE, entry, result = [], minLen = 2;
                
                minEditDist = minEditDist || 1;
                
                var targetPhonesArr = this.getPhonemes(input.toLowerCase()).split("-");

                if (targetPhonesArr[0] == null || !(input && input.length)) return [];
       
                for (entry in RiLexicon.data) {
            
                      if (entry.length < minLen) continue;
                      
                      entry = entry.toLowerCase();
                      
                      if (entry==input || entry==(input+"s")|| entry==(input+"es")) 
                          continue; 
                    
                      // NOTE: we don't want to call getPhonemes() here -- too slow //////
                      //phonesArr = this.getPhonemes(entry).split("-");
                      
                      var phones = this.getRawPhones(entry); // use raw instead
                      
                      if (!phones.length)  throw Error("Failed lookup (need LTSEngine): "+entry);
                      
                      var phonesArr = phones.replace(/1/g, "").replace(/ /g, "-").split('-');
                      
                      // /////////////////////////////////////////////////////////////////
                      
                      var med = MinEditDist.computeRaw(phonesArr, targetPhonesArr);  

                      if (med == 0) continue; // same phones 
    
                      // we found something even closer
                      if (med >= minEditDist && med < minVal) {
    
                          minVal = med;
                          result = [entry];
                      }  
                      // we have another best to add
                      else if (med == minVal) {
                          result.push(entry);
                      }
                }

                return result;
            
        }.expects([S],[S,N]).returns(A),
        
        /**
         * Returns all valid substrings of the input word in the lexicon 
         *
         * @param {string} word
         * @param {number} minLength (optional, default=4) minimum length of return word 
         * @returns {array} matching words 
         */
        substrings: function(word, minLength) { 
            
            minLength = minLength || (minLength === 0) || 4;
            
            var entry, result =[];
            for  (entry in RiLexicon.data){
                if(entry == word || entry.length < minLength ) continue;        
                if (word.indexOf(entry) >=0) result.push(entry);
            }
            return result;
            
        }.expects([S],[S,N]).returns(A),
        
        /**
         * Returns all valid superstrings of the input word in the lexicon 
         *
         * @param {string} word
         * @returns {array} matching words 
         */
        superstrings: function(word) { 
            
            var entry, result =[];
            for  (entry in RiLexicon.data){
                if(entry == word) continue;
                if (entry.indexOf(word) >= 0) result.push(entry);
            }
            return result;
        
        }.expects([S]).returns(A),
        
        /**
         * First calls similarBySound(), then filters the result set by the algorithm 
         * used in similarByLetter(); (useful when similarBySound() returns too large a result set)
         * @param {string} word
         * @param {number} minEditDist (optional) minimum edit distance for both matches 
         * @returns {array} matching words 
         */
        similarBySoundAndLetter: function(word, minEditDist) { // take options arg instead?
            
            var result =[];
            
            if (isNull(minEditDist)){
                var simSound = this.similarBySound(word);
                var simLetter = this.similarByLetter(word);
            } else {
                var simSound = this.similarBySound(word,minEditDist);
                var simLetter = this.similarByLetter(word,minEditDist);
                }

            if (isNull(simSound) || isNull(simLetter)) return result;
            
            for(var i=0; i<simSound.length; i++){
                for(var j=0; j<simLetter.length; j++){
                    if(simSound[i] == simLetter[j]) result.push(simLetter[j]);
                }
            }
            return result;
            
        }.expects([S],[S,N]).returns(A),
        
        /**
         * Returns the array of all words in the lexicon or those matching a specific regex. If specified,
         * the order of the result array is randomized before return.
         *  
         * @param {regex} regex (string or object) pattern to match (optional)
         * @param {boolean} randomize randomizes the order (default=false)
         * @returns {array} words in the RiLexicon  
         */
        getWords : function() {
            
            var a = arguments, randomize = false, regex = undefined,
                wordArr = [], words =  Object.keys(RiLexicon.data);
            
            switch (a.length) {
                
                case 2:
                    
                    if (Types.get(a[0]) == 'boolean') {
                        randomize = a[0];
                        regex = (Types.get(a[1]) == 'regexp') ? a[1] : new RegExp(a[1]);
                    } 
                    else {
                        randomize = a[1];
                        regex = (Types.get(a[0]) == 'regexp') ? a[0] : new RegExp(a[0]);
                    };

                    break;
                    
                case 1:
                    
                    //log(a[0] + " :: "+Types.get(a[0]));
                    
                    if (Types.get(a[0]) == 'boolean') {
                        return a[0] ? shuffle(words) : Object.keys(words);
                    };
                    
                    regex = (Types.get(a[0]) == 'regexp') ? a[0] : new RegExp(a[0]);
                    
                    break;
                    
                case 0:
                    
                    return shuffle(words);
            }
            

            for (var i = 0; i < words.length; i++) {
                
                if (words[i].match(regex)) {
                    
                    wordArr.push(words[i]);
                }
            }
            
            return randomize ? shuffle(wordArr) : wordArr;
            
        }.expects([],[S],[B],[S,B],[B,S],[R],[R,B],[B,R]).returns(A),
        
        /**
         * Returns true if c is a vowel
         * @private
         * @param {char} p
         * @returns {boolean}
         */
        isVowel : function(p) {

            return (strOk(p) && RiLexicon.VOWELS.indexOf(p) > -1);
             
        }.expects([S]).returns(B),

        /**
         * Returns true if c is a consonant
         * @private
         * @param {char} p
         * @returns {boolean}
         */
        isConsonant : function(p) {

            return (typeof p == 'string' && p.length==1 && 
                RiLexicon.VOWELS.indexOf(p) < 0 && /^[a-z\u00C0-\u00ff]+$/.test(p));
            
        }.expects([S]).returns(B),

        /**
         * Returns true if the word exists in the lexicon
         * @param {string} word
         * @returns {boolean} 
         */
        containsWord : function(word) {

            return (strOk(word) && !isNull(RiLexicon.data[word.toLowerCase()]));
            
        }.expects([S]).returns(B),
        
        /**
         * Returns true if the two words rhyme, that is, if their final stressed phoneme 
         * and all following phonemes are identical, else false.
         * <p>
         * Note: returns false if word1.equals(word2) or if either (or both) are null;
         * <p>
         * Note: at present doesn't use letter-to-sound engine if either word is not found in the lexicon, 
         * but instead just returns false. 
         * 
         * @param {string} word1
         * @param {string} word2
         * 
         * @returns {boolean} true if the two words rhyme, else false.
         */
        isRhyme : function(word1, word2) {

            if ( !strOk(word1) || !strOk(word2) || equalsIgnoreCase(word1, word2))
                return false;
            
            var p1 = this.lastStressedPhoneToEnd(word1), 
                p2 = this.lastStressedPhoneToEnd(word2);
            
            return (strOk(p1) && strOk(p2) && p1 === p2);
            
        }.expects([S,S]).returns(B),

        /**
         * 
         * Two words rhyme if their final stressed vowel and all following phonemes are identical.
         * @param {string} word
         * @returns {array} strings of the rhymes for a given word, or empty array if none are found
         */
        getRhymes : function(word) {

            //this.__buildWordlist__();

            if (this.containsWord(word)) {

                var p = this.lastStressedPhoneToEnd(word);
                var entry, entryPhones, results = [];

                for (entry in RiLexicon.data) {
                    if (entry === word)
                        continue;
                    entryPhones = this.getRawPhones(entry);

                    if (strOk(entryPhones) && endsWith(entryPhones, p)) {
                        results.push(entry);
                    }
                }
                return (results.length > 0) ? results : []; // return null?
            }
            
            return []; // return null?
            
        }.expects([S]).returns(A),

        /**
         * Finds alliterations by comparing the phonemes of the input string to those of each word in the lexicon
         * 
         * @param {string} word input
         * @returns {array} strings of alliterations
         */
        getAlliterations : function(word) {

            if (this.containsWord(word)) {

                var c2, entry, results = [];
                var c1 = this.firstConsonant(this.firstStressedSyllable(word));

                for (entry in RiLexicon.data) {
                    
                    c2 = this.firstConsonant(this.firstStressedSyllable(entry));
                    
                    if (c2 && c1 === c2) {
                        results.push(entry);
                    }
                }
                return (results.length > 0) ? results : []; // return null?
            }
            return []; // return null?
            
        }.expects([S]).returns(A),

        /**
         * Returns true if the first stressed consonant of the two words match, else false.
         * 
         * @param {string} word1
         * @param {string} word2
         * @returns {boolean} true if word1.equals(word2) and false if either (or both) are null;
         */
        isAlliteration : function(word1, word2) {

            if (!strOk(word1) || !strOk(word2)) return false;

            if (equalsIgnoreCase(word1, word2)) return true;

            var c1 = this.firstConsonant(this.firstStressedSyllable(word1)),
                c2 = this.firstConsonant(this.firstStressedSyllable(word2));

            //log("'"+c1+"'=?'"+c2+"'");
            
            return (strOk(c1) && strOk(c2) && c1 === c2);
            
        }.expects([S,S]).returns(B),

        /**
         * Returns the first stressed syllable of the input word
         * @private
         * @param {string} word
         * @returns {string}   
         */
        firstStressedSyllable : function(word) {

            var raw = this.getRawPhones(word), idx = -1, c, firstToEnd;

            if (!strOk(raw)) return E; // return null?
            
            idx = raw.indexOf(RiLexicon.STRESSED);

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
            
        }.expects([S]).returns(S),
        
        /**
         * Returns a String containing the phonemes for each syllable of each word of the input text, 
         * delimited by dashes (phonemes) and semi-colons (words). For example, the 4 syllables of the phrase 
         * 'The dog ran fast' is "dh-ax:d-ao-g:r-ae-n:f-ae-s-t".
         * @private
         * @param {string} word
         * @returns {string} the phonemes for each syllable of each word, or null if no text has been input.
         */
        getSyllables : function(word) {

            if (!word.length) return E; // return null?
            
            var wordArr = RiTa.tokenize((word)), phones, raw = [];
            
            for (var i=0; i< wordArr.length; i++) {
                
                raw[i] = this.getRawPhones(wordArr[i]).replace(/ /g, "/");
            }
            
            return RiTa.joinWords(raw).replace(/1/g, "").trim();
            
        }.expects([S]).returns(S),

        /**
         * Returns a String containing all phonemes for the input text, delimited by semi-colons
         * 
         * @example "dh:ax:d:ao:g:r:ae:n:f:ae:s:t"
         * 

         * @param {string} word
         * 
         * @returns {string} all phonemes, or null if no text has been input.
         * 
         * @private
         * 
         */
        getPhonemes : function(word) {

            if (!word.length) return E; 

            var wordArr = RiTa.tokenize((word)), raw = [];

            for (var i=0; i< wordArr.length; i++)
            {

                if (RiTa.isPunctuation(wordArr[i])) continue;

                // raw[i] = wordArr[i].length
                raw[i] = this.getRawPhones(wordArr[i]);

                if (!raw[i].length)
                    throw Error("Unable to lookup (need LTSEngine): "+wordArr[i]);

                raw[i] = raw[i].replace(/ /g, "-");
            }

            return RiTa.joinWords(raw).replace(/1/g, "").trim(); 
            
        }.expects([S]).returns(S),

        /**
         * Returns a String containing the stresses for each syllable of the input text, delimited by semi-colons, 
         * @examlpe "0:1:0:1", with 1's meaning 'stressed', and 0's meaning 'unstressed', 
         * @private
         * @param {string} word
         * @returns {string} stresses for each syllable, or null if no text has been input.
         */
        getStresses : function(words) {

            var stresses = [], phones, raw = [],
                wordArr = Types.get(words)==A ? words : RiTa.tokenize(words);

            if (!words.length) return stresses;
            
            for (var i=0; i< wordArr.length; i++) {
                
                if (!RiTa.isPunctuation(wordArr[i]))
                    raw[i] = this.getRawPhones(wordArr[i]);
            }

            for (var i = 0; i < raw.length; i++) {

                if (raw[i]) { // ignore undefined array items (eg Punctuation)
                    
                    phones = raw[i].split(SP);
                    for (var j = 0; j < phones.length; j++) {

                        var isStress = (phones[j].indexOf(RiLexicon.STRESSED) > -1) 
                            ? RiLexicon.STRESSED : RiLexicon.UNSTRESSED;
                        
                        if (j > 0) isStress = "/" + isStress;

                        stresses.push(isStress);            
                    }
                }
            }
            
            return stresses.join(" ").replace(/ \//g, "/");

        }.expects([S],[A]).returns(S),
        
        /**
         * Returns the raw dictionary data used to create the default lexicon
         * @returns {object} dictionary mapping words to their pronunciation/pos data
         */
        getLexicalData : function() {
            
            return RiLexicon.data;
            
        }.expects().returns(O),
        
        /**
         * Allows one to set the raw dictionary data used to create the default lexicon.
         * See RiLexicon.addWord() for data format
         * 
         * @param {object} dictionaryDataObject mapping words to their pronunciation/pos data
         * @returns {object} this RiLexicon
         */
        setLexicalData : function(dictionaryDataObject) {

            RiLexicon.data = dictionaryDataObject;
            
            return RiLexicon.data;
            
        }.expects([O]).returns(O),
        
        /**
         * Returns the raw dictionary entry for the given word (isn't necessary in typical usage) 
         * 
         * @param {string} word
         * 
         * @returns {array} a 2-element array of strings, 
         * the first is the stress and syllable data, 
         * the 2nd is the pos data
         * or null if not found
         */
        lookupRaw : function(word) { // PRIVATE?

            if (typeof word != 'string') return null;
            
            word = word.toLowerCase();

            if (RiLexicon.data[word]) return RiLexicon.data[word];
            
            console.warn("[RiTa] No lexicon entry for '" + word + "'");
            
            return null; // if private, should return 'undefined'?
            
        }.expects([S]).returns(A),

        /**
         * @private
         */
        getRawPhones : function(word) {
            
            var data = this.lookupRaw(word);
            return (data && data.length==2) ? data[0] : E; // TODO: verify 
            
        }.expects([S]).returns(S),

        /**
         * @private
         */
        getPosData : function(word) {
            
            var data = this.lookupRaw(word);
            return (data && data.length==2) ? data[1] : E; // TODO: verify
            
        }.expects([S]).returns(S),

        /**
         * @private
         */
        getPosArr : function(word) { // SHOULD BE PRIVATE
            
            var pl = this.getPosData(word);
            
            if (!strOk(pl)) return []; // TODO: verify 
            
            return pl.split(SP);
            
        }.expects([S]).returns(A),

        /**
         * @private
         */
        firstConsonant : function(rawPhones) {

            if (!strOk(rawPhones)) return E; // return null?
            
            var phones = rawPhones.split(RiLexicon.PHONEME_BOUNDARY);
            // var phones = rawPhones.split(PHONEME_BOUNDARY);
            
            if (!isNull(phones)) {
                
                for (var j = 0; j < phones.length; j++) {
                    if (this.isConsonant(phones[j].charAt(0))) // first letter only
                        return phones[j];
                }
            }
            return E; // return null?
            
        }.expects([S]).returns(S),
        
        /**
         * @private
         */
        lastStressedPhoneToEnd : function(word) {

            if (!strOk(word)) return E; // return null?
            
            var idx, c, result;
            var raw = this.getRawPhones(word);

            if (!strOk(raw)) return E; // return null?
            
            idx = raw.lastIndexOf(RiLexicon.STRESSED);
            
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
            
        }.expects([S]).returns(S),

        // TODO: Re-implement
        /**
         * Returns a random word from the lexicon
         * 
         * @param {string} pos (optional)
         * @param {string} syllableCount (optional)
         * @returns {string} random word
         */
        getRandomWord : function(pos, syllableCount) {  // should take pos, syllableCount, neither, or both 
            
            var found = false, a = arguments, wordArr = Object.keys(RiLexicon.data),
                ran = Math.floor(Math.random() * Object.keys(RiLexicon.data).length),
                ranWordArr = shuffle(wordArr);
            
            switch (a.length) {
                    
                case 2: //a[0]=pos  a[1]=syllableCount
                    
                        a[0] = trim(a[0].toUpperCase()); 
                        
                        for(var j = 0; j < PosTagger.TAGS.length; j++) { 
                            
                            if (PosTagger.TAGS[j] == a[0]) found = true;
                        } 
                        
                        if (found) { 
                            
                            for(var i=0; i< ranWordArr.length; i++){
                                
                                var data = this.lookupRaw(ranWordArr[i]);
                                var posTag = RiTa.getPosTags(ranWordArr[i]);
                                
                                if (data[0].split(" ").length == a[1] && a[0] == posTag[0].toUpperCase()) {
                                    return ranWordArr[i];
                                }
                            } 
                        } 
                        
                        return E;
                        
                    break;
                    
                case 1:
                    
                    if (Types.get(a[0]) == 'string') { //pos
                        
                        a[0] = trim(a[0].toUpperCase()); 
                        
                        for(var j = 0; j < PosTagger.TAGS.length; j++) {
                            
                            if (PosTagger.TAGS[j] == a[0]) found = true;
                        } 
                        
                        if (found) { 
                            
                            for(var i=0; i< ranWordArr.length; i++){
                                
                                var posTag = RiTa.getPosTags(ranWordArr[i]);
                                
                                if (a[0] == posTag[0].toUpperCase()) {
                                    return ranWordArr[i];
                                }
                            } 
                        } 
                    }
                    
                    else { //syllableCount    
                        
                        for(var i=0; i< ranWordArr.length; i++) {
                            
                            var data = this.lookupRaw(ranWordArr[i]);
                            
                            if (data[0].split(" ").length == a[0]) {
                                
                                return ranWordArr[i];
                            }
                        } 
                    }
                    
                    break;
                    
                case 0:
                    
                    return wordArr[ran];
            }
            return E;
            
        }.expects([S],[],[N],[S,N]).returns(S)
 
    }
    
    ////////////////////////////////////////////////////////////////
    // RiString
    ////////////////////////////////////////////////////////////////
    
    /**
     * @name RiString
     * 
     * @class The basic text container object, implementing a variety of 
     * additional functionality atop the javascript string object
     */
    RiString = makeClass();
    
    // ////////////////////////////////////////////////////////////
    // Member functions
    // ////////////////////////////////////////////////////////////
    
    RiString.prototype = {
            
        /**
         * The RiString constructor function
         * 
         * @param {string} text string the text it will contain
         */
        constructs : function(text) {
            
            this._text = text;
            
        }.expects([S]),

        /**
         * Tests if this string ends with the specified suffix.
         * 
         * @param {string} substr string the suffix.
         * @returns {boolean} true if the character sequence represented by the argument is a suffix of
         *         the character sequence represented by this object; false otherwise. Note that the
         *         result will be true if the argument is the empty string or is equal to this
         *         RiString object as determined by the equals(Object) method.
         * 
         */
        endsWith : function(substr) {
            
            return endsWith(this._text, substr);
            
        }.expects([S]).returns(B),
             
        /**
         * Compares this RiString to the specified object. The result is true if and only if the
         * argument is not null and is a RiString object that represents the same sequence of
         * characters as this object.
         * 
         * @param {object} riString RiString object to compare this RiString against.
         * @returns {boolean} true if the RiString are equal; false otherwise.
         */
        equals : function(riString) {
            
            return riString._text === this._text;
            
        }.expects([O]).returns(B),

        /**
         * Compares this RiString to another RiString, ignoring case considerations.
         * 
         * @param {string | object} str String or RiString object to compare this RiString against
         * @returns {boolean} true if the argument is not null and the Strings are equal, ignoring
         *         case; false otherwise.
         */
        equalsIgnoreCase : function(str) {
            
            if (typeof str === 'string') {
                
                return str.toLowerCase() === this._text.toLowerCase();
            } 
            else {
                
                return str.text().toLowerCase() === this._text.toLowerCase();
            }
            
        }.expects([S],[O]).returns(B),

        /**
         * Gets/sets the text contained by this object
         * 
         * @param {string} text (optional)
         * 
         * @returns {object | string} the contained text (for sets) or this RiString (for gets)
         */
        text : function(theText) {
            if (theText) {
                this._text = theText;
                return this;
            }
            return this._text;
            
        }.expects([],[S]),

        /**
         * Returns an array of part-of-speech tags, one per word, using RiTa.tokenize() and RiTa.posTag().
         *
         * @returns {array} strings of pos, one per word
         */
        pos : function() {
                   
            var words = RiTa.tokenize((this._text)); // was getPlaintext()
            var tags = PosTagger.tag(words); 
  
            for ( var i = 0, l = tags.length; i < l; i++) {
                if (!strOk(tags[i])) 
                    error("RiString: can't parse pos for:" + words[i]);
            }
        
            return tags;
            
        }.expects().returns(A),

        /**
         * Returns the part-of-speech tag for the word at 'index', using RiTa.tokenize() and RiTa.posTag().
         * 
         * @param {number} index the word index
         * @returns {string} the pos
         */
        posAt : function(index) {
            
            var tags = this.pos();

            if (isNull(tags) || tags.length == 0 || index < 0 || index >= tags.length)
                return E;
            
            return tags[index];
            
        }.expects([N]).returns(S),

        /**
         * Returns the word at 'index', according to RiTa.tokenize()
         * 
         * @param {number} index the word index
         * @returns {string} the word
         */
        wordAt : function(index) {
            
            var words = RiTa.tokenize((this._text));
            if (index < 0 || index >= words.length)
                return E;
            return words[index];
            
        }.expects([N]).returns(S),

        /**
         * Returns the number of words in the object, according to RiTa.tokenize().
         * 
         * @returns {number} number of words
         */
        wordCount : function() {
            
            return this.words().length;
            
        }.expects().returns(N),

        /**
         * Returns the array of words in the object, via a call to RiTa.tokenize().
         * 
         * @returns {array} strings, one per word
         */
        words : function() {
            
            return RiTa.tokenize(this._text);
            
        }.expects().returns(A),

        /**
         * Returns the index within this string of the first occurrence of the specified character.
         * 
         * @param {string} searchstring (Required) or character to search for
         * @param {number} start (Optional) The start position in the string to start the search. If omitted,
         *        the search starts from position 0
         * @returns {number} the first index of the matching pattern or -1 if none are found
         */
        indexOf : function(searchstring, start) {
            
            return this._text.indexOf(searchstring, start);
            
        }.expects([S],[S,N]).returns(N),

        /**
         * Inserts 'newWord' at 'wordIdx' and shifts each subsequent word accordingly.
         *
         * @returns {object} this RiString
         */
        insertWordAt : function(newWord, wordIdx) {
                    
            var words = this.words();
            if (newWord && newWord.length && wordIdx >= 0 && wordIdx < words.length) {
             
                // filthy hack to preserve punctuation in 'newWord'
                words.splice(wordIdx,0, DeLiM+newWord+DeLiM);
                
                this.text(RiTa.joinWords(words).replaceAll(DeLiM,E));
            }

            return this;
            
        }.expects([S,N]).returns(O),

        /**
         * Returns the index within this string of the last occurrence of the specified character.
         * 
         * @param {string} searchstring (Required) The string to search for
         * @param {number} start (Optional) The start position in the string to start the search. If omitted,
         *        the search starts from position 0
         * @returns {number} the last index of the matching pattern or -1 if none are found
         */
        lastIndexOf : function(searchstring, start) {
            
            return this._text.lastIndexOf(searchstring, start);
            
        }.expects([S],[S,N]).returns(N),

        /**
         * Returns the length of this string.
         * 
         * @returns {number} the length
         */
        length : function() {
            
            return this._text.length;
            
        }.expects().returns(N),

        /**
         * Searches for a match between a substring (or regular expression) and the contained
         * string, and _returns the matches
         * 
         * @param {string} regex Regular expression
         * @returns {array} strings matches or empty array if none are found

         */
        match : function(regex) {
            
            return this._text.match(regex);
            
        }.expects([S]).returns(A),
        
        
        /**
         * Extracts a part of a string from this RiString
         * 
         * @param {number} begin (Required) The index where to begin the extraction. First character is at
         *        index 0
         * @param {number} end (Optional) Where to end the extraction. If omitted, slice() selects all
         *        characters from the begin position to the end of the string
         * @returns {object} this RiString
         */
        slice : function(begin, end) {
            
            return this.text(this._text.slice(begin, end));
             
        }.expects([N],[N,N]).returns(O),

        /**
         * Replaces each substring of this string that matches the given regular expression with the
         * given replacement.
         * 
         * @param {string | regex } pattern the pattern to be matched
         * @param {string} replacement the replacement sequence of char values
         * @returns {object} this RiString
         */
        replaceAll : function(pattern, replacement) {
            
            if (pattern && (replacement || replacement==='')) {
                this._text = replaceAll(this._text, pattern, replacement);
            }
            return this;
            
        }.expects([O,S],[S,S]).returns(O),

        /**
         * Replaces the character at 'idx' with 'replaceWith'. If the specified 'idx' is less than
         * zero, or beyond the length of the current text, there will be no effect.
         * 
         * @param {number} idx the character index
         * @param {string} replaceWith the replacement
         * @returns {object} this RiString
         */
        replaceCharAt : function(idx, replaceWith) {
            
            if (idx < 0 || idx >= this.length()) 
                return this;
                
            var s = this.text();
            var beg = s.substring(0, idx);
            var end = s.substring(idx + 1);
            var s2 = null;
            
            if (replaceWith)
                s2 = beg + replaceWith + end;
            else
                s2 = beg + end;

            return this.text(s2);
            
        }.expects([N,S]).returns(O),

        /**
         * Replaces the first instance of 'regex' with 'replaceWith'
         * 
         * @param {string | regex} regex the pattern
         * @param {string} replaceWith the replacement
         * 
         * @returns this RiString
         */
        replaceFirst : function(regex, replaceWith) {
            
            if (!isNull(replaceWith)) 
                this._text = this._text.replace(regex,replaceWith);
            return this;
            
        }.expects([S,S]).returns(O),

        /**
         * Replaces the word at 'wordIdx' with 'newWord'.
         * 
         * @param {number} wordIdx the index
         * @param {string} newWord the word replacement
         * @returns {object} this RiString
         */
        replaceWordAt : function(wordIdx, newWord) {
            
            var words = this.words();
            
            if (/*newWord && */wordIdx >= 0 && wordIdx < words.length) {
                
                words[wordIdx] = newWord;
                
                this.text(RiTa.joinWords(words));
            }
            
            return this;
            
        }.expects([N,S]).returns(O),

        /**
         * Split a RiString into an array of sub-RiString and return the new array.
         * 
         * If an empty string ("") is used as the separator, the string is split between each character.
         * 
         * @param {string} separator (Optional) Specifies the character to use for splitting the string. If
         *        omitted, the entire string will be returned. If an empty string ("") is used as the separator, 
         *        the string is split between each character.
         *        
         * @param {number} limit (Optional) An integer that specifies the number of splits
         * 
         * @returns {array} RiStrings
         */
        split : function(separator, limit) {
            
            var parts = this._text.split(separator, limit);
            var rs = [];
            for ( var i = 0; i < parts.length; i++) {
                if (!isNull(parts[i]))
                    rs.push(new RiString(parts[i]));
            }
            return rs;
            
        }.expects([S],[S,N],[]).returns(A),

        /**
         * Tests if this string starts with the specified prefix.
         * 
         * @param {string} substr string the prefix
         * @returns {boolean} true if the character sequence represented by the argument is a prefix of
         *         the character sequence represented by this string; false otherwise. Note also
         *         that true will be returned if the argument is an empty string or is equal to this
         *         RiString object as determined by the equals() method.
         */
        startsWith : function(substr) {
            
            return this.indexOf(substr) == 0;
            
        }.expects([S]).returns(B),

        /**
         * Extracts the characters from this objects contained string, beginning at 'start' and
         * continuing through the specified number of characters, and sets the current text to be
         * that string. (from Javascript String)
         * 
         * @param {number} start  The index where to start the extraction. First character is at
         *        index 0
         * @param {number} length (optional) The index where to stop the extraction. If omitted, it extracts the
         *        rest of the string
         * @returns {object} this RiString
         */
        substr : function(start, length) {
            
            return this._text(this._text.substr(start, length));
            
        }.expects([N],[N,N]).returns(O),

        /**
         * Extracts the characters from a string, between two specified indices, and sets the
         * current text to be that string. 
         * 
         * @param {number} from  The index where to start the extraction. First character is at
         *        index 0
         * @param {number} to (optional) The index where to stop the extraction. If omitted, it extracts the
         *        rest of the string
         * @returns {object} this RiString
         */
        substring : function(from, to) {

            return this._text(this._text.substring(from, to));
            
        }.expects([N],[N,N]).returns(O),

        /**
         * Converts this object to an array of RiString objects, one per character
         * 
         * @returns {array} RiStrings with each letter as its own RiString element
         */
        toCharArray : function() {
            var parts = this._text.split(E);
            var rs = [];
            for ( var i = 0; i < parts.length; i++) {
                if (!isNull(parts[i]))
                    rs.push(parts[i]);
            }
            return rs;
        }.expects().returns(A),

        /**
         * Converts all of the characters in this RiString to lower case
         * 
         * @returns {object} this RiString
         */
        toLowerCase : function() {
            
            return this.text(this._text.toLowerCase());
            
         }.expects().returns(O),

        /**
         * Returns the contained string object
         * 
         * @returns {string}
         */
        toString : function() {
            
            return "RiString["+this._text+"]";
            
        }.expects().returns(S),

        /**
         * Returns true if and only if this string contains the specified sequence of char values.
         * 
         * @param {string} text text to be checked
         * @returns {boolean}
         */
        containsWord : function(text) {
            
            return this.indexOf(text) > -1;
            
        }.expects([S]).returns(B),

        /**
         * Converts all of the characters in this RiString to upper case
         * 
         * @returns {object} this RiString
         */
        toUpperCase : function() {
            
            return this.text(this._text.toUpperCase());
            
        }.expects().returns(O),

        /**
         * Returns a copy of the string, with leading and trailing whitespace omitted.
         * 
         * @returns {object} this RiString
         */
        trim : function() {
            
            return this.text(trim(this._text));
            
        }.expects().returns(O),

        /**
         * Returns the character at the given 'index', or empty string if none is found
         * 
         * @param {number} index index of the character
         * @returns {string} the character
         */
        charAt : function(index) {
         
            if (index<0 || index>this._text.length-1) return E;

            // should this return a RiString instead?
            return this._text.charAt(index);
            
        }.expects([N]).returns(S),

        /**
         * Concatenates the text from another RiString at the end of this one
         * 
         * @returns {object} this RiString
         */
        concat : function(riString) {
            
            return text(this._text.concat(riString.text()));
            
        }.expects([O]).returns(O),
               
        /**
         * Removes the character at the specified index
         * 
         * @param {number} idx the index
         * @returns {object} this RiString
         */
        removeCharAt : function(idx) { 
            
            return this.text(this._text.substring(0, idx).concat(this._text.substring(idx + 1)));
            
        }.expects([N]).returns(O)

    };
    
    
    // ////////////////////////////////////////////////////////////
    // RiGrammar
    // ////////////////////////////////////////////////////////////

    /**
     * @name RiGrammar
     * @class Implementation of a (probabilistic) context-free grammar (with specific 
     * literary extensions) that performs generation from user-specified grammars.
     */
     /* <pre> 
     * 
        rg = new RiGrammar("mygrammar.g");
        System.out.println(rg.expand());</pre>
     *
     *   
     * RiTa grammar files are JSON text files that follow the format below:
     *  <pre>   myGrammar = {
          &lt;start&gt;
          &lt;rule1&gt; | &lt;rule2&gt; | &lt;rule3&gt;
        }
    
        {
          &lt;rule2&gt;
          terminal1 | 
          terminal2 | &lt;rule1&gt;
          # this is a comment 
        }
        ...</pre>   
     * <b>Primary methods of interest:</b>
     * <ul>
     * <li><code>expand()</code> which simply begins at the &lt;start&gt; state and 
     * generates a string of terminals from the grammar.<p>
     * <li><code>expandFrom(String)</code> which begins with the argument
     * String (which can consist of both non-terminals and terminals,) 
     * and expands from there. Notice that <code>expand()</code> is simply
     * a convenient version of <code>expandFrom("&lt;start&gt;");</code>.<p>
     * <li><code>expandWith(String, String)</code> takes 2 String arguments, the 1st 
     * (a terminal) is guaranteed to be substituted for the 2nd (a non-terminal). Once this 
     * substitution is made, the algorithm then works backwards (up the tree from the leaf)
     * ensuring that the terminal (terminal1) appears in the output string. 
     * For example, with the grammar fragment above, one might call:<p>
       <pre>
            grammar.expandWith(terminal1, "&lt;rule2&gt;");
      </pre>
     * assuring not only that <code>&lt;rule2&gt;</code>will be used at least 
     * once in the generation process, but that when it is, it will be replaced 
     * by the terminal "hello".
     *</ul>
     *
     *<li>A RiGrammar object will assign (by default) equal weights to all choices in a rule. 
     *One can adjust the weights by adding 'multipliers' as follows: (in the rule below,
     * 'terminal1' will be chosen twice as often as the 2 other choices.
     * <pre>   {
         &lt;rule2&gt;
         [2] terminal1 | 
         terminal2 | &lt;rule1&gt; 
       }</pre>
        
     *<li>The RiGrammar object supports callbacks, from your grammar, back into your code.
     * To generate a callback, add the method call in your grammar, surrounded by back-ticks, as follows:
     * <pre>   
     *     {
     *       &lt;rule2&gt;
     *       The cat ran after the `getRhyme("cat");` |
     *       The &lt;noun&gt; ran after the `pluralize(&lt;noun&gt;);` 
     *     }</pre>
     *     
     * Any number of arguments may be passed in a callback, but for each call,
     * there must be a corresponding method in the sketch, e.g.,
     * 
     * <pre>
     *    function pluralize(String s) {
     *      ...
     *    }
     * </pre>
     * 
     * @author dhowe 
     */
    RiGrammar = makeClass();
    
    RiGrammar.START_RULE = "<start>";
    RiGrammar.OPEN_RULE_CHAR = "<";
    RiGrammar.CLOSE_RULE_CHAR = ">";
    RiGrammar.PROB_PATT = /(.*[^\s])\s*\[([0-9.]+)\](.*)/;
    RiGrammar.OR_PATT = /\s*\|\s*/;
    RiGrammar.EXEC_PATT = /`[^`]+`/g;
    RiGrammar.STRIP_TICKS = /`([^`]+)`/g
    
    /**
     * Set/gets the execDisabled flag. Set to true (default=false) 
     * if you don't want to use the exec mechanism for callbacks. Useful if you want
     * to include backticks or method calls as terminals in your grammar.
     * @private 
     */
    RiGrammar.execDisabled = function(disableExec)
    {
        if (arguments.length==1) {
            RiGrammar._execDisabled = disableExec;
        }
        return RiGrammar._execDisabled;
    }

    RiGrammar.prototype = {

        /**
         * Initializes a grammar from an object or JSON string containing the rules
         * 
         * @param  {string | object} grammar containing the grammar rules
         */
        constructs : function(grammar) {
            
            this._rules = {};
            this._execDisabled = false;
            grammar && this.setGrammar(grammar);
            
        }.expects([S],[O],[]),
    
        /**
         * Loads a JSON grammar via AJAX call to 'url', replacing any existing grammar. 
         * @param {string} url of JSON file containing the grammar rules
         * @returns {object} this RiGrammar
         * @private
         */
        load : function(url) {
            
            this.reset();
            
            error("Implement me!");
            
            return this;
            
        }.expects([S]).returns(O),
    
        /**
         * Initializes a grammar from an object or JSON string containing the rules (rather than a file)
         * and replacing any existing grammar. 
         * @param  {string | object} grammar containing the grammar rules
         * @returns {object} this RiGrammar
         */
        setGrammar : function(grammar) {
            
            this.reset();
            
            grammar = (typeof grammar == S) ?  JSON.parse(grammar) : grammar 
            
            for (var rule in grammar) 
                this.addRule(rule, grammar[rule]);
            
            return this;
            
        }.expects([S],[O],[]).returns(O),
        
        /**
         * Returns the current set of rules as an associative array: {names -> definitions}
         * @returns {object} 
         */ 
        getRules : function()  {
            
            return this._rules;
            
        }.expects().returns(O),
        
        
        /**
         * Deletes the named rule from the grammar
         * @returns {object} this RiGrammar
         */ 
        removeRule : function(name)  {
            
            name = this._normalizeRuleName(name);
            delete this._rules[name];
            return this;
            
        }.expects([S]).returns(O),
        
        /**
         * Makes a (deep) copy of this object
         * 
         * @returns {object} this RiGrammar
         */
        clone : function() { // TODO: test me well

          var tmp = RiGrammar();
          for (var name in this._rules) {
              tmp._rules[name] = this._rules[name];
          }
          return tmp;
          
        }.expects().returns(O),

        
        /**
         * Adds a rule to the existing grammar, replacing any existing rule with the same name 
         * @param {string} name
         * @param {string} ruleStr
         * @param {number} weight
         * @returns {object} this RiGrammar
         */
        addRule : function(name, ruleStr, weight) 
        {
            var dbug = false;
    
            weight = (isNull(weight) ? 1.0 : weight); // default

            name = this._normalizeRuleName(name);

            if (dbug) log("addRule: "+name+ " -> "+ruleStr+" ["+weight+"]");
            
            var ruleset = ruleStr.split(RiGrammar.OR_PATT);
            //ruleset = "<noun-phrase> <verb-phrase>";
    
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
                    
                    // log("new rule");
                    var temp2 = {};
                    temp2[rule] = prob;
                    this._rules[name] = temp2;
                    if (dbug)log("added rule: "+name);
                }
            }
            return this;
            
        }.expects([S,S],[S,S,N]).returns(O),
      
        /**
         * Clears all rules in the current grammar
         * @returns {object} this RiGrammar
         */
        reset : function() {
            
           this._rules = {};
           return this;
           
        }.expects().returns(O),
              
        /**
         * @param {string} pre name
         */
        getRule : function(pre) {
            
            pre = this._normalizeRuleName(pre);
       
            // log("getRule("+pre+")");
            var tmp = this._rules[pre];
            var name, cnt = 0;
            
            for (name in tmp) cnt++; // count the matching rules
            
            if (cnt == 1) {
                //log("1returning: "+name+" / "+typeof name);
                return name;
            } 
            else if (cnt > 1) {
                
                var sr = this._getStochasticRule(tmp);
                //log("2returning: "+sr+" / "+typeof sr);
                return sr;
            }
            else {
                error("No rule found for: "+pre);
            }
            
        }.expects([S]).returns(S),
        
        /**
         * Prints the grammar rules to the console in human-readable format (useful for debugging) 
         * @returns {object} this RiGrammar
         */
        print : function() {
            
            if (console) {
                console.log("Grammar----------------");
                for ( var name in this._rules) {
                    
                    console.log("  '" + name + "' -> ");
                    var choices = this._rules[name];
                    for ( var p in choices) {
                        console.log("    '" + p + "' [" + choices[p] + "]");
                    }
                }
                console.log("-----------------------");
            }
            return this;
            
        }.expects().returns(O),
        
        hasRule : function(name) {
            
            //log("hasRule("+name+")");
            name = this._normalizeRuleName(name);
            return (typeof this._rules[name] !== 'undefined');
            
        }.expects([S]).returns(B),
        
        /**
         * Expands a grammar from its '<start>' symbol
         * @returns {string}
         */
        expand : function() {
            
            return this.expandFrom(RiGrammar.START_RULE);
            
        }.expects().returns(S),
        
        /**
         * Expands the grammar after replacing an instance of the non-terminal
         * 'symbol' with the String in 'literal'.
         * <P>
         * Guarantees that 'literal' will be in the final expanded String, 
         * assuming at least one instance of 'symbol' in the Grammar.
         * @param literal
         * @param symbol
         * 
         * @returns {string} expanded text
         */
        expandWith : function(literal, symbol) { // TODO: finish 
            
            //throw Error("oops, caught in-between versions");
            
            var gr = this.clone();
            
            var match = false;
            for ( var name in gr._rules) {
                if (name===symbol) {
                    var obj = {};
                    obj[literal] = 1.0;
                    gr._rules[name] = obj;
                    match = true;
                }
            }
            if (!match) 
                throw Error("Rule '"+symbol+"' not found in grammar");

            // TODO: tmp, awful hack, write this correctly
            var tries, maxTries = 500;
            for (tries = 0 ;tries < maxTries; tries++) {
                var s = gr.expand();
                if (s.indexOf(literal)>-1)
                    return s;
            }
            throw Error("\n[WARN] RiGrammar failed to complete after "+tries+" tries\n");
            
        }.expects([S,S]).returns(S),
        
        /**
         * @param input
         * @returns this
         * @private 
         */
        handleExec : function(input) { // TODO: private
                       
            if (!input || !input.length) return E;
            
            // strip backticks and eval
            var exec = input.replace(RiGrammar.STRIP_TICKS, "$1");
            
            try {
                //log("handleExec: "+exec);
                input = eval(exec);
            }
            catch (e) {
                warn("Error evaluating: "+input+" ignoring backticks\n  "+e.message);
            }
            return input;
        },
        
        /**
         * Expands the grammar, starting from the given symbol.
         * RiGrammar.expand() is equivalent to RiGrammar.expandFrom('').
         * 
         * @param {string} rule
         * @returns {string}
         * 
         */
        expandFrom : function(rule) {
            
            if (!this.hasRule(rule)) {
                warn("Rule not found: " + rule + "\nRules: ");
                (!RiTa.SILENT) && this.print();
            }
    
            var iterations = 0;
            var maxIterations = 1000;
            while (++iterations < maxIterations) {
                
                //log("expand: '"+rule +"'");
                var next = this.__expandRule(rule);
                if (!next) {

                    //  we're done, check for back-ticked strings to eval?

                    (!this._execDisabled) && (rule=rule.replace(RiGrammar.EXEC_PATT, this.handleExec));                  
                                        
                    break;
                }
                rule = next;
            }
    
            if (iterations >= maxIterations)
                warn("max number of iterations reached: " + maxIterations);
    
            return rule;
            
        }.expects([S]).returns(S),
            
        // Privates (can we hide these?) ----------------

        __expandRule : function(prod) { //private
            
            var dbug = false;
            if (dbug) log("__expandRule(" + prod + ")");
            
            for ( var name in this._rules) {
                
                var entry = this._rules[name];
                if (dbug) log("  name=" + name+"  entry=" + entry+"  prod=" + prod+"  idx=" + idx);
                var idx = prod.indexOf(name);
                
                if (idx >= 0) {
                    
                    var pre = prod.substring(0, idx);
                    var expanded = this.getRule(name);
                    var post = prod.substring(idx + name.length);
                    
                    if (dbug) log("  pre=" + pre+"  expanded=" + expanded+"  post=" + post+"  result=" + pre + expanded + post);
                    
                    return (pre + expanded + post);
                }
                
                // do the exec check here, in while loop()
            }
            // what happens if we get here? no expansions left, return?
        },
        
        _normalizeRuleName : function(pre) {
            
            if (!strOk(pre)) return pre;
            
            if (!startsWith(pre, RiGrammar.OPEN_RULE_CHAR))
                pre = RiGrammar.OPEN_RULE_CHAR + pre;
            
            if (!endsWith(pre,RiGrammar.CLOSE_RULE_CHAR))
                pre += RiGrammar.CLOSE_RULE_CHAR;

            if (pre.indexOf('>>')>0) throw Error(">>");
            
            return pre;
            
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
        
    
    }; // end RiGrammar
    

    var Easing = {
    
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
    
    //////////////////////////////////////////////////////////////////////
    ////////// RiText   
    ////////////////////////////////////////////////////////////////////// 
    
    /**
     * @name RiText
     * 
     * @class RiTa's text display object. Wraps an instance of RiString to provide utility
     * methods for typography, text effects, animation, etc. Uses either the native canvas 
     * renderer or the Processing renderer (when included)
     * 
     * @property {number} x The x position
     * @property {number} y The y position
     */    
    RiText = makeClass();
        
    //////////////////////////////////////////////////////////////////////
    //////// RiText statics
    ////////////////////////////////////////////////////////////////////// 
    
    /**
     * @private Static container for properties related to the update/render loop 
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
        timeSinceLastFPS : Date.now()
    }

    /**
     * Starts a timer that calls 'onRiTaEvent' or the specified callback every 'period'
     * seconds
     * 
     * @param {number} period
     * @param {function} callback called every 'period' seconds
     * @returns {number} the unique id for the timer
     */
    RiText.timer = function(period, callback) {

        return RiTa.timer.apply(this,arguments);
    }, 
    
    /**
     * Immediately stops the current animation loop and clears 
     * @returns {number} the number of frames that have happened
     * 
     * @private
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
     * @param {function} callback the animation callback (optional, default=60)
     * @param {number} fps the target framesPerSecond (optional, default='draw')
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
                    var type = Types.get(a[0]);
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
                    
                    var type = Types.get(a[0]);
                    if (type == 'function') {
                        callback = a[0];
                    }
                    type = Types.get(a[1])
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
     * @returns {number} width
     */
    RiText.width = function() { return RiText.renderer.__width(); };
     

    /**
     * Convenience method to get the height of the current drawing surface
     * @returns {number} height
     */
    RiText.height = function() { return RiText.renderer.__height(); };
 
    /**
     * Convenience method to draw a crisp line on the drawing surface
     * @param {number} x1
     * @param {number} y1
     * @param {number} x2
     * @param {number} y2
     * @param {number} lineWidth (optional: default=1)
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
     * @param {number} w width
     * @param {number} h height
     */
    RiText.size = function(w,h/*renderer*/) {
        
        RiText.renderer.__size(w,h/*renderer*/);
    }
    
    /**
     * Returns the current graphics context, either a canvas 2d'-context or ProcessingJS instance 
     * @returns {object}
     */
    RiText.graphics = function() {
        
        return RiText.renderer.__getGraphics();
    }
    
    /**
     * Returns a random color in which the 3 values for rgb (or rgba if 'includeAlpha' is true), 
     * are between min and max 
     * 
     * @param {number} min value
     * @param {number} max value
     * @param {boolean} includeAlpha true if includes alpha
     * @returns {array} numbers - [r,g,b] or [r,g,b,a]
     */
    RiText.randomColor = function(min,max,includeAlpha) {
        
        min = min || 0, max = max || 256;
        var col = [RiText.random(min,max),RiText.random(min,max),RiText.random(min,max)];
        if (includeAlpha) col.push(RiText.random(min,max));
        return col;
    }
    
    /**
     * Returns a random number between 'min' (default 0) and 'max
     * @retruns {number}
     */
    RiText.random = function() {
        
        return RiTa.random.apply(this,arguments);
    }
    
    /**
     * Convenience method to fill drawing surface background with specified color
     * @param {number} r
     * @param {number} g
     * @param {number} b
     * @param {number} a
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
     * @param {MouseEvent} e mouseEvent
     * @returns {object} mouse position with x,y properties
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
     * 
     * @example
     *   var rts = RiText.getPicked(mx, my);
     *   if (rts.length) {
     *      rts[0].doSomething();
     *   }
     *
     *
     * @param {number} x
     * @param {number} y
     * 
     * @returns {array} RiText[] 1 or more RiTexts containing
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
        
        if (arguments.length==1) {
            if (Types.get(toDelete) === 'array')
                disposeArray(toDelete);
            else if (Types.get(toDelete) === 'object')
                disposeOne(toDelete);

            else
                throw Error("Unexpected type: "+toDelete);
        }
    }
    
    RiText.disposeAll = function() {
        
        for ( var i = 0; i < RiText.instances.length; i++) {

            if (RiText.instances[i]) {
                
                delete(RiText.instances[i]._rs);
                delete(RiText.instances[i]);
            }
        }
        RiText.instances = [];
    };
    
    // TODO: if txt is an array, maintain line breaks... ? 
    // TODO: other alignments?
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
        
        // helpers functions //////////////////////////////////////// ?
        
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

        theFont = theFont || RiText._getDefaultFont();
        
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

        if (!strLines.length) error('Unexpected fail in createLines: no lines');
        
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
    /**@private*/
    RiText.createLinesByCharCount = function(txt, startX, startY, maxCharsPerLine, fontObj) {

        //log("RiText.createLinesByCharCount("+txt+", "+startX+","+startY+", "+maxCharsPerLine+", "+fontObj+")");

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
    
    /**
     * 
     * @param motionType
     * @returns
     * @private
     */
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

        return _createRiTexts(txt, x, y, w, h, fontObj, RiText.prototype.splitWords);
    };

    RiText.createLetters = function(txt, x, y, w, h, fontObj) {

        return _createRiTexts(txt, x, y, w, h, fontObj, RiText.prototype.splitLetters);
    };

    /**
     * @private
     */
    _createRiTexts = function(txt, x, y, w, h, fontObj, splitFun) // private 
    {
        if (!txt || !txt.length) return [];
        fontObj = fontObj || RiText._getDefaultFont();

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
     * @param {array} theFunction defaults to all riText if an array is not supplied (optional, default=all)
     */
    RiText.foreach = function(theFunction) {
        
        if (arguments.length == 1 && Types.get(array) === 'array') { 
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
     * @param {array} array draws only the array if supplied (optional)
     * 
     * @private
     */
    RiText.drawAll = function(array) {
        
        if (arguments.length == 1 && Types.get(array) === 'array') { 
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
    };
    
    // TODO: test this font default across all platforms and browsers
    
    RiText._getDefaultFont = function() { // make private??
        
        //log("RiText._getDefaultFont: "+RiText.defaults.fontFamily+","+RiText.defaults.font.size);
        
        RiText.defaults.font = RiText.defaults.font || 
            RiText.renderer.__createFont(RiText.defaults.fontFamily, 
                RiText.defaults.fontSize, RiText.defaults.fontLeading);
        
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
    
    /**
     * A set of static defaults to be shared by RiText objects
     * Can be modified directly or through API methods.
     * 
     * @example 
     *  RiText.defaultAlignment(RiText.RIGHT);
     *  RiText.defaultColor(0);
     * 
     * @example 
     *  RiText.defaults.alignment = RiText.RIGHT;

     * @property {object} defaults
     */
    RiText.defaults = { 
        
        color : { r : 0, g : 0, b : 0, a : 255 }, scaleX:1, scaleY:1,
        alignment : RiText.LEFT, motionType : RiText.LINEAR, rotateZ:0, font:null,
        paragraphLeading :  0, paragraphIndent: '    ', indentFirstParagraph: false,
        fontFamily: 'Times New Roman', fontSize: 14, fontLeading : 16, leadingFactor : 1.1,
        boundingBoxStroke : null, boundingBoxFill: null, boundingBoxVisible : false
    };

    RiText.prototype = {

        constructs : function(text, x, y, font) { 
            
            if (!RiText.renderer) 
                throw Error("No graphics context, RiText unavailable");

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
            this._scaleZ = 1;
     
            this._behaviors = [];
            this.font(font);
            this.text(text);
            
            this.g = RiText.renderer;

            //log('RiText) '+this._rs._text +" / "+ this._font.name);

            this.x = arguments.length>1 ? x : this.g.__width() / 2 - this.textWidth() / 2.0;
            this.y = arguments.length>1 ? y : this.g.__height() / 2;
    
            RiText.instances.push(this);
            
            return this;
        },
        
        draw : function() {
          this.update();
          this.render();   
          if (this.fadeToTextCopy)
              this.fadeToTextCopy.draw();
        },
        
        /**
         * @private
         */
        update : function() {
            
            var time = Date.now();
            this._updateBehaviors(time);

        },
//
//        updateMousePosition : function(curElement, event) {
//            var offset = calculateOffset(window, event);
//            p.mouseX = event.pageX - offset.X;
//            p.mouseY = event.pageY - offset.Y
//        },
        
        /**@private*/
        render : function() {
            
            var g = this.g;
            
            if (!g) throw Error('no-renderer');
            
            g.__pushState();
            
            if (this._rs && this._rs.length) {
            
                g.__pushState();
                
                // order: scale, center-point-trans, rotate,-center-point-trans,translate?
                
                g.__rotate(this._rotateZ);
                g.__translate(this.x, this.y);
                g.__scale(this._scaleX, this._scaleY, this._scaleZ); 
             
                // Set color
                g.__fill(this._color.r, this._color.g, this._color.b, this._color.a);
      
                // Set font params
                g.__textFont(this._font);
                g.__textAlign(this._alignment);
        
                // Draw text
                g.__text(this._rs._text, 0, 0);
        
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
        
        ///////////////////////////////// Text Behaviors ////////////////////////////////////
    
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
         * @param {number} motionType
         * @returns {number} motionType
         */
        motionType : function (motionType) {
            if (arguments.length) {
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
         * @param {number} seconds start Time
         *          time in future to start
         * @param {number} delay seconds
         *          time for fade
         * @param {function} callback 
         * 
         * @returns {number} the unique id for this behavior
         */
        fadeIn : function(seconds, delay, callback) {
            
            return this.colorTo([this._color.r, this._color.g, this._color.b, 255],
                seconds, delay, null, 'fadeIn', false);
        },
    
        /**
         * Fades out current text over <code>seconds</code> starting at
         * <code>startTime</code>. Interpolates from the current color {r,g,b,a} 
         * to {r,g,b,0}.
         *
         * @param {number} seconds
         *          time for fade
         * @param {number} delay 
         *          (optional, default=0),  # of seconds in the future that the fade will start 
         *          
         * @param {function} callback the callback to be invoked when the behavior has completed (optional: default=onRiTaEvent(e)
         * 
         * @param {boolean} destroyOnComplete
         *          (optional, default=false), destroys the object when the behavior completes
         * @returns {number} the unique id for this behavior
         */
        fadeOut : function(seconds, delay, callback, destroyOnComplete) {
    
            destroyOnComplete = destroyOnComplete || false;
            return this.colorTo([this._color.r, this._color.g, this._color.b, 0], 
                seconds, delay, null, 'fadeOut', destroyOnComplete);
        },
    
        // DH: omitting last 2 args from docs as they are private 
        /**
         * Transitions to 'color' (rgba) over 'seconds' starting at 'delay' seconds in the future
         * 
         * @param {array} colors (length 1-4)  r,g,b,a (0-255)
         * @param {number} seconds delay 
         *          (optional, default=0),  # of seconds in the future that the fade will start 
         * @param {number} delay seconds
         *          time for fade
         * @param {function} callback the callback to be invoked when the behavior has completed (optional: default=onRiTaEvent(e)
         * @returns {number} the unique id for this behavior
         */
        colorTo : function(colors, seconds, delay, callback, type, destroyOnComplete) {             

            if (Types.get(colors) != 'array') 
                throw Error('arg#1 to colorTo() must be an array');
            
            //log(colors[0], g: colors[1], b: colors[2], a: colors[3], seconds);

            delay = delay || 0;
            seconds = seconds || 1.0;
            type = type || 'colorTo';            
            colors = parseColor.apply(this, colors);

            var rt = this, id = setTimeout(function() {

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
            
            return id;
        },
        
        /**
         * Scales to 'theScale' over 'seconds' starting at 'delay' seconds in the future
         * 
         * @param {number} theScale delay 
         *          (optional, default=0),  # of seconds in the future that the fade will start       
         * @param {number} seconds
         *          time for fade
         * @param {number} delay seconds
         *          time for fade
         * @param {function} callback the callback to be invoked when the behavior has completed (optional: default=onRiTaEvent(e)
         * 
         * @returns {number} the unique id for this behavior
         */
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
                           RiTaEvent(rt, 'scaleToComplete').fire(callback);                    
                    });
            
                tb.start();
                
            }, delay*1000);
                
            return id;
        },
        
        /**
         * Rotates to 'radians' over 'seconds' starting at 'delay' seconds in the future
         * 
         * @param {number} angleInRadians
         * @param {number} delay 
         *          (optional, default=0),  # of seconds in the future that the fade will start       
         * @param {number} seconds
         *          time for fade  
         * @param {function} callback the callback to be invoked when the behavior has completed (optional: default=onRiTaEvent(e)
         * 
         * @returns {number} the unique id for this behavior
         */
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
                           RiTaEvent(rt, 'rotateToComplete').fire(callback);                    
                    });
            
                tb.start();
                
            }, delay*1000);
                
            return id;
        },
        
        /**
         * Fades out the current text and fades in the <code>newText</code> over
         * <code>seconds</code> starting at 'startTime' seconds in the future
         * 
         * @param {string} newText
         *          to be faded in
         * @param {number} seconds
         *          time for fade
         * @param {number} endAlpha 
         *  (optional, default=255), the alpha to end on
         * @param {function} callback the callback to be invoked when the behavior has completed (optional: default=onRiTaEvent(e)
         * 
         * @returns {number} - the unique id for this behavior
         */
        textTo: function(newText, seconds, endAlpha, callback) {
            
          // grab the alphas if needed
          var c = this._color, startAlpha = 0, endAlpha = endAlpha || 255; // this._color.a
          
          if (this.fadeToTextCopy) 
          {
            startAlpha = this.fadeToTextCopy.alpha();
            RiText.dispose(this.fadeToTextCopy); // stop any currents
          }
        
          // use the copy to fade out
          this.fadeToTextCopy = this.clone().fadeOut(seconds, 0, true);
          RiText.dispose(this.fadeToTextCopy.fadeToTextCopy); // avoid turtles
          
          // and use 'this' to fade in
          this.text(newText).alpha(startAlpha);
          
          return this.colorTo([c.r, c.g, c.b, endAlpha], seconds * .95, 0, 'textTo');
        },
       
        /**
         * Move to new x,y position over 'seconds'
         * <p>
         * Note: uses the current <code>motionType</code> for this object, starting at 'delay' seconds in the future
         * 
         * @param {number} newX
         * @param {number} newY
         * @param {number} seconds
         * @param {number} delay
         * @param {function} callback the callback to be invoked when the behavior has completed (optional: default=onRiTaEvent(e)
         * 
         * @returns {number} the unique id for this behavior
         */
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
                            RiTaEvent(rt, 'moveToCompleted').fire(callback);                    
                        })
                    .start();
                
            }, delay*1000);
            
            return id;
        },
        
        ////////////////////////////////////////////////////////////////////////////////////////
        
        /**
         * Set/gets the text for this RiText
         * 
         * @param {string} txt the new text (optional)
         * @returns {object | number} this RiText (for sets) or the current text (for gets)
         * 
         * @private
         */
        text : function(txt) {
            
            if (arguments.length == 1) {
                
                var theType = Types.get(txt);
                
                if (theType == 'number') {
                    txt = String.fromCharCode(txt);
                }
                else if (theType == 'object' && typeof txt.text == 'function') { 
                    txt = txt.text();
                }
                this._rs = (this._rs) ? this._rs.text(txt) : new RiString(txt);
                
                if (!this._rs) throw Error("no rs!! "+txt); // TODO:remove
     
                return this;
            }
            
            return this._rs._text;
        },
        
        /**
         * Returns the distance between the center points of this and another RiText
         * @returns {number} riText the distance
         */
        distanceTo : function(riText)
        {
          var p1 = this.center(), p2 = riText.center();
          return RiTa.distance( p1.x,  p1.y,  p2.x,  p2.y);
        },
      
        /**
         * Returns the center point of this RiText as derived from its bounding box
         * @returns {object} { x, y }
         * @private
         */
        center : function() {
            
            var bb = boundingBox();
            return { x: bb.x+bb.width/2, y: bb.y - bb.height/2 };
        },
        
        /**
         * Splits the object into an array of RiTexts, one per word
         * tokenized with the supplied regex.
         * 
         * @param {regex | string} to split
         * @returns {array} RiTexts
         */
        splitWords : function(regex) {
            
            regex = regex || ' ';
            
            (typeof regex == 'string') && (regex = new RegExp(regex));  
            
            var l = [];
            var txt = this._rs._text;
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
         * @returns {array} RiTexts
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
         * @param {number} mx
         * @param {number} my
         * @returns {boolean}
         */
        contains : function(mx, my) {
                        
           var bb = this.g.__getBoundingBox(this);
           
//           // TODO: need to test this with point
//           if (!my && Types.get(mx.x) == 'Number' && Types.get(mx.y) == 'Number') {
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
         * @returns {object} RiText
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
         * @param {object} align (optional) the alignment 
         * @returns {object} this RiText (set) or the current font (get)
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
         * @param {object} font (optional) containing the font data OR
         * @param {string} font containing the font name AND
         * @param {number} size (optional) containing the font size 
         * @returns {object} this RiText (set) or the current font (get)
         */
        font : function(font,size) {
            
            var a = arguments;
            
            if (a.length == 1) {

                this._font = font || RiText._getDefaultFont();
                this._font.size = this._font.size || RiText.defaults.fontSize;
                this._font.leading = this._font.leading || this._font.size * RiText.defaults.leadingFactor;
                return this;
            }
            else if (a.length == 2) {
                
                return this.font( RiText.createFont(a[0], a[1]) );
            }

            return this._font;
        },    
        

        /**
         * Set/gets the boundingbox visibility for this RiText
         * 
         * @param {boolean} trueOrFalse (optional) true or false 
         * @returns {object | boolean}this RiText (set) or the current boolean value (get)
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
         * @param {number | array} cr takes 1-4 number values for rgba, or an array of size 1-4
         * @param {number} cg
         * @param {number} cb
         * @param {number} ca
         * 
         * @returns {object} either this RiText (for sets) or the current color object (for gets)
         */
        color : function(cr, cg, cb, ca) {
            
            if (arguments.length == 0) 
                return this._color;
            this._color = parseColor.apply(this, arguments);
            return this;
        },
    
        /**
         * Returns false if the alpha value of this object is <= 0, else true if the objects is not hidden
         * @returns {boolean} 
         */
        visible : function() {  // isVisible?
            if (arguments.length)
                 throw Error('visible() takes no arguments');
            return this._color.a > 0;
        },
        
        /**
         * Set/gets the alpha (transparency) for this RiText
         * 
         * @private
         * 
         * @param {number} a (optional) input (0-255) 
         * @returns {object | number} either this RiText (for set) or the current alpha value (for get)
         */
        alpha : function(a) {
            if (arguments.length==1) {
                this._color.a = a;
                return this;
            }
            else return this._color.a;
        },
    
        /**
         * Set/gets the position for this RiText
         * 
         * @param {number} x (optional) X coordinate
         * @param {number} y (optional) Y coordinate
         * 
         * @returns {object} either this RiText (for sets) or object {x, y} (for gets)
         */
        position : function(x,y) {
            if (!arguments.length) 
                return { x: this.x, y: this.y };
            this.x = x;
            this.y = y;
            return this;
        },
     
        /**
         * Sets/gets the 2d rotation for this RiText
         * 
         * @param {number} rotate degree to rotate
         * 
         * @returns {object | number} either this RiText (for sets) or the current degree to rotation (for gets)
         */
        rotate : function(rotate) {
          if (!arguments.length) 
              return this._rotateZ
          this._rotateZ = rotate;
          return this;
        },
    
        /**
         * Sets/gets the scale factor for this RiText (takes 0-2 arguments) 
         * 
         * @param {number} theScaleX the ScaleX ratio
         * @param {number} theScaleY (optional) the ScaleY ratio 
         * 
         @returns {object | number} either this RiText (for sets) or the current degree of rotation (for gets)
         */
        scale : function(theScaleX, theScaleY) {
            
            if (!arguments.length) return { x:this._scaleX, y:this._scaleY };
                
            if (arguments.length == 1) theScaleY = theScaleX;
            
            this._scaleX = theScaleX;
            this._scaleY = theScaleY;
            
            return this;
        },
    
        /**
         * Returns the pixel x-offset for the character at 'charIdx'
         * 
         * @param {number} charIdx
         * @returns {number} the pixel x-offset
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
         * @param {number} wordIdx
         * @returns {number} the pixel x-offset
         */
        wordOffset : function(wordIdx) { 
            var words =  this.text().split(' ');
            return wordOffsetFor(this, words, wordIdx);
        },

        /**
         * Returns the bounding box for the current text.
         * @returns {object} x,y,width,height 
         */
        boundingBox : function() {
          var bb = this.g.__getBoundingBox(this);
//          if (0 && transformed) { // tmp: do with matrix
//              bb.x += this.x;
//              bb.y += this.y;
//              bb.width *= this._scaleX;
//              bb.height *= this._scaleY;
//          }
//          * @param {boolean} (optional, default=false) 
//          *   if true, bounding box is first transformed (rotate,translate,scale) 
//          * according to the RiTexts current matrix
          return bb;
        },
        
        /**
         * Returns the current width of the text (derived from the bounding box)
         * @returns {number} the width of the text
         */
        //@param {boolean} (optional, default=false) if true, width is first scaled
        textWidth : function() { 
            
            return this.g.__textWidth(this._font,this._rs._text);
        },
        
        /**
         * Returns the current height of the text (derived from the bounding box)
         * @returns {number} the current height of the text
         */
        // * @param {boolean} (optional, default=false) if true, height is first scaled
        textHeight : function() { 
            
            return this.g.__textHeight(this);
        },
        
        /**
         * Sets/gets the size of the current font. Note: this method only
         * effects only scaleX/Y, not the font's internal properties 
         * 
         * TODO: what to do if scaleX and scaleY are different
         * 
         * @param {number} sz (optional) font size 
         * 
         * @returns {object | number} either this RiText (for set) or the current font size (for get)
         */
        fontSize : function(sz) {
 
            return (arguments.length) ? this.scale( sz / this._font.size) 
                : (this._font.size * this._scaleX);
        },
        
        /**
         * Returns the ascent of the current font 
         * @returns {number} the ascent of the current font
         */
        textAscent : function() { 
            
            return this.g.__textAscent(this);
        },
        
        /**
         * Returns the descent of the current font 
         * @returns {number} the descent of the current font 
         */
        textDescent : function() { 
            
            return this.g.__textDescent(this);
        },
    
        /**
         * Removes the character at the specified index
         * 
         * @param {number} ind the index
         * @returns {object} RiText
         * @private
         */
        removeCharAt : function(ind) { 
            
            this._rs.removeCharAt(ind);
            return this;
            
        },
        
        /*
         * Returns all existing text behaviors for the object  
         * @returns {array} 
        behaviors: function () {

            return this._behaviors;

        },*/
        
        
        /**
         * Adds a new text behaviors to the object  
         * @returns {array} 
         */
        _addBehavior: function ( behavior ) {

            this._behaviors.push( behavior );

        },
        
        /**
         * Removes the text behaviors for the object  
         * @param {string} the behaviors
         */
        _removeBehavior: function ( behavior ) {

            var i = this._behaviors.indexOf(behavior);

            if ( i !== -1 ) {

                this._behaviors.splice( i, 1 );

            }

        },
        
        /**
         * Removes all text behaviors for the object  
         * @returns {array} 
         */
        _removeBehaviors: function () {

            this._behaviors = [];

        },
        
        // TODO: make PRIVATE
        /**
         * Updates existing text behaviors for the object 
         * @param {string} the behaviors
         */
        _updateBehaviors: function (time) {

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
        },
        
        /** @private */
        toString : function() {
            
            var s =  (this._rs && this._rs._text) || 'undefined';
            return '['+Math.round(this.x)+","+Math.round(this.y)+",'"+s+"']";
        }
    };

    // ////////////////////////////////////////////////////////////
    // RiTa object (singleton)
    // ////////////////////////////////////////////////////////////
    
    /**
     * @namespace A collection of static variables and functions for the RiTa library
     */
    RiTa = {

        // RiTa constants =================================
        
        /** The current version of the RiTa tools */

        VERSION : '1.14a',
        
        /** @private */
        P5_COMPATIBLE : true,

        // For Conjugator =================================
        
        //TODO: add comments
        
        FIRST_PERSON : 0,

        SECOND_PERSON : 1,

        THIRD_PERSON : 2,

        PAST_TENSE : 3,

        PRESENT_TENSE : 4,

        FUTURE_TENSE : 5,

        SINGULAR : 6,

        PLURAL : 7,

        NORMAL : 0,

        /** The infinitive verb form  - 'to eat an apple' */
        INFINITIVE : 1,

        /** Gerund form of a verb  - 'eating an apple' */
        GERUND : 2,

        /** The imperative verb form - 'eat an apple!' */
        IMPERATIVE : 3,

        /** Bare infinitive verb form - 'eat an apple' */
        BARE_INFINITIVE : 4,

        /** The subjunctive verb form */

        SUBJUNCTIVE : 5,
        
        ABBREVIATIONS : [   "Adm." ,"Capt." ,"Cmdr." ,"Col." ,"Dr." ,"Gen." ,"Gov." ,"Lt." ,"Maj." ,"Messrs." ,"Mr.","Mrs." ,"Ms." ,"Prof." ,"Rep." ,"Reps." ,"Rev." ,"Sen." ,"Sens." ,"Sgt." ,"Sr." ,"St.","a.k.a." ,"c.f." ,"i.e." ,"e.g." ,"vs." ,"v.", "Jan." ,"Feb." ,"Mar." ,"Apr." ,"Mar." ,"Jun." ,"Jul." ,"Aug." ,"Sept." ,"Oct." ,"Nov." ,"Dec." ],
            
        /** Set to true to disable all console output */
        SILENT : false,
        
        // Start Methods =================================
        
        /**
         * Joins array of word, similar to words.join(" "), but attempts to preserve punctuation position
         * unless the 'adjustPunctuationSpacing' flag is set to false
         * 
         * @param {array} arr the array to join
         * @param {string} delim the characters to place between each array element
         * @param {boolean} adjustPunctuationSpacing (optional, default=true)
         * 
         * @returns {string} the joined array as string
         */
         joinWords: function(arr, delim, adjustPunctuationSpacing) {
             
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
                return newStr;
            }
            
            return arr.join(delim);  
        },
        
        /**
         * Returns a random number between min(default=0) and max(default=1)
         * @returns {number}
         */
        random: function() {
            
            var currentRandom = Math.random();
            if (arguments.length === 0) return currentRandom;
            if (arguments.length === 1) return currentRandom * arguments[0];
            var aMin = arguments[0], aMax = arguments[1];
            
            return currentRandom * (aMax - aMin) + aMin;
            
        }.expects([],[N],[N,N]).returns(N),
        
        /**
         * Convenience method to get the distance between 2 points
         * @param {number} x1
         * @param {number} y1
         * @param {number} x2
         * @param {number} y2
         * 
         * @returns {number}
         */
        distance: function(x1,y1,x2,y2) {
            
            var dx = x1 - x2, dy = y1 - y2;
            return Math.sqrt(dx * dx + dy * dy);
            
        }.expects([N,N,N,N]).returns(N),
        
        
        /**
         * Starts a timer that calls 'onRiTaEvent', or the specified callback, every 'period'
         * seconds
         * 
         * @param {number} period
         * @param {function} callback called every 'period' seconds
         * @returns {number} the unique id for the timer
         */
        timer: function(period, callback) {
            
            var id = setInterval(function(){
                
                RiTaEvent(RiTa, 'tick').fire(callback);  
                
            }, period * 1000);
            
            return id;
        }, 
        
        /**  
         * Returns true  for 'word' is any variant of a verb in the PENN part-of-speech tag set (e.g. vb, vbg, vbd, vbp, vbz));
         * @param {string} word the PENN part-of-speech tag
         * @returns {boolean} true if the tag is any variant of a verb 
         */
        isVerb: function(word) {

            if (word && word.indexOf(" ") != -1) error("Only accepts a single word"); // TODO: add test
            
            //return RiTa.tagForWordNet(word) === 'v' ;

             var pos = RiTa.getPosTags(word);
             return PosTagger.isVerb(pos.toString());

        }.expects([S]).returns(B),
        
        /**
         * Returns true if the tag for 'word' is any variant of a noun in the PENN part-of-speech tag set (e.g. nn, nns, nnp, nnps)
         * @param {string} word the PENN part-of-speech tag
         * @returns {boolean} true if the tag is any variant of a noun 
         */
        isNoun : function(word) {

            if (word && word.indexOf(" ") != -1) error("Only accepts a single word"); // TODO: add test
          
            //return RiTa.tagForWordNet(word) === 'n' ;
            
            var pos = RiTa.getPosTags(word);
            return PosTagger.isNoun(pos.toString());

        }.expects([S]).returns(B),
        
        /**
         * Returns true if the tag for 'word' is any variant of a adverb in the PENN part-of-speech tag set (e.g. rb, rbr, rbs)
         * @param {string} word the PENN part-of-speech tag
         * @returns {boolean} true if the tag is any variant of a adverb 
         */
        isAdverb : function(word) {
           
            if (word && word.indexOf(" ") != -1) error("Only accepts a single word"); // TODO: add test
          
            //return RiTa.tagForWordNet(word) === 'r' ;
            
            var pos = RiTa.getPosTags(word);
            return PosTagger.isAdverb(pos.toString());

        }.expects([S]).returns(B),
        
        /**
         * Returns true if the tag for 'word' is any variant of an adjective in the PENN part-of-speech tag set (e.g. jj, jjr, jjs)
         * @param {string} word the PENN part-of-speech tag
         * @returns {boolean} true if the tag is any variant of a adjective 
         */
        isAdjective : function(word) {
            
            if (word && word.indexOf(" ") != -1) error("Only accepts a single word"); // TODO: add test
            
            //return RiTa.tagForWordNet(word) === 'a' ; 
            
            var pos = RiTa.getPosTags(word);
            return PosTagger.isAdj(pos.toString());
            
        }.expects([S]).returns(B),
        
        /**
         * Returns true if 'tag' is a valid PENN part-of-speech tag (e.g. cd, fw, jj, ls, nn, sym, vbg, wp)
         * @param {string} tag the PENN part-of-speech tag
         * @returns {boolean} true if the tag a valid PENN part-of-speech tag
         * @private
         */
        isPosTag : function(tag) {
            return PosTagger.isTag(tag);
            
        }.expects([S]).returns(B),
             
        // TODO: example
        /**
         * Tags the word (as usual) with a part-of-speech from the Penn tagset, 
         * then returns the corresponding part-of-speech for WordNet from the
         * set { 'n', 'v', 'a', 'r' } as a string. 
         * 
         * @param {string | array} words the text to be tagged
         * @returns {string | array} the corresponding part-of-speech for WordNet
         *@private
         */
        tagForWordNet  : function(words) {
            
            var posArr = RiTa.getPosTags(words);
            //var posArr = posTag(words);
            if (!isNull(words) && posArr.length) {
                for ( var i = 0; i < posArr.length; i++) {
                    var pos = posArr[i];
                    if (PosTagger.isNoun(pos))      posArr[i] =  "n";
                    if (PosTagger.isVerb(pos))      posArr[i] =  "v";
                    if (PosTagger.isAdverb(pos))    posArr[i] =  "r";
                    if (PosTagger.isAdj(pos))      posArr[i] =  "a";
                }
                return posArr;  
            }
            return []; 
            
        }.expects([A],[S]).returns(A),
          
        //TODO: example
        
        /**
         * Uses the default PosTagger to tag the input with a tag from the PENN tag set
         * @param {string | array} words the text to be tagged
         * @retuns {string | array}
         * 
         */
        getPosTags : function(words) {    
            
            var wordArr = RiTa.tokenize(words);

            return PosTagger.tag(wordArr);
            
        }.expects([A],[S]).returns(A),
        
        // TODO: example
        /**
         * Uses the default PosTagger to tag the input with a tag from the PENN tag set
         * in 'inline' form
         * @param {string} words the text to tag
         * @returns {string} 
         */
        getPosTagsInline : function(words) { 
            
            var wordArr = RiTa.getPosTags(words);

            return wordArr.join(" ");
            
        }.expects([A],[S]).returns(S),
        
        // TODO: example
        /**
         * Converts a PENN part-of-speech tag to the simplified WordNet scheme 
         * (e.g. nn -> n, nns -> n, vbz -> v, rb -> r)
         * { "n" (noun), "v"(verb), "a"(adj), "r"(adverb), "-"(other) }
         * as a String.
         * 
         * @param {string} tag pos tag to convert
         * @returns {string} simplified WordNet tag
         */
        posToWordNet  : function(tag) {
            
            if (Types.get(tag) != S) 
                throw Error('Arg1 must be string');

            if (tag.length==0) return E;
            
            if (PosTagger.isNoun(tag))    
                return "n";
            else if (PosTagger.isVerb(tag))
                return "v";
            else if (PosTagger.isAdverb(tag))
                return  "r";
            else if (PosTagger.isAdj(tag))
                return  "a";
            else  
                return  "-";
                      
        }.expects([S]).returns(S),
        
        /**
         *  Returns the present participle form of the stemmed or non-stemmed 'verb'. 
         *  @param {string} verb the verb
         *  @returns {string} the present participle form of the verb
         */
        getPresentParticiple : function(verb) { 
            
            if (Types.get(verb) != S) throw Error('Arg1 must be string');

            // TODO: need to call stem() and try again if first try fails
            return Conjugator().getPresentParticiple(verb);
            
        }.expects([S]).returns(S),

        /**
         *  Returns the past participle form of the stemmed or non-stemmed 'verb'. 
         *  @param {string} verb the verb
         *  @returns {string} the past participle form of the verb
         */
        getPastParticiple : function(verb) { 
            
            if (Types.get(verb) != S) throw Error('Arg1 must be string');

            // TODO: need to call stem() and try again if first try fails
            return Conjugator().getPastParticiple(verb);
            
        }.expects([S]).returns(S),

        // TODO: 2 examples
        /**
         *  Conjugates the 'verb' according to the specified options
         *  @param {string} verb the verb stem
         *  @param {object} args containing the relevant options for the conjugator
         *  @returns {string}  the conjugated verb
         */
        conjugate : function(verb, args) {

            if (Types.get(verb) != S) throw Error('Arg1 must be string');
            return Conjugator().conjugate(verb, args);
            
        }.expects([S,O]).returns(S),

        // TODO: does this method requires a pre-stemmed noun? check tests... does it work only with noun? (check 'natural')
        // TODO: 2 examples (regular & irregular)
        /** 
         * Pluralizes a word according to pluralization rules (see regexs in constants)
         * Returns the regular or irregular plural form of noun.       
         * 
         * @param {string} word the noun
         * 
         * @returns {string} the plural form of noun
         */
        pluralize : function(word) {

            if (!word.length) return E;

            var i, rule, rules = PLURAL_RULES;

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

            return DEFAULT_PLURAL_RULE.fire(word);
            
        }.expects([S]).returns(S),
        
        //TODO: 2 examples (regular & irregular)
        /** 
         * Singularize a word according to singularization rules (see regexs in constants)
        
         * @param {string} word the noun
         * @returns {string}  the singular form of noun
         */
        singularize : function(word) {

            if (isNull(word) || !word.length) return E;

            throw Error('Implement me!');
            
        }.expects([S]).returns(S),


        /**
         *  Removes blank space from either side of a string
         *  Trims null entries off the end of an array. Returns a new array consisting of the elements from 0 to the last non-null element.
         *  
         *  @param {string} str input
         *  @returns {string}  
         */
        trim : function(str) {
            
            return trim(str); // delegate to private
            
        }.expects([S]).returns(S),

        //TODO: 2 examples, one with 1 arg, one with a regex that splits on spaces
        /**
         *  Tokenizes the string according to Penn Treebank conventions
         *  See: http://www.cis.upenn.edu/~treebank/tokenization.html
         *  
         *  @param {string} words a sentence
         *  @param {string | regex} regex (optional) the pattern to be used for tozenization
         *  
         *  @return{array} strings, which each element is a single token (or word)
         *    
         *  
         */
        tokenize : function(words, regex) {
            
            //if (!words || !words.length) return [];
            
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

            
            /*if (SPLIT_CONTRACTIONS) { // SAVE
                words = words.replace(/'ll /g, " 'll "); 
                words = words.replace(/'re /g, " 're "); 
                words = words.replace(/'ve /g, " 've ");
                words = words.replace(/n't /g, " n't "); 
                words = words.replace(/'LL /g, " 'LL "); 
                words = words.replace(/'RE /g, " 'RE "); 
                words = words.replace(/'VE /g, " 'VE "); 
                words = words.replace(/N'T /g, " N'T "); 
            }*/

            
            words = words.replace(/ ([Cc])annot /g, " $1an not ");
            
            /*if (SPLIT_CONTRACTIONS) { // SAVE

                //words = words.replace(/ ([Cc])annot /g, " $1an not ");
                words = words.replace(/ ([Dd])'ye /g, " $1' ye ");
                words = words.replace(/ ([Gg])imme /g, " $1im me ");
                words = words.replace(/ ([Gg])onna /g, " $1on na ");
                words = words.replace(/ ([Gg])otta /g, " $1ot ta ");
                words = words.replace(/ ([Ll])emme /g, " $1em me ");
                words = words.replace(/ ([Mm])ore'n /g, " $1ore 'n ");
                words = words.replace(/ '([Tt])is /g, " $1 is ");
                words = words.replace(/ '([Tt])was /g, " $1 was ");
                words = words.replace(/ ([Ww])anna /g, " $1an na ");
            }*/

            // "Nicole I. Kidman" gets tokenized as "Nicole I . Kidman"
            words = words.replace(/ ([A-Z]) \\./g, " $1. ");
            words = words.replace(/\\s+/g, SP);
            words = words.replace(/^\\s+/g, E);
            
            return trim(words).split(/\s+/); // DCH: fixed bug here, 6/3/12
            
        }.expects([S],[S,O],[S,S]).returns(A),

        
        // TODO: test and (probably) re-implement from RiTa (RiSplitter.java)
        /**
         *  Splits the 'text' into sentences (according to PENN Treebank conventions)
         *  
         *  @param {string} text the text to be split
         *  @param {string | regex} regex (optional) the pattern to be used for tozenization
         *  
         *  @returns {array} of sentences 
         */
        splitSentences : function(text, regex) {

    
            var arr = text.match(/(\S.+?[.!?])(?=\s+|$)/g);

            return (text.length && arr && arr.length) ? arr : [ text ];
            
        }.expects([S],[S,R],[S,S]).returns(A),

        /**
         * Returns true if and only if the string matches 'pattern'
         * 
         * @param {string} string string to test
         * @param {string | regex} pattern object containing regular expression
         * @returns {boolean} true if matched, else false
         * @private
         */
        regexMatch : function(string, pattern) {
            
            if (isNull(string) || isNull(pattern))
                return false;
            
            if (typeof pattern === 'string')
                pattern = new RegExp(pattern);
            
            return pattern.test(string);
            
        }.expects([S,O],[S,S]).returns(B),

        /**
         * Replaces all matches of 'pattern' in the 'string' with 'replacement'
         * 
         * @param {string} string to test
         * @param {string | regex } pattern object containing regular expression
         * @param {string} replacement the replacement
         * @returns {string} with replacements or thestring on error
         * @private
         */
        regexReplace : function(string, pattern, replacement) {
            
            if (isNull(string) || isNull(pattern))
                return E;
            if (typeof pattern === 'string')
                pattern = new RegExp(pattern); // TODO: is this necessary?
            return string.replace(pattern, replacement);
            
        }.expects([S,O,S],[S,S,S]).returns(S),
             
        /**
         * Returns true if 'input' is an abbreviation
         * 
         * @param {string} input
         * @param {boolean} caseSensitive (optional, default=false)
         * 
         * @returns {boolean} true if 'input' is an abbreviation
         */
        isAbbreviation : function(input, caseSensitive) {
            
            caseSensitive = caseSensitive || false;
            input = caseSensitive ? input : RiTa._titleCase(input);
            return inArray(this.ABBREVIATIONS, input);
            
        }.expects([S],[S,B]).returns(B),
        
        /**
         * Returns true if sentence starts with a question word.
         * 
         * @param {string} sentence
         * 
         * @returns {boolean} true if 'sentence' starts with a question word.
         */
        isQuestion : function(sentence) {
            
            var sentenceArr = RiTa.tokenize((sentence));
            
            for (var i = 0; i < QUESTION_STARTS.length; i++) {
                
                  if (equalsIgnoreCase(sentenceArr[0], QUESTION_STARTS[i]))
                    return true;
            }
            return false;
            
        }.expects([S]).returns(B),

        /**
         * Returns true if 'currentWord' is the final word of a sentence.
         * This is a simplified version of the OAK/JET sentence splitter method.
         * 
         * @param {string} currentWord
         * @param {string} nextWord
         * @returns {boolean} true if 'currentWord' is the final word of a sentence.
         */
        isSentenceEnd : function(currentWord, nextWord) {

            if (Types.get(currentWord) != 'string' || Types.get(nextWord) != 'string')
                return false;
            
            var cw = currentWord.charAt(0), cWL = currentWord.length; 
            
            // token is a mid-sentence abbreviation (mainly, titles) --> middle of sent
            if (RiTa.isAbbreviation(currentWord))
              return false;
            
            if (cWL > 1 && cw.indexOf("`'\"([{<") != -1 && RiTa.isAbbreviation(currentWord.substring(1)))
              return false;
        
            if (cWL > 2 && ((currentWord.charAt(0) == '\'' 
              && currentWord.charAt(1) == '\'') || (currentWord.charAt(0) == '`' 
              && currentWord.charAt(1) == '`')) && RiTa.isAbbreviation(currentWord.substring(2)))
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
            if (cWL == 4 && currentToken2 == '.'
                && (currentToken1 == currentToken1.toUpperCase() && currentWord.charAt(0) == currentWord.charAt(0).toUpperCase() ))
              return false;
        
            // U.S. or U.N. -> middle of sentence
            //if (currentToken.equals("U.S.") || currentToken.equals("U.N."))
              //return false; // dch
              
            //if (Util.isAbbreviation(currentToken)) return false;
            
            // (for XML-marked text) next char is < -> end of sentence
           // if (nextToken0 == '<') return true;
            
            return true;

        }.expects([S,S]).returns(B),
        
        /**
         * Returns true if sentence starts with a w-question word, eg (who,what,why,where,when,etc.)
         * 
         * @param {string} sentence
         * @returns {boolean} true if sentence starts with a w-question word, eg (who,what,why,where,when,etc.)
         */
        isW_Question : function(sentence) {    
            var sentenceArr = RiTa.tokenize((sentence));
            for (var i = 0; i < W_QUESTION_STARTS.length; i++)
                if (equalsIgnoreCase(sentenceArr[0], W_QUESTION_STARTS[i]))
                  return true;
            return false;
            
        }.expects([S]).returns(B),

        /**
         * Returns a randomly ordered array of unique integers from 0 to numElements. 
         * The size of the array will be numElements.
         * 
         * @param {number} numElements
         * @returns {array} unique integers from 0 to numElements. 
         */
        randomOrdering : function(numElements) {    
            
            if (!numElements || numElements < 1)// !isNum(numElements)) 
                throw Error("bad arg");
            
            var o = [];
            for ( var i = 0; i < numElements; i++) {
                o.push(i);
            }
            
            // Array shuffle, from Jonas Raoni Soares Silva (http://jsfromhell.com/array/shuffle)
            for(var j, x, i = o.length; i; j = parseInt(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x){}

            return o;
            
        }.expects([N]).returns(A),

        /**
         * Removes and returns a random element from an array, returning
         * it and leaving the array 1 element shorter.
         * 
         * @param {array} arr
         * @returns {array} 
         */
        removeRandom : function(arr) { 
            
            var i = Math.floor((Math.random()*arr.length));
            remove(arr,i,i);
            return arr;
            
        }.expects([A]).returns(A),
            
        /**
         * Strips all punctuation from the given string
         * @param {string} text input
         * @param {array} chars (Optional) Characters to ignore
         * @returns {string} result
         */
        stripPunctuation : function(text) {    

            return (text === E) ? [E] : text.replace(PUNCTUATION_CLASS,E); // TODO: cache this?
            
        }.expects([S]).returns(S),
        
        // PUNCTUATION : "рсут`'""\",;:!?)([].#\"\\!@$%&}<>|+=-_\\/*{^",
        
        
        /**
         * Trims punctuation from each side of the token (does not trim whitespace or internal punctuation).
         * 
         * @param {string} text input
         * @returns {string} result
         */
        trimPunctuation : function(text) {
            
            // TODO: replace all this with 1 regex

            // from the front
            while (text.length > 0) {
               var c = text.charAt(0);
               if (!RiTa.isPunctuation(c)) 
                   break;
               text = text.substr(1);
            }
            
            // from the back
            while (text.length > 0) {
                var c = text.charAt(text.length-1);
                if (!RiTa.isPunctuation(c)) 
                    break;
                text = text.substring(0, text.length-1);
             }
            return text;

            
        }.expects([S]).returns(S),
              
        /**
         * Returns true if every character of 'text' is a punctuation character
         * 
         * @param {string} text input
         * @returns {boolean} true
         */
        // TEST: PUNCTUATION : "рсут`'""\",;:!?)([].#\"\\!@$%&}<>|+=-_\\/*{^",
        isPunctuation : function(text) { 
            
            if (!text || !text.length) return false;
  
            return ONLY_PUNCT.test(text); 
            
        }.expects([S]).returns(B),

        /**
         * Analyzes the given string, Returns a String containing all phonemes for the input text, delimited by semi-colons.
         * 
         * @param {string | array} words to analyze
         * @returns {string}  e.g., "dh:ax:d:ao:g:r:ae:n:f:ae:s:t", or null if no text has been input.
         */
        getPhonemes : function(words) {

            return RiLexicon._getInstance().getPhonemes(words);

        }.expects([S],[A]).returns(S),

        /**
         * Analyzes the given string and returns a new string containing the stresses
         *  for each syllable of the input text, delimited by semi-colons. 
         * 
         * @param {string | array} words to analyze
         * 
         * @returns {string}  e.g., "0:1:0:1", with 1's meaning 'stressed', and 0's meaning 'unstressed', 
         */
        getStresses : function(words) {

            return RiLexicon._getInstance().getStresses(words);

        }.expects([S],[A]).returns(S),

        /**
         * Analyzes the given string, Returns a String containing the phonemes for each syllable of each word of the input text, 
         * delimited by dashes (phonemes) and semi-colons (words), 
         * 
         * @param {string | array} words words to analyze
         * @returns {string} e.g., "dh-ax:d-ao-g:r-ae-n:f-ae-s-t" for the 4 syllables of the phrase 'The dog ran fast', or null if no text has been input.
         */
        getSyllables : function(words) {
            
            return RiLexicon._getInstance().getSyllables(words);

        }.expects([S],[A]).returns(S),
        
        /**
         * Returns the # of words in the object according to the default WordTokenizer.
         * 
         * @param {string} words the string to analyze
         * @returns {number}
         */
        getWordCount : function(words) {
            
            return RiTa.tokenize(words).length;

        }.expects([S]).returns(N),
        
        /**
         * Extracts base roots from a word by lower-casing it, then removing prefixes and suffixes. 
         * For example, the words 'run', 'runs', 'ran', and 'running' all return "run" as their stem.
         * 
         * @param {string} word the verb to analyze
         * @returns {string} the stemmed form of 'verb' according to the RiTa stemming rules.
         */
        stem : function(word, type) { // TODO: support Lancaster-Stemmer as well
            
            type = type || 'Lancaster'; 
            
            var stemImpl = (type == 'Porter') ? Stemmer.stem_Porter : Stemmer.stem_Lancaster; 
            
            if (word.indexOf(SP) < 0) return stemImpl(word);
            
            // dump non-words - http://qaa.ath.cx/porter_js_demo.html
            word = word.replace(/[^\w]/g, ' ');
         
            // dump multiple white-space - http://qaa.ath.cx/porter_js_demo.html
            word = word.replace(/\s+/g, ' '); 
            
            var res = [], words = word.split(' ');
            
            for ( var i = 0; i < words.length; i++) {
                
                res.push(stemImpl(words[i]));
            }
            return res.join(SP);

        }.expects([S],[S,S]).returns(S),
        
        /**
         * For convenience, provides implementations of some of Processing built-in 
         * method, e.g. size(), background(), etc. and backwards compatibility with
         * the original RiTa/Processing Java library
         * 
         * @param {boolean} true to enable compatibility, else false
         */
        p5Compatible : function(value) {
            
            if (!arguments.callee.setupAndDraw) {
                
                arguments.callee.setupAndDraw = function() {
                    if (typeof window.setup == 'function') setup();
                    if (typeof window.draw == 'function') RiText.loop();
                }
            }
            
            if (value) {
                
                // alias for some P5 member functions 
                RiText.prototype.fill       = RiText.prototype.color;
                RiText.prototype.textAlign  = RiText.prototype.align;
                RiText.prototype.textFont   = RiText.prototype.font;
                RiText.prototype.textSize   = RiText.prototype.fontSize;
                
                // alias for some RiTa-java functions
                RiText.prototype.setText    = RiText.prototype.text;
                RiText.prototype.fadeColor  = RiText.prototype.colorTo;
                RiText.prototype.fadeToText = RiText.prototype.textTo;
                RiText.prototype.setColor   = RiText.prototype.color;
                
                // alias for RiTa-java static functions
                RiText.setDefaultFont = RiText.defaultFont;
                RiText.setDefaultColor = RiText.defaultColor;
                RiText.setDefaultAlignment = RiText.defaultAlignment;
                RiText.setCallbackTimer = RiText.timer;
                
                if (!hasProcessing) {

                    // add some common P5 global methods (sorry, namespace)

                    if (!window.line) window.line = RiText.line;
                    if (!window.size) window.size= RiText.size;
                    if (!window.width) window.width= RiText.width;
                    if (!window.height) window.height= RiText.height;
                    if (!window.createFont) window.createFont= RiText.createFont;
                    if (!window.background) window.background= RiText.background;
                    if (!window.random) window.random= RiText.random;
                    if (!window.RIGHT) window.RIGHT = RiText.RIGHT;
                    if (!window.LEFT) window.LEFT = RiText.LEFT;
                    if (!window.CENTER) window.CENTER = RiText.CENTER;
                    
                    window.onload = arguments.callee.setupAndDraw;
                }
            }
            else { // not-compatible (clear extra stuff)
                
                delete RiText.prototype.fill;
                delete RiText.prototype.textAlign;
                delete RiText.prototype.textFont;
                delete RiText.prototype.textSize;
                
                delete RiText.prototype.setColor;
                delete RiText.prototype.setText;
                delete RiText.prototype.fadeColor;
                delete RiText.prototype.fadeToText;
                
                delete RiText.setDefaultFont;
                delete RiText.setDefaultColor;
                delete RiText.setDefaultAlignment;
                delete RiText.setCallbackTimer;
                
                if (!hasProcessing)  {
                    
                    // are these checks needed?
                    if (window.line === RiText.line) delete window.line;
                    if (window.size === RiText.size) delete window.size;
                    if (window.width === RiText.width) delete window.width;
                    if (window.height === RiText.height) delete window.height;
                    if (window.createFont === RiText.createFont) delete window.createFont;
                    if (window.background === RiText.background) delete window.background;
                    if (window.random === RiText.random) delete window.random;
                    if (window.RIGHT === RiText.RIGHT) delete window.RIGHT;
                    if (window.LEFT === RiText.LEFT) delete window.LEFT;
                    if (window.CENTER === RiText.CENTER) delete window.CENTER;
                    
                    if (window.onload == arguments.callee.setupAndDraw)
                        delete window.onload;
                }
            }
        }.expects([B]),
        
        /**
         * Converts 'input' to Titlecase (1st letter upper, rest lower)
         */
        _titleCase : function(input) {
            
            if (!input || !input.length) return input;
            
            return input.substring(0,1).toUpperCase() + input.substring(1);
        }
        
    } // end RiTa object


    
    ////////////////////////// PRIVATE CLASSES ///////////////////////////////

    // ///////////////////////////////////////////////////////////////////////
    // RiText_Canvas 2D-Renderer
    // ///////////////////////////////////////////////////////////////////////
    
    /**
     * @name RiText_Canvas
     * @class
     * @private
     */
    var RiText_Canvas = makeClass();
    
    RiText_Canvas.prototype = {

        constructs : function(ctx) {
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
            this.ctx.scale(sx, sy, 1);
        },
        
        __translate : function(tx, ty) {
            this.ctx.translate(tx, ty, 0);
        },
        
        __rotate : function(zRot) {
            this.ctx.rotate(0,0,zRot);
        },
        
        __line : function(x1,y1,x2,y2,lw) {
            
      
            lw = lw || 1; // canvas hack for crisp lines
            x1 = Math.round(x1), x2 = Math.round(x2);
            y1 = Math.round(y1), y2 = Math.round(y2);
            
            //log('line: ('+(x1)+","+(y1)+","+(x2)+","+(y2)+")");
            
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
            this.ctx.strokeStyle = (Types.get(r) == 'string') ? r
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
            if (Types.get(fontObj)!='object') 
                throw Error("__textFont expects object, but got: "+fontObj);
            this.ctx.font = "normal "+fontObj.size+"px "+fontObj.name;
        },
        
        __textAscent : function(rt) {
            return this.__getMetrics(rt).ascent;
        },
        
        __textDescent : function(rt) {
            return this.__getMetrics(rt).descent;

        },

        // should operate on the RiText itself (take rt as arg?)
        __text : function(str, x, y) {
            //log("text: "+str+","+x+","+y+","+this.ctx.textAlign);
            this.ctx.baseline = 'alphabetic';
            this.ctx.fillText(str, x, y);
            //this.ctx.strokeText(str, x, y);
        },

        __textWidth : function(fontObj, str) {
            this.ctx.save();
            this.__textFont(fontObj);
            var tw = this.ctx.measureText(str).width;
            this.ctx.restore();
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
            //log('[CTX] ascent='+metrics.ascent+' descent='+metrics.descent+" h="+(metrics.ascent+metrics.descent));
            this.ctx.restore();
            return { x: 0, y: metrics.descent-1, width: w, height: metrics.ascent+metrics.descent+1 };
        },

        __getMetrics : function(rt) {// does this need font.size? no

            var fontObj = rt._font, str = rt.text();
            
            //log('__getMetrics:'+fontObj+","+str);
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

            return result;
        },
        
        toString : function() {
            return "RiText_"+this.__type;
        }
        
    };
        
    // ////////////////////////////////////////////////////////////
    // TextNode
    // ////////////////////////////////////////////////////////////
    
    /**
     * @name TextNode
     * @class
     * @private
     */
    var TextNode = makeClass();
    
    TextNode.prototype = {

        constructs : function(parent, token) {
            
            this.count = 0;
            this.parent = parent;
            this.token = token;
            this.children = {};
        },
        
        selectChild : function(regex, probabalisticSelect) {
            var ps = probabalisticSelect || true;
            return this.children ? this._select(this.childNodes(regex), ps) : null;
        },
        
        _select : function (arr, probabalisticSelect)
        { 
            if (!arr) throw TypeError("bad arg to '_select()'");
            
            probabalisticSelect = probabalisticSelect || false;
            
            return (probabalisticSelect ? this._probabalisticSelect(arr) 
                : arr[Math.floor((Math.random()*arr.length))]);    
        },
        
        _probabalisticSelect : function(arr)
        {    
            if (!arr) throw TypeError("bad arg to '_probabalisticSelect()'");
            
            //L("RiTa.probabalisticSelect("+c+", size="+c.size()+")");
            if (!arr.length) return null;
            if (arr.length == 1) return arr[0];

            // select from multiple options based on frequency
            var pTotal = 0, selector = Math.random();
            for ( var i = 0; i < arr.length; i++) {
                
                pTotal += arr[i].probability();
                if (selector < pTotal)
                    return arr[i];
            }
            throw Error("Invalid State in RiTa.probabalisticSelect()");   
        },

        addChild : function(newToken, initialCount) {

          initialCount = initialCount || 1;
          
          var node = this.children[newToken];

          //  add first instance of this token 
          if (!node) {
            node = new TextNode(this, newToken);
            node.count = initialCount;
            this.children[newToken] = node;   
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
            return isNull(this.parent);
        },
        
        isLeaf : function() {
            return this.childCount() == 0;
        },
        
        probability : function() {
            //onsole.log('probability: '+ this.count+'/'+this.siblingCount());
            return this.count/this.siblingCount();
        },
        
        uniqueCount : function() {
        
            return Object.keys(this.children).length;    // compatible?
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
        
        childNodes : function(regex) {
            
            if (!this.children) return [];
            
            if (Types.get(regex) == 'string') regex = new RegExp(regex);
            
            var res = [];
            for (var k in this.children)  {
                var node = this.children[k];
                if (!regex || (node && node.token && node.token.search(regex)>-1)) {
                    res.push(node);
                }
            }
            
            return res;
        },        
        
        siblingCount : function() {
            
          if (this.isRoot()) throw Error("Illegal siblingCount on ROOT!");
          
          if (!this.parent) throw Error("Null parent for: "+this.token);
          
          return this.parent.childCount();
        },
        
        /*
         * takes node or string, returns node
         */
        lookup : function(obj)
        {   
          if (!obj) return null;
          
          obj = (typeof obj != 'string' && obj.token) ? obj.token : obj;
          
          //log(this.token+".lookup("+obj+")");
          
          return obj ? this.children[obj] : null; 
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
              throw Error("ILLEGAL FREQ: "+node.count+" -> "+mn.token+","+node.token);
            
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
    

    /**
     * @name Conjugator
     * @class
     * @private
     */
    var Conjugator = makeClass();
    
    Conjugator.prototype = {

        constructs : function() {
            
            // TODO: get rid of these and make static method ?
            
            this.perfect = this.progressive = this.passive = this.interrogative = false;
            this.tense = RiTa.PRESENT_TENSE;
            this.person = RiTa.FIRST_PERSON;
            this.number = RiTa.SINGULAR;
            this.form = RiTa.NORMAL;
            this.head = "";

        },

        // Conjugates the verb based on the current state of the conjugator.
        // !@# Removed (did not translate) incomplete/non-working java
        // implementation of modals handling.
        // !@# TODO: add handling of past tense modals.
        conjugate : function(verb, args) {

            if (!verb || !verb.length) return E;
            
            if (!args) return verb;

            var actualModal = null,
            // Compute modal -- this affects tense
            conjs = [], frontVG = verb, verbForm;

            // ------------------ handle arguments ------------------
            if (args.number) {
                this.number = args.number;
            }
            if (args.person) {
                this.person = args.person;
            }
            if (args.tense) {
                this.tense = args.tense;
            }
            if (args.form) {
                this.form = args.form;
            }
            if (args.passive) {
                this.person = args.passive;
            }
            if (args.progressive) {
                this.progressive = args.progressive;
            }
            if (args.perfect) {
                this.perfect = args.perfect;
            }

            // ----------------------- start ---------------------------
            if (this.form == RiTa.INFINITIVE) {
                actualModal = "to";
            }

            if (this.tense == RiTa.FUTURE_TENSE) {
                actualModal = "will";
            }

            if (this.passive) {
                this.conjs.push(this.getPastParticiple(this.frontVG));
                this.frontVG = "be"; // Conjugate this ?
            }

            if (this.progressive) {
                conjs.push(this.getPresentParticiple(frontVG));
                frontVG = "be"; // Conjugate this ?
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
                } else if (this.interrogative && !(verb == "be") && conjs.length < 1) {

                    conjs.push(frontVG);
                } else {

                    verbForm = this.getVerbForm(frontVG, this.tense, this.person, this.number);
                    conjs.push(verbForm);
                }
            }

            // add modal, and we're done
            if (actualModal) {
                // log("push: "+actualModal);
                conjs.push(actualModal);
            }

            var s = E;
            for ( var i = 0; i < conjs.length; i++) {
                s = conjs[i] + " " + s;
            }

            // !@# test this
            if (endsWith(s, "peted"))
                error("Unexpected output: " + this.toString());

            return trim(s);
        },

        checkRules : function(ruleSet, verb) {

            if (isNull(ruleSet))
                error("no ruleset");

            var name = ruleSet.name;
            var rules = ruleSet._rules;
            var defaultRule = ruleSet.defaultRule || null;

            if (inArray(MODALS, verb)) {

                // log("checkRules1("+name+").returns: "+got);
                return verb;
            }

            for ( var i = 0; i < rules.length; i++) {

                // log("checkRules2("+name+").fire("+i+")="+rules[i].regex);
                if (rules[i].applies(verb)) {

                    var got = rules[i].fire(verb);

                    // log("HIT("+name+").fire("+i+")="+rules[i].regex+"
                    // _returns: "+got);
                    return got;
                }
            }

            if (ruleSet.doubling || inArray(VERB_CONS_DOUBLING, verb)) {
                verb = this.doubleFinalConsonant(verb);
            }

            var res = defaultRule.fire(verb);

            // log("checkRules3("+name+").returns: "+res);
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

            //log("getPast(" + verb + ").returns: " + got);

            return got;
        },

        getPresent : function(verb, person, number) {

            // Defaults if unset
            person = (isNull(person)) ? this.person : person;
            number = (isNull(number)) ? this.number : number;

            if ((person == RiTa.THIRD_PERSON) && (number == RiTa.SINGULAR)) {

                return this.checkRules(PRESENT_TENSE_RULESET, verb);
            } else if (verb == "be") {

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
            
            return strOk(verb) ? this.checkRules(PAST_PARTICIPLE_RULESET, verb) : E;
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

        // Returns a String representing the current person from one of
        // (first, second, third)
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

        // A human-readable representation of state for logging
        toString : function() {
            return "  ---------------------\n" + "  Passive = " + this.isPassive() + "\n"
                    + "  Perfect = " + this.isPerfect() + "\n" + "  Progressive = "
                    + this.isProgressive() + "\n" + "  ---------------------\n" + "  Number = "
                    + this.getNumber() + "\n" + "  Person = " + this.getPerson() + "\n"
                    + "  Tense = " + this.getTense() + "\n" + "  ---------------------\n";
        },

        // Returns all possible conjugations of the specified verb
        // (contains duplicates) (TODO: remove? not sure about this one)
        conjugateAll : function(verb) {

            var results = [], i, j, k, l, m, n;

            this.setVerb(verb);

            for (i = 0; i < TENSES.length; i++) {
                this.setTense(TENSES[i]);
                for (j = 0; j < NUMBERS.length; j++) {
                    this.setNumber(NUMBERS[j]);
                    for (k = 0; k < PERSONS.length; k++) {
                        this.setPerson(PERSONS[k]);
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
            // log("all="+results.length);
            return results;
        }
    };

    // ////////////////////////////////////////////////////////////
    // PosTagger  (singleton)
    // ////////////////////////////////////////////////////////////
    
    var PosTagger = {

        // Penn Pos types ------------------------------
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

        TAGS : [ "CC", "CD", "DT", "EX", "FW", "IN", "JJ", 
                "JJR", "JJS", "LS", "MD", "NN", "NNS", "NNP", 
                "NNPS", "PDT", "POS", "PRP", "PRP$", "RB", 
                "RBR", "RBS", "RP", "SYM", "TO", 
                 "UH", "VB", "VBD", "VBG", "VBN", "VBP", "VBZ", "WDT", 
                 "WP", "WP$", "WRB", "UNKNOWN" ],
        NOUNS : [ "NN", "NNS", "NNP", "NNPS" ],
        VERBS : [ "VB", "VBD", "VBG", "VBN", "VBP", "VBZ" ],
        ADJ : [ "JJ", "JJR", "JJS" ],
        ADV : [ "RB", "RBR", "RBS", "RP" ],

   
        isVerb : function(tag) {
            //return inArray(this.VERBS, tag);
            return inArray(this.VERBS, tag.toUpperCase());
        },

        isNoun : function(tag) {
            //return inArray(this.NOUNS, tag);
            return inArray(this.NOUNS, tag.toUpperCase());
        },

        isAdverb : function(tag) {
            //return inArray(this.ADV, tag);
            return inArray(this.ADV, tag.toUpperCase());
        },

        isAdj : function(tag) {
            //return inArray(this.ADJ, tag);
            return inArray(this.ADJ, tag.toUpperCase());
        },

        isTag : function(tag) {
            return inArray(this.TAGS, tag);
        },

        hasTag : function(choices, tag) {
            var choiceStr = choices.join();
            return (choiceStr.indexOf(tag) > -1);
        },
        
        /**
         * Returns an array of parts-of-speech from the Penn tagset, 
         * each corresponding to one word of input
         */
        tag : function(words) {
            
            var result = [], choices = [], lex = RiLexicon._getInstance(); 
            
            words = Types.get(words) == A ?  words : [ words ];
            
            for (var i = 0, l = words.length; i < l; i++) {
     
                if (!strOk(words[i])) continue
                
                var data = lex.getPosArr(words[i]);

                if (isNull(data) || data.length == 0) {
                    
                    if (words[i].length == 1) {
                        
                        result[i] = isNum(words[i].charAt(0)) ? "cd" : words[i];
                    } 
                    else {
                        
                        result[i] = "nn";
                    }
                    choices[i] = null;  // TODO: OK?
                } 
                else {
                    result[i] = data[0];
                    choices[i] = data;
                }
            }

            // Adjust pos according to transformation rules
            return this.__applyContext__(words, result, choices);
            
        }.expects([A],[S]).returns(A),

        
        // Applies a customized subset of the Brill transformations
        __applyContext__ : function(words, result, choices) {
            
            //log("__applyContext__("+words+","+result+","+choices+")");

            // Shortcuts for brevity/readability
            var sW = startsWith, eW = endsWith, PRINT_CUSTOM_TAGS = true, PRINT = PRINT_CUSTOM_TAGS;

            // Apply transformations
            for (var i = 0, l = words.length; i < l; i++) {

                var firstLetter = words[i].charAt(0);

                // transform 1: DT, {VBD | VBP | VB} --> DT, NN
                if (i > 0 && (result[i - 1] == "dt")) {
                    if (sW(result[i], "vb")) {
                        if (PRINT) {
                            log("BrillPosTagger: changing verb to noun: " + words[i]);
                        }
                        result[i] = "nn";
                    }

                    // transform 1: DT, {RB | RBR | RBS} --> DT, {JJ |
                    // JJR | JJS}
                    else if (sW(result[i], "rb")) {
                        if (PRINT) {
                            log("BrillPosTagger:  custom tagged '" + words[i] + "', "
                                    + result[i]);
                        }
                        result[i] = (result[i].length > 2) ? "jj" + result[i].charAt(2) : "jj";
                        if (PRINT) {
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
                        log("[INFO] BrillPosTagger tagged '" + words[i] + "' as " + result[i]);
                    }
                }

                // transform 9(dch): convert common nouns to proper
                // nouns when they start w' a capital and are not a
                // sentence start
                if (i > 0 && sW(result[i], "nn") && words[i].length > 1
                        && (firstLetter == firstLetter.toUpperCase())) {
                    result[i] = eW(result[i], "s") ? "nnps" : "nnp";
                }

                // transform 10(dch): convert plural nouns (which are
                // also 3sg-verbs) to 3sg-verbs when followed by adverb
                // (jumps, dances)
                if (i < result.length - 1 && result[i] == "nns" && sW(result[i + 1], "rb")
                        && this.hasTag(choices[i], "vbz")) {
                    result[i] = "vbz";
                }
            }
         
            return result;
            
        }.returns(A)

    };// end PosTagger

    /**
     * @name Stemmer
     * @class
     * @private
     */
    var Stemmer = {};
    
    /**  
     *  Porter stemmer in Javascript: from https://github.com/kristopolous/Porter-Stemmer
     *  Ported from Porter, 1980, An algorithm for suffix stripping, Program, Vol. 14,
     *  no. 3, pp 130-137, see also http:www.tartarus.org/~martin/PorterStemmer
     *  @private
     */
    Stemmer.stem_Porter = (function() {
        
        var step2list = {
                "ational" : "ate",
                "tional" : "tion",
                "enci" : "ence",
                "anci" : "ance",
                "izer" : "ize",
                "bli" : "ble",
                "alli" : "al",
                "entli" : "ent",
                "eli" : "e",
                "ousli" : "ous",
                "ization" : "ize",
                "ation" : "ate",
                "ator" : "ate",
                "alism" : "al",
                "iveness" : "ive",
                "fulness" : "ful",
                "ousness" : "ous",
                "aliti" : "al",
                "iviti" : "ive",
                "biliti" : "ble",
                "logi" : "log"
            },
    
            step3list = {
                "icate" : "ic",
                "ative" : "",
                "alize" : "al",
                "iciti" : "ic",
                "ical" : "ic",
                "ful" : "",
                "ness" : ""
            },
    
            c = "[^aeiou]",          // consonant
            v = "[aeiouy]",          // vowel
            C = c + "[^aeiouy]*",    // consonant sequence
            V = v + "[aeiou]*",      // vowel sequence
    
            mgr0 = "^(" + C + ")?" + V + C,               // [C]VC... is m>0
            meq1 = "^(" + C + ")?" + V + C + "(" + V + ")?$",  // [C]VC[V] is m=1
            mgr1 = "^(" + C + ")?" + V + C + V + C,       // [C]VCVC... is m>1
            s_v = "^(" + C + ")?" + v;                   // vowel in stem
    
        return function (w) {
            var     stem,
                suffix,
                firstch,
                re,
                re2,
                re3,
                re4,
                origword = w;
    
            if (w.length < 3) { return w; }
    
            firstch = w.substr(0,1);
            if (firstch == "y") {
                w = firstch.toUpperCase() + w.substr(1);
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
                    w = w.replace(re,"");
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
                    else if (re3.test(w)) { re = /.$/; w = w.replace(re,""); }
                    else if (re4.test(w)) { w = w + "e"; }
                }
            }
    
            // Step 1c
            re = /^(.+?)y$/;
            if (re.test(w)) {
                var fp = re.exec(w);
                stem = fp[1];
                re = new RegExp(s_v);
                if (re.test(stem)) { w = stem + "i"; }
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
                w = w.replace(re,"");
            }
    
            // and turn initial Y back to y
    
            if (firstch == "y") {
                w = firstch.toLowerCase() + w.substr(1);
            }
    
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
    
            var section = token.substr( - 1), rules = ruleTable[section];
    
            if (rules) {
                
                for (var i = 0; i < rules.length; i++) {
                    
                 // only apply intact rules to intact tokens
                    if ((intact || !rules[i].intact) && token.substr(0 - rules[i].pattern.length) == rules[i].pattern) {
                        
                        // hack off only as much as the rule indicates
                        var result = token.substr(0, token.length - rules[i].size);
    
                        // if the rules wants us to apply an appendage do so
                        if (rules[i].appendage)
                            result += rules[i].appendage;
    
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
            else
                throw Error('No rules found!');
    
            return token;
        }
    
        var ruleTable = {
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
    
    //////////////////////////////////////////////////////////////////
    //////// MinEditDist (singleton)
    ////////////////////////////////////////////////////////////////

    /**
     * Minimum-Edit-Distance (or Levenshtein distance) is a measure of the similarity 
     * between two strings, the source string and the target string (t). The distance 
     * is the number of deletions, insertions, or substitutions required to transform 
     * the source into the target / avg_string_length<p> 
     * 
     * Adapted from Michael Gilleland's algorithm
     * 
     * @name MinEditDist
     * @class
     * @private
     */
    var MinEditDist = {

        /**
         * @private
         */
        _min3 : function(a,b,c) { // TODO: make private to class

            var min = a;
            if (b < min) min = b;
            if (c < min) min = c;
            return min;
        },

        /**
         * Computes min-edit-distance between 2 string arrays
         * where each array element either matches or does not
         * @private
         */
        _computeRawArray : function(srcArr, trgArr) { // TODO: make private to class

            //log((srcArr)+" "+(trgArr));
            
            var matrix = []; // matrix
            var sI; // ith element of s
            var tJ; // jth element of t
            var cost; // cost

            // Step 1 ----------------------------------------------

            if (srcArr.length == 0) return trgArr.length;

            if (trgArr.length == 0) return srcArr.length;

            //matrix = new var[srcArr.length + 1][trgArr.length + 1];

            // Step 2 ----------------------------------------------

            for (var i = 0; i <= srcArr.length; i++) {
                matrix[i] = [];
                matrix[i][0] = i;
            }

            for (var j = 0; j <= trgArr.length; j++)    
                matrix[0][j] = j;

            // Step 3 ----------------------------------------------

            //String[] srcArr = RiFreeTTSEngine.cleanPhonemes(srcArr);    
            for (var i = 1; i <= srcArr.length; i++)
            {
                sI = srcArr[i - 1];

                // Step 4 --------------------------------------------

                for (var j = 1; j <= trgArr.length; j++)
                {
                    tJ = trgArr[j - 1];

                    // Step 5 ------------------------------------------

                    cost = (sI === tJ) ? 0 : 1;

                    // Step 6 ------------------------------------------
                    matrix[i][j] = _min3 (matrix[i - 1][j] + 1, 
                        matrix[i][j - 1] + 1, 
                        matrix[i - 1][j - 1] + cost);
                }
            }

            // Step 7 ----------------------------------------------

            return matrix[srcArr.length][trgArr.length];
        },

        
        /**
         * Compute min-edit-distance between 2 strings
         * @see MinEditDist#computeAdjusted(java.lang.String,java.lang.String)
         */ 
        computeRaw : function(source, target) { 

            var st = Types.get(source), tt = Types.get(source);
            
            if (st!=tt) throw Error('Unexpected args: '+source+"/"+target);

            if (tt==='array') return _computeRawArray(source, target);
            
            if (!source.length && !target.length) return 0;

            var matrix = []; // matrix
            var sI; // ith character of s
            var tJ; // jth character of t
            var cost; // cost

            // Step 1 ----------------------------------------------
            var sourceLength = source.length;
            var targetLength = target.length;

            if (sourceLength == 0) return targetLength;

            if (targetLength == 0) return sourceLength;

            //matrix = new int[sourceLength + 1][targetLength + 1];

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
                    matrix[i][j] = _min3(matrix[i - 1][j] + 1, 
                        matrix[i][j - 1] + 1, 
                        matrix[i - 1][j - 1] + cost);
                }
            }

            // Step 7 ----------------------------------------------

            return matrix[sourceLength][targetLength];
            
        },//.expects([S,S],[A,A]).returns(N),

        /**
         * Compute min-edit-distance between 2 strings (or 2 arrays of strings) 
         * divided by their average length.
         */ 
        computeAdjusted : function(source, target) {

            
            var st = Types.get(source), tt = Types.get(source);
            if (st===tt) {

                if (tt==='string') {
                    if (!source.length && !target.length) return 0;
                    //log(med.computeRaw(source, target)+'/'+(source.length + target.length));
                    return med.computeRaw(source, target) / (source.length + target.length);
                }
                else if (tt==='array') {
                    if (!source.length && !target.length) return 0;
                    //log(_computeRawArray(source, target)+'/'+(source.length + target.length));
                    return _computeRawArray(source, target) / (source.length + target.length);
                }
            }
            throw Error('Unexpected args: '+source+"/"+target);
            
        }//.expects([S,S],[A,A]).returns(N),
        
    };
    
    //////////////////////////////////////////////////////////////////
    //////// RegexRule 
    ////////////////////////////////////////////////////////////////

    /**
    * @name RegexRule
    * @class
    * @private
    */
    var RegexRule = makeClass();

    RegexRule.prototype = {
        
        constructs : function(regex, offset, suffix) {
            
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
            
            return ((this.suffix != "") && endsWith(word, this.suffix)) ? true : false;
        },
        
        truncate : function(word) {

            return (this.offset == 0) ? word : word.substr(0, word.length - this.offset);
        }
    };
    
    
    
    //////////////////////////////////////////////////////////////////////////////////////
    // adapted from: https://github.com/sole/tween.js
    //////////////////////////////////////////////////////////////////////////////////////    
    
    /**
     * @private
     */
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
        };
    
        this.start = function ( time ) {
    
            if (_parent) 
                _parent._addBehavior( this );
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
    
            if (_parent) _parent._removeBehavior( this );
            return this;
    
        };
    
        this.delay = function ( amount ) {
    
            _delayTime = amount;
            return this;
    
        };
    
        this.easing = function ( easing ) {
    
            _easingFunction = easing;
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
    
            if (_onUpdateCallback !== null ) {
    
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
        };
    
    };

    /**
     * @name RiText_P5
     * @class
     * @private
     */
    var RiText_P5 = makeClass();

    RiText_P5.prototype = {

        constructs : function(p) {
            this.p = p;
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
            this.p.fill.apply(this,arguments);
        },
        
        __stroke : function(r,g,b,a) {
            this.p.stroke.apply(this,arguments);
        },
        
        __background : function(r,g,b,a) {
            this.p.background.apply(this,arguments);
        },

        // actual creation: only called from RiText.createDefaultFont();!
        __createFont : function(fontName, fontSize, leading) { // ignores leading
            
            //log("[P5] Creating font: "+fontName+"-"+fontSize+"/"+leading);
            return this.p.createFont(fontName, fontSize);                
        },

        __rect : function(x,y,w,h) {
            this.p.rect.apply(this,arguments);
        },
        
        __line : function(x1,y1,x2,y2,lw) {
            if (lw) p.strokeWeight(lw);
            this.p.line.apply(this,arguments);
        },
        
        __textFont : function(fontObj) {
            if (Types.get(fontObj)!='object') throw Error("__textFont takes object!");
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
            
            var ascent  =   Math.round(this.p.textAscent()),
                descent =   Math.round(this.p.textDescent()),
                width   =   Math.round(this.p.textWidth(rt.text()));
            
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
    
    ////////////////////////////////// End Classes ///////////////////////////////////

    // TODO: clean this mess up...
    
    var QUESTION_STARTS = ["Was", "What", "When", "Where", "How", "Which", "If", "Who", "Is", "Could", "Might", "Will", "Does", "Why", "Are" ];    
    
    var W_QUESTION_STARTS = ["Was", "What", "When", "Where", "How", "Which", "Why", "Who", "Will"];
    
    var PUNCTUATION_CLASS = /[-[\]{}()*+!?%&.,\\^$|#@<>|+=;:]/g, ONLY_PUNCT = /^[^0-9A-Za-z\s]*$/;
    
    var ALL_PUNCT = /^[-[\]{}()*+!?%&.,\\^$|#@<>|+=;:]+$/g, DeLiM = ':DeLiM:', RiTextCallbacksDisabled = false;
    
    var SP = ' ', N = 'number', S = 'string', O = 'object', A ='array', B = 'boolean', R = 'regexp', E = '', F='function';
    
    var DEFAULT_PLURAL_RULE = new RegexRule("^((\\w+)(-\\w+)*)(\\s((\\w+)(-\\w+)*))*$", 0, "s");
    
    var PLURAL_RULES = [
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
            new RegexRule("^(memorandum|bacterium|curriculum|minimum|"
                + "maximum|referendum|spectrum|phenomenon|criterion)$", 2, "a"),
                new RegexRule("^(appendix|index|matrix)", 2, "ices"),
                new RegexRule("^(stimulus|alumnus)$", 2, "i"),
                new RegexRule(
                    "^(Bantu|Bengalese|Bengali|Beninese|Boche|bonsai|"
                    + "Burmese|Chinese|Congolese|Gabonese|Guyanese|Japanese|Javanese|"
                    + "Lebanese|Maltese|Olympics|Portuguese|Senegalese|Siamese|Singhalese|"
                    + "Sinhalese|Sioux|Sudanese|Swiss|Taiwanese|Togolese|Vietnamese|aircraft|"
                    + "anopheles|apparatus|asparagus|barracks|bellows|bison|bluefish|bob|bourgeois|"
                    + "bream|brill|butterfingers|carp|catfish|chassis|clothes|chub|cod|codfish|"
                    + "coley|contretemps|corps|crawfish|crayfish|crossroads|cuttlefish|dace|dice|"
                    + "dogfish|doings|dory|downstairs|eldest|earnings|economics|electronics|finnan|"
                    + "firstborn|fish|flatfish|flounder|fowl|fry|fries|works|globefish|goldfish|"
                    + "grand|gudgeon|gulden|haddock|hake|halibut|headquarters|herring|hertz|horsepower|"
                    + "goods|hovercraft|hundredweight|ironworks|jackanapes|kilohertz|kurus|kwacha|ling|lungfish|"
                    + "mackerel|means|megahertz|moorfowl|moorgame|mullet|nepalese|offspring|pampas|parr|(pants$)|"
                    + "patois|pekinese|penn'orth|perch|pickerel|pike|pince-nez|plaice|precis|quid|rand|"
                    + "rendezvous|revers|roach|roux|salmon|samurai|series|seychelles|seychellois|shad|"
                    + "sheep|shellfish|smelt|spacecraft|species|starfish|stockfish|sunfish|superficies|"
                    + "sweepstakes|swordfish|tench|tennis|tope|triceps|trout|tuna|tunafish|tunny|turbot|trousers|"
                    + "undersigned|veg|waterfowl|waterworks|waxworks|whiting|wildfowl|woodworm|"
                    + "yen|aries|pisces|forceps|lieder|jeans|physics|mathematics|news|odds|politics|remains|"
                    + "surroundings|thanks|statistics|goods|aids)$", 0, "", 0) 
            ],
            ANY_STEM = "^((\\w+)(-\\w+)*)(\\s((\\w+)(-\\w+)*))*$",
            CONS = "[bcdfghjklmnpqrstvwxyz]",
            VERBAL_PREFIX = "((be|with|pre|un|over|re|mis|under|out|up|fore|for|counter|co|sub)(-?))",

            AUXILIARIES = [ "do", "have", "be" ],
            MODALS = [ "shall", "would", "may", "might", "ought", "should" ],
            // also used by pluralizer
            SYMBOLS = [ "!", "?", "$", "%", "*", "+", "-", "=" ],

            ING_FORM_RULES = [ 
                                  new RegexRule(CONS + "ie$", 2, "ying", 1),
                                  new RegexRule("[^ie]e$", 1, "ing", 1),
                                  new RegexRule("^bog-down$", 5, "ging-down", 0),
                                  new RegexRule("^chivy$", 1, "vying", 0),
                                  new RegexRule("^gen-up$", 3, "ning-up", 0),
                                  new RegexRule("^trek$", 1, "cking", 0), new RegexRule("^ko$", 0, "'ing", 0),
                                  new RegexRule("^(age|be)$", 0, "ing", 0), new RegexRule("(ibe)$", 1, "ing", 0) 
                              ],

        PAST_PARTICIPLE_RULES = [
                                                            new RegexRule("e$", 0, "d", 1),
        new RegexRule(CONS + "y$", 1, "ied", 1),
        new RegexRule("^" + VERBAL_PREFIX + "?(bring)$", 3, "ought", 0),
        new RegexRule(
            "^"
        + VERBAL_PREFIX
        + "?(take|rise|strew|blow|draw|drive|know|give|"
        + "arise|gnaw|grave|grow|hew|know|mow|see|sew|throw|prove|saw|quartersaw|"
        + "partake|sake|shake|shew|show|shrive|sightsee|strew|strive)$",
        0, "n", 0),
        new RegexRule("^" + VERBAL_PREFIX + "?[gd]o$", 0, "ne", 1),
        new RegexRule("^(beat|eat|be|fall)$", 0, "en", 0),
        new RegexRule("^(have)$", 2, "d", 0),
        new RegexRule("^" + VERBAL_PREFIX + "?bid$", 0, "den", 0),
        new RegexRule("^" + VERBAL_PREFIX + "?[lps]ay$", 1, "id", 1),
        new RegexRule("^behave$", 0, "d", 0),
        new RegexRule("^" + VERBAL_PREFIX + "?have$", 2, "d", 1),
        new RegexRule("(sink|slink|drink)$", 3, "unk", 0),
        new RegexRule("(([sfc][twlp]?r?|w?r)ing|hang)$", 3, "ung", 0),
        new RegexRule("^" + VERBAL_PREFIX + "?(shear|swear|bear|wear|tear)$", 3, "orn",
        0),
        new RegexRule("^" + VERBAL_PREFIX + "?(bend|spend|send|lend)$", 1, "t", 0),
        new RegexRule("^" + VERBAL_PREFIX + "?(weep|sleep|sweep|creep|keep$)$", 2,
        "pt", 0),
        new RegexRule("^" + VERBAL_PREFIX + "?(sell|tell)$", 3, "old", 0),
        new RegexRule("^(outfight|beseech)$", 4, "ought", 0),
        new RegexRule("^bethink$", 3, "ought", 0),
        new RegexRule("^buy$", 2, "ought", 0),
        new RegexRule("^aby$", 1, "ought", 0),
        new RegexRule("^tarmac", 0, "ked", 0),
        new RegexRule("^abide$", 3, "ode", 0),
        new RegexRule("^" + VERBAL_PREFIX + "?(speak|(a?)wake|break)$", 3, "oken", 0),
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
        new RegexRule(
            "^"
        + VERBAL_PREFIX
        + "?(cast|thrust|typeset|cut|bid|upset|wet|bet|cut|hit|hurt|inset|let|cost|burst|beat|beset|set|upset|hit|offset|put|quit|"
        + "wed|typeset|wed|spread|split|slit|read|run|shut|shed)$", 0,
        "", 0) ],
        
        PAST_TENSE_RULES = [
                            new RegexRule("^(reduce)$", 0, "d", 0),
        new RegexRule("e$", 0, "d", 1),
        new RegexRule("^" + VERBAL_PREFIX + "?[pls]ay$", 1, "id", 1),
        new RegexRule(CONS + "y$", 1, "ied", 1),
        new RegexRule("^(fling|cling|hang)$", 3, "ung", 0),
        new RegexRule("(([sfc][twlp]?r?|w?r)ing)$", 3, "ang", 1),
        new RegexRule("^" + VERBAL_PREFIX + "?(bend|spend|send|lend|spend)$", 1, "t", 0),
        new RegexRule("^" + VERBAL_PREFIX + "?lie$", 2, "ay", 0),
        new RegexRule("^" + VERBAL_PREFIX + "?(weep|sleep|sweep|creep|keep)$", 2, "pt",
        0),
        new RegexRule("^" + VERBAL_PREFIX + "?(sell|tell)$", 3, "old", 0),
        new RegexRule("^" + VERBAL_PREFIX + "?do$", 1, "id", 0),
        new RegexRule("^" + VERBAL_PREFIX + "?dig$", 2, "ug", 0),
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
        new RegexRule("^" + VERBAL_PREFIX + "?run$", 2, "an", 0),
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
        new RegexRule("^" + VERBAL_PREFIX
            + "?(cast|thrust|typeset|cut|bid|upset|wet|bet|cut|hit|hurt|inset|"
            + "let|cost|burst|beat|beset|set|upset|offset|put|quit|wed|typeset|"
            + "wed|spread|split|slit|read|run|shut|shed|lay)$", 0, "", 0) ],

        PRESENT_TENSE_RULES = [ new RegexRule("^aby$", 0, "es", 0),
new RegexRule("^bog-down$", 5, "s-down", 0),
new RegexRule("^chivy$", 1, "vies", 0),
new RegexRule("^gen-up$", 3, "s-up", 0),
new RegexRule("^prologue$", 3, "gs", 0),
new RegexRule("^picknic$", 0, "ks", 0), new RegexRule("^ko$", 0, "'s", 0),
new RegexRule("[osz]$", 0, "es", 1), new RegexRule("^have$", 2, "s", 0),
new RegexRule(CONS + "y$", 1, "ies", 1), new RegexRule("^be$", 2, "is"),
new RegexRule("([zsx]|ch|sh)$", 0, "es", 1) ],

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
        defaultRule : new RegexRule(ANY_STEM, 0, "ed", 2),
        rules : PAST_PARTICIPLE_RULES,
        doubling : false
    },

    PRESENT_PARTICIPLE_RULESET = {
        name : "ING_FORM",
        defaultRule : new RegexRule(ANY_STEM, 0, "ing", 2),
        rules : ING_FORM_RULES,
        doubling : false
    },

    PAST_TENSE_RULESET = {
        name : "PAST_TENSE",
        defaultRule : new RegexRule(ANY_STEM, 0, "ed", 2),
        rules : PAST_TENSE_RULES,
        doubling : false
    },

    PRESENT_TENSE_RULESET = {
        name : "PRESENT_TENSE",
        defaultRule : new RegexRule(ANY_STEM, 0, "s", 2),
        rules : PRESENT_TENSE_RULES,
        doubling : true
    };

    //////////////////////////////////////////////////////////////////////////////////
    //////// Utility functions 
    //////////////////////////////////////////////////////////////////////////////////
        
    function isNum(n) {
        
      return !isNaN(parseFloat(n)) && isFinite(n);
    }

    // Array Remove - from John Resig (MIT Licensed)
    function remove(array, from, to) {
        
      var rest = array.slice((to || from) + 1 || array.length);
      array.length = from < 0 ? array.length + from : from;
      return array.push.apply(array, rest);
    }
    
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
    
    // Array Insert 
    function insert(array, item, idx) {
        
      array.slice(idx,0,item);
      return array;
    }

    /**
     * @private
     */
    dump = function(obj) {

        var properties = "";
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
    
    function asList(array) {
        
        var s="[";
        for ( var i = 0; i < array.length; i++) {
            var el = array[i];
            if (array[i] instanceof Array)
                el = asList(array[i]);
            s += el;
            if (i < array.length-1) s += ", ";
        }
        return s+"]";
    }

    function isNull(obj) {
        
        return (typeof obj === 'undefined' || obj === null);
    }

    function error(msg) {
        
        (!RiTa.SILENT) && console.trace(this);
        throw Error("[RiTa] " + msg);
    }
    
    function warn() {
        
        if (RiTa.SILENT) return;
        console.warn("[RiTa] ");
        for ( var i = 0; i < arguments.length; i++) {
            console.warn(arguments[i]);
        }
    }
 
    function log() {
        
        if (!RiTa.SILENT && console) {
            console.log("[RiTa] ");
            for ( var i = 0; i < arguments.length; i++) 
                console.log(arguments[i]);
        }
    }

    function strOk(str) {
        
        return (typeof str === 'string' && str.length > 0);
    }

    function trim(str) {
        
        // faster version from: http://blog.stevenlevithan.com/archives/faster-trim-javascript
        return str.replace(/^\s\s*/, '').replace(/\s\s*$/, ''); 
        //return str.replace(/^\s*(\S*(?:\s+\S+)*)\s*$/, "$1");
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

    function replaceAll(theText, replace, withThis) {

        return theText.replace(new RegExp(replace, 'g'), withThis);
    }

    function endsWith(str, ending) { // test this!!!
        
        return str.slice(-ending.length) == ending;
    }
    
    function startsWith(text, substr) {

        return text.slice(0, substr.length) == substr;
        
        //return text.indexOf(substr) == 0;
    }
    
    function equalsIgnoreCase(str1, str2) {

        return (str1.toLowerCase() === str2.toLowerCase());
    }

    function makeClass() { // By John Resig (MIT Licensed)

        return function(args) {
            
            if (this instanceof arguments.callee) {
                
                if (typeof this.constructs == "function") {
                    
                    this.constructs.apply(this, args && args.callee ? args : arguments);
                }
            } 
            else {
                return new arguments.callee(arguments);
            }
        };
    }

    /*
     * Returns the pixel x-offset for the word at 'wordIdx'
     */
    function wordOffsetFor(rt, words, wordIdx) { 

        //log("wordOffset("+words+","+wordIdx+")");

        if (wordIdx < 0 || wordIdx >= words.length)
            throw new Error("Bad wordIdx=" + wordIdx + " for " + words);
        
        rt.g.__pushState();

        var xPos = rt.x;

        if (wordIdx > 0) {
            
            var pre = words.slice(0, wordIdx);
            var preStr = '';
            for ( var i = 0; i < pre.length; i++) {
                preStr += pre[i] + ' ';
            }

            var tw = rt.g.__textWidth(rt._font, preStr);

            //log("x="+xPos+" pre='"+preStr+"' tw=" + tw); 

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
    
    function handleLeading(fontObj, rts, startY)  {
        
      if (!rts || !rts.length) return;

      fontObj = fontObj || RiText._getDefaultFont();
      
      var nextHeight = startY;
      rts[0].font(fontObj);
      for ( var i = 0; i < rts.length; i++) {
          
        if (fontObj) rts[i].font(fontObj); // set the font
        rts[i].y = nextHeight; // adjust y-pos
        nextHeight += fontObj.leading;
      }
      
      return rts;
    };
    
    function disposeOne(toDelete) {
        
        removeFromArray(RiText.instances, toDelete);
        
        if (toDelete) {
            delete(toDelete._rs);
            delete(toDelete);
        }

    };    

    function disposeArray(toDelete) {
        
        for ( var i = 0; i < toDelete.length; i++) {
            
            disposeOne(toDelete[i]);
        }
    };
    
    function parseColor() {
   
        var a = arguments, len = a.length;
        
        //log('parseColor:'+len);
        
        var color = { r: 0, g: 0, b: 0, a: 255 };

        if (!len) return color;

        if (len == 1 && Types.get(a[0])==='array') {
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
    };
    
    
    function addSpaces(str, num) {
        
        for ( var i = 0; i < num; i++)
            str += " ";
        return str;
    };
    
    function removeFromArray(items, element)
    {
        while (items.indexOf(element) !== -1) {
            items.splice(items.indexOf(element), 1);
        }
    }
    
    // make a sub-case of createLinesByCharCount() ?
    function createLinesByCharCountFromArray(txtArr, startX, startY, fontObj) {

        //log('createLinesByCharCountFromArray('+txtArr.length+','+startX+','+startY+','+maxCharsPerLine+','+fontObj+')');

        fontObj = fontObj || RiText._getDefaultFont();

        var rts = [];
        for ( var i = 0; i < txtArr.length; i++) {
            //log(i+")"+txtArr[i]);
            rts.push(new RiText(txtArr[i], startX, startY, fontObj));
        }

        if (rts.length < 1) return [];

        return handleLeading(fontObj, rts, startY);
    };
    
    // ///////////////////////////// End Functions ////////////////////////////////////

    /*if (window.requestAnimationFrame) { // not used at moment
        
        window.requestAnimationFrame = (function () {
            return window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            window.oRequestAnimationFrame ||
            window.msRequestAnimationFrame ||
            function ( callback,element) {
                window.setTimeout(callback, 1000 / RiText.frameRate); // Fallback timeout
            };
        })();
    }*/
    
    /////////////////////////////////////////////////////////////////////////////////////////
    
    var hasProcessing = (typeof Processing !== 'undefined');
    
    if (hasProcessing) {

        Processing.registerLibrary("RiTa", {
            
            //log("Processing.registerLibrary()");
            p : null, 
            
            init : function(obj) {
              //log("Processing.registerLibrary.init: ");
            },
        
            attach : function(p5) {
                p = p5;
                //log("Processing.registerLibrary.attach");
                RiText.renderer = new RiText_P5(p5);
            },
            
            detach : function(p5) {
                //log("Processing.registerLibrary.detach");
            }
            
            //exports : [] // export global function names?
        })
    }
    else {
        
        var cnv = document.getElementsByTagName("canvas")[0];
        try {
            var context2d = cnv.getContext("2d");
            RiText.renderer = new RiText_Canvas(context2d);
        }
        catch(e) {
            //console.warn("[RiTa] No object w' name='canvas' in DOM, renderer will be unavailable");
        }
    }
    
    console && console.log("[INFO] RiTa.version ["+RiTa.VERSION+"]");
    
    /////////////////////////////////////////////////////////////////////////////////////////
    // Core RiTa objects (in global namespace)
    /////////////////////////////////////////////////////////////////////////////////////////
    
    window.RiTa = RiTa;
    window.RiString = RiString;
    window.RiLexicon = RiLexicon;
    window.RiGrammar = RiGrammar;
    window.RiMarkov = RiMarkov;
    window.RiText = RiText;
    
    RiTa.p5Compatible(true); // TODO: pick a default? false...
    
})(window);

