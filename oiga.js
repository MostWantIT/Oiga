function initOiga(global) {
  function objectAssign(target, varArgs) { // .length of function is 2
    'use strict';
    if (target == null) {
      throw new TypeError('Cannot convert undefined or null to object');
    }

    var to = Object(target);

    for (var index = 1; index < arguments.length; index++) {
      var nextSource = arguments[index];

      if (nextSource != null) { // Skip over if undefined or null
        for (var nextKey in nextSource) {
          // Avoid bugs when hasOwnProperty is shadowed
          if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
            to[nextKey] = nextSource[nextKey];
          }
        }
      }
    }
    return to;
  }

  var defaultExpiryDate = new Date();
  defaultExpiryDate.setMonth(defaultExpiryDate.getMonth() + 2);
  var config = {
    trackingId: '',
    cookieName: 'consentCookie',
    cookieDomain: '.' + window.location.hostname,
    cookieExpires: defaultExpiryDate,
    cookiePath: '/',
    renderBar: true,
    position: 'bottom',
    disableGoogleAnalytics: false,
    texts: {
      accept: 'Accepteren',
      deny: 'Weigeren',
      message: 'Gaat u akkoord met onze <a href="/privacypolicy" data-first="true">privacy policy</a>? En accepteert u onze tracking cookies?',
      dialogLabel: 'Cookie opt-in',
    },
    dataLayer: global.dataLayer || [],
  };

  global.oigaGetConsent = function oigaGetConsent() {
    var cookieName = config.cookieName;
    var consentCookie = global.document.cookie.match(new RegExp('' + cookieName + '=(true|false)'));
    if (!consentCookie) return null;
    return (consentCookie && consentCookie[1] === 'true');
  }

  global.oigaSetConsent = function oigaSetConsent(consent) {
    var expires = config.cookieExpires;
    var domain = config.cookieDomain;
    var path = config.cookiePath;
    var cookieName = config.cookieName;
    var cookie = cookieName + '=' + consent + ';expires=' + expires + ';domain=' + domain + ';path=' + path;
    document.cookie = cookie;

    window.dispatchEvent(new CustomEvent('oigaconsentchange', { detail: { consent: consent } }));
  }

  global.oigaDeleteCookie = function oigaDeleteCookie() {
    var expires = 'Thu, 01 Jan 1970 00:00:01 GMT';
    var domain = config.cookieDomain;
    var path = config.cookiePath;
    var cookieName = config.cookieName;
    var cookie = cookieName + '=false;expires=' + expires + ';domain=' + domain + ';path=' + path;
    document.cookie = cookie;
  }

  global.oigaGiveConsent = function oigaGiveConsent() {
    global.oigaSetConsent(true);
    global.oigaLoadGtag();
  }

  global.oigaWithdrawConsent = function oigaWithdrawConsent() {
    global.oigaSetConsent(false);
    global.location = global.location;
  }

  global.oigaLoadScript = function oigaLoadScript(src, async) {
    var body = document.getElementsByTagName('body')[0];
    var script = document.createElement('script');
    script.src = src;
    script.async = async;
    body.appendChild(script);
  }

  global.oigaLoadGtag = function oigaLoadGtag() {
    if (config.disableGoogleAnalytics) {
      return;
    }
    global.oigaLoadScript('https://www.googletagmanager.com/gtag/js?id=' + config.trackingId, true);
    global.dataLayer = config.dataLayer;
    function gtag() { dataLayer.push(arguments); }
    global.gtag = gtag;
  }

  global.oigaLoadScriptOnConsent = function() {
    var params = arguments;
    if (global.oigaGetConsent()) {
      global.oigaLoadScript.apply(null, params);
    }
    window.addEventListener('oigaconsentchange', function(e) {
      if (e.detail.consent) {
        global.oigaLoadScript.apply(null, params);
      }
    })
  }

  global.oigaShowOptin = function oigaShowOptin() {
    var bar = document.createElement('div');
    var accept = document.createElement('button');
    var deny = document.createElement('button');
    var buttons = document.createElement('div');
    var message = document.createElement('p');

    accept.textContent = config.texts.accept;
    accept.addEventListener('click', function() { global.oigaGiveConsent(); document.body.removeChild(bar); });
    accept.className = 'oiga__button oiga__button--accept';

    deny.textContent = config.texts.deny;
    deny.addEventListener('click', function() { global.oigaSetConsent(false); document.body.removeChild(bar); });
    deny.className = 'oiga__button oiga__button--deny';
    deny.setAttribute('data-last', 'true');

    buttons.appendChild(accept);
    buttons.appendChild(deny);
    buttons.className = 'oiga__buttons';

    message.innerHTML = config.texts.message;
    message.className = 'oiga__message';

    bar.classList.add('oiga');
    if (config.position === 'top') {
      bar.classList.add('oiga--top');
    }
    bar.setAttribute('role', 'dialog');
    bar.setAttribute('aria-label', config.texts.dialogLabel);
    bar.setAttribute('aria-modal', 'true');

    bar.appendChild(message);
    bar.appendChild(buttons);

    document.body.insertBefore(bar, document.body.children[0]);
  }

  // Loop trough the oigaLayer, run the oiga actions and pass the rest
  // to the GA dataLayer.
  for (var i = 0; i < global.oigaLayer.length; i++) {
    // the first parameter is the action
    var action = global.oigaLayer[i];
    // if the action is the optin action we initialise some stuff
    if (action[0] === 'optin') {
      // get the config from the action and store it
      var trackingId = action[1] || '';
      var options = action[2] || {};
      var texts = objectAssign({}, config.texts, options.texts);
      objectAssign(config, options, { texts: texts });
      config.trackingId = trackingId;

      // if consent has not been given or denied show the opt in, else load gtag
      var hasGivenConsent = oigaGetConsent();
      if (hasGivenConsent) {
        global.oigaLoadGtag();
      } else if (hasGivenConsent === null && config.renderBar) {
        global.oigaShowOptin();
      }

      continue;
    }

    if (action[0] === 'loadScript') {
      var options = action[2] || {};
      global.oigaLoadScriptOnConsent(action[1], options.async !== false);
    }

    // store this action for gtag
    config.dataLayer.push(action);
  }

  window.dispatchEvent(new CustomEvent('oigaready', { detail: config }));
}

function domIsReady () {
  var isIe = !(!document.attachEvent || typeof document.attachEvent === "undefined");
  if (isIe) {
    document.attachEvent('onreadystatechange', function() {
      if (document.readyState === 'complete') {
        initOiga(window);
      }
    });
  } else if(document.readyState === 'interactive' || document.readyState === 'complete') {
    // the document is already loaded and it is not old IE
    initOiga(window);
  }
  document.addEventListener('DOMContentLoaded', function() {
    initOiga(window);
  });

}

domIsReady();
