/* =====================================================================
   The header markup is identical on all 95 pages, because Theme Builder
   renders one copy of it site-wide. The only thing that was per-page in the
   prototype is data-nav, which highlights the current menu item -- so it is
   set here instead, before pages.js reads it.

   The plugin supplies window.AP_NAV. The pathname derivation below is the
   fallback for when the plugin is deactivated: the menu highlight is lost,
   nothing else is, which is the right way round.
   ===================================================================== */
(function () {
  var nav = document.querySelector('[data-nav]');
  if (!nav) return;
  var key = window.AP_NAV;
  if (typeof key !== 'string') {
    var p = location.pathname.replace(/^\/|\/$/g, '');
    if (p === '') key = '';
    else if (p === 'about' || p === 'process' || p === 'gallery' ||
             p === 'videos' || p === 'services') key = p;
    else if (p === 'glass-tanks' || p.indexOf('product/') === 0) key = 'glass-tanks';
    else if (['contact', 'quote', 'warranty', 'refund-policy',
              'privacy-policy'].indexOf(p) >= 0) key = '';
    else key = 'services';
  }
  nav.setAttribute('data-nav', key);
})();


/* ==== lenis.min.js ==== */
(function(){var e=`1.3.26`;function t(e,t,n){return Math.max(e,Math.min(t,n))}function n(e,t,n){return(1-n)*e+n*t}function r(e,t,r,i){return n(e,t,1-Math.exp(-r*i))}function i(e,t){return(e%t+t)%t}var a=class{isRunning=!1;value=0;from=0;to=0;currentTime=0;lerp;duration;easing;onUpdate;advance(e){if(!this.isRunning)return;let n=!1;if(this.duration&&this.easing){this.currentTime+=e;let r=t(0,this.currentTime/this.duration,1);n=r>=1;let i=n?1:this.easing(r);this.value=this.from+(this.to-this.from)*i}else this.lerp?(this.value=r(this.value,this.to,this.lerp*60,e),Math.round(this.value)===Math.round(this.to)&&(this.value=this.to,n=!0)):(this.value=this.to,n=!0);n&&this.stop(),this.onUpdate?.(this.value,n)}stop(){this.isRunning=!1}fromTo(e,t,{lerp:n,duration:r,easing:i,onStart:a,onUpdate:o}){this.from=this.value=e,this.to=t,this.lerp=n,this.duration=r,this.easing=i,this.currentTime=0,this.isRunning=!0,a?.(),this.onUpdate=o}};function o(e,t){let n;return function(...r){clearTimeout(n),n=setTimeout(()=>{n=void 0,e.apply(this,r)},t)}}var s=class{width=0;height=0;scrollHeight=0;scrollWidth=0;debouncedResize;wrapperResizeObserver;contentResizeObserver;constructor(e,t,{autoResize:n=!0,debounce:r=250}={}){this.wrapper=e,this.content=t,n&&(this.debouncedResize=o(this.resize,r),this.wrapper instanceof Window?window.addEventListener(`resize`,this.debouncedResize):(this.wrapperResizeObserver=new ResizeObserver(this.debouncedResize),this.wrapperResizeObserver.observe(this.wrapper)),this.contentResizeObserver=new ResizeObserver(this.debouncedResize),this.contentResizeObserver.observe(this.content)),this.resize()}destroy(){this.wrapperResizeObserver?.disconnect(),this.contentResizeObserver?.disconnect(),this.wrapper===window&&this.debouncedResize&&window.removeEventListener(`resize`,this.debouncedResize)}resize=()=>{this.onWrapperResize(),this.onContentResize()};onWrapperResize=()=>{this.wrapper instanceof Window?(this.width=window.innerWidth,this.height=window.innerHeight):(this.width=this.wrapper.clientWidth,this.height=this.wrapper.clientHeight)};onContentResize=()=>{this.wrapper instanceof Window?(this.scrollHeight=this.content.scrollHeight,this.scrollWidth=this.content.scrollWidth):(this.scrollHeight=this.wrapper.scrollHeight,this.scrollWidth=this.wrapper.scrollWidth)};get limit(){return{x:this.scrollWidth-this.width,y:this.scrollHeight-this.height}}},c=class{events={};emit(e,...t){let n=this.events[e]||[];for(let e=0,r=n.length;e<r;e++)n[e]?.(...t)}on(e,t){return this.events[e]?this.events[e].push(t):this.events[e]=[t],()=>{this.events[e]=this.events[e]?.filter(e=>t!==e)}}off(e,t){this.events[e]=this.events[e]?.filter(e=>t!==e)}destroy(){this.events={}}};let l={passive:!1};function u(e,t){return e===1?16.666666666666668:e===2?t:1}var d=class{touchStart={x:0,y:0};lastDelta={x:0,y:0};window={width:0,height:0};emitter=new c;constructor(e,t={wheelMultiplier:1,touchMultiplier:1}){this.element=e,this.options=t,window.addEventListener(`resize`,this.onWindowResize),this.onWindowResize(),this.element.addEventListener(`wheel`,this.onWheel,l),this.element.addEventListener(`touchstart`,this.onTouchStart,l),this.element.addEventListener(`touchmove`,this.onTouchMove,l),this.element.addEventListener(`touchend`,this.onTouchEnd,l)}on(e,t){return this.emitter.on(e,t)}destroy(){this.emitter.destroy(),window.removeEventListener(`resize`,this.onWindowResize),this.element.removeEventListener(`wheel`,this.onWheel,l),this.element.removeEventListener(`touchstart`,this.onTouchStart,l),this.element.removeEventListener(`touchmove`,this.onTouchMove,l),this.element.removeEventListener(`touchend`,this.onTouchEnd,l)}onTouchStart=e=>{let{clientX:t,clientY:n}=e.targetTouches?e.targetTouches[0]:e;this.touchStart.x=t,this.touchStart.y=n,this.lastDelta={x:0,y:0},this.emitter.emit(`scroll`,{deltaX:0,deltaY:0,event:e})};onTouchMove=e=>{let{clientX:t,clientY:n}=e.targetTouches?e.targetTouches[0]:e,r=-(t-this.touchStart.x)*this.options.touchMultiplier,i=-(n-this.touchStart.y)*this.options.touchMultiplier;this.touchStart.x=t,this.touchStart.y=n,this.lastDelta={x:r,y:i},this.emitter.emit(`scroll`,{deltaX:r,deltaY:i,event:e})};onTouchEnd=e=>{this.emitter.emit(`scroll`,{deltaX:this.lastDelta.x,deltaY:this.lastDelta.y,event:e})};onWheel=e=>{let{deltaX:t,deltaY:n,deltaMode:r}=e,i=u(r,this.window.width),a=u(r,this.window.height);t*=i,n*=a,t*=this.options.wheelMultiplier,n*=this.options.wheelMultiplier,this.emitter.emit(`scroll`,{deltaX:t,deltaY:n,event:e})};onWindowResize=()=>{this.window={width:window.innerWidth,height:window.innerHeight}}};let f=e=>Math.min(1,1.001-2**(-10*e));var p=class{_isScrolling=!1;_isStopped=!1;_isLocked=!1;_preventNextNativeScrollEvent=!1;_resetVelocityTimeout=null;_rafId=null;_isDraggingSelection=!1;reducedMotionMediaQuery=window.matchMedia(`(prefers-reduced-motion: reduce)`);isTouching;isIos;time=0;userData={};lastVelocity=0;velocity=0;direction=0;options;targetScroll;animatedScroll;animate=new a;emitter=new c;dimensions;virtualScroll;constructor({wrapper:t=window,content:n=document.documentElement,eventsTarget:r=t,smoothWheel:i=!0,syncTouch:a=!1,syncTouchLerp:o=.075,touchInertiaExponent:c=1.7,duration:l,easing:u,lerp:p=.1,infinite:m=!1,orientation:h=`vertical`,gestureOrientation:g=h===`horizontal`?`both`:`vertical`,touchMultiplier:_=1,wheelMultiplier:v=1,autoResize:y=!0,prevent:b,virtualScroll:x,overscroll:S=!0,autoRaf:C=!1,anchors:w=!1,autoToggle:T=!1,allowNestedScroll:E=!1,__experimental__naiveDimensions:D=!1,naiveDimensions:O=D,stopInertiaOnNavigate:k=!1,respectReducedMotion:A=!0}={}){window.lenisVersion=e,window.lenis||(window.lenis={}),window.lenis.version=e,h===`horizontal`&&(window.lenis.horizontal=!0),a===!0&&(window.lenis.touch=!0),this.isIos=/(iPad|iPhone|iPod)/g.test(navigator.userAgent),(!t||t===document.documentElement)&&(t=window),typeof l==`number`&&typeof u!=`function`?u=f:typeof u==`function`&&typeof l!=`number`&&(l=1),this.options={wrapper:t,content:n,eventsTarget:r,smoothWheel:i,syncTouch:a,syncTouchLerp:o,touchInertiaExponent:c,duration:l,easing:u,lerp:p,infinite:m,gestureOrientation:g,orientation:h,touchMultiplier:_,wheelMultiplier:v,autoResize:y,prevent:b,virtualScroll:x,overscroll:S,autoRaf:C,anchors:w,autoToggle:T,allowNestedScroll:E,naiveDimensions:O,stopInertiaOnNavigate:k,respectReducedMotion:A},this.dimensions=new s(t,n,{autoResize:y}),this.updateClassName(),this.targetScroll=this.animatedScroll=this.actualScroll,this.options.wrapper.addEventListener(`scroll`,this.onNativeScroll),this.options.wrapper.addEventListener(`scrollend`,this.onScrollEnd,{capture:!0}),(this.options.anchors||this.options.stopInertiaOnNavigate)&&this.options.wrapper.addEventListener(`click`,this.onClick),this.options.wrapper.addEventListener(`pointerdown`,this.onPointerDown),this.virtualScroll=new d(r,{touchMultiplier:_,wheelMultiplier:v}),this.virtualScroll.on(`scroll`,this.onVirtualScroll),this.options.autoToggle&&(this.checkOverflow(),this.rootElement.addEventListener(`transitionend`,this.onTransitionEnd)),this.options.autoRaf&&(this._rafId=requestAnimationFrame(this.raf))}destroy(){this.emitter.destroy(),this.options.wrapper.removeEventListener(`scroll`,this.onNativeScroll),this.options.wrapper.removeEventListener(`scrollend`,this.onScrollEnd,{capture:!0}),this.options.wrapper.removeEventListener(`pointerdown`,this.onPointerDown),(this.options.anchors||this.options.stopInertiaOnNavigate)&&this.options.wrapper.removeEventListener(`click`,this.onClick),this.virtualScroll.destroy(),this.dimensions.destroy(),this.cleanUpClassName(),this._rafId&&cancelAnimationFrame(this._rafId)}on(e,t){return this.emitter.on(e,t)}off(e,t){return this.emitter.off(e,t)}onScrollEnd=e=>{e instanceof CustomEvent||(this.isScrolling===`smooth`||this.isScrolling===!1)&&e.stopPropagation()};dispatchScrollendEvent=()=>{this.options.wrapper.dispatchEvent(new CustomEvent(`scrollend`,{bubbles:this.options.wrapper===window,detail:{lenisScrollEnd:!0}}))};get overflow(){let e=this.isHorizontal?`overflow-x`:`overflow-y`;return getComputedStyle(this.rootElement)[e]}checkOverflow(){[`hidden`,`clip`].includes(this.overflow)?this.internalStop():this.internalStart()}onTransitionEnd=e=>{e.propertyName?.includes(`overflow`)&&e.target===this.rootElement&&this.checkOverflow()};setScroll(e){this.isHorizontal?this.options.wrapper.scrollTo({left:e,behavior:`instant`}):this.options.wrapper.scrollTo({top:e,behavior:`instant`})}onClick=e=>{let t=e.composedPath().filter(e=>e instanceof HTMLAnchorElement&&e.href).map(e=>new URL(e.href)),n=new URL(window.location.href);if(this.options.anchors){let e=t.find(e=>n.host===e.host&&n.pathname===e.pathname&&e.hash);if(e){let t=typeof this.options.anchors==`object`&&this.options.anchors?this.options.anchors:void 0,n=decodeURIComponent(e.hash);this.scrollTo(n,t);return}}if(this.options.stopInertiaOnNavigate&&t.some(e=>n.host===e.host&&n.pathname!==e.pathname)){this.reset();return}};onPointerDown=e=>{e.button===1&&this.reset()};isTouchOnSelectionHandle(e){let t=window.getSelection();if(!t||t.isCollapsed||t.rangeCount===0)return!1;let n=e.targetTouches[0]??e.changedTouches[0];if(!n)return!1;let r=t.getRangeAt(0).getClientRects();if(r.length===0)return!1;let i=r[0],a=r[r.length-1],o=Math.hypot(n.clientX-i.left,n.clientY-i.top)<=40,s=Math.hypot(n.clientX-a.right,n.clientY-a.bottom)<=40;return o||s}onVirtualScroll=e=>{if(typeof this.options.virtualScroll==`function`&&this.options.virtualScroll(e)===!1)return;let{deltaX:t,deltaY:n,event:r}=e;if(this.emitter.emit(`virtual-scroll`,{deltaX:t,deltaY:n,event:r}),r.ctrlKey||r.lenisStopPropagation)return;let i=r.type.includes(`touch`),a=r.type.includes(`wheel`);if(i&&this.isIos&&(r.type===`touchstart`&&(this._isDraggingSelection=this.isTouchOnSelectionHandle(r)),this._isDraggingSelection)){r.type===`touchend`&&(this._isDraggingSelection=!1);return}this.isTouching=r.type===`touchstart`||r.type===`touchmove`;let o=t===0&&n===0;if(this.options.syncTouch&&i&&r.type===`touchstart`&&o&&!this.isStopped&&!this.isLocked){this.reset();return}let s=this.options.gestureOrientation===`vertical`&&n===0||this.options.gestureOrientation===`horizontal`&&t===0;if(o||s)return;let c=r.composedPath();c=c.slice(0,c.indexOf(this.rootElement));let l=this.options.prevent,u=Math.abs(t)>=Math.abs(n)?`horizontal`:`vertical`;if(c.find(e=>e instanceof HTMLElement&&(typeof l==`function`&&l?.(e)||e.hasAttribute?.(`data-lenis-prevent`)||u===`vertical`&&e.hasAttribute?.(`data-lenis-prevent-vertical`)||u===`horizontal`&&e.hasAttribute?.(`data-lenis-prevent-horizontal`)||i&&e.hasAttribute?.(`data-lenis-prevent-touch`)||a&&e.hasAttribute?.(`data-lenis-prevent-wheel`)||this.options.allowNestedScroll&&this.hasNestedScroll(e,{deltaX:t,deltaY:n}))))return;if(this.isStopped||this.isLocked){r.cancelable&&r.preventDefault();return}if(!(this.options.syncTouch&&i||this.options.smoothWheel&&a)){this.isScrolling=`native`,this.animate.stop(),r.lenisStopPropagation=!0;return}let d=n;this.options.gestureOrientation===`both`?d=Math.abs(n)>Math.abs(t)?n:t:this.options.gestureOrientation===`horizontal`&&(d=t),(!this.options.overscroll||this.options.infinite||this.options.wrapper!==window&&this.limit>0&&(this.animatedScroll>0&&this.animatedScroll<this.limit||this.animatedScroll===0&&n>0||this.animatedScroll===this.limit&&n<0))&&(r.lenisStopPropagation=!0),r.cancelable&&r.preventDefault();let f=i&&this.options.syncTouch,p=i&&r.type===`touchend`;p&&(d=Math.sign(d)*Math.abs(this.velocity)**this.options.touchInertiaExponent),this.scrollTo(this.targetScroll+d,{programmatic:!1,...f?{lerp:p?this.options.syncTouchLerp:1}:{lerp:this.options.lerp,duration:this.options.duration,easing:this.options.easing}})};resize(){this.dimensions.resize(),this.animatedScroll=this.targetScroll=this.actualScroll,this.emit()}emit(){this.emitter.emit(`scroll`,this)}onNativeScroll=()=>{if(this._resetVelocityTimeout!==null&&(clearTimeout(this._resetVelocityTimeout),this._resetVelocityTimeout=null),this._preventNextNativeScrollEvent){this._preventNextNativeScrollEvent=!1;return}if(this.isScrolling===!1||this.isScrolling===`native`){let e=this.animatedScroll;this.animatedScroll=this.targetScroll=this.actualScroll,this.lastVelocity=this.velocity,this.velocity=this.animatedScroll-e,this.direction=Math.sign(this.animatedScroll-e),this.isStopped||(this.isScrolling=`native`),this.emit(),this.velocity!==0&&(this._resetVelocityTimeout=setTimeout(()=>{this.lastVelocity=this.velocity,this.velocity=0,this.isScrolling=!1,this.emit()},400))}};reset(){this.isLocked=!1,this.isScrolling=!1,this.animatedScroll=this.targetScroll=this.actualScroll,this.lastVelocity=this.velocity=0,this.animate.stop()}start(){if(this.isStopped){if(this.options.autoToggle){this.rootElement.style.removeProperty(`overflow`);return}this.internalStart()}}internalStart(){this.isStopped&&(this.reset(),this.isStopped=!1,this.emit())}stop(){if(!this.isStopped){if(this.options.autoToggle){this.rootElement.style.setProperty(`overflow`,`clip`);return}this.internalStop()}}internalStop(){this.isStopped||(this.reset(),this.isStopped=!0,this.emit())}raf=e=>{let t=e-(this.time||e);this.time=e,this.animate.advance(t*.001),this.options.autoRaf&&(this._rafId=requestAnimationFrame(this.raf))};scrollTo(e,{offset:n=0,immediate:r=!1,lock:i=!1,programmatic:a=!0,lerp:o=a?this.options.lerp:void 0,duration:s=a?this.options.duration:void 0,easing:c=a?this.options.easing:void 0,onStart:l,onComplete:u,force:d=!1,userData:p}={}){if(this.prefersReducedMotion&&(a?r=!0:(o=1,s=void 0,c=void 0)),(this.isStopped||this.isLocked)&&!d)return;let m=e,h=n;if(typeof m==`string`&&[`top`,`left`,`start`,`#`].includes(m))m=0;else if(typeof m==`string`&&[`bottom`,`right`,`end`].includes(m))m=this.limit;else{let e=null;if(typeof m==`string`?(e=m.startsWith(`#`)?document.getElementById(m.slice(1)):document.querySelector(m),e||(m===`#top`?m=0:console.warn(`Lenis: Target not found`,m))):m instanceof HTMLElement&&m?.nodeType&&(e=m),e){if(this.options.wrapper!==window){let e=this.rootElement.getBoundingClientRect();h-=this.isHorizontal?e.left:e.top}let t=e.getBoundingClientRect(),n=getComputedStyle(e),r=this.isHorizontal?Number.parseFloat(n.scrollMarginLeft):Number.parseFloat(n.scrollMarginTop),i=getComputedStyle(this.rootElement),a=this.isHorizontal?Number.parseFloat(i.scrollPaddingLeft):Number.parseFloat(i.scrollPaddingTop);m=(this.isHorizontal?t.left:t.top)+this.animatedScroll-(Number.isNaN(r)?0:r)-(Number.isNaN(a)?0:a)}}if(typeof m==`number`){if(m+=h,this.options.infinite){if(a){this.targetScroll=this.animatedScroll=this.scroll;let e=m-this.animatedScroll;e>this.limit/2?m-=this.limit:e<-this.limit/2&&(m+=this.limit)}}else m=t(0,m,this.limit);if(m===this.targetScroll){l?.(this),u?.(this);return}if(this.userData=p??{},r){this.animatedScroll=this.targetScroll=m,this.setScroll(this.scroll),this.reset(),this.preventNextNativeScrollEvent(),this.emit(),u?.(this),this.userData={},requestAnimationFrame(()=>{this.dispatchScrollendEvent()});return}a||(this.targetScroll=m),typeof s==`number`&&typeof c!=`function`?c=f:typeof c==`function`&&typeof s!=`number`&&(s=1),this.animate.fromTo(this.animatedScroll,m,{duration:s,easing:c,lerp:o,onStart:()=>{i&&(this.isLocked=!0),this.isScrolling=`smooth`,l?.(this)},onUpdate:(e,t)=>{this.isScrolling=`smooth`,this.lastVelocity=this.velocity,this.velocity=e-this.animatedScroll,this.direction=Math.sign(this.velocity),this.animatedScroll=e,this.setScroll(this.scroll),a&&(this.targetScroll=e),t||this.emit(),t&&(this.reset(),this.emit(),u?.(this),this.userData={},requestAnimationFrame(()=>{this.dispatchScrollendEvent()}),this.preventNextNativeScrollEvent())}})}}preventNextNativeScrollEvent(){this._preventNextNativeScrollEvent=!0,requestAnimationFrame(()=>{this._preventNextNativeScrollEvent=!1})}hasNestedScroll(e,{deltaX:t,deltaY:n}){let r=Date.now();e._lenis||={};let i=e._lenis,a,o,s,c,l,u,d,f,p,m;if(r-(i.time??0)>2e3){i.time=Date.now();let t=window.getComputedStyle(e);if(i.computedStyle=t,a=[`auto`,`overlay`,`scroll`].includes(t.overflowX),o=[`auto`,`overlay`,`scroll`].includes(t.overflowY),l=[`auto`].includes(t.overscrollBehaviorX),u=[`auto`].includes(t.overscrollBehaviorY),i.hasOverflowX=a,i.hasOverflowY=o,!(a||o))return!1;d=e.scrollWidth,f=e.scrollHeight,p=e.clientWidth,m=e.clientHeight,s=d>p,c=f>m,i.isScrollableX=s,i.isScrollableY=c,i.scrollWidth=d,i.scrollHeight=f,i.clientWidth=p,i.clientHeight=m,i.hasOverscrollBehaviorX=l,i.hasOverscrollBehaviorY=u}else s=i.isScrollableX,c=i.isScrollableY,a=i.hasOverflowX,o=i.hasOverflowY,d=i.scrollWidth,f=i.scrollHeight,p=i.clientWidth,m=i.clientHeight,l=i.hasOverscrollBehaviorX,u=i.hasOverscrollBehaviorY;if(!(a&&s||o&&c))return!1;let h=Math.abs(t)>=Math.abs(n)?`horizontal`:`vertical`,g,_,v,y,b,x;if(h===`horizontal`)g=Math.round(e.scrollLeft),_=d-p,v=t,y=a,b=s,x=l;else if(h===`vertical`)g=Math.round(e.scrollTop),_=f-m,v=n,y=o,b=c,x=u;else return!1;return!x&&(g>=_||g<=0)?!0:(v>0?g<_:g>0)&&y&&b}get rootElement(){return this.options.wrapper===window?document.documentElement:this.options.wrapper}get limit(){return this.options.naiveDimensions?this.isHorizontal?this.rootElement.scrollWidth-this.rootElement.clientWidth:this.rootElement.scrollHeight-this.rootElement.clientHeight:this.dimensions.limit[this.isHorizontal?`x`:`y`]}get isHorizontal(){return this.options.orientation===`horizontal`}get actualScroll(){let e=this.options.wrapper;return this.isHorizontal?e.scrollX??e.scrollLeft:e.scrollY??e.scrollTop}get scroll(){return this.options.infinite?i(this.animatedScroll,this.limit):this.animatedScroll}get progress(){return this.limit===0?1:this.scroll/this.limit}get isScrolling(){return this._isScrolling}set isScrolling(e){this._isScrolling!==e&&(this._isScrolling=e,this.updateClassName())}get isStopped(){return this._isStopped}set isStopped(e){this._isStopped!==e&&(this._isStopped=e,this.updateClassName())}get isLocked(){return this._isLocked}set isLocked(e){this._isLocked!==e&&(this._isLocked=e,this.updateClassName())}get isSmooth(){return this.isScrolling===`smooth`}get prefersReducedMotion(){return this.options.respectReducedMotion&&this.reducedMotionMediaQuery.matches}get className(){let e=`lenis`;return this.options.autoToggle&&(e+=` lenis-autoToggle`),this.isStopped&&(e+=` lenis-stopped`),this.isLocked&&(e+=` lenis-locked`),this.isScrolling&&(e+=` lenis-scrolling`),this.isScrolling===`smooth`&&(e+=` lenis-smooth`),e}updateClassName(){this.cleanUpClassName(),this.className.split(` `).forEach(e=>{this.rootElement.classList.add(e)})}cleanUpClassName(){for(let e of Array.from(this.rootElement.classList))(e===`lenis`||e.startsWith(`lenis-`))&&this.rootElement.classList.remove(e)}};globalThis.Lenis=p,globalThis.Lenis.prototype=p.prototype})();
//# sourceMappingURL=lenis.min.js.map

