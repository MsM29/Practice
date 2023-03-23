(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
var charenc = {
  // UTF-8 encoding
  utf8: {
    // Convert a string to a byte array
    stringToBytes: function(str) {
      return charenc.bin.stringToBytes(unescape(encodeURIComponent(str)));
    },

    // Convert a byte array to a string
    bytesToString: function(bytes) {
      return decodeURIComponent(escape(charenc.bin.bytesToString(bytes)));
    }
  },

  // Binary encoding
  bin: {
    // Convert a string to a byte array
    stringToBytes: function(str) {
      for (var bytes = [], i = 0; i < str.length; i++)
        bytes.push(str.charCodeAt(i) & 0xFF);
      return bytes;
    },

    // Convert a byte array to a string
    bytesToString: function(bytes) {
      for (var str = [], i = 0; i < bytes.length; i++)
        str.push(String.fromCharCode(bytes[i]));
      return str.join('');
    }
  }
};

module.exports = charenc;

},{}],2:[function(require,module,exports){
(function() {
  var base64map
      = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/',

  crypt = {
    // Bit-wise rotation left
    rotl: function(n, b) {
      return (n << b) | (n >>> (32 - b));
    },

    // Bit-wise rotation right
    rotr: function(n, b) {
      return (n << (32 - b)) | (n >>> b);
    },

    // Swap big-endian to little-endian and vice versa
    endian: function(n) {
      // If number given, swap endian
      if (n.constructor == Number) {
        return crypt.rotl(n, 8) & 0x00FF00FF | crypt.rotl(n, 24) & 0xFF00FF00;
      }

      // Else, assume array and swap all items
      for (var i = 0; i < n.length; i++)
        n[i] = crypt.endian(n[i]);
      return n;
    },

    // Generate an array of any length of random bytes
    randomBytes: function(n) {
      for (var bytes = []; n > 0; n--)
        bytes.push(Math.floor(Math.random() * 256));
      return bytes;
    },

    // Convert a byte array to big-endian 32-bit words
    bytesToWords: function(bytes) {
      for (var words = [], i = 0, b = 0; i < bytes.length; i++, b += 8)
        words[b >>> 5] |= bytes[i] << (24 - b % 32);
      return words;
    },

    // Convert big-endian 32-bit words to a byte array
    wordsToBytes: function(words) {
      for (var bytes = [], b = 0; b < words.length * 32; b += 8)
        bytes.push((words[b >>> 5] >>> (24 - b % 32)) & 0xFF);
      return bytes;
    },

    // Convert a byte array to a hex string
    bytesToHex: function(bytes) {
      for (var hex = [], i = 0; i < bytes.length; i++) {
        hex.push((bytes[i] >>> 4).toString(16));
        hex.push((bytes[i] & 0xF).toString(16));
      }
      return hex.join('');
    },

    // Convert a hex string to a byte array
    hexToBytes: function(hex) {
      for (var bytes = [], c = 0; c < hex.length; c += 2)
        bytes.push(parseInt(hex.substr(c, 2), 16));
      return bytes;
    },

    // Convert a byte array to a base-64 string
    bytesToBase64: function(bytes) {
      for (var base64 = [], i = 0; i < bytes.length; i += 3) {
        var triplet = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];
        for (var j = 0; j < 4; j++)
          if (i * 8 + j * 6 <= bytes.length * 8)
            base64.push(base64map.charAt((triplet >>> 6 * (3 - j)) & 0x3F));
          else
            base64.push('=');
      }
      return base64.join('');
    },

    // Convert a base-64 string to a byte array
    base64ToBytes: function(base64) {
      // Remove non-base-64 characters
      base64 = base64.replace(/[^A-Z0-9+\/]/ig, '');

      for (var bytes = [], i = 0, imod4 = 0; i < base64.length;
          imod4 = ++i % 4) {
        if (imod4 == 0) continue;
        bytes.push(((base64map.indexOf(base64.charAt(i - 1))
            & (Math.pow(2, -2 * imod4 + 8) - 1)) << (imod4 * 2))
            | (base64map.indexOf(base64.charAt(i)) >>> (6 - imod4 * 2)));
      }
      return bytes;
    }
  };

  module.exports = crypt;
})();

},{}],3:[function(require,module,exports){
/*!
 * Determine if an object is a Buffer
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */

// The _isBuffer check is for Safari 5-7 support, because it's missing
// Object.prototype.constructor. Remove this eventually
module.exports = function (obj) {
  return obj != null && (isBuffer(obj) || isSlowBuffer(obj) || !!obj._isBuffer)
}

function isBuffer (obj) {
  return !!obj.constructor && typeof obj.constructor.isBuffer === 'function' && obj.constructor.isBuffer(obj)
}

// For Node v0.10 support. Remove this eventually.
function isSlowBuffer (obj) {
  return typeof obj.readFloatLE === 'function' && typeof obj.slice === 'function' && isBuffer(obj.slice(0, 0))
}

},{}],4:[function(require,module,exports){
(function(){
  var crypt = require('crypt'),
      utf8 = require('charenc').utf8,
      isBuffer = require('is-buffer'),
      bin = require('charenc').bin,

  // The core
  md5 = function (message, options) {
    // Convert to byte array
    if (message.constructor == String)
      if (options && options.encoding === 'binary')
        message = bin.stringToBytes(message);
      else
        message = utf8.stringToBytes(message);
    else if (isBuffer(message))
      message = Array.prototype.slice.call(message, 0);
    else if (!Array.isArray(message) && message.constructor !== Uint8Array)
      message = message.toString();
    // else, assume byte array already

    var m = crypt.bytesToWords(message),
        l = message.length * 8,
        a =  1732584193,
        b = -271733879,
        c = -1732584194,
        d =  271733878;

    // Swap endian
    for (var i = 0; i < m.length; i++) {
      m[i] = ((m[i] <<  8) | (m[i] >>> 24)) & 0x00FF00FF |
             ((m[i] << 24) | (m[i] >>>  8)) & 0xFF00FF00;
    }

    // Padding
    m[l >>> 5] |= 0x80 << (l % 32);
    m[(((l + 64) >>> 9) << 4) + 14] = l;

    // Method shortcuts
    var FF = md5._ff,
        GG = md5._gg,
        HH = md5._hh,
        II = md5._ii;

    for (var i = 0; i < m.length; i += 16) {

      var aa = a,
          bb = b,
          cc = c,
          dd = d;

      a = FF(a, b, c, d, m[i+ 0],  7, -680876936);
      d = FF(d, a, b, c, m[i+ 1], 12, -389564586);
      c = FF(c, d, a, b, m[i+ 2], 17,  606105819);
      b = FF(b, c, d, a, m[i+ 3], 22, -1044525330);
      a = FF(a, b, c, d, m[i+ 4],  7, -176418897);
      d = FF(d, a, b, c, m[i+ 5], 12,  1200080426);
      c = FF(c, d, a, b, m[i+ 6], 17, -1473231341);
      b = FF(b, c, d, a, m[i+ 7], 22, -45705983);
      a = FF(a, b, c, d, m[i+ 8],  7,  1770035416);
      d = FF(d, a, b, c, m[i+ 9], 12, -1958414417);
      c = FF(c, d, a, b, m[i+10], 17, -42063);
      b = FF(b, c, d, a, m[i+11], 22, -1990404162);
      a = FF(a, b, c, d, m[i+12],  7,  1804603682);
      d = FF(d, a, b, c, m[i+13], 12, -40341101);
      c = FF(c, d, a, b, m[i+14], 17, -1502002290);
      b = FF(b, c, d, a, m[i+15], 22,  1236535329);

      a = GG(a, b, c, d, m[i+ 1],  5, -165796510);
      d = GG(d, a, b, c, m[i+ 6],  9, -1069501632);
      c = GG(c, d, a, b, m[i+11], 14,  643717713);
      b = GG(b, c, d, a, m[i+ 0], 20, -373897302);
      a = GG(a, b, c, d, m[i+ 5],  5, -701558691);
      d = GG(d, a, b, c, m[i+10],  9,  38016083);
      c = GG(c, d, a, b, m[i+15], 14, -660478335);
      b = GG(b, c, d, a, m[i+ 4], 20, -405537848);
      a = GG(a, b, c, d, m[i+ 9],  5,  568446438);
      d = GG(d, a, b, c, m[i+14],  9, -1019803690);
      c = GG(c, d, a, b, m[i+ 3], 14, -187363961);
      b = GG(b, c, d, a, m[i+ 8], 20,  1163531501);
      a = GG(a, b, c, d, m[i+13],  5, -1444681467);
      d = GG(d, a, b, c, m[i+ 2],  9, -51403784);
      c = GG(c, d, a, b, m[i+ 7], 14,  1735328473);
      b = GG(b, c, d, a, m[i+12], 20, -1926607734);

      a = HH(a, b, c, d, m[i+ 5],  4, -378558);
      d = HH(d, a, b, c, m[i+ 8], 11, -2022574463);
      c = HH(c, d, a, b, m[i+11], 16,  1839030562);
      b = HH(b, c, d, a, m[i+14], 23, -35309556);
      a = HH(a, b, c, d, m[i+ 1],  4, -1530992060);
      d = HH(d, a, b, c, m[i+ 4], 11,  1272893353);
      c = HH(c, d, a, b, m[i+ 7], 16, -155497632);
      b = HH(b, c, d, a, m[i+10], 23, -1094730640);
      a = HH(a, b, c, d, m[i+13],  4,  681279174);
      d = HH(d, a, b, c, m[i+ 0], 11, -358537222);
      c = HH(c, d, a, b, m[i+ 3], 16, -722521979);
      b = HH(b, c, d, a, m[i+ 6], 23,  76029189);
      a = HH(a, b, c, d, m[i+ 9],  4, -640364487);
      d = HH(d, a, b, c, m[i+12], 11, -421815835);
      c = HH(c, d, a, b, m[i+15], 16,  530742520);
      b = HH(b, c, d, a, m[i+ 2], 23, -995338651);

      a = II(a, b, c, d, m[i+ 0],  6, -198630844);
      d = II(d, a, b, c, m[i+ 7], 10,  1126891415);
      c = II(c, d, a, b, m[i+14], 15, -1416354905);
      b = II(b, c, d, a, m[i+ 5], 21, -57434055);
      a = II(a, b, c, d, m[i+12],  6,  1700485571);
      d = II(d, a, b, c, m[i+ 3], 10, -1894986606);
      c = II(c, d, a, b, m[i+10], 15, -1051523);
      b = II(b, c, d, a, m[i+ 1], 21, -2054922799);
      a = II(a, b, c, d, m[i+ 8],  6,  1873313359);
      d = II(d, a, b, c, m[i+15], 10, -30611744);
      c = II(c, d, a, b, m[i+ 6], 15, -1560198380);
      b = II(b, c, d, a, m[i+13], 21,  1309151649);
      a = II(a, b, c, d, m[i+ 4],  6, -145523070);
      d = II(d, a, b, c, m[i+11], 10, -1120210379);
      c = II(c, d, a, b, m[i+ 2], 15,  718787259);
      b = II(b, c, d, a, m[i+ 9], 21, -343485551);

      a = (a + aa) >>> 0;
      b = (b + bb) >>> 0;
      c = (c + cc) >>> 0;
      d = (d + dd) >>> 0;
    }

    return crypt.endian([a, b, c, d]);
  };

  // Auxiliary functions
  md5._ff  = function (a, b, c, d, x, s, t) {
    var n = a + (b & c | ~b & d) + (x >>> 0) + t;
    return ((n << s) | (n >>> (32 - s))) + b;
  };
  md5._gg  = function (a, b, c, d, x, s, t) {
    var n = a + (b & d | c & ~d) + (x >>> 0) + t;
    return ((n << s) | (n >>> (32 - s))) + b;
  };
  md5._hh  = function (a, b, c, d, x, s, t) {
    var n = a + (b ^ c ^ d) + (x >>> 0) + t;
    return ((n << s) | (n >>> (32 - s))) + b;
  };
  md5._ii  = function (a, b, c, d, x, s, t) {
    var n = a + (c ^ (b | ~d)) + (x >>> 0) + t;
    return ((n << s) | (n >>> (32 - s))) + b;
  };

  // Package private blocksize
  md5._blocksize = 16;
  md5._digestsize = 16;

  module.exports = function (message, options) {
    if (message === undefined || message === null)
      throw new Error('Illegal argument ' + message);

    var digestbytes = crypt.wordsToBytes(md5(message, options));
    return options && options.asBytes ? digestbytes :
        options && options.asString ? bin.bytesToString(digestbytes) :
        crypt.bytesToHex(digestbytes);
  };

})();

},{"charenc":1,"crypt":2,"is-buffer":3}],5:[function(require,module,exports){
const md5 = require('md5');

// функция отправляет данные в виде json с помощью post
async function sendData(data) {
    return await fetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: data,
    });
}

