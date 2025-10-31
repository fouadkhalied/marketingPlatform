import { BasePixelCodeGenerator } from "../interface/basePixelGenerator.interface";

export class FacebookPixelCodeGenerator extends BasePixelCodeGenerator {
    getPlatform(): string {
      return "facebook";
    }
  
    generateCode(): string {
      return `<!-- Meta Pixel Code -->
  <script>
  !function(f,b,e,v,n,t,s)
  {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
  n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];
  s.parentNode.insertBefore(t,s)}(window, document,'script',
  'https://connect.facebook.net/en_US/fbevents.js');
  fbq('init', '${this.pixelId}');
  fbq('track', 'PageView');
  </script>
  <noscript><img height="1" width="1" style="display:none"
  src="https://www.facebook.com/tr?id=${this.pixelId}&ev=PageView&noscript=1"
  /></noscript>
  <!-- End Meta Pixel Code -->`;
    }
  }
  
  // Instagram Pixel (uses Facebook Pixel infrastructure)
  export class InstagramPixelCodeGenerator extends BasePixelCodeGenerator {
    getPlatform(): string {
      return "instagram";
    }
  
    generateCode(): string {
      return `<!-- Instagram Pixel Code (Meta) -->
  <script>
  !function(f,b,e,v,n,t,s)
  {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
  n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];
  s.parentNode.insertBefore(t,s)}(window, document,'script',
  'https://connect.facebook.net/en_US/fbevents.js');
  fbq('init', '${this.pixelId}');
  fbq('track', 'PageView');
  </script>
  <noscript><img height="1" width="1" style="display:none"
  src="https://www.facebook.com/tr?id=${this.pixelId}&ev=PageView&noscript=1"
  /></noscript>
  <!-- End Instagram Pixel Code -->`;
    }
  }
  
  // TikTok Pixel
  export class TikTokPixelCodeGenerator extends BasePixelCodeGenerator {
    getPlatform(): string {
      return "tiktok";
    }
  
    generateCode(): string {
      return `<!-- TikTok Pixel Code -->
  <script>
  !function (w, d, t) {
    w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
    ttq.load('${this.pixelId}');
    ttq.page();
  }(window, document, 'ttq');
  </script>
  <!-- End TikTok Pixel Code -->`;
    }
  }
  
  // Snapchat Pixel
  export class SnapchatPixelCodeGenerator extends BasePixelCodeGenerator {
    getPlatform(): string {
      return "snapchat";
    }
  
    generateCode(): string {
      return `<!-- Snapchat Pixel Code -->
  <script type='text/javascript'>
  (function(e,t,n){if(e.snaptr)return;var a=e.snaptr=function()
  {a.handleRequest?a.handleRequest.apply(a,arguments):a.queue.push(arguments)};
  a.queue=[];var s='script';r=t.createElement(s);r.async=!0;
  r.src=n;var u=t.getElementsByTagName(s)[0];
  u.parentNode.insertBefore(r,u);})(window,document,
  'https://sc-static.net/scevent.min.js');
  snaptr('init', '${this.pixelId}', {
  'user_email': '__INSERT_USER_EMAIL__'
  });
  snaptr('track', 'PAGE_VIEW');
  </script>
  <!-- End Snapchat Pixel Code -->`;
    }
  }
  
  // Google Ads (gtag.js)
  export class GoogleAdsPixelCodeGenerator extends BasePixelCodeGenerator {
    getPlatform(): string {
      return "google_ads";
    }
  
    generateCode(): string {
      return `<!-- Google tag (gtag.js) -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=${this.pixelId}"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${this.pixelId}');
  </script>
  <!-- End Google tag -->`;
    }
  }
  
  // Pinterest Tag
  export class PinterestPixelCodeGenerator extends BasePixelCodeGenerator {
    getPlatform(): string {
      return "pinterest";
    }
  
    generateCode(): string {
      return `<!-- Pinterest Tag -->
  <script>
  !function(e){if(!window.pintrk){window.pintrk = function () {
  window.pintrk.queue.push(Array.prototype.slice.call(arguments))};var
    n=window.pintrk;n.queue=[],n.version="3.0";var
    t=document.createElement("script");t.async=!0,t.src=e;var
    r=document.getElementsByTagName("script")[0];
    r.parentNode.insertBefore(t,r)}}("https://s.pinimg.com/ct/core.js");
  pintrk('load', '${this.pixelId}', {em: '<user_email_address>'});
  pintrk('page');
  </script>
  <noscript>
  <img height="1" width="1" style="display:none;" alt=""
    src="https://ct.pinterest.com/v3/?event=init&tid=${this.pixelId}&pd[em]=<hashed_email_address>&noscript=1" />
  </noscript>
  <!-- End Pinterest Tag -->`;
    }
  }
  
  // LinkedIn Insight Tag
  export class LinkedInPixelCodeGenerator extends BasePixelCodeGenerator {
    getPlatform(): string {
      return "linkedin";
    }
  
    generateCode(): string {
      return `<!-- LinkedIn Insight Tag -->
  <script type="text/javascript">
  _linkedin_partner_id = "${this.pixelId}";
  window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
  window._linkedin_data_partner_ids.push(_linkedin_partner_id);
  </script><script type="text/javascript">
  (function(l) {
  if (!l){window.lintrk = function(a,b){window.lintrk.q.push([a,b])};
  window.lintrk.q=[]}
  var s = document.getElementsByTagName("script")[0];
  var b = document.createElement("script");
  b.type = "text/javascript";b.async = true;
  b.src = "https://snap.licdn.com/li.lms-analytics/insight.min.js";
  s.parentNode.insertBefore(b, s);})(window.lintrk);
  </script>
  <noscript>
  <img height="1" width="1" style="display:none;" alt="" src="https://px.ads.linkedin.com/collect/?pid=${this.pixelId}&fmt=gif" />
  </noscript>
  <!-- End LinkedIn Insight Tag -->`;
    }
  }
  
  // Twitter (X) Pixel
  export class TwitterPixelCodeGenerator extends BasePixelCodeGenerator {
    getPlatform(): string {
      return "twitter";
    }
  
    generateCode(): string {
      return `<!-- Twitter Pixel Code -->
  <script>
  !function(e,t,n,s,u,a){e.twq||(s=e.twq=function(){s.exe?s.exe.apply(s,arguments):s.queue.push(arguments);
  },s.version='1.1',s.queue=[],u=t.createElement(n),u.async=!0,u.src='https://static.ads-twitter.com/uwt.js',
  a=t.getElementsByTagName(n)[0],a.parentNode.insertBefore(u,a))}(window,document,'script');
  twq('config','${this.pixelId}');
  </script>
  <!-- End Twitter Pixel Code -->`;
    }
  }
  
  // Reddit Pixel
  export class RedditPixelCodeGenerator extends BasePixelCodeGenerator {
    getPlatform(): string {
      return "reddit";
    }
  
    generateCode(): string {
      return `<!-- Reddit Pixel Code -->
  <script>
  !function(w,d){if(!w.rdt){var p=w.rdt=function(){p.sendEvent?p.sendEvent.apply(p,arguments):p.callQueue.push(arguments)};p.callQueue=[];var t=d.createElement("script");t.src="https://www.redditstatic.com/ads/pixel.js",t.async=!0;var s=d.getElementsByTagName("script")[0];s.parentNode.insertBefore(t,s)}}(window,document);
  rdt('init','${this.pixelId}', {"optOut":false,"useDecimalCurrencyValues":true});
  rdt('track', 'PageVisit');
  </script>
  <!-- End Reddit Pixel Code -->`;
    }
  }
  
  // Quora Pixel
  export class QuoraPixelCodeGenerator extends BasePixelCodeGenerator {
    getPlatform(): string {
      return "quora";
    }
  
    generateCode(): string {
      return `<!-- Quora Pixel Code -->
  <script>
  !function(q,e,v,n,t,s){if(q.qp) return; n=q.qp=function(){n.qp?n.qp.apply(n,arguments):n.queue.push(arguments);};
  n.queue=[];t=document.createElement(e);t.async=!0;t.src=v;
  s=document.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t,s);
  }(window, 'script', 'https://a.quora.com/qevents.js');
  qp('init', '${this.pixelId}');
  qp('track', 'ViewContent');
  </script>
  <noscript>
  <img height="1" width="1" style="display:none" src="https://q.quora.com/_/ad/${this.pixelId}/pixel?tag=ViewContent&noscript=1"/>
  </noscript>
  <!-- End Quora Pixel Code -->`;
    }
  }
  
  // Bing (Microsoft) UET Tag
  export class BingPixelCodeGenerator extends BasePixelCodeGenerator {
    getPlatform(): string {
      return "bing";
    }
  
    generateCode(): string {
      return `<!-- Bing UET Tag -->
  <script>
  (function(w,d,t,r,u){var f,n,i;w[u]=w[u]||[],f=function(){var o={ti:"${this.pixelId}"};
  o.q=w[u],w[u]=new UET(o),w[u].push("pageLoad")},n=d.createElement(t),n.src=r,n.async=1,
  n.onload=n.onreadystatechange=function(){var s=this.readyState;
  s&&s!=="loaded"&&s!=="complete"||(f(),n.onload=n.onreadystatechange=null)},
  i=d.getElementsByTagName(t)[0],i.parentNode.insertBefore(n,i)
  })(window,document,"script","//bat.bing.com/bat.js","uetq");
  </script>
  <!-- End Bing UET Tag -->`;
    }
  }
  
  // YouTube (Google Ads format)
  export class YouTubePixelCodeGenerator extends BasePixelCodeGenerator {
    getPlatform(): string {
      return "youtube";
    }
  
    generateCode(): string {
      return `<!-- YouTube Tracking (Google Ads) -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=${this.pixelId}"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${this.pixelId}');
  </script>
  <!-- End YouTube Tracking -->`;
    }
  }
  
  // Shopify Pixel
  export class ShopifyPixelCodeGenerator extends BasePixelCodeGenerator {
    getPlatform(): string {
      return "shopify";
    }
  
    generateCode(): string {
      return `<!-- Shopify Customer Events Pixel -->
  <script>
  (function() {
    var customerId = '${this.pixelId}';
    
    // Shopify Analytics
    if (window.ShopifyAnalytics) {
      window.ShopifyAnalytics.lib = window.ShopifyAnalytics.lib || {};
      window.ShopifyAnalytics.lib.track = window.ShopifyAnalytics.lib.track || function(eventName, payload) {
        console.log('Shopify Event:', eventName, payload);
        // Send to your analytics endpoint
        fetch('/apps/pixel-tracker', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({customerId: customerId, event: eventName, data: payload})
        });
      };
    }
    
    // Track page view
    if (window.ShopifyAnalytics && window.ShopifyAnalytics.lib) {
      window.ShopifyAnalytics.lib.track('page_viewed', {
        pixelId: customerId,
        url: window.location.href
      });
    }
  })();
  </script>
  <!-- End Shopify Pixel -->`;
    }
  }
  
 