/* ==== pages.js ==== */
/* =====================================================================
   Acrylic Pros — inner-page behaviour
   Runs before home.js (shared chrome, Lenis, in-view classes, dark UI),
   which is locked and must not be edited.
   ===================================================================== */
(function () {
  'use strict';

  // Set to a real endpoint to connect the forms. While null, a form NEVER
  // reports success — nothing was sent, so it says so and offers the phone.
  var FORM_ENDPOINT = null;
  var PHONE_DISPLAY = '+1 (562) 566-0150';
  var PHONE_HREF = 'tel:+15625660150';
  var EMAIL = 'info@acrylicpros.com';

  var doc = document.documentElement;
  var body = document.body;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (any-pointer: fine)').matches;
  var touch = window.matchMedia('(hover: none)').matches;

  var EASE_QUINT = 'cubic-bezier(.23, 1, .32, 1)';
  var EASE_EXPO = 'cubic-bezier(.19, 1, .22, 1)';

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function clamp(v, min, max) { return Math.min(Math.max(v, min), max); }
  function raf(fn) { return window.requestAnimationFrame(fn); }
  function play(video) { var p = video.play(); if (p) p.catch(function () {}); }

  var page = $('[data-page]');
  var loader = $('[data-loader]');
  var panels = $$('[data-panel]');
  var entering = doc.classList.contains('is-entering');

  if (entering && (reduced || !page || !page.animate)) {
    doc.classList.remove('is-entering');
    entering = false;
  }
  // Entered through the panel wipe: no smoke loader (home.js then skips it).
  if (entering && loader) { loader.remove(); loader = null; }

  /* ------------------------------------------------------------------
     Current menu link
     ------------------------------------------------------------------ */
  var nav = $('[data-nav]');
  if (nav) {
    var current = nav.getAttribute('data-nav');
    var link = current && $('[data-nav-item="' + current + '"]', nav);
    if (link) {
      link.classList.add('-active');
      link.setAttribute('aria-current', 'page');
    } else {
      nav.classList.remove('-active');
    }
  }

  /* ------------------------------------------------------------------
     Inner pages: the header reads the band under it
     (light band -> dark header).
     ------------------------------------------------------------------ */
  if (body.classList.contains('t-inner')) {
    // home.js would also flip the header from data-dark-ui markers; with the
    // short page banners those fire too early, so this check owns it here.
    $$('[data-dark-ui]').forEach(function (el) { el.removeAttribute('data-dark-ui'); });
    var CHROME = '.o-header, .a-loader, .o-menu, .a-panel, .skip-link';
    var lightness = function (el) {
      for (; el && el !== body && el !== doc; el = el.parentElement) {
        if (/^(IMG|VIDEO|IFRAME|CANVAS)$/.test(el.tagName)) return 0;
        var cs = getComputedStyle(el);
        if (cs.backgroundImage !== 'none' && cs.backgroundImage.indexOf('gradient') < 0) return 0;
        var c = cs.backgroundColor.match(/[\d.]+/g);
        if (c && (c.length < 4 || +c[3] > 0.5)) return (0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]) / 255;
      }
      return 1;
    };
    var toneQueued = false;
    var tone = function () {
      toneQueued = false;
      if (doc.classList.contains('menu-open')) return;
      // Sample under the burger and under the logo; either on a light band
      // means the glass pills would vanish, so switch to the dark UI.
      var light = [60, window.innerWidth / 2].some(function (x) {
        var hit = document.elementsFromPoint(x, 60).filter(function (el) {
          return !el.closest(CHROME);
        })[0];
        return lightness(hit) > 0.6;
      });
      body.classList.toggle('-dark', light);
    };
    var queueTone = function () { if (!toneQueued) { toneQueued = true; raf(tone); } };
    window.addEventListener('scroll', queueTone, { passive: true });
    window.addEventListener('resize', queueTone);
    window.addEventListener('load', queueTone);
    new MutationObserver(queueTone).observe(doc, { attributes: true, attributeFilter: ['class'] });
    queueTone();
  }

  /* ------------------------------------------------------------------
     Page transition: navy sheet, gold sheet 150ms later, then the page
     ------------------------------------------------------------------ */
  var leaving = false;

  function transitionTarget(a, event) {
    if (event.defaultPrevented || event.button !== 0 ||
        event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return null;
    if ((a.target && a.target !== '_self') || a.hasAttribute('download')) return null;
    var url;
    try { url = new URL(a.getAttribute('href'), location.href); } catch (e) { return null; }
    if (url.origin !== location.origin) return null;
    if (!/(\.html|\/)$/.test(url.pathname)) return null;
    if (url.pathname === location.pathname && url.hash) return null;
    return url;
  }

  if (!reduced && panels.length) {
    document.addEventListener('click', function (event) {
      var a = event.target.closest && event.target.closest('a[href]');
      if (!a || leaving) return;
      var url = transitionTarget(a, event);
      if (!url) return;
      event.preventDefault();
      leaving = true;
      doc.classList.add('is-loading');
      body.classList.remove('-dark');
      panels.forEach(function (panel, i) {
        panel.animate(
          [{ transform: 'translateY(0)' }, { transform: 'translateY(-100%)' }],
          { duration: 1400, delay: i * 150, easing: EASE_QUINT, fill: 'forwards' }
        );
      });
      // The homepage runs its own intro; only inner pages pick the wipe up.
      if (!/(^|\/)(index\.html)?$/.test(url.pathname)) {
        try { sessionStorage.setItem('ap:transition', String(Date.now())); } catch (e) {}
      }
      setTimeout(function () { location.href = url.href; }, 800);
    });

    // Back/forward cache: never come back to a page hidden behind the sheets.
    window.addEventListener('pageshow', function (event) {
      if (!event.persisted) return;
      leaving = false;
      doc.classList.remove('is-loading');
      panels.forEach(function (p) { p.getAnimations().forEach(function (a) { a.cancel(); }); });
    });
  }

  /* ------------------------------------------------------------------
     Hero: in-view classes + line-split title
     ------------------------------------------------------------------ */
  var hero = $('[data-page-hero]');

  function expoOut(t) { return t === 1 ? 1 : 1 - Math.pow(2, -10 * t); }

  function titleReveal() {
    var el = $('[data-page-title]');
    if (!el) return;
    if (reduced || !el.animate) { el.style.opacity = 1; return; }

    var original = el.innerHTML;
    el.style.height = el.getBoundingClientRect().height + 'px';

    var words = [];
    (function walk(node, strong) {
      Array.prototype.forEach.call(node.childNodes, function (child) {
        if (child.nodeType === 3) {
          child.textContent.split(/\s+/).forEach(function (w) { if (w) words.push({ text: w, strong: strong }); });
        } else if (child.nodeName === 'BR') {
          words.push({ br: true });
        } else if (child.nodeType === 1) {
          walk(child, strong || child.nodeName === 'STRONG' || child.nodeName === 'B');
        }
      });
    })(el, false);

    if (touch && words.some(function (w) { return w.text && w.text.length > 10; })) {
      el.style.opacity = 1;
      el.style.height = '';
      return;
    }

    el.textContent = '';
    var nodes = [];
    words.forEach(function (w) {
      if (w.br) { el.appendChild(document.createElement('br')); return; }
      var n = document.createElement(w.strong ? 'strong' : 'span');
      n.style.display = 'inline-block';
      n.textContent = w.text;
      el.appendChild(n);
      el.appendChild(document.createTextNode(' '));
      nodes.push(n);
    });

    var rows = [];
    nodes.forEach(function (n) {
      var top = n.offsetTop;
      var row = rows.filter(function (r) { return r.top === top; })[0];
      if (!row) { row = { top: top, nodes: [] }; rows.push(row); }
      row.nodes.push(n);
    });

    el.textContent = '';
    var lines = rows.map(function (row) {
      var wrapper = document.createElement('span');
      var line = document.createElement('span');
      wrapper.className = 'a-line-wrapper';
      line.className = 'a-line';
      wrapper.style.display = 'inline-block';
      line.style.display = 'inline-block';
      row.nodes.forEach(function (n) { line.appendChild(n); line.appendChild(document.createTextNode(' ')); });
      wrapper.appendChild(line);
      el.appendChild(wrapper);
      return line;
    });

    el.style.opacity = 1;
    var count = lines.length;
    var longest = 0;
    lines.forEach(function (line, i) {
      var delay = count > 1 ? expoOut(i / (count - 1)) * (count - 1) * 100 : 0;
      longest = Math.max(longest, delay);
      line.animate(
        [{ transform: 'translateY(120%)' }, { transform: 'translateY(0%)' }],
        { duration: 2000, delay: delay, easing: EASE_EXPO, fill: 'both' }
      );
    });
    setTimeout(function () {
      el.innerHTML = original;
      el.style.height = 'auto';
    }, 2000 + longest);
  }

  function revealHero() { if (hero) hero.classList.add('is-inview'); }

  // Same start signal home.js uses for the smoke loader.
  function whenIntro(cb) {
    var done = false;
    var once = function () { if (!done) { done = true; cb(); } };
    if (!loader || reduced) { once(); return; }
    var video = $('video', loader);
    var start = function () {
      if (video.readyState >= 1) once();
      else {
        video.addEventListener('loadedmetadata', once, { once: true });
        setTimeout(once, 1500);
      }
    };
    if (document.readyState === 'complete') start();
    else window.addEventListener('load', start, { once: true });
    setTimeout(once, 4000);
  }

  var pageReady; // resolves when the page is fully shown (for the gallery cascade)
  if (entering) {
    var slide = page.animate(
      [{ transform: 'translateY(100vh)' }, { transform: 'translateY(0)' }],
      { duration: 1400, easing: EASE_QUINT, fill: 'forwards' }
    );
    slide.onfinish = function () {
      doc.classList.remove('is-entering');
      slide.cancel();
    };
    setTimeout(revealHero, 220);
    setTimeout(titleReveal, 430);
    pageReady = function (cb) { setTimeout(cb, 1700); };
  } else {
    whenIntro(function () { revealHero(); titleReveal(); });
    pageReady = function (cb) {
      if (document.readyState === 'complete') cb();
      else window.addEventListener('load', cb, { once: true });
    };
  }

  /* ------------------------------------------------------------------
     Scroll-linked: section rings, word-colour quotes, parallax, step lines
     ------------------------------------------------------------------ */
  var summaryItems = $$('[data-summary]').map(function (li) {
    var id = (li.querySelector('a').getAttribute('href') || '').slice(1);
    return { li: li, section: document.getElementById(id) };
  }).filter(function (s) { return s.section; });

  function hexToRgb(hex) {
    var n = parseInt(hex.replace('#', ''), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function easeOutQuart(t) { return 1 - Math.pow(1 - t, 4); }
  function easeOutInQuad(t) {
    return t < 0.5 ? (1 - Math.pow(1 - t * 2, 2)) / 2 : (Math.pow(t * 2 - 1, 2) + 1) / 2;
  }

  var quotes = $$('[data-text-scroll]').map(function (el) {
    var p = $('p', el);
    var words = p.textContent.trim().split(/\s+/);
    p.textContent = '';
    var spans = words.map(function (w) {
      var s = document.createElement('span');
      s.textContent = w;
      p.appendChild(s);
      p.appendChild(document.createTextNode(' '));
      return s;
    });
    var n = spans.length;
    return {
      el: el,
      spans: spans,
      from: hexToRgb(el.getAttribute('data-color-from')),
      to: hexToRgb(el.getAttribute('data-color-to')),
      delays: spans.map(function (_, i) { return n > 1 ? easeOutInQuad(i / (n - 1)) * (n - 1) * 50 : 0; }),
      duration: 1200 + 50 * Math.max(n - 1, 0),
      last: -1
    };
  });

  var parallaxEls = $$('[data-parallax]');
  var steppers = $$('[data-step-line]');

  function paintQuote(q, p) {
    if (Math.abs(p - q.last) < 0.0005) return;
    q.last = p;
    var t = p * q.duration;
    for (var i = 0; i < q.spans.length; i++) {
      var e = easeOutQuart(clamp((t - q.delays[i]) / 1200, 0, 1));
      q.spans[i].style.color = 'rgb(' +
        Math.round(q.from[0] + (q.to[0] - q.from[0]) * e) + ',' +
        Math.round(q.from[1] + (q.to[1] - q.from[1]) * e) + ',' +
        Math.round(q.from[2] + (q.to[2] - q.from[2]) * e) + ')';
    }
  }

  var ticking = false;
  function onScrollFrame() {
    ticking = false;
    var vh = window.innerHeight;

    summaryItems.forEach(function (s) {
      var r = s.section.getBoundingClientRect();
      var p = clamp((0.67 * vh - r.top) / (r.height + 0.34 * vh), 0, 1);
      s.li.style.setProperty('--progress', (p * 100).toFixed(2));
      s.li.classList.toggle('-is-active', p > 0 && p < 1);
    });

    quotes.forEach(function (q) {
      var r = q.el.getBoundingClientRect();
      paintQuote(q, clamp((0.67 * vh - r.top) / (0.5 * r.height + 0.34 * vh), 0, 1));
    });

    steppers.forEach(function (el) {
      var stepper = el.parentNode; // the progress window is the whole stepper column
      var r = stepper.getBoundingClientRect();
      var p = clamp((0.5 * vh - r.top) / Math.max(0.5 * r.height, 1), 0, 1);
      stepper.style.setProperty('--progress', p.toFixed(4));
    });

    // Parallax runs wherever Lenis drives the scroll (not on touch, where it keeps native scrolling).
    var smooth = !touch && !reduced && doc.classList.contains('lenis');
    parallaxEls.forEach(function (el) {
      if (!smooth) { el.style.transform = ''; return; }
      var speed = parseFloat(el.getAttribute('data-parallax')) || 0;
      var r = el.getBoundingClientRect();
      var base = r.top - (parseFloat(el.dataset.shift) || 0);
      var p = clamp((vh - base) / (vh + r.height), 0, 1);
      var shift = -speed * vh * (p * 2 - 1);
      el.dataset.shift = shift;
      el.style.transform = 'translate3d(0,' + shift.toFixed(2) + 'px,0)';
    });
  }
  function requestFrame() { if (!ticking) { ticking = true; raf(onScrollFrame); } }
  if (summaryItems.length || quotes.length || parallaxEls.length || steppers.length) {
    window.addEventListener('scroll', requestFrame, { passive: true });
    window.addEventListener('resize', requestFrame);
    window.addEventListener('load', requestFrame);
    requestFrame();
  }

  /* ------------------------------------------------------------------
     Lazy background videos (only fetched once near the viewport)
     ------------------------------------------------------------------ */
  if (!reduced) {
    var lazyVideoIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var v = entry.target;
        if (entry.isIntersecting) {
          if (!v.getAttribute('src')) v.src = v.getAttribute('data-lazy-src');
          play(v);
        } else if (v.getAttribute('src')) {
          v.pause();
        }
      });
    }, { rootMargin: '200px 0px' });
    $$('video[data-lazy-src]').forEach(function (v) { lazyVideoIO.observe(v); });
  }

  /* ------------------------------------------------------------------
     Category selector (services index; same markup and styles as the homepage's)
     ------------------------------------------------------------------ */
  function catSelector(root, onChange) {
    var buttons = $$('[data-cat-list] button', root);
    var select = $('[data-cat-select]', root);
    function mark(value, moveTo) {
      buttons.forEach(function (b) {
        var on = b.getAttribute('data-value') === value;
        b.classList.toggle('-active', on);
        b.setAttribute('aria-pressed', String(on));
        if (on && moveTo) {
          root.style.setProperty('--offset', b.getAttribute('data-index'));
          root.style.setProperty('--color', b.getAttribute('data-color'));
        }
      });
      select.value = value;
    }
    $('[data-cat-list]', root).addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (!b || b.classList.contains('-active')) return;
      var value = b.getAttribute('data-value');
      onChange(value);
      raf(function () { mark(value, true); });
    });
    select.addEventListener('change', function () {
      mark(select.value, true);
      onChange(select.value);
    });
    return { mark: mark };
  }

  function setFilterParam(value) {
    try {
      var url = new URL(location.href);
      if (value === 'all') url.searchParams.delete('filter');
      else url.searchParams.set('filter', value);
      history.replaceState(history.state, '', url.toString());
    } catch (e) {}
  }
  function filterParam() {
    try { return new URL(location.href).searchParams.get('filter'); } catch (e) { return null; }
  }

  /* ------------------------------------------------------------------
     Services index: filter, load more, hover videos
     ------------------------------------------------------------------ */
  var productsGrid = $('[data-products-grid]');
  if (productsGrid) {
    var PAGE = 8;
    var cards = $$('li[data-cat]', productsGrid);
    var more = $('[data-products-more]');
    var catRoot = $('[data-cat]');
    var value = 'all';
    var shown = PAGE;

    var renderProducts = function () {
      var matches = cards.filter(function (c) { return value === 'all' || c.getAttribute('data-cat') === value; });
      cards.forEach(function (c) { c.classList.add('-hidden'); });
      matches.slice(0, shown).forEach(function (c) { c.classList.remove('-hidden'); });
      more.classList.toggle('-hidden', matches.length <= shown);
    };

    var selector = catSelector(catRoot, function (v) {
      value = v;
      shown = PAGE;
      setFilterParam(v);
      renderProducts();
    });

    var initial = filterParam();
    if (initial && $('[data-cat-list] [data-value="' + initial + '"]', catRoot)) {
      value = initial;
      selector.mark(initial, true);
    }
    renderProducts();

    more.addEventListener('click', function () {
      var before = $$('li[data-cat]:not(.-hidden)', productsGrid).length;
      shown += PAGE;
      renderProducts();
      var next = $$('li[data-cat]:not(.-hidden) a', productsGrid)[before];
      if (next) next.focus({ preventScroll: true });
    });

    if (finePointer && !reduced) {
      var currentCard = null;
      var setVideo = function (card, on) {
        var video = $('video[data-src]', card);
        if (!video) return;
        var fig = video.parentNode;
        raf(function () {
          fig.classList.toggle('-hover', on);
          if (!on) { video.pause(); return; }
          if (!video.getAttribute('src')) {
            video.src = video.getAttribute('data-src');
            video.addEventListener('loadeddata', function () {
              if (fig.classList.contains('-hover')) play(video);
            });
          } else {
            play(video);
          }
        });
      };
      productsGrid.addEventListener('mouseover', function (e) {
        var card = e.target.closest('[data-products]');
        if (card === currentCard) return;
        if (currentCard) setVideo(currentCard, false);
        currentCard = card;
        if (card) setVideo(card, true);
      });
      productsGrid.addEventListener('mouseleave', function () {
        if (currentCard) { setVideo(currentCard, false); currentCard = null; }
      });
    }
  }

  /* ------------------------------------------------------------------
     Gallery (reference grid): cascade, load more, filter pill, hover,
     lightbox
     ------------------------------------------------------------------ */
  var refRoot = $('[data-references]');
  if (refRoot) {
    var FIRST = 19;
    var STEP = 20;
    var items = $$('[data-card]', refRoot);
    var loadMore = $('[data-references-more]', refRoot);
    var select = $('[data-references-select]', refRoot);
    var toggle = $('[data-references-toggle]', select);
    var list = $('[data-references-list]', select);
    var label = $('[data-references-label]', select);
    var category = 'all';
    var matches = items.slice();
    var hoverable = true;
    var hovered = null;
    var hoverTimer = null;
    var unhoverTimer = null;

    var matchesFor = function (cat) {
      return items.filter(function (it) {
        return cat === 'all' || (' ' + it.getAttribute('data-category') + ' ').indexOf(' ' + cat + ' ') !== -1;
      });
    };

    var activate = function (els) {
      els.forEach(function (it) { it.classList.add('-active'); });
      raf(function () { raf(function () { els.forEach(function (it) { it.classList.add('-visible'); }); }); });
    };

    var updateDelays = function () {
      var i = 0;
      matches.forEach(function (it) {
        if (!it.classList.contains('-active')) return;
        $('.m-referenceCard', it).style.setProperty('--delay', ((i % FIRST) * 100) + 'ms');
        i++;
      });
    };

    var updateMore = function () {
      var remaining = matches.filter(function (it) { return !it.classList.contains('-active'); }).length;
      loadMore.classList.toggle('-hidden', remaining === 0);
    };

    var applyCategory = function (cat) {
      category = cat;
      matches = matchesFor(cat);
      items.forEach(function (it) { it.classList.remove('-active', '-visible', '-backside'); });
      matches.slice(0, FIRST).forEach(function (it) { it.classList.add('-active'); });
      updateDelays();
      updateMore();
    };

    var initialCat = filterParam();
    var initialBtn = initialCat && $('[data-category="' + initialCat + '"]', list);
    applyCategory(initialBtn ? initialCat : 'all');
    if (initialBtn) {
      $$('.m-referencesSelect__item', list).forEach(function (b) { b.classList.toggle('-current', b === initialBtn); });
      label.textContent = initialBtn.textContent;
    }

    var enter = function () {
      raf(function () {
        refRoot.classList.add('-ready');
        matches.forEach(function (it) { if (it.classList.contains('-active')) it.classList.add('-visible'); });
      });
    };
    if (reduced) enter();
    else pageReady(function () { setTimeout(enter, 600); });

    loadMore.addEventListener('click', function () {
      var next = matches.filter(function (it) { return !it.classList.contains('-active'); }).slice(0, STEP);
      activate(next);
      updateDelays();
      updateMore();
      var btn = next[0] && $('[data-open]', next[0]);
      if (btn) btn.focus({ preventScroll: true });
    });

    // Filter pill — sticky, grows upward.
    var setOpen = function (open) {
      list.style.setProperty('--height', list.scrollHeight + 'px');
      select.classList.toggle('-open', open);
      toggle.setAttribute('aria-expanded', String(open));
    };
    toggle.addEventListener('click', function () { setOpen(!select.classList.contains('-open')); });
    document.addEventListener('click', function (e) {
      if (select.classList.contains('-open') && !select.contains(e.target)) setOpen(false);
    });
    select.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && select.classList.contains('-open')) { setOpen(false); toggle.focus(); }
    });
    list.addEventListener('click', function (e) {
      var b = e.target.closest('[data-category]');
      if (!b || b.classList.contains('-current')) return;
      $$('.m-referencesSelect__item', list).forEach(function (x) {
        x.classList.toggle('-current', x === b);
        x.setAttribute('aria-pressed', String(x === b));
      });
      label.textContent = b.textContent;
      setOpen(false);
      setFilterParam(b.getAttribute('data-category'));
      hoverable = false;
      window.scrollTo(0, 0);
      raf(function () {
        applyCategory(b.getAttribute('data-category'));
        var status = $('[data-references-status]', refRoot);
        if (status) status.textContent = matches.length + ' project' + (matches.length === 1 ? '' : 's') + ' in ' + b.textContent + '.';
        raf(function () { enter(); hoverable = true; });
      });
    });

    // Hover: the hovered card grows, every other card dims.
    if (finePointer && !reduced) {
      var changeHover = function (index) {
        if (hovered === index) return;
        hovered = index;
        clearTimeout(hoverTimer);
        if (index === -1) {
          hoverTimer = setTimeout(function () {
            items.forEach(function (it) { it.classList.remove('-backside'); });
            unhoverTimer = setTimeout(function () { refRoot.classList.remove('-hoverable'); }, 700);
          }, 200);
        } else {
          clearTimeout(unhoverTimer);
          raf(function () {
            refRoot.classList.add('-hoverable');
            items.forEach(function (it, i) { it.classList.toggle('-backside', i !== index); });
          });
        }
      };
      var lastMove = 0;
      refRoot.addEventListener('mousemove', function (e) {
        if (e.timeStamp - lastMove < 30 || !hoverable) return;
        lastMove = e.timeStamp;
        if (e.target.closest('.js-nav')) { changeHover(-1); return; }
        var card = e.target.closest('[data-card]');
        changeHover(card ? items.indexOf(card) : -1);
      });
      refRoot.addEventListener('mouseleave', function () { changeHover(-1); });
    }

    // Lightbox
    var box = $('[data-lightbox]');
    if (box) {
      body.appendChild(box); // outside the page so the page can go inert
      var img = $('[data-lightbox-image]', box);
      var titleEl = $('[data-lightbox-title]', box);
      var countEl = $('[data-lightbox-count]', box);
      var header = $('.o-header');
      var sidemenu = $('[data-sidemenu]');
      var set = [];
      var index = 0;
      var opener = null;

      var show = function (i, animate) {
        index = (i + set.length) % set.length;
        var it = set[index];
        var btn = $('[data-open]', it);
        var apply = function () {
          img.src = btn.getAttribute('data-full');
          img.alt = btn.getAttribute('data-alt');
          titleEl.textContent = btn.getAttribute('data-title');
          countEl.textContent = (index + 1) + ' / ' + set.length;
          box.classList.remove('is-swapping');
        };
        if (animate && !reduced) {
          box.classList.add('is-swapping');
          setTimeout(apply, 180);
        } else {
          apply();
        }
      };

      var inertChrome = function (on) {
        if (page) page.inert = on;
        if (header) header.inert = on;
        if (sidemenu) sidemenu.inert = on;
      };

      var openBox = function (item) {
        set = matches.slice();
        opener = $('[data-open]', item);
        show(set.indexOf(item), false);
        box.classList.add('is-open');
        box.setAttribute('aria-hidden', 'false');
        body.classList.add('is-locked');
        doc.style.overflow = 'hidden';
        inertChrome(true);
        setTimeout(function () { $('[data-lightbox-close]', box).focus(); }, 50);
      };

      var closeBox = function () {
        box.classList.remove('is-open');
        box.setAttribute('aria-hidden', 'true');
        body.classList.remove('is-locked');
        doc.style.overflow = '';
        inertChrome(false);
        if (opener) opener.focus({ preventScroll: true });
      };

      refRoot.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-open]');
        if (btn) openBox(btn.closest('[data-card]'));
      });
      $('[data-lightbox-close]', box).addEventListener('click', closeBox);
      $('[data-lightbox-prev]', box).addEventListener('click', function () { show(index - 1, true); });
      $('[data-lightbox-next]', box).addEventListener('click', function () { show(index + 1, true); });
      box.addEventListener('click', function (e) {
        if (e.target === box || e.target.hasAttribute('data-lightbox-stage')) closeBox();
      });
      document.addEventListener('keydown', function (e) {
        if (!box.classList.contains('is-open')) return;
        if (e.key === 'Escape') closeBox();
        else if (e.key === 'ArrowRight') show(index + 1, true);
        else if (e.key === 'ArrowLeft') show(index - 1, true);
        else if (e.key === 'Tab') {
          var focusables = $$('button', box);
          var first = focusables[0];
          var last = focusables[focusables.length - 1];
          if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
          else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        }
      });
      var swipeX = null;
      box.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'mouse') swipeX = e.clientX; });
      box.addEventListener('pointerup', function (e) {
        if (swipeX === null) return;
        var dx = e.clientX - swipeX;
        swipeX = null;
        if (Math.abs(dx) > 50) show(index + (dx < 0 ? 1 : -1), true);
      });
    }
  }

  /* ------------------------------------------------------------------
     Forms: inline validation; never a fake success
     ------------------------------------------------------------------ */
  $$('form[data-validate]').forEach(function (form) {
    form.setAttribute('novalidate', 'novalidate');
    var status = $('[data-form-status]', form);
    var submitBtn = $('button[type="submit"]', form);
    var submitting = false;

    var wrapperFor = function (control) { return control.closest('.a-inputField'); };

    var messageFor = function (control) {
      var v = control.validity;
      var name = control.getAttribute('data-label') || 'This field';
      if (v.valueMissing) {
        if (control.type === 'checkbox') return 'Please tick this box to continue.';
        if (control.type === 'radio') return 'Please choose an option.';
        return name + ' is required.';
      }
      if (v.typeMismatch && control.type === 'email') return 'Enter a valid email address, for example name@example.com.';
      if (v.rangeUnderflow || v.rangeOverflow) return 'Enter a number in range.';
      if (v.badInput) return 'Enter a number.';
      return control.validationMessage || 'Please check this field.';
    };

    var setError = function (control, message) {
      var wrapper = wrapperFor(control);
      if (!wrapper) return;
      var errorEl = $('.a-inputField__error', wrapper);
      wrapper.classList.toggle('-error', Boolean(message));
      control.setAttribute('aria-invalid', message ? 'true' : 'false');
      if (errorEl) errorEl.textContent = message || '';
    };

    var validate = function (control) {
      if (control.disabled || control.type === 'hidden') return true;
      var ok = control.checkValidity();
      setError(control, ok ? '' : messageFor(control));
      return ok;
    };

    $$('input, select, textarea', form).forEach(function (control) {
      var errorEl = wrapperFor(control) && $('.a-inputField__error', wrapperFor(control));
      if (errorEl && errorEl.id) {
        var ids = (control.getAttribute('aria-describedby') || '').split(' ').filter(Boolean);
        if (ids.indexOf(errorEl.id) === -1) ids.push(errorEl.id);
        control.setAttribute('aria-describedby', ids.join(' '));
      }
      control.addEventListener('blur', function () { if (control.type !== 'checkbox' && control.type !== 'radio') validate(control); });
      control.addEventListener('input', function () {
        var w = wrapperFor(control);
        if (w && w.classList.contains('-error')) validate(control);
      });
      control.addEventListener('change', function () {
        var w = wrapperFor(control);
        if (w && w.classList.contains('-error')) validate(control);
      });
    });

    var say = function (state, html) {
      if (!status) return;
      status.setAttribute('data-state', state);
      status.innerHTML = html;
    };

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      if (submitting) return;

      var firstInvalid = null;
      $$('input, select, textarea', form).forEach(function (control) {
        if (!validate(control) && !firstInvalid) firstInvalid = control;
      });
      if (firstInvalid) {
        say('error', 'Please correct the highlighted fields and try again.');
        firstInvalid.focus();
        return;
      }

      if (!FORM_ENDPOINT) {
        say('info',
          '<strong>This form is not connected yet.</strong><br>' +
          'Your details have <em>not</em> been sent. Please call ' +
          '<a href="' + PHONE_HREF + '">' + PHONE_DISPLAY + '</a> or email ' +
          '<a href="mailto:' + EMAIL + '">' + EMAIL + '</a> and we will pick it up straight away.');
        status.focus();
        return;
      }

      submitting = true;
      if (submitBtn) submitBtn.setAttribute('aria-disabled', 'true');
      say('info', 'Sending your request&hellip;');
      fetch(FORM_ENDPOINT, { method: 'POST', headers: { Accept: 'application/json' }, body: new FormData(form) })
        .then(function (response) {
          if (!response.ok) throw new Error('Request failed: ' + response.status);
          form.reset();
          say('success', 'Thank you &mdash; your request has been sent. We will be in touch shortly.');
        })
        .catch(function () {
          say('error', 'Sorry, your request could not be sent. Please call ' +
            '<a href="' + PHONE_HREF + '">' + PHONE_DISPLAY + '</a> or email ' +
            '<a href="mailto:' + EMAIL + '">' + EMAIL + '</a>.');
        })
        .then(function () {
          submitting = false;
          if (submitBtn) submitBtn.removeAttribute('aria-disabled');
        });
    });
  });

  // The homepage footer hands its address over as ?email=.
  var prefill = $('[data-prefill-email]');
  if (prefill) {
    var m = /[?&]email=([^&]*)/.exec(location.search);
    if (m) {
      try { prefill.value = decodeURIComponent(m[1].replace(/\+/g, ' ')); } catch (e) {}
    }
  }

  // A product page links here as ?tank=<name>.
  (function () {
    var box = $('form textarea[name="message"]');
    var tank = /[?&]tank=([^&]*)/.exec(location.search);
    if (!box || !tank || box.value) return;
    try { box.value = 'Glass tank: ' + decodeURIComponent(tank[1].replace(/\+/g, ' ')) + '\n'; } catch (e) {}
  })();

  /* ------------------------------------------------------------------
     Glass tanks shop: range filter, sort, load more (12 at a time)
     ------------------------------------------------------------------ */
  (function () {
    var shop = $('[data-shop]');
    if (!shop) return;
    var grid = $('[data-shop-grid]', shop);
    var cards = $$('[data-tank]', grid);
    var chips = $$('[data-shop-range]', shop);
    var rangeButtons = $$('[data-shop-range]'); // chips + range tiles + table rows
    var sortSelect = $('[data-shop-sort]', shop);
    var moreBtn = $('[data-shop-more]', shop);
    var countEl = $('[data-shop-count]', shop);
    var emptyEl = $('[data-shop-empty]', shop);
    var STEP = 12;
    var state = { range: 'all', sort: 'featured', limit: STEP };
    cards.forEach(function (c, i) { c.setAttribute('data-order', i); });

    var params = new URL(location.href).searchParams;
    if (params.get('range')) state.range = params.get('range');
    if (params.get('sort')) state.sort = params.get('sort');

    var sorters = {
      'featured': function (a, b) { return a.dataset.order - b.dataset.order; },
      'price-asc': function (a, b) { return a.dataset.price - b.dataset.price; },
      'price-desc': function (a, b) { return b.dataset.price - a.dataset.price; },
      'gallons-asc': function (a, b) { return a.dataset.gallons - b.dataset.gallons; },
      'gallons-desc': function (a, b) { return b.dataset.gallons - a.dataset.gallons; },
      'name': function (a, b) { return a.dataset.name < b.dataset.name ? -1 : 1; }
    };

    var render = function () {
      var sorted = cards.slice().sort(sorters[state.sort] || sorters.featured);
      sorted.forEach(function (c) { grid.appendChild(c); });
      var matching = sorted.filter(function (c) { return state.range === 'all' || c.dataset.range === state.range; });
      sorted.forEach(function (c) { c.hidden = true; });
      matching.slice(0, state.limit).forEach(function (c) { c.hidden = false; });
      var shown = Math.min(state.limit, matching.length);
      moreBtn.hidden = shown >= matching.length;
      emptyEl.hidden = matching.length > 0;
      countEl.textContent = matching.length ? 'Showing ' + shown + ' of ' + matching.length + ' tank' + (matching.length === 1 ? '' : 's') : '';
      rangeButtons.forEach(function (b) {
        var on = b.getAttribute('data-shop-range') === state.range;
        b.classList.toggle('-active', on);
        if (b.hasAttribute('aria-pressed')) b.setAttribute('aria-pressed', String(on));
      });
      if (sortSelect.value !== state.sort) sortSelect.value = state.sort;
    };

    var remember = function () {
      try {
        var url = new URL(location.href);
        if (state.range === 'all') url.searchParams.delete('range'); else url.searchParams.set('range', state.range);
        if (state.sort === 'featured') url.searchParams.delete('sort'); else url.searchParams.set('sort', state.sort);
        history.replaceState(null, '', url);
      } catch (e) {}
    };

    rangeButtons.forEach(function (b) {
      b.addEventListener('click', function () {
        state.range = b.getAttribute('data-shop-range');
        state.limit = STEP;
        render();
        remember();
        // tiles and table rows live outside the catalogue: bring it into view
        if (!chips.some(function (c) { return c === b; })) {
          shop.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
        }
      });
    });
    sortSelect.addEventListener('change', function () {
      state.sort = sortSelect.value;
      render();
      remember();
    });
    moreBtn.addEventListener('click', function () {
      var firstNew = cards.filter(function (c) { return c.hidden && (state.range === 'all' || c.dataset.range === state.range); });
      state.limit += STEP;
      render();
      var sorted = cards.slice().sort(sorters[state.sort] || sorters.featured).filter(function (c) { return !c.hidden; });
      var focusTarget = sorted[state.limit - STEP];
      if (focusTarget && firstNew.length) { var l = $('a', focusTarget); if (l) l.focus({ preventScroll: true }); }
    });
    render();
  })();
})();