// из формы достаются данные и преобразуются в json для отправки
function serializeForm(form) {
    const { elements } = form;
    const array = Array.from(elements);

    return JSON.stringify({
        login: array[0].value,
        password: array[1].value,
    });
}

// функция хеширования
function hashData(dataJSON) {
    let parseDate = JSON.parse(dataJSON);
    const hash = md5(parseDate.password);
    parseDate.password = hash;
    return JSON.stringify(parseDate);
}

// обработка ответа от сервера
function inputResult(responseFromServer) {
    if (responseFromServer === 'success_auth') {
        alert('Успешная авторизация!');
    } else if (responseFromServer === 'wrong_password') {
        document.getElementById('warning').innerHTML = 'Неверный пароль';
    } else {
        document.getElementById('warning').innerHTML = 'Пользователя не существует';
    }
}

// обработчик события submit
async function handleSubmit(event) {
    //прерываем автоматическую передачу данных из формы
    event.preventDefault();

    const dataJson = serializeForm(event.target);
    const hashJSON = hashData(dataJson);

    //отправка данных
    const response = await sendData(hashJSON);

    let responseFromServer = (await response.text()).toString();
    inputResult(responseFromServer);
}

const form = document.getElementById('login-form');
// начинаем прослушивать событие отправки данных из формы
form.addEventListener('submit', handleSubmit);

},{"md5":4}]},{},[5])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy5udm0vdmVyc2lvbnMvbm9kZS92MTkuNy4wL2xpYi9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiLi4vLi4vbm9kZV9tb2R1bGVzL2NoYXJlbmMvY2hhcmVuYy5qcyIsIi4uLy4uL25vZGVfbW9kdWxlcy9jcnlwdC9jcnlwdC5qcyIsIi4uLy4uL25vZGVfbW9kdWxlcy9pcy1idWZmZXIvaW5kZXguanMiLCIuLi8uLi9ub2RlX21vZHVsZXMvbWQ1L21kNS5qcyIsInN1Ym1pdEhhc2guanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCJ2YXIgY2hhcmVuYyA9IHtcbiAgLy8gVVRGLTggZW5jb2RpbmdcbiAgdXRmODoge1xuICAgIC8vIENvbnZlcnQgYSBzdHJpbmcgdG8gYSBieXRlIGFycmF5XG4gICAgc3RyaW5nVG9CeXRlczogZnVuY3Rpb24oc3RyKSB7XG4gICAgICByZXR1cm4gY2hhcmVuYy5iaW4uc3RyaW5nVG9CeXRlcyh1bmVzY2FwZShlbmNvZGVVUklDb21wb25lbnQoc3RyKSkpO1xuICAgIH0sXG5cbiAgICAvLyBDb252ZXJ0IGEgYnl0ZSBhcnJheSB0byBhIHN0cmluZ1xuICAgIGJ5dGVzVG9TdHJpbmc6IGZ1bmN0aW9uKGJ5dGVzKSB7XG4gICAgICByZXR1cm4gZGVjb2RlVVJJQ29tcG9uZW50KGVzY2FwZShjaGFyZW5jLmJpbi5ieXRlc1RvU3RyaW5nKGJ5dGVzKSkpO1xuICAgIH1cbiAgfSxcblxuICAvLyBCaW5hcnkgZW5jb2RpbmdcbiAgYmluOiB7XG4gICAgLy8gQ29udmVydCBhIHN0cmluZyB0byBhIGJ5dGUgYXJyYXlcbiAgICBzdHJpbmdUb0J5dGVzOiBmdW5jdGlvbihzdHIpIHtcbiAgICAgIGZvciAodmFyIGJ5dGVzID0gW10sIGkgPSAwOyBpIDwgc3RyLmxlbmd0aDsgaSsrKVxuICAgICAgICBieXRlcy5wdXNoKHN0ci5jaGFyQ29kZUF0KGkpICYgMHhGRik7XG4gICAgICByZXR1cm4gYnl0ZXM7XG4gICAgfSxcblxuICAgIC8vIENvbnZlcnQgYSBieXRlIGFycmF5IHRvIGEgc3RyaW5nXG4gICAgYnl0ZXNUb1N0cmluZzogZnVuY3Rpb24oYnl0ZXMpIHtcbiAgICAgIGZvciAodmFyIHN0ciA9IFtdLCBpID0gMDsgaSA8IGJ5dGVzLmxlbmd0aDsgaSsrKVxuICAgICAgICBzdHIucHVzaChTdHJpbmcuZnJvbUNoYXJDb2RlKGJ5dGVzW2ldKSk7XG4gICAgICByZXR1cm4gc3RyLmpvaW4oJycpO1xuICAgIH1cbiAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBjaGFyZW5jO1xuIiwiKGZ1bmN0aW9uKCkge1xuICB2YXIgYmFzZTY0bWFwXG4gICAgICA9ICdBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWmFiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6MDEyMzQ1Njc4OSsvJyxcblxuICBjcnlwdCA9IHtcbiAgICAvLyBCaXQtd2lzZSByb3RhdGlvbiBsZWZ0XG4gICAgcm90bDogZnVuY3Rpb24obiwgYikge1xuICAgICAgcmV0dXJuIChuIDw8IGIpIHwgKG4gPj4+ICgzMiAtIGIpKTtcbiAgICB9LFxuXG4gICAgLy8gQml0LXdpc2Ugcm90YXRpb24gcmlnaHRcbiAgICByb3RyOiBmdW5jdGlvbihuLCBiKSB7XG4gICAgICByZXR1cm4gKG4gPDwgKDMyIC0gYikpIHwgKG4gPj4+IGIpO1xuICAgIH0sXG5cbiAgICAvLyBTd2FwIGJpZy1lbmRpYW4gdG8gbGl0dGxlLWVuZGlhbiBhbmQgdmljZSB2ZXJzYVxuICAgIGVuZGlhbjogZnVuY3Rpb24obikge1xuICAgICAgLy8gSWYgbnVtYmVyIGdpdmVuLCBzd2FwIGVuZGlhblxuICAgICAgaWYgKG4uY29uc3RydWN0b3IgPT0gTnVtYmVyKSB7XG4gICAgICAgIHJldHVybiBjcnlwdC5yb3RsKG4sIDgpICYgMHgwMEZGMDBGRiB8IGNyeXB0LnJvdGwobiwgMjQpICYgMHhGRjAwRkYwMDtcbiAgICAgIH1cblxuICAgICAgLy8gRWxzZSwgYXNzdW1lIGFycmF5IGFuZCBzd2FwIGFsbCBpdGVtc1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBuLmxlbmd0aDsgaSsrKVxuICAgICAgICBuW2ldID0gY3J5cHQuZW5kaWFuKG5baV0pO1xuICAgICAgcmV0dXJuIG47XG4gICAgfSxcblxuICAgIC8vIEdlbmVyYXRlIGFuIGFycmF5IG9mIGFueSBsZW5ndGggb2YgcmFuZG9tIGJ5dGVzXG4gICAgcmFuZG9tQnl0ZXM6IGZ1bmN0aW9uKG4pIHtcbiAgICAgIGZvciAodmFyIGJ5dGVzID0gW107IG4gPiAwOyBuLS0pXG4gICAgICAgIGJ5dGVzLnB1c2goTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogMjU2KSk7XG4gICAgICByZXR1cm4gYnl0ZXM7XG4gICAgfSxcblxuICAgIC8vIENvbnZlcnQgYSBieXRlIGFycmF5IHRvIGJpZy1lbmRpYW4gMzItYml0IHdvcmRzXG4gICAgYnl0ZXNUb1dvcmRzOiBmdW5jdGlvbihieXRlcykge1xuICAgICAgZm9yICh2YXIgd29yZHMgPSBbXSwgaSA9IDAsIGIgPSAwOyBpIDwgYnl0ZXMubGVuZ3RoOyBpKyssIGIgKz0gOClcbiAgICAgICAgd29yZHNbYiA+Pj4gNV0gfD0gYnl0ZXNbaV0gPDwgKDI0IC0gYiAlIDMyKTtcbiAgICAgIHJldHVybiB3b3JkcztcbiAgICB9LFxuXG4gICAgLy8gQ29udmVydCBiaWctZW5kaWFuIDMyLWJpdCB3b3JkcyB0byBhIGJ5dGUgYXJyYXlcbiAgICB3b3Jkc1RvQnl0ZXM6IGZ1bmN0aW9uKHdvcmRzKSB7XG4gICAgICBmb3IgKHZhciBieXRlcyA9IFtdLCBiID0gMDsgYiA8IHdvcmRzLmxlbmd0aCAqIDMyOyBiICs9IDgpXG4gICAgICAgIGJ5dGVzLnB1c2goKHdvcmRzW2IgPj4+IDVdID4+PiAoMjQgLSBiICUgMzIpKSAmIDB4RkYpO1xuICAgICAgcmV0dXJuIGJ5dGVzO1xuICAgIH0sXG5cbiAgICAvLyBDb252ZXJ0IGEgYnl0ZSBhcnJheSB0byBhIGhleCBzdHJpbmdcbiAgICBieXRlc1RvSGV4OiBmdW5jdGlvbihieXRlcykge1xuICAgICAgZm9yICh2YXIgaGV4ID0gW10sIGkgPSAwOyBpIDwgYnl0ZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaGV4LnB1c2goKGJ5dGVzW2ldID4+PiA0KS50b1N0cmluZygxNikpO1xuICAgICAgICBoZXgucHVzaCgoYnl0ZXNbaV0gJiAweEYpLnRvU3RyaW5nKDE2KSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gaGV4LmpvaW4oJycpO1xuICAgIH0sXG5cbiAgICAvLyBDb252ZXJ0IGEgaGV4IHN0cmluZyB0byBhIGJ5dGUgYXJyYXlcbiAgICBoZXhUb0J5dGVzOiBmdW5jdGlvbihoZXgpIHtcbiAgICAgIGZvciAodmFyIGJ5dGVzID0gW10sIGMgPSAwOyBjIDwgaGV4Lmxlbmd0aDsgYyArPSAyKVxuICAgICAgICBieXRlcy5wdXNoKHBhcnNlSW50KGhleC5zdWJzdHIoYywgMiksIDE2KSk7XG4gICAgICByZXR1cm4gYnl0ZXM7XG4gICAgfSxcblxuICAgIC8vIENvbnZlcnQgYSBieXRlIGFycmF5IHRvIGEgYmFzZS02NCBzdHJpbmdcbiAgICBieXRlc1RvQmFzZTY0OiBmdW5jdGlvbihieXRlcykge1xuICAgICAgZm9yICh2YXIgYmFzZTY0ID0gW10sIGkgPSAwOyBpIDwgYnl0ZXMubGVuZ3RoOyBpICs9IDMpIHtcbiAgICAgICAgdmFyIHRyaXBsZXQgPSAoYnl0ZXNbaV0gPDwgMTYpIHwgKGJ5dGVzW2kgKyAxXSA8PCA4KSB8IGJ5dGVzW2kgKyAyXTtcbiAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCA0OyBqKyspXG4gICAgICAgICAgaWYgKGkgKiA4ICsgaiAqIDYgPD0gYnl0ZXMubGVuZ3RoICogOClcbiAgICAgICAgICAgIGJhc2U2NC5wdXNoKGJhc2U2NG1hcC5jaGFyQXQoKHRyaXBsZXQgPj4+IDYgKiAoMyAtIGopKSAmIDB4M0YpKTtcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICBiYXNlNjQucHVzaCgnPScpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGJhc2U2NC5qb2luKCcnKTtcbiAgICB9LFxuXG4gICAgLy8gQ29udmVydCBhIGJhc2UtNjQgc3RyaW5nIHRvIGEgYnl0ZSBhcnJheVxuICAgIGJhc2U2NFRvQnl0ZXM6IGZ1bmN0aW9uKGJhc2U2NCkge1xuICAgICAgLy8gUmVtb3ZlIG5vbi1iYXNlLTY0IGNoYXJhY3RlcnNcbiAgICAgIGJhc2U2NCA9IGJhc2U2NC5yZXBsYWNlKC9bXkEtWjAtOStcXC9dL2lnLCAnJyk7XG5cbiAgICAgIGZvciAodmFyIGJ5dGVzID0gW10sIGkgPSAwLCBpbW9kNCA9IDA7IGkgPCBiYXNlNjQubGVuZ3RoO1xuICAgICAgICAgIGltb2Q0ID0gKytpICUgNCkge1xuICAgICAgICBpZiAoaW1vZDQgPT0gMCkgY29udGludWU7XG4gICAgICAgIGJ5dGVzLnB1c2goKChiYXNlNjRtYXAuaW5kZXhPZihiYXNlNjQuY2hhckF0KGkgLSAxKSlcbiAgICAgICAgICAgICYgKE1hdGgucG93KDIsIC0yICogaW1vZDQgKyA4KSAtIDEpKSA8PCAoaW1vZDQgKiAyKSlcbiAgICAgICAgICAgIHwgKGJhc2U2NG1hcC5pbmRleE9mKGJhc2U2NC5jaGFyQXQoaSkpID4+PiAoNiAtIGltb2Q0ICogMikpKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBieXRlcztcbiAgICB9XG4gIH07XG5cbiAgbW9kdWxlLmV4cG9ydHMgPSBjcnlwdDtcbn0pKCk7XG4iLCIvKiFcbiAqIERldGVybWluZSBpZiBhbiBvYmplY3QgaXMgYSBCdWZmZXJcbiAqXG4gKiBAYXV0aG9yICAgRmVyb3NzIEFib3VraGFkaWplaCA8aHR0cHM6Ly9mZXJvc3Mub3JnPlxuICogQGxpY2Vuc2UgIE1JVFxuICovXG5cbi8vIFRoZSBfaXNCdWZmZXIgY2hlY2sgaXMgZm9yIFNhZmFyaSA1LTcgc3VwcG9ydCwgYmVjYXVzZSBpdCdzIG1pc3Npbmdcbi8vIE9iamVjdC5wcm90b3R5cGUuY29uc3RydWN0b3IuIFJlbW92ZSB0aGlzIGV2ZW50dWFsbHlcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKG9iaikge1xuICByZXR1cm4gb2JqICE9IG51bGwgJiYgKGlzQnVmZmVyKG9iaikgfHwgaXNTbG93QnVmZmVyKG9iaikgfHwgISFvYmouX2lzQnVmZmVyKVxufVxuXG5mdW5jdGlvbiBpc0J1ZmZlciAob2JqKSB7XG4gIHJldHVybiAhIW9iai5jb25zdHJ1Y3RvciAmJiB0eXBlb2Ygb2JqLmNvbnN0cnVjdG9yLmlzQnVmZmVyID09PSAnZnVuY3Rpb24nICYmIG9iai5jb25zdHJ1Y3Rvci5pc0J1ZmZlcihvYmopXG59XG5cbi8vIEZvciBOb2RlIHYwLjEwIHN1cHBvcnQuIFJlbW92ZSB0aGlzIGV2ZW50dWFsbHkuXG5mdW5jdGlvbiBpc1Nsb3dCdWZmZXIgKG9iaikge1xuICByZXR1cm4gdHlwZW9mIG9iai5yZWFkRmxvYXRMRSA9PT0gJ2Z1bmN0aW9uJyAmJiB0eXBlb2Ygb2JqLnNsaWNlID09PSAnZnVuY3Rpb24nICYmIGlzQnVmZmVyKG9iai5zbGljZSgwLCAwKSlcbn1cbiIsIihmdW5jdGlvbigpe1xyXG4gIHZhciBjcnlwdCA9IHJlcXVpcmUoJ2NyeXB0JyksXHJcbiAgICAgIHV0ZjggPSByZXF1aXJlKCdjaGFyZW5jJykudXRmOCxcclxuICAgICAgaXNCdWZmZXIgPSByZXF1aXJlKCdpcy1idWZmZXInKSxcclxuICAgICAgYmluID0gcmVxdWlyZSgnY2hhcmVuYycpLmJpbixcclxuXHJcbiAgLy8gVGhlIGNvcmVcclxuICBtZDUgPSBmdW5jdGlvbiAobWVzc2FnZSwgb3B0aW9ucykge1xyXG4gICAgLy8gQ29udmVydCB0byBieXRlIGFycmF5XHJcbiAgICBpZiAobWVzc2FnZS5jb25zdHJ1Y3RvciA9PSBTdHJpbmcpXHJcbiAgICAgIGlmIChvcHRpb25zICYmIG9wdGlvbnMuZW5jb2RpbmcgPT09ICdiaW5hcnknKVxyXG4gICAgICAgIG1lc3NhZ2UgPSBiaW4uc3RyaW5nVG9CeXRlcyhtZXNzYWdlKTtcclxuICAgICAgZWxzZVxyXG4gICAgICAgIG1lc3NhZ2UgPSB1dGY4LnN0cmluZ1RvQnl0ZXMobWVzc2FnZSk7XHJcbiAgICBlbHNlIGlmIChpc0J1ZmZlcihtZXNzYWdlKSlcclxuICAgICAgbWVzc2FnZSA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKG1lc3NhZ2UsIDApO1xyXG4gICAgZWxzZSBpZiAoIUFycmF5LmlzQXJyYXkobWVzc2FnZSkgJiYgbWVzc2FnZS5jb25zdHJ1Y3RvciAhPT0gVWludDhBcnJheSlcclxuICAgICAgbWVzc2FnZSA9IG1lc3NhZ2UudG9TdHJpbmcoKTtcclxuICAgIC8vIGVsc2UsIGFzc3VtZSBieXRlIGFycmF5IGFscmVhZHlcclxuXHJcbiAgICB2YXIgbSA9IGNyeXB0LmJ5dGVzVG9Xb3JkcyhtZXNzYWdlKSxcclxuICAgICAgICBsID0gbWVzc2FnZS5sZW5ndGggKiA4LFxyXG4gICAgICAgIGEgPSAgMTczMjU4NDE5MyxcclxuICAgICAgICBiID0gLTI3MTczMzg3OSxcclxuICAgICAgICBjID0gLTE3MzI1ODQxOTQsXHJcbiAgICAgICAgZCA9ICAyNzE3MzM4Nzg7XHJcblxyXG4gICAgLy8gU3dhcCBlbmRpYW5cclxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbS5sZW5ndGg7IGkrKykge1xyXG4gICAgICBtW2ldID0gKChtW2ldIDw8ICA4KSB8IChtW2ldID4+PiAyNCkpICYgMHgwMEZGMDBGRiB8XHJcbiAgICAgICAgICAgICAoKG1baV0gPDwgMjQpIHwgKG1baV0gPj4+ICA4KSkgJiAweEZGMDBGRjAwO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIFBhZGRpbmdcclxuICAgIG1bbCA+Pj4gNV0gfD0gMHg4MCA8PCAobCAlIDMyKTtcclxuICAgIG1bKCgobCArIDY0KSA+Pj4gOSkgPDwgNCkgKyAxNF0gPSBsO1xyXG5cclxuICAgIC8vIE1ldGhvZCBzaG9ydGN1dHNcclxuICAgIHZhciBGRiA9IG1kNS5fZmYsXHJcbiAgICAgICAgR0cgPSBtZDUuX2dnLFxyXG4gICAgICAgIEhIID0gbWQ1Ll9oaCxcclxuICAgICAgICBJSSA9IG1kNS5faWk7XHJcblxyXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBtLmxlbmd0aDsgaSArPSAxNikge1xyXG5cclxuICAgICAgdmFyIGFhID0gYSxcclxuICAgICAgICAgIGJiID0gYixcclxuICAgICAgICAgIGNjID0gYyxcclxuICAgICAgICAgIGRkID0gZDtcclxuXHJcbiAgICAgIGEgPSBGRihhLCBiLCBjLCBkLCBtW2krIDBdLCAgNywgLTY4MDg3NjkzNik7XHJcbiAgICAgIGQgPSBGRihkLCBhLCBiLCBjLCBtW2krIDFdLCAxMiwgLTM4OTU2NDU4Nik7XHJcbiAgICAgIGMgPSBGRihjLCBkLCBhLCBiLCBtW2krIDJdLCAxNywgIDYwNjEwNTgxOSk7XHJcbiAgICAgIGIgPSBGRihiLCBjLCBkLCBhLCBtW2krIDNdLCAyMiwgLTEwNDQ1MjUzMzApO1xyXG4gICAgICBhID0gRkYoYSwgYiwgYywgZCwgbVtpKyA0XSwgIDcsIC0xNzY0MTg4OTcpO1xyXG4gICAgICBkID0gRkYoZCwgYSwgYiwgYywgbVtpKyA1XSwgMTIsICAxMjAwMDgwNDI2KTtcclxuICAgICAgYyA9IEZGKGMsIGQsIGEsIGIsIG1baSsgNl0sIDE3LCAtMTQ3MzIzMTM0MSk7XHJcbiAgICAgIGIgPSBGRihiLCBjLCBkLCBhLCBtW2krIDddLCAyMiwgLTQ1NzA1OTgzKTtcclxuICAgICAgYSA9IEZGKGEsIGIsIGMsIGQsIG1baSsgOF0sICA3LCAgMTc3MDAzNTQxNik7XHJcbiAgICAgIGQgPSBGRihkLCBhLCBiLCBjLCBtW2krIDldLCAxMiwgLTE5NTg0MTQ0MTcpO1xyXG4gICAgICBjID0gRkYoYywgZCwgYSwgYiwgbVtpKzEwXSwgMTcsIC00MjA2Myk7XHJcbiAgICAgIGIgPSBGRihiLCBjLCBkLCBhLCBtW2krMTFdLCAyMiwgLTE5OTA0MDQxNjIpO1xyXG4gICAgICBhID0gRkYoYSwgYiwgYywgZCwgbVtpKzEyXSwgIDcsICAxODA0NjAzNjgyKTtcclxuICAgICAgZCA9IEZGKGQsIGEsIGIsIGMsIG1baSsxM10sIDEyLCAtNDAzNDExMDEpO1xyXG4gICAgICBjID0gRkYoYywgZCwgYSwgYiwgbVtpKzE0XSwgMTcsIC0xNTAyMDAyMjkwKTtcclxuICAgICAgYiA9IEZGKGIsIGMsIGQsIGEsIG1baSsxNV0sIDIyLCAgMTIzNjUzNTMyOSk7XHJcblxyXG4gICAgICBhID0gR0coYSwgYiwgYywgZCwgbVtpKyAxXSwgIDUsIC0xNjU3OTY1MTApO1xyXG4gICAgICBkID0gR0coZCwgYSwgYiwgYywgbVtpKyA2XSwgIDksIC0xMDY5NTAxNjMyKTtcclxuICAgICAgYyA9IEdHKGMsIGQsIGEsIGIsIG1baSsxMV0sIDE0LCAgNjQzNzE3NzEzKTtcclxuICAgICAgYiA9IEdHKGIsIGMsIGQsIGEsIG1baSsgMF0sIDIwLCAtMzczODk3MzAyKTtcclxuICAgICAgYSA9IEdHKGEsIGIsIGMsIGQsIG1baSsgNV0sICA1LCAtNzAxNTU4NjkxKTtcclxuICAgICAgZCA9IEdHKGQsIGEsIGIsIGMsIG1baSsxMF0sICA5LCAgMzgwMTYwODMpO1xyXG4gICAgICBjID0gR0coYywgZCwgYSwgYiwgbVtpKzE1XSwgMTQsIC02NjA0NzgzMzUpO1xyXG4gICAgICBiID0gR0coYiwgYywgZCwgYSwgbVtpKyA0XSwgMjAsIC00MDU1Mzc4NDgpO1xyXG4gICAgICBhID0gR0coYSwgYiwgYywgZCwgbVtpKyA5XSwgIDUsICA1Njg0NDY0MzgpO1xyXG4gICAgICBkID0gR0coZCwgYSwgYiwgYywgbVtpKzE0XSwgIDksIC0xMDE5ODAzNjkwKTtcclxuICAgICAgYyA9IEdHKGMsIGQsIGEsIGIsIG1baSsgM10sIDE0LCAtMTg3MzYzOTYxKTtcclxuICAgICAgYiA9IEdHKGIsIGMsIGQsIGEsIG1baSsgOF0sIDIwLCAgMTE2MzUzMTUwMSk7XHJcbiAgICAgIGEgPSBHRyhhLCBiLCBjLCBkLCBtW2krMTNdLCAgNSwgLTE0NDQ2ODE0NjcpO1xyXG4gICAgICBkID0gR0coZCwgYSwgYiwgYywgbVtpKyAyXSwgIDksIC01MTQwMzc4NCk7XHJcbiAgICAgIGMgPSBHRyhjLCBkLCBhLCBiLCBtW2krIDddLCAxNCwgIDE3MzUzMjg0NzMpO1xyXG4gICAgICBiID0gR0coYiwgYywgZCwgYSwgbVtpKzEyXSwgMjAsIC0xOTI2NjA3NzM0KTtcclxuXHJcbiAgICAgIGEgPSBISChhLCBiLCBjLCBkLCBtW2krIDVdLCAgNCwgLTM3ODU1OCk7XHJcbiAgICAgIGQgPSBISChkLCBhLCBiLCBjLCBtW2krIDhdLCAxMSwgLTIwMjI1NzQ0NjMpO1xyXG4gICAgICBjID0gSEgoYywgZCwgYSwgYiwgbVtpKzExXSwgMTYsICAxODM5MDMwNTYyKTtcclxuICAgICAgYiA9IEhIKGIsIGMsIGQsIGEsIG1baSsxNF0sIDIzLCAtMzUzMDk1NTYpO1xyXG4gICAgICBhID0gSEgoYSwgYiwgYywgZCwgbVtpKyAxXSwgIDQsIC0xNTMwOTkyMDYwKTtcclxuICAgICAgZCA9IEhIKGQsIGEsIGIsIGMsIG1baSsgNF0sIDExLCAgMTI3Mjg5MzM1Myk7XHJcbiAgICAgIGMgPSBISChjLCBkLCBhLCBiLCBtW2krIDddLCAxNiwgLTE1NTQ5NzYzMik7XHJcbiAgICAgIGIgPSBISChiLCBjLCBkLCBhLCBtW2krMTBdLCAyMywgLTEwOTQ3MzA2NDApO1xyXG4gICAgICBhID0gSEgoYSwgYiwgYywgZCwgbVtpKzEzXSwgIDQsICA2ODEyNzkxNzQpO1xyXG4gICAgICBkID0gSEgoZCwgYSwgYiwgYywgbVtpKyAwXSwgMTEsIC0zNTg1MzcyMjIpO1xyXG4gICAgICBjID0gSEgoYywgZCwgYSwgYiwgbVtpKyAzXSwgMTYsIC03MjI1MjE5NzkpO1xyXG4gICAgICBiID0gSEgoYiwgYywgZCwgYSwgbVtpKyA2XSwgMjMsICA3NjAyOTE4OSk7XHJcbiAgICAgIGEgPSBISChhLCBiLCBjLCBkLCBtW2krIDldLCAgNCwgLTY0MDM2NDQ4Nyk7XHJcbiAgICAgIGQgPSBISChkLCBhLCBiLCBjLCBtW2krMTJdLCAxMSwgLTQyMTgxNTgzNSk7XHJcbiAgICAgIGMgPSBISChjLCBkLCBhLCBiLCBtW2krMTVdLCAxNiwgIDUzMDc0MjUyMCk7XHJcbiAgICAgIGIgPSBISChiLCBjLCBkLCBhLCBtW2krIDJdLCAyMywgLTk5NTMzODY1MSk7XHJcblxyXG4gICAgICBhID0gSUkoYSwgYiwgYywgZCwgbVtpKyAwXSwgIDYsIC0xOTg2MzA4NDQpO1xyXG4gICAgICBkID0gSUkoZCwgYSwgYiwgYywgbVtpKyA3XSwgMTAsICAxMTI2ODkxNDE1KTtcclxuICAgICAgYyA9IElJKGMsIGQsIGEsIGIsIG1baSsxNF0sIDE1LCAtMTQxNjM1NDkwNSk7XHJcbiAgICAgIGIgPSBJSShiLCBjLCBkLCBhLCBtW2krIDVdLCAyMSwgLTU3NDM0MDU1KTtcclxuICAgICAgYSA9IElJKGEsIGIsIGMsIGQsIG1baSsxMl0sICA2LCAgMTcwMDQ4NTU3MSk7XHJcbiAgICAgIGQgPSBJSShkLCBhLCBiLCBjLCBtW2krIDNdLCAxMCwgLTE4OTQ5ODY2MDYpO1xyXG4gICAgICBjID0gSUkoYywgZCwgYSwgYiwgbVtpKzEwXSwgMTUsIC0xMDUxNTIzKTtcclxuICAgICAgYiA9IElJKGIsIGMsIGQsIGEsIG1baSsgMV0sIDIxLCAtMjA1NDkyMjc5OSk7XHJcbiAgICAgIGEgPSBJSShhLCBiLCBjLCBkLCBtW2krIDhdLCAgNiwgIDE4NzMzMTMzNTkpO1xyXG4gICAgICBkID0gSUkoZCwgYSwgYiwgYywgbVtpKzE1XSwgMTAsIC0zMDYxMTc0NCk7XHJcbiAgICAgIGMgPSBJSShjLCBkLCBhLCBiLCBtW2krIDZdLCAxNSwgLTE1NjAxOTgzODApO1xyXG4gICAgICBiID0gSUkoYiwgYywgZCwgYSwgbVtpKzEzXSwgMjEsICAxMzA5MTUxNjQ5KTtcclxuICAgICAgYSA9IElJKGEsIGIsIGMsIGQsIG1baSsgNF0sICA2LCAtMTQ1NTIzMDcwKTtcclxuICAgICAgZCA9IElJKGQsIGEsIGIsIGMsIG1baSsxMV0sIDEwLCAtMTEyMDIxMDM3OSk7XHJcbiAgICAgIGMgPSBJSShjLCBkLCBhLCBiLCBtW2krIDJdLCAxNSwgIDcxODc4NzI1OSk7XHJcbiAgICAgIGIgPSBJSShiLCBjLCBkLCBhLCBtW2krIDldLCAyMSwgLTM0MzQ4NTU1MSk7XHJcblxyXG4gICAgICBhID0gKGEgKyBhYSkgPj4+IDA7XHJcbiAgICAgIGIgPSAoYiArIGJiKSA+Pj4gMDtcclxuICAgICAgYyA9IChjICsgY2MpID4+PiAwO1xyXG4gICAgICBkID0gKGQgKyBkZCkgPj4+IDA7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGNyeXB0LmVuZGlhbihbYSwgYiwgYywgZF0pO1xyXG4gIH07XHJcblxyXG4gIC8vIEF1eGlsaWFyeSBmdW5jdGlvbnNcclxuICBtZDUuX2ZmICA9IGZ1bmN0aW9uIChhLCBiLCBjLCBkLCB4LCBzLCB0KSB7XHJcbiAgICB2YXIgbiA9IGEgKyAoYiAmIGMgfCB+YiAmIGQpICsgKHggPj4+IDApICsgdDtcclxuICAgIHJldHVybiAoKG4gPDwgcykgfCAobiA+Pj4gKDMyIC0gcykpKSArIGI7XHJcbiAgfTtcclxuICBtZDUuX2dnICA9IGZ1bmN0aW9uIChhLCBiLCBjLCBkLCB4LCBzLCB0KSB7XHJcbiAgICB2YXIgbiA9IGEgKyAoYiAmIGQgfCBjICYgfmQpICsgKHggPj4+IDApICsgdDtcclxuICAgIHJldHVybiAoKG4gPDwgcykgfCAobiA+Pj4gKDMyIC0gcykpKSArIGI7XHJcbiAgfTtcclxuICBtZDUuX2hoICA9IGZ1bmN0aW9uIChhLCBiLCBjLCBkLCB4LCBzLCB0KSB7XHJcbiAgICB2YXIgbiA9IGEgKyAoYiBeIGMgXiBkKSArICh4ID4+PiAwKSArIHQ7XHJcbiAgICByZXR1cm4gKChuIDw8IHMpIHwgKG4gPj4+ICgzMiAtIHMpKSkgKyBiO1xyXG4gIH07XHJcbiAgbWQ1Ll9paSAgPSBmdW5jdGlvbiAoYSwgYiwgYywgZCwgeCwgcywgdCkge1xyXG4gICAgdmFyIG4gPSBhICsgKGMgXiAoYiB8IH5kKSkgKyAoeCA+Pj4gMCkgKyB0O1xyXG4gICAgcmV0dXJuICgobiA8PCBzKSB8IChuID4+PiAoMzIgLSBzKSkpICsgYjtcclxuICB9O1xyXG5cclxuICAvLyBQYWNrYWdlIHByaXZhdGUgYmxvY2tzaXplXHJcbiAgbWQ1Ll9ibG9ja3NpemUgPSAxNjtcclxuICBtZDUuX2RpZ2VzdHNpemUgPSAxNjtcclxuXHJcbiAgbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAobWVzc2FnZSwgb3B0aW9ucykge1xyXG4gICAgaWYgKG1lc3NhZ2UgPT09IHVuZGVmaW5lZCB8fCBtZXNzYWdlID09PSBudWxsKVxyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0lsbGVnYWwgYXJndW1lbnQgJyArIG1lc3NhZ2UpO1xyXG5cclxuICAgIHZhciBkaWdlc3RieXRlcyA9IGNyeXB0LndvcmRzVG9CeXRlcyhtZDUobWVzc2FnZSwgb3B0aW9ucykpO1xyXG4gICAgcmV0dXJuIG9wdGlvbnMgJiYgb3B0aW9ucy5hc0J5dGVzID8gZGlnZXN0Ynl0ZXMgOlxyXG4gICAgICAgIG9wdGlvbnMgJiYgb3B0aW9ucy5hc1N0cmluZyA/IGJpbi5ieXRlc1RvU3RyaW5nKGRpZ2VzdGJ5dGVzKSA6XHJcbiAgICAgICAgY3J5cHQuYnl0ZXNUb0hleChkaWdlc3RieXRlcyk7XHJcbiAgfTtcclxuXHJcbn0pKCk7XHJcbiIsImNvbnN0IG1kNSA9IHJlcXVpcmUoJ21kNScpO1xuXG4vLyDRhNGD0L3QutGG0LjRjyDQvtGC0L/RgNCw0LLQu9GP0LXRgiDQtNCw0L3QvdGL0LUg0LIg0LLQuNC00LUganNvbiDRgSDQv9C+0LzQvtGJ0YzRjiBwb3N0XG5hc3luYyBmdW5jdGlvbiBzZW5kRGF0YShkYXRhKSB7XG4gICAgcmV0dXJuIGF3YWl0IGZldGNoKCcvbG9naW4nLCB7XG4gICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSxcbiAgICAgICAgYm9keTogZGF0YSxcbiAgICB9KTtcbn1cblxuLy8g0LjQtyDRhNC+0YDQvNGLINC00L7RgdGC0LDRjtGC0YHRjyDQtNCw0L3QvdGL0LUg0Lgg0L/RgNC10L7QsdGA0LDQt9GD0Y7RgtGB0Y8g0LIganNvbiDQtNC70Y8g0L7RgtC/0YDQsNCy0LrQuFxuZnVuY3Rpb24gc2VyaWFsaXplRm9ybShmb3JtKSB7XG4gICAgY29uc3QgeyBlbGVtZW50cyB9ID0gZm9ybTtcbiAgICBjb25zdCBhcnJheSA9IEFycmF5LmZyb20oZWxlbWVudHMpO1xuXG4gICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgbG9naW46IGFycmF5WzBdLnZhbHVlLFxuICAgICAgICBwYXNzd29yZDogYXJyYXlbMV0udmFsdWUsXG4gICAgfSk7XG59XG5cbi8vINGE0YPQvdC60YbQuNGPINGF0LXRiNC40YDQvtCy0LDQvdC40Y9cbmZ1bmN0aW9uIGhhc2hEYXRhKGRhdGFKU09OKSB7XG4gICAgbGV0IHBhcnNlRGF0ZSA9IEpTT04ucGFyc2UoZGF0YUpTT04pO1xuICAgIGNvbnN0IGhhc2ggPSBtZDUocGFyc2VEYXRlLnBhc3N3b3JkKTtcbiAgICBwYXJzZURhdGUucGFzc3dvcmQgPSBoYXNoO1xuICAgIHJldHVybiBKU09OLnN0cmluZ2lmeShwYXJzZURhdGUpO1xufVxuXG4vLyDQvtCx0YDQsNCx0L7RgtC60LAg0L7RgtCy0LXRgtCwINC+0YIg0YHQtdGA0LLQtdGA0LBcbmZ1bmN0aW9uIGlucHV0UmVzdWx0KHJlc3BvbnNlRnJvbVNlcnZlcikge1xuICAgIGlmIChyZXNwb25zZUZyb21TZXJ2ZXIgPT09ICdzdWNjZXNzX2F1dGgnKSB7XG4gICAgICAgIGFsZXJ0KCfQo9GB0L/QtdGI0L3QsNGPINCw0LLRgtC+0YDQuNC30LDRhtC40Y8hJyk7XG4gICAgfSBlbHNlIGlmIChyZXNwb25zZUZyb21TZXJ2ZXIgPT09ICd3cm9uZ19wYXNzd29yZCcpIHtcbiAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3dhcm5pbmcnKS5pbm5lckhUTUwgPSAn0J3QtdCy0LXRgNC90YvQuSDQv9Cw0YDQvtC70YwnO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd3YXJuaW5nJykuaW5uZXJIVE1MID0gJ9Cf0L7Qu9GM0LfQvtCy0LDRgtC10LvRjyDQvdC1INGB0YPRidC10YHRgtCy0YPQtdGCJztcbiAgICB9XG59XG5cbi8vINC+0LHRgNCw0LHQvtGC0YfQuNC6INGB0L7QsdGL0YLQuNGPIHN1Ym1pdFxuYXN5bmMgZnVuY3Rpb24gaGFuZGxlU3VibWl0KGV2ZW50KSB7XG4gICAgLy/Qv9GA0LXRgNGL0LLQsNC10Lwg0LDQstGC0L7QvNCw0YLQuNGH0LXRgdC60YPRjiDQv9C10YDQtdC00LDRh9GDINC00LDQvdC90YvRhSDQuNC3INGE0L7RgNC80YtcbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgY29uc3QgZGF0YUpzb24gPSBzZXJpYWxpemVGb3JtKGV2ZW50LnRhcmdldCk7XG4gICAgY29uc3QgaGFzaEpTT04gPSBoYXNoRGF0YShkYXRhSnNvbik7XG5cbiAgICAvL9C+0YLQv9GA0LDQstC60LAg0LTQsNC90L3Ri9GFXG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBzZW5kRGF0YShoYXNoSlNPTik7XG5cbiAgICBsZXQgcmVzcG9uc2VGcm9tU2VydmVyID0gKGF3YWl0IHJlc3BvbnNlLnRleHQoKSkudG9TdHJpbmcoKTtcbiAgICBpbnB1dFJlc3VsdChyZXNwb25zZUZyb21TZXJ2ZXIpO1xufVxuXG5jb25zdCBmb3JtID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2xvZ2luLWZvcm0nKTtcbi8vINC90LDRh9C40L3QsNC10Lwg0L/RgNC+0YHQu9GD0YjQuNCy0LDRgtGMINGB0L7QsdGL0YLQuNC1INC+0YLQv9GA0LDQstC60Lgg0LTQsNC90L3Ri9GFINC40Lcg0YTQvtGA0LzRi1xuZm9ybS5hZGRFdmVudExpc3RlbmVyKCdzdWJtaXQnLCBoYW5kbGVTdWJtaXQpO1xuIl19