/* ==== home.js ==== */
/* =====================================================================
   Acrylic Pros — homepage behaviour
   Motion values reproduce aquatic-show.com (anime.js easings are mapped
   to their cubic-bezier equivalents and played with the Web Animations API).
   ===================================================================== */
(function () {
  'use strict';

  var doc = document.documentElement;
  var body = document.body;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (any-pointer: fine)').matches;
  var touch = window.matchMedia('(hover: none)').matches;

  var EASE_QUINT = 'cubic-bezier(.22, 1, .36, 1)';    // anime easeOutQuint
  var EASE_EXPO = 'cubic-bezier(.19, 1, .22, 1)';     // anime easeOutExpo
  var EASE_CUBIC = 'cubic-bezier(.215, .61, .355, 1)'; // anime easeOutCubic
  var EASE_IN_OUT_QUAD = 'cubic-bezier(.455, .03, .515, .955)';

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function clamp(v, min, max) { return Math.min(Math.max(v, min), max); }
  function raf(fn) { return window.requestAnimationFrame(fn); }

  /* ------------------------------------------------------------------
     Smooth scroll (Lenis, Locomotive v5 defaults)
     ------------------------------------------------------------------ */
  var lenis = null;
  if (!reduced && window.Lenis) {
    lenis = new window.Lenis({ lerp: 0.1, smoothWheel: true, wheelMultiplier: 1, touchMultiplier: 2, anchors: true });
    raf(function loop(time) { lenis.raf(time); raf(loop); });
  }

  /* ------------------------------------------------------------------
     Media sources (kept out of the HTML so reduced motion never loads them)
     ------------------------------------------------------------------ */
  var heroVideo = $('[data-hero] video[data-autoplay], [data-page-hero] video[data-autoplay]');
  if (heroVideo) {
    var portrait = window.matchMedia('(orientation: portrait)').matches;
    if (portrait) heroVideo.poster = heroVideo.getAttribute('data-poster-mobile');
    if (reduced) {
      heroVideo.removeAttribute('autoplay');
    } else {
      heroVideo.src = heroVideo.getAttribute(portrait ? 'data-src-mobile' : 'data-src-desktop');
    }
  }
  if (reduced) {
    $$('video[autoplay]').forEach(function (v) { v.removeAttribute('autoplay'); v.pause(); });
  }

  /* ------------------------------------------------------------------
     Scroll-driven state: hero zoom (--progress) and side rail direction
     ------------------------------------------------------------------ */
  var hero = $('[data-hero]');
  var sidemenu = $('[data-sidemenu]');
  var heroHeight = hero ? hero.offsetHeight : 1;
  var lastY = window.scrollY;
  var ticking = false;
  var menuOpen = false;

  function onScroll() {
    ticking = false;
    var y = window.scrollY;
    if (hero && !reduced) {
      hero.style.setProperty('--progress', clamp(y / heroHeight, 0, 1).toFixed(4));
    }
    if (sidemenu && !menuOpen && y !== lastY) {
      var max = Math.max(doc.scrollHeight - window.innerHeight, 1);
      var hidden = y > lastY && y / max > 0.01;
      sidemenu.classList.toggle('-isHidden', hidden);
    }
    lastY = y;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; raf(onScroll); }
  }, { passive: true });

  /* ------------------------------------------------------------------
     In-view classes (Locomotive data-scroll / data-scroll-offset)
     ------------------------------------------------------------------ */
  function rootMarginFor(el) {
    var offset = el.getAttribute('data-scroll-offset');
    if (!offset) return '-1px';
    var parts = offset.split(',').map(function (p) { return parseFloat(p) || 0; });
    // "start, end": in view once the top passes (100 - start)% of the
    // viewport, until the bottom passes end% from the top.
    return '-' + parts[1] + '% 0px -' + parts[0] + '% 0px';
  }

  var darkCount = 0;
  $$('[data-scroll]').forEach(function (el) {
    if (el === hero) return; // the intro reveals the hero
    var dark = el.hasAttribute('data-dark-ui');
    var wasIn = false;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) el.classList.add('is-inview');
        if (dark && entry.isIntersecting !== wasIn) {
          wasIn = entry.isIntersecting;
          darkCount += wasIn ? 1 : -1;
          raf(function () { body.classList.toggle('-dark', darkCount > 0); });
        }
        if (!dark && entry.isIntersecting) io.disconnect();
      });
    }, { rootMargin: rootMarginFor(el) });
    io.observe(el);
  });

  // Background videos only play while on screen.
  if (!reduced) {
    var videoIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var v = entry.target;
        if (entry.isIntersecting) { var p = v.play(); if (p) p.catch(function () {}); } else v.pause();
      });
    });
    $$('video[data-inview-play]').forEach(function (v) { videoIO.observe(v); });
  }

  // Lazy background image fades in once decoded.
  $$('img[data-fade]').forEach(function (img) {
    function done() { img.classList.add('-loaded'); }
    if (img.complete && img.naturalWidth) done(); else img.addEventListener('load', done);
  });

  /* ------------------------------------------------------------------
     Hero title: split into lines, rise with a 100ms expo stagger
     ------------------------------------------------------------------ */
  function expoOut(t) { return t === 1 ? 1 : 1 - Math.pow(2, -10 * t); }

  function titleReveal() {
    var el = $('[data-title]');
    if (!el) return;
    if (reduced) { el.style.opacity = 1; return; }

    var original = el.innerHTML;
    el.style.height = el.getBoundingClientRect().height + 'px';

    var words = [];
    (function walk(node, strong) {
      Array.prototype.forEach.call(node.childNodes, function (child) {
        if (child.nodeType === 3) {
          child.textContent.split(/\s+/).forEach(function (w) { if (w) words.push({ text: w, strong: strong }); });
        } else if (child.nodeName === 'BR') {
          words.push({ br: true });
        } else {
          walk(child, strong || child.nodeName === 'STRONG');
        }
      });
    })(el, false);

    // Their Title module gives up on phones when a word is too long to split cleanly.
    if (touch && words.some(function (w) { return w.text && w.text.length > 10; })) {
      el.style.opacity = 1;
      el.style.height = '';
      return;
    }

    el.textContent = '';
    var nodes = [];
    words.forEach(function (w) {
      if (w.br) { el.appendChild(document.createElement('br')); return; }
      var n = document.createElement(w.strong ? 'strong' : 'span');
      n.style.display = 'inline-block';
      n.textContent = w.text;
      el.appendChild(n);
      el.appendChild(document.createTextNode(' '));
      nodes.push(n);
    });

    var rows = [];
    nodes.forEach(function (n) {
      var top = n.offsetTop;
      var row = rows.filter(function (r) { return r.top === top; })[0];
      if (!row) { row = { top: top, nodes: [] }; rows.push(row); }
      row.nodes.push(n);
    });

    el.textContent = '';
    var lines = rows.map(function (row) {
      var wrapper = document.createElement('span');
      var line = document.createElement('span');
      wrapper.className = 'a-line-wrapper';
      line.className = 'a-line';
      wrapper.style.display = 'inline-block';
      line.style.display = 'inline-block';
      row.nodes.forEach(function (n) { line.appendChild(n); line.appendChild(document.createTextNode(' ')); });
      wrapper.appendChild(line);
      el.appendChild(wrapper);
      return line;
    });

    el.style.opacity = 1;
    var count = lines.length;
    var longest = 0;
    lines.forEach(function (line, i) {
      var delay = count > 1 ? expoOut(i / (count - 1)) * (count - 1) * 100 : 0;
      longest = Math.max(longest, delay);
      line.animate(
        [{ transform: 'translateY(120%)' }, { transform: 'translateY(0%)' }],
        { duration: 2000, delay: delay, easing: EASE_EXPO, fill: 'both' }
      );
    });
    setTimeout(function () {
      el.innerHTML = original;
      el.style.height = 'auto';
    }, 2000 + longest);
  }

  /* ------------------------------------------------------------------
     Intro: loader wipe (2.5s easeOutCubic) + hero reveals, together
     ------------------------------------------------------------------ */
  var loader = $('[data-loader]');
  var introStarted = false;

  function finishLoading() { doc.classList.remove('is-loading'); }

  function intro() {
    if (introStarted) return;
    introStarted = true;
    if (hero) hero.classList.add('is-inview');
    titleReveal();
    if (!loader) { finishLoading(); return; }
    if (reduced || !loader.animate) {
      loader.remove();
      finishLoading();
      return;
    }
    var wipe = loader.animate(
      [{ transform: 'translateY(-100%)' }, { transform: 'translateY(0%)' }],
      { duration: 2500, easing: EASE_CUBIC, fill: 'forwards' }
    );
    wipe.onfinish = function () { loader.remove(); finishLoading(); };
  }

  if (loader && !reduced) {
    var loaderVideo = $('video', loader);
    var start = function () {
      if (loaderVideo.readyState >= 1) intro();
      else {
        loaderVideo.addEventListener('loadedmetadata', intro, { once: true });
        setTimeout(intro, 1500);
      }
    };
    if (document.readyState === 'complete') start();
    else window.addEventListener('load', start, { once: true });
    setTimeout(intro, 4000); // never hold the page behind a white screen
  } else {
    intro();
  }

  /* ------------------------------------------------------------------
     "+" read-more accordions
     ------------------------------------------------------------------ */
  $$('[data-more]').forEach(function (box) {
    var btn = $('[data-more-btn]', box);
    var panel = $('[data-more-panel]', box);
    if (!btn || !panel) return;
    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') !== 'true';
      var h = panel.firstElementChild.scrollHeight;
      panel.style.setProperty('--heightscroll', h + 'px');
      if (panel.hasAttribute('data-auto-duration')) {
        panel.style.setProperty('--atransition', clamp(h / 600, 0.7, 3) + 's');
      }
      btn.setAttribute('aria-expanded', String(open));
      panel.setAttribute('aria-hidden', String(!open));
    });
  });

  /* ------------------------------------------------------------------
     Menu: the page shrinks into a rounded card and slides away
     ------------------------------------------------------------------ */
  var menu = $('[data-menu]');
  var burger = $('[data-burger]');
  var page = $('[data-page]');
  var scroller = $('[data-scroller]');

  if (menu && burger && page && scroller) {
    var nav = $('[data-menu-nav]', menu);
    var links = $$('[data-menu-link]', menu);
    var secondary = $$('[data-menu-secondary]', menu);
    var cards = $$('[data-menu-card]', menu);
    var smoke = $('.o-menu__smoke video', menu);
    var rects = $$('rect', burger);
    var savedY = 0;
    var pageAnim = null;
    var mediaLoaded = false;
    var closeTimer = null;
    var timeline = [];
    var burgerTimeline = [];

    var MS = 1000;
    var quint = { duration: MS, easing: EASE_QUINT, fill: 'both' };
    var withTail = { duration: MS, endDelay: MS, easing: EASE_QUINT, fill: 'both' };

    if (!reduced) {
      timeline.push(nav.animate([{ transform: 'translateY(50%)' }, { transform: 'translateY(0)' }], withTail));
      links.forEach(function (l) {
        timeline.push(l.animate([{ transform: 'translateY(100%)' }, { transform: 'translateY(0)' }], withTail));
      });
      secondary.forEach(function (l) {
        timeline.push(l.animate(
          [{ transform: 'translateY(100%)', opacity: 0 }, { transform: 'translateY(0)', opacity: 1 }],
          { duration: MS, delay: MS, easing: EASE_QUINT, fill: 'both' }
        ));
      });

      var half = { easing: EASE_QUINT };
      burgerTimeline.push(rects[0].animate([
        Object.assign({ transform: 'translateY(0) rotate(0deg)' }, half),
        Object.assign({ transform: 'translateY(3px) rotate(0deg)', offset: 0.5 }, half),
        { transform: 'translateY(3px) rotate(45deg)' }
      ], { duration: 750, fill: 'both' }));
      burgerTimeline.push(rects[2].animate([
        Object.assign({ transform: 'translateY(0) rotate(0deg)' }, half),
        Object.assign({ transform: 'translateY(-3px) rotate(0deg)', offset: 0.5 }, half),
        { transform: 'translateY(-3px) rotate(-45deg)' }
      ], { duration: 750, fill: 'both' }));
      burgerTimeline.push(rects[1].animate(
        [{ transform: 'rotate(0deg)' }, { transform: 'rotate(-45deg)' }],
        { duration: 375, delay: 375, easing: EASE_QUINT, fill: 'both' }
      ));
      timeline.concat(burgerTimeline).forEach(function (a) { a.pause(); });
    } else {
      // No motion: final states only.
      links.concat(secondary).concat([nav]).forEach(function (el) {
        el.style.transform = 'none';
        el.style.opacity = 1;
      });
    }

    var play = function (anims, forward) {
      anims.forEach(function (a) {
        if ((a.playbackRate > 0) !== forward) a.reverse();
        else a.play();
      });
    };

    var loadMenuMedia = function () {
      if (mediaLoaded || reduced) return;
      mediaLoaded = true;
      $$('video[data-src]', menu).forEach(function (v) {
        if (v === smoke || finePointer) v.src = v.getAttribute('data-src');
      });
    };

    var setInert = function (on) {
      page.inert = on;
      if (sidemenu) sidemenu.inert = on;
    };

    var openMenu = function () {
      if (menuOpen) return;
      menuOpen = true;
      clearTimeout(closeTimer);
      loadMenuMedia();
      savedY = window.scrollY;

      if (lenis) lenis.stop();
      body.style.overflow = 'hidden';
      doc.classList.remove('menu-closing');
      doc.classList.add('menu-open');

      page.classList.add('-cropped');
      scroller.style.transform = 'translateY(' + -savedY + 'px)';

      menu.setAttribute('aria-hidden', 'false');
      burger.setAttribute('aria-expanded', 'true');
      setInert(true);

      if (!reduced) {
        var from = pageAnim ? currentPageFrame() : { transform: 'translateY(0) scale(1)', borderRadius: '0px' };
        if (pageAnim) pageAnim.cancel();
        pageAnim = page.animate(
          [from, { transform: 'translateY(100%) scale(' + 1222 / 1440 + ')', borderRadius: '3.2rem' }],
          { duration: MS, easing: EASE_QUINT, fill: 'forwards' }
        );
        play(timeline, true);
        play(burgerTimeline, true);
        if (smoke) { var p = smoke.play(); if (p) p.catch(function () {}); }
      } else {
        page.style.visibility = 'hidden';
      }

      setTimeout(function () { if (menuOpen && sidemenu) sidemenu.classList.add('-isHidden'); }, 500);
      setTimeout(function () { if (menuOpen && links[0]) links[0].focus({ preventScroll: true }); }, 50);
    };

    var currentPageFrame = function () {
      var cs = getComputedStyle(page);
      return { transform: cs.transform === 'none' ? 'translateY(0) scale(1)' : cs.transform, borderRadius: cs.borderTopLeftRadius };
    };

    var restorePage = function () {
      page.classList.remove('-cropped');
      scroller.style.transform = '';
      page.style.visibility = '';
      if (pageAnim) { pageAnim.cancel(); pageAnim = null; }
      body.style.overflow = '';
      doc.classList.remove('menu-closing');
      if (lenis) {
        lenis.start();
        lenis.resize();
        lenis.scrollTo(savedY, { immediate: true, force: true });
      }
      window.scrollTo(0, savedY);
      if (smoke) smoke.pause();
    };

    var closeMenu = function () {
      if (!menuOpen) return;
      menuOpen = false;
      doc.classList.remove('menu-open');
      doc.classList.add('menu-closing');
      menu.setAttribute('aria-hidden', 'true');
      burger.setAttribute('aria-expanded', 'false');
      setInert(false);
      if (sidemenu) sidemenu.classList.remove('-isHidden');

      if (reduced) { restorePage(); return; }

      play(timeline, false);
      play(burgerTimeline, false);
      var from = currentPageFrame();
      if (pageAnim) pageAnim.cancel();
      pageAnim = page.animate(
        [from, { transform: 'translateY(0) scale(1)', borderRadius: '0px' }],
        { duration: MS, easing: EASE_QUINT, fill: 'forwards' }
      );
      pageAnim.onfinish = function () { if (!menuOpen) restorePage(); };
      // The reversed timeline runs 2s; keep the menu painted until it has.
      closeTimer = setTimeout(function () { if (!menuOpen) doc.classList.remove('menu-closing'); }, 2 * MS);
    };

    burger.addEventListener('click', function () { if (menuOpen) closeMenu(); else openMenu(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menuOpen) { closeMenu(); burger.focus(); }
    });

    // Hover cards: swing in from the right of the links, out to the left.
    if (finePointer) {
      links.forEach(function (link, i) {
        var card = cards[i];
        if (!card) return;
        var video = $('video', card);
        link.addEventListener('mouseenter', function () {
          card.getAnimations().forEach(function (a) { a.cancel(); });
          card.animate([
            { opacity: 0, transform: 'scale(.8) translateY(-25%) translateX(-125%) rotate(6deg)' },
            { opacity: 1, transform: 'scale(1) translateY(-50%) translateX(-150%) rotate(-6deg)' }
          ], { duration: 500, easing: EASE_CUBIC, fill: 'forwards' });
          if (video && video.src) { var p = video.play(); if (p) p.catch(function () {}); }
        });
        link.addEventListener('mouseleave', function () {
          var cs = getComputedStyle(card);
          var from = { opacity: cs.opacity, transform: cs.transform };
          card.getAnimations().forEach(function (a) { a.cancel(); });
          var out = card.animate([
            from,
            { opacity: 0, transform: 'scale(.8) translateY(-25%) translateX(-225%) rotate(-12deg)' }
          ], { duration: 500, easing: EASE_CUBIC, fill: 'forwards' });
          out.onfinish = function () { if (video) video.pause(); };
        });
      });
    }
  }

  /* ------------------------------------------------------------------
     Slider (Embla-like: 1:1 drag, exponential settle, trimmed snaps)
     ------------------------------------------------------------------ */
  function Slider(root) {
    var viewport = $('[data-slider-viewport]', root);
    var track = $('[data-slider-track]', root);
    var dotsBox = $('[data-slider-dots]', root);
    var prevBtn = $('[data-slider-prev]', root);
    var nextBtn = $('[data-slider-next]', root);
    var loop = root.hasAttribute('data-loop');
    var slides = [];
    var snaps = [];
    var dots = [];
    var slideW = 0;
    var total = 0;
    var minPos = 0;
    var baseLeft = 0;
    var pos = 0;
    var target = 0;
    var running = false;
    var last = 0;
    var dragging = false;
    var drag = null;
    var suppressClick = false;
    var api = {};

    function visible() {
      return Array.prototype.filter.call(track.children, function (s) { return !s.classList.contains('-hidden'); });
    }

    function measure() {
      track.style.transform = 'translate3d(0,0,0)';
      slides.forEach(function (s) { s.style.transform = ''; });
      slides = visible();
      slideW = slides.length ? slides[0].offsetWidth : 0;
      total = slides.reduce(function (sum, s) { return sum + s.offsetWidth; }, 0);
      baseLeft = track.getBoundingClientRect().left - viewport.getBoundingClientRect().left;
      if (loop) {
        snaps = slides.map(function (s) { return -s.offsetLeft; });
        minPos = -Infinity;
      } else {
        var max = Math.max(0, total - track.clientWidth);
        var seen = {};
        snaps = [];
        slides.forEach(function (s) {
          var v = -Math.min(s.offsetLeft, max);
          var key = Math.round(v);
          if (!seen[key]) { seen[key] = true; snaps.push(v); }
        });
        minPos = -max;
      }
      buildDots();
      render();
    }

    function buildDots() {
      if (!dotsBox) return;
      dotsBox.textContent = '';
      dots = snaps.map(function (_, i) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'm-slider__dot';
        b.setAttribute('aria-label', 'Go to slide ' + (i + 1));
        b.addEventListener('click', function () { goTo(i); });
        dotsBox.appendChild(b);
        return b;
      });
      dotsBox.hidden = snaps.length < 2;
    }

    function wrap(v) { return ((v % total) + total) % total; }

    function nearestIndex(p) {
      var best = 0;
      var bestD = Infinity;
      snaps.forEach(function (s, i) {
        var d = loop ? Math.abs(wrap(s - p + total / 2) - total / 2) : Math.abs(s - p);
        if (d < bestD) { bestD = d; best = i; }
      });
      return best;
    }

    function selected() { return nearestIndex(target); }

    function updateDots() {
      var idx = selected();
      dots.forEach(function (d, i) {
        d.classList.toggle('-active', i === idx);
        if (i === idx) d.setAttribute('aria-current', 'true'); else d.removeAttribute('aria-current');
      });
    }

    function render() {
      track.style.transform = 'translate3d(' + pos.toFixed(2) + 'px,0,0)';
      var vw = viewport.clientWidth;
      slides.forEach(function (s) {
        var shift = 0;
        if (loop && total) {
          var x = s.offsetLeft + pos;
          shift = wrap(x + total / 2 - slideW / 2) - (total / 2 - slideW / 2) - x;
          s.style.transform = shift ? 'translate3d(' + shift + 'px,0,0)' : '';
        }
        var left = baseLeft + s.offsetLeft + pos + shift;
        var w = s.offsetWidth;
        var seen = Math.max(0, Math.min(left + w, vw) - Math.max(left, 0));
        s.classList.toggle('-inView', w > 0 && seen / w >= 0.5);
      });
    }

    function tick(now) {
      var dt = last ? Math.min(now - last, 64) : 16;
      last = now;
      if (!dragging) {
        pos += (target - pos) * (1 - Math.exp(-dt * 0.013));
        if (Math.abs(target - pos) < 0.5) {
          pos = target;
          running = false;
          if (loop && total) { // renormalise without a visual jump
            var k = Math.round(pos / total) * total;
            pos -= k; target -= k;
          }
        }
      }
      render();
      if (running) raf(tick); else last = 0;
    }

    function kick() { if (!running) { running = true; raf(tick); } }

    function goTo(i) {
      if (!snaps.length) return;
      if (loop) {
        var n = snaps.length;
        var cur = selected();
        var steps = ((i - cur) % n + n) % n;
        if (steps > n / 2) steps -= n;
        target = target - steps * slideW;
      } else {
        target = snaps[clamp(i, 0, snaps.length - 1)];
      }
      updateDots();
      kick();
    }

    function step(dir) {
      if (loop) { target -= dir * slideW; updateDots(); kick(); }
      else goTo(selected() + dir);
    }

    // --- dragging
    viewport.addEventListener('dragstart', function (e) { e.preventDefault(); });
    viewport.addEventListener('pointerdown', function (e) {
      if (e.button !== 0 || !snaps.length) return;
      dragging = true;
      drag = { x: e.clientX, y: e.clientY, pos: pos, target: target, lastX: e.clientX, lastT: e.timeStamp, v: 0, moved: false, startIndex: selected(), locked: e.pointerType !== 'touch' };
      if (api.onDragStart) api.onDragStart();
      kick();
    });
    window.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      var dx = e.clientX - drag.x;
      if (!drag.locked) {
        var dy = e.clientY - drag.y;
        if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
        if (Math.abs(dy) > Math.abs(dx)) { endDrag(); return; }
        drag.locked = true;
      }
      if (Math.abs(dx) > 5 && !drag.moved) {
        drag.moved = true;
        viewport.classList.add('-dragging');
      }
      var p = drag.pos + dx;
      if (!loop) { // resistance past the ends
        if (p > 0) p *= 0.5;
        else if (p < minPos) p = minPos + (p - minPos) * 0.5;
      }
      pos = p;
      var dt = Math.max(e.timeStamp - drag.lastT, 1);
      drag.v = (e.clientX - drag.lastX) / dt;
      drag.lastX = e.clientX;
      drag.lastT = e.timeStamp;
    }, { passive: true });

    function endDrag() {
      if (!dragging) return;
      dragging = false;
      viewport.classList.remove('-dragging');
      var moved = pos - drag.pos;
      var projected = moved + drag.v * 120;
      // skipSnaps: false — a drag moves at most one snap.
      var dir = Math.abs(moved) > 20 || Math.abs(projected) > slideW / 2 ? (projected < 0 ? 1 : -1) : 0;
      if (loop) {
        target = drag.target - dir * slideW;
      } else {
        target = snaps[clamp(drag.startIndex + dir, 0, snaps.length - 1)];
      }
      suppressClick = drag.moved;
      updateDots();
      kick();
      if (api.onDragEnd) api.onDragEnd();
    }
    window.addEventListener('pointerup', endDrag);
    window.addEventListener('pointercancel', endDrag);
    viewport.addEventListener('click', function (e) {
      if (suppressClick) { e.preventDefault(); e.stopPropagation(); suppressClick = false; }
    }, true);

    // Keyboard focus brings the slide into view; overflow containers must not scroll natively.
    track.addEventListener('focusin', function (e) {
      var slide = e.target.closest('.m-slider__slide');
      var i = slides.indexOf(slide);
      if (i < 0) return;
      var vw = viewport.clientWidth;
      var left = baseLeft + slide.offsetLeft + target;
      if (left < 0 || left + slide.offsetWidth > vw + 1) goTo(loop ? i : nearestIndex(-slide.offsetLeft));
    });
    [viewport, root, root.parentNode, root.closest('section')].forEach(function (el) {
      if (el) el.addEventListener('scroll', function () { el.scrollLeft = 0; });
    });

    if (prevBtn) prevBtn.addEventListener('click', function () { step(-1); });
    if (nextBtn) nextBtn.addEventListener('click', function () { step(1); });

    api.reset = function () { pos = target = 0; measure(); updateDots(); };
    api.measure = function () {
      var idx = selected();
      measure();
      pos = target = loop ? -idx * slideW : snaps[clamp(idx, 0, snaps.length - 1)] || 0;
      updateDots();
      render();
    };
    api.isDragging = function () { return dragging && drag && drag.moved; };

    measure();
    updateDots();
    return api;
  }

  var sliders = [];
  $$('[data-slider]').forEach(function (root) { sliders.push({ root: root, api: new Slider(root) }); });
  function sliderFor(name) {
    var hit = sliders.filter(function (s) { return s.root.getAttribute('data-slider') === name; })[0];
    return hit || null;
  }

  /* ------------------------------------------------------------------
     Services: drag cursor, hover videos, category filter
     ------------------------------------------------------------------ */
  var products = sliderFor('products');
  if (products) {
    var pRoot = products.root;
    var pViewport = $('[data-slider-viewport]', pRoot);
    var dragger = $('[data-dragger]', pRoot);
    var hoverable = true;
    var currentCard = null;

    var setVideo = function (card, on) {
      var video = $('video[data-src]', card);
      if (!video) return;
      var fig = video.parentNode;
      raf(function () {
        fig.classList.toggle('-hover', on);
        if (on) {
          if (!video.getAttribute('src')) {
            video.src = video.getAttribute('data-src');
            video.addEventListener('loadeddata', function () {
              if (fig.classList.contains('-hover')) video.play().catch(function () {});
            });
          } else {
            var p = video.play(); if (p) p.catch(function () {});
          }
        } else {
          video.pause();
        }
      });
    };
    var leaveCard = function () { if (currentCard) { setVideo(currentCard, false); currentCard = null; } };

    products.api.onDragStart = function () { hoverable = false; leaveCard(); };
    products.api.onDragEnd = function () { hoverable = true; };

    if (finePointer && !reduced) {
      pRoot.addEventListener('mouseover', function (e) {
        var card = e.target.closest ? e.target.closest('[data-products]') : null;
        if (!card || !hoverable) { leaveCard(); return; }
        if (card !== currentCard) { leaveCard(); currentCard = card; setVideo(card, true); }
      });
      pRoot.addEventListener('mouseleave', leaveCard);
    }

    if (finePointer && dragger) {
      var lastMove = 0;
      var follow = function (e) {
        var r = pRoot.getBoundingClientRect();
        var x = e.clientX - r.left - 35;
        var y = e.clientY - r.top - 35;
        raf(function () { dragger.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0) scale(var(--scale))'; });
      };
      pViewport.addEventListener('mousemove', function (e) {
        if (e.timeStamp - lastMove < 40) return; // their 40ms throttle
        lastMove = e.timeStamp;
        follow(e);
      });
      pViewport.addEventListener('mouseenter', function (e) {
        follow(e);
        raf(function () { pRoot.classList.add('-hover'); });
      });
      pViewport.addEventListener('mouseleave', function () { raf(function () { pRoot.classList.remove('-hover'); }); });
    }

    var cat = $('[data-cat]');
    if (cat) {
      var buttons = $$('[data-cat-list] button', cat);
      var select = $('[data-cat-select]', cat);
      var filterRun = 0;

      var markActive = function (value) {
        buttons.forEach(function (b) {
          var on = b.getAttribute('data-value') === value;
          b.classList.toggle('-active', on);
          b.setAttribute('aria-pressed', String(on));
        });
      };

      var applyFilter = function (value) {
        $$('[data-slider-track] > li', pRoot).forEach(function (li) {
          li.classList.toggle('-hidden', value !== 'all' && li.getAttribute('data-cat') !== value);
        });
        products.api.reset();
      };

      var filter = function (value) {
        var run = ++filterRun;
        if (reduced || !pRoot.animate) { applyFilter(value); return; }
        pRoot.getAnimations().forEach(function (a) { a.cancel(); });
        var out = pRoot.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 150, easing: EASE_IN_OUT_QUAD, fill: 'forwards' });
        out.onfinish = function () {
          if (run !== filterRun) return;
          applyFilter(value);
          out.cancel();
          pRoot.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 150, easing: EASE_IN_OUT_QUAD });
        };
      };

      $('[data-cat-list]', cat).addEventListener('click', function (e) {
        var b = e.target.closest('button');
        if (!b || b.classList.contains('-active')) return;
        var value = b.getAttribute('data-value');
        filter(value);
        raf(function () {
          cat.style.setProperty('--offset', b.getAttribute('data-index'));
          cat.style.setProperty('--color', b.getAttribute('data-color'));
          markActive(value);
          select.value = value;
        });
      });
      select.addEventListener('change', function () {
        markActive(select.value);
        var b = buttons.filter(function (x) { return x.getAttribute('data-value') === select.value; })[0];
        if (b) {
          cat.style.setProperty('--offset', b.getAttribute('data-index'));
          cat.style.setProperty('--color', b.getAttribute('data-color'));
        }
        filter(select.value);
      });
    }
  }

  /* ------------------------------------------------------------------
     Client marquee: 60px/s leftwards, only while on screen
     ------------------------------------------------------------------ */
  var marquee = $('[data-marquee]');
  if (marquee) {
    var mTrack = $('[data-marquee-track]', marquee);
    var originals = Array.prototype.slice.call(mTrack.children);
    var setWidth = 0;
    var mx = 0;
    var mActive = false;
    var mLast = 0;
    var cloned = false;

    var setupMarquee = function () {
      mTrack.style.transform = '';
      setWidth = originals.reduce(function (sum, li) {
        var cs = getComputedStyle(li);
        return sum + li.offsetWidth + parseFloat(cs.marginRight);
      }, 0);
      var playable = setWidth > marquee.clientWidth && !reduced;
      marquee.classList.toggle('-disabled', !playable);
      if (playable && !cloned) {
        cloned = true;
        [1, 2].forEach(function () {
          originals.forEach(function (li) {
            var c = li.cloneNode(true);
            c.setAttribute('aria-hidden', 'true');
            $$('a', c).forEach(function (a) { a.tabIndex = -1; });
            mTrack.appendChild(c);
          });
        });
      }
      return playable;
    };

    var mLoop = function (now) {
      if (!mActive) { mLast = 0; return; }
      var dt = mLast ? Math.min(now - mLast, 64) : 16;
      mLast = now;
      mx -= dt * 0.06;
      if (-mx >= setWidth) mx += setWidth;
      mTrack.style.transform = 'matrix(1,0,0,1,' + mx.toFixed(2) + ',0)';
      raf(mLoop);
    };

    if (setupMarquee()) {
      new IntersectionObserver(function (entries) {
        var on = entries[0].isIntersecting;
        if (on && !mActive) { mActive = true; raf(mLoop); }
        mActive = on;
      }).observe(marquee);
    }
  }

  /* ------------------------------------------------------------------
     Video band: YouTube (nocookie) plays inline on demand
     ------------------------------------------------------------------ */
  var ytBoxes = $$('[data-yt]');
  // Only one player at a time: stopping = dropping the iframe.
  function stopVideos(except) {
    ytBoxes.forEach(function (other) {
      if (other === except) return;
      other.classList.remove('-playing');
      var m = $('[data-yt-mount]', other);
      if (m) m.innerHTML = '';
    });
  }
  // Moving the videos slider stops whatever is playing in it.
  $$('.o-homeNews [data-slider-prev], .o-homeNews [data-slider-next], .o-homeNews [data-slider-dots]').forEach(function (el) {
    el.addEventListener('click', function () { stopVideos(null); });
  });
  ytBoxes.forEach(function (box) {
    var btn = $('[data-yt-play]', box);
    var mount = $('[data-yt-mount]', box);
    btn.addEventListener('click', function () {
      stopVideos(box);
      box.classList.add('-playing');
      if (mount.firstChild) return;
      var f = document.createElement('iframe');
      f.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(box.getAttribute('data-yt')) +
        '?autoplay=1&modestbranding=1&rel=0&playsinline=1';
      f.title = box.getAttribute('data-yt-title') || 'Video';
      f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
      f.allowFullscreen = true;
      f.setAttribute('data-lenis-prevent', '');
      mount.appendChild(f);
      f.focus();
    });
  });

  /* ------------------------------------------------------------------
     Ambient YouTube band: muted, looping, no controls; loads when near
     the viewport and pauses when off screen
     ------------------------------------------------------------------ */
  $$('[data-yt-ambient]').forEach(function (box) {
    var id = box.getAttribute('data-yt-ambient');
    var mount = $('[data-yt-ambient-mount]', box);
    if (reduced) {
      // no motion wanted: a still frame from the same video instead
      var still = document.createElement('img');
      still.src = 'assets/images/video-thumbs/' + id + '.jpg';
      still.alt = '';
      still.className = 'b-video__still';
      box.appendChild(still);
      return;
    }
    var frame = document.createElement('iframe');
    var send = function (func) {
      if (frame.contentWindow) {
        frame.contentWindow.postMessage(JSON.stringify({ event: 'command', func: func, args: [] }), '*');
      }
    };
    frame.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(id) +
      '?autoplay=1&mute=1&loop=1&playlist=' + encodeURIComponent(id) +
      '&controls=0&disablekb=1&fs=0&modestbranding=1&playsinline=1&rel=0&iv_load_policy=3&enablejsapi=1' +
      '&origin=' + encodeURIComponent(location.origin);
    frame.title = box.getAttribute('aria-label') || 'Video';
    frame.allow = 'autoplay; encrypted-media';
    frame.tabIndex = -1;
    // Reveal only once the player reports "playing", so YouTube's own
    // thumbnail and spinner are never seen: the band goes straight to motion.
    window.addEventListener('message', function (e) {
      if (e.source !== frame.contentWindow || typeof e.data !== 'string') return;
      var data;
      try { data = JSON.parse(e.data); } catch (err) { return; }
      var state = data.event === 'onStateChange' ? data.info
        : (data.info && typeof data.info.playerState === 'number' ? data.info.playerState : null);
      if (state === 1) box.classList.add('-ready');
      if (state === 0) send('playVideo'); // belt and braces for the loop
    });
    frame.addEventListener('load', function () {
      frame.contentWindow.postMessage(JSON.stringify({ event: 'listening', id: 'ambient' }), '*');
      send('mute');
      send('playVideo');
    });
    mount.appendChild(frame);
    // keep it running whenever it is on screen
    new IntersectionObserver(function (entries) {
      send(entries[0].isIntersecting ? 'playVideo' : 'pauseVideo');
    }).observe(box);
  });

  /* ------------------------------------------------------------------
     Chat with the Pros: WhatsApp / text message to the owner's phone
     ------------------------------------------------------------------ */
  var chat = $('[data-chat]');
  if (chat) {
    var PHONE = '15625660150';
    var toggle = $('[data-chat-toggle]', chat);
    var chatPanel = $('[data-chat-panel]', chat);
    var nudge = $('[data-chat-nudge]', chat);
    var msg = $('[data-chat-message]', chat);
    var hint = $('[data-chat-hint]', chat);
    var topic = '';
    var setOpen = function (open) {
      chatPanel.hidden = !open;
      toggle.setAttribute('aria-expanded', String(open));
      if (open) {
        nudge.hidden = true;
        try { sessionStorage.setItem('ap:chat-seen', '1'); } catch (e) {}
        setTimeout(function () { msg.focus(); }, 50);
      }
    };
    toggle.addEventListener('click', function () { setOpen(chatPanel.hidden); });
    $('[data-chat-close]', chat).addEventListener('click', function () { setOpen(false); toggle.focus(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !chatPanel.hidden) { setOpen(false); toggle.focus(); }
    });
    $$('[data-chat-topic]', chat).forEach(function (b) {
      b.addEventListener('click', function () {
        topic = b.getAttribute('data-chat-topic');
        $$('[data-chat-topic]', chat).forEach(function (o) { o.classList.toggle('-active', o === b); });
        if (!msg.value.trim()) msg.value = 'Hi Acrylic Pros, I have a question about ' + topic.toLowerCase() + ': ';
        hint.hidden = true;
        msg.focus();
      });
    });
    var via = 'whatsapp';
    $$('[data-chat-via]', chat).forEach(function (b) {
      b.addEventListener('click', function () { via = b.getAttribute('data-chat-via'); });
    });
    $('[data-chat-form]', chat).addEventListener('submit', function (e) {
      e.preventDefault();
      var text = msg.value.trim();
      if (!text) { hint.hidden = false; msg.focus(); return; }
      text += '\n\n(Sent from ' + location.href + ')';
      if (via === 'whatsapp') {
        window.open('https://wa.me/' + PHONE + '?text=' + encodeURIComponent(text), '_blank', 'noopener');
      } else {
        var sep = /iPad|iPhone|iPod|Macintosh/.test(navigator.userAgent) ? '&' : '?';
        location.href = 'sms:+' + PHONE + sep + 'body=' + encodeURIComponent(text);
      }
    });
    var seen = false;
    try { seen = sessionStorage.getItem('ap:chat-seen') === '1'; } catch (e) {}
    if (!seen && !reduced) {
      setTimeout(function () { if (chatPanel.hidden) nudge.hidden = false; }, 6000);
      setTimeout(function () { nudge.hidden = true; }, 16000);
    }
  }

  /* ------------------------------------------------------------------
     Resize (their Website module debounces 600ms)
     ------------------------------------------------------------------ */
  var resizeTimer = null;
  var lastWidth = window.innerWidth;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      heroHeight = hero ? hero.offsetHeight : 1;
      if (window.innerWidth === lastWidth) return; // mobile URL-bar resizes
      lastWidth = window.innerWidth;
      sliders.forEach(function (s) { s.api.measure(); });
    }, 600);
  });
})();
