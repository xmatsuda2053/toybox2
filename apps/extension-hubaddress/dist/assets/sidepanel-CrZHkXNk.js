var e=Object.create,t=Object.defineProperty,n=Object.getOwnPropertyDescriptor,r=Object.getOwnPropertyNames,i=Object.getPrototypeOf,a=Object.prototype.hasOwnProperty,o=(e,t)=>()=>(t||(e((t={exports:{}}).exports,t),e=null),t.exports),s=(e,i,o,s)=>{if(i&&typeof i==`object`||typeof i==`function`)for(var c=r(i),l=0,u=c.length,d;l<u;l++)d=c[l],!a.call(e,d)&&d!==o&&t(e,d,{get:(e=>i[e]).bind(null,d),enumerable:!(s=n(i,d))||s.enumerable});return e},c=(n,r,o)=>(o=n==null?{}:e(i(n)),s(r||!n||!n.__esModule||!a.call(n,`default`)?t(o,`default`,{value:n,enumerable:!0}):o,n));(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),t.credentials=e.crossOrigin===`use-credentials`?`include`:e.crossOrigin===`anonymous`?`omit`:`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var l=globalThis,u=l.ShadowRoot&&(l.ShadyCSS===void 0||l.ShadyCSS.nativeShadow)&&`adoptedStyleSheets`in Document.prototype&&`replace`in CSSStyleSheet.prototype,d=Symbol(),f=new WeakMap,p=class{constructor(e,t,n){if(this._$cssResult$=!0,n!==d)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=e,this.t=t}get styleSheet(){let e=this.o,t=this.t;if(u&&e===void 0){let n=t!==void 0&&t.length===1;n&&(e=f.get(t)),e===void 0&&((this.o=e=new CSSStyleSheet).replaceSync(this.cssText),n&&f.set(t,e))}return e}toString(){return this.cssText}},m=e=>new p(typeof e==`string`?e:e+``,void 0,d),h=(e,...t)=>new p(e.length===1?e[0]:t.reduce((t,n,r)=>t+(e=>{if(!0===e._$cssResult$)return e.cssText;if(typeof e==`number`)return e;throw Error(`Value passed to 'css' function must be a 'css' function result: `+e+`. Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.`)})(n)+e[r+1],e[0]),e,d),g=(e,t)=>{if(u)e.adoptedStyleSheets=t.map(e=>e instanceof CSSStyleSheet?e:e.styleSheet);else for(let n of t){let t=document.createElement(`style`),r=l.litNonce;r!==void 0&&t.setAttribute(`nonce`,r),t.textContent=n.cssText,e.appendChild(t)}},_=u?e=>e:e=>e instanceof CSSStyleSheet?(e=>{let t=``;for(let n of e.cssRules)t+=n.cssText;return m(t)})(e):e,{is:v,defineProperty:y,getOwnPropertyDescriptor:b,getOwnPropertyNames:x,getOwnPropertySymbols:S,getPrototypeOf:C}=Object,w=globalThis,T=w.trustedTypes,E=T?T.emptyScript:``,ee=w.reactiveElementPolyfillSupport,te=(e,t)=>e,ne={toAttribute(e,t){switch(t){case Boolean:e=e?E:null;break;case Object:case Array:e=e==null?e:JSON.stringify(e)}return e},fromAttribute(e,t){let n=e;switch(t){case Boolean:n=e!==null;break;case Number:n=e===null?null:Number(e);break;case Object:case Array:try{n=JSON.parse(e)}catch{n=null}}return n}},re=(e,t)=>!v(e,t),D={attribute:!0,type:String,converter:ne,reflect:!1,useDefault:!1,hasChanged:re};Symbol.metadata??=Symbol(`metadata`),w.litPropertyMetadata??=new WeakMap;var ie=class extends HTMLElement{static addInitializer(e){this._$Ei(),(this.l??=[]).push(e)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(e,t=D){if(t.state&&(t.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(e)&&((t=Object.create(t)).wrapped=!0),this.elementProperties.set(e,t),!t.noAccessor){let n=Symbol(),r=this.getPropertyDescriptor(e,n,t);r!==void 0&&y(this.prototype,e,r)}}static getPropertyDescriptor(e,t,n){let{get:r,set:i}=b(this.prototype,e)??{get(){return this[t]},set(e){this[t]=e}};return{get:r,set(t){let a=r?.call(this);i?.call(this,t),this.requestUpdate(e,a,n)},configurable:!0,enumerable:!0}}static getPropertyOptions(e){return this.elementProperties.get(e)??D}static _$Ei(){if(this.hasOwnProperty(te(`elementProperties`)))return;let e=C(this);e.finalize(),e.l!==void 0&&(this.l=[...e.l]),this.elementProperties=new Map(e.elementProperties)}static finalize(){if(this.hasOwnProperty(te(`finalized`)))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(te(`properties`))){let e=this.properties,t=[...x(e),...S(e)];for(let n of t)this.createProperty(n,e[n])}let e=this[Symbol.metadata];if(e!==null){let t=litPropertyMetadata.get(e);if(t!==void 0)for(let[e,n]of t)this.elementProperties.set(e,n)}this._$Eh=new Map;for(let[e,t]of this.elementProperties){let n=this._$Eu(e,t);n!==void 0&&this._$Eh.set(n,e)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(e){let t=[];if(Array.isArray(e)){let n=new Set(e.flat(1/0).reverse());for(let e of n)t.unshift(_(e))}else e!==void 0&&t.push(_(e));return t}static _$Eu(e,t){let n=t.attribute;return!1===n?void 0:typeof n==`string`?n:typeof e==`string`?e.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(e=>this.enableUpdating=e),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(e=>e(this))}addController(e){(this._$EO??=new Set).add(e),this.renderRoot!==void 0&&this.isConnected&&e.hostConnected?.()}removeController(e){this._$EO?.delete(e)}_$E_(){let e=new Map,t=this.constructor.elementProperties;for(let n of t.keys())this.hasOwnProperty(n)&&(e.set(n,this[n]),delete this[n]);e.size>0&&(this._$Ep=e)}createRenderRoot(){let e=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return g(e,this.constructor.elementStyles),e}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(e=>e.hostConnected?.())}enableUpdating(e){}disconnectedCallback(){this._$EO?.forEach(e=>e.hostDisconnected?.())}attributeChangedCallback(e,t,n){this._$AK(e,n)}_$ET(e,t){let n=this.constructor.elementProperties.get(e),r=this.constructor._$Eu(e,n);if(r!==void 0&&!0===n.reflect){let i=(n.converter?.toAttribute===void 0?ne:n.converter).toAttribute(t,n.type);this._$Em=e,i==null?this.removeAttribute(r):this.setAttribute(r,i),this._$Em=null}}_$AK(e,t){let n=this.constructor,r=n._$Eh.get(e);if(r!==void 0&&this._$Em!==r){let e=n.getPropertyOptions(r),i=typeof e.converter==`function`?{fromAttribute:e.converter}:e.converter?.fromAttribute===void 0?ne:e.converter;this._$Em=r;let a=i.fromAttribute(t,e.type);this[r]=a??this._$Ej?.get(r)??a,this._$Em=null}}requestUpdate(e,t,n,r=!1,i){if(e!==void 0){let a=this.constructor;if(!1===r&&(i=this[e]),n??=a.getPropertyOptions(e),!((n.hasChanged??re)(i,t)||n.useDefault&&n.reflect&&i===this._$Ej?.get(e)&&!this.hasAttribute(a._$Eu(e,n))))return;this.C(e,t,n)}!1===this.isUpdatePending&&(this._$ES=this._$EP())}C(e,t,{useDefault:n,reflect:r,wrapped:i},a){n&&!(this._$Ej??=new Map).has(e)&&(this._$Ej.set(e,a??t??this[e]),!0!==i||a!==void 0)||(this._$AL.has(e)||(this.hasUpdated||n||(t=void 0),this._$AL.set(e,t)),!0===r&&this._$Em!==e&&(this._$Eq??=new Set).add(e))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(e){Promise.reject(e)}let e=this.scheduleUpdate();return e!=null&&await e,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(let[e,t]of this._$Ep)this[e]=t;this._$Ep=void 0}let e=this.constructor.elementProperties;if(e.size>0)for(let[t,n]of e){let{wrapped:e}=n,r=this[t];!0!==e||this._$AL.has(t)||r===void 0||this.C(t,void 0,n,r)}}let e=!1,t=this._$AL;try{e=this.shouldUpdate(t),e?(this.willUpdate(t),this._$EO?.forEach(e=>e.hostUpdate?.()),this.update(t)):this._$EM()}catch(t){throw e=!1,this._$EM(),t}e&&this._$AE(t)}willUpdate(e){}_$AE(e){this._$EO?.forEach(e=>e.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(e)),this.updated(e)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(e){return!0}update(e){this._$Eq&&=this._$Eq.forEach(e=>this._$ET(e,this[e])),this._$EM()}updated(e){}firstUpdated(e){}};ie.elementStyles=[],ie.shadowRootOptions={mode:`open`},ie[te(`elementProperties`)]=new Map,ie[te(`finalized`)]=new Map,ee?.({ReactiveElement:ie}),(w.reactiveElementVersions??=[]).push(`2.1.2`);var O=globalThis,ae=e=>e,oe=O.trustedTypes,se=oe?oe.createPolicy(`lit-html`,{createHTML:e=>e}):void 0,ce=`$lit$`,le=`lit$${Math.random().toFixed(9).slice(2)}$`,ue=`?`+le,de=`<${ue}>`,fe=document,pe=()=>fe.createComment(``),me=e=>e===null||typeof e!=`object`&&typeof e!=`function`,he=Array.isArray,k=e=>he(e)||typeof e?.[Symbol.iterator]==`function`,ge=`[ 	
\f\r]`,A=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,_e=/-->/g,ve=/>/g,ye=RegExp(`>|${ge}(?:([^\\s"'>=/]+)(${ge}*=${ge}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,`g`),be=/'/g,xe=/"/g,Se=/^(?:script|style|textarea|title)$/i,j=(e=>(t,...n)=>({_$litType$:e,strings:t,values:n}))(1),Ce=Symbol.for(`lit-noChange`),M=Symbol.for(`lit-nothing`),we=new WeakMap,Te=fe.createTreeWalker(fe,129);function Ee(e,t){if(!he(e)||!e.hasOwnProperty(`raw`))throw Error(`invalid template strings array`);return se===void 0?t:se.createHTML(t)}var De=(e,t)=>{let n=e.length-1,r=[],i,a=t===2?`<svg>`:t===3?`<math>`:``,o=A;for(let t=0;t<n;t++){let n=e[t],s,c,l=-1,u=0;for(;u<n.length&&(o.lastIndex=u,c=o.exec(n),c!==null);)u=o.lastIndex,o===A?c[1]===`!--`?o=_e:c[1]===void 0?c[2]===void 0?c[3]!==void 0&&(o=ye):(Se.test(c[2])&&(i=RegExp(`</`+c[2],`g`)),o=ye):o=ve:o===ye?c[0]===`>`?(o=i??A,l=-1):c[1]===void 0?l=-2:(l=o.lastIndex-c[2].length,s=c[1],o=c[3]===void 0?ye:c[3]===`"`?xe:be):o===xe||o===be?o=ye:o===_e||o===ve?o=A:(o=ye,i=void 0);let d=o===ye&&e[t+1].startsWith(`/>`)?` `:``;a+=o===A?n+de:l>=0?(r.push(s),n.slice(0,l)+ce+n.slice(l)+le+d):n+le+(l===-2?t:d)}return[Ee(e,a+(e[n]||`<?>`)+(t===2?`</svg>`:t===3?`</math>`:``)),r]},Oe=class e{constructor({strings:t,_$litType$:n},r){let i;this.parts=[];let a=0,o=0,s=t.length-1,c=this.parts,[l,u]=De(t,n);if(this.el=e.createElement(l,r),Te.currentNode=this.el.content,n===2||n===3){let e=this.el.content.firstChild;e.replaceWith(...e.childNodes)}for(;(i=Te.nextNode())!==null&&c.length<s;){if(i.nodeType===1){if(i.hasAttributes())for(let e of i.getAttributeNames())if(e.endsWith(ce)){let t=u[o++],n=i.getAttribute(e).split(le),r=/([.?@])?(.*)/.exec(t);c.push({type:1,index:a,name:r[2],strings:n,ctor:r[1]===`.`?Ne:r[1]===`?`?Pe:r[1]===`@`?Fe:Me}),i.removeAttribute(e)}else e.startsWith(le)&&(c.push({type:6,index:a}),i.removeAttribute(e));if(Se.test(i.tagName)){let e=i.textContent.split(le),t=e.length-1;if(t>0){i.textContent=oe?oe.emptyScript:``;for(let n=0;n<t;n++)i.append(e[n],pe()),Te.nextNode(),c.push({type:2,index:++a});i.append(e[t],pe())}}}else if(i.nodeType===8){if(i.data===ue)c.push({type:2,index:a});else{let e=-1;for(;(e=i.data.indexOf(le,e+1))!==-1;)c.push({type:7,index:a}),e+=le.length-1}}a++}}static createElement(e,t){let n=fe.createElement(`template`);return n.innerHTML=e,n}};function ke(e,t,n=e,r){if(t===Ce)return t;let i=r===void 0?n._$Cl:n._$Co?.[r],a=me(t)?void 0:t._$litDirective$;return i?.constructor!==a&&(i?._$AO?.(!1),a===void 0?i=void 0:(i=new a(e),i._$AT(e,n,r)),r===void 0?n._$Cl=i:(n._$Co??=[])[r]=i),i!==void 0&&(t=ke(e,i._$AS(e,t.values),i,r)),t}var Ae=class{constructor(e,t){this._$AV=[],this._$AN=void 0,this._$AD=e,this._$AM=t}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(e){let{el:{content:t},parts:n}=this._$AD,r=(e?.creationScope??fe).importNode(t,!0);Te.currentNode=r;let i=Te.nextNode(),a=0,o=0,s=n[0];for(;s!==void 0;){if(a===s.index){let t;s.type===2?t=new je(i,i.nextSibling,this,e):s.type===1?t=new s.ctor(i,s.name,s.strings,this,e):s.type===6&&(t=new Ie(i,this,e)),this._$AV.push(t),s=n[++o]}a!==s?.index&&(i=Te.nextNode(),a++)}return Te.currentNode=fe,r}p(e){let t=0;for(let n of this._$AV)n!==void 0&&(n.strings===void 0?n._$AI(e[t]):(n._$AI(e,n,t),t+=n.strings.length-2)),t++}},je=class e{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(e,t,n,r){this.type=2,this._$AH=M,this._$AN=void 0,this._$AA=e,this._$AB=t,this._$AM=n,this.options=r,this._$Cv=r?.isConnected??!0}get parentNode(){let e=this._$AA.parentNode,t=this._$AM;return t!==void 0&&e?.nodeType===11&&(e=t.parentNode),e}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(e,t=this){e=ke(this,e,t),me(e)?e===M||e==null||e===``?(this._$AH!==M&&this._$AR(),this._$AH=M):e!==this._$AH&&e!==Ce&&this._(e):e._$litType$===void 0?e.nodeType===void 0?k(e)?this.k(e):this._(e):this.T(e):this.$(e)}O(e){return this._$AA.parentNode.insertBefore(e,this._$AB)}T(e){this._$AH!==e&&(this._$AR(),this._$AH=this.O(e))}_(e){this._$AH!==M&&me(this._$AH)?this._$AA.nextSibling.data=e:this.T(fe.createTextNode(e)),this._$AH=e}$(e){let{values:t,_$litType$:n}=e,r=typeof n==`number`?this._$AC(e):(n.el===void 0&&(n.el=Oe.createElement(Ee(n.h,n.h[0]),this.options)),n);if(this._$AH?._$AD===r)this._$AH.p(t);else{let e=new Ae(r,this),n=e.u(this.options);e.p(t),this.T(n),this._$AH=e}}_$AC(e){let t=we.get(e.strings);return t===void 0&&we.set(e.strings,t=new Oe(e)),t}k(t){he(this._$AH)||(this._$AH=[],this._$AR());let n=this._$AH,r,i=0;for(let a of t)i===n.length?n.push(r=new e(this.O(pe()),this.O(pe()),this,this.options)):r=n[i],r._$AI(a),i++;i<n.length&&(this._$AR(r&&r._$AB.nextSibling,i),n.length=i)}_$AR(e=this._$AA.nextSibling,t){for(this._$AP?.(!1,!0,t);e!==this._$AB;){let t=ae(e).nextSibling;ae(e).remove(),e=t}}setConnected(e){this._$AM===void 0&&(this._$Cv=e,this._$AP?.(e))}},Me=class{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(e,t,n,r,i){this.type=1,this._$AH=M,this._$AN=void 0,this.element=e,this.name=t,this._$AM=r,this.options=i,n.length>2||n[0]!==``||n[1]!==``?(this._$AH=Array(n.length-1).fill(new String),this.strings=n):this._$AH=M}_$AI(e,t=this,n,r){let i=this.strings,a=!1;if(i===void 0)e=ke(this,e,t,0),a=!me(e)||e!==this._$AH&&e!==Ce,a&&(this._$AH=e);else{let r=e,o,s;for(e=i[0],o=0;o<i.length-1;o++)s=ke(this,r[n+o],t,o),s===Ce&&(s=this._$AH[o]),a||=!me(s)||s!==this._$AH[o],s===M?e=M:e!==M&&(e+=(s??``)+i[o+1]),this._$AH[o]=s}a&&!r&&this.j(e)}j(e){e===M?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,e??``)}},Ne=class extends Me{constructor(){super(...arguments),this.type=3}j(e){this.element[this.name]=e===M?void 0:e}},Pe=class extends Me{constructor(){super(...arguments),this.type=4}j(e){this.element.toggleAttribute(this.name,!!e&&e!==M)}},Fe=class extends Me{constructor(e,t,n,r,i){super(e,t,n,r,i),this.type=5}_$AI(e,t=this){if((e=ke(this,e,t,0)??M)===Ce)return;let n=this._$AH,r=e===M&&n!==M||e.capture!==n.capture||e.once!==n.once||e.passive!==n.passive,i=e!==M&&(n===M||r);r&&this.element.removeEventListener(this.name,this,n),i&&this.element.addEventListener(this.name,this,e),this._$AH=e}handleEvent(e){typeof this._$AH==`function`?this._$AH.call(this.options?.host??this.element,e):this._$AH.handleEvent(e)}},Ie=class{constructor(e,t,n){this.element=e,this.type=6,this._$AN=void 0,this._$AM=t,this.options=n}get _$AU(){return this._$AM._$AU}_$AI(e){ke(this,e)}},Le={M:ce,P:le,A:ue,C:1,L:De,R:Ae,D:k,V:ke,I:je,H:Me,N:Pe,U:Fe,B:Ne,F:Ie},N=O.litHtmlPolyfillSupport;N?.(Oe,je),(O.litHtmlVersions??=[]).push(`3.3.3`);var Re=(e,t,n)=>{let r=n?.renderBefore??t,i=r._$litPart$;if(i===void 0){let e=n?.renderBefore??null;r._$litPart$=i=new je(t.insertBefore(pe(),e),e,void 0,n??{})}return i._$AI(e),i},ze=globalThis,Be=class extends ie{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){let e=super.createRenderRoot();return this.renderOptions.renderBefore??=e.firstChild,e}update(e){let t=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(e),this._$Do=Re(t,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return Ce}};Be._$litElement$=!0,Be.finalized=!0,ze.litElementHydrateSupport?.({LitElement:Be});var P=ze.litElementPolyfillSupport;P?.({LitElement:Be}),(ze.litElementVersions??=[]).push(`4.2.2`);var Ve=h`
  :where(:root),
  .wa-neutral,
  :host([variant='neutral']) {
    --wa-color-fill-loud: var(--wa-color-neutral-fill-loud);
    --wa-color-fill-normal: var(--wa-color-neutral-fill-normal);
    --wa-color-fill-quiet: var(--wa-color-neutral-fill-quiet);
    --wa-color-border-loud: var(--wa-color-neutral-border-loud);
    --wa-color-border-normal: var(--wa-color-neutral-border-normal);
    --wa-color-border-quiet: var(--wa-color-neutral-border-quiet);
    --wa-color-on-loud: var(--wa-color-neutral-on-loud);
    --wa-color-on-normal: var(--wa-color-neutral-on-normal);
    --wa-color-on-quiet: var(--wa-color-neutral-on-quiet);
  }

  .wa-brand,
  :host([variant='brand']) {
    --wa-color-fill-loud: var(--wa-color-brand-fill-loud);
    --wa-color-fill-normal: var(--wa-color-brand-fill-normal);
    --wa-color-fill-quiet: var(--wa-color-brand-fill-quiet);
    --wa-color-border-loud: var(--wa-color-brand-border-loud);
    --wa-color-border-normal: var(--wa-color-brand-border-normal);
    --wa-color-border-quiet: var(--wa-color-brand-border-quiet);
    --wa-color-on-loud: var(--wa-color-brand-on-loud);
    --wa-color-on-normal: var(--wa-color-brand-on-normal);
    --wa-color-on-quiet: var(--wa-color-brand-on-quiet);
  }

  .wa-success,
  :host([variant='success']) {
    --wa-color-fill-loud: var(--wa-color-success-fill-loud);
    --wa-color-fill-normal: var(--wa-color-success-fill-normal);
    --wa-color-fill-quiet: var(--wa-color-success-fill-quiet);
    --wa-color-border-loud: var(--wa-color-success-border-loud);
    --wa-color-border-normal: var(--wa-color-success-border-normal);
    --wa-color-border-quiet: var(--wa-color-success-border-quiet);
    --wa-color-on-loud: var(--wa-color-success-on-loud);
    --wa-color-on-normal: var(--wa-color-success-on-normal);
    --wa-color-on-quiet: var(--wa-color-success-on-quiet);
  }

  .wa-warning,
  :host([variant='warning']) {
    --wa-color-fill-loud: var(--wa-color-warning-fill-loud);
    --wa-color-fill-normal: var(--wa-color-warning-fill-normal);
    --wa-color-fill-quiet: var(--wa-color-warning-fill-quiet);
    --wa-color-border-loud: var(--wa-color-warning-border-loud);
    --wa-color-border-normal: var(--wa-color-warning-border-normal);
    --wa-color-border-quiet: var(--wa-color-warning-border-quiet);
    --wa-color-on-loud: var(--wa-color-warning-on-loud);
    --wa-color-on-normal: var(--wa-color-warning-on-normal);
    --wa-color-on-quiet: var(--wa-color-warning-on-quiet);
  }

  .wa-danger,
  :host([variant='danger']) {
    --wa-color-fill-loud: var(--wa-color-danger-fill-loud);
    --wa-color-fill-normal: var(--wa-color-danger-fill-normal);
    --wa-color-fill-quiet: var(--wa-color-danger-fill-quiet);
    --wa-color-border-loud: var(--wa-color-danger-border-loud);
    --wa-color-border-normal: var(--wa-color-danger-border-normal);
    --wa-color-border-quiet: var(--wa-color-danger-border-quiet);
    --wa-color-on-loud: var(--wa-color-danger-on-loud);
    --wa-color-on-normal: var(--wa-color-danger-on-normal);
    --wa-color-on-quiet: var(--wa-color-danger-on-quiet);
  }
`,He=h`
  :host {
    --pulse-color: var(--wa-color-fill-loud, var(--wa-color-brand-fill-loud));

    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.375em 0.625em;
    color: var(--wa-color-on-loud, var(--wa-color-brand-on-loud));
    font-size: max(var(--wa-font-size-3xs), 0.75em);
    font-weight: var(--wa-font-weight-semibold);
    line-height: 1;
    vertical-align: middle;
    white-space: nowrap;
    background-color: var(--wa-color-fill-loud, var(--wa-color-brand-fill-loud));
    border-color: transparent;
    border-radius: var(--wa-border-radius-s);
    border-style: var(--wa-border-style);
    border-width: var(--wa-border-width-s);
    user-select: none;
    -webkit-user-select: none;
    cursor: inherit;

    min-width: 1.25em; /* <-- this is what Safari respects for intrinsic */
    min-height: 1em;
  }

  /* Appearance modifiers */
  :host([appearance='outlined']) {
    --pulse-color: var(--wa-color-border-loud, var(--wa-color-brand-border-loud));

    color: var(--wa-color-on-quiet, var(--wa-color-brand-on-quiet));
    background-color: transparent;
    border-color: var(--wa-color-border-loud, var(--wa-color-brand-border-loud));
  }

  :host([appearance='filled']) {
    --pulse-color: var(--wa-color-fill-normal, var(--wa-color-brand-fill-normal));

    color: var(--wa-color-on-normal, var(--wa-color-brand-on-normal));
    background-color: var(--wa-color-fill-normal, var(--wa-color-brand-fill-normal));
    border-color: transparent;
  }

  :host([appearance='filled-outlined']) {
    --pulse-color: var(--wa-color-border-normal, var(--wa-color-brand-border-normal));

    color: var(--wa-color-on-normal, var(--wa-color-brand-on-normal));
    background-color: var(--wa-color-fill-normal, var(--wa-color-brand-fill-normal));
    border-color: var(--wa-color-border-normal, var(--wa-color-brand-border-normal));
  }

  :host([appearance='accent']) {
    --pulse-color: var(--wa-color-fill-loud, var(--wa-color-brand-fill-loud));

    color: var(--wa-color-on-loud, var(--wa-color-brand-on-loud));
    background-color: var(--wa-color-fill-loud, var(--wa-color-brand-fill-loud));
    border-color: transparent;
  }

  /* Pill modifier */
  :host([pill]) {
    border-radius: var(--wa-border-radius-pill);
  }

  /* Pulse attention */
  :host([attention='pulse']) {
    animation: pulse 1.5s infinite;
  }

  @keyframes pulse {
    0% {
      box-shadow: 0 0 0 0 var(--pulse-color);
    }
    70% {
      box-shadow: 0 0 0 0.5rem transparent;
    }
    100% {
      box-shadow: 0 0 0 0 transparent;
    }
  }

  /* Bounce attention */
  :host([attention='bounce']) {
    animation: bounce 1s cubic-bezier(0.28, 0.84, 0.42, 1) infinite;
  }

  @keyframes bounce {
    0%,
    20%,
    50%,
    80%,
    100% {
      transform: translateY(0);
    }
    40% {
      transform: translateY(-5px);
    }
    60% {
      transform: translateY(-2px);
    }
  }

  /* Prevents vertical space when icons with vertical-align are slotted in - https://github.com/shoelace-style/webawesome/issues/2280 */
  [part='start'],
  [part='end'] {
    line-height: 0;
  }

  slot[name='start']::slotted(*) {
    margin-inline-end: 0.375em;
  }

  slot[name='end']::slotted(*) {
    margin-inline-start: 0.375em;
  }
`,Ue=Object.defineProperty,We=Object.getOwnPropertyDescriptor,Ge=e=>{throw TypeError(e)},F=(e,t,n,r)=>{for(var i=r>1?void 0:r?We(t,n):t,a=e.length-1,o;a>=0;a--)(o=e[a])&&(i=(r?o(t,n,i):o(i))||i);return r&&i&&Ue(t,n,i),i},Ke=(e,t,n)=>t.has(e)||Ge(`Cannot `+n),qe=(e,t,n)=>(Ke(e,t,`read from private field`),n?n.call(e):t.get(e)),Je=(e,t,n)=>t.has(e)?Ge(`Cannot add the same private member more than once`):t instanceof WeakSet?t.add(e):t.set(e,n),Ye=(e,t,n,r)=>(Ke(e,t,`write to private field`),r?r.call(e,n):t.set(e,n),n),I=e=>(t,n)=>{n===void 0?customElements.define(e,t):n.addInitializer(()=>{customElements.define(e,t)})},L={attribute:!0,type:String,converter:ne,reflect:!1,hasChanged:re},Xe=(e=L,t,n)=>{let{kind:r,metadata:i}=n,a=globalThis.litPropertyMetadata.get(i);if(a===void 0&&globalThis.litPropertyMetadata.set(i,a=new Map),r===`setter`&&((e=Object.create(e)).wrapped=!0),a.set(n.name,e),r===`accessor`){let{name:r}=n;return{set(n){let i=t.get.call(this);t.set.call(this,n),this.requestUpdate(r,i,e,!0,n)},init(t){return t!==void 0&&this.C(r,void 0,e,t),t}}}if(r===`setter`){let{name:r}=n;return function(n){let i=this[r];t.call(this,n),this.requestUpdate(r,i,e,!0,n)}}throw Error(`Unsupported decorator location: `+r)};function R(e){return(t,n)=>typeof n==`object`?Xe(e,t,n):((e,t,n)=>{let r=t.hasOwnProperty(n);return t.constructor.createProperty(n,e),r?Object.getOwnPropertyDescriptor(t,n):void 0})(e,t,n)}function z(e){return R({...e,state:!0,attribute:!1})}var Ze=(e,t,n)=>(n.configurable=!0,n.enumerable=!0,Reflect.decorate&&typeof t!=`object`&&Object.defineProperty(e,t,n),n);function B(e,t){return(n,r,i)=>{let a=t=>t.renderRoot?.querySelector(e)??null;if(t){let{get:e,set:t}=typeof r==`object`?n:i??(()=>{let e=Symbol();return{get(){return this[e]},set(t){this[e]=t}}})();return Ze(n,r,{get(){let n=e.call(this);return n===void 0&&(n=a(this),(n!==null||this.hasUpdated)&&t.call(this,n)),n}})}return Ze(n,r,{get(){return a(this)}})}}var Qe=h`
  :host {
    box-sizing: border-box;
  }

  :host *,
  :host *::before,
  :host *::after {
    box-sizing: inherit;
  }

  [hidden],
  :host([hidden]) {
    display: none !important;
  }
`,$e=/;\s+$/;function et(e){return e.replace(/[A-Z]/g,e=>`-${e.toLowerCase()}`)}function tt(e){let{property:t,value:n,element:r}=e;if(n){let e=r.getAttribute(`style`)||``;e&&(e.match($e)||(e+=`;`),e+=` `);let i=`${t}: ${n}`;return e.includes(i)?void 0:`${e}${i};`}return null}var nt,V=class extends Be{constructor(){super(),Je(this,nt,!1),this.initialReflectedProperties=new Map,this.didSSR=!!this.shadowRoot,this.customStates={set:(e,t)=>{if(this.internals?.states)try{t?this.internals.states.add(e):this.internals.states.delete(e)}catch(e){if(String(e).includes(`must start with '--'`))console.error(`Your browser implements an outdated version of CustomStateSet. Consider using a polyfill`);else throw e}},has:e=>{if(!this.internals?.states)return!1;try{return this.internals.states.has(e)}catch{return!1}}};try{this.internals=this.attachInternals()}catch{console.error(`Element internals are not supported in your browser. Consider using a polyfill`)}this.customStates.set(`wa-defined`,!0);let e=this.constructor;for(let[t,n]of e.elementProperties)n.default===`inherit`&&n.initial!==void 0&&typeof t==`string`&&this.customStates.set(`initial-${t}-${n.initial}`,!0)}static get styles(){return[Qe,...Array.isArray(this.css)?this.css:this.css?[this.css]:[]]}connectedCallback(){super.connectedCallback(),this.didSSR||this.shadowRoot?.prepend(document.createComment(` Web Awesome: https://webawesome.com/docs/components/${this.localName.replace(`wa-`,``)} `)),this.didSSR&&this.updateComplete.then(()=>{this.shadowRoot?.prepend(document.createComment(` Web Awesome: https://webawesome.com/docs/components/${this.localName.replace(`wa-`,``)} `))})}attributeChangedCallback(e,t,n){qe(this,nt)||(this.constructor.elementProperties.forEach((e,t)=>{e.reflect&&this[t]!=null&&this.initialReflectedProperties.set(t,this[t])}),Ye(this,nt,!0)),super.attributeChangedCallback(e,t,n)}willUpdate(e){super.willUpdate(e),this.initialReflectedProperties.forEach((t,n)=>{e.has(n)&&this[n]==null&&(this[n]=t)})}firstUpdated(e){super.firstUpdated(e),this.didSSR&&this.shadowRoot?.querySelectorAll(`slot`).forEach(e=>{e.dispatchEvent(new Event(`slotchange`,{bubbles:!0,composed:!1,cancelable:!1}))})}update(e){try{super.update(e)}catch(e){if(this.didSSR&&!this.hasUpdated){let t=new Event(`lit-hydration-error`,{bubbles:!0,composed:!0,cancelable:!1});t.error=e,this.dispatchEvent(t)}throw e}}setStyle(e,t){if(!this.style){let n=tt({property:et(e),value:t,element:this});n&&this.setAttribute(`style`,n);return}this.style[e]=t}setStyleProperty(e,t){if(!this.style){let n=tt({property:e,value:t,element:this});n&&this.setAttribute(`style`,n);return}this.style.setProperty(e,t)}relayNativeEvent(e,t){e.stopImmediatePropagation(),this.dispatchEvent(new e.constructor(e.type,{...e,...t}))}};nt=new WeakMap,F([R()],V.prototype,`dir`,2),F([R()],V.prototype,`lang`,2),F([R({type:Boolean,reflect:!0,attribute:`did-ssr`})],V.prototype,`didSSR`,2);var rt=class extends V{constructor(){super(...arguments),this.variant=`brand`,this.appearance=`accent`,this.pill=!1,this.attention=`none`}render(){return j`
      <span part="start">
        <slot name="start"></slot>
      </span>

      <span part="base badge" role="status">
        <slot></slot>
      </span>

      <span part="end">
        <slot name="end"></slot>
      </span>
    `}};rt.css=[Ve,He],F([R({reflect:!0})],rt.prototype,`variant`,2),F([R({reflect:!0})],rt.prototype,`appearance`,2),F([R({type:Boolean,reflect:!0})],rt.prototype,`pill`,2),F([R({reflect:!0})],rt.prototype,`attention`,2),rt=F([I(`wa-badge`)],rt);var it=()=>({checkValidity(e){let t=e.input,n={message:``,isValid:!0,invalidKeys:[]};if(!t)return n;let r=!0;if(`checkValidity`in t&&(r=t.checkValidity()),r)return n;if(n.isValid=!1,`validationMessage`in t&&(n.message=t.validationMessage),!(`validity`in t))return n.invalidKeys.push(`customError`),n;for(let e in t.validity){if(e===`valid`)continue;let r=e;t.validity[r]&&n.invalidKeys.push(r)}return n}}),at=class extends Event{constructor(){super(`wa-invalid`,{bubbles:!0,cancelable:!1,composed:!0})}},ot=()=>({observedAttributes:[`custom-error`],checkValidity(e){let t={message:``,isValid:!0,invalidKeys:[]};return e.customError&&(t.message=e.customError,t.isValid=!1,t.invalidKeys=[`customError`]),t}}),st=class extends V{constructor(){super(),this.name=null,this.disabled=!1,this.required=!1,this.assumeInteractionOn=[`input`],this.validators=[],this.valueHasChanged=!1,this.hasInteracted=!1,this.customError=null,this.emittedEvents=[],this.emitInvalid=e=>{e.target===this&&(this.hasInteracted=!0,this.dispatchEvent(new at))},this.handleInteraction=e=>{let t=this.emittedEvents;t.includes(e.type)||t.push(e.type),t.length===this.assumeInteractionOn?.length&&(this.hasInteracted=!0)},`addEventListener`in this&&this.addEventListener(`invalid`,this.emitInvalid)}static get validators(){return[ot()]}static get observedAttributes(){let e=new Set(super.observedAttributes||[]);for(let t of this.validators)if(t.observedAttributes)for(let n of t.observedAttributes)e.add(n);return[...e]}connectedCallback(){super.connectedCallback(),this.didSSR&&!this.hasUpdated?this.updateComplete.then(()=>{this.updateValidity()}):this.updateValidity(),this.assumeInteractionOn.forEach(e=>{this.addEventListener?.(e,this.handleInteraction)})}firstUpdated(...e){super.firstUpdated(...e),this.updateValidity()}willUpdate(e){if(e.has(`customError`)&&(this.customError||=null,this.setCustomValidity(this.customError||``)),e.has(`value`)||e.has(`disabled`)||e.has(`defaultValue`)){let e=this.value;this.updateFormValue(e)}e.has(`disabled`)&&(this.customStates.set(`disabled`,this.disabled),(this.hasAttribute(`disabled`)||!this.matches(`:disabled`))&&this.toggleAttribute(`disabled`,this.disabled)),super.willUpdate(e),this.didSSR&&!this.hasUpdated?this.updateComplete.then(()=>this.updateValidity()):this.updateValidity()}updateFormValue(e){if(Array.isArray(e)){if(this.name){let t=new FormData;for(let n of e)t.append(this.name,n);this.setValue(t,t)}}else this.setValue(e,e)}get labels(){return this.internals.labels}getForm(){return this.internals.form}set form(e){e?this.setAttribute(`form`,e):this.removeAttribute(`form`)}get form(){return this.internals.form}get validity(){return this.internals.validity}get willValidate(){return this.internals.willValidate}get validationMessage(){return this.internals.validationMessage}checkValidity(){return this.updateValidity(),this.internals.checkValidity()}reportValidity(){return this.updateValidity(),this.hasInteracted=!0,this.internals.reportValidity()}get validationTarget(){return this.input||void 0}setValidity(...e){let t=e[0],n=e[1],r=e[2];r||=this.validationTarget,this.internals.setValidity(t,n,r||void 0),this.requestUpdate(`validity`),this.setCustomStates()}setCustomStates(){let e=!!this.required,t=this.internals.validity.valid,n=this.hasInteracted;this.customStates.set(`required`,e),this.customStates.set(`optional`,!e),this.customStates.set(`invalid`,!t),this.customStates.set(`valid`,t),this.customStates.set(`user-invalid`,!t&&n),this.customStates.set(`user-valid`,t&&n)}setCustomValidity(e){if(!e){this.customError=null,this.setValidity({});return}this.customError=e,this.setValidity({customError:!0},e,this.validationTarget)}formResetCallback(){this.resetValidity(),this.hasInteracted=!1,this.valueHasChanged=!1,this.emittedEvents=[],this.updateValidity()}formDisabledCallback(e){this.disabled=e,this.updateValidity()}formStateRestoreCallback(e,t){this.didSSR&&!this.hasUpdated?this.updateComplete.then(()=>{this.value=e,t===`restore`&&this.resetValidity(),this.updateValidity()}):(this.value=e,t===`restore`&&this.resetValidity(),this.updateValidity())}setValue(...e){let[t,n]=e;this.internals.setFormValue(t,n)}get allValidators(){let e=this.constructor.validators||[],t=this.validators||[];return[...e,...t]}resetValidity(){this.setCustomValidity(``),this.setValidity({})}updateValidity(){if(this.disabled||this.hasAttribute(`disabled`)||!this.willValidate){this.resetValidity();return}let e=this.allValidators;if(!e?.length)return;let t={customError:!!this.customError},n=this.validationTarget||this.input||void 0,r=``;for(let n of e){let{isValid:e,message:i,invalidKeys:a}=n.checkValidity(this);e||(r||=i,a?.length>=0&&a.forEach(e=>t[e]=!0))}r||=this.validationMessage,this.setValidity(t,r,n)}};st.formAssociated=!0,F([R({reflect:!0})],st.prototype,`name`,2),F([R({type:Boolean})],st.prototype,`disabled`,2),F([R({state:!0,attribute:!1})],st.prototype,`valueHasChanged`,2),F([R({state:!0,attribute:!1})],st.prototype,`hasInteracted`,2),F([R({attribute:`custom-error`,reflect:!0})],st.prototype,`customError`,2),F([R({attribute:!1,state:!0,type:Object})],st.prototype,`validity`,1);var H=class{constructor(e,...t){this.slotNames=[],this.handleSlotChange=e=>{let t=e.target;(this.slotNames.includes(`[default]`)&&!t.name||t.name&&this.slotNames.includes(t.name))&&this.host.requestUpdate()},(this.host=e).addController(this),this.slotNames=t}hasDefaultSlot(){return this.host.childNodes?[...this.host.childNodes].some(e=>{if(e.nodeType===Node.TEXT_NODE&&e.textContent.trim()!==``)return!0;if(e.nodeType===Node.ELEMENT_NODE){let t=e;if(t.tagName.toLowerCase()===`wa-visually-hidden`)return!1;if(!t.hasAttribute(`slot`))return!0}return!1}):!1}hasNamedSlot(e){return this.host.querySelector?.(`:scope > [slot="${e}"]`)!==null}test(e,t){return t&&this.host.didSSR&&!this.host.hasUpdated?!!this.host[t]:e===`[default]`?this.hasDefaultSlot():this.hasNamedSlot(e)}hostConnected(){let e=this.host.shadowRoot;e&&`addEventListener`in e&&e.addEventListener(`slotchange`,this.handleSlotChange)}hostDisconnected(){let e=this.host.shadowRoot;e&&`removeEventListener`in e&&e.removeEventListener(`slotchange`,this.handleSlotChange)}},ct=h`
  @layer wa-component {
    :host {
      display: inline-block;

      /* Workaround because Chrome doesn't like :host(:has()) below
       * https://issues.chromium.org/issues/40062355
       * Firefox doesn't like this nested rule, so both are needed */
      &:has(wa-badge) {
        position: relative;
      }
    }

    /* Apply relative positioning only when needed to position wa-badge
     * This avoids creating a new stacking context for every button */
    :host(:has(wa-badge)) {
      position: relative;
    }
  }

  .button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    text-decoration: none;
    user-select: none;
    -webkit-user-select: none;
    white-space: nowrap;
    vertical-align: middle;
    transition-property: background, border, box-shadow, color, opacity, transform;
    transition-duration: var(--wa-transition-fast);
    transition-timing-function: var(--wa-transition-easing);
    transform-origin: center;
    cursor: pointer;
    padding: 0 var(--wa-form-control-padding-inline);
    font-family: inherit;
    font-size: inherit;
    font-weight: var(--wa-font-weight-action);
    height: var(--wa-form-control-height);
    width: 100%;

    background-color: var(--wa-color-fill-loud, var(--wa-color-neutral-fill-loud));

    border-color: transparent;
    color: var(--wa-color-on-loud, var(--wa-color-neutral-on-loud));
    border-start-start-radius: var(--_button-start-start-radius, var(--wa-form-control-border-radius));
    border-start-end-radius: var(--_button-start-end-radius, var(--wa-form-control-border-radius));
    border-end-start-radius: var(--_button-end-start-radius, var(--wa-form-control-border-radius));
    border-end-end-radius: var(--_button-end-end-radius, var(--wa-form-control-border-radius));
    border-style: var(--wa-form-control-border-style);
    border-width: var(--wa-form-control-border-width);
  }

  /* Hover and active transforms */
  .button:not(.disabled):not(.loading) {
    @media (hover: hover) {
      &:hover {
        transform: var(--wa-button-transform-hover);
      }
    }
    &:active {
      transform: var(--wa-button-transform-active);
    }

    @media (prefers-reduced-motion: reduce) {
      &:hover,
      &:active {
        transform: none;
      }
    }
  }

  /* Appearance modifiers */
  :host([appearance='plain']) {
    /* Indentation overrides for grouping */
    margin-inline-start: var(--_button-horizontal-indent);
    margin-block-start: var(--_button-vertical-indent);

    .button {
      color: var(--wa-color-on-quiet, var(--wa-color-neutral-on-quiet));
      background-color: transparent;
      border-color: transparent;
    }
    @media (hover: hover) {
      .button:not(.disabled):not(.loading):hover {
        color: var(--wa-color-on-quiet, var(--wa-color-neutral-on-quiet));
        background-color: var(--wa-color-fill-quiet, var(--wa-color-neutral-fill-quiet));
      }
    }
    .button:not(.disabled):not(.loading):active {
      color: var(--wa-color-on-quiet, var(--wa-color-neutral-on-quiet));
      background-color: color-mix(
        in oklab,
        var(--wa-color-fill-quiet, var(--wa-color-neutral-fill-quiet)),
        var(--wa-color-mix-active)
      );
    }
  }

  :host([appearance='outlined']) {
    /* Indentation overrides for grouping outlined */
    margin-inline-start: var(--_button-horizontal-indent-outlined);
    margin-block-start: var(--_button-vertical-indent-outlined);

    .button {
      color: var(--wa-color-on-quiet, var(--wa-color-neutral-on-quiet));
      background-color: transparent;
      border-color: var(--wa-color-border-loud, var(--wa-color-neutral-border-loud));
    }
    @media (hover: hover) {
      .button:not(.disabled):not(.loading):hover {
        color: var(--wa-color-on-quiet, var(--wa-color-neutral-on-quiet));
        background-color: var(--wa-color-fill-quiet, var(--wa-color-neutral-fill-quiet));
      }
    }
    .button:not(.disabled):not(.loading):active {
      color: var(--wa-color-on-quiet, var(--wa-color-neutral-on-quiet));
      background-color: color-mix(
        in oklab,
        var(--wa-color-fill-quiet, var(--wa-color-neutral-fill-quiet)),
        var(--wa-color-mix-active)
      );
    }
  }

  :host([appearance='filled']) {
    /* Indentation overrides for grouping */
    margin-inline-start: var(--_button-horizontal-indent);
    margin-block-start: var(--_button-vertical-indent);

    .button {
      color: var(--wa-color-on-normal, var(--wa-color-neutral-on-normal));
      background-color: var(--wa-color-fill-normal, var(--wa-color-neutral-fill-normal));
      border-color: transparent;
    }
    @media (hover: hover) {
      .button:not(.disabled):not(.loading):hover {
        color: var(--wa-color-on-normal, var(--wa-color-neutral-on-normal));
        background-color: color-mix(
          in oklab,
          var(--wa-color-fill-normal, var(--wa-color-neutral-fill-normal)),
          var(--wa-color-mix-hover)
        );
      }
    }
    .button:not(.disabled):not(.loading):active {
      color: var(--wa-color-on-normal, var(--wa-color-neutral-on-normal));
      background-color: color-mix(
        in oklab,
        var(--wa-color-fill-normal, var(--wa-color-neutral-fill-normal)),
        var(--wa-color-mix-active)
      );
    }
  }

  :host([appearance='filled-outlined']) {
    /* Indentation overrides for grouping outlined */
    margin-inline-start: var(--_button-horizontal-indent-outlined);
    margin-block-start: var(--_button-vertical-indent-outlined);

    .button {
      color: var(--wa-color-on-normal, var(--wa-color-neutral-on-normal));
      background-color: var(--wa-color-fill-normal, var(--wa-color-neutral-fill-normal));
      border-color: var(--wa-color-border-normal, var(--wa-color-neutral-border-normal));
    }
    @media (hover: hover) {
      .button:not(.disabled):not(.loading):hover {
        color: var(--wa-color-on-normal, var(--wa-color-neutral-on-normal));
        background-color: color-mix(
          in oklab,
          var(--wa-color-fill-normal, var(--wa-color-neutral-fill-normal)),
          var(--wa-color-mix-hover)
        );
      }
    }
    .button:not(.disabled):not(.loading):active {
      color: var(--wa-color-on-normal, var(--wa-color-neutral-on-normal));
      background-color: color-mix(
        in oklab,
        var(--wa-color-fill-normal, var(--wa-color-neutral-fill-normal)),
        var(--wa-color-mix-active)
      );
    }
  }

  :host([appearance='accent']) {
    /* Indentation overrides for grouping */
    margin-inline-start: var(--_button-horizontal-indent);
    margin-block-start: var(--_button-vertical-indent);

    .button {
      color: var(--wa-color-on-loud, var(--wa-color-neutral-on-loud));
      background-color: var(--wa-color-fill-loud, var(--wa-color-neutral-fill-loud));
      border-color: transparent;
    }
    @media (hover: hover) {
      .button:not(.disabled):not(.loading):hover {
        background-color: color-mix(
          in oklab,
          var(--wa-color-fill-loud, var(--wa-color-neutral-fill-loud)),
          var(--wa-color-mix-hover)
        );
      }
    }
    .button:not(.disabled):not(.loading):active {
      background-color: color-mix(
        in oklab,
        var(--wa-color-fill-loud, var(--wa-color-neutral-fill-loud)),
        var(--wa-color-mix-active)
      );
    }
  }

  /* Focus states */
  .button:focus {
    outline: none;
  }

  .button:focus-visible {
    outline: var(--wa-focus-ring);
    outline-offset: var(--wa-focus-ring-offset);
  }

  /* Disabled state */
  :host([disabled]) {
    opacity: 0.5;
    cursor: not-allowed;

    /* When disabled, prevent mouse events from bubbling up from children */
    .button {
      pointer-events: none;
    }
  }

  /* Keep it last so Safari doesn't stop parsing this block */
  .button::-moz-focus-inner {
    border: 0;
  }

  /* Icon buttons */
  .button.is-icon-button {
    outline-offset: 2px;
    width: var(--wa-form-control-height);
    aspect-ratio: 1;
  }

  /* Icon buttons with a caret need to grow to fit both the icon and the caret */
  .button.is-icon-button.caret {
    width: auto;
    aspect-ratio: auto;
    min-width: var(--wa-form-control-height);
  }

  /* Pill modifier */
  :host([pill]) .button {
    border-start-start-radius: var(--_button-start-start-radius, var(--wa-border-radius-pill));
    border-start-end-radius: var(--_button-start-end-radius, var(--wa-border-radius-pill));
    border-end-start-radius: var(--_button-end-start-radius, var(--wa-border-radius-pill));
    border-end-end-radius: var(--_button-end-end-radius, var(--wa-border-radius-pill));
  }

  /*
   * Label
   */

  .start,
  .end {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    pointer-events: none;
  }

  .label {
    display: inline-block;
  }

  .is-icon-button .label {
    display: flex;
    justify-content: center;
  }

  .label::slotted(wa-icon) {
    align-self: center;
  }

  /*
   * Caret modifier
   */

  wa-icon[part='caret'] {
    display: flex;
    align-self: center;
    align-items: center;

    &::part(svg) {
      width: 0.875em;
      height: 0.875em;
    }

    .button:has(&) .end {
      display: none;
    }
  }

  /*
   * Loading modifier
   */

  .loading {
    position: relative;
    cursor: wait;

    .start,
    .label,
    .end,
    .caret {
      /* Hidden with opacity, not visibility, so the label stays in the accessibility tree */
      opacity: 0;

      /* Unlike visibility: hidden, opacity leaves the content clickable */
      pointer-events: none;
    }

    wa-spinner {
      --indicator-color: currentColor;
      --track-color: color-mix(in oklab, currentColor, transparent 90%);

      position: absolute;
      font-size: 1em;
      height: 1em;
      width: 1em;
      top: calc(50% - 0.5em);
      left: calc(50% - 0.5em);
    }
  }

  /*
   * Badges
   */

  .button ::slotted(wa-badge) {
    border-color: var(--wa-color-surface-default);
    position: absolute;
    inset-block-start: 0;
    inset-inline-end: 0;
    translate: 50% -50%;
    pointer-events: none;
  }

  :host(:dir(rtl)) ::slotted(wa-badge) {
    translate: -50% -50%;
  }

  /*
  * Button spacing
  */

  slot[name='start']::slotted(*) {
    margin-inline-end: 0.75em;
  }

  slot[name='end']::slotted(*),
  .button:not(.visually-hidden-label) [part='caret'] {
    margin-inline-start: 0.75em;
  }
`,lt={small:`s`,medium:`m`,large:`l`},ut=new Set;function dt(e,t){t in lt&&!ut.has(`${e}:${t}`)&&(ut.add(`${e}:${t}`),console.warn(`[${e}] size="${t}" is deprecated. Use size="${lt[t]}" instead. The long-form value will be removed in the next major version.`))}var ft=h`
  :host([size='xs']) {
    font-size: var(--wa-font-size-xs);
  }

  :host([size='s']),
  :host([size='small']) {
    font-size: var(--wa-font-size-s);
  }

  :host([size='m']),
  :host([size='medium']) {
    font-size: var(--wa-font-size-m);
  }

  :host([size='l']),
  :host([size='large']) {
    font-size: var(--wa-font-size-l);
  }

  :host([size='xl']) {
    font-size: var(--wa-font-size-xl);
  }
`;function U(e,t){let n={waitUntilFirstUpdate:!1,...t};return(t,r)=>{let{update:i}=t,a=Array.isArray(e)?e:[e];t.update=function(e){a.forEach(t=>{let i=t;if(e.has(i)){let t=e.get(i),a=this[i];t!==a&&(!n.waitUntilFirstUpdate||this.hasUpdated)&&this[r](t,a)}}),i.call(this,e)}}}var pt=new Set,mt=new Map,ht,gt=`ltr`,W=`en`,_t=typeof MutationObserver<`u`&&typeof document<`u`&&document.documentElement!==void 0;if(_t){let e=new MutationObserver(yt);gt=document.documentElement.dir||`ltr`,W=document.documentElement.lang||navigator.language,e.observe(document.documentElement,{attributes:!0,attributeFilter:[`dir`,`lang`]})}function vt(...e){e.map(e=>{let t=e.$code.toLowerCase();mt.has(t)?mt.set(t,Object.assign(Object.assign({},mt.get(t)),e)):mt.set(t,e),ht||=e}),yt()}function yt(){_t&&(gt=document.documentElement.dir||`ltr`,W=document.documentElement.lang||navigator.language),[...pt.keys()].map(e=>{typeof e.requestUpdate==`function`&&e.requestUpdate()})}var bt=class{constructor(e){this.host=e,this.host.addController(this)}hostConnected(){pt.add(this.host)}hostDisconnected(){pt.delete(this.host)}dir(){return`${this.host.dir||gt}`.toLowerCase()}lang(){let e=`${this.host.lang||W}`.toLowerCase().replace(/_/g,`-`);try{return new Intl.Locale(e),e}catch{return ht?ht.$code.toLowerCase():`en`}}getTranslationData(e){let t;try{t=new Intl.Locale(e.replace(/_/g,`-`))}catch{return{locale:void 0,language:``,region:``,primary:void 0,secondary:void 0}}let n=t.language.toLowerCase(),r=t.region?.toLowerCase()??``,i=mt.get(`${n}-${r}`),a=mt.get(n);return{locale:t,language:n,region:r,primary:i,secondary:a}}exists(e,t){let{primary:n,secondary:r}=this.getTranslationData(t.lang??this.lang());return t=Object.assign({includeFallback:!1},t),!!(n&&n[e]||r&&r[e]||t.includeFallback&&ht&&ht[e])}term(e,...t){let{primary:n,secondary:r}=this.getTranslationData(this.lang()),i;if(n&&n[e])i=n[e];else if(r&&r[e])i=r[e];else if(ht&&ht[e])i=ht[e];else return console.error(`No translation found for: ${String(e)}`),String(e);return typeof i==`function`?i(...t):i}date(e,t){return e=new Date(e),new Intl.DateTimeFormat(this.lang(),t).format(e)}number(e,t){return e=Number(e),isNaN(e)?``:new Intl.NumberFormat(this.lang(),t).format(e)}relativeTime(e,t,n){return new Intl.RelativeTimeFormat(this.lang(),n).format(e,t)}},xt={$code:`en`,$name:`English`,$dir:`ltr`,allTagsRemoved:`All tags removed`,am:`AM`,autosizeColumn:`Autosize column`,captions:`Captions`,carousel:`Carousel`,chooseDate:`Choose date`,chooseDecade:`Choose decade`,chooseMonth:`Choose month`,chooseTime:`Choose time`,chooseYear:`Choose year`,clearEntry:`Clear entry`,clearFilter:`Clear filter`,clearSort:`Clear sort`,close:`Close`,closeCalendar:`Close calendar`,closeTimeInput:`Close time picker`,collapseRow:`Collapse row`,columnMenu:`Column options`,columnMovedToPosition:(e,t,n)=>`${e} moved to position ${t} of ${n}`,columns:`Columns`,compactPageXOfY:(e,t)=>`${e} of ${t}`,copied:`Copied`,copy:`Copy`,createOption:e=>`Create "${e}"`,currentlyPlaying:`currently playing`,currentValue:`Current value`,date:`Date`,datePickerKeyboardHelp:`Use arrow keys to change values; press Alt+Down Arrow to open the calendar.`,day:`Day`,dayPeriod:`AM/PM`,decrement:`Decrement`,deselectAllRows:`Deselect all rows`,dropFileHere:`Drop file here or click to browse`,dropFilesHere:`Drop files here or click to browse`,empty:`Empty`,endDate:`End date`,enterFullscreen:`Enter fullscreen`,error:`Error`,exitFullscreen:`Exit fullscreen`,expandRow:`Expand row`,filterByColumn:e=>`Filter by ${e}`,filterFrom:`From`,filterMax:`Max`,filterMin:`Min`,filterTo:`To`,firstPage:`First page`,goToSlide:(e,t)=>`Go to slide ${e} of ${t}`,hideColumn:`Hide column`,hidePassword:`Hide password`,hour:`Hour`,incompleteDate:`Enter a valid date.`,increment:`Increment`,jumpBackwardX:e=>`Jump back ${e} pages`,jumpForwardX:e=>`Jump forward ${e} pages`,lastPage:`Last page`,loading:`Loading`,minute:`Minute`,month:`Month`,moreOptions:`More Options`,mute:`Mute`,nextDecade:`Next decade`,nextMonth:`Next month`,nextPage:`Next page`,nextSlide:`Next slide`,nextVideo:`Next Video`,nextYear:`Next year`,noData:`No data`,noResults:`No matching results`,now:`Now`,numCharacters:e=>e===1?`1 character`:`${e} characters`,numCharactersRemaining:e=>e===1?`1 character remaining`:`${e} characters remaining`,numOptionsSelected:e=>e===0?`No options selected`:e===1?`1 option selected`:`${e} options selected`,numRowsCopied:e=>e===1?`1 row copied`:`${e} rows copied`,numRowsSelected:e=>e===1?`1 row selected`:`${e} rows selected`,pageXOfY:(e,t)=>`Page ${e} of ${t}`,pagination:`Pagination`,pause:`Pause`,pauseAnimation:`Pause animation`,pictureInPicture:`Picture in picture`,pinLeft:`Pin left`,pinRight:`Pin right`,play:`Play`,playAnimation:`Play animation`,playbackSpeed:`Playback speed`,playlist:`Playlist`,pm:`PM`,previousDecade:`Previous decade`,previousMonth:`Previous month`,previousPage:`Previous page`,previousSlide:`Previous slide`,previousVideo:`Previous video`,previousYear:`Previous year`,progress:`Progress`,rangeTooLong:e=>e===1?`Select a range no longer than 1 day`:`Select a range no longer than ${e} days`,rangeTooShort:e=>e===1?`Select a range at least 1 day long`:`Select a range at least ${e} days long`,readonly:`Read-only`,remove:`Remove`,resetColumns:`Reset columns`,resize:`Resize`,resizeColumn:`Resize column`,rowsPerPage:`Rows per page`,scrollableRegion:`Scrollable region`,scrollToEnd:`Scroll to end`,scrollToStart:`Scroll to start`,search:`Search`,second:`Second`,seek:`Seek`,seekProgress:(e,t)=>`${e} of ${t}`,selectAColorFromTheScreen:`Select a color from the screen`,selectAllRows:`Select all rows`,selected:`Selected`,selectedDateLabel:e=>`Selected: ${e}`,selectedRangeLabel:e=>`Selected range: ${e}`,selectGroup:`Select group`,selectionCleared:`Selection cleared`,selectRow:`Select row`,showingNofMRows:(e,t)=>`Showing ${e} of ${t} rows`,showingXtoYofZ:(e,t,n)=>`${e}\u2013${t} of ${n}`,showPassword:`Show password`,slideNum:e=>`Slide ${e}`,sortAscending:`Sort ascending`,sortColumn:`Sort column`,sortDescending:`Sort descending`,startDate:`Start date`,tagAdded:e=>`${e} added`,tagAlreadyAdded:e=>`${e} is already added`,tagInputKeyboardHelp:`Press Backspace or Delete to remove this tag.`,tagRemoved:e=>`${e} removed`,time:`Time`,timeInputKeyboardHelp:`Use arrow keys to change values; press Alt+Down Arrow to open the time picker.`,today:`Today`,toggleColorFormat:`Toggle color format`,tooFewTags:e=>e===1?`Add at least 1 tag`:`Add at least ${e} tags`,tooManyTags:e=>e===1?`Add no more than 1 tag`:`Add no more than ${e} tags`,unmute:`Unmute`,unpin:`Unpin`,unpinColumn:`Unpin column`,videoPlayer:`Video player`,volume:`Volume`,year:`Year`,zoomIn:`Zoom in`,zoomOut:`Zoom out`};vt(xt);var St=xt,Ct=class extends bt{lang(){return this.host.didSSR&&!this.host.hasUpdated?this.host.lang||`en`:super.lang()}};vt(St);var G={ATTRIBUTE:1,CHILD:2,PROPERTY:3,BOOLEAN_ATTRIBUTE:4,EVENT:5,ELEMENT:6},wt=e=>(...t)=>({_$litDirective$:e,values:t}),Tt=class{constructor(e){}get _$AU(){return this._$AM._$AU}_$AT(e,t,n){this._$Ct=e,this._$AM=t,this._$Ci=n}_$AS(e,t){return this.update(e,t)}update(e,t){return this.render(...t)}},K=wt(class extends Tt{constructor(e){if(super(e),e.type!==G.ATTRIBUTE||e.name!==`class`||e.strings?.length>2)throw Error("`classMap()` can only be used in the `class` attribute and must be the only part in the attribute.")}render(e){return` `+Object.keys(e).filter(t=>e[t]).join(` `)+` `}update(e,[t]){if(this.st===void 0){this.st=new Set,e.strings!==void 0&&(this.nt=new Set(e.strings.join(` `).split(/\s/).filter(e=>e!==``)));for(let e in t)t[e]&&!this.nt?.has(e)&&this.st.add(e);return this.render(t)}let n=e.element.classList;for(let e of this.st)e in t||(n.remove(e),this.st.delete(e));for(let e in t){let r=!!t[e];r===this.st.has(e)||this.nt?.has(e)||(r?(n.add(e),this.st.add(e)):(n.remove(e),this.st.delete(e)))}return Ce}}),q=e=>e??M,Et=Symbol.for(``),Dt=e=>{if(e?.r===Et)return e?._$litStatic$},Ot=(e,...t)=>({_$litStatic$:t.reduce((t,n,r)=>t+(e=>{if(e._$litStatic$!==void 0)return e._$litStatic$;throw Error(`Value passed to 'literal' function must be a 'literal' result: ${e}. Use 'unsafeStatic' to pass non-literal values, but\n            take care to ensure page security.`)})(n)+e[r+1],e[0]),r:Et}),kt=new Map,At=(e=>(t,...n)=>{let r=n.length,i,a,o=[],s=[],c,l=0,u=!1;for(;l<r;){for(c=t[l];l<r&&(a=n[l],(i=Dt(a))!==void 0);)c+=i+t[++l],u=!0;l!==r&&s.push(a),o.push(c),l++}if(l===r&&o.push(t[r]),u){let e=o.join(`$$lit$$`);(t=kt.get(e))===void 0&&(o.raw=o,kt.set(e,t=o)),n=s}return e(t,...n)})(j),J=class extends st{constructor(){super(...arguments),this.assumeInteractionOn=[`click`],this.hasSlotController=new H(this,`[default]`,`start`,`end`),this.localize=new Ct(this),this.invalid=!1,this.isIconButton=!1,this.title=``,this.variant=`neutral`,this.appearance=`accent`,this.size=`m`,this.withCaret=!1,this.withStart=!1,this.withEnd=!1,this.disabled=!1,this.loading=!1,this.pill=!1,this.type=`button`}static get validators(){return[...super.validators,it()]}handleSizeChange(){dt(this.localName,this.size)}constructLightDOMButton(){let e=document.createElement(`button`);for(let t of this.attributes)t.name!==`style`&&e.setAttribute(t.name,t.value);return e.type=this.type,e.style.position=`absolute !important`,e.style.width=`0 !important`,e.style.height=`0 !important`,e.style.clipPath=`inset(50%) !important`,e.style.overflow=`hidden !important`,e.style.whiteSpace=`nowrap !important`,this.name&&(e.name=this.name),e.value=this.value||``,e}handleClick(e){if(this.disabled||this.loading){e.preventDefault(),e.stopImmediatePropagation();return}if(this.type!==`submit`&&this.type!==`reset`||!this.getForm())return;let t=this.constructLightDOMButton();this.parentElement?.append(t),t.click(),t.remove()}handleInvalid(){this.dispatchEvent(new at)}handleLabelSlotChange(){let e=this.labelSlot.assignedNodes({flatten:!0}),t=!1,n=!1,r=!1,i=!1;[...e].forEach(e=>{if(e.nodeType===Node.ELEMENT_NODE){let r=e;r.localName===`wa-icon`?(n=!0,t||=r.label!==void 0):i=!0}else e.nodeType===Node.TEXT_NODE&&(e.textContent?.trim()||``).length>0&&(r=!0)}),this.isIconButton=n&&!r&&!i,this.customStates.set(`icon-button`,this.isIconButton),this.isIconButton&&!t&&console.warn(`Icon buttons must have a label for screen readers. Add <wa-icon label="..."> to remove this warning.`,this)}isButton(){return!this.href}isLink(){return!!this.href}handleDisabledChange(){this.customStates.set(`disabled`,this.disabled),this.updateValidity()}handleHrefChange(){this.customStates.set(`link`,this.isLink())}handleLoadingChange(){this.customStates.set(`loading`,this.loading)}setValue(...e){}click(){this.button.click()}focus(e){this.button.focus(e)}blur(){this.button.blur()}render(){let e=this.isLink(),t=e?Ot`a`:Ot`button`;return At`
      <${t}
        part="base button"
        class=${K({button:!0,caret:this.withCaret,disabled:this.disabled,loading:this.loading,rtl:this.localize.dir()===`rtl`,"has-label":this.hasSlotController.test(`[default]`),"has-start":this.hasSlotController.test(`start`,`withStart`),"has-end":this.hasSlotController.test(`end`,`withEnd`),"is-icon-button":this.isIconButton})}
        ?disabled=${q(e?void 0:this.disabled)}
        type=${q(e?void 0:this.type)}
        title=${this.title}
        name=${q(e?void 0:this.name)}
        value=${q(e?void 0:this.value)}
        href=${q(e?this.href:void 0)}
        target=${q(e?this.target:void 0)}
        download=${q(e?this.download:void 0)}
        rel=${q(e&&this.rel?this.rel:void 0)}
        role=${q(e?void 0:`button`)}
        aria-disabled=${q(e&&this.disabled?`true`:void 0)}
        aria-busy=${this.loading?`true`:`false`}
        tabindex=${this.disabled?`-1`:`0`}
        @invalid=${this.isButton()?this.handleInvalid:null}
        @click=${this.handleClick}
      >
        <slot name="start" part="start" class="start"></slot>
        <slot part="label" class="label" @slotchange=${this.handleLabelSlotChange}></slot>
        <slot name="end" part="end" class="end"></slot>
        ${this.withCaret?At`
                <wa-icon part="caret" class="caret" library="system" name="chevron-down" variant="solid"></wa-icon>
              `:``}
        ${this.loading?At`<wa-spinner part="spinner"></wa-spinner>`:``}
      </${t}>
    `}};J.shadowRootOptions={...st.shadowRootOptions,delegatesFocus:!0},J.css=[ct,Ve,ft],F([B(`.button`)],J.prototype,`button`,2),F([B(`slot:not([name])`)],J.prototype,`labelSlot`,2),F([z()],J.prototype,`invalid`,2),F([z()],J.prototype,`isIconButton`,2),F([R()],J.prototype,`title`,2),F([R({reflect:!0})],J.prototype,`variant`,2),F([R({reflect:!0})],J.prototype,`appearance`,2),F([R({reflect:!0})],J.prototype,`size`,2),F([U(`size`)],J.prototype,`handleSizeChange`,1),F([R({attribute:`with-caret`,type:Boolean,reflect:!0})],J.prototype,`withCaret`,2),F([R({attribute:`with-start`,type:Boolean})],J.prototype,`withStart`,2),F([R({attribute:`with-end`,type:Boolean})],J.prototype,`withEnd`,2),F([R({type:Boolean})],J.prototype,`disabled`,2),F([R({type:Boolean,reflect:!0})],J.prototype,`loading`,2),F([R({type:Boolean,reflect:!0})],J.prototype,`pill`,2),F([R()],J.prototype,`type`,2),F([R({reflect:!0})],J.prototype,`name`,2),F([R({reflect:!0})],J.prototype,`value`,2),F([R({reflect:!0})],J.prototype,`href`,2),F([R()],J.prototype,`target`,2),F([R()],J.prototype,`rel`,2),F([R()],J.prototype,`download`,2),F([R({attribute:`formaction`})],J.prototype,`formAction`,2),F([R({attribute:`formenctype`})],J.prototype,`formEnctype`,2),F([R({attribute:`formmethod`})],J.prototype,`formMethod`,2),F([R({attribute:`formnovalidate`,type:Boolean})],J.prototype,`formNoValidate`,2),F([R({attribute:`formtarget`})],J.prototype,`formTarget`,2),F([U(`disabled`,{waitUntilFirstUpdate:!0})],J.prototype,`handleDisabledChange`,1),F([U(`href`)],J.prototype,`handleHrefChange`,1),F([U(`loading`,{waitUntilFirstUpdate:!0})],J.prototype,`handleLoadingChange`,1),J=F([I(`wa-button`)],J),J.disableWarning?.(`change-in-update`);var Y=h`
  :host {
    --track-width: 2px;
    --track-color: var(--wa-color-neutral-fill-normal);
    --indicator-color: var(--wa-color-brand-fill-loud);
    --speed: 2s;
    --size: 1em;

    /*
      Resizing a spinner element using anything but font-size will break the animation because the animation uses em
      units. Therefore, if a spinner is used in a flex container without \`flex: none\` applied, the spinner can
      grow/shrink and break the animation. The use of \`flex: none\` on the host element prevents this by always having
      the spinner sized according to its actual dimensions.
    */
    flex: none;
    display: inline-flex;
    width: var(--size);
    height: var(--size);
  }

  svg {
    width: 100%;
    height: 100%;
    aspect-ratio: 1;
    animation: spin var(--speed) linear infinite;
  }

  .track,
  .indicator {
    --radius: calc(var(--size) / 2 - var(--track-width) / 2);
    --circumference: calc(var(--radius) * 2 * 3.141592654);

    cx: calc(var(--size) / 2);
    cy: calc(var(--size) / 2);
    r: var(--radius);
    fill: none;
    stroke-width: var(--track-width);
  }

  .track {
    stroke: var(--track-color);
  }

  .indicator {
    stroke: var(--indicator-color);
    stroke-linecap: round;
    stroke-dasharray: calc(0.597 * var(--circumference)), calc(0.796 * var(--circumference));
    stroke-dashoffset: calc(-0.04 * var(--circumference));
    animation: dash 1.5s ease-in-out infinite;
  }

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }

  @keyframes dash {
    0% {
      stroke-dasharray: calc(0.008 * var(--circumference)), calc(1.194 * var(--circumference));
      stroke-dashoffset: 0;
    }
    50% {
      stroke-dasharray: calc(0.716 * var(--circumference)), calc(1.194 * var(--circumference));
      stroke-dashoffset: calc(-0.278 * var(--circumference));
    }
    100% {
      stroke-dasharray: calc(0.716 * var(--circumference)), calc(1.194 * var(--circumference));
      stroke-dashoffset: calc(-0.987 * var(--circumference));
    }
  }
`,jt=class extends V{constructor(){super(...arguments),this.localize=new Ct(this)}render(){return j`
      <svg
        part="base spinner"
        role="progressbar"
        aria-label=${this.localize.term(`loading`)}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle class="track" />
        <circle class="indicator" />
      </svg>
    `}};jt.css=Y,jt=F([I(`wa-spinner`)],jt);var Mt=class extends Event{constructor(){super(`wa-error`,{bubbles:!0,cancelable:!1,composed:!0})}},Nt=class extends Event{constructor(){super(`wa-load`,{bubbles:!0,cancelable:!1,composed:!0})}},Pt=h`
  :host {
    --primary-color: currentColor;
    --primary-opacity: 1;
    --secondary-color: currentColor;
    --secondary-opacity: 0.4;
    --rotate-angle: 0deg;

    box-sizing: content-box;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    vertical-align: -0.125em;
  }

  /* #region Canvas — the box the icon is centered within (mirrors Font Awesome's icon canvas). Orthogonal to font-size. */

  /* Fixed width (default): 1.25em × 1em (20 × 16px) */
  :host(:not([canvas])),
  :host([canvas='fixed']) {
    width: 1.25em;
    height: 1em;
    min-width: 1.25em; /* <-- this is what Safari respects for intrinsic */
    min-height: 1em;
  }

  /* Auto: hug the icon's width. \`auto-width\` is the deprecated alias for canvas="auto". */
  :host([canvas='auto']),
  :host([auto-width]:not([canvas])) {
    width: auto;
    height: 1em;
  }

  /* Square: 1.25em × 1.25em (20 × 20px) */
  :host([canvas='square']) {
    width: 1.25em;
    height: 1.25em;
    min-width: 1.25em;
    min-height: 1.25em;
  }

  /* Roomy: 1.5em × 1.5em (24 × 24px) */
  :host([canvas='roomy']) {
    width: 1.5em;
    height: 1.5em;
    min-width: 1.5em;
    min-height: 1.5em;
  }

  /* #endregion */

  svg {
    /* NOTE: Avoid setting fill here. A stylesheet rule beats SVG presentation attributes, breaking stroke-based
       libraries like Lucide (fill="none" stroke="currentColor") and attribute-based mutators (issue #1733). The default
       library applies fill="currentColor" in its mutator instead. */
    height: 1em;
    overflow: visible;
    width: auto;

    /* Duotone colors with path-specific opacity fallback */
    path[data-duotone-primary] {
      color: var(--primary-color);
      opacity: var(--path-opacity, var(--primary-opacity));
    }

    path[data-duotone-secondary] {
      color: var(--secondary-color);
      opacity: var(--path-opacity, var(--secondary-opacity));
    }
  }

  /* Rotation */
  :host([rotate]) {
    transform: rotate(var(--rotate-angle, 0deg));
  }

  /* Flipping */
  :host([flip='x']) {
    transform: scaleX(-1);
  }
  :host([flip='y']) {
    transform: scaleY(-1);
  }
  :host([flip='both']) {
    transform: scale(-1, -1);
  }

  /* Rotation and Flipping combined */
  :host([rotate][flip='x']) {
    transform: rotate(var(--rotate-angle, 0deg)) scaleX(-1);
  }
  :host([rotate][flip='y']) {
    transform: rotate(var(--rotate-angle, 0deg)) scaleY(-1);
  }
  :host([rotate][flip='both']) {
    transform: rotate(var(--rotate-angle, 0deg)) scale(-1, -1);
  }

  /* #region Animations — ported from Font Awesome 7.3 (--fa-* props mapped to wa-icon's --* names) */

  :host([animation='beat']) {
    animation-name: beat;
    animation-delay: var(--animation-delay, 0s);
    animation-direction: var(--animation-direction, normal);
    animation-duration: var(--animation-duration, 1s);
    animation-iteration-count: var(--animation-iteration-count, infinite);
    animation-timing-function: var(--animation-timing, ease-in-out);
  }

  :host([animation='bounce']) {
    animation-name: bounce;
    animation-delay: var(--animation-delay, 0s);
    animation-direction: var(--animation-direction, normal);
    animation-duration: var(--animation-duration, 1s);
    animation-iteration-count: var(--animation-iteration-count, infinite);
    animation-timing-function: var(--animation-timing, cubic-bezier(0.28, 0.84, 0.42, 1));
  }

  :host([animation='fade']) {
    animation-name: fade;
    animation-delay: var(--animation-delay, 0s);
    animation-direction: var(--animation-direction, normal);
    animation-duration: var(--animation-duration, 1s);
    animation-iteration-count: var(--animation-iteration-count, infinite);
    animation-timing-function: var(--animation-timing, ease-in-out);
  }

  :host([animation='beat-fade']) {
    animation-name: beat-fade;
    animation-delay: var(--animation-delay, 0s);
    animation-direction: var(--animation-direction, normal);
    animation-duration: var(--animation-duration, 1s);
    animation-iteration-count: var(--animation-iteration-count, infinite);
    animation-timing-function: var(--animation-timing, ease-in-out);
  }

  :host([animation='flip']) {
    animation-name: flip;
    animation-delay: var(--animation-delay, 0s);
    animation-direction: var(--animation-direction, normal);
    animation-duration: var(--animation-duration, 1.5s);
    animation-iteration-count: var(--animation-iteration-count, infinite);
    animation-timing-function: var(--animation-timing, ease-in-out);
  }

  :host([animation='flip-360']) {
    animation-name: flip-360;
    animation-delay: var(--animation-delay, 0s);
    animation-direction: var(--animation-direction, normal);
    animation-duration: var(--animation-duration, 1s);
    animation-iteration-count: var(--animation-iteration-count, infinite);
    animation-timing-function: var(--animation-timing, ease-in-out);
  }

  :host([animation='shake']) {
    animation-name: shake;
    animation-delay: var(--animation-delay, 0s);
    animation-direction: var(--animation-direction, normal);
    animation-duration: var(--animation-duration, 0.75s);
    animation-iteration-count: var(--animation-iteration-count, infinite);
    animation-timing-function: var(--animation-timing, ease-in-out);
  }

  :host([animation='spin']) {
    animation-name: spin;
    animation-delay: var(--animation-delay, 0s);
    animation-direction: var(--animation-direction, normal);
    animation-duration: var(--animation-duration, 2s);
    animation-iteration-count: var(--animation-iteration-count, infinite);
    animation-timing-function: var(--animation-timing, linear);
  }

  :host([animation='spin-pulse']) {
    animation-name: spin;
    animation-delay: var(--animation-delay, 0s);
    animation-direction: var(--animation-direction, normal);
    animation-duration: var(--animation-duration, 1s);
    animation-iteration-count: var(--animation-iteration-count, infinite);
    animation-timing-function: var(--animation-timing, steps(8));
  }

  /* spin-reverse is FA's reverse modifier expressed as a standalone value; reverse any spin via --animation-direction: reverse */
  :host([animation='spin-reverse']) {
    animation-name: spin;
    animation-delay: var(--animation-delay, 0s);
    animation-direction: var(--animation-direction, reverse);
    animation-duration: var(--animation-duration, 2s);
    animation-iteration-count: var(--animation-iteration-count, infinite);
    animation-timing-function: var(--animation-timing, linear);
  }

  :host([animation='spin-snap']) {
    animation-name: spin-snap;
    animation-delay: var(--animation-delay, 0s);
    animation-direction: var(--animation-direction, normal);
    animation-duration: var(--animation-duration, 3s);
    animation-iteration-count: var(--animation-iteration-count, infinite);
    animation-timing-function: var(--animation-timing, linear);
  }

  :host([animation='spin-snap-4']) {
    animation-name: spin-snap-4;
    animation-delay: var(--animation-delay, 0s);
    animation-direction: var(--animation-direction, normal);
    animation-duration: var(--animation-duration, 2.4s);
    animation-iteration-count: var(--animation-iteration-count, infinite);
    animation-timing-function: var(--animation-timing, linear);
  }

  :host([animation='spin-snap-8']) {
    animation-name: spin-snap-8;
    animation-delay: var(--animation-delay, 0s);
    animation-direction: var(--animation-direction, normal);
    animation-duration: var(--animation-duration, 4s);
    animation-iteration-count: var(--animation-iteration-count, infinite);
    animation-timing-function: var(--animation-timing, linear);
  }

  :host([animation='buzz']) {
    animation-name: buzz;
    animation-delay: var(--animation-delay, 0s);
    animation-direction: var(--animation-direction, normal);
    animation-duration: var(--animation-duration, 0.6s);
    animation-iteration-count: var(--animation-iteration-count, infinite);
    animation-timing-function: var(--animation-timing, linear);
  }

  :host([animation='wag']) {
    animation-name: wag;
    animation-delay: var(--animation-delay, 0s);
    animation-direction: var(--animation-direction, normal);
    animation-duration: var(--animation-duration, 0.9s);
    animation-iteration-count: var(--animation-iteration-count, infinite);
    animation-timing-function: var(--animation-timing, ease-out);
    transform-origin: bottom center;
  }

  :host([animation='float']) {
    animation-name: float;
    animation-delay: var(--animation-delay, 0s);
    animation-direction: var(--animation-direction, normal);
    animation-duration: var(--animation-duration, 3s);
    animation-iteration-count: var(--animation-iteration-count, infinite);
    animation-timing-function: var(--animation-timing, ease-in-out);
    will-change: transform;
  }

  :host([animation='swing']) {
    animation-name: swing;
    animation-delay: var(--animation-delay, 0s);
    animation-direction: var(--animation-direction, normal);
    animation-duration: var(--animation-duration, 1.2s);
    animation-iteration-count: var(--animation-iteration-count, infinite);
    animation-timing-function: var(--animation-timing, ease-out);
    transform-origin: top center;
  }

  :host([animation='jello']) {
    animation-name: jello;
    animation-delay: var(--animation-delay, 0s);
    animation-direction: var(--animation-direction, normal);
    animation-duration: var(--animation-duration, 0.9s);
    animation-iteration-count: var(--animation-iteration-count, infinite);
    animation-timing-function: var(--animation-timing, ease-out);
  }

  @media (prefers-reduced-motion: reduce) {
    :host([animation='beat']),
    :host([animation='bounce']),
    :host([animation='fade']),
    :host([animation='beat-fade']),
    :host([animation='flip']),
    :host([animation='flip-360']),
    :host([animation='shake']),
    :host([animation='spin']),
    :host([animation='spin-pulse']),
    :host([animation='spin-reverse']),
    :host([animation='spin-snap']),
    :host([animation='spin-snap-4']),
    :host([animation='spin-snap-8']),
    :host([animation='buzz']),
    :host([animation='wag']),
    :host([animation='float']),
    :host([animation='swing']),
    :host([animation='jello']) {
      animation: none !important;
      transition: none !important;
    }
  }

  /* #endregion */

  /* #region Keyframes — ported verbatim from Font Awesome 7.3 */

  @keyframes beat {
    0% {
      transform: scale(1);
    }
    25% {
      transform: scale(calc(1.25 * var(--beat-scale, 1.25)));
    }
    45% {
      transform: scale(calc(1.22 * var(--beat-scale, 1.22)));
    }
    65% {
      transform: scale(calc(1.25 * var(--beat-scale, 1.25)));
    }
    90% {
      transform: scale(1);
    }
  }

  @keyframes bounce {
    0% {
      transform: scale(1, 1) translateY(0);
      /* No fallback by design (ported from FA 7.3): the first segment uses the user's --animation-timing or the CSS
         initial ease, while the explicit cubic-beziers on later stops drive the bounce physics. */
      animation-timing-function: var(--animation-timing);
    }
    14% {
      transform: scale(var(--bounce-start-scale-x, 1.06), var(--bounce-start-scale-y, 0.94))
        translateY(var(--bounce-anticipation, 3px));
      animation-timing-function: cubic-bezier(0.33, 0, 0.66, 0.33);
    }
    32% {
      transform: scale(var(--bounce-jump-scale-x, 0.94), var(--bounce-jump-scale-y, 1.12))
        translateY(calc(-1 * var(--bounce-height, 0.5em)));
      animation-timing-function: cubic-bezier(0.33, 0.66, 0.66, 1);
    }
    52% {
      transform: scale(1, 1) translateY(calc(-1 * var(--bounce-height, 0.5em) * 1.1));
      animation-timing-function: cubic-bezier(0.5, 0, 1, 0.5);
    }
    70% {
      transform: scale(var(--bounce-land-scale-x, 1.06), var(--bounce-land-scale-y, 0.92)) translateY(0);
      animation-timing-function: cubic-bezier(0.33, 0.33, 0.66, 1);
    }
    85% {
      transform: scale(0.98, 1.04) translateY(calc(-2px * var(--bounce-rebound, 1)));
      animation-timing-function: cubic-bezier(0.33, 0, 0.66, 1);
    }
    100% {
      transform: scale(1, 1) translateY(0);
    }
  }

  @keyframes fade {
    0% {
      opacity: 1;
      transform: scale(1);
      animation-timing-function: cubic-bezier(0.2, 0, 0.4, 1);
    }
    40% {
      opacity: var(--fade-opacity, 0.4);
      transform: scale(0.98);
      animation-timing-function: cubic-bezier(0.4, 0, 0.6, 1);
    }
    100% {
      opacity: 1;
      transform: scale(1);
    }
  }

  @keyframes beat-fade {
    0% {
      opacity: var(--beat-fade-opacity, 0.4);
      transform: scale(1);
      animation-timing-function: cubic-bezier(0.2, 0, 0.4, 1);
    }
    25% {
      opacity: calc(var(--beat-fade-opacity, 0.4) + 0.4);
      transform: scale(var(--beat-fade-scale, 1.28));
      animation-timing-function: cubic-bezier(0.4, 0, 0.6, 1);
    }
    45% {
      opacity: 1;
      transform: scale(var(--beat-fade-scale, 1.25));
      animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    }
    65% {
      opacity: calc(var(--beat-fade-opacity, 0.4) + 0.4);
      transform: scale(var(--beat-fade-scale, 1.28));
      animation-timing-function: cubic-bezier(0.4, 0, 0.6, 1);
    }
    100% {
      opacity: var(--beat-fade-opacity, 0.4);
      transform: scale(1);
    }
  }

  @keyframes flip {
    0% {
      transform: perspective(2em) scale(1) rotate3d(var(--flip-x, 0), var(--flip-y, 1), var(--flip-z, 0), 0deg);
      animation-timing-function: cubic-bezier(0.2, 0, 0.4, 1);
    }
    8% {
      transform: perspective(2em) scale(var(--flip-anticipation-scale, 0.95))
        rotate3d(var(--flip-x, 0), var(--flip-y, 1), var(--flip-z, 0), 0deg);
      animation-timing-function: cubic-bezier(0.33, 0, 0.66, 0.33);
    }
    35% {
      transform: perspective(2em) scale(1)
        rotate3d(var(--flip-x, 0), var(--flip-y, 1), var(--flip-z, 0), calc(var(--flip-angle, -360deg) * 0.6));
      animation-timing-function: linear;
    }
    65% {
      transform: perspective(2em) scale(1)
        rotate3d(var(--flip-x, 0), var(--flip-y, 1), var(--flip-z, 0), calc(var(--flip-angle, -360deg) * 0.5));
      animation-timing-function: cubic-bezier(0.33, 0.66, 0.66, 1);
    }
    92% {
      transform: perspective(2em) scale(1)
        rotate3d(
          var(--flip-x, 0),
          var(--flip-y, 1),
          var(--flip-z, 0),
          calc(var(--flip-angle, -360deg) * var(--flip-overshoot, 1.04))
        );
      animation-timing-function: cubic-bezier(0.33, 0, 0.66, 1);
    }
    100% {
      transform: perspective(2em) scale(1)
        rotate3d(var(--flip-x, 0), var(--flip-y, 1), var(--flip-z, 0), var(--flip-angle, -360deg));
    }
  }

  @keyframes flip-360 {
    0% {
      transform: perspective(2em) scale(1) rotate3d(var(--flip-x, 0), var(--flip-y, 1), var(--flip-z, 0), 0deg);
      animation-timing-function: cubic-bezier(0.2, 0, 0.4, 1);
    }
    8% {
      transform: perspective(2em) scale(var(--flip-anticipation-scale, 0.95))
        rotate3d(var(--flip-x, 0), var(--flip-y, 1), var(--flip-z, 0), 0deg);
      animation-timing-function: cubic-bezier(0.33, 0, 0.66, 0.33);
    }
    50% {
      transform: perspective(2em) scale(1)
        rotate3d(var(--flip-x, 0), var(--flip-y, 1), var(--flip-z, 0), calc(var(--flip-angle, -360deg) * 0.6));
      animation-timing-function: cubic-bezier(0.33, 0.66, 0.66, 1);
    }
    80% {
      transform: perspective(2em) scale(1)
        rotate3d(
          var(--flip-x, 0),
          var(--flip-y, 1),
          var(--flip-z, 0),
          calc(var(--flip-angle, -360deg) * var(--flip-overshoot, 1.04))
        );
      animation-timing-function: cubic-bezier(0.33, 0, 0.66, 1);
    }
    100% {
      transform: perspective(2em) scale(1)
        rotate3d(var(--flip-x, 0), var(--flip-y, 1), var(--flip-z, 0), var(--flip-angle, -360deg));
    }
  }

  @keyframes shake {
    0% {
      transform: rotate(0deg);
      animation-timing-function: cubic-bezier(0.2, 0, 0.8, 1);
    }
    8% {
      transform: rotate(35deg) translateX(1px);
      animation-timing-function: cubic-bezier(0.3, 0, 0.7, 1);
    }
    20% {
      transform: rotate(-22deg) translateX(-1px);
      animation-timing-function: cubic-bezier(0.3, 0, 0.7, 1);
    }
    35% {
      transform: rotate(15deg) translateX(1px);
      animation-timing-function: cubic-bezier(0.3, 0, 0.7, 1);
    }
    50% {
      transform: rotate(-9deg);
      animation-timing-function: cubic-bezier(0.4, 0, 0.6, 1);
    }
    65% {
      transform: rotate(5deg);
      animation-timing-function: cubic-bezier(0.4, 0, 0.6, 1);
    }
    78% {
      transform: rotate(-3deg);
      animation-timing-function: cubic-bezier(0.4, 0, 0.6, 1);
    }
    90% {
      transform: rotate(1deg);
      animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    }
    100% {
      transform: rotate(0deg);
    }
  }

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }

  @keyframes spin-snap {
    0% {
      transform: rotate(0deg);
      animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
    }
    12% {
      transform: rotate(60deg);
      animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
    }
    16.67% {
      transform: rotate(60deg);
      animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
    }
    28.67% {
      transform: rotate(120deg);
      animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
    }
    33.33% {
      transform: rotate(120deg);
      animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
    }
    45.33% {
      transform: rotate(180deg);
      animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
    }
    50% {
      transform: rotate(180deg);
      animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
    }
    62% {
      transform: rotate(240deg);
      animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
    }
    66.67% {
      transform: rotate(240deg);
      animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
    }
    78.67% {
      transform: rotate(300deg);
      animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
    }
    83.33% {
      transform: rotate(300deg);
      animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
    }
    95.33% {
      transform: rotate(360deg);
      animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
    }
    100% {
      transform: rotate(360deg);
    }
  }

  @keyframes spin-snap-4 {
    0% {
      transform: rotate(0deg);
      animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
    }
    15% {
      transform: rotate(90deg);
      animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
    }
    25% {
      transform: rotate(90deg);
      animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
    }
    40% {
      transform: rotate(180deg);
      animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
    }
    50% {
      transform: rotate(180deg);
      animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
    }
    65% {
      transform: rotate(270deg);
      animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
    }
    75% {
      transform: rotate(270deg);
      animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
    }
    90% {
      transform: rotate(360deg);
      animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
    }
    100% {
      transform: rotate(360deg);
    }
  }

  @keyframes spin-snap-8 {
    0% {
      transform: rotate(0deg);
      animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
    }
    9% {
      transform: rotate(45deg);
      animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
    }
    12.5% {
      transform: rotate(45deg);
      animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
    }
    21.5% {
      transform: rotate(90deg);
      animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
    }
    25% {
      transform: rotate(90deg);
      animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
    }
    34% {
      transform: rotate(135deg);
      animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
    }
    37.5% {
      transform: rotate(135deg);
      animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
    }
    46.5% {
      transform: rotate(180deg);
      animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
    }
    50% {
      transform: rotate(180deg);
      animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
    }
    59% {
      transform: rotate(225deg);
      animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
    }
    62.5% {
      transform: rotate(225deg);
      animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
    }
    71.5% {
      transform: rotate(270deg);
      animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
    }
    75% {
      transform: rotate(270deg);
      animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
    }
    84% {
      transform: rotate(315deg);
      animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
    }
    87.5% {
      transform: rotate(315deg);
      animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
    }
    96.5% {
      transform: rotate(360deg);
      animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
    }
    100% {
      transform: rotate(360deg);
    }
  }

  @keyframes buzz {
    0% {
      transform: translateX(0) rotate(0deg);
      animation-timing-function: cubic-bezier(0.1, 0, 0.9, 1);
    }
    5% {
      transform: translateX(var(--buzz-distance, 4px)) rotate(0.5deg);
    }
    10% {
      transform: translateX(calc(-1 * var(--buzz-distance, 4px))) rotate(-0.5deg);
    }
    15% {
      transform: translateX(var(--buzz-distance, 4px)) rotate(0.3deg);
    }
    20% {
      transform: translateX(calc(-1 * var(--buzz-distance, 4px))) rotate(-0.3deg);
    }
    25% {
      transform: translateX(calc(var(--buzz-distance, 4px) * 0.7)) rotate(0.2deg);
    }
    30% {
      transform: translateX(calc(-1 * var(--buzz-distance, 4px) * 0.7)) rotate(-0.2deg);
    }
    35% {
      transform: translateX(calc(var(--buzz-distance, 4px) * 0.4)) rotate(0.1deg);
    }
    40% {
      transform: translateX(0) rotate(0deg);
    }
    100% {
      transform: translateX(0) rotate(0deg);
    }
  }

  @keyframes wag {
    0% {
      transform: rotate(0deg);
      animation-timing-function: cubic-bezier(0.2, 0, 0.6, 1);
    }
    12% {
      transform: rotate(var(--wag-angle, 12deg));
      animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    }
    24% {
      transform: rotate(2deg);
      animation-timing-function: cubic-bezier(0.2, 0, 0.6, 1);
    }
    36% {
      transform: rotate(calc(var(--wag-angle, 12deg) * 0.85));
      animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    }
    48% {
      transform: rotate(1deg);
      animation-timing-function: cubic-bezier(0.2, 0, 0.6, 1);
    }
    58% {
      transform: rotate(calc(var(--wag-angle, 12deg) * 0.6));
      animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    }
    68% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(0deg);
    }
  }

  @keyframes float {
    0% {
      transform: translateY(0) translateX(0) rotate(0deg)
        scale(var(--float-squash-x, 1.02), var(--float-squash-y, 0.98));
      animation-timing-function: cubic-bezier(0.33, 0, 0.66, 0.33);
    }
    15% {
      transform: translateY(calc(-0.4 * var(--float-height, 6px))) translateX(var(--float-drift, 1px))
        rotate(var(--float-tilt, 1deg)) scale(1, 1);
      animation-timing-function: cubic-bezier(0.33, 0.66, 0.66, 1);
    }
    35% {
      transform: translateY(calc(-1 * var(--float-height, 6px))) translateX(0) rotate(0deg)
        scale(var(--float-stretch-x, 0.98), var(--float-stretch-y, 1.03));
      animation-timing-function: cubic-bezier(0.5, 0, 0.5, 0);
    }
    50% {
      transform: translateY(calc(-0.92 * var(--float-height, 6px))) translateX(calc(-0.5 * var(--float-drift, 1px)))
        rotate(calc(-0.5 * var(--float-tilt, 1deg))) scale(0.995, 1.01);
      animation-timing-function: cubic-bezier(0.33, 0, 0.66, 0.33);
    }
    70% {
      transform: translateY(calc(-0.3 * var(--float-height, 6px))) translateX(calc(-1 * var(--float-drift, 1px)))
        rotate(calc(-1 * var(--float-tilt, 1deg))) scale(1, 1);
      animation-timing-function: cubic-bezier(0.33, 0.66, 0.66, 1);
    }
    90% {
      transform: translateY(calc(0.05 * var(--float-height, 6px))) translateX(0) rotate(0deg)
        scale(var(--float-squash-x, 1.02), var(--float-squash-y, 0.98));
      animation-timing-function: cubic-bezier(0.33, 0, 0.66, 1);
    }
    100% {
      transform: translateY(0) translateX(0) rotate(0deg)
        scale(var(--float-squash-x, 1.02), var(--float-squash-y, 0.98));
    }
  }

  @keyframes swing {
    0% {
      transform: rotate(0deg);
      animation-timing-function: cubic-bezier(0.2, 0, 0.8, 1);
    }
    8% {
      transform: rotate(var(--swing-angle, 22deg));
      animation-timing-function: cubic-bezier(0.3, 0, 0.7, 1);
    }
    18% {
      transform: rotate(calc(-1 * var(--swing-angle, 22deg) * 0.85));
      animation-timing-function: cubic-bezier(0.3, 0, 0.7, 1);
    }
    28% {
      transform: rotate(calc(var(--swing-angle, 22deg) * 0.65));
      animation-timing-function: cubic-bezier(0.35, 0, 0.65, 1);
    }
    38% {
      transform: rotate(calc(-1 * var(--swing-angle, 22deg) * 0.45));
      animation-timing-function: cubic-bezier(0.4, 0, 0.6, 1);
    }
    48% {
      transform: rotate(calc(var(--swing-angle, 22deg) * 0.25));
      animation-timing-function: cubic-bezier(0.4, 0, 0.6, 1);
    }
    56% {
      transform: rotate(calc(-1 * var(--swing-angle, 22deg) * 0.1));
      animation-timing-function: cubic-bezier(0.4, 0, 0.6, 1);
    }
    64% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(0deg);
    }
  }

  @keyframes jello {
    0% {
      transform: scale(1, 1);
      animation-timing-function: cubic-bezier(0.2, 0, 0.8, 1);
    }
    12% {
      transform: scale(var(--jello-scale-x, 1.15), calc(2 - var(--jello-scale-x, 1.15)));
      animation-timing-function: cubic-bezier(0.3, 0, 0.7, 1);
    }
    24% {
      transform: scale(calc(2 - var(--jello-scale-y, 1.12)), var(--jello-scale-y, 1.12));
      animation-timing-function: cubic-bezier(0.3, 0, 0.7, 1);
    }
    36% {
      transform: scale(
        calc(1 + (var(--jello-scale-x, 1.15) - 1) * 0.5),
        calc(2 - (1 + (var(--jello-scale-x, 1.15) - 1) * 0.5))
      );
      animation-timing-function: cubic-bezier(0.4, 0, 0.6, 1);
    }
    48% {
      transform: scale(
        calc(2 - (1 + (var(--jello-scale-y, 1.12) - 1) * 0.3)),
        calc(1 + (var(--jello-scale-y, 1.12) - 1) * 0.3)
      );
      animation-timing-function: cubic-bezier(0.4, 0, 0.6, 1);
    }
    58% {
      transform: scale(1.02, 0.98);
      animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    }
    68% {
      transform: scale(1, 1);
    }
    100% {
      transform: scale(1, 1);
    }
  }

  /* #endregion */
`,Ft=``,It=``,Lt=``;function Rt(e){Ft=e}function zt(e=``){if(!Ft){let e=document.querySelector(`[data-webawesome]`);if(e?.hasAttribute(`data-webawesome`)){let t=new URL(e.getAttribute(`data-webawesome`)??``,window.location.href).pathname;Rt(t)}else{let e=[...document.getElementsByTagName(`script`)].find(e=>e.src.endsWith(`webawesome.js`)||e.src.endsWith(`webawesome.loader.js`)||e.src.endsWith(`webawesome.ssr-loader.js`));e&&Rt(String(e.getAttribute(`src`)).split(`/`).slice(0,-1).join(`/`))}}return Ft.replace(/\/$/,``)+(e?`/${e.replace(/^\//,``)}`:``)}function Bt(){return It.replace(/\/$/,``)}function Vt(e){Lt=e}function Ht(){if(!Lt){let e=document.querySelector(`[data-fa-kit-code]`);e&&Vt(e.getAttribute(`data-fa-kit-code`)||``)}return Lt}var Ut=`7.3.0`;function Wt(e,t,n){let r=`solid`;return t===`chisel`&&(r=`chisel-regular`),t===`etch`&&(r=`etch-solid`),t===`graphite`&&(r=`graphite-thin`),t===`jelly`&&(r=`jelly-regular`,n===`duo-regular`&&(r=`jelly-duo-regular`),n===`fill-regular`&&(r=`jelly-fill-regular`)),t===`jelly-duo`&&(r=`jelly-duo-regular`),t===`jelly-fill`&&(r=`jelly-fill-regular`),t===`notdog`&&(n===`solid`&&(r=`notdog-solid`),n===`duo-solid`&&(r=`notdog-duo-solid`)),t===`notdog-duo`&&(r=`notdog-duo-solid`),t===`slab`&&((n===`solid`||n===`regular`)&&(r=`slab-regular`),n===`press-regular`&&(r=`slab-press-regular`)),t===`slab-press`&&(r=`slab-press-regular`),t===`slab-duo`&&(r=`slab-duo-regular`),t===`slab-press-duo`&&(r=`slab-press-duo-regular`),t===`thumbprint`&&(r=`thumbprint-light`),t===`utility`&&(r=`utility-semibold`),t===`utility-duo`&&(r=`utility-duo-semibold`),t===`utility-fill`&&(r=`utility-fill-semibold`),t===`whiteboard`&&(r=`whiteboard-semibold`),t===`mosaic`&&(r=`mosaic-solid`),t===`pixel`&&(r=`pixel-regular`),t===`vellum`&&(r=`vellum-solid`),t===`classic`&&(n===`thin`&&(r=`thin`),n===`light`&&(r=`light`),n===`regular`&&(r=`regular`),n===`solid`&&(r=`solid`)),t===`duotone`&&(n===`thin`&&(r=`duotone-thin`),n===`light`&&(r=`duotone-light`),n===`regular`&&(r=`duotone-regular`),n===`solid`&&(r=`duotone`)),t===`sharp`&&(n===`thin`&&(r=`sharp-thin`),n===`light`&&(r=`sharp-light`),n===`regular`&&(r=`sharp-regular`),n===`solid`&&(r=`sharp-solid`)),t===`sharp-duotone`&&(n===`thin`&&(r=`sharp-duotone-thin`),n===`light`&&(r=`sharp-duotone-light`),n===`regular`&&(r=`sharp-duotone-regular`),n===`solid`&&(r=`sharp-duotone-solid`)),t===`brands`&&(r=`brands`),r}function Gt(e,t,n){let r=Wt(e,t,n),i=Bt();if(i)return`${i}/${r}/${e}.svg`;let a=Ht();return a.length>0?`https://ka-p.fontawesome.com/releases/v${Ut}/svgs/${r}/${e}.svg?token=${encodeURIComponent(a)}`:`https://ka-f.fontawesome.com/releases/v${Ut}/svgs/${r}/${e}.svg`}var Kt={name:`default`,resolver:(e,t=`classic`,n=`solid`)=>Gt(e,t,n),mutator:(e,t)=>{if(e.hasAttribute(`fill`)||e.setAttribute(`fill`,`currentColor`),t?.family&&!e.hasAttribute(`data-duotone-initialized`)){let{family:n,variant:r}=t;if(n===`duotone`||n===`sharp-duotone`||n===`notdog-duo`||n===`notdog`&&r===`duo-solid`||n===`jelly-duo`||n===`jelly`&&r===`duo-regular`||n===`utility-duo`||n===`slab-duo`||n===`slab-press-duo`||n===`thumbprint`){let n=[...e.querySelectorAll(`path`)],r=n.find(e=>!e.hasAttribute(`opacity`)),i=n.find(e=>e.hasAttribute(`opacity`));if(!r||!i)return;if(r.setAttribute(`data-duotone-primary`,``),i.setAttribute(`data-duotone-secondary`,``),t.swapOpacity&&r&&i){let e=i.getAttribute(`opacity`)||`0.4`;r.style.setProperty(`--path-opacity`,e),i.style.setProperty(`--path-opacity`,`1`)}e.setAttribute(`data-duotone-initialized`,``)}}}};function qt(e){return`data:image/svg+xml,${encodeURIComponent(e)}`}var Jt={solid:{"arrow-down":`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><!--!Font Awesome Free v7.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M169.4 502.6c12.5 12.5 32.8 12.5 45.3 0l160-160c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L224 402.7 224 32c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 370.7-105.4-105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l160 160z"/></svg>`,"arrow-up":`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><!--!Font Awesome Free v7.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M214.6 9.4c-12.5-12.5-32.8-12.5-45.3 0l-160 160c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L160 109.3 160 480c0 17.7 14.3 32 32 32s32-14.3 32-32l0-370.7 105.4 105.4c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3l-160-160z"/></svg>`,backward:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free v7.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M236.3 107.1C247.9 96 265 92.9 279.7 99.2C294.4 105.5 304 120 304 136L304 272.3L476.3 107.2C487.9 96 505 92.9 519.7 99.2C534.4 105.5 544 120 544 136L544 504C544 520 534.4 534.5 519.7 540.8C505 547.1 487.9 544 476.3 532.9L304 367.7L304 504C304 520 294.4 534.5 279.7 540.8C265 547.1 247.9 544 236.3 532.9L44.3 348.9C36.5 341.3 32 330.9 32 320C32 309.1 36.5 298.7 44.3 291.1L236.3 107.1z"/></svg>`,"backward-step":`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free v7.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M491 100.8C478.1 93.8 462.3 94.5 450 102.6L192 272.1L192 128C192 110.3 177.7 96 160 96C142.3 96 128 110.3 128 128L128 512C128 529.7 142.3 544 160 544C177.7 544 192 529.7 192 512L192 367.9L450 537.5C462.3 545.6 478 546.3 491 539.3C504 532.3 512 518.8 512 504.1L512 136.1C512 121.4 503.9 107.9 491 100.9z"/></svg>`,"angles-left":`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--! Font Awesome Free 7.0.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc. --><path d="M77.3 256 214.7 118.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-160 160c-12.5 12.5-12.5 32.8 0 45.3l160 160c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L77.3 256zm192 0L406.7 118.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-160 160c-12.5 12.5-12.5 32.8 0 45.3l160 160c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L269.3 256z"/></svg>`,"angles-right":`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--! Font Awesome Free 7.0.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc. --><path d="M434.7 256 297.3 118.6c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l160 160c12.5 12.5 12.5 32.8 0 45.3l-160 160c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3L434.7 256zm-192 0L105.3 118.6c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l160 160c12.5 12.5 12.5 32.8 0 45.3l-160 160c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3L242.7 256z"/></svg>`,check:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><!--! Font Awesome Free 7.0.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc. --><path d="M434.8 70.1c14.3 10.4 17.5 30.4 7.1 44.7l-256 352c-5.5 7.6-14 12.3-23.4 13.1s-18.5-2.7-25.1-9.3l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l101.5 101.5 234-321.7c10.4-14.3 30.4-17.5 44.7-7.1z"/></svg>`,"chevron-down":`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><!--! Font Awesome Free 7.0.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc. --><path d="M201.4 406.6c12.5 12.5 32.8 12.5 45.3 0l192-192c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L224 338.7 54.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l192 192z"/></svg>`,"chevron-left":`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512"><!--! Font Awesome Free 7.0.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc. --><path d="M9.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l192 192c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L77.3 256 246.6 86.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-192 192z"/></svg>`,"chevron-right":`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512"><!--! Font Awesome Free 7.0.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc. --><path d="M311.1 233.4c12.5 12.5 12.5 32.8 0 45.3l-192 192c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3L243.2 256 73.9 86.6c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l192 192z"/></svg>`,circle:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--! Font Awesome Free 7.0.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc. --><path d="M0 256a256 256 0 1 1 512 0 256 256 0 1 1 -512 0z"/></svg>`,"closed-captioning":`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free v7.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M64 192C64 156.7 92.7 128 128 128L512 128C547.3 128 576 156.7 576 192L576 448C576 483.3 547.3 512 512 512L128 512C92.7 512 64 483.3 64 448L64 192zM216 272L248 272C252.4 272 256 275.6 256 280C256 293.3 266.7 304 280 304C293.3 304 304 293.3 304 280C304 249.1 278.9 224 248 224L216 224C185.1 224 160 249.1 160 280L160 360C160 390.9 185.1 416 216 416L248 416C278.9 416 304 390.9 304 360C304 346.7 293.3 336 280 336C266.7 336 256 346.7 256 360C256 364.4 252.4 368 248 368L216 368C211.6 368 208 364.4 208 360L208 280C208 275.6 211.6 272 216 272zM384 280C384 275.6 387.6 272 392 272L424 272C428.4 272 432 275.6 432 280C432 293.3 442.7 304 456 304C469.3 304 480 293.3 480 280C480 249.1 454.9 224 424 224L392 224C361.1 224 336 249.1 336 280L336 360C336 390.9 361.1 416 392 416L424 416C454.9 416 480 390.9 480 360C480 346.7 469.3 336 456 336C442.7 336 432 346.7 432 360C432 364.4 428.4 368 424 368L392 368C387.6 368 384 364.4 384 360L384 280z"/></svg>`,"closed-captioning-slash":`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free v7.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M39 39.1C48.4 29.7 63.6 29.7 72.9 39.1L161.8 128L512 128C547.3 128 576 156.7 576 192L576 448C576 473.5 561.1 495.4 539.6 505.8L601 567.1C610.4 576.5 610.4 591.7 601 601C591.6 610.3 576.4 610.4 567.1 601L39 73.1C29.7 63.7 29.7 48.5 39 39.1zM384 350.1L384 279.9C384 275.5 387.6 271.9 392 271.9L424 271.9C428.4 271.9 432 275.5 432 279.9C432 293.2 442.7 303.9 456 303.9C469.3 303.9 480 293.2 480 279.9C480 249 454.9 223.9 424 223.9L392 223.9C361.1 223.9 336 249 336 279.9L336 302.1L384 350.1zM445.5 411.6C465.7 403.2 480 383.2 480 359.9C480 346.6 469.3 335.9 456 335.9C442.7 335.9 432 346.6 432 359.9C432 364.3 428.4 367.9 424 367.9L401.8 367.9L445.5 411.6zM162.3 264.1C160.8 269.1 160 274.5 160 280L160 360C160 390.9 185.1 416 216 416L248 416C266.1 416 282.1 407.5 292.4 394.2L410.2 512L128 512C92.7 512 64 483.3 64 448L64 192C64 184.2 65.4 176.7 68 169.8L162.3 264.1zM256.1 357.9C256 358.6 256 359.3 256 360C256 364.4 252.4 368 248 368L216 368C211.6 368 208 364.4 208 360L208 309.8L256.1 357.9z"/></svg>`,compress:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><!--!Font Awesome Free v7.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M160 64c0-17.7-14.3-32-32-32S96 46.3 96 64l0 64-64 0c-17.7 0-32 14.3-32 32s14.3 32 32 32l96 0c17.7 0 32-14.3 32-32l0-96zM32 320c-17.7 0-32 14.3-32 32s14.3 32 32 32l64 0 0 64c0 17.7 14.3 32 32 32s32-14.3 32-32l0-96c0-17.7-14.3-32-32-32l-96 0zM352 64c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 96c0 17.7 14.3 32 32 32l96 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-64 0 0-64zM320 320c-17.7 0-32 14.3-32 32l0 96c0 17.7 14.3 32 32 32s32-14.3 32-32l0-64 64 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-96 0z"/></svg>`,ellipsis:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free v7.3.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M96 320C96 289.1 121.1 264 152 264C182.9 264 208 289.1 208 320C208 350.9 182.9 376 152 376C121.1 376 96 350.9 96 320zM264 320C264 289.1 289.1 264 320 264C350.9 264 376 289.1 376 320C376 350.9 350.9 376 320 376C289.1 376 264 350.9 264 320zM488 264C518.9 264 544 289.1 544 320C544 350.9 518.9 376 488 376C457.1 376 432 350.9 432 320C432 289.1 457.1 264 488 264z"/></svg>`,"ellipsis-vertical":`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free v7.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M320 208C289.1 208 264 182.9 264 152C264 121.1 289.1 96 320 96C350.9 96 376 121.1 376 152C376 182.9 350.9 208 320 208zM320 432C350.9 432 376 457.1 376 488C376 518.9 350.9 544 320 544C289.1 544 264 518.9 264 488C264 457.1 289.1 432 320 432zM376 320C376 350.9 350.9 376 320 376C289.1 376 264 350.9 264 320C264 289.1 289.1 264 320 264C350.9 264 376 289.1 376 320z"/></svg>`,expand:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free v7.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M128 96C110.3 96 96 110.3 96 128L96 224C96 241.7 110.3 256 128 256C145.7 256 160 241.7 160 224L160 160L224 160C241.7 160 256 145.7 256 128C256 110.3 241.7 96 224 96L128 96zM160 416C160 398.3 145.7 384 128 384C110.3 384 96 398.3 96 416L96 512C96 529.7 110.3 544 128 544L224 544C241.7 544 256 529.7 256 512C256 494.3 241.7 480 224 480L160 480L160 416zM416 96C398.3 96 384 110.3 384 128C384 145.7 398.3 160 416 160L480 160L480 224C480 241.7 494.3 256 512 256C529.7 256 544 241.7 544 224L544 128C544 110.3 529.7 96 512 96L416 96zM544 416C544 398.3 529.7 384 512 384C494.3 384 480 398.3 480 416L480 480L416 480C398.3 480 384 494.3 384 512C384 529.7 398.3 544 416 544L512 544C529.7 544 544 529.7 544 512L544 416z"/></svg>`,eyedropper:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--! Font Awesome Free 7.0.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc. --><path d="M341.6 29.2l-101.6 101.6-9.4-9.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l160 160c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3l-9.4-9.4 101.6-101.6c39-39 39-102.2 0-141.1s-102.2-39-141.1 0zM55.4 323.3c-15 15-23.4 35.4-23.4 56.6l0 42.4-26.6 39.9c-8.5 12.7-6.8 29.6 4 40.4s27.7 12.5 40.4 4l39.9-26.6 42.4 0c21.2 0 41.6-8.4 56.6-23.4l109.4-109.4-45.3-45.3-109.4 109.4c-3 3-7.1 4.7-11.3 4.7l-36.1 0 0-36.1c0-4.2 1.7-8.3 4.7-11.3l109.4-109.4-45.3-45.3-109.4 109.4z"/></svg>`,filter:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--!Font Awesome Free v7.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M32 64C19.1 64 7.4 71.8 2.4 83.8S.2 109.5 9.4 118.6L192 301.3 192 416c0 8.5 3.4 16.6 9.4 22.6l64 64c9.2 9.2 22.9 11.9 34.9 6.9S320 492.9 320 480l0-178.7 182.6-182.6c9.2-9.2 11.9-22.9 6.9-34.9S492.9 64 480 64L32 64z"/></svg>`,forward:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free v7.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M403.7 107.1C392.1 96 375 92.9 360.3 99.2C345.6 105.5 336 120 336 136L336 272.3L163.7 107.2C152.1 96 135 92.9 120.3 99.2C105.6 105.5 96 120 96 136L96 504C96 520 105.6 534.5 120.3 540.8C135 547.1 152.1 544 163.7 532.9L336 367.7L336 504C336 520 345.6 534.5 360.3 540.8C375 547.1 392.1 544 403.7 532.9L595.7 348.9C603.6 341.4 608 330.9 608 320C608 309.1 603.5 298.7 595.7 291.1L403.7 107.1z"/></svg>`,file:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free 7.1.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M192 64C156.7 64 128 92.7 128 128L128 512C128 547.3 156.7 576 192 576L448 576C483.3 576 512 547.3 512 512L512 234.5C512 217.5 505.3 201.2 493.3 189.2L386.7 82.7C374.7 70.7 358.5 64 341.5 64L192 64zM453.5 240L360 240C346.7 240 336 229.3 336 216L336 122.5L453.5 240z"/></svg>`,"file-audio":`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free 7.1.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M128 128C128 92.7 156.7 64 192 64L341.5 64C358.5 64 374.8 70.7 386.8 82.7L493.3 189.3C505.3 201.3 512 217.6 512 234.6L512 512C512 547.3 483.3 576 448 576L192 576C156.7 576 128 547.3 128 512L128 128zM336 122.5L336 216C336 229.3 346.7 240 360 240L453.5 240L336 122.5zM389.8 307.7C380.7 301.4 368.3 303.6 362 312.7C355.7 321.8 357.9 334.2 367 340.5C390.9 357.2 406.4 384.8 406.4 416C406.4 447.2 390.8 474.9 367 491.5C357.9 497.8 355.7 510.3 362 519.3C368.3 528.3 380.8 530.6 389.8 524.3C423.9 500.5 446.4 460.8 446.4 416C446.4 371.2 424 331.5 389.8 307.7zM208 376C199.2 376 192 383.2 192 392L192 440C192 448.8 199.2 456 208 456L232 456L259.2 490C262.2 493.8 266.8 496 271.7 496L272 496C280.8 496 288 488.8 288 480L288 352C288 343.2 280.8 336 272 336L271.7 336C266.8 336 262.2 338.2 259.2 342L232 376L208 376zM336 448.2C336 458.9 346.5 466.4 354.9 459.8C367.8 449.5 376 433.7 376 416C376 398.3 367.8 382.5 354.9 372.2C346.5 365.5 336 373.1 336 383.8L336 448.3z"/></svg>`,"file-code":`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free 7.1.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M128 128C128 92.7 156.7 64 192 64L341.5 64C358.5 64 374.8 70.7 386.8 82.7L493.3 189.3C505.3 201.3 512 217.6 512 234.6L512 512C512 547.3 483.3 576 448 576L192 576C156.7 576 128 547.3 128 512L128 128zM336 122.5L336 216C336 229.3 346.7 240 360 240L453.5 240L336 122.5zM282.2 359.6C290.8 349.5 289.7 334.4 279.6 325.8C269.5 317.2 254.4 318.3 245.8 328.4L197.8 384.4C190.1 393.4 190.1 406.6 197.8 415.6L245.8 471.6C254.4 481.7 269.6 482.8 279.6 474.2C289.6 465.6 290.8 450.4 282.2 440.4L247.6 400L282.2 359.6zM394.2 328.4C385.6 318.3 370.4 317.2 360.4 325.8C350.4 334.4 349.2 349.6 357.8 359.6L392.4 400L357.8 440.4C349.2 450.5 350.3 465.6 360.4 474.2C370.5 482.8 385.6 481.7 394.2 471.6L442.2 415.6C449.9 406.6 449.9 393.4 442.2 384.4L394.2 328.4z"/></svg>`,"file-excel":`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free 7.1.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M128 128C128 92.7 156.7 64 192 64L341.5 64C358.5 64 374.8 70.7 386.8 82.7L493.3 189.3C505.3 201.3 512 217.6 512 234.6L512 512C512 547.3 483.3 576 448 576L192 576C156.7 576 128 547.3 128 512L128 128zM336 122.5L336 216C336 229.3 346.7 240 360 240L453.5 240L336 122.5zM292 330.7C284.6 319.7 269.7 316.7 258.7 324C247.7 331.3 244.7 346.3 252 357.3L291.2 416L252 474.7C244.6 485.7 247.6 500.6 258.7 508C269.8 515.4 284.6 512.4 292 501.3L320 459.3L348 501.3C355.4 512.3 370.3 515.3 381.3 508C392.3 500.7 395.3 485.7 388 474.7L348.8 416L388 357.3C395.4 346.3 392.4 331.4 381.3 324C370.2 316.6 355.4 319.6 348 330.7L320 372.7L292 330.7z"/></svg>`,"file-image":`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free 7.1.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M128 128C128 92.7 156.7 64 192 64L341.5 64C358.5 64 374.8 70.7 386.8 82.7L493.3 189.3C505.3 201.3 512 217.6 512 234.6L512 512C512 547.3 483.3 576 448 576L192 576C156.7 576 128 547.3 128 512L128 128zM336 122.5L336 216C336 229.3 346.7 240 360 240L453.5 240L336 122.5zM256 320C256 302.3 241.7 288 224 288C206.3 288 192 302.3 192 320C192 337.7 206.3 352 224 352C241.7 352 256 337.7 256 320zM220.6 512L419.4 512C435.2 512 448 499.2 448 483.4C448 476.1 445.2 469 440.1 463.7L343.3 361.9C337.3 355.6 328.9 352 320.1 352L319.8 352C311 352 302.7 355.6 296.6 361.9L199.9 463.7C194.8 469 192 476.1 192 483.4C192 499.2 204.8 512 220.6 512z"/></svg>`,"file-pdf":`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free 7.1.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M128 64C92.7 64 64 92.7 64 128L64 512C64 547.3 92.7 576 128 576L208 576L208 464C208 428.7 236.7 400 272 400L448 400L448 234.5C448 217.5 441.3 201.2 429.3 189.2L322.7 82.7C310.7 70.7 294.5 64 277.5 64L128 64zM389.5 240L296 240C282.7 240 272 229.3 272 216L272 122.5L389.5 240zM272 444C261 444 252 453 252 464L252 592C252 603 261 612 272 612C283 612 292 603 292 592L292 564L304 564C337.1 564 364 537.1 364 504C364 470.9 337.1 444 304 444L272 444zM304 524L292 524L292 484L304 484C315 484 324 493 324 504C324 515 315 524 304 524zM400 444C389 444 380 453 380 464L380 592C380 603 389 612 400 612L432 612C460.7 612 484 588.7 484 560L484 496C484 467.3 460.7 444 432 444L400 444zM420 572L420 484L432 484C438.6 484 444 489.4 444 496L444 560C444 566.6 438.6 572 432 572L420 572zM508 464L508 592C508 603 517 612 528 612C539 612 548 603 548 592L548 548L576 548C587 548 596 539 596 528C596 517 587 508 576 508L548 508L548 484L576 484C587 484 596 475 596 464C596 453 587 444 576 444L528 444C517 444 508 453 508 464z"/></svg>`,"file-powerpoint":`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free 7.1.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M128 128C128 92.7 156.7 64 192 64L341.5 64C358.5 64 374.8 70.7 386.8 82.7L493.3 189.3C505.3 201.3 512 217.6 512 234.6L512 512C512 547.3 483.3 576 448 576L192 576C156.7 576 128 547.3 128 512L128 128zM336 122.5L336 216C336 229.3 346.7 240 360 240L453.5 240L336 122.5zM280 320C266.7 320 256 330.7 256 344L256 488C256 501.3 266.7 512 280 512C293.3 512 304 501.3 304 488L304 464L328 464C367.8 464 400 431.8 400 392C400 352.2 367.8 320 328 320L280 320zM328 416L304 416L304 368L328 368C341.3 368 352 378.7 352 392C352 405.3 341.3 416 328 416z"/></svg>`,"file-video":`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free 7.1.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M128 128C128 92.7 156.7 64 192 64L341.5 64C358.5 64 374.8 70.7 386.8 82.7L493.3 189.3C505.3 201.3 512 217.6 512 234.6L512 512C512 547.3 483.3 576 448 576L192 576C156.7 576 128 547.3 128 512L128 128zM336 122.5L336 216C336 229.3 346.7 240 360 240L453.5 240L336 122.5zM208 368L208 464C208 481.7 222.3 496 240 496L336 496C353.7 496 368 481.7 368 464L368 440L403 475C406.2 478.2 410.5 480 415 480C424.4 480 432 472.4 432 463L432 368.9C432 359.5 424.4 351.9 415 351.9C410.5 351.9 406.2 353.7 403 356.9L368 391.9L368 367.9C368 350.2 353.7 335.9 336 335.9L240 335.9C222.3 335.9 208 350.2 208 367.9z"/></svg>`,"file-word":`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free 7.1.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M128 128C128 92.7 156.7 64 192 64L341.5 64C358.5 64 374.8 70.7 386.8 82.7L493.3 189.3C505.3 201.3 512 217.6 512 234.6L512 512C512 547.3 483.3 576 448 576L192 576C156.7 576 128 547.3 128 512L128 128zM336 122.5L336 216C336 229.3 346.7 240 360 240L453.5 240L336 122.5zM263.4 338.8C260.5 325.9 247.7 317.7 234.8 320.6C221.9 323.5 213.7 336.3 216.6 349.2L248.6 493.2C250.9 503.7 260 511.4 270.8 512C281.6 512.6 291.4 505.9 294.8 495.6L320 419.9L345.2 495.6C348.6 505.8 358.4 512.5 369.2 512C380 511.5 389.1 503.8 391.4 493.2L423.4 349.2C426.3 336.3 418.1 323.4 405.2 320.6C392.3 317.8 379.4 325.9 376.6 338.8L363.4 398.2L342.8 336.4C339.5 326.6 330.4 320 320 320C309.6 320 300.5 326.6 297.2 336.4L276.6 398.2L263.4 338.8z"/></svg>`,"file-zipper":`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free 7.1.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M128 128C128 92.7 156.7 64 192 64L341.5 64C358.5 64 374.8 70.7 386.8 82.7L493.3 189.3C505.3 201.3 512 217.6 512 234.6L512 512C512 547.3 483.3 576 448 576L192 576C156.7 576 128 547.3 128 512L128 128zM336 122.5L336 216C336 229.3 346.7 240 360 240L453.5 240L336 122.5zM192 136C192 149.3 202.7 160 216 160L264 160C277.3 160 288 149.3 288 136C288 122.7 277.3 112 264 112L216 112C202.7 112 192 122.7 192 136zM192 232C192 245.3 202.7 256 216 256L264 256C277.3 256 288 245.3 288 232C288 218.7 277.3 208 264 208L216 208C202.7 208 192 218.7 192 232zM256 304L224 304C206.3 304 192 318.3 192 336L192 384C192 410.5 213.5 432 240 432C266.5 432 288 410.5 288 384L288 336C288 318.3 273.7 304 256 304zM240 368C248.8 368 256 375.2 256 384C256 392.8 248.8 400 240 400C231.2 400 224 392.8 224 384C224 375.2 231.2 368 240 368z"/></svg>`,"forward-step":`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><!--!Font Awesome Free v7.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M21 36.8c12.9-7 28.7-6.3 41 1.8L320 208.1 320 64c0-17.7 14.3-32 32-32s32 14.3 32 32l0 384c0 17.7-14.3 32-32 32s-32-14.3-32-32l0-144.1-258 169.6c-12.3 8.1-28 8.8-41 1.8S0 454.7 0 440L0 72C0 57.3 8.1 43.8 21 36.8z"/></svg>`,gauge:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--!Font Awesome Free v7.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M0 256a256 256 0 1 1 512 0 256 256 0 1 1 -512 0zm320 96c0-26.9-16.5-49.9-40-59.3L280 120c0-13.3-10.7-24-24-24s-24 10.7-24 24l0 172.7c-23.5 9.5-40 32.5-40 59.3 0 35.3 28.7 64 64 64s64-28.7 64-64zM144 176a32 32 0 1 0 0-64 32 32 0 1 0 0 64zm-16 80a32 32 0 1 0 -64 0 32 32 0 1 0 64 0zm288 32a32 32 0 1 0 0-64 32 32 0 1 0 0 64zM400 144a32 32 0 1 0 -64 0 32 32 0 1 0 64 0z"/></svg>`,gear:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free v7.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M259.1 73.5C262.1 58.7 275.2 48 290.4 48L350.2 48C365.4 48 378.5 58.7 381.5 73.5L396 143.5C410.1 149.5 423.3 157.2 435.3 166.3L503.1 143.8C517.5 139 533.3 145 540.9 158.2L570.8 210C578.4 223.2 575.7 239.8 564.3 249.9L511 297.3C511.9 304.7 512.3 312.3 512.3 320C512.3 327.7 511.8 335.3 511 342.7L564.4 390.2C575.8 400.3 578.4 417 570.9 430.1L541 481.9C533.4 495 517.6 501.1 503.2 496.3L435.4 473.8C423.3 482.9 410.1 490.5 396.1 496.6L381.7 566.5C378.6 581.4 365.5 592 350.4 592L290.6 592C275.4 592 262.3 581.3 259.3 566.5L244.9 496.6C230.8 490.6 217.7 482.9 205.6 473.8L137.5 496.3C123.1 501.1 107.3 495.1 99.7 481.9L69.8 430.1C62.2 416.9 64.9 400.3 76.3 390.2L129.7 342.7C128.8 335.3 128.4 327.7 128.4 320C128.4 312.3 128.9 304.7 129.7 297.3L76.3 249.8C64.9 239.7 62.3 223 69.8 209.9L99.7 158.1C107.3 144.9 123.1 138.9 137.5 143.7L205.3 166.2C217.4 157.1 230.6 149.5 244.6 143.4L259.1 73.5zM320.3 400C364.5 399.8 400.2 363.9 400 319.7C399.8 275.5 363.9 239.8 319.7 240C275.5 240.2 239.8 276.1 240 320.3C240.2 364.5 276.1 400.2 320.3 400z"/></svg>`,"grip-vertical":`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512"><!--! Font Awesome Free 7.0.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc. --><path d="M128 40c0-22.1-17.9-40-40-40L40 0C17.9 0 0 17.9 0 40L0 88c0 22.1 17.9 40 40 40l48 0c22.1 0 40-17.9 40-40l0-48zm0 192c0-22.1-17.9-40-40-40l-48 0c-22.1 0-40 17.9-40 40l0 48c0 22.1 17.9 40 40 40l48 0c22.1 0 40-17.9 40-40l0-48zM0 424l0 48c0 22.1 17.9 40 40 40l48 0c22.1 0 40-17.9 40-40l0-48c0-22.1-17.9-40-40-40l-48 0c-22.1 0-40 17.9-40 40zM320 40c0-22.1-17.9-40-40-40L232 0c-22.1 0-40 17.9-40 40l0 48c0 22.1 17.9 40 40 40l48 0c22.1 0 40-17.9 40-40l0-48zM192 232l0 48c0 22.1 17.9 40 40 40l48 0c22.1 0 40-17.9 40-40l0-48c0-22.1-17.9-40-40-40l-48 0c-22.1 0-40 17.9-40 40zM320 424c0-22.1-17.9-40-40-40l-48 0c-22.1 0-40 17.9-40 40l0 48c0 22.1 17.9 40 40 40l48 0c22.1 0 40-17.9 40-40l0-48z"/></svg>`,indeterminate:`<svg part="indeterminate-icon" class="icon" viewBox="0 0 16 16"><g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd" stroke-linecap="round"><g stroke="currentColor" stroke-width="2"><g transform="translate(2.285714 6.857143)"><path d="M10.2857143,1.14285714 L1.14285714,1.14285714"/></g></g></g></svg>`,"magnifying-glass":`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--!Font Awesome Free v7.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M416 208c0 45.9-14.9 88.3-40 122.7L502.6 457.4c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L330.7 376C296.3 401.1 253.9 416 208 416 93.1 416 0 322.9 0 208S93.1 0 208 0 416 93.1 416 208zM208 352a144 144 0 1 0 0-288 144 144 0 1 0 0 288z"/></svg>`,minus:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><!--! Font Awesome Free 7.0.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc. --><path d="M0 256c0-17.7 14.3-32 32-32l384 0c17.7 0 32 14.3 32 32s-14.3 32-32 32L32 288c-17.7 0-32-14.3-32-32z"/></svg>`,pause:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><!--! Font Awesome Free 7.0.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc. --><path d="M48 32C21.5 32 0 53.5 0 80L0 432c0 26.5 21.5 48 48 48l64 0c26.5 0 48-21.5 48-48l0-352c0-26.5-21.5-48-48-48L48 32zm224 0c-26.5 0-48 21.5-48 48l0 352c0 26.5 21.5 48 48 48l64 0c26.5 0 48-21.5 48-48l0-352c0-26.5-21.5-48-48-48l-64 0z"/></svg>`,"picture-in-picture":`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--!Font Awesome Free v7.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M448 32c35.3 0 64 28.7 64 64l0 112-64 0 0-112-384 0 0 320 144 0 0 64-144 0-6.5-.3c-30.1-3.1-54.1-27-57.1-57.1L0 416 0 96C0 62.9 25.2 35.6 57.5 32.3L64 32 448 32zm16 224c26.5 0 48 21.5 48 48l0 128c0 26.5-21.5 48-48 48l-160 0c-26.5 0-48-21.5-48-48l0-128c0-26.5 21.5-48 48-48l160 0z"/></svg>`,play:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><!--! Font Awesome Free 7.0.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc. --><path d="M91.2 36.9c-12.4-6.8-27.4-6.5-39.6 .7S32 57.9 32 72l0 368c0 14.1 7.5 27.2 19.6 34.4s27.2 7.5 39.6 .7l336-184c12.8-7 20.8-20.5 20.8-35.1s-8-28.1-20.8-35.1l-336-184z"/></svg>`,"play-circle":`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--!Font Awesome Free v7.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M0 256a256 256 0 1 1 512 0 256 256 0 1 1 -512 0zM188.3 147.1c-7.6 4.2-12.3 12.3-12.3 20.9l0 176c0 8.7 4.7 16.7 12.3 20.9s16.8 4.1 24.3-.5l144-88c7.1-4.4 11.5-12.1 11.5-20.5s-4.4-16.1-11.5-20.5l-144-88c-7.4-4.5-16.7-4.7-24.3-.5z"/></svg>`,plus:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free 7.1.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M352 128C352 110.3 337.7 96 320 96C302.3 96 288 110.3 288 128L288 288L128 288C110.3 288 96 302.3 96 320C96 337.7 110.3 352 128 352L288 352L288 512C288 529.7 302.3 544 320 544C337.7 544 352 529.7 352 512L352 352L512 352C529.7 352 544 337.7 544 320C544 302.3 529.7 288 512 288L352 288L352 128z"/></svg>`,star:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><!--! Font Awesome Free 7.0.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc. --><path d="M309.5-18.9c-4.1-8-12.4-13.1-21.4-13.1s-17.3 5.1-21.4 13.1L193.1 125.3 33.2 150.7c-8.9 1.4-16.3 7.7-19.1 16.3s-.5 18 5.8 24.4l114.4 114.5-25.2 159.9c-1.4 8.9 2.3 17.9 9.6 23.2s16.9 6.1 25 2L288.1 417.6 432.4 491c8 4.1 17.7 3.3 25-2s11-14.2 9.6-23.2L441.7 305.9 556.1 191.4c6.4-6.4 8.6-15.8 5.8-24.4s-10.1-14.9-19.1-16.3L383 125.3 309.5-18.9z"/></svg>`,"table-columns":`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><!--!Font Awesome Free v7.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M0 96C0 60.7 28.7 32 64 32l320 0c35.3 0 64 28.7 64 64l0 320c0 35.3-28.7 64-64 64L64 480c-35.3 0-64-28.7-64-64L0 96zm64 64l0 256 128 0 0-256-128 0zm320 0l-128 0 0 256 128 0 0-256z"/></svg>`,thumbtack:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><!--!Font Awesome Free v7.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M32 32C32 14.3 46.3 0 64 0L320 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-29.5 0 10.3 134.1c37.1 21.2 65.8 56.4 78.2 99.7l3.8 13.4c2.8 9.7 .8 20-5.2 28.1S362 352 352 352L32 352c-10 0-19.5-4.7-25.5-12.7s-8-18.4-5.2-28.1L5 297.8c12.4-43.3 41-78.5 78.2-99.7L93.5 64 64 64C46.3 64 32 49.7 32 32zM160 400l64 0 0 112c0 17.7-14.3 32-32 32s-32-14.3-32-32l0-112z"/></svg>`,"up-down":`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--!Font Awesome Free v7.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M406.6 502.6l96-96c9.2-9.2 11.9-22.9 6.9-34.9S492.9 352 480 352l-64 0 0-320c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 320-64 0c-12.9 0-24.6 7.8-29.6 19.8s-2.2 25.7 6.9 34.9l96 96c12.5 12.5 32.8 12.5 45.3 0zM150.6 9.4c-12.5-12.5-32.8-12.5-45.3 0l-96 96c-9.2 9.2-11.9 22.9-6.9 34.9S19.1 160 32 160l64 0 0 320c0 17.7 14.3 32 32 32s32-14.3 32-32l0-320 64 0c12.9 0 24.6-7.8 29.6-19.8s2.2-25.7-6.9-34.9l-96-96z"/></svg>`,upload:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free 7.1.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M352 173.3L352 384C352 401.7 337.7 416 320 416C302.3 416 288 401.7 288 384L288 173.3L246.6 214.7C234.1 227.2 213.8 227.2 201.3 214.7C188.8 202.2 188.8 181.9 201.3 169.4L297.3 73.4C309.8 60.9 330.1 60.9 342.6 73.4L438.6 169.4C451.1 181.9 451.1 202.2 438.6 214.7C426.1 227.2 405.8 227.2 393.3 214.7L352 173.3zM320 464C364.2 464 400 428.2 400 384L480 384C515.3 384 544 412.7 544 448L544 480C544 515.3 515.3 544 480 544L160 544C124.7 544 96 515.3 96 480L96 448C96 412.7 124.7 384 160 384L240 384C240 428.2 275.8 464 320 464zM464 488C477.3 488 488 477.3 488 464C488 450.7 477.3 440 464 440C450.7 440 440 450.7 440 464C440 477.3 450.7 488 464 488z"/></svg>`,user:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><!--! Font Awesome Free 7.0.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc. --><path d="M224 248a120 120 0 1 0 0-240 120 120 0 1 0 0 240zm-29.7 56C95.8 304 16 383.8 16 482.3 16 498.7 29.3 512 45.7 512l356.6 0c16.4 0 29.7-13.3 29.7-29.7 0-98.5-79.8-178.3-178.3-178.3l-59.4 0z"/></svg>`,volume:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--!Font Awesome Free v7.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M48 352l48 0 134.1 119.2c6.4 5.7 14.6 8.8 23.1 8.8 19.2 0 34.8-15.6 34.8-34.8l0-378.4c0-19.2-15.6-34.8-34.8-34.8-8.5 0-16.7 3.1-23.1 8.8L96 160 48 160c-26.5 0-48 21.5-48 48l0 96c0 26.5 21.5 48 48 48zM441.1 107c-10.3-8.4-25.4-6.8-33.8 3.5s-6.8 25.4 3.5 33.8C443.3 170.7 464 210.9 464 256s-20.7 85.3-53.2 111.8c-10.3 8.4-11.8 23.5-3.5 33.8s23.5 11.8 33.8 3.5c43.2-35.2 70.9-88.9 70.9-149s-27.7-113.8-70.9-149zm-60.5 74.5c-10.3-8.4-25.4-6.8-33.8 3.5s-6.8 25.4 3.5 33.8C361.1 227.6 368 241 368 256s-6.9 28.4-17.7 37.3c-10.3 8.4-11.8 23.5-3.5 33.8s23.5 11.8 33.8 3.5C402.1 312.9 416 286.1 416 256s-13.9-56.9-35.5-74.5z"/></svg>`,"volume-low":`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><!--!Font Awesome Free v7.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M48 352l48 0 134.1 119.2c6.4 5.7 14.6 8.8 23.1 8.8 19.2 0 34.8-15.6 34.8-34.8l0-378.4c0-19.2-15.6-34.8-34.8-34.8-8.5 0-16.7 3.1-23.1 8.8L96 160 48 160c-26.5 0-48 21.5-48 48l0 96c0 26.5 21.5 48 48 48zM380.6 181.5c-10.3-8.4-25.4-6.8-33.8 3.5s-6.8 25.4 3.5 33.8C361.1 227.6 368 241 368 256s-6.9 28.4-17.7 37.3c-10.3 8.4-11.8 23.5-3.5 33.8s23.5 11.8 33.8 3.5C402.1 312.9 416 286.1 416 256s-13.9-56.9-35.5-74.5z"/></svg>`,"volume-xmark":`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><!--!Font Awesome Free v7.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M48 352l48 0 134.1 119.2c6.4 5.7 14.6 8.8 23.1 8.8 19.2 0 34.8-15.6 34.8-34.8l0-378.4c0-19.2-15.6-34.8-34.8-34.8-8.5 0-16.7 3.1-23.1 8.8L96 160 48 160c-26.5 0-48 21.5-48 48l0 96c0 26.5 21.5 48 48 48zM367 175c-9.4 9.4-9.4 24.6 0 33.9l47 47-47 47c-9.4 9.4-9.4 24.6 0 33.9s24.6 9.4 33.9 0l47-47 47 47c9.4 9.4 24.6 9.4 33.9 0s9.4-24.6 0-33.9l-47-47 47-47c9.4-9.4 9.4-24.6 0-33.9s-24.6-9.4-33.9 0l-47 47-47-47c-9.4-9.4-24.6-9.4-33.9 0z"/></svg>`,xmark:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><!--! Font Awesome Free 7.0.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc. --><path d="M55.1 73.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L147.2 256 9.9 393.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192.5 301.3 329.9 438.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.8 256 375.1 118.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192.5 210.7 55.1 73.4z"/></svg>`},regular:{calendar:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free v7.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M216 64C229.3 64 240 74.7 240 88L240 128L400 128L400 88C400 74.7 410.7 64 424 64C437.3 64 448 74.7 448 88L448 128L480 128C515.3 128 544 156.7 544 192L544 480C544 515.3 515.3 544 480 544L160 544C124.7 544 96 515.3 96 480L96 192C96 156.7 124.7 128 160 128L192 128L192 88C192 74.7 202.7 64 216 64zM216 176L160 176C151.2 176 144 183.2 144 192L144 240L496 240L496 192C496 183.2 488.8 176 480 176L216 176zM144 288L144 480C144 488.8 151.2 496 160 496L480 496C488.8 496 496 488.8 496 480L496 288L144 288z"/></svg>`,"circle-question":`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--! Font Awesome Free 7.0.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc. --><path d="M464 256a208 208 0 1 0 -416 0 208 208 0 1 0 416 0zM0 256a256 256 0 1 1 512 0 256 256 0 1 1 -512 0zm256-80c-17.7 0-32 14.3-32 32 0 13.3-10.7 24-24 24s-24-10.7-24-24c0-44.2 35.8-80 80-80s80 35.8 80 80c0 47.2-36 67.2-56 74.5l0 3.8c0 13.3-10.7 24-24 24s-24-10.7-24-24l0-8.1c0-20.5 14.8-35.2 30.1-40.2 6.4-2.1 13.2-5.5 18.2-10.3 4.3-4.2 7.7-10 7.7-19.6 0-17.7-14.3-32-32-32zM224 368a32 32 0 1 1 64 0 32 32 0 1 1 -64 0z"/></svg>`,"circle-xmark":`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--! Font Awesome Free 7.0.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc. --><path d="M256 48a208 208 0 1 1 0 416 208 208 0 1 1 0-416zm0 464a256 256 0 1 0 0-512 256 256 0 1 0 0 512zM167 167c-9.4 9.4-9.4 24.6 0 33.9l55 55-55 55c-9.4 9.4-9.4 24.6 0 33.9s24.6 9.4 33.9 0l55-55 55 55c9.4 9.4 24.6 9.4 33.9 0s9.4-24.6 0-33.9l-55-55 55-55c9.4-9.4 9.4-24.6 0-33.9s-24.6-9.4-33.9 0l-55 55-55-55c-9.4-9.4-24.6-9.4-33.9 0z"/></svg>`,clock:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free v7.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M528 320C528 434.9 434.9 528 320 528C205.1 528 112 434.9 112 320C112 205.1 205.1 112 320 112C434.9 112 528 205.1 528 320zM64 320C64 461.4 178.6 576 320 576C461.4 576 576 461.4 576 320C576 178.6 461.4 64 320 64C178.6 64 64 178.6 64 320zM296 184L296 320C296 328 300 335.5 306.7 340L402.7 404C413.7 411.4 428.6 408.4 436 397.3C443.4 386.2 440.4 371.4 429.3 364L344 307.2L344 184C344 170.7 333.3 160 320 160C306.7 160 296 170.7 296 184z"/></svg>`,copy:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><!--! Font Awesome Free 7.0.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc. --><path d="M384 336l-192 0c-8.8 0-16-7.2-16-16l0-256c0-8.8 7.2-16 16-16l133.5 0c4.2 0 8.3 1.7 11.3 4.7l58.5 58.5c3 3 4.7 7.1 4.7 11.3L400 320c0 8.8-7.2 16-16 16zM192 384l192 0c35.3 0 64-28.7 64-64l0-197.5c0-17-6.7-33.3-18.7-45.3L370.7 18.7C358.7 6.7 342.5 0 325.5 0L192 0c-35.3 0-64 28.7-64 64l0 256c0 35.3 28.7 64 64 64zM64 128c-35.3 0-64 28.7-64 64L0 448c0 35.3 28.7 64 64 64l192 0c35.3 0 64-28.7 64-64l0-16-48 0 0 16c0 8.8-7.2 16-16 16L64 464c-8.8 0-16-7.2-16-16l0-256c0-8.8 7.2-16 16-16l16 0 0-48-16 0z"/></svg>`,eye:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><!--! Font Awesome Free 7.0.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc. --><path d="M288 80C222.8 80 169.2 109.6 128.1 147.7 89.6 183.5 63 226 49.4 256 63 286 89.6 328.5 128.1 364.3 169.2 402.4 222.8 432 288 432s118.8-29.6 159.9-67.7C486.4 328.5 513 286 526.6 256 513 226 486.4 183.5 447.9 147.7 406.8 109.6 353.2 80 288 80zM95.4 112.6C142.5 68.8 207.2 32 288 32s145.5 36.8 192.6 80.6c46.8 43.5 78.1 95.4 93 131.1 3.3 7.9 3.3 16.7 0 24.6-14.9 35.7-46.2 87.7-93 131.1-47.1 43.7-111.8 80.6-192.6 80.6S142.5 443.2 95.4 399.4c-46.8-43.5-78.1-95.4-93-131.1-3.3-7.9-3.3-16.7 0-24.6 14.9-35.7 46.2-87.7 93-131.1zM288 336c44.2 0 80-35.8 80-80 0-29.6-16.1-55.5-40-69.3-1.4 59.7-49.6 107.9-109.3 109.3 13.8 23.9 39.7 40 69.3 40zm-79.6-88.4c2.5 .3 5 .4 7.6 .4 35.3 0 64-28.7 64-64 0-2.6-.2-5.1-.4-7.6-37.4 3.9-67.2 33.7-71.1 71.1zm45.6-115c10.8-3 22.2-4.5 33.9-4.5 8.8 0 17.5 .9 25.8 2.6 .3 .1 .5 .1 .8 .2 57.9 12.2 101.4 63.7 101.4 125.2 0 70.7-57.3 128-128 128-61.6 0-113-43.5-125.2-101.4-1.8-8.6-2.8-17.5-2.8-26.6 0-11 1.4-21.8 4-32 .2-.7 .3-1.3 .5-1.9 11.9-43.4 46.1-77.6 89.5-89.5z"/></svg>`,"eye-slash":`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><!--! Font Awesome Free 7.0.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc. --><path d="M41-24.9c-9.4-9.4-24.6-9.4-33.9 0S-2.3-.3 7 9.1l528 528c9.4 9.4 24.6 9.4 33.9 0s9.4-24.6 0-33.9l-96.4-96.4c2.7-2.4 5.4-4.8 8-7.2 46.8-43.5 78.1-95.4 93-131.1 3.3-7.9 3.3-16.7 0-24.6-14.9-35.7-46.2-87.7-93-131.1-47.1-43.7-111.8-80.6-192.6-80.6-56.8 0-105.6 18.2-146 44.2L41-24.9zM176.9 111.1c32.1-18.9 69.2-31.1 111.1-31.1 65.2 0 118.8 29.6 159.9 67.7 38.5 35.7 65.1 78.3 78.6 108.3-13.6 30-40.2 72.5-78.6 108.3-3.1 2.8-6.2 5.6-9.4 8.4L393.8 328c14-20.5 22.2-45.3 22.2-72 0-70.7-57.3-128-128-128-26.7 0-51.5 8.2-72 22.2l-39.1-39.1zm182 182l-108-108c11.1-5.8 23.7-9.1 37.1-9.1 44.2 0 80 35.8 80 80 0 13.4-3.3 26-9.1 37.1zM103.4 173.2l-34-34c-32.6 36.8-55 75.8-66.9 104.5-3.3 7.9-3.3 16.7 0 24.6 14.9 35.7 46.2 87.7 93 131.1 47.1 43.7 111.8 80.6 192.6 80.6 37.3 0 71.2-7.9 101.5-20.6L352.2 422c-20 6.4-41.4 10-64.2 10-65.2 0-118.8-29.6-159.9-67.7-38.5-35.7-65.1-78.3-78.6-108.3 10.4-23.1 28.6-53.6 54-82.8z"/></svg>`,star:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><!--! Font Awesome Free 7.0.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc. --><path d="M288.1-32c9 0 17.3 5.1 21.4 13.1L383 125.3 542.9 150.7c8.9 1.4 16.3 7.7 19.1 16.3s.5 18-5.8 24.4L441.7 305.9 467 465.8c1.4 8.9-2.3 17.9-9.6 23.2s-17 6.1-25 2L288.1 417.6 143.8 491c-8 4.1-17.7 3.3-25-2s-11-14.2-9.6-23.2L134.4 305.9 20 191.4c-6.4-6.4-8.6-15.8-5.8-24.4s10.1-14.9 19.1-16.3l159.9-25.4 73.6-144.2c4.1-8 12.4-13.1 21.4-13.1zm0 76.8L230.3 158c-3.5 6.8-10 11.6-17.6 12.8l-125.5 20 89.8 89.9c5.4 5.4 7.9 13.1 6.7 20.7l-19.8 125.5 113.3-57.6c6.8-3.5 14.9-3.5 21.8 0l113.3 57.6-19.8-125.5c-1.2-7.6 1.3-15.3 6.7-20.7l89.8-89.9-125.5-20c-7.6-1.2-14.1-6-17.6-12.8L288.1 44.8z"/></svg>`}},Yt={name:`system`,resolver:(e,t=`classic`,n=`solid`)=>{let r=Jt[n][e]??Jt.regular[e]??Jt.regular[`circle-question`];return r?qt(r):``},mutator:e=>{e.hasAttribute(`fill`)||e.setAttribute(`fill`,`currentColor`)}},Xt=`classic`,Zt=[Kt,Yt],Qt=new Set;function $t(e){Qt.add(e)}function en(e){Qt.delete(e)}function tn(e){return Zt.find(t=>t.name===e)}function nn(e,t){rn(e),Zt.push({name:e,resolver:t.resolver,mutator:t.mutator,spriteSheet:t.spriteSheet}),Qt.forEach(t=>{t.library===e&&t.setIcon()})}function rn(e){Zt=Zt.filter(t=>t.name!==e)}function an(){return Xt}var{I:on}=Le,sn=(e,t)=>t===void 0?e?._$litType$!==void 0:e?._$litType$===t,cn=e=>e.strings===void 0,ln={},un=(e,t=ln)=>e._$AH=t,dn=Symbol(),fn=Symbol(),pn,mn=new Map,hn=class extends V{constructor(){super(...arguments),this.svg=null,this.autoWidth=!1,this.swapOpacity=!1,this.label=``,this.library=`default`,this.rotate=0,this.resolveIcon=async(e,t)=>{let n;if(t?.spriteSheet){this.hasUpdated||await this.updateComplete,this.svg=j`<svg part="svg">
        <use part="use" href="${e}"></use>
      </svg>`,await this.updateComplete;let n=this.shadowRoot.querySelector(`[part='svg']`);return typeof t.mutator==`function`&&t.mutator(n,this),this.svg}try{if(n=await fetch(e,{mode:`cors`}),!n.ok)return n.status===410?dn:fn}catch{return fn}try{let e=document.createElement(`div`);e.innerHTML=await n.text();let t=e.firstElementChild;if(t?.tagName?.toLowerCase()!==`svg`)return dn;pn||=new DOMParser;let r=pn.parseFromString(t.outerHTML,`text/html`).body.querySelector(`svg`);return r?(r.part.add(`svg`),document.adoptNode(r)):dn}catch{return dn}}}connectedCallback(){super.connectedCallback(),$t(this)}firstUpdated(e){super.firstUpdated(e),this.hasAttribute(`rotate`)&&this.style.setProperty(`--rotate-angle`,`${this.rotate}deg`),this.setIcon()}disconnectedCallback(){super.disconnectedCallback(),en(this)}async getIconSource(){let e=tn(this.library),t=this.family||an();if(this.name&&e){let n=this.canvas===`auto`||this.autoWidth,r;try{r=await e.resolver(this.name,t,this.variant,n)}catch{r=void 0}return{url:r,fromLibrary:!0}}return{url:this.src,fromLibrary:!1}}handleLabelChange(){typeof this.label==`string`&&this.label.length>0?(this.setAttribute(`role`,`img`),this.setAttribute(`aria-label`,this.label),this.removeAttribute(`aria-hidden`)):(this.removeAttribute(`role`),this.removeAttribute(`aria-label`),this.setAttribute(`aria-hidden`,`true`))}async setIcon(){let{url:e,fromLibrary:t}=await this.getIconSource(),n=t?tn(this.library):void 0;if(!e){this.svg=null;return}let r=mn.get(e);r||(r=this.resolveIcon(e,n),mn.set(e,r));let i=await r;if(i===fn&&mn.delete(e),e===(await this.getIconSource()).url){if(sn(i)){this.svg=i;return}switch(i){case fn:case dn:this.svg=null,this.dispatchEvent(new Mt);break;default:this.svg=i.cloneNode(!0),n?.mutator?.(this.svg,this),this.dispatchEvent(new Nt)}}}willUpdate(e){return this.style||this.setStyleProperty(`--rotate-angle`,`${this.rotate}deg`),super.willUpdate(e)}updated(e){super.updated(e);let t=tn(this.library);this.hasAttribute(`rotate`)&&this.style.setProperty(`--rotate-angle`,`${this.rotate}deg`);let n=this.shadowRoot?.querySelector(`svg`);n&&t?.mutator?.(n,this)}render(){return this.hasUpdated?this.svg:j`<svg part="svg" width="16" height="16" viewBox="0 0 16 16"></svg>`}};hn.css=Pt,F([z()],hn.prototype,`svg`,2),F([R({reflect:!0})],hn.prototype,`name`,2),F([R({reflect:!0})],hn.prototype,`family`,2),F([R({reflect:!0})],hn.prototype,`variant`,2),F([R({reflect:!0})],hn.prototype,`canvas`,2),F([R({attribute:`auto-width`,type:Boolean,reflect:!0})],hn.prototype,`autoWidth`,2),F([R({attribute:`swap-opacity`,type:Boolean,reflect:!0})],hn.prototype,`swapOpacity`,2),F([R()],hn.prototype,`src`,2),F([R()],hn.prototype,`label`,2),F([R({reflect:!0})],hn.prototype,`library`,2),F([R({type:Number,reflect:!0})],hn.prototype,`rotate`,2),F([R({type:String,reflect:!0})],hn.prototype,`flip`,2),F([R({type:String,reflect:!0})],hn.prototype,`animation`,2),F([U(`label`)],hn.prototype,`handleLabelChange`,1),F([U([`family`,`name`,`library`,`variant`,`src`,`autoWidth`,`canvas`,`swapOpacity`],{waitUntilFirstUpdate:!0})],hn.prototype,`setIcon`,1),hn=F([I(`wa-icon`)],hn);var gn=h`
  :host {
    display: inline-flex;
  }

  .button-group {
    display: flex;
    position: relative;
    isolation: isolate;
    flex-wrap: wrap;

    @media (hover: hover) {
      > :hover,
      &::slotted(:hover) {
        z-index: 1;
      }
    }

    /* Focus and checked are always on top */
    > :focus,
    &::slotted(:focus),
    > [aria-checked='true'],
    &::slotted([aria-checked='true']),
    > [checked],
    &::slotted([checked]) {
      z-index: 2 !important;
    }

    :host([orientation='horizontal']) & {
      flex-direction: row;
    }

    :host([orientation='vertical']) & {
      flex-direction: column;
    }
  }

  /* Set custom properties to be inherited by slotted buttons */
  :host([orientation='horizontal']) {
    --_button-horizontal-indent: var(--wa-form-control-border-width);
    --_button-horizontal-indent-outlined: calc(var(--wa-form-control-border-width) * -1);

    ::slotted(:first-child) {
      --_button-horizontal-indent: 0;
      --_button-horizontal-indent-outlined: 0;
    }
  }

  :host([orientation='vertical']) {
    --_button-vertical-indent: var(--wa-form-control-border-width);
    --_button-vertical-indent-outlined: calc(var(--wa-form-control-border-width) * -1);

    ::slotted(:first-child) {
      --_button-vertical-indent: 0;
      --_button-vertical-indent-outlined: 0;
    }
  }

  /* All buttons that are not in front or at the end get their border radius removed */
  ::slotted(:not(:first-child):not(:last-child)) {
    --_button-start-start-radius: 0;
    --_button-start-end-radius: 0;
    --_button-end-start-radius: 0;
    --_button-end-end-radius: 0;
  }

  /* Remove leading and trailing buttons border radius individually */
  :host([orientation='horizontal']) {
    ::slotted(:first-child:not(:last-child)) {
      --_button-start-end-radius: 0;
      --_button-end-end-radius: 0;
    }

    ::slotted(:last-child:not(:first-child)) {
      --_button-start-start-radius: 0;
      --_button-end-start-radius: 0;
    }
  }

  :host([orientation='vertical']) {
    ::slotted(:first-child:not(:last-child)) {
      --_button-end-start-radius: 0;
      --_button-end-end-radius: 0;
    }

    ::slotted(:last-child:not(:first-child)) {
      --_button-start-start-radius: 0;
      --_button-start-end-radius: 0;
    }
  }
`,_n=class extends V{constructor(){super(...arguments),this.disableRole=!1,this.hasOutlined=!1,this.label=``,this.orientation=`horizontal`}updated(e){super.updated(e),e.has(`orientation`)&&this.setAttribute(`aria-orientation`,this.orientation)}handleFocus(e){vn(e.target)?.classList.add(`button-focus`)}handleBlur(e){vn(e.target)?.classList.remove(`button-focus`)}handleMouseOver(e){vn(e.target)?.classList.add(`button-hover`)}handleMouseOut(e){vn(e.target)?.classList.remove(`button-hover`)}render(){return j`
      <slot
        part="base"
        class="button-group"
        role="${this.disableRole?`presentation`:`group`}"
        aria-label=${this.label}
        aria-orientation=${this.orientation}
        @focusout=${this.handleBlur}
        @focusin=${this.handleFocus}
        @mouseover=${this.handleMouseOver}
        @mouseout=${this.handleMouseOut}
      ></slot>
    `}};_n.css=[gn],F([B(`slot`)],_n.prototype,`defaultSlot`,2),F([z()],_n.prototype,`disableRole`,2),F([z()],_n.prototype,`hasOutlined`,2),F([R()],_n.prototype,`label`,2),F([R({reflect:!0})],_n.prototype,`orientation`,2),_n=F([I(`wa-button-group`)],_n);function vn(e){let t=`wa-button, wa-radio-button`;return e.closest(t)??e.querySelector(t)}var yn=h`
  :host {
    display: flex;
    position: relative;
    align-items: stretch;
    border-radius: var(--wa-panel-border-radius);
    background-color: var(--wa-color-fill-quiet, var(--wa-color-brand-fill-quiet));
    border-color: var(--wa-color-border-quiet, var(--wa-color-brand-border-quiet));
    border-style: var(--wa-panel-border-style);
    border-width: var(--wa-panel-border-width);
    color: var(--wa-color-text-normal);
    padding: 1em;
  }

  /* Appearance modifiers */
  :host([appearance~='plain']) {
    background-color: transparent;
    border-color: transparent;
  }

  :host([appearance~='outlined']) {
    background-color: transparent;
    border-color: var(--wa-color-border-loud, var(--wa-color-brand-border-loud));
  }

  :host([appearance~='filled']) {
    background-color: var(--wa-color-fill-quiet, var(--wa-color-brand-fill-quiet));
    border-color: transparent;
  }

  :host([appearance~='filled-outlined']) {
    border-color: var(--wa-color-border-quiet, var(--wa-color-brand-border-quiet));
  }

  :host([appearance~='accent']) {
    color: var(--wa-color-on-loud, var(--wa-color-brand-on-loud));
    background-color: var(--wa-color-fill-loud, var(--wa-color-brand-fill-loud));
    border-color: transparent;

    [part~='icon'] {
      color: currentColor;
    }
  }

  [part~='icon'] {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    color: var(--wa-color-on-quiet);
    font-size: 1.25em;
  }

  ::slotted([slot='icon']) {
    margin-inline-end: var(--wa-form-control-padding-inline);
  }

  [part~='message'] {
    flex: 1 1 auto;
    display: block;
    overflow: hidden;
  }
`,bn=class extends V{constructor(){super(...arguments),this.variant=`brand`,this.size=`m`}handleSizeChange(){dt(this.localName,this.size)}render(){return j`
      <div part="icon">
        <slot name="icon"></slot>
      </div>

      <div part="message">
        <slot></slot>
      </div>
    `}};bn.css=[yn,Ve,ft],F([R({reflect:!0})],bn.prototype,`variant`,2),F([R({reflect:!0})],bn.prototype,`appearance`,2),F([R({reflect:!0})],bn.prototype,`size`,2),F([U(`size`)],bn.prototype,`handleSizeChange`,1),bn=F([I(`wa-callout`)],bn);var xn=class{constructor(e,t){this.element=e,this.callback=t}start(...e){this.observer??=new ResizeObserver(()=>this.check()),this.observer.observe(this.element);for(let t of e)this.observer.observe(t);this.initialCheckHandle??=requestAnimationFrame(()=>{this.initialCheckHandle=void 0,this.check()})}stop(){this.initialCheckHandle!==void 0&&(cancelAnimationFrame(this.initialCheckHandle),this.initialCheckHandle=void 0),this.observer?.disconnect()}check(){this.callback(this.element.getClientRects().length>0)}};function Sn(e,t){return{top:Math.round(e.getBoundingClientRect().top-t.getBoundingClientRect().top),left:Math.round(e.getBoundingClientRect().left-t.getBoundingClientRect().left)}}var Cn=new Set;function wn(){let e=document.documentElement.clientWidth;return Math.abs(window.innerWidth-e)}function Tn(){let e=Number(getComputedStyle(document.body).paddingRight.replace(/px/,``));return isNaN(e)||!e?0:e}function En(e){if(Cn.add(e),!document.documentElement.classList.contains(`wa-scroll-lock`)){let e=wn()+Tn(),t=getComputedStyle(document.documentElement).scrollbarGutter;(!t||t===`auto`)&&(t=`stable`),e<2&&(t=``),document.documentElement.style.setProperty(`--wa-scroll-lock-gutter`,t),document.documentElement.classList.add(`wa-scroll-lock`),document.documentElement.style.setProperty(`--wa-scroll-lock-size`,`${e}px`)}}function Dn(e){Cn.delete(e),Cn.size===0&&(document.documentElement.classList.remove(`wa-scroll-lock`),document.documentElement.style.removeProperty(`--wa-scroll-lock-size`))}function On(e,t,n=`vertical`,r=`smooth`){let i=Sn(e,t),a=i.top+t.scrollTop,o=i.left+t.scrollLeft,s=t.scrollLeft,c=t.scrollLeft+t.offsetWidth,l=t.scrollTop,u=t.scrollTop+t.offsetHeight;(n===`horizontal`||n===`both`)&&(o<s?t.scrollTo({left:o,behavior:r}):o+e.clientWidth>c&&t.scrollTo({left:o-t.offsetWidth+e.clientWidth,behavior:r})),(n===`vertical`||n===`both`)&&(a<l?t.scrollTo({top:a,behavior:r}):a+e.clientHeight>u&&t.scrollTo({top:a-t.offsetHeight+e.clientHeight,behavior:r}))}function kn(e){return e.split(` `).map(e=>e.trim()).filter(e=>e!==``)}var An=class extends Event{constructor(){super(`wa-show`,{bubbles:!0,cancelable:!0,composed:!0})}},jn=class extends Event{constructor(e){super(`wa-hide`,{bubbles:!0,cancelable:!0,composed:!0}),this.detail=e}},Mn=class extends Event{constructor(){super(`wa-after-hide`,{bubbles:!0,cancelable:!1,composed:!0})}},Nn=class extends Event{constructor(){super(`wa-after-show`,{bubbles:!0,cancelable:!1,composed:!0})}},Pn=h`
  :host {
    --width: 31rem;
    --spacing: var(--wa-space-l);
    --backdrop-filter: none;
    --show-duration: var(--wa-transition-normal);
    --hide-duration: var(--wa-transition-normal);

    display: none;
  }

  :host([open]) {
    display: block;
  }

  .dialog {
    display: flex;
    flex-direction: column;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    width: var(--width);
    max-width: calc(100% - var(--wa-space-2xl));
    max-height: calc(100% - var(--wa-space-2xl));
    color: inherit;
    background-color: var(--wa-color-surface-raised);
    border-radius: var(--wa-panel-border-radius);
    border: none;
    box-shadow: var(--wa-shadow-l);
    padding: 0;
    margin: auto;

    &.show {
      animation: show-dialog var(--show-duration) ease;

      &::backdrop {
        animation: show-backdrop var(--show-duration, 200ms) ease;
      }
    }

    &.hide {
      animation: show-dialog var(--hide-duration) ease reverse;

      &::backdrop {
        animation: show-backdrop var(--hide-duration, 200ms) ease reverse;
      }
    }

    &.pulse {
      animation: pulse 250ms ease;
    }
  }

  .dialog:focus {
    outline: none;
  }

  /* Ensure there's enough vertical padding for phones that don't update vh when chrome appears (e.g. iPhone) */
  @media screen and (max-width: 420px) {
    .dialog {
      max-height: 80vh;
    }
  }

  .open {
    display: flex;
    opacity: 1;
  }

  .header {
    flex: 0 0 auto;
    display: flex;
    flex-wrap: nowrap;

    padding-inline-start: var(--spacing);
    padding-block-end: 0;

    /* Subtract the close button's padding so that the X is visually aligned with the edges of the dialog content */
    padding-inline-end: calc(var(--spacing) - var(--wa-form-control-padding-block));
    padding-block-start: calc(var(--spacing) - var(--wa-form-control-padding-block));
  }

  .title {
    align-self: center;
    flex: 1 1 auto;
    font-family: inherit;
    font-size: var(--wa-font-size-l);
    font-weight: var(--wa-font-weight-heading);
    line-height: var(--wa-line-height-condensed);
    margin: 0;
  }

  .header-actions {
    align-self: start;
    display: flex;
    flex-shrink: 0;
    flex-wrap: wrap;
    justify-content: end;
    gap: var(--wa-space-2xs);
    padding-inline-start: var(--spacing);
  }

  .header-actions wa-button,
  .header-actions ::slotted(wa-button) {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
  }

  .body {
    flex: 1 1 auto;
    display: block;
    padding: var(--spacing);
    overflow: auto;
    -webkit-overflow-scrolling: touch;

    &:focus {
      outline: none;
    }

    &:focus-visible {
      outline: var(--wa-focus-ring);
      outline-offset: var(--wa-focus-ring-offset);
    }
  }

  .footer {
    flex: 0 0 auto;
    display: flex;
    flex-wrap: wrap;
    gap: var(--wa-space-xs);
    justify-content: end;
    padding: var(--spacing);
    padding-block-start: 0;
  }

  .footer ::slotted(wa-button:not(:first-of-type)) {
    margin-inline-start: var(--wa-spacing-xs);
  }

  .dialog::backdrop {
    /*
      NOTE: the ::backdrop element doesn't inherit properly in Safari yet, but it will in 17.4! At that time, we can
      remove the fallback values here.
    */
    background-color: var(--wa-color-overlay-modal, rgb(0 0 0 / 0.25));
    backdrop-filter: var(--backdrop-filter);
  }

  @keyframes pulse {
    0% {
      scale: 1;
    }
    50% {
      scale: 1.02;
    }
    100% {
      scale: 1;
    }
  }

  @keyframes show-dialog {
    from {
      opacity: 0;
      scale: 0.8;
    }
    to {
      opacity: 1;
      scale: 1;
    }
  }

  @keyframes show-backdrop {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @media (forced-colors: active) {
    .dialog {
      border: solid 1px white;
    }
  }
`,Fn=[];function In(e){Ln(e),Fn.push(e)}function Ln(e){for(let t=Fn.length-1;t>=0;t--)if(Fn[t]===e){Fn.splice(t,1);break}}function Rn(e){return Fn.length>0&&Fn[Fn.length-1]===e}async function zn(e,t,n){return e.animate(t,n).finished.catch(()=>{})}function Bn(e,t){return new Promise(n=>{let r=new AbortController,{signal:i}=r;if(e.classList.contains(t))return;e.classList.add(t);let a=!1,o=()=>{a||(a=!0,e.classList.remove(t),n(),r.abort())};e.addEventListener(`animationend`,o,{once:!0,signal:i}),e.addEventListener(`animationcancel`,o,{once:!0,signal:i}),requestAnimationFrame(()=>{!a&&e.getAnimations().length===0&&o()})})}function Vn(){return window.matchMedia(`(prefers-reduced-motion: reduce)`).matches}var Hn=class extends V{constructor(){super(...arguments),this.localize=new Ct(this),this.hasSlotController=new H(this,`footer`,`header-actions`,`label`),this.renderedWatcher=new xn(this,e=>this.handleRenderedChange(e)),this.open=!1,this.label=``,this.withoutHeader=!1,this.lightDismiss=!1,this.withFooter=!1,this.handleDocumentKeyDown=e=>{e.key===`Escape`&&this.open&&Rn(this)&&(e.preventDefault(),e.stopPropagation(),this.requestClose(this.dialog))}}firstUpdated(e){super.firstUpdated(e),this.open&&(this.addOpenListeners(),this.dialog.showModal(),En(this),this.renderedWatcher.start(this.dialog))}disconnectedCallback(){super.disconnectedCallback(),this.renderedWatcher.stop(),Dn(this),this.removeOpenListeners()}async requestClose(e){let t=new jn({source:e});if(this.dispatchEvent(t),t.defaultPrevented){this.open=!0,Bn(this.dialog,`pulse`);return}this.removeOpenListeners(),await Bn(this.dialog,`hide`),this.open=!1,this.dialog.close(),Dn(this),this.renderedWatcher.stop();let n=this.originalTrigger;typeof n?.focus==`function`&&setTimeout(()=>n.focus()),this.dispatchEvent(new Mn)}addOpenListeners(){document.addEventListener(`keydown`,this.handleDocumentKeyDown),In(this)}removeOpenListeners(){document.removeEventListener(`keydown`,this.handleDocumentKeyDown),Ln(this)}handleDialogCancel(e){e.preventDefault(),!this.dialog.classList.contains(`hide`)&&e.target===this.dialog&&Rn(this)&&this.requestClose(this.dialog)}handleDialogClick(e){let t=e.target.closest(`[data-dialog="close"]`);t&&(e.stopPropagation(),this.requestClose(t))}async handleDialogPointerDown(e){e.target===this.dialog&&(this.lightDismiss?this.requestClose(this.dialog):await Bn(this.dialog,`pulse`))}handleRenderedChange(e){if(!this.open){this.renderedWatcher.stop();return}!e&&this.dialog.open?(this.removeOpenListeners(),this.dialog.close(),Dn(this)):e&&!this.dialog.open&&(this.addOpenListeners(),this.dialog.showModal(),En(this))}handleOpenChange(){this.open&&!this.dialog.open?this.show():!this.open&&this.dialog.open?(this.open=!0,this.requestClose(this.dialog)):this.open||this.renderedWatcher.stop()}async show(){let e=new An;if(this.dispatchEvent(e),e.defaultPrevented){this.open=!1;return}this.addOpenListeners(),this.originalTrigger=document.activeElement,this.open=!0,this.dialog.showModal(),En(this),this.renderedWatcher.start(this.dialog),requestAnimationFrame(()=>{let e=this.querySelector(`[autofocus]`);e&&typeof e.focus==`function`?e.focus():this.dialog.focus()}),await Bn(this.dialog,`show`),this.dispatchEvent(new Nn)}render(){let e=!this.withoutHeader,t=this.hasSlotController.test(`footer`,`withFooter`);return j`
      <dialog
        part="dialog"
        class=${K({dialog:!0,open:this.open})}
        @cancel=${this.handleDialogCancel}
        @click=${this.handleDialogClick}
        @pointerdown=${this.handleDialogPointerDown}
      >
        ${e?j`
              <div part="header" class="header">
                <h2 part="title" class="title" id="title">
                  <!-- If there's no label, use an invisible character to prevent the header from collapsing -->
                  <slot name="label"> ${this.label.length>0?this.label:`​`} </slot>
                </h2>
                <div part="header-actions" class="header-actions">
                  <slot name="header-actions"></slot>
                  <wa-button
                    part="close-button"
                    exportparts="base:close-button__base"
                    class="close"
                    appearance="plain"
                    @click="${e=>this.requestClose(e.target)}"
                  >
                    <wa-icon
                      name="xmark"
                      label=${this.localize.term(`close`)}
                      library="system"
                      variant="solid"
                    ></wa-icon>
                  </wa-button>
                </div>
              </div>
            `:``}

        <div part="body" class="body"><slot></slot></div>

        <!-- Use a hidden element so we still get "slotchange" events. -->
        <div part="footer" class="footer" ?hidden=${!t}>
          <slot name="footer"></slot>
        </div>
      </dialog>
    `}};Hn.css=Pn,F([B(`.dialog`)],Hn.prototype,`dialog`,2),F([R({type:Boolean,reflect:!0})],Hn.prototype,`open`,2),F([R({reflect:!0})],Hn.prototype,`label`,2),F([R({attribute:`without-header`,type:Boolean,reflect:!0})],Hn.prototype,`withoutHeader`,2),F([R({attribute:`light-dismiss`,type:Boolean})],Hn.prototype,`lightDismiss`,2),F([R({attribute:`with-footer`,type:Boolean})],Hn.prototype,`withFooter`,2),F([U(`open`,{waitUntilFirstUpdate:!0})],Hn.prototype,`handleOpenChange`,1),Hn=F([I(`wa-dialog`)],Hn),document.addEventListener(`click`,e=>{let t=e.target.closest(`[data-dialog]`);if(t instanceof Element){let[e,n]=kn(t.getAttribute(`data-dialog`)||``);if(e===`open`&&n?.length){let e=t.getRootNode().getElementById(n);e?.localName===`wa-dialog`?e.open=!0:console.warn(`A dialog with an ID of "${n}" could not be found in this document.`)}}}),document.addEventListener(`pointerdown`,()=>{});var Un=h`
  :host {
    --color: var(--wa-color-surface-border);
    --width: var(--wa-border-width-s);
    --spacing: var(--wa-space-m);
  }

  :host(:not([orientation='vertical'])) {
    display: block;
    border-top: solid var(--width) var(--color);
    margin: var(--spacing) 0;
  }

  :host([orientation='vertical']) {
    display: inline-block;
    height: 100%;
    border-inline-start: solid var(--width) var(--color);
    margin: 0 var(--spacing);
    min-block-size: 1lh;
  }
`,Wn=class extends V{constructor(){super(...arguments),this.orientation=`horizontal`}connectedCallback(){super.connectedCallback(),this.setAttribute(`role`,`separator`)}handleVerticalChange(){this.setAttribute(`aria-orientation`,this.orientation)}};Wn.css=Un,F([R({reflect:!0})],Wn.prototype,`orientation`,2),F([U(`orientation`)],Wn.prototype,`handleVerticalChange`,1),Wn=F([I(`wa-divider`)],Wn);var Gn=class extends Event{constructor(){super(`wa-clear`,{bubbles:!0,cancelable:!1,composed:!0})}};function Kn(e,t){let n=e.metaKey||e.ctrlKey||e.shiftKey||e.altKey;e.key===`Enter`&&!n&&setTimeout(()=>{!e.defaultPrevented&&!e.isComposing&&qn(t)})}function qn(e){let t=null;if(`form`in e&&(t=e.form),!t&&`getForm`in e&&(t=e.getForm()),!t)return;let n=[...t.elements];if(n.length===1){t.requestSubmit(null);return}let r=n.find(e=>e.type===`submit`&&!e.matches(`:disabled`));r&&([`input`,`button`].includes(r.localName)?t.requestSubmit(r):r.click())}var Jn=h`
  :host {
    border-width: 0;
  }

  :host(:focus) {
    outline: none;
  }

  .text-field {
    display: flex;
    align-items: stretch;
    justify-content: start;
    position: relative;
    transition: inherit;
    height: var(--wa-form-control-height);
    border-color: var(--wa-form-control-border-color);
    border-radius: var(--wa-form-control-border-radius);
    border-style: var(--wa-form-control-border-style);
    border-width: var(--wa-form-control-border-width);
    cursor: text;
    color: var(--wa-form-control-value-color);
    font-size: var(--wa-form-control-value-font-size);
    font-family: inherit;
    font-weight: var(--wa-form-control-value-font-weight);
    line-height: var(--wa-form-control-value-line-height);
    vertical-align: middle;
    width: 100%;
    transition:
      background-color var(--wa-transition-normal),
      border-color var(--wa-transition-normal),
      outline-color var(--wa-transition-fast);
    transition-timing-function: var(--wa-transition-easing);
    background-color: var(--wa-form-control-background-color);
    box-shadow: var(--box-shadow);
    padding: 0 var(--wa-form-control-padding-inline);
    outline: var(--wa-focus-ring-style) var(--wa-focus-ring-width) transparent;
    outline-offset: var(--wa-focus-ring-offset);

    /* Only ring the field when the text input has focus, not inner buttons */
    &:has(input:focus, textarea:focus) {
      outline-color: var(--wa-color-focus);
    }

    /* Style disabled inputs */
    &:has(:disabled) {
      cursor: not-allowed;
      opacity: 0.5;
    }
  }

  /* Appearance modifiers */
  :host([appearance='outlined']) .text-field {
    background-color: var(--wa-form-control-background-color);
    border-color: var(--wa-form-control-border-color);
  }

  :host([appearance='filled']) .text-field {
    background-color: var(--wa-color-neutral-fill-quiet);
    border-color: var(--wa-color-neutral-fill-quiet);
  }

  :host([appearance='filled-outlined']) .text-field {
    background-color: var(--wa-color-neutral-fill-quiet);
    border-color: var(--wa-form-control-border-color);
  }

  :host([pill]) .text-field {
    border-radius: var(--wa-border-radius-pill) !important;
  }

  .text-field {
    /* Show autofill styles over the entire text field, not just the native <input> */
    &:has(:autofill),
    &:has(:-webkit-autofill) {
      background-color: var(--wa-color-brand-fill-quiet) !important;
    }

    input,
    textarea {
      /*
      Fixes an alignment issue with placeholders.
      https://github.com/shoelace-style/webawesome/issues/342
    */
      height: 100%;

      padding: 0;
      border: none;
      outline: none;
      box-shadow: none;
      margin: 0;
      cursor: inherit;
      -webkit-appearance: none;
      font: inherit;

      /* Turn off Safari's autofill styles */
      &:-webkit-autofill,
      &:-webkit-autofill:hover,
      &:-webkit-autofill:focus,
      &:-webkit-autofill:active {
        -webkit-background-clip: text;
        background-color: transparent;
        -webkit-text-fill-color: inherit;
      }
    }
  }

  input {
    flex: 1 1 auto;
    min-width: 0;
    height: 100%;
    transition: inherit;

    /* prettier-ignore */
    background-color: rgb(118 118 118 / 0); /* ensures proper placeholder styles in webkit's date input */
    height: calc(var(--wa-form-control-height) - var(--border-width) * 2);
    padding-block: 0;
    color: inherit;

    &:autofill {
      &,
      &:hover,
      &:focus,
      &:active {
        box-shadow: none;
        caret-color: var(--wa-form-control-value-color);
      }
    }

    &::placeholder {
      color: var(--wa-form-control-placeholder-color);
      user-select: none;
      -webkit-user-select: none;
    }

    &::-webkit-search-decoration,
    &::-webkit-search-cancel-button,
    &::-webkit-search-results-button,
    &::-webkit-search-results-decoration {
      -webkit-appearance: none;
    }

    &:focus {
      outline: none;
    }
  }

  textarea {
    &:autofill {
      &,
      &:hover,
      &:focus,
      &:active {
        box-shadow: none;
        caret-color: var(--wa-form-control-value-color);
      }
    }

    &::placeholder {
      color: var(--wa-form-control-placeholder-color);
      user-select: none;
      -webkit-user-select: none;
    }
  }

  .start,
  .end {
    display: inline-flex;
    flex: 0 0 auto;
    align-items: center;
    cursor: default;

    &::slotted(wa-icon) {
      color: var(--wa-color-neutral-on-quiet);
    }
  }

  .start::slotted(*) {
    margin-inline-end: var(--wa-form-control-padding-inline);
  }

  .end::slotted(*) {
    margin-inline-start: var(--wa-form-control-padding-inline);
  }

  /*
   * Clearable + Password Toggle
   */

  .clear,
  .password-toggle {
    position: relative;
    display: inline-flex;
    align-self: center;
    align-items: center;
    justify-content: center;
    aspect-ratio: 1;
    height: 1.5em;
    font-size: inherit;
    color: var(--wa-color-neutral-on-quiet);
    border: none;
    border-radius: var(--wa-border-radius-s);
    background: none;
    padding: 0;
    transition: var(--wa-transition-normal) color;
    cursor: pointer;
    /* The box is wider than the glyph, so overhang half of that growth on each side. Keeps the
       glyph flush with the field's trailing padding edge, like every other form control. */
    margin-inline-start: calc(var(--wa-form-control-padding-inline) - 0.125em);
    margin-inline-end: -0.125em;

    &::after {
      content: '';
      position: absolute;
      inset-inline: 0;
      height: var(--wa-form-control-height);
    }

    @media (hover: hover) {
      &:hover {
        color: color-mix(in oklab, currentColor, var(--wa-color-mix-hover));
      }
    }

    &:active {
      color: color-mix(in oklab, currentColor, var(--wa-color-mix-active));
    }

    &:focus {
      outline: none;
    }

    &:focus-visible {
      outline: var(--wa-focus-ring);
      outline-offset: var(--wa-focus-ring-offset);
    }
  }

  /* Don't show the browser's password toggle in Edge */
  ::-ms-reveal {
    display: none;
  }

  /* Hide the built-in number spinner */
  :host([without-spin-buttons]) input[type='number'] {
    -moz-appearance: textfield;

    &::-webkit-outer-spin-button,
    &::-webkit-inner-spin-button {
      -webkit-appearance: none;
      display: none;
    }
  }
`,Yn=h`
  :host {
    display: flex;
    flex-direction: column;
  }

  /* Treat wrapped labels, inputs, and hints as direct children of the host element */
  [part~='form-control'] {
    display: contents;
  }

  /* Label */
  :is([part~='form-control-label'], [part~='label']):has(*:not(:empty)),
  :is([part~='form-control-label'], [part~='label']).has-label {
    display: inline-flex;
    color: var(--wa-form-control-label-color);
    font-weight: var(--wa-form-control-label-font-weight);
    line-height: var(--wa-form-control-label-line-height);
    margin-block-end: 0.5em;
  }

  :host([required]) :is([part~='form-control-label'], [part~='label'])::after {
    content: var(--wa-form-control-required-content);
    margin-inline-start: var(--wa-form-control-required-content-offset);
    color: var(--wa-form-control-required-content-color);
  }

  /* Help text */
  [part~='hint'] {
    display: block;
    color: var(--wa-form-control-hint-color);
    font-weight: var(--wa-form-control-hint-font-weight);
    line-height: var(--wa-form-control-hint-line-height);
    margin-block-start: 0.5em;
    font-size: var(--wa-font-size-smaller);

    &:not(.has-slotted, .has-hint, .has-count) {
      display: none;
    }
  }
`,Xn=wt(class extends Tt{constructor(e){if(super(e),e.type!==G.PROPERTY&&e.type!==G.ATTRIBUTE&&e.type!==G.BOOLEAN_ATTRIBUTE)throw Error("The `live` directive is not allowed on child or event bindings");if(!cn(e))throw Error("`live` bindings can only contain a single expression")}render(e){return e}update(e,[t]){if(t===Ce||t===M)return t;let n=e.element,r=e.name;if(e.type===G.PROPERTY){if(t===n[r])return Ce}else if(e.type===G.BOOLEAN_ATTRIBUTE){if(!!t===n.hasAttribute(r))return Ce}else if(e.type===G.ATTRIBUTE&&n.getAttribute(r)===t+``)return Ce;return un(e),t}}),X=class extends st{constructor(){super(...arguments),this.assumeInteractionOn=[`blur`,`input`],this.hasSlotController=new H(this,`hint`,`label`),this.localize=new Ct(this),this.title=``,this.type=`text`,this._value=null,this.defaultValue=this.getAttribute(`value`)||null,this.size=`m`,this.appearance=`outlined`,this.pill=!1,this.label=``,this.hint=``,this.withClear=!1,this.placeholder=``,this.readonly=!1,this.passwordToggle=!1,this.passwordVisible=!1,this.withoutSpinButtons=!1,this.required=!1,this.spellcheck=!0,this.withLabel=!1,this.withHint=!1}static get validators(){return[...super.validators,it()]}get value(){return this.valueHasChanged?this._value:this._value??this.defaultValue}set value(e){this._value!==e&&(this.valueHasChanged=!0,this._value=e)}updateFormValue(e){if(e==null){this.setValue(``,null);return}super.updateFormValue(e)}handleSizeChange(){dt(this.localName,this.size)}handleChange(e){this.value=this.input.value,this.relayNativeEvent(e,{bubbles:!0,composed:!0})}handleClearClick(e){e.preventDefault(),this.value!==``&&(this.value=``,this.updateComplete.then(()=>{this.dispatchEvent(new Gn),this.dispatchEvent(new InputEvent(`input`,{bubbles:!0,composed:!0})),this.dispatchEvent(new Event(`change`,{bubbles:!0,composed:!0}))})),this.input.focus()}handleInput(){this.value=this.input.value}handleKeyDown(e){Kn(e,this)}handlePasswordToggle(){this.passwordVisible=!this.passwordVisible}updated(e){super.updated(e),(e.has(`value`)||e.has(`defaultValue`)||e.has(`type`))&&(this.input&&[`number`,`date`,`time`,`datetime-local`].includes(this.type)&&this.value&&this.input.value!==this.value&&(this._value=this.input.value),this.customStates.set(`blank`,!this.value),this.updateValidity())}handleStepChange(){this.input.step=String(this.step),this.updateValidity()}focus(e){this.input.focus(e)}blur(){this.input.blur()}select(){this.input.select()}setSelectionRange(e,t,n=`none`){this.input.setSelectionRange(e,t,n)}setRangeText(e,t,n,r=`preserve`){let i=t??this.input.selectionStart,a=n??this.input.selectionEnd;this.input.setRangeText(e,i,a,r),this.value!==this.input.value&&(this.value=this.input.value)}showPicker(){`showPicker`in HTMLInputElement.prototype&&this.input.showPicker()}stepUp(){this.input.stepUp(),this.value!==this.input.value&&(this.value=this.input.value)}stepDown(){this.input.stepDown(),this.value!==this.input.value&&(this.value=this.input.value)}formResetCallback(){this.value=null,this.input&&(this.input.value=this.value),super.formResetCallback()}render(){let e=this.hasSlotController.test(`label`,`withLabel`),t=this.hasSlotController.test(`hint`,`withHint`),n=this.label?!0:!!e,r=this.hint?!0:!!t,i=this.withClear&&!this.disabled&&!this.readonly,a=(!this.didSSR||this.hasUpdated)&&i&&(typeof this.value==`number`||this.value&&this.value.length>0);return j`
      <label
        part="form-control-label label"
        class=${K({label:!0,"has-label":n})}
        for="input"
        aria-hidden=${n?`false`:`true`}
      >
        <slot name="label">${this.label}</slot>
      </label>

      <div part="base input-wrapper" class="text-field">
        <slot name="start" part="start" class="start"></slot>

        <input
          part="input"
          id="input"
          class="control"
          type=${this.type===`password`&&this.passwordVisible?`text`:this.type}
          title=${this.title}
          name=${q(this.name)}
          ?disabled=${this.disabled}
          ?readonly=${this.readonly}
          ?required=${this.required}
          placeholder=${q(this.placeholder)}
          minlength=${q(this.minlength)}
          maxlength=${q(this.maxlength)}
          min=${q(this.min)}
          max=${q(this.max)}
          step=${q(this.step)}
          .value=${Xn(this.value??``)}
          autocapitalize=${q(this.autocapitalize)}
          autocomplete=${q(this.autocomplete)}
          autocorrect=${this.autocorrect?`on`:`off`}
          ?autofocus=${this.autofocus}
          spellcheck=${this.spellcheck}
          pattern=${q(this.pattern)}
          enterkeyhint=${q(this.enterkeyhint)}
          inputmode=${q(this.inputmode)}
          aria-describedby="hint"
          @change=${this.handleChange}
          @input=${this.handleInput}
          @keydown=${this.handleKeyDown}
        />

        ${a?j`
              <button
                part="clear-button"
                class="clear"
                type="button"
                aria-label=${this.localize.term(`clearEntry`)}
                @click=${this.handleClearClick}
                tabindex="-1"
              >
                <slot name="clear-icon">
                  <wa-icon name="circle-xmark" library="system" variant="regular"></wa-icon>
                </slot>
              </button>
            `:``}
        ${this.passwordToggle&&!this.disabled?j`
              <button
                part="password-toggle-button"
                class="password-toggle"
                type="button"
                aria-label=${this.localize.term(this.passwordVisible?`hidePassword`:`showPassword`)}
                @click=${this.handlePasswordToggle}
              >
                ${this.passwordVisible?j`
                      <slot name="hide-password-icon">
                        <wa-icon name="eye-slash" library="system" variant="regular"></wa-icon>
                      </slot>
                    `:j`
                      <slot name="show-password-icon">
                        <wa-icon name="eye" library="system" variant="regular"></wa-icon>
                      </slot>
                    `}
              </button>
            `:``}

        <slot name="end" part="end" class="end"></slot>
      </div>

      <slot
        id="hint"
        part="hint"
        name="hint"
        class=${K({"has-slotted":r})}
        aria-hidden=${r?`false`:`true`}
        >${this.hint}</slot
      >
    `}};X.css=[ft,Yn,Jn],X.shadowRootOptions={...st.shadowRootOptions,delegatesFocus:!0},F([B(`input`)],X.prototype,`input`,2),F([R()],X.prototype,`title`,2),F([R({reflect:!0})],X.prototype,`type`,2),F([z()],X.prototype,`value`,1),F([R({attribute:`value`,reflect:!0})],X.prototype,`defaultValue`,2),F([R({reflect:!0})],X.prototype,`size`,2),F([U(`size`)],X.prototype,`handleSizeChange`,1),F([R({reflect:!0})],X.prototype,`appearance`,2),F([R({type:Boolean,reflect:!0})],X.prototype,`pill`,2),F([R()],X.prototype,`label`,2),F([R({attribute:`hint`})],X.prototype,`hint`,2),F([R({attribute:`with-clear`,type:Boolean})],X.prototype,`withClear`,2),F([R()],X.prototype,`placeholder`,2),F([R({type:Boolean,reflect:!0})],X.prototype,`readonly`,2),F([R({attribute:`password-toggle`,type:Boolean})],X.prototype,`passwordToggle`,2),F([R({attribute:`password-visible`,type:Boolean})],X.prototype,`passwordVisible`,2),F([R({attribute:`without-spin-buttons`,type:Boolean,reflect:!0})],X.prototype,`withoutSpinButtons`,2),F([R({type:Boolean,reflect:!0})],X.prototype,`required`,2),F([R()],X.prototype,`pattern`,2),F([R({type:Number})],X.prototype,`minlength`,2),F([R({type:Number})],X.prototype,`maxlength`,2),F([R()],X.prototype,`min`,2),F([R()],X.prototype,`max`,2),F([R()],X.prototype,`step`,2),F([R()],X.prototype,`autocapitalize`,2),F([R({type:Boolean,converter:{fromAttribute:e=>!(!e||e===`off`),toAttribute:e=>e?`on`:`off`}})],X.prototype,`autocorrect`,2),F([R()],X.prototype,`autocomplete`,2),F([R({type:Boolean})],X.prototype,`autofocus`,2),F([R()],X.prototype,`enterkeyhint`,2),F([R({type:Boolean,converter:{fromAttribute:e=>!(!e||e===`false`),toAttribute:e=>e?`true`:`false`}})],X.prototype,`spellcheck`,2),F([R()],X.prototype,`inputmode`,2),F([R({attribute:`with-label`,type:Boolean})],X.prototype,`withLabel`,2),F([R({attribute:`with-hint`,type:Boolean})],X.prototype,`withHint`,2),F([U(`step`,{waitUntilFirstUpdate:!0})],X.prototype,`handleStepChange`,1),X=F([I(`wa-input`)],X),X.disableWarning?.(`change-in-update`);var Zn=h`
  :host {
    --current-text-color: var(--wa-color-brand-on-loud);

    display: block;
    color: var(--wa-color-text-normal);
    -webkit-user-select: none;
    user-select: none;

    position: relative;
    display: flex;
    align-items: center;
    font: inherit;
    padding: 0.5em 1em 0.5em 0.25em;
    border-radius: var(--wa-border-radius-s);
    line-height: var(--wa-line-height-condensed);
    transition: var(--wa-transition-fast) background-color var(--wa-transition-easing);
    cursor: pointer;
  }

  :host(:focus) {
    outline: none;
  }

  @media (hover: hover) {
    :host(:not(:state(disabled), :state(current)):is(:state(hover), :hover)) {
      background-color: var(--wa-color-neutral-fill-normal);
      color: var(--wa-color-neutral-on-normal);
    }
  }

  :host(:state(current)),
  :host(:state(disabled):state(current)) {
    background-color: var(--wa-form-control-activated-color);
    color: var(--current-text-color);
    opacity: 1;
  }

  :host(:state(disabled)) {
    outline: none;
    opacity: 0.5;
    cursor: not-allowed;
  }

  .label {
    flex: 1 1 auto;
    display: inline-block;
  }

  .check {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: var(--wa-font-size-smaller);
    visibility: hidden;
    width: 2em;
  }

  :host(:state(selected)) .check {
    visibility: visible;
  }

  .start,
  .end {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
  }

  .start::slotted(*) {
    margin-inline-end: 0.5em;
  }

  .end::slotted(*) {
    margin-inline-start: 0.5em;
  }

  @media (forced-colors: active) {
    :host(:hover:not([aria-disabled='true'])) {
      outline: dashed 1px SelectedItem;
      outline-offset: -1px;
    }
  }
`;function Qn(e,t=0){if(!e||!globalThis.Node)return``;if(typeof e[Symbol.iterator]==`function`)return(Array.isArray(e)?e:[...e]).map(e=>Qn(e,--t)).join(``);let n=e;if(n.nodeType===Node.TEXT_NODE)return n.textContent??``;if(n.nodeType===Node.ELEMENT_NODE){let e=n;if(e.hasAttribute(`slot`)||e.matches(`style, script`))return``;if(e instanceof HTMLSlotElement){let n=e.assignedNodes({flatten:!0});if(n.length>0)return Qn(n,--t)}return t>-1?Qn(e,--t):e.textContent??``}return n.hasChildNodes()?Qn(n.childNodes,--t):``}var $n=class extends V{constructor(){super(...arguments),this.localize=new Ct(this),this.cachedDefaultLabel=``,this.isInitialized=!1,this.isDefaultLabelDirty=!0,this.current=!1,this.value=``,this.disabled=!1,this.selected=!1,this.defaultSelected=!1,this._label=``,this.handleHover=e=>{e.type===`mouseenter`?this.customStates.set(`hover`,!0):e.type===`mouseleave`&&this.customStates.set(`hover`,!1)}}set label(e){let t=this._label;this._label=e||``,this._label!==t&&this.requestUpdate(`label`,t)}get label(){return this._label?this._label:this.defaultLabel}get defaultLabel(){return(this.isDefaultLabelDirty||!this.cachedDefaultLabel)&&this.updateDefaultLabel(),this.cachedDefaultLabel}connectedCallback(){super.connectedCallback(),this.setAttribute(`role`,`option`),this.setAttribute(`aria-selected`,`false`),this.addEventListener(`mouseenter`,this.handleHover),this.addEventListener(`mouseleave`,this.handleHover)}disconnectedCallback(){super.disconnectedCallback(),this.removeEventListener(`mouseenter`,this.handleHover),this.removeEventListener(`mouseleave`,this.handleHover)}handleDefaultSlotChange(){this.isDefaultLabelDirty=!0,this.isInitialized?(customElements.whenDefined(`wa-select`).then(()=>{let e=this.closest(`wa-select`);e&&e.handleDefaultSlotChange?.()}),customElements.whenDefined(`wa-combobox`).then(()=>{let e=this.closest(`wa-combobox`);e&&e.handleDefaultSlotChange?.()})):this.isInitialized=!0}willUpdate(e){e.has(`defaultSelected`)&&(this.didSSR&&this.hasUpdated||!this.didSSR)&&this.syncDefaultSelected(),super.willUpdate(e)}syncDefaultSelected(){if(`closest`in this&&!this.closest(`wa-combobox, wa-select`)?.hasInteracted&&this.defaultSelected){let e=this.selected;this.selected=this.defaultSelected,this.requestUpdate(`selected`,e)}}updated(e){e.has(`disabled`)&&(this.setAttribute(`aria-disabled`,this.disabled?`true`:`false`),this.customStates.set(`disabled`,this.disabled)),e.has(`selected`)&&(this.setAttribute(`aria-selected`,this.selected?`true`:`false`),this.customStates.set(`selected`,this.selected)),e.has(`value`)&&(typeof this.value!=`string`&&(this.value=String(this.value)),this.handleDefaultSlotChange()),e.has(`current`)&&this.customStates.set(`current`,this.current),super.updated(e)}async firstUpdated(e){if(super.firstUpdated(e),this.didSSR&&!this.hasUpdated&&await this.updateComplete,this.syncDefaultSelected(),this.selected&&!this.defaultSelected){let e=this.closest(`wa-select, wa-combobox`);e&&!e.hasInteracted&&(await customElements.whenDefined(e?.localName),await e.updateComplete,e.selectionChanged?.())}}updateDefaultLabel(){let e=this.cachedDefaultLabel;this.cachedDefaultLabel=Qn(this).trim(),this.isDefaultLabelDirty=!1;let t=this.cachedDefaultLabel!==e;return!this._label&&t&&this.requestUpdate(`label`,e),t}render(){let e=this.selected;return this.didSSR&&!this.hasUpdated?(this.updateComplete.then(()=>{this.requestUpdate()}),M):j`
      ${e?j`<wa-icon
            part="checked-icon"
            class="check"
            name="check"
            library="system"
            variant="solid"
            aria-hidden="true"
          ></wa-icon>`:j`<span part="checked-icon" class="check" aria-hidden="true"></span>`}
      <slot part="start" name="start" class="start"></slot>
      <slot part="label" class="label" @slotchange=${this.handleDefaultSlotChange}></slot>
      <slot part="end" name="end" class="end"></slot>
    `}};$n.css=Zn,F([B(`.label`)],$n.prototype,`defaultSlot`,2),F([z()],$n.prototype,`current`,2),F([R({reflect:!0})],$n.prototype,`value`,2),F([R({type:Boolean})],$n.prototype,`disabled`,2),F([R({type:Boolean,attribute:!1})],$n.prototype,`selected`,2),F([R({type:Boolean,attribute:`selected`})],$n.prototype,`defaultSelected`,2),F([R()],$n.prototype,`label`,1),$n=F([I(`wa-option`)],$n);var er=h`
  :host {
    --tag-max-size: 10ch;
    --show-duration: var(--wa-transition-fast);
    --hide-duration: var(--wa-transition-fast);
  }

  /* Add ellipses to multi select options */
  :host wa-tag::part(content) {
    display: initial;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
    max-width: var(--tag-max-size);
  }

  :host .disabled [part~='combobox'] {
    opacity: 0.5;
    cursor: not-allowed;
    outline: none;
  }

  :host .enabled:is(.open, :focus-within) [part~='combobox'] {
    outline-color: var(--wa-color-focus);
  }

  /** The popup */
  .select {
    flex: 1 1 auto;
    display: inline-flex;
    width: 100%;
    position: relative;
    vertical-align: middle;

    /* Pass through from select to the popup */
    --show-duration: inherit;
    --hide-duration: inherit;

    &::part(popup) {
      z-index: 900;
    }

    &[data-current-placement^='top']::part(popup) {
      transform-origin: bottom;
    }

    &[data-current-placement^='bottom']::part(popup) {
      transform-origin: top;
    }
  }

  /* Combobox */
  .combobox {
    flex: 1;
    display: flex;
    width: 100%;
    min-width: 0;
    align-items: center;
    justify-content: start;

    min-height: var(--wa-form-control-height);

    background-color: var(--wa-form-control-background-color);
    border-color: var(--wa-form-control-border-color);
    border-radius: var(--wa-form-control-border-radius);
    border-style: var(--wa-form-control-border-style);
    border-width: var(--wa-form-control-border-width);
    color: var(--wa-form-control-value-color);
    cursor: pointer;
    font-family: inherit;
    font-weight: var(--wa-form-control-value-font-weight);
    line-height: var(--wa-form-control-value-line-height);
    overflow: hidden;
    padding: 0 var(--wa-form-control-padding-inline);
    position: relative;
    vertical-align: middle;
    transition:
      background-color var(--wa-transition-normal),
      border-color var(--wa-transition-normal),
      outline-color var(--wa-transition-fast);
    transition-timing-function: var(--wa-transition-easing);
    outline: var(--wa-focus-ring-style) var(--wa-focus-ring-width) transparent;
    outline-offset: var(--wa-focus-ring-offset);

    /* Pills */
    :host([pill]) & {
      border-radius: var(--wa-border-radius-pill);
    }
  }

  /* Appearance modifiers */
  :host([appearance='outlined']) .combobox {
    background-color: var(--wa-form-control-background-color);
    border-color: var(--wa-form-control-border-color);
  }

  :host([appearance='filled']) .combobox {
    background-color: var(--wa-color-neutral-fill-quiet);
    border-color: var(--wa-color-neutral-fill-quiet);
  }

  :host([appearance='filled-outlined']) .combobox {
    background-color: var(--wa-color-neutral-fill-quiet);
    border-color: var(--wa-form-control-border-color);
  }

  .display-input {
    position: relative;
    width: 100%;
    font: inherit;
    border: none;
    background: none;
    line-height: var(--wa-form-control-value-line-height);
    color: var(--wa-form-control-value-color);
    cursor: inherit;
    overflow: hidden;
    padding: 0;
    margin: 0;
    -webkit-appearance: none;

    &:focus {
      outline: none;
    }

    &::placeholder {
      color: var(--wa-form-control-placeholder-color);
    }
  }

  /* Manage spacing when tags are present */
  :host([multiple]) {
    --_padding-with-tags: calc(var(--wa-form-control-height) * 0.1 - var(--wa-form-control-border-width));

    & .combobox:has(.tags wa-tag) {
      padding-block: var(--_padding-with-tags);
      padding-inline-start: var(--_padding-with-tags);
    }
  }

  /* Visually hide the display input when multiple is enabled */
  :host([multiple]) .combobox:has(.tags wa-tag) .display-input {
    position: absolute;
    z-index: -1;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
  }

  .value-input {
    position: absolute;
    z-index: -1;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    padding: 0;
    margin: 0;
  }

  .tags {
    display: flex;
    flex: 1;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.25em;

    /* Nested inside the box, so a step down from the box's radius */
    & wa-tag:not([pill]) {
      border-radius: var(--wa-border-radius-s);
    }

    .disabled & {
      cursor: not-allowed !important;
    }
  }

  /* Start and End */

  .start,
  .end {
    flex: 0;
    display: inline-flex;
    align-items: center;
    color: var(--wa-color-neutral-on-quiet);
  }

  .end::slotted(*) {
    margin-inline-start: var(--wa-form-control-padding-inline);
  }

  .start::slotted(*) {
    margin-inline-end: var(--wa-form-control-padding-inline);
  }

  :host([multiple]) .combobox:has(.tags wa-tag) .start::slotted(*) {
    margin-inline-start: calc(var(--wa-form-control-padding-inline) - var(--_padding-with-tags));
  }

  /* Clear button */
  [part~='clear-button'] {
    flex: 0 0 auto;
    display: inline-flex;
    align-self: stretch;
    align-items: center;
    justify-content: center;
    inline-size: 1.5em;
    font-size: inherit;
    color: var(--wa-color-neutral-on-quiet);
    border: none;
    background: none;
    padding: 0;
    transition: color var(--wa-transition-normal);
    cursor: pointer;
    /* The box is wider than the glyph, so overhang half that growth on each side. Keeps the glyph
       on the same trailing axis as the segmented-field pickers' clear buttons. */
    margin-inline-start: calc(var(--wa-form-control-padding-inline) - 0.125em);
    margin-inline-end: -0.125em;

    &:focus {
      outline: none;
    }

    @media (hover: hover) {
      &:hover {
        color: color-mix(in oklab, currentColor, var(--wa-color-mix-hover));
      }
    }

    &:active {
      color: color-mix(in oklab, currentColor, var(--wa-color-mix-active));
    }
  }

  /* Expand icon */
  .expand-icon {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    color: var(--wa-color-neutral-on-quiet);
    transition: rotate var(--wa-transition-slow) var(--wa-transition-easing);
    rotate: 0deg;
    margin-inline-start: var(--wa-form-control-padding-inline);

    .open & {
      rotate: -180deg;
    }
  }

  /* Listbox */
  .listbox {
    display: block;
    position: relative;
    font: inherit;
    box-shadow: var(--wa-shadow-m);
    background: var(--wa-color-surface-raised);
    border-color: var(--wa-color-surface-border);
    border-radius: var(--wa-border-radius-m);
    border-style: var(--wa-border-style);
    border-width: var(--wa-border-width-s);
    padding: 0.25em;
    overflow: auto;
    overscroll-behavior: none;

    /* Make sure it adheres to the popup's auto size */
    max-width: var(--auto-size-available-width);
    max-height: var(--auto-size-available-height);

    &::slotted(wa-divider) {
      --spacing: 0.5em;
    }
  }

  /* Space options with half the listbox's padding */
  .listbox slot:not([name]) {
    display: flex;
    flex-direction: column;
    gap: 0.125em;
  }

  slot:not([name])::slotted(small) {
    display: block;
    font-size: var(--wa-font-size-smaller);
    font-weight: var(--wa-font-weight-semibold);
    color: var(--wa-color-text-quiet);
    padding-block: 0.5em;
    padding-inline: 2.25em;
  }
`,tr=(e={})=>{let{validationElement:t,validationProperty:n}=e;t||typeof document<`u`&&`createElement`in document&&(t=Object.assign(document.createElement(`input`),{required:!0})),n||=`value`;let r={observedAttributes:[`required`],message:t?.validationMessage,checkValidity(e){let t={message:``,isValid:!0,invalidKeys:[]};return(e.required??e.hasAttribute(`required`))&&(e[n]||(t.message=typeof r.message==`function`?r.message(e):r.message||``,t.isValid=!1,t.invalidKeys.push(`valueMissing`))),t}};return r};function nr(e,t){return new Promise(n=>{function r(i){i.target===e&&(e.removeEventListener(t,r),n())}e.addEventListener(t,r)})}var rr=class extends Tt{constructor(e){if(super(e),this.it=M,e.type!==G.CHILD)throw Error(this.constructor.directiveName+`() can only be used in child bindings`)}render(e){if(e===M||e==null)return this._t=void 0,this.it=e;if(e===Ce)return e;if(typeof e!=`string`)throw Error(this.constructor.directiveName+`() called with a non-string value`);if(e===this.it)return this._t;this.it=e;let t=[e];return t.raw=t,this._t={_$litType$:this.constructor.resultType,strings:t,values:[]}}};rr.directiveName=`unsafeHTML`,rr.resultType=1;var ir=wt(rr),Z=class extends st{constructor(){super(...arguments),this.assumeInteractionOn=[`blur`,`input`],this.cachedOptions=null,this.hasSlotController=new H(this,`hint`,`label`),this.localize=new Ct(this),this.selectionOrder=new Map,this.typeToSelectString=``,this.slotChangePending=!1,this.displayLabel=``,this.selectedOptions=[],this.name=``,this._defaultValue=null,this.size=`m`,this.placeholder=``,this.multiple=!1,this.maxOptionsVisible=3,this.disabled=!1,this.withClear=!1,this.open=!1,this.appearance=`outlined`,this.pill=!1,this.label=``,this.placement=`bottom`,this.hint=``,this.withLabel=!1,this.withHint=!1,this.required=!1,this.getTag=e=>j`
        <wa-tag
          part="tag"
          exportparts="
            base:tag__base,
            content:tag__content,
            remove-button:tag__remove-button,
            remove-button__base:tag__remove-button__base
          "
          ?pill=${this.pill}
          size=${this.size}
          with-remove
          data-value=${e.value}
          @wa-remove=${t=>this.handleTagRemove(t,e)}
        >
          ${e.label}
        </wa-tag>
      `,this.handleDocumentFocusIn=e=>{let t=e.composedPath();this&&!t.includes(this)&&this.hide()},this.handleDocumentKeyDown=e=>{let t=e.target,n=t.closest(`[part~="clear-button"]`)!==null,r=t.closest(`wa-button`)!==null;if(!(n||r)){if(e.key===`Escape`&&this.open&&Rn(this)&&(e.preventDefault(),e.stopPropagation(),this.hide(),this.displayInput.focus({preventScroll:!0})),e.key===`Enter`||e.key===` `&&this.typeToSelectString===``){if(e.preventDefault(),e.stopImmediatePropagation(),!this.open){this.show();return}this.currentOption&&!this.currentOption.disabled&&(this.valueHasChanged=!0,this.hasInteracted=!0,this.multiple?this.toggleOptionSelection(this.currentOption):this.setSelectedOptions(this.currentOption),this.updateComplete.then(()=>{this.dispatchEvent(new InputEvent(`input`,{bubbles:!0,composed:!0})),this.dispatchEvent(new Event(`change`,{bubbles:!0,composed:!0}))}),this.multiple||(this.hide(),this.displayInput.focus({preventScroll:!0})));return}if([`ArrowUp`,`ArrowDown`,`Home`,`End`].includes(e.key)){let t=this.getAllOptions(),n=t.indexOf(this.currentOption),r=Math.max(0,n);if(e.preventDefault(),!this.open&&(this.show(),this.currentOption))return;e.key===`ArrowDown`?(r=n+1,r>t.length-1&&(r=0)):e.key===`ArrowUp`?(r=n-1,r<0&&(r=t.length-1)):e.key===`Home`?r=0:e.key===`End`&&(r=t.length-1),this.setCurrentOption(t[r])}if(e.key?.length===1||e.key===`Backspace`){let t=this.getAllOptions();if(e.metaKey||e.ctrlKey||e.altKey)return;if(!this.open){if(e.key===`Backspace`)return;this.show()}e.stopPropagation(),e.preventDefault(),clearTimeout(this.typeToSelectTimeout),this.typeToSelectTimeout=window.setTimeout(()=>this.typeToSelectString=``,1e3),e.key===`Backspace`?this.typeToSelectString=this.typeToSelectString.slice(0,-1):this.typeToSelectString+=e.key.toLowerCase();for(let e of t)if(e.label.toLowerCase().startsWith(this.typeToSelectString)){this.setCurrentOption(e);break}}}},this.handleDocumentMouseDown=e=>{let t=e.composedPath();this&&!t.includes(this)&&this.hide()}}static get validators(){let e=[tr({validationElement:Object.assign(document.createElement(`select`),{required:!0})})];return[...super.validators,...e]}get validationTarget(){return this.valueInput}set defaultValue(e){this._defaultValue=this.convertDefaultValue(e)}get defaultValue(){return this.convertDefaultValue(this._defaultValue)}rawValuesEqual(e,t){return e==null&&t==null?!0:e==null||t==null||e.length!==t.length?!1:e.every((e,n)=>e===t[n])}convertDefaultValue(e){return!(this.multiple||this.hasAttribute(`multiple`))&&Array.isArray(e)&&(e=e[0]),e}set value(e){let t=this.value;e instanceof FormData&&(e=e.getAll(this.name)),e!=null&&!Array.isArray(e)&&(e=[e]);let n=this._value;this._value=e??null,this.rawValuesEqual(n,this._value)||(this.valueHasChanged=!0,this.requestUpdate(`value`,t))}get value(){let e=this._value??this.defaultValue??null;e!=null&&(e=Array.isArray(e)?e:[e]),this.optionValues=new Set(this.getAllOptions().filter(e=>!e.disabled).map(e=>e.value));let t=e;return e!=null&&(t=e.filter(e=>this.optionValues.has(e)),t=this.multiple?t:t[0],t??=null),t}handleSizeChange(){dt(this.localName,this.size)}connectedCallback(){super.connectedCallback(),this.processSlotChange(),this.open=!1}disconnectedCallback(){super.disconnectedCallback(),this.removeOpenListeners(),this.cachedOptions=null}updateDefaultValue(){let e=this.getAllOptions().filter(e=>e.hasAttribute(`selected`)||e.defaultSelected);if(e.length>0){let t=e.map(e=>e.value);this._defaultValue=this.multiple?t:t[0]}this.hasAttribute(`value`)&&(this._defaultValue=this.getAttribute(`value`)||null)}addOpenListeners(){document.addEventListener(`focusin`,this.handleDocumentFocusIn),document.addEventListener(`keydown`,this.handleDocumentKeyDown),document.addEventListener(`mousedown`,this.handleDocumentMouseDown),In(this),this.getRootNode()!==document&&this.getRootNode().addEventListener(`focusin`,this.handleDocumentFocusIn)}removeOpenListeners(){document.removeEventListener(`focusin`,this.handleDocumentFocusIn),document.removeEventListener(`keydown`,this.handleDocumentKeyDown),document.removeEventListener(`mousedown`,this.handleDocumentMouseDown),Ln(this),this.getRootNode()!==document&&this.getRootNode().removeEventListener(`focusin`,this.handleDocumentFocusIn)}handleFocus(){this.displayInput.setSelectionRange(0,0)}handleLabelClick(){this.displayInput.focus()}handleComboboxClick(e){e.preventDefault()}handleComboboxMouseDown(e){let t=e.composedPath().some(e=>e instanceof Element&&e.tagName.toLowerCase()===`wa-button`);this.disabled||t||(e.preventDefault(),this.displayInput.focus({preventScroll:!0}),this.open=!this.open)}handleComboboxKeyDown(e){e.stopPropagation(),this.handleDocumentKeyDown(e)}handleClearClick(e){e.stopPropagation(),this.hasInteracted=!0,this.valueHasChanged=!0,this.value!==null&&(this.displayLabel=``,this.selectionOrder.clear(),this.setSelectedOptions([]),this.displayInput.focus({preventScroll:!0}),this.updateComplete.then(()=>{this.dispatchEvent(new Gn),this.dispatchEvent(new InputEvent(`input`,{bubbles:!0,composed:!0})),this.dispatchEvent(new Event(`change`,{bubbles:!0,composed:!0}))}))}handleClearMouseDown(e){e.stopPropagation(),e.preventDefault()}handleOptionClick(e){let t=e.target.closest(`wa-option`);t&&!t.disabled&&(this.hasInteracted=!0,this.valueHasChanged=!0,this.multiple?this.toggleOptionSelection(t):this.setSelectedOptions(t),this.updateComplete.then(()=>this.displayInput.focus({preventScroll:!0})),this.requestUpdate(`value`),this.updateComplete.then(()=>{this.dispatchEvent(new InputEvent(`input`,{bubbles:!0,composed:!0})),this.dispatchEvent(new Event(`change`,{bubbles:!0,composed:!0}))}),this.multiple||(this.hide(),this.displayInput.focus({preventScroll:!0})))}handleDefaultSlotChange(){this.slotChangePending||(this.slotChangePending=!0,queueMicrotask(()=>{this.slotChangePending=!1,this.processSlotChange()}))}processSlotChange(){if(customElements.get(`wa-option`)||customElements.whenDefined(`wa-option`).then(()=>this.handleDefaultSlotChange()),this.didSSR&&!this.hasUpdated){this.updateComplete.then(()=>{this.handleDefaultSlotChange()});return}this.cachedOptions=null;let e=this.getAllOptions();this.updateDefaultValue();let t=this.value;if(t==null||!this.valueHasChanged&&!this.hasInteracted){this.selectionChanged();return}Array.isArray(t)||(t=[t]);let n=e.filter(e=>t.includes(e.value));this.setSelectedOptions(n)}handleTagRemove(e,t){if(e.stopPropagation(),this.disabled)return;this.hasInteracted=!0,this.valueHasChanged=!0;let n=t;if(!n){let t=e.target.closest(`wa-tag[data-value]`);if(t){let e=t.dataset.value;n=this.selectedOptions.find(t=>t.value===e)}}n&&(this.toggleOptionSelection(n,!1),this.updateComplete.then(()=>{this.dispatchEvent(new InputEvent(`input`,{bubbles:!0,composed:!0})),this.dispatchEvent(new Event(`change`,{bubbles:!0,composed:!0}))}))}getAllOptions(){return this.cachedOptions?this.cachedOptions:this?.querySelectorAll?(this.cachedOptions=[...this.querySelectorAll(`wa-option`)],this.cachedOptions):[]}getFirstOption(){return this.querySelector(`wa-option`)}setCurrentOption(e){this.getAllOptions().forEach(e=>{e.current=!1,e.tabIndex=-1}),e&&(this.currentOption=e,e.current=!0,e.tabIndex=0,e.focus({preventScroll:!0}),this.open&&!this.listbox.hidden&&On(e,this.listbox,`vertical`,`auto`))}setSelectedOptions(e){let t=this.getAllOptions(),n=Array.isArray(e)?e:[e];t.forEach(e=>{n.includes(e)||(e.selected=!1)}),n.length&&n.forEach(e=>e.selected=!0),this.selectionChanged()}toggleOptionSelection(e,t){e.selected=t===!0||t===!1?t:!e.selected,this.selectionChanged()}selectionChanged(){let e=this.getAllOptions().filter(e=>{if(!this.hasInteracted&&!this.valueHasChanged){let t=this.defaultValue,n=Array.isArray(t)?t:[t];return e.hasAttribute(`selected`)||e.defaultSelected||e.selected||n?.includes(e.value)}return e.selected}),t=new Set(e.map(e=>e.value));for(let e of this.selectionOrder.keys())t.has(e)||this.selectionOrder.delete(e);let n=(this.selectionOrder.size>0?Math.max(...this.selectionOrder.values()):-1)+1;for(let t of e)this.selectionOrder.has(t.value)||this.selectionOrder.set(t.value,n++);this.selectedOptions=e.sort((e,t)=>(this.selectionOrder.get(e.value)??0)-(this.selectionOrder.get(t.value)??0));let r=new Set(this.selectedOptions.map(e=>e.value));if(r.size>0||this._value){let e=this._value;if(this._value==null){let e=this.defaultValue??[];this._value=Array.isArray(e)?e:[e]}this._value=this._value?.filter(e=>!this.optionValues?.has(e))??null,this._value?.unshift(...r),this.requestUpdate(`value`,e)}if(this.multiple)this.displayLabel=this.placeholder&&!this.value?.length?``:this.localize.term(`numOptionsSelected`,this.selectedOptions.length);else{let e=this.selectedOptions[0];this.displayLabel=e?.label??``}this.updateComplete.then(()=>{this.updateValidity()})}get tags(){return this.selectedOptions.map((e,t)=>{if(t<this.maxOptionsVisible||this.maxOptionsVisible<=0){let n=this.getTag(e,t);return n?typeof n==`string`?ir(n):n:null}return t===this.maxOptionsVisible?j`
          <wa-tag
            part="tag"
            exportparts="
              base:tag__base,
              content:tag__content,
              remove-button:tag__remove-button,
              remove-button__base:tag__remove-button__base
            "
            ?pill=${this.pill}
            size=${this.size}
            >+${this.selectedOptions.length-t}</wa-tag
          >
        `:null})}updated(e){super.updated(e),(e.has(`value`)||e.has(`displayLabel`))&&this.customStates.set(`blank`,!this.value&&!this.displayLabel)}handleDisabledChange(){this.disabled&&this.open&&(this.open=!1)}handleValueChange(){let e=this.getAllOptions(),t=Array.isArray(this.value)?this.value:[this.value],n=e.filter(e=>t.includes(e.value));this.setSelectedOptions(n),this.updateValidity()}async handleOpenChange(){if(this.open&&!this.disabled){this.setCurrentOption(this.selectedOptions[0]||this.getFirstOption());let e=new An;if(this.dispatchEvent(e),e.defaultPrevented){this.open=!1;return}this.addOpenListeners(),this.listbox.hidden=!1,this.popup.active=!0,requestAnimationFrame(()=>{this.setCurrentOption(this.currentOption)}),await Bn(this.popup.popup,`show`),this.currentOption&&On(this.currentOption,this.listbox,`vertical`,`auto`),this.dispatchEvent(new Nn)}else{let e=new jn;if(this.dispatchEvent(e),e.defaultPrevented){this.open=!1;return}this.removeOpenListeners(),await Bn(this.popup.popup,`hide`),this.listbox.hidden=!0,this.popup.active=!1,this.dispatchEvent(new Mn)}}async show(){if(this.open||this.disabled){this.open=!1;return}return this.open=!0,nr(this,`wa-after-show`)}async hide(){if(!this.open||this.disabled){this.open=!1;return}return this.open=!1,nr(this,`wa-after-hide`)}focus(e){this.displayInput.focus(e)}blur(){this.displayInput.blur()}formResetCallback(){this.selectionOrder.clear(),this.value=this.defaultValue,super.formResetCallback(),this.handleValueChange(),this.updateComplete.then(()=>{this.dispatchEvent(new InputEvent(`input`,{bubbles:!0,composed:!0})),this.dispatchEvent(new Event(`change`,{bubbles:!0,composed:!0}))})}render(){let e=this.hasSlotController.test(`label`,`withLabel`),t=this.hasSlotController.test(`hint`,`withHint`),n=this.label?!0:!!e,r=this.hint?!0:!!t,i=(this.hasUpdated||!1)&&this.withClear&&!this.disabled&&(this.displayLabel||this.value&&this.value.length>0);return j`
      <div
        part="form-control"
        class=${K({"form-control":!0,"form-control-has-label":n})}
      >
        <label
          id="label"
          part="form-control-label label"
          class=${K({label:!0,"has-label":n})}
          aria-hidden=${n?`false`:`true`}
          @click=${this.handleLabelClick}
        >
          <slot name="label">${this.label}</slot>
        </label>

        <div part="form-control-input" class="form-control-input">
          <wa-popup
            class=${K({select:!0,open:this.open,disabled:this.disabled,enabled:!this.disabled,multiple:this.multiple})}
            placement=${this.placement}
            flip
            shift
            sync="width"
            auto-size="vertical"
            auto-size-padding="10"
          >
            <div
              part="combobox"
              class="combobox"
              slot="anchor"
              @keydown=${this.handleComboboxKeyDown}
              @mousedown=${this.handleComboboxMouseDown}
              @click=${this.handleComboboxClick}
            >
              <slot part="start" name="start" class="start"></slot>

              <input
                part="display-input"
                class="display-input"
                type="text"
                placeholder=${this.placeholder}
                .disabled=${this.disabled}
                .value=${this.displayLabel}
                ?required=${this.required}
                autocomplete="off"
                spellcheck="false"
                autocapitalize="off"
                readonly
                aria-invalid=${!this.validity.valid}
                aria-controls="listbox"
                aria-expanded=${this.open?`true`:`false`}
                aria-haspopup="listbox"
                aria-labelledby="label"
                aria-disabled=${this.disabled?`true`:`false`}
                aria-describedby="hint"
                role="combobox"
                tabindex="0"
                @focus=${this.handleFocus}
              />

              <!-- Tags need to wait for first hydration before populating otherwise it will create a hydration mismatch. -->
              ${this.multiple&&this.hasUpdated?j`<div part="tags" class="tags" @wa-remove=${this.handleTagRemove}>${this.tags}</div>`:``}

              <input
                class="value-input"
                type="text"
                ?disabled=${this.disabled}
                ?required=${this.required}
                .value=${Array.isArray(this.value)?this.value.join(`, `):this.value}
                tabindex="-1"
                aria-hidden="true"
                @focus=${()=>this.focus()}
              />

              ${i?j`
                    <button
                      part="clear-button"
                      type="button"
                      aria-label=${this.localize.term(`clearEntry`)}
                      @mousedown=${this.handleClearMouseDown}
                      @click=${this.handleClearClick}
                      tabindex="-1"
                    >
                      <slot name="clear-icon">
                        <wa-icon name="circle-xmark" library="system" variant="regular"></wa-icon>
                      </slot>
                    </button>
                  `:``}

              <slot name="end" part="end" class="end"></slot>

              <slot name="expand-icon" part="expand-icon" class="expand-icon">
                <wa-icon library="system" name="chevron-down" variant="solid"></wa-icon>
              </slot>
            </div>

            <div
              id="listbox"
              role="listbox"
              aria-expanded=${this.open?`true`:`false`}
              aria-multiselectable=${this.multiple?`true`:`false`}
              aria-labelledby="label"
              part="listbox"
              class="listbox"
              tabindex="-1"
              @mouseup=${this.handleOptionClick}
            >
              <slot @slotchange=${this.handleDefaultSlotChange}></slot>
            </div>
          </wa-popup>
        </div>

        <slot
          id="hint"
          name="hint"
          part="hint"
          class=${K({"has-slotted":r})}
          aria-hidden=${r?`false`:`true`}
          >${this.hint}</slot
        >
      </div>
    `}};Z.css=[er,Yn,ft],F([B(`.select`)],Z.prototype,`popup`,2),F([B(`.combobox`)],Z.prototype,`combobox`,2),F([B(`.display-input`)],Z.prototype,`displayInput`,2),F([B(`.value-input`)],Z.prototype,`valueInput`,2),F([B(`.listbox`)],Z.prototype,`listbox`,2),F([z()],Z.prototype,`displayLabel`,2),F([z()],Z.prototype,`currentOption`,2),F([z()],Z.prototype,`selectedOptions`,2),F([R({reflect:!0})],Z.prototype,`name`,2),F([R({attribute:!1})],Z.prototype,`defaultValue`,1),F([R({attribute:`value`,reflect:!1})],Z.prototype,`value`,1),F([R({reflect:!0})],Z.prototype,`size`,2),F([U(`size`)],Z.prototype,`handleSizeChange`,1),F([R()],Z.prototype,`placeholder`,2),F([R({type:Boolean,reflect:!0})],Z.prototype,`multiple`,2),F([R({attribute:`max-options-visible`,type:Number})],Z.prototype,`maxOptionsVisible`,2),F([R({type:Boolean})],Z.prototype,`disabled`,2),F([R({attribute:`with-clear`,type:Boolean})],Z.prototype,`withClear`,2),F([R({type:Boolean,reflect:!0})],Z.prototype,`open`,2),F([R({reflect:!0})],Z.prototype,`appearance`,2),F([R({type:Boolean,reflect:!0})],Z.prototype,`pill`,2),F([R()],Z.prototype,`label`,2),F([R({reflect:!0})],Z.prototype,`placement`,2),F([R({attribute:`hint`})],Z.prototype,`hint`,2),F([R({attribute:`with-label`,type:Boolean})],Z.prototype,`withLabel`,2),F([R({attribute:`with-hint`,type:Boolean})],Z.prototype,`withHint`,2),F([R({type:Boolean,reflect:!0})],Z.prototype,`required`,2),F([R({attribute:!1})],Z.prototype,`getTag`,2),F([U(`disabled`,{waitUntilFirstUpdate:!0})],Z.prototype,`handleDisabledChange`,1),F([U(`value`,{waitUntilFirstUpdate:!0})],Z.prototype,`handleValueChange`,1),F([U(`open`,{waitUntilFirstUpdate:!0})],Z.prototype,`handleOpenChange`,1),Z=F([I(`wa-select`)],Z),Z.disableWarning?.(`change-in-update`);var ar=class extends Event{constructor(){super(`wa-remove`,{bubbles:!0,cancelable:!1,composed:!0})}},or=h`
  @layer wa-component {
    :host {
      display: inline-flex;
      gap: 0.5em;
      border-radius: var(--wa-border-radius-m);
      align-items: center;
      background-color: var(--wa-color-fill-quiet, var(--wa-color-neutral-fill-quiet));
      border-color: var(--wa-color-border-normal, var(--wa-color-neutral-border-normal));
      border-style: var(--wa-border-style);
      border-width: var(--wa-border-width-s);
      color: var(--wa-color-on-quiet, var(--wa-color-neutral-on-quiet));
      font-size: inherit;
      line-height: 1;
      white-space: nowrap;
      user-select: none;
      -webkit-user-select: none;
      height: calc(var(--wa-form-control-height) * 0.8);
      line-height: calc(var(--wa-form-control-height) - var(--wa-form-control-border-width) * 2);
      padding: 0 0.75em;
    }

    /* Appearance modifiers */
    :host([appearance='outlined']) {
      color: var(--wa-color-on-quiet, var(--wa-color-neutral-on-quiet));
      background-color: transparent;
      border-color: var(--wa-color-border-loud, var(--wa-color-neutral-border-loud));
    }

    :host([appearance='filled']) {
      color: var(--wa-color-on-quiet, var(--wa-color-neutral-on-quiet));
      background-color: var(--wa-color-fill-quiet, var(--wa-color-neutral-fill-quiet));
      border-color: transparent;
    }

    :host([appearance='filled-outlined']) {
      color: var(--wa-color-on-quiet, var(--wa-color-neutral-on-quiet));
      background-color: var(--wa-color-fill-quiet, var(--wa-color-neutral-fill-quiet));
      border-color: var(--wa-color-border-normal, var(--wa-color-neutral-border-normal));
    }

    :host([appearance='accent']) {
      color: var(--wa-color-on-loud, var(--wa-color-neutral-on-loud));
      background-color: var(--wa-color-fill-loud, var(--wa-color-neutral-fill-loud));
      border-color: transparent;
    }
  }

  .content {
    font-size: var(--wa-font-size-smaller);
  }

  [part='remove-button'] {
    line-height: 1;
  }

  [part='remove-button']::part(base) {
    padding: 0;
    height: 1em;
    width: 1em;
    color: currentColor;
  }

  @media (hover: hover) {
    :host(:hover) > [part='remove-button']::part(base) {
      background-color: transparent;
      color: color-mix(in oklab, currentColor, var(--wa-color-mix-hover));
    }
  }

  :host(:active) > [part='remove-button']::part(base) {
    background-color: transparent;
    color: color-mix(in oklab, currentColor, var(--wa-color-mix-active));
  }

  /*
   * Pill modifier
   */
  :host([pill]) {
    border-radius: var(--wa-border-radius-pill);
  }
`,sr=class extends V{constructor(){super(...arguments),this.localize=new Ct(this),this.variant=`neutral`,this.appearance=`filled-outlined`,this.size=`m`,this.pill=!1,this.withRemove=!1}handleSizeChange(){dt(this.localName,this.size)}handleRemoveClick(){this.dispatchEvent(new ar)}render(){return j`
      <slot part="content" class="content"></slot>

      ${this.withRemove?j`
            <wa-button
              part="remove-button"
              exportparts="base:remove-button__base"
              class="remove"
              appearance="plain"
              size=${this.size}
              @click=${this.handleRemoveClick}
              tabindex="-1"
            >
              <wa-icon name="xmark" library="system" variant="solid" label=${this.localize.term(`remove`)}></wa-icon>
            </wa-button>
          `:``}
    `}};sr.css=[or,Ve,ft],F([R({reflect:!0})],sr.prototype,`variant`,2),F([R({reflect:!0})],sr.prototype,`appearance`,2),F([R({reflect:!0})],sr.prototype,`size`,2),F([U(`size`)],sr.prototype,`handleSizeChange`,1),F([R({type:Boolean,reflect:!0})],sr.prototype,`pill`,2),F([R({attribute:`with-remove`,type:Boolean})],sr.prototype,`withRemove`,2),sr=F([I(`wa-tag`)],sr);var cr=class extends Event{constructor(){super(`wa-reposition`,{bubbles:!0,cancelable:!1,composed:!0})}},lr=h`
  :host {
    --arrow-color: black;
    --arrow-size: var(--wa-tooltip-arrow-size);
    --popup-border-width: 0px;
    --show-duration: var(--wa-transition-fast);
    --hide-duration: var(--wa-transition-fast);

    /*
     * These properties are computed to account for the arrow's dimensions after being rotated 45º. The constant
     * 0.7071 is derived from sin(45) to calculate the length of the arrow after rotation.
     *
     * The diamond will be translated inward by --arrow-base-offset, the border thickness, to centralise it on
     * the inner edge of the popup border. This also means we need to increase the size of the arrow by the
     * same amount to compensate.
     *
     * A diamond shaped clipping mask is used to avoid overlap of popup content. This extends slightly inward so
     * the popup border is covered with no sub-pixel rounding artifacts. The diamond corners are mitred at 22.5º
     * to properly merge any arrow border with the popup border. The constant 1.4142 is derived from 1 + tan(22.5).
     *
     */
    --arrow-base-offset: var(--popup-border-width);
    --arrow-size-diagonal: calc((var(--arrow-size) + var(--arrow-base-offset)) * 0.7071);
    --arrow-padding-offset: calc(var(--arrow-size-diagonal) - var(--arrow-size));
    --arrow-size-div: calc(var(--arrow-size-diagonal) * 2);
    --arrow-clipping-corner: calc(var(--arrow-base-offset) * 1.4142);

    display: contents;
  }

  .popup {
    position: absolute;
    isolation: isolate;
    max-width: var(--auto-size-available-width, none);
    max-height: var(--auto-size-available-height, none);

    /* Clear UA styles for [popover] */
    :where(&) {
      inset: unset;
      padding: unset;
      margin: unset;
      width: unset;
      height: unset;
      color: unset;
      background: unset;
      border: unset;
      overflow: unset;
    }
  }

  .popup-fixed {
    position: fixed;
  }

  .popup:not(.popup-active) {
    display: none;
  }

  .arrow {
    position: absolute;
    width: var(--arrow-size-div);
    height: var(--arrow-size-div);
    background: var(--arrow-color);
    z-index: 3;
    clip-path: polygon(
      var(--arrow-clipping-corner) 100%,
      var(--arrow-base-offset) calc(100% - var(--arrow-base-offset)),
      calc(var(--arrow-base-offset) - 2px) calc(100% - var(--arrow-base-offset)),
      calc(100% - var(--arrow-base-offset)) calc(var(--arrow-base-offset) - 2px),
      calc(100% - var(--arrow-base-offset)) var(--arrow-base-offset),
      100% var(--arrow-clipping-corner),
      100% 100%
    );
    rotate: 45deg;
  }

  :host([data-current-placement|='left']) .arrow {
    rotate: -45deg;
  }

  :host([data-current-placement|='right']) .arrow {
    rotate: 135deg;
  }

  :host([data-current-placement|='bottom']) .arrow {
    rotate: 225deg;
  }

  /* Hover bridge */
  .popup-hover-bridge:not(.popup-hover-bridge-visible) {
    display: none;
  }

  .popup-hover-bridge {
    position: fixed;
    z-index: 899;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    clip-path: polygon(
      var(--hover-bridge-top-left-x, 0) var(--hover-bridge-top-left-y, 0),
      var(--hover-bridge-top-right-x, 0) var(--hover-bridge-top-right-y, 0),
      var(--hover-bridge-bottom-right-x, 0) var(--hover-bridge-bottom-right-y, 0),
      var(--hover-bridge-bottom-left-x, 0) var(--hover-bridge-bottom-left-y, 0)
    );
  }

  /* Built-in animations */
  .show {
    animation: show var(--show-duration) ease;
  }

  .hide {
    animation: show var(--hide-duration) ease reverse;
  }

  @keyframes show {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  .show-with-scale {
    animation: show-with-scale var(--show-duration) ease;
  }

  .hide-with-scale {
    animation: show-with-scale var(--hide-duration) ease reverse;
  }

  @keyframes show-with-scale {
    from {
      opacity: 0;
      scale: 0.8;
    }
    to {
      opacity: 1;
      scale: 1;
    }
  }
`,ur=Math.min,dr=Math.max,fr=Math.round,pr=Math.floor,mr=e=>({x:e,y:e}),hr={left:`right`,right:`left`,bottom:`top`,top:`bottom`};function gr(e,t,n){return dr(e,ur(t,n))}function _r(e,t){return typeof e==`function`?e(t):e}function vr(e){return e.split(`-`)[0]}function yr(e){return e.split(`-`)[1]}function br(e){return e===`x`?`y`:`x`}function xr(e){return e===`y`?`height`:`width`}function Sr(e){let t=e[0];return t===`t`||t===`b`?`y`:`x`}function Cr(e){return br(Sr(e))}function wr(e,t,n){n===void 0&&(n=!1);let r=yr(e),i=Cr(e),a=xr(i),o=i===`x`?r===(n?`end`:`start`)?`right`:`left`:r===`start`?`bottom`:`top`;return t.reference[a]>t.floating[a]&&(o=Nr(o)),[o,Nr(o)]}function Tr(e){let t=Nr(e);return[Er(e),t,Er(t)]}function Er(e){return e.includes(`start`)?e.replace(`start`,`end`):e.replace(`end`,`start`)}var Dr=[`left`,`right`],Or=[`right`,`left`],kr=[`top`,`bottom`],Ar=[`bottom`,`top`];function jr(e,t,n){switch(e){case`top`:case`bottom`:return n?t?Or:Dr:t?Dr:Or;case`left`:case`right`:return t?kr:Ar;default:return[]}}function Mr(e,t,n,r){let i=yr(e),a=jr(vr(e),n===`start`,r);return i&&(a=a.map(e=>e+`-`+i),t&&(a=a.concat(a.map(Er)))),a}function Nr(e){let t=vr(e);return hr[t]+e.slice(t.length)}function Pr(e){return{top:e.top??0,right:e.right??0,bottom:e.bottom??0,left:e.left??0}}function Fr(e){return typeof e==`number`?{top:e,right:e,bottom:e,left:e}:Pr(e)}function Ir(e){let{x:t,y:n,width:r,height:i}=e;return{width:r,height:i,top:n,left:t,right:t+r,bottom:n+i,x:t,y:n}}function Lr(e,t,n){let{reference:r,floating:i}=e,a=Sr(t),o=Cr(t),s=xr(o),c=vr(t),l=a===`y`,u=r.x+r.width/2-i.width/2,d=r.y+r.height/2-i.height/2,f=r[s]/2-i[s]/2,p;switch(c){case`top`:p={x:u,y:r.y-i.height};break;case`bottom`:p={x:u,y:r.y+r.height};break;case`right`:p={x:r.x+r.width,y:d};break;case`left`:p={x:r.x-i.width,y:d};break;default:p={x:r.x,y:r.y}}let m=yr(t);return m&&(p[o]+=f*(m===`end`?1:-1)*(n&&l?-1:1)),p}async function Rr(e,t){t===void 0&&(t={});let{x:n,y:r,platform:i,rects:a,elements:o,strategy:s}=e,{boundary:c=`clippingAncestors`,rootBoundary:l=`viewport`,elementContext:u=`floating`,altBoundary:d=!1,padding:f=0}=_r(t,e),p=Fr(f),m=o[d?u===`floating`?`reference`:`floating`:u],h=Ir(await i.getClippingRect({element:await(i.isElement==null?void 0:i.isElement(m))??!0?m:m.contextElement||await(i.getDocumentElement==null?void 0:i.getDocumentElement(o.floating)),boundary:c,rootBoundary:l,strategy:s})),g=u===`floating`?{x:n,y:r,width:a.floating.width,height:a.floating.height}:a.reference,_=await(i.getOffsetParent==null?void 0:i.getOffsetParent(o.floating)),v=await(i.isElement==null?void 0:i.isElement(_))&&await(i.getScale==null?void 0:i.getScale(_))||{x:1,y:1},y=Ir(i.convertOffsetParentRelativeRectToViewportRelativeRect?await i.convertOffsetParentRelativeRectToViewportRelativeRect({elements:o,rect:g,offsetParent:_,strategy:s}):g);return{top:(h.top-y.top+p.top)/v.y,bottom:(y.bottom-h.bottom+p.bottom)/v.y,left:(h.left-y.left+p.left)/v.x,right:(y.right-h.right+p.right)/v.x}}var zr=50,Br=async(e,t,n)=>{let{placement:r=`bottom`,strategy:i=`absolute`,middleware:a=[],platform:o}=n,s=o.detectOverflow?o:{...o,detectOverflow:Rr},c=await(o.isRTL==null?void 0:o.isRTL(t)),l=await o.getElementRects({reference:e,floating:t,strategy:i}),{x:u,y:d}=Lr(l,r,c),f=r,p=0,m={};for(let n=0;n<a.length;n++){let h=a[n];if(!h)continue;let{name:g,fn:_}=h,{x:v,y,data:b,reset:x}=await _({x:u,y:d,initialPlacement:r,placement:f,strategy:i,middlewareData:m,rects:l,platform:s,elements:{reference:e,floating:t}});u=v??u,d=y??d,m[g]={...m[g],...b},x&&p<zr&&(p++,typeof x==`object`&&(x.placement&&(f=x.placement),x.rects&&(l=x.rects===!0?await o.getElementRects({reference:e,floating:t,strategy:i}):x.rects),{x:u,y:d}=Lr(l,f,c)),n=-1)}return{x:u,y:d,placement:f,strategy:i,middlewareData:m}},Vr=e=>({name:`arrow`,options:e,async fn(t){let{x:n,y:r,placement:i,rects:a,platform:o,elements:s,middlewareData:c}=t,{element:l,padding:u=0}=_r(e,t)||{};if(l==null)return{};let d=Fr(u),f={x:n,y:r},p=Cr(i),m=xr(p),h=await o.getDimensions(l),g=p===`y`,_=g?`top`:`left`,v=g?`bottom`:`right`,y=g?`clientHeight`:`clientWidth`,b=a.reference[m]+a.reference[p]-f[p]-a.floating[m],x=f[p]-a.reference[p],S=await(o.getOffsetParent==null?void 0:o.getOffsetParent(l)),C=S?S[y]:0;(!C||!await(o.isElement==null?void 0:o.isElement(S)))&&(C=s.floating[y]||a.floating[m]);let w=b/2-x/2,T=C/2-h[m]/2-1,E=ur(d[_],T),ee=ur(d[v],T),te=C-h[m]-ee,ne=C/2-h[m]/2+w,re=gr(E,ne,te),D=!c.arrow&&yr(i)!=null&&ne!==re&&a.reference[m]/2-(ne<E?E:ee)-h[m]/2<0,ie=D?ne<E?ne-E:ne-te:0;return{[p]:f[p]+ie,data:{[p]:re,centerOffset:ne-re-ie,...D&&{alignmentOffset:ie}},reset:D}}}),Hr=function(e){return e===void 0&&(e={}),{name:`flip`,options:e,async fn(t){var n;let{placement:r,middlewareData:i,rects:a,initialPlacement:o,platform:s,elements:c}=t,{mainAxis:l=!0,crossAxis:u=!0,fallbackPlacements:d,fallbackStrategy:f=`bestFit`,fallbackAxisSideDirection:p=`none`,flipAlignment:m=!0,...h}=_r(e,t);if((n=i.arrow)!=null&&n.alignmentOffset)return{};let g=vr(r),_=Sr(o),v=vr(o)===o,y=await(s.isRTL==null?void 0:s.isRTL(c.floating)),b=d||(v||!m?[Nr(o)]:Tr(o)),x=p!==`none`;!d&&x&&b.push(...Mr(o,m,p,y));let S=[o,...b],C=await s.detectOverflow(t,h),w=[],T=i.flip?.overflows||[];if(l&&w.push(C[g]),u){let e=wr(r,a,y);w.push(C[e[0]],C[e[1]])}if(T=[...T,{placement:r,overflows:w}],!w.every(e=>e<=0)){let e=(i.flip?.index||0)+1,t=S[e];if(t&&(u!==`alignment`||_===Sr(t)||T.every(e=>Sr(e.placement)!==_||e.overflows[0]>0)))return{data:{index:e,overflows:T},reset:{placement:t}};let n=T.filter(e=>e.overflows[0]<=0).sort((e,t)=>e.overflows[1]-t.overflows[1])[0]?.placement;if(!n)switch(f){case`bestFit`:{let e=T.filter(e=>{if(x){let t=Sr(e.placement);return t===_||t===`y`}return!0}).map(e=>[e.placement,e.overflows.filter(e=>e>0).reduce((e,t)=>e+t,0)]).sort((e,t)=>e[1]-t[1])[0]?.[0];e&&(n=e);break}case`initialPlacement`:n=o}if(r!==n)return{reset:{placement:n}}}return{}}}},Ur=new Set([`left`,`top`]);async function Wr(e,t){let{placement:n,platform:r,elements:i}=e,a=await(r.isRTL==null?void 0:r.isRTL(i.floating)),o=vr(n),s=yr(n),c=Sr(n)===`y`,l=Ur.has(o)?-1:1,u=a&&c?-1:1,d=_r(t,e),{mainAxis:f,crossAxis:p,alignmentAxis:m}=typeof d==`number`?{mainAxis:d,crossAxis:0,alignmentAxis:null}:{mainAxis:d.mainAxis||0,crossAxis:d.crossAxis||0,alignmentAxis:d.alignmentAxis};return s&&typeof m==`number`&&(p=s===`end`?m*-1:m),c?{x:p*u,y:f*l}:{x:f*l,y:p*u}}var Gr=function(e){return e===void 0&&(e=0),{name:`offset`,options:e,async fn(t){var n;let{x:r,y:i,placement:a,middlewareData:o}=t,s=await Wr(t,e);return a===o.offset?.placement&&(n=o.arrow)!=null&&n.alignmentOffset?{}:{x:r+s.x,y:i+s.y,data:{...s,placement:a}}}}},Kr=function(e){return e===void 0&&(e={}),{name:`shift`,options:e,async fn(t){let{x:n,y:r,placement:i,platform:a}=t,{mainAxis:o=!0,crossAxis:s=!1,limiter:c={fn:e=>{let{x:t,y:n}=e;return{x:t,y:n}}},...l}=_r(e,t),u={x:n,y:r},d=await a.detectOverflow(t,l),f=Sr(i),p=br(f),m=u[p],h=u[f],g=(e,t)=>gr(t+d[e===`y`?`top`:`left`],t,t-d[e===`y`?`bottom`:`right`]);o&&(m=g(p,m)),s&&(h=g(f,h));let _=c.fn({...t,[p]:m,[f]:h});return{..._,data:{x:_.x-n,y:_.y-r,enabled:{[p]:o,[f]:s}}}}}},qr=function(e){return e===void 0&&(e={}),{name:`size`,options:e,async fn(t){let{placement:n,rects:r,platform:i,elements:a}=t,{apply:o=()=>{},...s}=_r(e,t),c=await i.detectOverflow(t,s),l=vr(n),u=yr(n),d=Sr(n)===`y`,{width:f,height:p}=r.floating,m,h;l===`top`||l===`bottom`?(m=l,h=u===(await(i.isRTL==null?void 0:i.isRTL(a.floating))?`start`:`end`)?`left`:`right`):(h=l,m=u===`end`?`top`:`bottom`);let g=p-c.top-c.bottom,_=f-c.left-c.right,v=ur(p-c[m],g),y=ur(f-c[h],_),b=t.middlewareData.shift,x=!b,S=v,C=y;b!=null&&b.enabled.x&&(C=_),b!=null&&b.enabled.y&&(S=g),x&&!u&&(d?C=f-2*dr(c.left,c.right):S=p-2*dr(c.top,c.bottom)),await o({...t,availableWidth:C,availableHeight:S});let w=await i.getDimensions(a.floating);return f!==w.width||p!==w.height?{reset:{rects:!0}}:{}}}};function Jr(){return typeof window<`u`}function Yr(e){return Qr(e)?(e.nodeName||``).toLowerCase():`#document`}function Xr(e){var t;return(e==null||(t=e.ownerDocument)==null?void 0:t.defaultView)||window}function Zr(e){return((Qr(e)?e.ownerDocument:e.document)||window.document)?.documentElement}function Qr(e){return Jr()?e instanceof Node||e instanceof Xr(e).Node:!1}function $r(e){return Jr()?e instanceof Element||e instanceof Xr(e).Element:!1}function ei(e){return Jr()?e instanceof HTMLElement||e instanceof Xr(e).HTMLElement:!1}function ti(e){return!Jr()||typeof ShadowRoot>`u`?!1:e instanceof ShadowRoot||e instanceof Xr(e).ShadowRoot}function ni(e){let{overflow:t,overflowX:n,overflowY:r,display:i}=pi(e);return/auto|scroll|overlay|hidden|clip/.test(t+r+n)&&i!==`inline`&&i!==`contents`}function ri(e){return/^(table|td|th)$/.test(Yr(e))}function ii(e){try{if(e.matches(`:popover-open`))return!0}catch{}try{return e.matches(`:modal`)}catch{return!1}}var ai=/transform|translate|scale|rotate|perspective|filter/,oi=/paint|layout|strict|content/,si=e=>!!e&&e!==`none`,ci;function li(e){let t=$r(e)?pi(e):e;return si(t.transform)||si(t.translate)||si(t.scale)||si(t.rotate)||si(t.perspective)||!di()&&(si(t.backdropFilter)||si(t.filter))||ai.test(t.willChange||``)||oi.test(t.contain||``)}function ui(e){let t=hi(e);for(;ei(t)&&!fi(t);){if(li(t))return t;if(ii(t))return null;t=hi(t)}return null}function di(){return ci??=typeof CSS<`u`&&CSS.supports&&CSS.supports(`-webkit-backdrop-filter`,`none`),ci}function fi(e){return/^(html|body|#document)$/.test(Yr(e))}function pi(e){return Xr(e).getComputedStyle(e)}function mi(e){return $r(e)?{scrollLeft:e.scrollLeft,scrollTop:e.scrollTop}:{scrollLeft:e.scrollX,scrollTop:e.scrollY}}function hi(e){if(Yr(e)===`html`)return e;let t=e.assignedSlot||e.parentNode||ti(e)&&e.host||Zr(e);return ti(t)?t.host:t}function gi(e){let t=hi(e);return fi(t)?(e.ownerDocument||e).body:ei(t)&&ni(t)?t:gi(t)}function _i(e,t,n){t===void 0&&(t=[]),n===void 0&&(n=!0);let r=gi(e),i=r===e.ownerDocument?.body,a=Xr(r);if(i){let e=vi(a);return t.concat(a,a.visualViewport||[],ni(r)?r:[],e&&n?_i(e):[])}return t.concat(r,_i(r,[],n))}function vi(e){return e.parent&&Object.getPrototypeOf(e.parent)?e.frameElement:null}function yi(e){let t=pi(e),n=parseFloat(t.width)||0,r=parseFloat(t.height)||0,i=ei(e),a=i?e.offsetWidth:n,o=i?e.offsetHeight:r,s=fr(n)!==a||fr(r)!==o;return s&&(n=a,r=o),{width:n,height:r,$:s}}function bi(e){return $r(e)?e:e.contextElement}function xi(e){let t=bi(e);if(!ei(t))return mr(1);let n=t.getBoundingClientRect(),{width:r,height:i,$:a}=yi(t),o=(a?fr(n.width):n.width)/r,s=(a?fr(n.height):n.height)/i;return(!o||!Number.isFinite(o))&&(o=1),(!s||!Number.isFinite(s))&&(s=1),{x:o,y:s}}var Si=mr(0);function Ci(e){let t=Xr(e);return!di()||!t.visualViewport?Si:{x:t.visualViewport.offsetLeft,y:t.visualViewport.offsetTop}}function wi(e,t,n){return t===void 0&&(t=!1),!!n&&t&&n===Xr(e)}function Ti(e,t,n,r){t===void 0&&(t=!1),n===void 0&&(n=!1);let i=e.getBoundingClientRect(),a=bi(e),o=mr(1);t&&(r?$r(r)&&(o=xi(r)):o=xi(e));let s=wi(a,n,r)?Ci(a):mr(0),c=(i.left+s.x)/o.x,l=(i.top+s.y)/o.y,u=i.width/o.x,d=i.height/o.y;if(a&&r){let e=Xr(a),t=$r(r)?Xr(r):r,n=e,i=vi(n);for(;i&&t!==n;){let e=xi(i),t=i.getBoundingClientRect(),r=pi(i),a=t.left+(i.clientLeft+parseFloat(r.paddingLeft))*e.x,o=t.top+(i.clientTop+parseFloat(r.paddingTop))*e.y;c*=e.x,l*=e.y,u*=e.x,d*=e.y,c+=a,l+=o,n=Xr(i),i=vi(n)}}return Ir({width:u,height:d,x:c,y:l})}function Ei(e,t){let n=mi(e).scrollLeft;return t?t.left+n:Ti(Zr(e)).left+n}function Di(e,t){let n=e.getBoundingClientRect();return{x:n.left+t.scrollLeft-Ei(e,n),y:n.top+t.scrollTop}}function Oi(e){let{elements:t,rect:n,offsetParent:r,strategy:i}=e,a=i===`fixed`,o=Zr(r),s=t?ii(t.floating):!1;if(r===o||s&&a)return n;let c={scrollLeft:0,scrollTop:0},l=mr(1),u=mr(0),d=ei(r);if((d||!a)&&((Yr(r)!==`body`||ni(o))&&(c=mi(r)),d)){let e=Ti(r);l=xi(r),u.x=e.x+r.clientLeft,u.y=e.y+r.clientTop}let f=o&&!d&&!a?Di(o,c):mr(0);return{width:n.width*l.x,height:n.height*l.y,x:n.x*l.x-c.scrollLeft*l.x+u.x+f.x,y:n.y*l.y-c.scrollTop*l.y+u.y+f.y}}function ki(e){return e.getClientRects?Array.from(e.getClientRects()):[]}function Ai(e){let t=mi(e),n=e.ownerDocument.body,r=dr(e.scrollWidth,e.clientWidth,n.scrollWidth,n.clientWidth),i=dr(e.scrollHeight,e.clientHeight,n.scrollHeight,n.clientHeight),a=-t.scrollLeft+Ei(e),o=-t.scrollTop;return pi(n).direction===`rtl`&&(a+=dr(e.clientWidth,n.clientWidth)-r),{width:r,height:i,x:a,y:o}}var ji=25;function Mi(e,t,n){n===void 0&&(n=`viewport`);let r=n===`layoutViewport`,i=Xr(e),a=Zr(e),o=i.visualViewport,s=a.clientWidth,c=a.clientHeight,l=0,u=0;if(o){let e=!di()||t===`fixed`;r?e||(l=-o.offsetLeft,u=-o.offsetTop):(s=o.width,c=o.height,e&&(l=o.offsetLeft,u=o.offsetTop))}if(Ei(a)<=0){let e=a.ownerDocument,t=e.body,n=getComputedStyle(t),r=e.compatMode===`CSS1Compat`&&parseFloat(n.marginLeft)+parseFloat(n.marginRight)||0,i=Math.abs(a.clientWidth-t.clientWidth-r),o=getComputedStyle(a).scrollbarGutter===`stable both-edges`?i/2:i;o<=ji&&(s-=o)}return{width:s,height:c,x:l,y:u}}function Ni(e,t){let n=Ti(e,!0,t===`fixed`),r=n.top+e.clientTop,i=n.left+e.clientLeft,a=xi(e);return{width:e.clientWidth*a.x,height:e.clientHeight*a.y,x:i*a.x,y:r*a.y}}function Pi(e,t,n){let r;if(t===`viewport`||t===`layoutViewport`)r=Mi(e,n,t);else if(t===`document`)r=Ai(Zr(e));else if($r(t))r=Ni(t,n);else{let n=Ci(e);r={x:t.x-n.x,y:t.y-n.y,width:t.width,height:t.height}}return Ir(r)}function Fi(e,t){let n=t.get(e);if(n)return n;let r=_i(e,[],!1).filter(e=>$r(e)&&Yr(e)!==`body`),i=null,a=pi(e).position===`fixed`,o=a?hi(e):e;for(;$r(o)&&!fi(o);){let e=pi(o),t=li(o),n=i?i.position:a?`fixed`:``;!t&&(n===`fixed`||n===`absolute`&&e.position===`static`)?r=r.filter(e=>e!==o):i=e,o=hi(o)}return t.set(e,r),r}function Ii(e){let{element:t,boundary:n,rootBoundary:r,strategy:i}=e,a=[...n===`clippingAncestors`?ii(t)?[]:Fi(t,this._c):[].concat(n),r],o=Pi(t,a[0],i),s=o.top,c=o.right,l=o.bottom,u=o.left;for(let e=1;e<a.length;e++){let n=Pi(t,a[e],i);s=dr(n.top,s),c=ur(n.right,c),l=ur(n.bottom,l),u=dr(n.left,u)}return{width:c-u,height:l-s,x:u,y:s}}function Li(e){let{width:t,height:n}=yi(e);return{width:t,height:n}}function Ri(e,t,n){let r=ei(t),i=Zr(t),a=n===`fixed`,o=Ti(e,!0,a,t),s={scrollLeft:0,scrollTop:0},c=mr(0);if((r||!a)&&((Yr(t)!==`body`||ni(i))&&(s=mi(t)),r)){let e=Ti(t,!0,a,t);c.x=e.x+t.clientLeft,c.y=e.y+t.clientTop}!r&&i&&(c.x=Ei(i));let l=i&&!r&&!a?Di(i,s):mr(0);return{x:o.left+s.scrollLeft-c.x-l.x,y:o.top+s.scrollTop-c.y-l.y,width:o.width,height:o.height}}function zi(e){return pi(e).position===`static`}function Bi(e,t){if(!ei(e)||pi(e).position===`fixed`)return null;if(t)return t(e);let n=e.offsetParent;return Zr(e)===n&&(n=n.ownerDocument.body),n}function Vi(e,t){let n=Xr(e);if(ii(e))return n;if(!ei(e)){let t=hi(e);for(;t&&!fi(t);){if($r(t)&&!zi(t))return t;t=hi(t)}return n}let r=Bi(e,t);for(;r&&ri(r)&&zi(r);)r=Bi(r,t);return r&&fi(r)&&zi(r)&&!li(r)?n:r||ui(e)||n}var Hi=async function(e){let t=this.getOffsetParent||Vi,n=this.getDimensions,r=await n(e.floating);return{reference:Ri(e.reference,await t(e.floating),e.strategy),floating:{x:0,y:0,width:r.width,height:r.height}}};function Ui(e){return pi(e).direction===`rtl`}var Wi={convertOffsetParentRelativeRectToViewportRelativeRect:Oi,getDocumentElement:Zr,getClippingRect:Ii,getOffsetParent:Vi,getElementRects:Hi,getClientRects:ki,getDimensions:Li,getScale:xi,isElement:$r,isRTL:Ui};function Gi(e,t){return e.x===t.x&&e.y===t.y&&e.width===t.width&&e.height===t.height}function Ki(e,t,n){let r=null,i,a=Zr(e);function o(){var e;clearTimeout(i),(e=r)==null||e.disconnect(),r=null}function s(n,c){n===void 0&&(n=!1),c===void 0&&(c=1),o();let l=e.getBoundingClientRect(),{left:u,top:d,width:f,height:p}=l;if(n||t(),!f||!p)return;let m=pr(d),h=pr(a.clientWidth-(u+f)),g=pr(a.clientHeight-(d+p)),_=pr(u),v={rootMargin:-m+`px `+-h+`px `+-g+`px `+-_+`px`,threshold:dr(0,ur(1,c))||1},y=!0;function b(t){let n=t[0].intersectionRatio;if(!Gi(l,e.getBoundingClientRect()))return s();if(n!==c){if(!y)return s();n?s(!1,n):i=setTimeout(()=>{s(!1,1e-7)},1e3)}y=!1}try{r=new IntersectionObserver(b,{...v,root:a.ownerDocument})}catch{r=new IntersectionObserver(b,v)}r.observe(e)}let c=Xr(e),l=()=>s(n);return c.addEventListener(`resize`,l),s(!0),()=>{c.removeEventListener(`resize`,l),o()}}function qi(e,t,n,r){r===void 0&&(r={});let{ancestorScroll:i=!0,ancestorResize:a=!0,elementResize:o=typeof ResizeObserver==`function`,layoutShift:s=typeof IntersectionObserver==`function`,animationFrame:c=!1}=r,l=bi(e),u=i||a?[...l?_i(l):[],...t?_i(t):[]]:[];u.forEach(e=>{i&&e.addEventListener(`scroll`,n),a&&e.addEventListener(`resize`,n)});let d=l&&s?Ki(l,n,a):null,f=-1,p=null;o&&(p=new ResizeObserver(e=>{let[r]=e;r&&r.target===l&&p&&t&&(p.unobserve(t),cancelAnimationFrame(f),f=requestAnimationFrame(()=>{var e;(e=p)==null||e.observe(t)})),n()}),l&&!c&&p.observe(l),t&&p.observe(t));let m,h=c?Ti(e):null;c&&g();function g(){let t=Ti(e);h&&!Gi(h,t)&&n(),h=t,m=requestAnimationFrame(g)}return n(),()=>{var e;u.forEach(e=>{i&&e.removeEventListener(`scroll`,n),a&&e.removeEventListener(`resize`,n)}),d?.(),(e=p)==null||e.disconnect(),p=null,c&&cancelAnimationFrame(m)}}var Ji=Gr,Yi=Kr,Xi=Hr,Zi=qr,Qi=Vr,$i=(e,t,n)=>{let r=new Map,i=n??{},a={...Wi,...i.platform,_c:r};return Br(e,t,{...i,platform:a})};function ea(e){return na(e)}function ta(e){return e.assignedSlot?e.assignedSlot:e.parentNode instanceof ShadowRoot?e.parentNode.host:e.parentNode}function na(e){for(let t=e;t;t=ta(t))if(t instanceof Element&&getComputedStyle(t).display===`none`)return null;for(let t=ta(e);t;t=ta(t)){if(!(t instanceof Element))continue;let e=getComputedStyle(t);if(e.display!==`contents`&&(e.position!==`static`||li(e)||t.tagName===`BODY`))return t}return null}function ra(e){return typeof e==`object`&&!!e&&`getBoundingClientRect`in e&&(`contextElement`in e?e instanceof Element:!0)}var ia=!!globalThis?.HTMLElement?.prototype.hasOwnProperty(`popover`),Q=class extends V{constructor(){super(...arguments),this.localize=new Ct(this),this.SUPPORTS_POPOVER=!1,this.active=!1,this.placement=`top`,this.boundary=`viewport`,this.distance=0,this.skidding=0,this.arrow=!1,this.arrowPlacement=`anchor`,this.arrowPadding=10,this.flip=!1,this.flipFallbackPlacements=``,this.flipFallbackStrategy=`best-fit`,this.flipPadding=0,this.shift=!1,this.shiftPadding=0,this.autoSizePadding=0,this.hoverBridge=!1,this.updateHoverBridge=()=>{if(this.hoverBridge&&this.anchorEl&&this.popup){let e=this.anchorEl.getBoundingClientRect(),t=this.popup.getBoundingClientRect(),n=this.placement.includes(`top`)||this.placement.includes(`bottom`),r=0,i=0,a=0,o=0,s=0,c=0,l=0,u=0;n?e.top<t.top?(r=e.left,i=e.bottom,a=e.right,o=e.bottom,s=t.left,c=t.top,l=t.right,u=t.top):(r=t.left,i=t.bottom,a=t.right,o=t.bottom,s=e.left,c=e.top,l=e.right,u=e.top):e.left<t.left?(r=e.right,i=e.top,a=t.left,o=t.top,s=e.right,c=e.bottom,l=t.left,u=t.bottom):(r=t.right,i=t.top,a=e.left,o=e.top,s=t.right,c=t.bottom,l=e.left,u=e.bottom),this.style.setProperty(`--hover-bridge-top-left-x`,`${r}px`),this.style.setProperty(`--hover-bridge-top-left-y`,`${i}px`),this.style.setProperty(`--hover-bridge-top-right-x`,`${a}px`),this.style.setProperty(`--hover-bridge-top-right-y`,`${o}px`),this.style.setProperty(`--hover-bridge-bottom-left-x`,`${s}px`),this.style.setProperty(`--hover-bridge-bottom-left-y`,`${c}px`),this.style.setProperty(`--hover-bridge-bottom-right-x`,`${l}px`),this.style.setProperty(`--hover-bridge-bottom-right-y`,`${u}px`)}}}async connectedCallback(){super.connectedCallback(),await this.updateComplete,this.SUPPORTS_POPOVER=ia,this.start()}disconnectedCallback(){super.disconnectedCallback(),this.stop()}async updated(e){super.updated(e),e.has(`active`)&&(this.active?this.start():this.stop()),e.has(`anchor`)&&this.handleAnchorChange(),this.active&&(await this.updateComplete,this.reposition())}async handleAnchorChange(){if(await this.stop(),this.anchor&&typeof this.anchor==`string`){let e=this.getRootNode();this.anchorEl=e.getElementById(this.anchor)}else this.anchorEl=this.anchor instanceof Element||ra(this.anchor)?this.anchor:this.querySelector(`[slot="anchor"]`);this.anchorEl instanceof HTMLSlotElement&&(this.anchorEl=this.anchorEl.assignedElements({flatten:!0})[0]),this.anchorEl&&this.start()}start(){this.anchorEl&&this.active&&this.isConnected&&(this.popup?.showPopover?.(),this.cleanup=qi(this.anchorEl,this.popup,()=>{this.reposition()}))}async stop(){return new Promise(e=>{this.popup?.hidePopover?.(),this.cleanup?(this.cleanup(),this.cleanup=void 0,this.removeAttribute(`data-current-placement`),this.style.removeProperty(`--auto-size-available-width`),this.style.removeProperty(`--auto-size-available-height`),requestAnimationFrame(()=>e())):e()})}reposition(){if(!this.active||!this.anchorEl||!this.popup)return;let e=[Ji({mainAxis:this.distance,crossAxis:this.skidding})];this.sync?e.push(Zi({apply:({rects:e})=>{let t=this.sync===`width`||this.sync===`both`,n=this.sync===`height`||this.sync===`both`;this.popup.style.width=t?`${e.reference.width}px`:``,this.popup.style.height=n?`${e.reference.height}px`:``}})):(this.popup.style.width=``,this.popup.style.height=``);let t;this.SUPPORTS_POPOVER&&!ra(this.anchor)&&this.boundary===`scroll`&&(t=_i(this.anchorEl).filter(e=>e instanceof Element)),this.flip&&e.push(Xi({boundary:this.flipBoundary||t,fallbackPlacements:this.flipFallbackPlacements,fallbackStrategy:this.flipFallbackStrategy===`best-fit`?`bestFit`:`initialPlacement`,padding:this.flipPadding})),this.shift&&e.push(Yi({boundary:this.shiftBoundary||t,padding:this.shiftPadding})),this.autoSize?e.push(Zi({boundary:this.autoSizeBoundary||t,padding:this.autoSizePadding,apply:({availableWidth:e,availableHeight:t})=>{this.autoSize===`vertical`||this.autoSize===`both`?this.style.setProperty(`--auto-size-available-height`,`${t}px`):this.style.removeProperty(`--auto-size-available-height`),this.autoSize===`horizontal`||this.autoSize===`both`?this.style.setProperty(`--auto-size-available-width`,`${e}px`):this.style.removeProperty(`--auto-size-available-width`)}})):(this.style.removeProperty(`--auto-size-available-width`),this.style.removeProperty(`--auto-size-available-height`)),this.arrow&&e.push(Qi({element:this.arrowEl,padding:this.arrowPadding}));let n=this.SUPPORTS_POPOVER?e=>Wi.getOffsetParent(e,ea):Wi.getOffsetParent;$i(this.anchorEl,this.popup,{placement:this.placement,middleware:e,strategy:this.SUPPORTS_POPOVER?`absolute`:`fixed`,platform:{...Wi,getOffsetParent:n}}).then(({x:e,y:t,middlewareData:n,placement:r})=>{let i=this.localize.dir()===`rtl`,a={top:`bottom`,right:`left`,bottom:`top`,left:`right`}[r.split(`-`)[0]];if(this.setAttribute(`data-current-placement`,r),Object.assign(this.popup.style,{left:`${e}px`,top:`${t}px`}),this.arrow){let e=n.arrow.x,t=n.arrow.y,r=``,o=``,s=``,c=``;if(this.arrowPlacement===`start`){let n=typeof e==`number`?`calc(${this.arrowPadding}px - var(--arrow-padding-offset))`:``;r=typeof t==`number`?`calc(${this.arrowPadding}px - var(--arrow-padding-offset))`:``,o=i?n:``,c=i?``:n}else if(this.arrowPlacement===`end`){let n=typeof e==`number`?`calc(${this.arrowPadding}px - var(--arrow-padding-offset))`:``;o=i?``:n,c=i?n:``,s=typeof t==`number`?`calc(${this.arrowPadding}px - var(--arrow-padding-offset))`:``}else this.arrowPlacement===`center`?(c=typeof e==`number`?`calc(50% - var(--arrow-size-diagonal))`:``,r=typeof t==`number`?`calc(50% - var(--arrow-size-diagonal))`:``):(c=typeof e==`number`?`${e}px`:``,r=typeof t==`number`?`${t}px`:``);Object.assign(this.arrowEl.style,{top:r,right:o,bottom:s,left:c,[a]:`calc(var(--arrow-base-offset) - var(--arrow-size-diagonal))`})}}),requestAnimationFrame(()=>this.updateHoverBridge()),this.dispatchEvent(new cr)}render(){return j`
      <slot name="anchor" @slotchange=${this.handleAnchorChange}></slot>

      <span
        part="hover-bridge"
        class=${K({"popup-hover-bridge":!0,"popup-hover-bridge-visible":this.hoverBridge&&this.active})}
      ></span>

      <div
        popover="manual"
        part="popup"
        class=${K({popup:!0,"popup-active":this.active,"popup-fixed":!this.SUPPORTS_POPOVER,"popup-has-arrow":this.arrow})}
      >
        <slot></slot>
        ${this.arrow?j`<div part="arrow" class="arrow" role="presentation"></div>`:``}
      </div>
    `}};Q.css=lr,F([B(`.popup`)],Q.prototype,`popup`,2),F([B(`.arrow`)],Q.prototype,`arrowEl`,2),F([R({attribute:!1,type:Boolean})],Q.prototype,`SUPPORTS_POPOVER`,2),F([R()],Q.prototype,`anchor`,2),F([R({type:Boolean,reflect:!0})],Q.prototype,`active`,2),F([R({reflect:!0})],Q.prototype,`placement`,2),F([R()],Q.prototype,`boundary`,2),F([R({type:Number})],Q.prototype,`distance`,2),F([R({type:Number})],Q.prototype,`skidding`,2),F([R({type:Boolean})],Q.prototype,`arrow`,2),F([R({attribute:`arrow-placement`})],Q.prototype,`arrowPlacement`,2),F([R({attribute:`arrow-padding`,type:Number})],Q.prototype,`arrowPadding`,2),F([R({type:Boolean})],Q.prototype,`flip`,2),F([R({attribute:`flip-fallback-placements`,converter:{fromAttribute:e=>e.split(` `).map(e=>e.trim()).filter(e=>e!==``),toAttribute:e=>e.join(` `)}})],Q.prototype,`flipFallbackPlacements`,2),F([R({attribute:`flip-fallback-strategy`})],Q.prototype,`flipFallbackStrategy`,2),F([R({type:Object})],Q.prototype,`flipBoundary`,2),F([R({attribute:`flip-padding`,type:Number})],Q.prototype,`flipPadding`,2),F([R({type:Boolean})],Q.prototype,`shift`,2),F([R({type:Object})],Q.prototype,`shiftBoundary`,2),F([R({attribute:`shift-padding`,type:Number})],Q.prototype,`shiftPadding`,2),F([R({attribute:`auto-size`})],Q.prototype,`autoSize`,2),F([R()],Q.prototype,`sync`,2),F([R({type:Object})],Q.prototype,`autoSizeBoundary`,2),F([R({attribute:`auto-size-padding`,type:Number})],Q.prototype,`autoSizePadding`,2),F([R({attribute:`hover-bridge`,type:Boolean})],Q.prototype,`hoverBridge`,2),Q=F([I(`wa-popup`)],Q);var aa=h`
  :host {
    --height: var(--wa-form-control-toggle-size);
    --width: calc(var(--height) * 1.75);
    --thumb-size: 0.75em;

    display: inline-flex;
    line-height: var(--wa-form-control-value-line-height);
  }

  label {
    position: relative;
    display: flex;
    align-items: center;
    font: inherit;
    color: var(--wa-form-control-value-color);
    vertical-align: middle;
    cursor: pointer;
  }

  .switch {
    flex: 0 0 auto;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: var(--width);
    height: var(--height);
    background-color: var(--wa-form-control-background-color);
    border-color: var(--wa-form-control-border-color);
    border-radius: var(--height);
    border-style: var(--wa-form-control-border-style);
    border-width: var(--wa-form-control-border-width);
    transition-property: translate, background, border-color, box-shadow;
    transition-duration: var(--wa-transition-normal);
    transition-timing-function: var(--wa-transition-easing);
  }

  :host([did-ssr]:not(:defined)) .switch {
    transition-property: unset;
    transition-duration: unset;
    transition-timing-function: unset;
  }

  .switch .thumb {
    aspect-ratio: 1 / 1;
    width: var(--thumb-size);
    height: var(--thumb-size);
    background-color: var(--wa-form-control-border-color);
    border-radius: 50%;
    translate: calc((var(--width) - var(--height)) / -2);
    transition: inherit;
  }
  .switch .thumb:dir(rtl) {
    translate: calc((var(--width) - var(--height)) / 2);
  }

  .input {
    position: absolute;
    opacity: 0;
    padding: 0;
    margin: 0;
    pointer-events: none;
  }

  /* Focus */
  label:not(.disabled) .input:focus-visible ~ [part~='control'] {
    outline: var(--wa-focus-ring);
    outline-offset: var(--wa-focus-ring-offset);
  }

  /* Checked */
  .checked .switch {
    background-color: var(--wa-form-control-activated-color);
    border-color: var(--wa-form-control-activated-color);
  }

  .checked .switch .thumb {
    background-color: var(--wa-color-surface-default);
    translate: calc((var(--width) - var(--height)) / 2);
  }
  .checked .switch .thumb:dir(rtl) {
    translate: calc((var(--width) - var(--height)) / -2);
  }

  /* Disabled */
  label:has(> :disabled) {
    opacity: 0.5;
    cursor: not-allowed;
  }

  [part~='label'] {
    display: inline-block;
    line-height: var(--height);
    margin-inline-start: 0.5em;
    user-select: none;
    -webkit-user-select: none;
  }

  :host([required]) [part~='label']::after {
    content: var(--wa-form-control-required-content);
    color: var(--wa-form-control-required-content-color);
    margin-inline-start: var(--wa-form-control-required-content-offset);
  }

  @media (forced-colors: active) {
    :checked:enabled + .switch:hover .thumb,
    :checked + .switch .thumb {
      background-color: ButtonText;
    }
  }
`,oa=class extends st{constructor(){super(...arguments),this.hasSlotController=new H(this,`hint`),this.localize=new Ct(this),this.title=``,this.name=null,this._value=this.getAttribute(`value`)??null,this.size=`m`,this.disabled=!1,this._checked=null,this.defaultChecked=this.hasAttribute(`checked`),this.required=!1,this.hint=``,this.withHint=!1}static get validators(){return[...super.validators,it()]}get value(){return this._value??`on`}set value(e){this._value=e}handleSizeChange(){dt(this.localName,this.size)}get checked(){return this.valueHasChanged?!!this._checked:this._checked??this.defaultChecked}set checked(e){this._checked=!!e,this.valueHasChanged=!0}handleClick(){this.hasInteracted=!0,this.checked=!this.checked,this.updateComplete.then(()=>{this.dispatchEvent(new Event(`change`,{bubbles:!0,composed:!0}))})}handleKeyDown(e){let t=this.localize.dir()===`rtl`;e.key===`ArrowLeft`&&(e.preventDefault(),this.checked=t,this.updateComplete.then(()=>{this.dispatchEvent(new Event(`change`,{bubbles:!0,composed:!0})),this.dispatchEvent(new InputEvent(`input`,{bubbles:!0,composed:!0}))})),e.key===`ArrowRight`&&(e.preventDefault(),this.checked=!t,this.updateComplete.then(()=>{this.dispatchEvent(new Event(`change`,{bubbles:!0,composed:!0})),this.dispatchEvent(new InputEvent(`input`,{bubbles:!0,composed:!0}))}))}willUpdate(e){super.willUpdate(e),(e.has(`value`)||e.has(`checked`)||e.has(`defaultChecked`)||e.has(`disabled`))&&this.handleValueOrCheckedChange()}handleValueOrCheckedChange(){if(this.didSSR&&!this.hasUpdated){this.updateComplete.then(()=>{this.handleValueOrCheckedChange()});return}this.setValue(this.checked?this.value:null,this._value),this.updateValidity()}handleStateChange(){this.hasUpdated&&(this.input.checked=this.checked),this.customStates.set(`checked`,this.checked),this.updateValidity()}handleDisabledChange(){this.updateValidity()}click(){this.input.click()}focus(e){this.input.focus(e)}blur(){this.input.blur()}setValue(e,t){if(!this.checked){this.internals.setFormValue(null,null);return}this.internals.setFormValue(e??`on`,t)}formResetCallback(){this._checked=null,super.formResetCallback(),this.handleValueOrCheckedChange()}render(){let e=this.hasSlotController.test(`hint`,`withHint`),t=this.hint?!0:!!e,n=this.didSSR&&!this.hasUpdated?this.checked:this.defaultChecked,r=this.didSSR&&!this.hasUpdated?null:Xn(this.checked);return j`
      <label
        part="base switch"
        class=${K({checked:this.checked,disabled:this.disabled})}
      >
        <input
          class="input"
          type="checkbox"
          title=${this.title}
          name=${q(this.name)}
          value=${q(this.value)}
          .checked=${q(r)}
          ?checked=${n}
          ?disabled=${this.disabled}
          ?required=${this.required}
          role="switch"
          aria-checked=${this.checked?`true`:`false`}
          aria-describedby="hint"
          @click=${this.handleClick}
          @keydown=${this.handleKeyDown}
        />

        <span part="control" class="switch">
          <span part="thumb" class="thumb"></span>
        </span>

        <slot part="label" class="label"></slot>
      </label>

      <slot
        id="hint"
        name="hint"
        part="hint"
        class=${K({"has-slotted":t})}
        aria-hidden=${t?`false`:`true`}
        >${this.hint}</slot
      >
    `}};oa.shadowRootOptions={...st.shadowRootOptions,delegatesFocus:!0},oa.css=[Yn,ft,aa],F([B(`input[type="checkbox"]`)],oa.prototype,`input`,2),F([R()],oa.prototype,`title`,2),F([R({reflect:!0})],oa.prototype,`name`,2),F([R({reflect:!0})],oa.prototype,`value`,1),F([R({reflect:!0})],oa.prototype,`size`,2),F([U(`size`)],oa.prototype,`handleSizeChange`,1),F([R({type:Boolean})],oa.prototype,`disabled`,2),F([R({type:Boolean,attribute:!1})],oa.prototype,`checked`,1),F([R({type:Boolean,attribute:`checked`,reflect:!0})],oa.prototype,`defaultChecked`,2),F([R({type:Boolean,reflect:!0})],oa.prototype,`required`,2),F([R({attribute:`hint`})],oa.prototype,`hint`,2),F([R({attribute:`with-hint`,type:Boolean})],oa.prototype,`withHint`,2),F([U([`checked`,`defaultChecked`])],oa.prototype,`handleStateChange`,1),F([U(`disabled`,{waitUntilFirstUpdate:!0})],oa.prototype,`handleDisabledChange`,1),oa=F([I(`wa-switch`)],oa),oa.disableWarning?.(`change-in-update`);var sa=h`
  :host {
    display: inline-block;
    color: var(--wa-color-neutral-on-quiet);
    font-weight: var(--wa-font-weight-action);
  }

  .tab {
    display: inline-flex;
    align-items: center;
    font: inherit;
    padding: 1em 1.5em;
    white-space: nowrap;
    user-select: none;
    -webkit-user-select: none;
    cursor: pointer;
    transition: color var(--wa-transition-fast) var(--wa-transition-easing);

    ::slotted(wa-icon:first-child) {
      margin-inline-end: 0.5em;
    }

    ::slotted(wa-icon:last-child) {
      margin-inline-start: 0.5em;
    }
  }

  @media (hover: hover) {
    :host(:hover:not([disabled])) .tab {
      color: currentColor;
    }
  }

  :host(:focus) {
    outline: transparent;
  }

  :host(:focus-visible) .tab {
    outline: var(--wa-focus-ring);
    outline-offset: calc(-1 * var(--wa-border-width-l) - var(--wa-focus-ring-offset));
  }

  :host([active]:not([disabled])) {
    color: var(--wa-color-brand-on-quiet);
  }

  :host([disabled]) .tab {
    opacity: 0.5;
    cursor: not-allowed;
  }

  @media (forced-colors: active) {
    :host([active]:not([disabled])) {
      outline: solid 1px transparent;
      outline-offset: -3px;
    }
  }
`,ca=0,la=class extends V{constructor(){super(...arguments),this.attrId=++ca,this.componentId=`wa-tab-${this.attrId}`,this.panel=``,this.active=!1,this.disabled=!1,this.tabIndex=0,this.slot=`nav`,this.role=`tab`}handleActiveChange(){this.setAttribute(`aria-selected`,this.active?`true`:`false`)}handleDisabledChange(){this.setAttribute(`aria-disabled`,this.disabled?`true`:`false`),this.tabIndex=this.disabled&&!this.active?-1:0}render(){return this.id=this.id?.length>0?this.id:this.componentId,j`
      <div
        part="base tab"
        class=${K({tab:!0,"tab-active":this.active})}
      >
        <slot></slot>
      </div>
    `}};la.css=sa,F([B(`.tab`)],la.prototype,`tab`,2),F([R({reflect:!0})],la.prototype,`panel`,2),F([R({type:Boolean,reflect:!0})],la.prototype,`active`,2),F([R({type:Boolean,reflect:!0})],la.prototype,`disabled`,2),F([R({type:Number,reflect:!0})],la.prototype,`tabIndex`,2),F([R({reflect:!0})],la.prototype,`slot`,2),F([R({reflect:!0})],la.prototype,`role`,2),F([U(`active`)],la.prototype,`handleActiveChange`,1),F([U(`disabled`)],la.prototype,`handleDisabledChange`,1),la=F([I(`wa-tab`)],la);var ua=class extends Event{constructor(e){super(`wa-tab-show`,{bubbles:!0,cancelable:!1,composed:!0}),this.detail=e}},da=class extends Event{constructor(e){super(`wa-tab-hide`,{bubbles:!0,cancelable:!1,composed:!0}),this.detail=e}},fa=h`
  :host {
    --indicator-color: var(--wa-color-brand-fill-loud);
    --track-color: var(--wa-color-neutral-fill-normal);
    --track-width: 0.125rem;

    /* Private */
    --safe-track-width: max(0.5px, round(var(--track-width), 0.5px));

    display: block;
  }

  .tab-group {
    display: flex;
    border-radius: 0;
  }

  .tabs {
    display: flex;
    position: relative;
  }

  .indicator {
    position: absolute;
  }

  .tab-group-has-scroll-controls .nav-container {
    position: relative;
    padding: 0 1.5em;
  }

  .body {
    display: block;
  }

  .scroll-button {
    display: flex;
    align-items: center;
    justify-content: center;
    position: absolute;
    top: 0;
    bottom: 0;
    width: 1.5em;
  }

  .scroll-button-start {
    inset-inline-start: 0;
  }

  .scroll-button-end {
    inset-inline-end: 0;
  }

  /*
    * Top
    */

  .tab-group-top {
    flex-direction: column;
  }

  .tab-group-top .nav-container {
    order: 1;
  }

  .tab-group-top .nav {
    display: flex;
    overflow-x: auto;

    /* Hide scrollbar in Firefox */
    scrollbar-width: none;
  }

  /* Hide scrollbar in Chrome/Safari */
  .tab-group-top .nav::-webkit-scrollbar {
    width: 0;
    height: 0;
  }

  .tab-group-top .tabs {
    flex: 1 1 auto;
    position: relative;
    flex-direction: row;
    border-bottom: solid var(--safe-track-width) var(--track-color);
  }

  .tab-group-top .indicator {
    bottom: calc(-1 * var(--safe-track-width));
    border-bottom: solid var(--safe-track-width) var(--indicator-color);
  }

  .tab-group-top .body {
    order: 2;
  }

  .tab-group-top ::slotted(wa-tab[active]) {
    border-block-end: solid var(--safe-track-width) var(--indicator-color);
    margin-block-end: calc(-1 * var(--safe-track-width));
  }

  .tab-group-top .body slot::slotted(wa-tab-panel) {
    --padding: var(--wa-space-xl) 0;
  }

  /*
    * Bottom
    */

  .tab-group-bottom {
    flex-direction: column;
  }

  .tab-group-bottom .nav-container {
    order: 2;
  }

  .tab-group-bottom .nav {
    display: flex;
    overflow-x: auto;

    /* Hide scrollbar in Firefox */
    scrollbar-width: none;
  }

  /* Hide scrollbar in Chrome/Safari */
  .tab-group-bottom .nav::-webkit-scrollbar {
    width: 0;
    height: 0;
  }

  .tab-group-bottom .tabs {
    flex: 1 1 auto;
    position: relative;
    flex-direction: row;
    border-top: solid var(--safe-track-width) var(--track-color);
  }

  .tab-group-bottom .indicator {
    top: calc(-1 * var(--safe-track-width));
    border-top: solid var(--safe-track-width) var(--indicator-color);
  }

  .tab-group-bottom .body {
    order: 1;
  }

  .tab-group-bottom ::slotted(wa-tab[active]) {
    border-block-start: solid var(--safe-track-width) var(--indicator-color);
    margin-block-start: calc(-1 * var(--safe-track-width));
  }

  .tab-group-bottom .body slot::slotted(wa-tab-panel) {
    --padding: var(--wa-space-xl) 0;
  }

  /*
    * Start
    */

  .tab-group-start {
    flex-direction: row;
  }

  .tab-group-start .nav-container {
    order: 1;
  }

  .tab-group-start .tabs {
    flex: 0 0 auto;
    flex-direction: column;
    border-inline-end: solid var(--safe-track-width) var(--track-color);
  }

  .tab-group-start .indicator {
    inset-inline-end: calc(-1 * var(--safe-track-width));
    border-right: solid var(--safe-track-width) var(--indicator-color);
  }

  .tab-group-start .body {
    flex: 1 1 auto;
    order: 2;
  }

  .tab-group-start ::slotted(wa-tab[active]) {
    border-inline-end: solid var(--safe-track-width) var(--indicator-color);
    margin-inline-end: calc(-1 * var(--safe-track-width));
  }

  .tab-group-start .body slot::slotted(wa-tab-panel) {
    --padding: 0 var(--wa-space-xl);
  }

  /*
    * End
    */

  .tab-group-end {
    flex-direction: row;
  }

  .tab-group-end .nav-container {
    order: 2;
  }

  .tab-group-end .tabs {
    flex: 0 0 auto;
    flex-direction: column;
    border-left: solid var(--safe-track-width) var(--track-color);
  }

  .tab-group-end .indicator {
    inset-inline-start: calc(-1 * var(--safe-track-width));
    border-inline-start: solid var(--safe-track-width) var(--indicator-color);
  }

  .tab-group-end .body {
    flex: 1 1 auto;
    order: 1;
  }

  .tab-group-end ::slotted(wa-tab[active]) {
    border-inline-start: solid var(--safe-track-width) var(--indicator-color);
    margin-inline-start: calc(-1 * var(--safe-track-width));
  }

  .tab-group-end .body slot::slotted(wa-tab-panel) {
    --padding: 0 var(--wa-space-xl);
  }
`,pa=class extends V{constructor(){super(...arguments),this.tabs=[],this.focusableTabs=[],this.panels=[],this.localize=new Ct(this),this.hasScrollControls=!1,this.active=``,this.placement=`top`,this.activation=`auto`,this.withoutScrollControls=!1}connectedCallback(){super.connectedCallback(),this.resizeObserver=new ResizeObserver(()=>{this.updateScrollControls()}),this.mutationObserver=new MutationObserver(e=>{e.some(e=>![`aria-labelledby`,`aria-controls`].includes(e.attributeName))&&setTimeout(()=>this.setAriaLabels());let t=e.filter(e=>e.target.closest(`wa-tab-group`)===this);if(t.some(e=>e.attributeName===`disabled`))this.syncTabsAndPanels();else if(t.some(e=>e.attributeName===`active`)){let e=t.filter(e=>e.attributeName===`active`&&e.target.tagName.toLowerCase()===`wa-tab`).map(e=>e.target).find(e=>e.active);e&&e.closest(`wa-tab-group`)===this&&this.setActiveTab(e)}}),this.updateComplete.then(()=>{this.syncTabsAndPanels(),this.mutationObserver.observe(this,{attributes:!0,childList:!0,subtree:!0}),this.resizeObserver.observe(this.nav),new IntersectionObserver((e,t)=>{if(e[0].intersectionRatio>0){if(this.setAriaLabels(),this.active){let e=this.tabs.find(e=>e.panel===this.active);e&&this.setActiveTab(e)}else this.setActiveTab(this.getActiveTab()??this.tabs[0],{emitEvents:!1});t.unobserve(e[0].target)}}).observe(this.tabGroup)})}disconnectedCallback(){super.disconnectedCallback(),this.mutationObserver?.disconnect(),this.nav&&this.resizeObserver?.unobserve(this.nav)}getAllTabs(){return[...this.shadowRoot.querySelector(`slot[name="nav"]`).assignedElements()].filter(e=>e.tagName.toLowerCase()===`wa-tab`)}getAllPanels(){return[...this.defaultSlot.assignedElements()].filter(e=>e.tagName.toLowerCase()===`wa-tab-panel`)}getActiveTab(){return this.tabs.find(e=>e.active)}handleClick(e){let t=e.target.closest(`wa-tab`);t?.closest(`wa-tab-group`)===this&&t!==null&&this.setActiveTab(t,{scrollBehavior:`smooth`})}handleKeyDown(e){let t=e.target.closest(`wa-tab`);if(t?.closest(`wa-tab-group`)===this){if([`Enter`,` `].includes(e.key)){t!==null&&(this.setActiveTab(t,{scrollBehavior:`smooth`}),e.preventDefault());return}if([`ArrowLeft`,`ArrowRight`,`ArrowUp`,`ArrowDown`,`Home`,`End`].includes(e.key)){let t=this.tabs.find(e=>e.matches(`:focus`)),n=this.localize.dir()===`rtl`,r=null;if(t?.tagName.toLowerCase()===`wa-tab`){if(e.key===`Home`)r=this.focusableTabs[0];else if(e.key===`End`)r=this.focusableTabs[this.focusableTabs.length-1];else if([`top`,`bottom`].includes(this.placement)&&e.key===(n?`ArrowRight`:`ArrowLeft`)||[`start`,`end`].includes(this.placement)&&e.key===`ArrowUp`){let e=this.tabs.findIndex(e=>e===t);r=this.findNextFocusableTab(e,`backward`)}else if([`top`,`bottom`].includes(this.placement)&&e.key===(n?`ArrowLeft`:`ArrowRight`)||[`start`,`end`].includes(this.placement)&&e.key===`ArrowDown`){let e=this.tabs.findIndex(e=>e===t);r=this.findNextFocusableTab(e,`forward`)}if(!r)return;r.tabIndex=0,r.focus({preventScroll:!0}),this.activation===`auto`?this.setActiveTab(r,{scrollBehavior:`smooth`}):this.tabs.forEach(e=>{e.tabIndex=e===r?0:-1}),[`top`,`bottom`].includes(this.placement)&&On(r,this.nav,`horizontal`),e.preventDefault()}}}}findNextFocusableTab(e,t){let n=null,r=t===`forward`?1:-1,i=e+r;for(;e<this.tabs.length;){if(n=this.tabs[i]||null,n===null){n=t===`forward`?this.focusableTabs[0]:this.focusableTabs[this.focusableTabs.length-1];break}if(!n.disabled)break;i+=r}return n}handleScrollToStart(){this.nav.scroll({left:this.localize.dir()===`rtl`?this.nav.scrollLeft+this.nav.clientWidth:this.nav.scrollLeft-this.nav.clientWidth,behavior:`smooth`})}handleScrollToEnd(){this.nav.scroll({left:this.localize.dir()===`rtl`?this.nav.scrollLeft-this.nav.clientWidth:this.nav.scrollLeft+this.nav.clientWidth,behavior:`smooth`})}setActiveTab(e,t){if(t={emitEvents:!0,scrollBehavior:`auto`,...t},e.closest(`wa-tab-group`)===this&&e!==this.activeTab&&!e.disabled){let n=this.activeTab;this.active=e.panel,this.activeTab=e,this.tabs.forEach(e=>{e.active=e===this.activeTab,e.tabIndex=e===this.activeTab?0:-1}),this.panels.forEach(e=>e.active=e.name===this.activeTab?.panel),[`top`,`bottom`].includes(this.placement)&&On(this.activeTab,this.nav,`horizontal`,t.scrollBehavior),t.emitEvents&&(n&&this.dispatchEvent(new da({name:n.panel})),this.dispatchEvent(new ua({name:this.activeTab.panel})))}}setAriaLabels(){this.tabs.forEach(e=>{let t=this.panels.find(t=>t.name===e.panel);t&&(e.setAttribute(`aria-controls`,t.getAttribute(`id`)),t.setAttribute(`aria-labelledby`,e.getAttribute(`id`)))})}syncTabsAndPanels(){this.tabs=this.getAllTabs(),this.focusableTabs=this.tabs.filter(e=>!e.disabled),this.panels=this.getAllPanels(),this.updateComplete.then(()=>this.updateScrollControls())}updateActiveTab(){let e=this.tabs.find(e=>e.panel===this.active);e&&this.setActiveTab(e,{scrollBehavior:`smooth`})}updateScrollControls(){this.hasScrollControls=!this.withoutScrollControls&&[`top`,`bottom`].includes(this.placement)&&this.nav.scrollWidth>this.nav.clientWidth+1}render(){let e=this.hasUpdated?this.localize.dir()===`rtl`:this.dir===`rtl`;return j`
      <div
        part="base tab-group"
        class=${K({"tab-group":!0,"tab-group-top":this.placement===`top`,"tab-group-bottom":this.placement===`bottom`,"tab-group-start":this.placement===`start`,"tab-group-end":this.placement===`end`,"tab-group-has-scroll-controls":this.hasScrollControls})}
        @click=${this.handleClick}
        @keydown=${this.handleKeyDown}
      >
        <div class="nav-container" part="nav">
          ${this.hasScrollControls?j`
                <wa-button
                  part="scroll-button scroll-button-start"
                  exportparts="base:scroll-button__base"
                  class="scroll-button scroll-button-start"
                  appearance="plain"
                  @click=${this.handleScrollToStart}
                >
                  <wa-icon
                    name=${e?`chevron-right`:`chevron-left`}
                    library="system"
                    variant="solid"
                    label=${this.localize.term(`scrollToStart`)}
                  ></wa-icon>
                </wa-button>
              `:``}

          <!-- We have a focus listener because in Firefox (and soon to be Chrome) overflow containers are focusable. -->
          <div class="nav" @focus=${()=>this.activeTab?.focus({preventScroll:!0})}>
            <div part="tabs" class="tabs" role="tablist">
              <slot name="nav" @slotchange=${this.syncTabsAndPanels}></slot>
            </div>
          </div>

          ${this.hasScrollControls?j`
                <wa-button
                  part="scroll-button scroll-button-end"
                  class="scroll-button scroll-button-end"
                  exportparts="base:scroll-button__base"
                  appearance="plain"
                  @click=${this.handleScrollToEnd}
                >
                  <wa-icon
                    name=${e?`chevron-left`:`chevron-right`}
                    library="system"
                    variant="solid"
                    label=${this.localize.term(`scrollToEnd`)}
                  ></wa-icon>
                </wa-button>
              `:``}
        </div>

        <div part="body" class="body"><slot @slotchange=${this.syncTabsAndPanels}></slot></div>
      </div>
    `}};pa.css=fa,F([B(`.tab-group`)],pa.prototype,`tabGroup`,2),F([B(`.body slot`)],pa.prototype,`defaultSlot`,2),F([B(`.nav`)],pa.prototype,`nav`,2),F([z()],pa.prototype,`hasScrollControls`,2),F([R({reflect:!0})],pa.prototype,`active`,2),F([R()],pa.prototype,`placement`,2),F([R()],pa.prototype,`activation`,2),F([R({attribute:`without-scroll-controls`,type:Boolean})],pa.prototype,`withoutScrollControls`,2),F([U(`active`)],pa.prototype,`updateActiveTab`,1),F([U(`withoutScrollControls`,{waitUntilFirstUpdate:!0})],pa.prototype,`updateScrollControls`,1),pa=F([I(`wa-tab-group`)],pa);var ma=h`
  :host {
    --padding: 0;

    display: none;
  }

  :host([active]) {
    display: block;
  }

  .tab-panel {
    display: block;
    padding: var(--padding);
  }
`,ha=0,ga=class extends V{constructor(){super(...arguments),this.attrId=++ha,this.componentId=`wa-tab-panel-${this.attrId}`,this.name=``,this.active=!1,this.role=`tabpanel`}connectedCallback(){super.connectedCallback(),this.id=(this.id||``).length>0?this.id:this.componentId}handleActiveChange(){this.setAttribute(`aria-hidden`,this.active?`false`:`true`)}render(){return j`
      <slot
        part="base"
        class=${K({"tab-panel":!0,"tab-panel-active":this.active})}
      ></slot>
    `}};ga.css=ma,F([R({reflect:!0})],ga.prototype,`name`,2),F([R({type:Boolean,reflect:!0})],ga.prototype,`active`,2),F([R({reflect:!0})],ga.prototype,`role`,2),F([U(`active`)],ga.prototype,`handleActiveChange`,1),ga=F([I(`wa-tab-panel`)],ga);var _a=h`
  :host {
    border-width: 0;
  }

  .textarea {
    display: grid;
    align-items: center;
    margin: 0;
    border: none;
    outline: none;
    cursor: inherit;
    font: inherit;
    background-color: var(--wa-form-control-background-color);
    border-color: var(--wa-form-control-border-color);
    border-radius: var(--wa-form-control-border-radius);
    border-style: var(--wa-form-control-border-style);
    border-width: var(--wa-form-control-border-width);
    -webkit-appearance: none;
    outline: var(--wa-focus-ring-style) var(--wa-focus-ring-width) transparent;
    outline-offset: var(--wa-focus-ring-offset);

    &:focus-within {
      outline-color: var(--wa-color-focus);
    }

    /* Style disabled textareas */
    &:has(:disabled) {
      cursor: not-allowed;
      opacity: 0.5;
    }
  }

  /* Appearance modifiers */
  :host([appearance='outlined']) .textarea {
    background-color: var(--wa-form-control-background-color);
    border-color: var(--wa-form-control-border-color);
  }

  :host([appearance='filled']) .textarea {
    background-color: var(--wa-color-neutral-fill-quiet);
    border-color: var(--wa-color-neutral-fill-quiet);
  }

  :host([appearance='filled-outlined']) .textarea {
    background-color: var(--wa-color-neutral-fill-quiet);
    border-color: var(--wa-form-control-border-color);
  }

  textarea {
    display: block;
    width: 100%;
    border: none;
    background: transparent;
    font: inherit;
    color: inherit;
    cursor: inherit;
    scroll-padding-block: var(--wa-form-control-padding-block);
    padding: calc(var(--wa-form-control-padding-block) - ((1lh - 1em) / 2)) var(--wa-form-control-padding-inline); /* accounts for the larger line height of textarea content */
    min-height: calc(var(--wa-form-control-height) - var(--border-width) * 2);
    box-shadow: none;
    margin: 0;

    &::placeholder {
      color: var(--wa-form-control-placeholder-color);
      user-select: none;
      -webkit-user-select: none;
    }

    &:autofill {
      &,
      &:hover,
      &:focus,
      &:active {
        box-shadow: none;
        caret-color: var(--wa-form-control-value-color);
      }
    }

    &:focus {
      outline: none;
    }
  }

  /* Shared textarea and size-adjuster positioning */
  .control,
  .size-adjuster {
    grid-area: 1 / 1 / 2 / 2;
  }

  .size-adjuster {
    visibility: hidden;
    pointer-events: none;
    opacity: 0;
    padding: 0;
  }

  textarea::-webkit-search-decoration,
  textarea::-webkit-search-cancel-button,
  textarea::-webkit-search-results-button,
  textarea::-webkit-search-results-decoration {
    -webkit-appearance: none;
  }

  /*
   * Resize types
   */

  :host([resize='none']) textarea {
    resize: none;
  }

  textarea,
  :host([resize='vertical']) textarea {
    resize: vertical;
  }

  :host([resize='horizontal']) textarea {
    resize: horizontal;
  }

  :host([resize='both']) textarea {
    resize: both;
  }

  :host([resize='auto']) textarea {
    height: auto;
    resize: none;
    overflow-y: hidden;
  }

  /*
   * Footer (hint + character count)
   */

  /*
   * This element carries the hint part, so the shared form control styles apply to it. Those styles set display:block
   * and hide the element when it has no hint, both of which have to be undone when a character count is present.
   */
  .footer.has-slotted,
  .footer.has-count {
    display: flex;
    align-items: baseline;
    gap: 1em;
  }

  /* Slots default to display:contents, which would leave the hint unable to shrink below its content */
  .footer.has-count .hint {
    display: block;
    flex: 1 1 auto;
    min-width: 0;
  }

  .count {
    flex: 0 0 auto;
    color: var(--wa-form-control-hint-color);
    font-weight: var(--wa-form-control-hint-font-weight);
    line-height: var(--wa-form-control-hint-line-height);
    margin-block-start: 0.5em;
    font-size: var(--wa-font-size-smaller);
    margin-inline-start: auto;
  }
`,va=h`
  .wa-visually-hidden:not(:focus-within),
  .wa-visually-hidden-force,
  .wa-visually-hidden-hint::part(hint),
  .wa-visually-hidden-label::part(label),
  .wa-visually-hidden-label::part(form-control-label) {
    position: absolute !important;
    width: 1px !important;
    height: 1px !important;
    clip: rect(0 0 0 0) !important;
    clip-path: inset(50%) !important;
    border: none !important;
    overflow: hidden !important;
    white-space: nowrap !important;
    padding: 0 !important;
  }
`,$=class extends st{constructor(){super(...arguments),this.assumeInteractionOn=[`blur`,`input`],this.hasSlotController=new H(this,`hint`,`label`),this.localize=new Ct(this),this.announcedCountText=``,this.title=``,this.name=null,this._value=null,this.defaultValue=this.getAttribute(`value`)??``,this.size=`m`,this.appearance=`outlined`,this.label=``,this.hint=``,this.placeholder=``,this.rows=4,this.resize=`vertical`,this.disabled=!1,this.readonly=!1,this.required=!1,this.spellcheck=!0,this.withLabel=!1,this.withHint=!1,this.withCount=!1,this.lastObservedWidth=0}static get validators(){return[...super.validators,it()]}get value(){return this.valueHasChanged?this._value:this._value??this.defaultValue}set value(e){this._value!==e&&(this.valueHasChanged=!0,this._value=e)}handleSizeChange(){dt(this.localName,this.size)}connectedCallback(){super.connectedCallback(),this.updateComplete.then(()=>{if(this.setTextareaDimensions(),this.updateResizeObserver(),this.didSSR&&this.input&&this.value!==this.input.value){let e=this.input.value;this.value=e}})}disconnectedCallback(){super.disconnectedCallback(),clearTimeout(this.countAnnounceTimeout),this.resizeObserver?.disconnect(),this.resizeObserver=void 0}updateFormValue(e){if(e==null){this.setValue(``,null);return}super.updateFormValue(e)}updateResizeObserver(){let e=this.resize!==`none`;this.resizeObserver&&=(this.resizeObserver.disconnect(),void 0),e&&this.input&&(this.resize===`auto`?(this.resizeObserver=new ResizeObserver(e=>{let t=e[0]?.contentRect.width??0;t!==this.lastObservedWidth&&(this.lastObservedWidth=t,requestAnimationFrame(()=>this.setTextareaDimensions()))}),this.resizeObserver.observe(this)):(this.resizeObserver=new ResizeObserver(()=>this.setTextareaDimensions()),this.resizeObserver.observe(this.input)))}handleBlur(){this.checkValidity()}handleChange(e){this.valueHasChanged=!0,this.value=this.input.value,this.setTextareaDimensions(),this.checkValidity(),this.relayNativeEvent(e,{bubbles:!0,composed:!0})}handleInput(e){this.valueHasChanged=!0,this.value=this.input.value,this.relayNativeEvent(e,{bubbles:!0,composed:!0}),this.scheduleCountAnnouncement()}scheduleCountAnnouncement(){clearTimeout(this.countAnnounceTimeout),this.countAnnounceTimeout=setTimeout(()=>{let e=(this.value??``).length;this.announcedCountText=this.maxlength==null?this.localize.term(`numCharacters`,e):this.localize.term(`numCharactersRemaining`,this.maxlength-e)},1e3)}setTextareaDimensions(){if(this.resize===`none`){this.base.style.width=``,this.base.style.height=``;return}if(this.resize===`auto`){this.sizeAdjuster.style.height=`${this.input.clientHeight}px`,this.input.style.height=`auto`;let e=this.input.scrollHeight;this.input.style.height=`${e}px`,this.sizeAdjuster.style.height=`${e}px`,this.base.style.width=``,this.base.style.height=``;return}if(this.input.style.width){let e=Number(this.input.style.width.split(/px/)[0])+2;this.base.style.width=`${e}px`}if(this.input.style.height){let e=Number(this.input.style.height.split(/px/)[0])+2;this.base.style.height=`${e}px`}}handleRowsChange(){this.setTextareaDimensions()}async handleValueChange(){await this.updateComplete,this.checkValidity(),this.setTextareaDimensions()}updated(e){e.has(`resize`)&&(this.setTextareaDimensions(),this.updateResizeObserver()),super.updated(e),e.has(`value`)&&this.customStates.set(`blank`,!this.value)}focus(e){this.input.focus(e)}blur(){this.input.blur()}select(){this.input.select()}scrollPosition(e){if(e){typeof e.top==`number`&&(this.input.scrollTop=e.top),typeof e.left==`number`&&(this.input.scrollLeft=e.left);return}return{top:this.input.scrollTop,left:this.input.scrollTop}}setSelectionRange(e,t,n=`none`){this.input.setSelectionRange(e,t,n)}setRangeText(e,t,n,r=`preserve`){let i=t??this.input.selectionStart,a=n??this.input.selectionEnd;this.input.setRangeText(e,i,a,r),this.value!==this.input.value&&(this.value=this.input.value,this.setTextareaDimensions())}formResetCallback(){this._value=null,this.input&&(this.input.value=this.value||``),super.formResetCallback()}render(){let e=this.hasSlotController.test(`label`,`withLabel`),t=this.hasSlotController.test(`hint`,`withHint`),n=this.label?!0:!!e,r=this.hint?!0:!!t,i=(this.value??``).length,a=this.maxlength==null?this.localize.term(`numCharacters`,i):this.localize.term(`numCharactersRemaining`,this.maxlength-i);return j`
      <label
        part="form-control-label label"
        class=${K({label:!0,"has-label":n})}
        for="input"
        aria-hidden=${n?`false`:`true`}
      >
        <slot name="label">${this.label}</slot>
      </label>

      <div part="base textarea-wrapper" class="textarea">
        <textarea
          part="textarea"
          id="input"
          class="control"
          title=${this.title}
          name=${q(this.name)}
          .value=${Xn(this.value)}
          ?disabled=${this.disabled}
          ?readonly=${this.readonly}
          ?required=${this.required}
          placeholder=${q(this.placeholder)}
          rows=${q(this.rows)}
          minlength=${q(this.minlength)}
          maxlength=${q(this.maxlength)}
          autocapitalize=${q(this.autocapitalize)}
          autocorrect=${q(this.autocorrect)}
          ?autofocus=${this.autofocus}
          spellcheck=${q(this.spellcheck)}
          enterkeyhint=${q(this.enterkeyhint)}
          inputmode=${q(this.inputmode)}
          aria-describedby="hint"
          @change=${this.handleChange}
          @input=${this.handleInput}
          @blur=${this.handleBlur}
        ></textarea>

        <!-- This "adjuster" exists to prevent layout shifting. https://github.com/shoelace-style/shoelace/issues/2180 -->
        <div part="textarea-adjuster" class="size-adjuster" ?hidden=${this.resize!==`auto`}></div>
      </div>

      <div
        part="hint"
        class=${K({footer:!0,"has-count":this.withCount,"has-slotted":r})}
      >
        <slot id="hint" name="hint" class="hint" aria-hidden=${r?`false`:`true`}>${this.hint}</slot>

        ${this.withCount?j`
              <div part="count" class="count" aria-hidden="true">${a}</div>
              <div class="wa-visually-hidden-force" aria-live="polite">${this.announcedCountText}</div>
            `:``}
      </div>
    `}};$.css=[_a,Yn,ft,va],F([z()],$.prototype,`announcedCountText`,2),F([B(`.control`)],$.prototype,`input`,2),F([B(`[part~="base"]`)],$.prototype,`base`,2),F([B(`.size-adjuster`)],$.prototype,`sizeAdjuster`,2),F([R()],$.prototype,`title`,2),F([R({reflect:!0})],$.prototype,`name`,2),F([z()],$.prototype,`value`,1),F([R({attribute:`value`,reflect:!0})],$.prototype,`defaultValue`,2),F([R({reflect:!0})],$.prototype,`size`,2),F([U(`size`)],$.prototype,`handleSizeChange`,1),F([R({reflect:!0})],$.prototype,`appearance`,2),F([R()],$.prototype,`label`,2),F([R({attribute:`hint`})],$.prototype,`hint`,2),F([R()],$.prototype,`placeholder`,2),F([R({type:Number})],$.prototype,`rows`,2),F([R({reflect:!0})],$.prototype,`resize`,2),F([R({type:Boolean})],$.prototype,`disabled`,2),F([R({type:Boolean,reflect:!0})],$.prototype,`readonly`,2),F([R({type:Boolean,reflect:!0})],$.prototype,`required`,2),F([R({type:Number})],$.prototype,`minlength`,2),F([R({type:Number})],$.prototype,`maxlength`,2),F([R()],$.prototype,`autocapitalize`,2),F([R({type:Boolean,converter:{fromAttribute:e=>!(!e||e===`off`),toAttribute:e=>e?`on`:`off`}})],$.prototype,`autocorrect`,2),F([R()],$.prototype,`autocomplete`,2),F([R({type:Boolean})],$.prototype,`autofocus`,2),F([R()],$.prototype,`enterkeyhint`,2),F([R({type:Boolean,converter:{fromAttribute:e=>!(!e||e===`false`),toAttribute:e=>e?`true`:`false`}})],$.prototype,`spellcheck`,2),F([R()],$.prototype,`inputmode`,2),F([R({attribute:`with-label`,type:Boolean})],$.prototype,`withLabel`,2),F([R({attribute:`with-hint`,type:Boolean})],$.prototype,`withHint`,2),F([R({attribute:`with-count`,type:Boolean,reflect:!0})],$.prototype,`withCount`,2),F([U(`rows`,{waitUntilFirstUpdate:!0})],$.prototype,`handleRowsChange`,1),F([U(`value`,{waitUntilFirstUpdate:!0})],$.prototype,`handleValueChange`,1),$=F([I(`wa-textarea`)],$),$.disableWarning?.(`change-in-update`);var ya=h`
  :host {
    --gap: var(--wa-space-s);
    --width: 28rem;
    --reorder-duration: var(--wa-transition-normal);

    display: flex;
    flex-direction: column;
    position: fixed;
    width: var(--width);
    height: 100dvh;
    max-height: 100dvh;
    margin: 0;
    padding: var(--wa-space-m);
    overflow-y: auto;
    gap: var(--gap);
    border: none;
    background: transparent;
    pointer-events: none;
    scrollbar-width: thin;

    /* Reset inset properties so placement changes work correctly */
    inset-block-start: auto;
    inset-block-end: auto;
    inset-inline-start: auto;
    inset-inline-end: auto;
    translate: none;
    align-content: normal;
    justify-content: normal;
  }

  :host(:not(:popover-open)) {
    display: none;
  }

  /* Placement positioning using logical properties for RTL support */
  :host([placement='top-start']) {
    inset-block-start: 0;
    inset-inline-start: 0;
  }

  :host([placement='top-center']) {
    inset-block-start: 0;
    inset-inline-start: 50%;
    translate: -50% 0;
  }

  :host([placement='top-end']) {
    inset-block-start: 0;
    inset-inline-start: auto;
    inset-inline-end: 0;
  }

  :host([placement='bottom-start']) {
    inset-block-end: 0;
    inset-inline-start: 0;
    align-content: end;
  }

  :host([placement='bottom-center']) {
    inset-block-end: 0;
    inset-inline-start: 50%;
    translate: -50% 0;
    align-content: end;
  }

  :host([placement='bottom-end']) {
    inset-block-end: 0;
    inset-inline-start: auto;
    inset-inline-end: 0;
    align-content: end;
  }

  /* Bottom placements: justify content to end */
  :host([placement^='bottom']) {
    justify-content: end;
  }

  .stack {
    display: flex;
    flex-direction: column;
    gap: var(--gap);
    width: 100%;
    pointer-events: auto;
  }

  /* Bottom placements: reverse stack order so newest appears at bottom */
  :host([placement^='bottom']) .stack {
    flex-direction: column-reverse;
  }

  /* Mobile: full width */
  @media (max-width: 480px) {
    :host {
      width: 100%;
      padding: var(--wa-space-s);
    }
  }
`,ba=`useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict`,xa=(e=21)=>{let t=``,n=crypto.getRandomValues(new Uint8Array(e|=0));for(;e--;)t+=ba[n[e]&63];return t};function Sa(e=``){return`${e}${xa()}`}var Ca=null,wa=0;function Ta(){if(wa+=1,Ca||typeof document>`u`)return;let e=document.createElement(`div`);e.id=Sa(`wa-toast-live-region-`),e.setAttribute(`data-wa-toast-live-region`,``),e.style.cssText=`
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    white-space: nowrap;
    clip-path: inset(50%);
    pointer-events: none;
    top: 0;
    left: 0;
  `,document.body.append(e),Ca=e}function Ea(){wa=Math.max(0,wa-1),!(wa>0)&&(Ca?.remove(),Ca=null)}function Da(e,t){if(typeof document>`u`)return;let n=Ca;if(!n)return;let r=e.trim();if(!r)return;let i=document.createElement(`div`);i.setAttribute(`role`,t===`danger`?`alert`:`status`),i.setAttribute(`aria-live`,t===`danger`?`assertive`:`polite`),i.setAttribute(`aria-atomic`,`true`),n.append(i),requestAnimationFrame(()=>{requestAnimationFrame(()=>{i.textContent=r})}),setTimeout(()=>i.remove(),1e3)}var Oa=class extends V{constructor(){super(...arguments),this.activatedToastItems=new WeakSet,this.positionCache=new Map,this.placement=`top-end`,this.handleDocumentKeyDown=async e=>{if(await new Promise(e=>setTimeout(e)),e.key===`Escape`&&!e.defaultPrevented){let t=this.getToastItems();t.length>0&&(e.preventDefault(),t[t.length-1]?.hide())}},this.handleAfterHide=async e=>{let t=e.target;t.parentElement===this&&(this.capturePositions(),t.remove(),await this.animatePositions()),this.getToastItems().length===0&&this.hideStack()}}connectedCallback(){super.connectedCallback(),this.popover=`manual`,Ta(),document.addEventListener(`keydown`,this.handleDocumentKeyDown)}disconnectedCallback(){super.disconnectedCallback(),document.removeEventListener?.(`keydown`,this.handleDocumentKeyDown),Ea()}handleSlotChange(){let e=this.getToastItems(),t=[];e.forEach(e=>{this.activatedToastItems.has(e)||t.push(e)}),t.length>0&&(this.capturePositions(),t.forEach(e=>{this.activatedToastItems.add(e),this.showStack(),e.startTimer(),this.announceToastItem(e)}),requestAnimationFrame(()=>this.animatePositions()))}announceToastItem(e){Da(e.textContent??``,e.variant)}getToastItems(){return[...this.querySelectorAll(`:scope > wa-toast-item`)]}capturePositions(){this.positionCache.clear();for(let e of this.getToastItems())this.positionCache.set(e,e.getBoundingClientRect())}async animatePositions(){if(Vn()){this.positionCache.clear();return}let e=[];for(let t of this.getToastItems()){let n=this.positionCache.get(t);if(!n)continue;let r=t.getBoundingClientRect(),i=n.top-r.top;if(Math.abs(i)>1){let n=zn(t,[{transform:`translateY(${i}px)`},{transform:`translateY(0)`}],{duration:200,easing:`cubic-bezier(0.2, 0, 0, 1)`});e.push(n)}}this.positionCache.clear(),await Promise.all(e)}showStack(){this.matches(`:popover-open`)||(this.showPopover(),this.customStates.set(`visible`,!0))}hideStack(){this.matches(`:popover-open`)&&(this.hidePopover(),this.customStates.set(`visible`,!1))}async create(e,t){let n={allowHtml:!1,duration:5e3,variant:`neutral`,size:`m`,...t},r=document.createElement(`wa-toast-item`);if(r.variant=n.variant,r.size=n.size,r.duration=n.duration,n.allowHtml?r.innerHTML=e:r.textContent=e,n.icon){let e=document.createElement(`wa-icon`);e.setAttribute(`slot`,`icon`),typeof n.icon==`string`?e.setAttribute(`name`,n.icon):(e.setAttribute(`name`,n.icon.name),n.icon.library&&e.setAttribute(`library`,n.icon.library),n.icon.family&&e.setAttribute(`family`,n.icon.family),n.icon.variant&&e.setAttribute(`variant`,n.icon.variant)),r.prepend(e)}return this.activatedToastItems.add(r),this.capturePositions(),this.showStack(),this.prepend(r),await r.updateComplete,this.animatePositions(),r.startTimer(),this.announceToastItem(r),r}render(){return j`
      <div part="stack" class="stack" @wa-after-hide=${this.handleAfterHide}>
        <slot @slotchange=${this.handleSlotChange}></slot>
      </div>
    `}};Oa.css=ya,F([B(`.stack`)],Oa.prototype,`stack`,2),F([R({reflect:!0})],Oa.prototype,`placement`,2),Oa=F([I(`wa-toast`)],Oa);var ka=h`
  :host {
    --accent-width: 4px;
    --show-duration: var(--wa-transition-normal);
    --hide-duration: var(--wa-transition-normal);
    --accent-color: var(--wa-color-fill-loud);

    display: block;
    pointer-events: auto;
  }

  /* Sizes */
  :host([size='xs']) {
    --padding: var(--wa-space-xs);
  }
  :host([size='s']),
  :host([size='small']) {
    --padding: var(--wa-space-s);
  }
  :host([size='m']),
  :host([size='medium']) {
    --padding: var(--wa-space-m);
  }
  :host([size='l']),
  :host([size='large']) {
    --padding: var(--wa-space-l);
  }
  :host([size='xl']) {
    --padding: var(--wa-space-xl);
  }

  .toast-item {
    display: flex;
    align-items: stretch;
    background: var(--wa-color-surface-raised);
    border: var(--wa-border-width-s) solid var(--wa-color-surface-border);
    border-radius: var(--wa-border-radius-m);
    box-shadow: var(--wa-shadow-l);
    overflow: hidden;
  }

  /* Animations */
  .toast-item.show {
    animation: toast-show var(--show-duration) var(--wa-transition-easing) forwards;
  }

  .toast-item.hide {
    animation: toast-hide var(--hide-duration) var(--wa-transition-easing) forwards;
  }

  @keyframes toast-show {
    from {
      opacity: 0;
      translate: 0 -0.5rem;
    }
    to {
      opacity: 1;
      translate: 0;
    }
  }

  @keyframes toast-hide {
    from {
      opacity: 1;
      translate: 0;
    }
    to {
      opacity: 0;
      translate: 0 -0.5rem;
    }
  }

  /* Accent line */
  .accent {
    flex: 0 0 auto;
    width: var(--accent-width);
    background: var(--accent-color);
  }

  /* Icon - only show if slot has content */
  .icon {
    display: flex;
    align-items: center;
    padding: var(--padding);
    padding-inline-end: 0;
    color: var(--accent-color);
    font-size: 1.25em;
  }

  .toast-item:not(.toast-item--has-icon) .icon {
    display: none;
  }

  /* Content */
  .content {
    flex: 1 1 auto;
    align-self: center;
    min-width: 0;
    padding: var(--padding);
    color: var(--wa-color-text-normal);
  }

  /* Close button */
  .close-button {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    justify-content: center;
    align-self: stretch;
    padding-inline: var(--padding);
    background: transparent;
    border: none;
    border-start-end-radius: var(--border-radius);
    border-end-end-radius: var(--border-radius);
    color: var(--wa-color-neutral-on-quiet);
    font-size: inherit;
    cursor: pointer;
    transition: background-color var(--wa-transition-fast);

    @media (hover: hover) {
      &:hover {
        color: color-mix(in oklab, currentColor, var(--wa-color-mix-hover));
      }
    }

    &:focus {
      outline: none;
    }

    &:focus-visible {
      outline: var(--wa-focus-ring);
      outline-offset: calc(var(--wa-focus-ring-width) * -1);
    }
  }

  /* Progress ring styling */
  wa-progress-ring {
    --size: var(--wa-form-control-height);
    --track-width: 0.125rem;
    --indicator-width: 0.125rem;
    --track-color: var(--wa-color-neutral-fill-quiet);
    --indicator-color: var(--accent-color);
    --indicator-transition-duration: 50ms;
  }

  /* Hide progress ring indicator when no duration */
  .toast-item:not(.toast-item--has-duration) wa-progress-ring {
    --track-color: transparent;
    --indicator-color: transparent;
  }

  /* Reduced motion */
  @media (prefers-reduced-motion: reduce) {
    .toast-item.show,
    .toast-item.hide {
      animation: none;
    }
  }
`,Aa=class extends V{constructor(){super(...arguments),this.hasSlotController=new H(this,`icon`),this.localize=new Ct(this),this.animationFrame=null,this.startTime=null,this.isHovering=!1,this.isFocused=!1,this.timeLeft=100,this.variant=`neutral`,this.size=`m`,this.duration=5e3,this.withIcon=!1,this.tick=()=>{if(!this.startTime)return;let e=performance.now()-this.startTime,t=Math.min(e/this.duration,1);this.timeLeft=100*(1-t),t<1?this.animationFrame=requestAnimationFrame(this.tick):this.hide()},this.handlePointerEnter=e=>{(e.pointerType===`mouse`||e.pointerType===`pen`)&&(this.isHovering=!0,this.pauseTimer())},this.handlePointerLeave=()=>{this.isHovering&&(this.isHovering=!1,this.resumeTimer())},this.handleFocusIn=()=>{this.isFocused=!0,this.pauseTimer()},this.handleFocusOut=()=>{this.isFocused=!1,this.resumeTimer()}}handleSizeChange(){dt(this.localName,this.size)}connectedCallback(){super.connectedCallback(),this.addEventListener(`pointerenter`,this.handlePointerEnter),this.addEventListener(`pointerleave`,this.handlePointerLeave)}disconnectedCallback(){super.disconnectedCallback(),this.stopTimer(),this.removeEventListener(`pointerenter`,this.handlePointerEnter),this.removeEventListener(`pointerleave`,this.handlePointerLeave)}async startTimer(){let e=new An;this.dispatchEvent(e),!e.defaultPrevented&&(await this.updateComplete,await Bn(this.toastItemElement,`show`),this.dispatchEvent(new Nn),this.duration>0&&Number.isFinite(this.duration)&&(this.startTime=performance.now(),this.timeLeft=100,this.tick()))}stopTimer(){this.animationFrame!==null&&(cancelAnimationFrame(this.animationFrame),this.animationFrame=null)}async hide(){this.stopTimer();let e=new jn;this.dispatchEvent(e),!e.defaultPrevented&&(await Bn(this.toastItemElement,`hide`),this.dispatchEvent(new Mn),this.remove())}handleCloseClick(){this.hide()}pauseTimer(){this.stopTimer(),this.timeLeft=100}resumeTimer(){!this.isHovering&&!this.isFocused&&this.duration>0&&(this.startTime=performance.now(),this.tick())}render(){return j`
      <div
        part="toast-item"
        class=${K({"toast-item":!0,"toast-item--has-icon":this.hasUpdated?this.hasSlotController.test(`icon`):this.withIcon,"toast-item--has-duration":this.duration>0})}
      >
        <div part="accent" class="accent"></div>

        <div part="icon" class="icon">
          <slot name="icon"></slot>
        </div>

        <div part="content" class="content">
          <slot></slot>
        </div>

        <button
          part="close-button"
          class="close-button"
          type="button"
          aria-label=${this.localize.term(`close`)}
          @click=${this.handleCloseClick}
          @focusin=${this.handleFocusIn}
          @focusout=${this.handleFocusOut}
        >
          <wa-progress-ring
            part="progress-ring"
            exportparts="
              base:progress-ring__base,
              label:progress-ring__label,
              track:progress-ring__track,
              indicator:progress-ring__indicator
            "
            value=${this.timeLeft}
            aria-hidden="true"
          >
            <wa-icon
              part="close-icon"
              exportparts="svg:close-icon__svg"
              name="xmark"
              library="system"
              variant="solid"
            ></wa-icon>
          </wa-progress-ring>
        </button>
      </div>
    `}};Aa.css=[ka,Ve,ft],F([B(`.toast-item`)],Aa.prototype,`toastItemElement`,2),F([z()],Aa.prototype,`timeLeft`,2),F([R({reflect:!0})],Aa.prototype,`variant`,2),F([R({reflect:!0})],Aa.prototype,`size`,2),F([U(`size`)],Aa.prototype,`handleSizeChange`,1),F([R({type:Number})],Aa.prototype,`duration`,2),F([R({attribute:`with-icon`,type:Boolean})],Aa.prototype,`withIcon`,2),Aa=F([I(`wa-toast-item`)],Aa);var ja=h`
  :host {
    --size: 8rem;
    --track-width: 0.25em; /* avoid using rems here */
    --track-color: var(--wa-color-neutral-fill-normal);
    --indicator-width: var(--track-width);
    --indicator-color: var(--wa-color-brand-fill-loud);
    --indicator-transition-duration: 0.35s;

    display: inline-flex;
  }

  .progress-ring {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    position: relative;
  }

  .image {
    width: var(--size);
    height: var(--size);
    rotate: -90deg;
    transform-origin: 50% 50%;
  }

  .track,
  .indicator {
    --radius: calc(var(--size) / 2 - max(var(--track-width), var(--indicator-width)) * 0.5);
    --circumference: calc(var(--radius) * 2 * 3.141592654);

    fill: none;
    r: var(--radius);
    cx: calc(var(--size) / 2);
    cy: calc(var(--size) / 2);
  }

  .track {
    stroke: var(--track-color);
    stroke-width: var(--track-width);
  }

  .indicator {
    stroke: var(--indicator-color);
    stroke-width: var(--indicator-width);
    stroke-linecap: round;
    transition-property: stroke-dashoffset;
    transition-duration: var(--indicator-transition-duration);
    stroke-dasharray: var(--circumference) var(--circumference);
    stroke-dashoffset: calc(var(--circumference) - var(--percentage) * var(--circumference));
  }

  .label {
    display: flex;
    align-items: center;
    justify-content: center;
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    text-align: center;
    user-select: none;
    -webkit-user-select: none;
  }
`,Ma=`important`,Na=` !`+Ma,Pa=wt(class extends Tt{constructor(e){if(super(e),e.type!==G.ATTRIBUTE||e.name!==`style`||e.strings?.length>2)throw Error("The `styleMap` directive must be used in the `style` attribute and must be the only part in the attribute.")}render(e){return Object.keys(e).reduce((t,n)=>{let r=e[n];return r==null?t:t+`${n=n.includes(`-`)?n:n.replace(/(?:^(webkit|moz|ms|o)|)(?=[A-Z])/g,`-$&`).toLowerCase()}:${r};`},``)}update(e,[t]){let{style:n}=e.element;if(this.ft===void 0)return this.ft=new Set(Object.keys(t)),this.render(t);for(let e of this.ft)t[e]??(this.ft.delete(e),e.includes(`-`)?n.removeProperty(e):n[e]=null);for(let e in t){let r=t[e];if(r!=null){this.ft.add(e);let t=typeof r==`string`&&r.endsWith(Na);e.includes(`-`)||t?n.setProperty(e,t?r.slice(0,-11):r,t?Ma:``):n[e]=r}}return Ce}}),Fa=class extends V{constructor(){super(...arguments),this.localize=new Ct(this),this.value=0,this.label=``}updated(e){if(super.updated(e),e.has(`value`)){let e=parseFloat(getComputedStyle(this.indicator).getPropertyValue(`r`)),t=2*Math.PI*e,n=t-this.value/100*t;this.indicatorOffset=`${n}px`}}render(){return j`
      <div
        part="base progress-ring"
        class="progress-ring"
        role="progressbar"
        aria-label=${this.label.length>0?this.label:this.localize.term(`progress`)}
        aria-describedby="label"
        aria-valuemin="0"
        aria-valuemax="100"
        aria-valuenow="${this.value}"
        style=${Pa({"--percentage":this.value/100})}
      >
        <svg class="image">
          <circle part="track" class="track"></circle>
          <circle
            part="indicator"
            class="indicator"
            style=${Pa({"stroke-dashoffset":this.indicatorOffset})}
          ></circle>
        </svg>

        <slot id="label" part="label" class="label"></slot>
      </div>
    `}};Fa.css=ja,F([B(`.indicator`)],Fa.prototype,`indicator`,2),F([z()],Fa.prototype,`indicatorOffset`,2),F([R({type:Number,reflect:!0})],Fa.prototype,`value`,2),F([R()],Fa.prototype,`label`,2),Fa=F([I(`wa-progress-ring`)],Fa),Fa.disableWarning?.(`change-in-update`);var Ia=h`
  :host {
    --max-width: 30ch;

    /** These styles are added so we don't interfere in the DOM. */
    display: inline-block;
    position: absolute;

    /** Defaults for inherited CSS properties */
    color: var(--wa-tooltip-content-color);
    font-size: var(--wa-tooltip-font-size);
    line-height: var(--wa-tooltip-line-height);
    text-align: start;
    white-space: normal;
  }

  .tooltip {
    --arrow-size: var(--wa-tooltip-arrow-size);
    --arrow-color: var(--wa-tooltip-background-color);
  }

  .tooltip::part(popup) {
    z-index: 1000;
  }

  .tooltip[placement^='top']::part(popup) {
    transform-origin: bottom;
  }

  .tooltip[placement^='bottom']::part(popup) {
    transform-origin: top;
  }

  .tooltip[placement^='left']::part(popup) {
    transform-origin: right;
  }

  .tooltip[placement^='right']::part(popup) {
    transform-origin: left;
  }

  .body {
    display: block;
    width: max-content;
    max-width: var(--max-width);
    border-radius: var(--wa-tooltip-border-radius);
    background-color: var(--wa-tooltip-background-color);
    border: var(--wa-tooltip-border-width) var(--wa-tooltip-border-style) var(--wa-tooltip-border-color);
    padding: 0.25em 0.5em;
    user-select: none;
    -webkit-user-select: none;
  }

  .tooltip {
    --popup-border-width: var(--wa-tooltip-border-width);

    /* Inset box-shadow, not a border: Safari seams a clip-path edge that runs along a border. */
    &::part(arrow) {
      box-shadow: inset calc(-1 * var(--wa-tooltip-border-width)) calc(-1 * var(--wa-tooltip-border-width)) 0 0
        var(--wa-tooltip-border-color);
    }
  }
`;function La(e,t){for(;t;){if(t===e)return!0;t=t instanceof Element&&t.assignedSlot?t.assignedSlot:t.parentNode?t.parentNode:t instanceof ShadowRoot?t.host:null}return!1}var Ra=class extends V{constructor(){super(...arguments),this.dismissedByPress=!1,this.placement=`top`,this.disabled=!1,this.distance=8,this.open=!1,this.skidding=0,this.showDelay=150,this.hideDelay=0,this.trigger=`hover focus`,this.withoutArrow=!1,this.for=null,this.anchor=null,this.eventController=new AbortController,this.handleBlur=()=>{this.dismissedByPress=!1,this.hasTrigger(`focus`)&&this.hide()},this.handleClick=()=>{if(this.hasTrigger(`click`)){this.open?this.hide():this.show();return}this.hasTrigger(`manual`)||this.lightDismiss()},this.handleFocus=()=>{this.dismissedByPress||this.hasTrigger(`focus`)&&this.show()},this.handleMouseDown=()=>{this.hasTrigger(`click`)||this.hasTrigger(`manual`)||this.lightDismiss()},this.handleDocumentKeyDown=e=>{this.hasTrigger(`manual`)||e.key===`Escape`&&this.open&&Rn(this)&&(e.preventDefault(),e.stopPropagation(),this.hide())},this.handleDocumentClick=e=>{this.hasTrigger(`manual`)||this.anchor&&e.composedPath().includes(this.anchor)||this.hide()},this.handleMouseOver=()=>{this.dismissedByPress||this.hasTrigger(`hover`)&&(clearTimeout(this.hoverTimeout),this.hoverTimeout=window.setTimeout(()=>this.show(),this.showDelay))},this.handleMouseOut=e=>{let t=e.relatedTarget,n=!!(t&&this.anchor&&La(this.anchor,t)),r=!!(t&&La(this,t));n||r||(this.dismissedByPress=!1,this.hasTrigger(`hover`)&&(clearTimeout(this.hoverTimeout),this.hoverTimeout=window.setTimeout(()=>{this.hide()},this.hideDelay)))}}connectedCallback(){super.connectedCallback(),typeof document<`u`&&(this.eventController.signal.aborted&&(this.eventController=new AbortController),this.addEventListener(`mouseout`,this.handleMouseOut),this.dismissedByPress=!1,this.open&&(this.open=!1,this.updateComplete.then(()=>{this.open=!0})),this.id||=Sa(`wa-tooltip-`),this.for&&this.anchor?(this.anchor=null,this.handleForChange()):this.for&&this.handleForChange())}disconnectedCallback(){super.disconnectedCallback(),document.removeEventListener(`keydown`,this.handleDocumentKeyDown),document.removeEventListener(`click`,this.handleDocumentClick),Ln(this),this.eventController.abort(),this.anchor&&this.removeFromAriaLabelledBy(this.anchor,this.id)}firstUpdated(e){this.body.hidden=!this.open,this.open&&(this.popup.active=!0,this.popup.reposition()),super.firstUpdated(e)}lightDismiss(){clearTimeout(this.hoverTimeout),this.dismissedByPress=!0,this.hide()}hasTrigger(e){return this.trigger.split(` `).includes(e)}addToAriaLabelledBy(e,t){let n=(e.getAttribute(`aria-labelledby`)||``).split(/\s+/).filter(Boolean);n.includes(t)||(n.push(t),e.setAttribute(`aria-labelledby`,n.join(` `)))}removeFromAriaLabelledBy(e,t){let n=(e.getAttribute(`aria-labelledby`)||``).split(/\s+/).filter(Boolean).filter(e=>e!==t);n.length>0?e.setAttribute(`aria-labelledby`,n.join(` `)):e.removeAttribute(`aria-labelledby`)}async handleOpenChange(){if(this.open){if(this.disabled)return;let e=new An;if(this.dispatchEvent(e),e.defaultPrevented){this.open=!1;return}this.hasTrigger(`manual`)||(document.addEventListener(`keydown`,this.handleDocumentKeyDown,{signal:this.eventController.signal}),document.addEventListener(`click`,this.handleDocumentClick,{signal:this.eventController.signal}),In(this)),this.body.hidden=!1,this.popup.active=!0,await Bn(this.popup.popup,`show-with-scale`),this.popup.reposition(),this.dispatchEvent(new Nn)}else{let e=new jn;if(this.dispatchEvent(e),e.defaultPrevented){this.open=!0;return}document.removeEventListener(`keydown`,this.handleDocumentKeyDown),document.removeEventListener(`click`,this.handleDocumentClick),Ln(this),await Bn(this.popup.popup,`hide-with-scale`),this.popup.active=!1,this.body.hidden=!0,this.dispatchEvent(new Mn)}}handleForChange(){let e=this.getRootNode?.();if(!e)return;let t=this.for?e.getElementById?.(this.for):null,n=this.anchor;if(t===n)return;this.dismissedByPress=!1;let{signal:r}=this.eventController;t&&(this.addToAriaLabelledBy(t,this.id),t.addEventListener(`blur`,this.handleBlur,{capture:!0,signal:r}),t.addEventListener(`focus`,this.handleFocus,{capture:!0,signal:r}),t.addEventListener(`click`,this.handleClick,{signal:r}),t.addEventListener(`mousedown`,this.handleMouseDown,{signal:r}),t.addEventListener(`mouseover`,this.handleMouseOver,{signal:r}),t.addEventListener(`mouseout`,this.handleMouseOut,{signal:r})),n&&(this.removeFromAriaLabelledBy(n,this.id),n.removeEventListener(`blur`,this.handleBlur,{capture:!0}),n.removeEventListener(`focus`,this.handleFocus,{capture:!0}),n.removeEventListener(`click`,this.handleClick),n.removeEventListener(`mousedown`,this.handleMouseDown),n.removeEventListener(`mouseover`,this.handleMouseOver),n.removeEventListener(`mouseout`,this.handleMouseOut)),this.anchor=t}async handleOptionsChange(){this.hasUpdated&&(await this.updateComplete,this.popup.reposition())}handleDisabledChange(){this.disabled&&this.open&&this.hide()}async show(){if(!this.open)return this.open=!0,nr(this,`wa-after-show`)}async hide(){if(this.open)return this.open=!1,nr(this,`wa-after-hide`)}render(){return j`
      <wa-popup
        part="base tooltip"
        exportparts="
          popup:base__popup,
          arrow:base__arrow
        "
        class=${K({tooltip:!0,"tooltip-open":this.open})}
        placement=${this.placement}
        distance=${this.distance}
        skidding=${this.skidding}
        flip
        shift
        ?arrow=${!this.withoutArrow}
        hover-bridge
        .anchor=${this.anchor}
      >
        <div part="body" class="body">
          <slot></slot>
        </div>
      </wa-popup>
    `}};Ra.css=Ia,Ra.dependencies={"wa-popup":Q},F([B(`slot:not([name])`)],Ra.prototype,`defaultSlot`,2),F([B(`.body`)],Ra.prototype,`body`,2),F([B(`wa-popup`)],Ra.prototype,`popup`,2),F([R()],Ra.prototype,`placement`,2),F([R({type:Boolean,reflect:!0})],Ra.prototype,`disabled`,2),F([R({type:Number})],Ra.prototype,`distance`,2),F([R({type:Boolean,reflect:!0})],Ra.prototype,`open`,2),F([R({type:Number})],Ra.prototype,`skidding`,2),F([R({attribute:`show-delay`,type:Number})],Ra.prototype,`showDelay`,2),F([R({attribute:`hide-delay`,type:Number})],Ra.prototype,`hideDelay`,2),F([R()],Ra.prototype,`trigger`,2),F([R({attribute:`without-arrow`,type:Boolean,reflect:!0})],Ra.prototype,`withoutArrow`,2),F([R()],Ra.prototype,`for`,2),F([z()],Ra.prototype,`anchor`,2),F([U(`open`,{waitUntilFirstUpdate:!0})],Ra.prototype,`handleOpenChange`,1),F([U(`for`)],Ra.prototype,`handleForChange`,1),F([U([`distance`,`placement`,`skidding`])],Ra.prototype,`handleOptionsChange`,1),F([U(`disabled`)],Ra.prototype,`handleDisabledChange`,1),Ra=F([I(`wa-tooltip`)],Ra);var za=`modulepreload`,Ba=function(e){return`/`+e},Va={},Ha=function(e,t,n){let r=Promise.resolve();if(t&&t.length>0){let e=document.getElementsByTagName(`link`),i=document.querySelector(`meta[property=csp-nonce]`),a=i?.nonce||i?.getAttribute(`nonce`);function o(e){return Promise.all(e.map(e=>Promise.resolve(e).then(e=>({status:`fulfilled`,value:e}),e=>({status:`rejected`,reason:e}))))}function s(e){return import.meta.resolve?import.meta.resolve(e):new URL(e,import.meta.url).href}r=o(t.map(t=>{if(t=Ba(t,n),t=s(t),t in Va)return;Va[t]=!0;let r=t.endsWith(`.css`);for(let n=e.length-1;n>=0;n--){let i=e[n];if(i.href===t&&(!r||i.rel===`stylesheet`))return}let i=document.createElement(`link`);if(i.rel=r?`stylesheet`:za,r||(i.as=`script`),i.crossOrigin=``,i.href=t,a&&i.setAttribute(`nonce`,a),document.head.appendChild(i),r)return new Promise((e,n)=>{i.addEventListener(`load`,e),i.addEventListener(`error`,()=>n(Error(`Unable to preload CSS for ${t}`)))})}))}function i(e){let t=new Event(`vite:preloadError`,{cancelable:!0});if(t.payload=e,window.dispatchEvent(t),!t.defaultPrevented)throw e}return r.then(t=>{for(let e of t||[])e.status===`rejected`&&i(e.reason);return e().catch(i)})};new MutationObserver(e=>{for(let{addedNodes:t}of e)for(let e of t)e.nodeType===Node.ELEMENT_NODE&&Ua(e)});async function Ua(e){let t=e instanceof Element?e.tagName.toLowerCase():``,n=t?.startsWith(`wa-`),r=[...e.querySelectorAll(`:not(:defined)`)].map(e=>e.tagName.toLowerCase()).filter(e=>e.startsWith(`wa-`));n&&!customElements.get(t)&&r.push(t);let i=e.querySelectorAll(`[data-wa-preload]`),a=e instanceof Element&&e.hasAttribute(`data-wa-preload`)?[e,...i]:i;for(let e of a)r.push(...e.getAttribute(`data-wa-preload`).split(/\s+/).filter(e=>e.startsWith(`wa-`)));let o=[...new Set(r)],s=await Promise.allSettled(o.map(e=>Wa(e)));for(let e of s)e.status===`rejected`&&console.warn(e.reason);await new Promise(requestAnimationFrame),e.dispatchEvent(new CustomEvent(`wa-discovery-complete`,{bubbles:!1,cancelable:!1,composed:!0}))}function Wa(e){if(customElements.get(e))return Promise.resolve();let t=e.replace(/^wa-/i,``),n=zt(`components/${t}/${t}.js`);return new Promise((t,r)=>{Ha(()=>import(n).then(()=>t()),[]).catch(()=>r(Error(`Unable to autoload <${e}> from ${n}`)))})}var Ga=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free 7.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M297.4 438.6C309.9 451.1 330.2 451.1 342.7 438.6L502.7 278.6C515.2 266.1 515.2 245.8 502.7 233.3C490.2 220.8 469.9 220.8 457.4 233.3L320 370.7L182.6 233.4C170.1 220.9 149.8 220.9 137.3 233.4C124.8 245.9 124.8 266.2 137.3 278.7L297.3 438.7z"/></svg>\r
`,Ka=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free 7.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M201.4 297.4C188.9 309.9 188.9 330.2 201.4 342.7L361.4 502.7C373.9 515.2 394.2 515.2 406.7 502.7C419.2 490.2 419.2 469.9 406.7 457.4L269.3 320L406.6 182.6C419.1 170.1 419.1 149.8 406.6 137.3C394.1 124.8 373.8 124.8 361.3 137.3L201.3 297.3z"/></svg>`,qa=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free 7.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M439.1 297.4C451.6 309.9 451.6 330.2 439.1 342.7L279.1 502.7C266.6 515.2 246.3 515.2 233.8 502.7C221.3 490.2 221.3 469.9 233.8 457.4L371.2 320L233.9 182.6C221.4 170.1 221.4 149.8 233.9 137.3C246.4 124.8 266.7 124.8 279.2 137.3L439.2 297.3z"/></svg>`,Ja=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free 7.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M297.4 201.4C309.9 188.9 330.2 188.9 342.7 201.4L502.7 361.4C515.2 373.9 515.2 394.2 502.7 406.7C490.2 419.2 469.9 419.2 457.4 406.7L320 269.3L182.6 406.6C170.1 419.1 149.8 419.1 137.3 406.6C124.8 394.1 124.8 373.8 137.3 361.3L297.3 201.3z"/></svg>\r
`,Ya=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free 7.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M105.4 297.4C92.9 309.9 92.9 330.2 105.4 342.7L265.4 502.7C277.9 515.2 298.2 515.2 310.7 502.7C323.2 490.2 323.2 469.9 310.7 457.4L173.3 320L310.6 182.6C323.1 170.1 323.1 149.8 310.6 137.3C298.1 124.8 277.8 124.8 265.3 137.3L105.3 297.3zM457.4 137.4L297.4 297.4C284.9 309.9 284.9 330.2 297.4 342.7L457.4 502.7C469.9 515.2 490.2 515.2 502.7 502.7C515.2 490.2 515.2 469.9 502.7 457.4L365.3 320L502.6 182.6C515.1 170.1 515.1 149.8 502.6 137.3C490.1 124.8 469.8 124.8 457.3 137.3z"/></svg>`,Xa=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free 7.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M535.1 342.6C547.6 330.1 547.6 309.8 535.1 297.3L375.1 137.3C362.6 124.8 342.3 124.8 329.8 137.3C317.3 149.8 317.3 170.1 329.8 182.6L467.2 320L329.9 457.4C317.4 469.9 317.4 490.2 329.9 502.7C342.4 515.2 362.7 515.2 375.2 502.7L535.2 342.7zM183.1 502.6L343.1 342.6C355.6 330.1 355.6 309.8 343.1 297.3L183.1 137.3C170.6 124.8 150.3 124.8 137.8 137.3C125.3 149.8 125.3 170.1 137.8 182.6L275.2 320L137.9 457.4C125.4 469.9 125.4 490.2 137.9 502.7C150.4 515.2 170.7 515.2 183.2 502.7z"/></svg>`,Za=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path d="M228 136C228 120.5 215.5 108 200 108C184.5 108 172 120.5 172 136L172 424L139.8 391.8C128.9 380.9 111.1 380.9 100.2 391.8C89.3 402.7 89.3 420.5 100.2 431.4L180.2 511.4C191.1 522.3 208.9 522.3 219.8 511.4L299.8 431.4C310.7 420.5 310.7 402.7 299.8 391.8C288.9 380.9 271.1 380.9 260.2 391.8L228 424L228 136zM404 108C389.6 108 378 119.6 378 134C378 148.4 389.6 160 404 160L414 160L414 244L394 244C379.6 244 368 255.6 368 270C368 284.4 379.6 296 394 296L486 296C500.4 296 512 284.4 512 270C512 255.6 500.4 244 486 244L466 244L466 134C466 119.6 454.4 108 440 108L404 108zM450 468C457.8 468 465.2 466.6 472 464L472 468C472 481.3 461.3 492 448 492L396 492C385 492 376 501 376 512C376 523 385 532 396 532L448 532C483.3 532 512 503.3 512 468L512 406C512 371.8 484.2 344 450 344L430 344C395.8 344 368 371.8 368 406C368 440.2 395.8 468 430 468L450 468zM476 406C476 420.4 464.4 432 450 432L430 432C415.6 432 404 420.4 404 406C404 391.6 415.6 380 430 380L450 380C464.4 380 476 391.6 476 406z"/></svg>`,Qa=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path d="M228 136C228 120.5 215.5 108 200 108C184.5 108 172 120.5 172 136L172 424L139.8 391.8C128.9 380.9 111.1 380.9 100.2 391.8C89.3 402.7 89.3 420.5 100.2 431.4L180.2 511.4C191.1 522.3 208.9 522.3 219.8 511.4L299.8 431.4C310.7 420.5 310.7 402.7 299.8 391.8C288.9 380.9 271.1 380.9 260.2 391.8L228 424L228 136zM414.5 123.7C418.9 114.1 428.5 108 440 108C451.5 108 461.1 114.1 465.5 123.7L529.5 263.7C535.9 277.7 529.7 294.3 515.7 300.7C501.7 307.1 485.1 300.9 478.7 286.9L471.9 272L408.1 272L401.3 286.9C394.9 300.9 378.3 307.1 364.3 300.7C350.3 294.3 344.1 277.7 350.5 263.7L414.5 123.7zM418 228L462 228L440 178L418 228zM380 352L500 352C510.7 352 520.4 358.1 525.1 367.7C529.8 377.3 528.6 388.8 522.1 397.2L437 476L500 476C515.5 476 528 488.5 528 504C528 519.5 515.5 532 500 532L380 532C369.3 532 359.6 525.9 354.9 516.3C350.2 506.7 351.4 495.2 357.9 486.8L443 408L380 408C364.5 408 352 395.5 352 380C352 364.5 364.5 352 380 352z"/></svg>`,$a=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512">\r
  <path fill="currentColor" d="M214.6 9.4c-12.5-12.5-32.8-12.5-45.3 0l-128 128c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L160 109.3V402.7L86.6 329.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l128 128c12.5 12.5 32.8 12.5 45.3 0l128-128c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L224 402.7V109.3l73.4 73.4c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3l-128-128z"/>\r
</svg>\r
`,eo=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free 7.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M128 128C110.3 128 96 142.3 96 160C96 177.7 110.3 192 128 192L512 192C529.7 192 544 177.7 544 160C544 142.3 529.7 128 512 128zM128 288C110.3 288 96 302.3 96 320C96 337.7 110.3 352 128 352L512 352C529.7 352 544 337.7 544 320C544 302.3 529.7 288 512 288zM128 448C110.3 448 96 462.3 96 480C96 497.7 110.3 512 128 512L512 512C529.7 512 544 497.7 544 480C544 462.3 529.7 448 512 448z"/></svg>\r
`,to=`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-blockquote-left" viewBox="0 0 16 16">\r
  <path d="M2.5 3a.5.5 0 0 0 0 1h11a.5.5 0 0 0 0-1zm5 3a.5.5 0 0 0 0 1h6a.5.5 0 0 0 0-1zm0 3a.5.5 0 0 0 0 1h6a.5.5 0 0 0 0-1zm-5 3a.5.5 0 0 0 0 1h11a.5.5 0 0 0 0-1zm.79-5.373q.168-.117.444-.275L3.524 6q-.183.111-.452.287-.27.176-.51.428a2.4 2.4 0 0 0-.398.562Q2 7.587 2 7.969q0 .54.217.873.217.328.72.328.322 0 .504-.211a.7.7 0 0 0 .188-.463q0-.345-.211-.521-.205-.182-.568-.182h-.282q.036-.305.123-.498a1.4 1.4 0 0 1 .252-.37 2 2 0 0 1 .346-.298zm2.167 0q.17-.117.445-.275L5.692 6q-.183.111-.452.287-.27.176-.51.428a2.4 2.4 0 0 0-.398.562q-.165.31-.164.692 0 .54.217.873.217.328.72.328.322 0 .504-.211a.7.7 0 0 0 .188-.463q0-.345-.211-.521-.205-.182-.568-.182h-.282a1.8 1.8 0 0 1 .118-.492q.087-.194.257-.375a2 2 0 0 1 .346-.3z"/>\r
</svg>`,no=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free 7.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M160 96C142.3 96 128 110.3 128 128C128 145.7 142.3 160 160 160L192 160L192 480L160 480C142.3 480 128 494.3 128 512C128 529.7 142.3 544 160 544L384 544C454.7 544 512 486.7 512 416C512 369.5 487.2 328.7 450 306.3C468.7 284 480 255.3 480 224C480 153.3 422.7 96 352 96L160 96zM416 224C416 259.3 387.3 288 352 288L256 288L256 160L352 160C387.3 160 416 188.7 416 224zM256 480L256 352L384 352C419.3 352 448 380.7 448 416C448 451.3 419.3 480 384 480L256 480z"/></svg>`,ro=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free 7.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M320 216.1C292.6 186.9 252.4 169 208 169c-59.5 0-111.4 32.4-144 80.8l0 279.8C96.6 481.2 148.5 448.8 208 448.8c42.8 0 81.8 16.6 112 43.8l0-276.5zM384 492.6c30.2-27.2 69.2-43.8 112-43.8c59.5 0 111.4 32.4 144 80.8l0-279.8C607.4 201.4 555.5 169 496 169c-44.4 0-84.6 17.9-112 47.1l0 276.5zm-32-332.6c37.5-37.1 89-60 144-60c106 0 192 86 192 192l0 272c0 17.7-14.3 32-32 32c-4.4 0-8.8-1-12.8-2.8L496 520.9l-96 68.6c-14.4 10.3-33.8 10.3-48.2 0L256 520.9 108.8 593.2C104.8 595 100.4 596 96 596c-17.7 0-32-14.3-32-32l0-272c0-106 86-192 192-192c55 0 106.5 22.9 144 60z"/></svg>\r
`,io=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free 7.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M192 64C156.7 64 128 92.7 128 128L128 544C128 555.5 134.2 566.2 144.2 571.8C154.2 577.4 166.5 577.3 176.4 571.4L320 485.3L463.5 571.4C473.4 577.3 485.7 577.5 495.7 571.8C505.7 566.1 512 555.5 512 544L512 128C512 92.7 483.3 64 448 64L192 64z"/></svg>`,ao=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free 7.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M192 64C156.7 64 128 92.7 128 128L128 512C128 547.3 156.7 576 192 576L448 576C483.3 576 512 547.3 512 512L512 128C512 92.7 483.3 64 448 64L192 64zM304 416L336 416C353.7 416 368 430.3 368 448L368 528L272 528L272 448C272 430.3 286.3 416 304 416zM224 176C224 167.2 231.2 160 240 160L272 160C280.8 160 288 167.2 288 176L288 208C288 216.8 280.8 224 272 224L240 224C231.2 224 224 216.8 224 208L224 176zM368 160L400 160C408.8 160 416 167.2 416 176L416 208C416 216.8 408.8 224 400 224L368 224C359.2 224 352 216.8 352 208L352 176C352 167.2 359.2 160 368 160zM224 304C224 295.2 231.2 288 240 288L272 288C280.8 288 288 295.2 288 304L288 336C288 344.8 280.8 352 272 352L240 352C231.2 352 224 344.8 224 336L224 304zM368 288L400 288C408.8 288 416 295.2 416 304L416 336C416 344.8 408.8 352 400 352L368 352C359.2 352 352 344.8 352 336L352 304C352 295.2 359.2 288 368 288z"/></svg>\r
`,oo=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free 7.3.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M416 64C433.7 64 448 78.3 448 96L448 128L480 128C515.3 128 544 156.7 544 192L544 480C544 515.3 515.3 544 480 544L160 544C124.7 544 96 515.3 96 480L96 192C96 156.7 124.7 128 160 128L192 128L192 96C192 78.3 206.3 64 224 64C241.7 64 256 78.3 256 96L256 128L384 128L384 96C384 78.3 398.3 64 416 64zM438 225.7C427.3 217.9 412.3 220.3 404.5 231L285.1 395.2L233 343.1C223.6 333.7 208.4 333.7 199.1 343.1C189.8 352.5 189.7 367.7 199.1 377L271.1 449C276.1 454 283 456.5 289.9 456C296.8 455.5 303.3 451.9 307.4 446.2L443.3 259.2C451.1 248.5 448.7 233.5 438 225.7z"/></svg>`,so=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free 7.3.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M224 64C241.7 64 256 78.3 256 96L256 128L384 128L384 96C384 78.3 398.3 64 416 64C433.7 64 448 78.3 448 96L448 128L480 128C515.3 128 544 156.7 544 192L544 480C544 515.3 515.3 544 480 544L160 544C124.7 544 96 515.3 96 480L96 192C96 156.7 124.7 128 160 128L192 128L192 96C192 78.3 206.3 64 224 64zM320 256C306.7 256 296 266.7 296 280L296 328L248 328C234.7 328 224 338.7 224 352C224 365.3 234.7 376 248 376L296 376L296 424C296 437.3 306.7 448 320 448C333.3 448 344 437.3 344 424L344 376L392 376C405.3 376 416 365.3 416 352C416 338.7 405.3 328 392 328L344 328L344 280C344 266.7 333.3 256 320 256z"/></svg>`,co=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free 7.3.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M224 64C206.3 64 192 78.3 192 96L192 128L160 128C124.7 128 96 156.7 96 192L96 240L544 240L544 192C544 156.7 515.3 128 480 128L448 128L448 96C448 78.3 433.7 64 416 64C398.3 64 384 78.3 384 96L384 128L256 128L256 96C256 78.3 241.7 64 224 64zM96 288L96 480C96 515.3 124.7 544 160 544L480 544C515.3 544 544 515.3 544 480L544 288L96 288z"/></svg>`,lo=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free 7.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M441.3 299.8C451.5 312.4 450.8 330.9 439.1 342.6L311.1 470.6C301.9 479.8 288.2 482.5 276.2 477.5C264.2 472.5 256.5 460.9 256.5 448L256.5 192C256.5 179.1 264.3 167.4 276.3 162.4C288.3 157.4 302 160.2 311.2 169.3L439.2 297.3L441.4 299.7z"/></svg>`,uo=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free 7.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M530.8 134.1C545.1 144.5 548.3 164.5 537.9 178.8L281.9 530.8C276.4 538.4 267.9 543.1 258.5 543.9C249.1 544.7 240 541.2 233.4 534.6L105.4 406.6C92.9 394.1 92.9 373.8 105.4 361.3C117.9 348.8 138.2 348.8 150.7 361.3L252.2 462.8L486.2 141.1C496.6 126.8 516.6 123.6 530.9 134z"/></svg>`,fo=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512"><!--! Font Awesome Free 7.0.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc. --><path d="M311.1 233.4c12.5 12.5 12.5 32.8 0 45.3l-192 192c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3L243.2 256 73.9 86.6c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l192 192z"/></svg>\r
`,po=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free 7.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M320 576C178.6 576 64 461.4 64 320C64 178.6 178.6 64 320 64C461.4 64 576 178.6 576 320C576 461.4 461.4 576 320 576zM438 209.7C427.3 201.9 412.3 204.3 404.5 215L285.1 379.2L233 327.1C223.6 317.7 208.4 317.7 199.1 327.1C189.8 336.5 189.7 351.7 199.1 361L271.1 433C276.1 438 282.9 440.5 289.9 440C296.9 439.5 303.3 435.9 307.4 430.2L443.3 243.2C451.1 232.5 448.7 217.5 438 209.7z"/></svg>`,mo=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free 7.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M320 576C178.6 576 64 461.4 64 320C64 178.6 178.6 64 320 64C461.4 64 576 178.6 576 320C576 461.4 461.4 576 320 576zM320 384C302.3 384 288 398.3 288 416C288 433.7 302.3 448 320 448C337.7 448 352 433.7 352 416C352 398.3 337.7 384 320 384zM320 192C301.8 192 287.3 207.5 288.6 225.7L296 329.7C296.9 342.3 307.4 352 319.9 352C332.5 352 342.9 342.3 343.8 329.7L351.2 225.7C352.5 207.5 338.1 192 319.8 192z"/></svg>\r
`,ho=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free 7.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M320 576C461.4 576 576 461.4 576 320C576 178.6 461.4 64 320 64C178.6 64 64 178.6 64 320C64 461.4 178.6 576 320 576zM288 224C288 206.3 302.3 192 320 192C337.7 192 352 206.3 352 224C352 241.7 337.7 256 320 256C302.3 256 288 241.7 288 224zM280 288L328 288C341.3 288 352 298.7 352 312L352 400L360 400C373.3 400 384 410.7 384 424C384 437.3 373.3 448 360 448L280 448C266.7 448 256 437.3 256 424C256 410.7 266.7 400 280 400L304 400L304 336L280 336C266.7 336 256 325.3 256 312C256 298.7 266.7 288 280 288z"/></svg>\r
`,go=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free 7.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M64 320C64 178.6 178.6 64 320 64C461.4 64 576 178.6 576 320C576 461.4 461.4 576 320 576C178.6 576 64 461.4 64 320zM252.3 211.1C244.7 215.3 240 223.4 240 232L240 408C240 416.7 244.7 424.7 252.3 428.9C259.9 433.1 269.1 433 276.6 428.4L420.6 340.4C427.7 336 432.1 328.3 432.1 319.9C432.1 311.5 427.7 303.8 420.6 299.4L276.6 211.4C269.2 206.9 259.9 206.7 252.3 210.9z"/></svg>`,_o=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--!Font Awesome Free 7.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM232 344V280H168c-13.3 0-24-10.7-24-24s10.7-24 24-24h64V168c0-13.3 10.7-24 24-24s24 10.7 24 24v64h64c13.3 0 24 10.7 24 24s-10.7 24-24 24H280v64c0 13.3-10.7 24-24 24s-24-10.7-24-24z"/></svg>\r
`,vo=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free 7.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M320 576C461.4 576 576 461.4 576 320C576 178.6 461.4 64 320 64C178.6 64 64 178.6 64 320C64 461.4 178.6 576 320 576zM256 224L384 224C401.7 224 416 238.3 416 256L416 384C416 401.7 401.7 416 384 416L256 416C238.3 416 224 401.7 224 384L224 256C224 238.3 238.3 224 256 224z"/></svg>`,yo=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free 7.3.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M320 576C461.4 576 576 461.4 576 320C576 178.6 461.4 64 320 64C178.6 64 64 178.6 64 320C64 461.4 178.6 576 320 576zM231 231C240.4 221.6 255.6 221.6 264.9 231L319.9 286L374.9 231C384.3 221.6 399.5 221.6 408.8 231C418.1 240.4 418.2 255.6 408.8 264.9L353.8 319.9L408.8 374.9C418.2 384.3 418.2 399.5 408.8 408.8C399.4 418.1 384.2 418.2 374.9 408.8L319.9 353.8L264.9 408.8C255.5 418.2 240.3 418.2 231 408.8C221.7 399.4 221.6 384.2 231 374.9L286 319.9L231 264.9C221.6 255.5 221.6 240.3 231 231z"/></svg>`,bo=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="48 64 528 512"><!--!Font Awesome Free 7.3.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M320 128C426 128 512 214 512 320C512 426 426 512 320 512C254.8 512 197.1 479.5 162.4 429.7C152.3 415.2 132.3 411.7 117.8 421.8C103.3 431.9 99.8 451.9 109.9 466.4C156.1 532.6 233 576 320 576C461.4 576 576 461.4 576 320C576 178.6 461.4 64 320 64C234.3 64 158.5 106.1 112 170.7L112 144C112 126.3 97.7 112 80 112C62.3 112 48 126.3 48 144L48 256C48 273.7 62.3 288 80 288L104.6 288C105.1 288 105.6 288 106.1 288L192.1 288C209.8 288 224.1 273.7 224.1 256C224.1 238.3 209.8 224 192.1 224L153.8 224C186.9 166.6 249 128 320 128zM344 216C344 202.7 333.3 192 320 192C306.7 192 296 202.7 296 216L296 320C296 326.4 298.5 332.5 303 337L375 409C384.4 418.4 399.6 418.4 408.9 409C418.2 399.6 418.3 384.4 408.9 375.1L343.9 310.1L343.9 216z"/></svg>`,xo=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free 7.3.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M176 168C189.3 168 200 157.3 200 144C200 130.7 189.3 120 176 120C162.7 120 152 130.7 152 144C152 157.3 162.7 168 176 168zM256 144C256 176.8 236.3 205 208 217.3L208 288L384 288C410.5 288 432 266.5 432 240L432 217.3C403.7 205 384 176.8 384 144C384 99.8 419.8 64 464 64C508.2 64 544 99.8 544 144C544 176.8 524.3 205 496 217.3L496 240C496 301.9 445.9 352 384 352L208 352L208 422.7C236.3 435 256 463.2 256 496C256 540.2 220.2 576 176 576C131.8 576 96 540.2 96 496C96 463.2 115.7 435 144 422.7L144 217.4C115.7 205 96 176.8 96 144C96 99.8 131.8 64 176 64C220.2 64 256 99.8 256 144zM488 144C488 130.7 477.3 120 464 120C450.7 120 440 130.7 440 144C440 157.3 450.7 168 464 168C477.3 168 488 157.3 488 144zM176 520C189.3 520 200 509.3 200 496C200 482.7 189.3 472 176 472C162.7 472 152 482.7 152 496C152 509.3 162.7 520 176 520z"/></svg>`,So=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free 7.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M392.8 65.2C375.8 60.3 358.1 70.2 353.2 87.2L225.2 535.2C220.3 552.2 230.2 569.9 247.2 574.8C264.2 579.7 281.9 569.8 286.8 552.8L414.8 104.8C419.7 87.8 409.8 70.1 392.8 65.2zM457.4 201.3C444.9 213.8 444.9 234.1 457.4 246.6L530.8 320L457.4 393.4C444.9 405.9 444.9 426.2 457.4 438.7C469.9 451.2 490.2 451.2 502.7 438.7L598.7 342.7C611.2 330.2 611.2 309.9 598.7 297.4L502.7 201.4C490.2 188.9 469.9 188.9 457.4 201.4zM182.7 201.3C170.2 188.8 149.9 188.8 137.4 201.3L41.4 297.3C28.9 309.8 28.9 330.1 41.4 342.6L137.4 438.6C149.9 451.1 170.2 451.1 182.7 438.6C195.2 426.1 195.2 405.8 182.7 393.3L109.3 320L182.6 246.6C195.1 234.1 195.1 213.8 182.6 201.3z"/></svg>`,Co=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">\r
  <path fill="currentColor" d="M160 64c0-17.7-14.3-32-32-32S96 46.3 96 64l0 64-64 0c-17.7 0-32 14.3-32 32s14.3 32 32 32l96 0c17.7 0 32-14.3 32-32l0-96zM32 320c-17.7 0-32 14.3-32 32s14.3 32 32 32l64 0 0 64c0 17.7 14.3 32 32 32s32-14.3 32-32l0-96c0-17.7-14.3-32-32-32l-96 0zM352 64c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 96c0 17.7 14.3 32 32 32l96 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-64 0 0-64zM320 320c-17.7 0-32 14.3-32 32l0 96c0 17.7 14.3 32 32 32s32-14.3 32-32l0-64 64 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-96 0z"/>\r
</svg>\r
`,wo=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><!--!Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free--><path d="M384 336l-192 0c-8.8 0-16-7.2-16-16l0-256c0-8.8 7.2-16 16-16l140.1 0L384 96.1 384 336zM192 384l192 0c35.3 0 64-28.7 64-64l0-239.9c0-12.7-5.1-24.9-14.1-33.9L365.9 14.1C356.9 5.1 344.7 0 332 0L192 0C156.7 0 128 28.7 128 64l0 256c0 35.3 28.7 64 64 64zM64 128c-35.3 0-64 28.7-64 64L0 448c0 35.3 28.7 64 64 64l192 0c35.3 0 64-28.7 64-64l0-32-48 0 0 32c0 8.8-7.2 16-16 16L64 464c-8.8 0-16-7.2-16-16l0-256c0-8.8 7.2-16 16-16l32 0 0-48-32 0z"/></svg>\r
`,To=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free 7.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path fill="rgb(177, 151, 252)" d="M256 96C256 78.3 270.3 64 288 64L352 64C369.7 64 384 78.3 384 96L384 160C384 177.7 369.7 192 352 192L288 192C270.3 192 256 177.7 256 160L256 96zM288 448L352 448C369.7 448 384 462.3 384 480L384 544C384 561.7 369.7 576 352 576L288 576C270.3 576 256 561.7 256 544L256 480C256 462.3 270.3 448 288 448zM480 448L544 448C561.7 448 576 462.3 576 480L576 544C576 561.7 561.7 576 544 576L480 576C462.3 576 448 561.7 448 544L448 480C448 462.3 462.3 448 480 448zM384 256L448 256C465.7 256 480 270.3 480 288L480 352C480 369.7 465.7 384 448 384L384 384C366.3 384 352 369.7 352 352L352 288C352 270.3 366.3 256 384 256zM201.4 252.1C213.9 239.6 234.2 239.6 246.7 252.1L292 297.4C304.5 309.9 304.5 330.2 292 342.7L246.7 388C234.2 400.5 213.9 400.5 201.4 388L156.1 342.6C143.6 330.1 143.6 309.8 156.1 297.3L201.4 252zM96 448L160 448C177.7 448 192 462.3 192 480L192 544C192 561.7 177.7 576 160 576L96 576C78.3 576 64 561.7 64 544L64 480C64 462.3 78.3 448 96 448z"/></svg>`,Eo=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free 7.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M544 144c0-44.2-100.3-80-224-80S96 99.8 96 144v16c0 17.7 16.1 34.3 44 47.7C177.8 225.7 242.5 240 320 240s142.2-14.3 180-32.3c27.9-13.4 44-30 44-47.7V144zM96 224v64c0 17.7 16.1 34.3 44 47.7C177.8 353.7 242.5 368 320 368s142.2-14.3 180-32.3c27.9-13.4 44-30 44-47.7V224c0 10.3-5.5 20.3-15.6 29.4C467.4 268.6 398.2 280 320 280s-147.4-11.4-184.4-26.6C125.5 244.3 120 234.3 120 224H96zm0 128v64c0 17.7 16.1 34.3 44 47.7C177.8 481.7 242.5 496 320 496s142.2-14.3 180-32.3c27.9-13.4 44-30 44-47.7V352c0 10.3-5.5 20.3-15.6 29.4C467.4 396.6 398.2 408 320 408s-147.4-11.4-184.4-26.6C125.5 372.3 120 362.3 120 352H96zm0 128v16c0 44.2 100.3 80 224 80s224-35.8 224-80V480c0 10.3-5.5 20.3-15.6 29.4C467.4 524.6 398.2 536 320 536s-147.4-11.4-184.4-26.6C125.5 500.3 120 490.3 120 480H96z"/></svg>\r
`,Do=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><!--! Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License) Copyright 2024 Fonticons, Inc. --><path d="M64 0C28.7 0 0 28.7 0 64L0 352c0 35.3 28.7 64 64 64l176 0-10.7 32L160 448c-17.7 0-32 14.3-32 32s14.3 32 32 32l256 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-69.3 0L336 416l176 0c35.3 0 64-28.7 64-64l0-288c0-35.3-28.7-64-64-64L64 0zM512 64l0 288L64 352 64 64l448 0z"/></svg>`,Oo=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free 7.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M352 96C352 78.3 337.7 64 320 64C302.3 64 288 78.3 288 96L288 306.7L246.6 265.3C234.1 252.8 213.8 252.8 201.3 265.3C188.8 277.8 188.8 298.1 201.3 310.6L297.3 406.6C309.8 419.1 330.1 419.1 342.6 406.6L438.6 310.6C451.1 298.1 451.1 277.8 438.6 265.3C426.1 252.8 405.8 252.8 393.3 265.3L352 306.7L352 96zM160 384C124.7 384 96 412.7 96 448L96 480C96 515.3 124.7 544 160 544L480 544C515.3 544 544 515.3 544 480L544 448C544 412.7 515.3 384 480 384L433.1 384L376.5 440.6C345.3 471.8 294.6 471.8 263.4 440.6L206.9 384L160 384zM464 440C477.3 440 488 450.7 488 464C488 477.3 477.3 488 464 488C450.7 488 440 477.3 440 464C440 450.7 450.7 440 464 440z"/></svg>\r
`,ko=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free 7.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M208 320C208 350.9 182.9 376 152 376C121.1 376 96 350.9 96 320C96 289.1 121.1 264 152 264C182.9 264 208 289.1 208 320zM376 320C376 350.9 350.9 376 320 376C289.1 376 264 350.9 264 320C264 289.1 289.1 264 320 264C350.9 264 376 289.1 376 320zM544 320C544 350.9 518.9 376 488 376C457.1 376 432 350.9 432 320C432 289.1 457.1 264 488 264C518.9 264 544 289.1 544 320z"/></svg>\r
`,Ao=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free 7.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M320 208C289.1 208 264 182.9 264 152C264 121.1 289.1 96 320 96C350.9 96 376 121.1 376 152C376 182.9 350.9 208 320 208zM320 432C350.9 432 376 457.1 376 488C376 518.9 350.9 544 320 544C289.1 544 264 518.9 264 488C264 457.1 289.1 432 320 432zM376 320C376 350.9 350.9 376 320 376C289.1 376 264 350.9 264 320C264 289.1 289.1 264 320 264C350.9 264 376 289.1 376 320z"/></svg>\r
`,jo=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path d="M112 128A48 48 0 0 0 64 176L64 198L288 366C306.9 380.2 333.1 380.2 352 366L576 198L576 176A48 48 0 0 0 528 128L112 128zM64 256L64 464A48 48 0 0 0 112 512L528 512A48 48 0 0 0 576 464L576 256L371.2 409.6C340.9 432.3 299.1 432.3 268.8 409.6L64 256z"/></svg>`,Mo=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">\r
  <path fill="currentColor" d="M128 96C110.3 96 96 110.3 96 128L96 224C96 241.7 110.3 256 128 256C145.7 256 160 241.7 160 224L160 160L224 160C241.7 160 256 145.7 256 128C256 110.3 241.7 96 224 96L128 96zM160 416C160 398.3 145.7 384 128 384C110.3 384 96 398.3 96 416L96 512C96 529.7 110.3 544 128 544L224 544C241.7 544 256 529.7 256 512C256 494.3 241.7 480 224 480L160 480L160 416zM416 96C398.3 96 384 110.3 384 128C384 145.7 398.3 160 416 160L480 160L480 224C480 241.7 494.3 256 512 256C529.7 256 544 241.7 544 224L544 128C544 110.3 529.7 96 512 96L416 96zM544 416C544 398.3 529.7 384 512 384C494.3 384 480 398.3 480 416L480 480L416 480C398.3 480 384 494.3 384 512C384 529.7 398.3 544 416 544L512 544C529.7 544 544 529.7 544 512L544 416z"/>\r
</svg>\r
`,No={"angle-down-solid-full":Ga,"angle-left-solid-full":Ka,"angle-right-solid-full":qa,"angle-up-solid-full":Ja,"angles-left-solid-full":Ya,"angles-right-solid-full":Xa,"arrow-down-1-9-solid-full":Za,"arrow-down-a-z-solid-full":Qa,"arrows-up-down-solid-full":$a,"bars-solid-full":eo,"blockquote-left":to,"bold-solid-full":no,"book-open-solid-full":ro,"bookmark-solid-full":io,"building-solid-full":ao,"calendar-check-solid-full":oo,"calendar-plus-solid-full":so,"calendar-solid-full":co,"caret-right-solid-full":lo,"check-solid-full":uo,"chevron-right":fo,"circle-check-solid-full":po,"circle-exclamation-solid-full":mo,"circle-info-solid-full":ho,"circle-play-solid-full":go,"circle-plus-solid-full":_o,"circle-plus":_o,"circle-stop-solid-full":vo,"circle-xmark-solid-full":yo,"clock-rotate-left-solid-full":bo,"code-branch-solid-full":xo,"code-solid-full":So,"compress-solid-full":Co,compress:Co,"copy-solid-full":wo,"cubes-stacked-solid-full":To,"database-solid-full":Eo,"display-solid-full":Do,"download-solid-full":Oo,"ellipsis-solid-full":ko,"ellipsis-vertical-solid-full":Ao,"envelope-solid-full":jo,"expand-solid-full":Mo,expand:Mo,"eye-slash-solid-full":`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free 7.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M73 39.1C63.6 29.7 48.4 29.7 39.1 39.1C29.8 48.5 29.7 63.7 39 73.1L567 601.1C576.4 610.5 591.6 610.5 600.9 601.1C610.2 591.7 610.3 576.5 600.9 567.2L504.5 470.8C507.2 468.4 509.9 466 512.5 463.6C559.3 420.1 590.6 368.2 605.5 332.5C608.8 324.6 608.8 315.8 605.5 307.9C590.6 272.2 559.3 220.2 512.5 176.8C465.4 133.1 400.7 96.2 319.9 96.2C263.1 96.2 214.3 114.4 173.9 140.4L73 39.1zM236.5 202.7C260 185.9 288.9 176 320 176C399.5 176 464 240.5 464 320C464 351.1 454.1 379.9 437.3 403.5L402.6 368.8C415.3 347.4 419.6 321.1 412.7 295.1C399 243.9 346.3 213.5 295.1 227.2C286.5 229.5 278.4 232.9 271.1 237.2L236.4 202.5zM357.3 459.1C345.4 462.3 332.9 464 320 464C240.5 464 176 399.5 176 320C176 307.1 177.7 294.6 180.9 282.7L101.4 203.2C68.8 240 46.4 279 34.5 307.7C31.2 315.6 31.2 324.4 34.5 332.3C49.4 368 80.7 420 127.5 463.4C174.6 507.1 239.3 544 320.1 544C357.4 544 391.3 536.1 421.6 523.4L357.4 459.2z"/></svg>`,"eye-solid-full":`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free 7.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M320 96C239.2 96 174.5 132.8 127.4 176.6C80.6 220.1 49.3 272 34.4 307.7C31.1 315.6 31.1 324.4 34.4 332.3C49.3 368 80.6 420 127.4 463.4C174.5 507.1 239.2 544 320 544C400.8 544 465.5 507.2 512.6 463.4C559.4 419.9 590.7 368 605.6 332.3C608.9 324.4 608.9 315.6 605.6 307.7C590.7 272 559.4 220 512.6 176.6C465.5 132.9 400.8 96 320 96zM176 320C176 240.5 240.5 176 320 176C399.5 176 464 240.5 464 320C464 399.5 399.5 464 320 464C240.5 464 176 399.5 176 320zM320 256C320 291.3 291.3 320 256 320C244.5 320 233.7 317 224.3 311.6C223.3 322.5 224.2 333.7 227.2 344.8C240.9 396 293.6 426.4 344.8 412.7C396 399 426.4 346.3 412.7 295.1C400.5 249.4 357.2 220.3 311.6 224.3C316.9 233.6 320 244.4 320 256z"/></svg>`,"fax-solid-full":`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path fill-rule="evenodd" d="M128 112C101.5 112 80 133.5 80 160L80 480C80 506.5 101.5 528 128 528L160 528C177.7 528 192 513.7 192 496L192 144C192 126.3 177.7 112 160 112L128 112zM240 96C231.2 96 224 103.2 224 112L224 224L512 224L512 160L448 96L240 96zM224 256L224 528L512 528C538.5 528 560 506.5 560 480L560 304C560 277.5 538.5 256 512 256L224 256zM280 296L488 296C496.8 296 504 303.2 504 312L504 336C504 344.8 496.8 352 488 352L280 352C271.2 352 264 344.8 264 336L264 312C264 303.2 271.2 296 280 296zM280 384L312 384C320.8 384 328 391.2 328 400L328 416C328 424.8 320.8 432 312 432L280 432C271.2 432 264 424.8 264 416L264 400C264 391.2 271.2 384 280 384zM368 384L400 384C408.8 384 416 391.2 416 400L416 416C416 424.8 408.8 432 400 432L368 432C359.2 432 352 424.8 352 416L352 400C352 391.2 359.2 384 368 384zM456 384L488 384C496.8 384 504 391.2 504 400L504 416C504 424.8 496.8 432 488 432L456 432C447.2 432 440 424.8 440 416L440 400C440 391.2 447.2 384 456 384zM280 452L312 452C320.8 452 328 459.2 328 468L328 484C328 492.8 320.8 500 312 500L280 500C271.2 500 264 492.8 264 484L264 468C264 459.2 271.2 452 280 452zM368 452L400 452C408.8 452 416 459.2 416 468L416 484C416 492.8 408.8 500 400 500L368 500C359.2 500 352 492.8 352 484L352 468C352 459.2 359.2 452 368 452zM456 452L488 452C496.8 452 504 459.2 504 468L504 484C504 492.8 496.8 500 488 500L456 500C447.2 500 440 492.8 440 484L440 468C440 459.2 447.2 452 456 452z"/></svg>
`,"fire-solid-full":`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free 7.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M256.5 37.6C265.8 29.8 279.5 30.1 288.4 38.5C300.7 50.1 311.7 62.9 322.3 75.9C335.8 92.4 352 114.2 367.6 140.1C372.8 133.3 377.6 127.3 381.8 122.2C382.9 120.9 384 119.5 385.1 118.1C393 108.3 402.8 96 415.9 96C429.3 96 438.7 107.9 446.7 118.1C448 119.8 449.3 121.4 450.6 122.9C460.9 135.3 474.6 153.2 488.3 175.3C515.5 219.2 543.9 281.7 543.9 351.9C543.9 475.6 443.6 575.9 319.9 575.9C196.2 575.9 96 475.7 96 352C96 260.9 137.1 182 176.5 127C196.4 99.3 216.2 77.1 231.1 61.9C239.3 53.5 247.6 45.2 256.6 37.7zM321.7 480C347 480 369.4 473 390.5 459C432.6 429.6 443.9 370.8 418.6 324.6C414.1 315.6 402.6 315 396.1 322.6L370.9 351.9C364.3 359.5 352.4 359.3 346.2 351.4C328.9 329.3 297.1 289 280.9 268.4C275.5 261.5 265.7 260.4 259.4 266.5C241.1 284.3 207.9 323.3 207.9 370.8C207.9 439.4 258.5 480 321.6 480z"/></svg>`,"floppy-disk-regular-full":`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free 7.3.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M160 144C151.2 144 144 151.2 144 160L144 480C144 488.8 151.2 496 160 496L480 496C488.8 496 496 488.8 496 480L496 237.3C496 233.1 494.3 229 491.3 226L416 150.6L416 240C416 257.7 401.7 272 384 272L224 272C206.3 272 192 257.7 192 240L192 144L160 144zM240 144L240 224L368 224L368 144L240 144zM96 160C96 124.7 124.7 96 160 96L402.7 96C419.7 96 436 102.7 448 114.7L525.3 192C537.3 204 544 220.3 544 237.3L544 480C544 515.3 515.3 544 480 544L160 544C124.7 544 96 515.3 96 480L96 160zM256 384C256 348.7 284.7 320 320 320C355.3 320 384 348.7 384 384C384 419.3 355.3 448 320 448C284.7 448 256 419.3 256 384z"/></svg>`,"folder-solid-full":`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--!Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free--><path d="M64 480H448c35.3 0 64-28.7 64-64V160c0-35.3-28.7-64-64-64H288c-10.1 0-19.6-4.7-25.6-12.8L243.2 57.6C231.1 41.5 212.1 32 192 32H64C28.7 32 0 60.7 0 96V416c0 35.3 28.7 64 64 64z"/></svg>\r
`,"gear-solid-full":`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free 7.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M259.1 73.5C262.1 58.7 275.2 48 290.4 48L350.2 48C365.4 48 378.5 58.7 381.5 73.5L396 143.5C410.1 149.5 423.3 157.2 435.3 166.3L503.1 143.8C517.5 139 533.3 145 540.9 158.2L570.8 210C578.4 223.2 575.7 239.8 564.3 249.9L511 297.3C511.9 304.7 512.3 312.3 512.3 320C512.3 327.7 511.8 335.3 511 342.7L564.4 390.2C575.8 400.3 578.4 417 570.9 430.1L541 481.9C533.4 495 517.6 501.1 503.2 496.3L435.4 473.8C423.3 482.9 410.1 490.5 396.1 496.6L381.7 566.5C378.6 581.4 365.5 592 350.4 592L290.6 592C275.4 592 262.3 581.3 259.3 566.5L244.9 496.6C230.8 490.6 217.7 482.9 205.6 473.8L137.5 496.3C123.1 501.1 107.3 495.1 99.7 481.9L69.8 430.1C62.2 416.9 64.9 400.3 76.3 390.2L129.7 342.7C128.8 335.3 128.4 327.7 128.4 320C128.4 312.3 128.9 304.7 129.7 297.3L76.3 249.8C64.9 239.7 62.3 223 69.8 209.9L99.7 158.1C107.3 144.9 123.1 138.9 137.5 143.7L205.3 166.2C217.4 157.1 230.6 149.5 244.6 143.4L259.1 73.5zM320.3 400C364.5 399.8 400.2 363.9 400 319.7C399.8 275.5 363.9 239.8 319.7 240C275.5 240.2 239.8 276.1 240 320.3C240.2 364.5 276.1 400.2 320.3 400z"/></svg>\r
`,"hashtag-solid-full":`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path d="M232 104C217 104 205 115 203 130L155 506C153 522 165 536 181 536C196 536 208 525 210 510L258 134C260 118 248 104 232 104zM424 104C409 104 397 115 395 130L347 506C345 522 357 536 373 536C388 536 400 525 402 510L450 134C452 118 440 104 424 104zM120 204C104 204 92 216 92 232C92 248 104 260 120 260L520 260C536 260 548 248 548 232C548 216 536 204 520 204L120 204zM120 380C104 380 92 392 92 408C92 424 104 436 120 436L520 436C536 436 548 424 548 408C548 392 536 380 520 380L120 380z"/></svg>
`,"heading-solid-full":`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free 7.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M96 128C96 110.3 110.3 96 128 96L224 96C241.7 96 256 110.3 256 128C256 145.7 241.7 160 224 160L208 160L208 272L432 272L432 160L416 160C398.3 160 384 145.7 384 128C384 110.3 398.3 96 416 96L512 96C529.7 96 544 110.3 544 128C544 145.7 529.7 160 512 160L496 160L496 480L512 480C529.7 480 544 494.3 544 512C544 529.7 529.7 544 512 544L416 544C398.3 544 384 529.7 384 512C384 494.3 398.3 480 416 480L432 480L432 336L208 336L208 480L224 480C241.7 480 256 494.3 256 512C256 529.7 241.7 544 224 544L128 544C110.3 544 96 529.7 96 512C96 494.3 110.3 480 128 480L144 480L144 160L128 160C110.3 160 96 145.7 96 128z"/></svg>`,"house-regular-full":`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free 7.3.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M304 70.1C313.1 61.9 326.9 61.9 336 70.1L568 278.1C577.9 286.9 578.7 302.1 569.8 312C560.9 321.9 545.8 322.7 535.9 313.8L527.9 306.6L527.9 511.9C527.9 547.2 499.2 575.9 463.9 575.9L175.9 575.9C140.6 575.9 111.9 547.2 111.9 511.9L111.9 306.6L103.9 313.8C94 322.6 78.9 321.8 70 312C61.1 302.2 62 287 71.8 278.1L304 70.1zM320 120.2L160 263.7L160 512C160 520.8 167.2 528 176 528L224 528L224 424C224 384.2 256.2 352 296 352L344 352C383.8 352 416 384.2 416 424L416 528L464 528C472.8 528 480 520.8 480 512L480 263.7L320 120.3zM272 528L368 528L368 424C368 410.7 357.3 400 344 400L296 400C282.7 400 272 410.7 272 424L272 528z"/></svg>`,"house-solid-full":`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><!--!Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free--><path d="M575.8 255.5c0 18-15 32.1-32 32.1l-32 0 .7 160.2c0 2.7-.2 5.4-.5 8.1l0 16.2c0 22.1-17.9 40-40 40l-16 0c-1.1 0-2.2 0-3.3-.1c-1.4 .1-2.8 .1-4.2 .1L416 512l-24 0c-22.1 0-40-17.9-40-40l0-24 0-64c0-17.7-14.3-32-32-32l-64 0c-17.7 0-32 14.3-32 32l0 64 0 24c0 22.1-17.9 40-40 40l-24 0-31.9 0c-1.5 0-3-.1-4.5-.2c-1.2 .1-2.4 .2-3.6 .2l-16 0c-22.1 0-40-17.9-40-40l0-112c0-.9 0-1.9 .1-2.8l0-69.7-32 0c-18 0-32-14-32-32.1c0-9 3-17 10-24L266.4 8c7-7 15-8 22-8s15 2 21 7L564.8 231.5c8 7 12 15 11 24z"/></svg>\r
\r
`,"html5-brands-solid-full":`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free 7.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M128 96L162.9 491.8L319.5 544L477.1 491.8L512 96L128 96zM436.2 223.9L252.4 223.9L256.5 273.3L432.1 273.3L418.5 421.7L320.6 448.7L320.6 449L319.5 449L220.8 421.7L214.8 345.9L262.5 345.9L266 384L319.5 398.5L373.2 384L379.2 321.8L212.3 321.8L199.5 176.2L440.6 176.2L436.2 223.9z"/></svg>\r
`,"icon-hub-address":`<svg width="126" height="126" viewBox="0 0 126 126" xmlns="http://www.w3.org/2000/svg">
  <ellipse cx="63.5" cy="63.03" rx="60" ry="60" fill="#036730"/>
  <path d="M 61.51 24.64 C 56.11 24.71 50.82 26.71 46.74 30.67 L 34.61 42.76 C 29.81 40.25 23.63 40.94 19.51 45.04 C 14.47 50.06 14.47 58.05 19.51 63.07 C 22.02 65.58 25.23 66.72 28.43 66.72 C 31.64 66.72 35.07 65.58 37.36 63.07 C 41.71 58.73 42.39 52.57 39.88 47.78 L 52.01 35.69 C 57.73 29.98 67.34 30.67 73.75 36.83 C 76.73 39.8 78.56 43.9 78.79 48.01 C 79.02 52.12 77.64 55.77 74.9 58.51 L 60.93 72.42 L 65.97 77.45 L 79.93 63.53 C 84.05 59.42 86.11 53.72 85.88 47.78 C 85.66 41.85 83.14 36.15 78.79 31.81 C 73.92 26.96 67.64 24.56 61.51 24.64 Z M 60.02 47.33 L 46.06 61.24 C 37.59 69.69 38.05 84.06 47.2 93.19 C 52.01 97.98 58.19 100.49 64.37 100.49 C 69.86 100.49 75.13 98.44 79.25 94.56 L 91.38 82.46 C 93.21 83.38 95.27 84.06 97.56 84.06 C 100.76 84.06 104.2 82.92 106.48 80.41 C 111.52 74.93 111.52 66.72 106.48 61.93 C 101.45 56.91 93.44 56.91 88.4 61.93 C 84.28 66.04 83.6 72.2 86.11 76.99 L 73.98 89.08 C 68.26 94.79 58.65 94.1 52.24 87.94 C 45.83 81.78 45.37 71.97 51.09 66.26 L 65.06 52.35 Z M 28.66 48.47 C 30.03 48.47 31.41 48.92 32.55 50.06 C 34.61 52.12 34.61 55.54 32.55 57.82 C 30.49 59.88 26.83 59.88 24.77 57.82 C 22.71 55.77 22.71 52.12 24.77 50.06 C 25.91 48.92 27.29 48.47 28.66 48.47 Z M 97.56 65.35 C 98.93 65.35 100.3 65.81 101.45 66.95 C 103.51 69 103.51 72.65 101.45 74.71 C 99.39 76.76 95.73 76.76 93.67 74.71 C 91.61 72.65 91.61 69 93.67 66.95 C 94.81 65.81 96.18 65.35 97.56 65.35 Z" fill="#ffffff" transform="rotate(90, 63, 62.53)"/>
</svg>`,"italic-solid-full":`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free 7.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M256 128C256 110.3 270.3 96 288 96L480 96C497.7 96 512 110.3 512 128C512 145.7 497.7 160 480 160L421.3 160L288 480L352 480C369.7 480 384 494.3 384 512C384 529.7 369.7 544 352 544L160 544C142.3 544 128 529.7 128 512C128 494.3 142.3 480 160 480L218.7 480L352 160L288 160C270.3 160 256 145.7 256 128z"/></svg>`,"link-solid-full":`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free 7.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M451.5 160C434.9 160 418.8 164.5 404.7 172.7C388.9 156.7 370.5 143.3 350.2 133.2C378.4 109.2 414.3 96 451.5 96C537.9 96 608 166 608 252.5C608 294 591.5 333.8 562.2 363.1L491.1 434.2C461.8 463.5 422 480 380.5 480C294.1 480 224 410 224 323.5C224 322 224 320.5 224.1 319C224.6 301.3 239.3 287.4 257 287.9C274.7 288.4 288.6 303.1 288.1 320.8C288.1 321.7 288.1 322.6 288.1 323.4C288.1 374.5 329.5 415.9 380.6 415.9C405.1 415.9 428.6 406.2 446 388.8L517.1 317.7C534.4 300.4 544.2 276.8 544.2 252.3C544.2 201.2 502.8 159.8 451.7 159.8zM307.2 237.3C305.3 236.5 303.4 235.4 301.7 234.2C289.1 227.7 274.7 224 259.6 224C235.1 224 211.6 233.7 194.2 251.1L123.1 322.2C105.8 339.5 96 363.1 96 387.6C96 438.7 137.4 480.1 188.5 480.1C205 480.1 221.1 475.7 235.2 467.5C251 483.5 269.4 496.9 289.8 507C261.6 530.9 225.8 544.2 188.5 544.2C102.1 544.2 32 474.2 32 387.7C32 346.2 48.5 306.4 77.8 277.1L148.9 206C178.2 176.7 218 160.2 259.5 160.2C346.1 160.2 416 230.8 416 317.1C416 318.4 416 319.7 416 321C415.6 338.7 400.9 352.6 383.2 352.2C365.5 351.8 351.6 337.1 352 319.4C352 318.6 352 317.9 352 317.1C352 283.4 334 253.8 307.2 237.5z"/></svg>`,"list-check-solid-full":`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free 7.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M197.8 100.3C208.7 107.9 211.3 122.9 203.7 133.7L147.7 213.7C143.6 219.5 137.2 223.2 130.1 223.8C123 224.4 116 222 111 217L71 177C61.7 167.6 61.7 152.4 71 143C80.3 133.6 95.6 133.7 105 143L124.8 162.8L164.4 106.2C172 95.3 187 92.7 197.8 100.3zM197.8 260.3C208.7 267.9 211.3 282.9 203.7 293.7L147.7 373.7C143.6 379.5 137.2 383.2 130.1 383.8C123 384.4 116 382 111 377L71 337C61.6 327.6 61.6 312.4 71 303.1C80.4 293.8 95.6 293.7 104.9 303.1L124.7 322.9L164.3 266.3C171.9 255.4 186.9 252.8 197.7 260.4zM288 160C288 142.3 302.3 128 320 128L544 128C561.7 128 576 142.3 576 160C576 177.7 561.7 192 544 192L320 192C302.3 192 288 177.7 288 160zM288 320C288 302.3 302.3 288 320 288L544 288C561.7 288 576 302.3 576 320C576 337.7 561.7 352 544 352L320 352C302.3 352 288 337.7 288 320zM224 480C224 462.3 238.3 448 256 448L544 448C561.7 448 576 462.3 576 480C576 497.7 561.7 512 544 512L256 512C238.3 512 224 497.7 224 480zM128 440C150.1 440 168 457.9 168 480C168 502.1 150.1 520 128 520C105.9 520 88 502.1 88 480C88 457.9 105.9 440 128 440z"/></svg>`,"list-ol-solid-full":`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free 7.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M64 136C64 122.8 74.7 112 88 112L136 112C149.3 112 160 122.7 160 136L160 240L184 240C197.3 240 208 250.7 208 264C208 277.3 197.3 288 184 288L88 288C74.7 288 64 277.3 64 264C64 250.7 74.7 240 88 240L112 240L112 160L88 160C74.7 160 64 149.3 64 136zM94.4 365.2C105.8 356.6 119.7 352 134 352L138.9 352C172.6 352 200 379.4 200 413.1C200 432.7 190.6 451 174.8 462.5L150.8 480L184 480C197.3 480 208 490.7 208 504C208 517.3 197.3 528 184 528L93.3 528C77.1 528 64 514.9 64 498.7C64 489.3 68.5 480.5 76.1 475L146.6 423.7C150 421.2 152 417.3 152 413.1C152 405.9 146.1 400 138.9 400L134 400C130.1 400 126.3 401.3 123.2 403.6L102.4 419.2C91.8 427.2 76.8 425 68.8 414.4C60.8 403.8 63 388.8 73.6 380.8L94.4 365.2zM288 128L544 128C561.7 128 576 142.3 576 160C576 177.7 561.7 192 544 192L288 192C270.3 192 256 177.7 256 160C256 142.3 270.3 128 288 128zM288 288L544 288C561.7 288 576 302.3 576 320C576 337.7 561.7 352 544 352L288 352C270.3 352 256 337.7 256 320C256 302.3 270.3 288 288 288zM288 448L544 448C561.7 448 576 462.3 576 480C576 497.7 561.7 512 544 512L288 512C270.3 512 256 497.7 256 480C256 462.3 270.3 448 288 448z"/></svg>`,"list-ul-solid-full":`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free 7.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M112 208C138.5 208 160 186.5 160 160C160 133.5 138.5 112 112 112C85.5 112 64 133.5 64 160C64 186.5 85.5 208 112 208zM256 128C238.3 128 224 142.3 224 160C224 177.7 238.3 192 256 192L544 192C561.7 192 576 177.7 576 160C576 142.3 561.7 128 544 128L256 128zM256 288C238.3 288 224 302.3 224 320C224 337.7 238.3 352 256 352L544 352C561.7 352 576 337.7 576 320C576 302.3 561.7 288 544 288L256 288zM256 448C238.3 448 224 462.3 224 480C224 497.7 238.3 512 256 512L544 512C561.7 512 576 497.7 576 480C576 462.3 561.7 448 544 448L256 448zM112 528C138.5 528 160 506.5 160 480C160 453.5 138.5 432 112 432C85.5 432 64 453.5 64 480C64 506.5 85.5 528 112 528zM160 320C160 293.5 138.5 272 112 272C85.5 272 64 293.5 64 320C64 346.5 85.5 368 112 368C138.5 368 160 346.5 160 320z"/></svg>`,"location-dot-solid-full":`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free 7.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M128 252.6C128 148.4 214 64 320 64C426 64 512 148.4 512 252.6C512 371.9 391.8 514.9 341.6 569.4C329.8 582.2 310.1 582.2 298.3 569.4C248.1 514.9 127.9 371.9 127.9 252.6zM320 320C355.3 320 384 291.3 384 256C384 220.7 355.3 192 320 192C284.7 192 256 220.7 256 256C256 291.3 284.7 320 320 320z"/></svg>`,"magnifying-glass-solid-full":`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free 7.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M480 272C480 317.9 465.1 360.3 440 394.7L566.6 521.4C579.1 533.9 579.1 554.2 566.6 566.7C554.1 579.2 533.8 579.2 521.3 566.7L394.7 440C360.3 465.1 317.9 480 272 480C157.1 480 64 386.9 64 272C64 157.1 157.1 64 272 64C386.9 64 480 157.1 480 272zM272 416C351.5 416 416 351.5 416 272C416 192.5 351.5 128 272 128C192.5 128 128 192.5 128 272C128 351.5 192.5 416 272 416z"/></svg>\r
`,"markdown-brands-solid-full":`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free 7.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M593.8 123.1L46.2 123.1C20.7 123.1 0 143.8 0 169.2L0 470.7C0 496.2 20.7 516.9 46.2 516.9L593.9 516.9C619.4 516.9 640.1 496.2 640 470.8L640 169.2C640 143.8 619.3 123.1 593.8 123.1zM338.5 424.6L277 424.6L277 304.6L215.5 381.5L154 304.6L154 424.6L92.3 424.6L92.3 215.4L153.8 215.4L215.3 292.3L276.8 215.4L338.3 215.4L338.3 424.6L338.5 424.6zM473.8 427.7L381.5 320L443 320L443 215.4L504.5 215.4L504.5 320L566 320L473.8 427.7z"/></svg>\r
`,"moon-solid-full":`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><!--! Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License) Copyright 2024 Fonticons, Inc. --><path d="M223.5 32C100 32 0 132.3 0 256S100 480 223.5 480c60.6 0 115.5-24.2 155.8-63.4c5-4.9 6.3-12.5 3.1-18.7s-10.1-9.7-17-8.5c-9.8 1.7-19.8 2.6-30.1 2.6c-96.9 0-175.5-78.8-175.5-176c0-65.8 36-123.1 89.3-153.3c6.1-3.5 9.2-10.5 7.7-17.3s-7.3-11.9-14.3-12.5c-6.3-.5-12.6-.8-19-.8z"/></svg>`,"note-sticky-solid-full":`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free 7.3.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M160 544C124.7 544 96 515.3 96 480L96 160C96 124.7 124.7 96 160 96L480 96C515.3 96 544 124.7 544 160L544 373.5C544 390.5 537.3 406.8 525.3 418.8L418.7 525.3C406.7 537.3 390.4 544 373.4 544L160 544zM485.5 368L392 368C378.7 368 368 378.7 368 392L368 485.5L485.5 368z"/></svg>`,"number-0-solid-full":`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free 7.3.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M160 256C160 167.6 231.6 96 320 96C408.4 96 480 167.6 480 256L480 384C480 472.4 408.4 544 320 544C231.6 544 160 472.4 160 384L160 256zM320 160C267 160 224 203 224 256L224 384C224 437 267 480 320 480C373 480 416 437 416 384L416 256C416 203 373 160 320 160z"/></svg>`,"number-1-solid-full":`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free 7.3.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M224 96C206.3 96 192 110.3 192 128C192 145.7 206.3 160 224 160L288 160L288 480L224 480C206.3 480 192 494.3 192 512C192 529.7 206.3 544 224 544L416 544C433.7 544 448 529.7 448 512C448 494.3 433.7 480 416 480L352 480L352 128C352 110.3 337.7 96 320 96L224 96z"/></svg>`,"number-2-solid-full":`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free 7.3.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M176 128C176 110.3 190.3 96 208 96L379 96C439.2 96 488 144.8 488 205C488 248.8 461.8 288.3 421.6 305.4L282.5 364.4C247 379.4 224 414.2 224 452.7L224 480L448 480C465.7 480 480 494.3 480 512C480 529.7 465.7 544 448 544L192 544C174.3 544 160 529.7 160 512L160 452.7C160 388.5 198.4 330.5 257.5 305.4L396.6 246.4C413.2 239.3 424 223 424 205C424 180.1 403.8 160 379 160L208 160C190.3 160 176 145.7 176 128z"/></svg>`,"number-3-solid-full":`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free 7.3.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M240 352C222.3 352 208 337.7 208 320C208 302.3 222.3 288 240 288L352 288C387.3 288 416 259.3 416 224C416 188.7 387.3 160 352 160L192 160C174.3 160 160 145.7 160 128C160 110.3 174.3 96 192 96L352 96C422.7 96 480 153.3 480 224C480 262.2 463.2 296.5 436.7 320C463.3 343.5 480 377.8 480 416C480 486.7 422.7 544 352 544L192 544C174.3 544 160 529.7 160 512C160 494.3 174.3 480 192 480L352 480C387.3 480 416 451.3 416 416C416 380.7 387.3 352 352 352L240 352z"/></svg>`,"number-4-solid-full":`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free 7.3.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M192 128C192 110.3 177.7 96 160 96C142.3 96 128 110.3 128 128L128 352C128 387.3 156.7 416 192 416L384 416L384 512C384 529.7 398.3 544 416 544C433.7 544 448 529.7 448 512L448 416L480 416C497.7 416 512 401.7 512 384C512 366.3 497.7 352 480 352L448 352L448 128C448 110.3 433.7 96 416 96C398.3 96 384 110.3 384 128L384 352L192 352L192 128z"/></svg>`,"number-5-solid-full":`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free 7.3.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M160 128C160 110.3 174.3 96 192 96L416 96C433.7 96 448 110.3 448 128C448 145.7 433.7 160 416 160L224 160L224 272L344 272C419.1 272 480 332.9 480 408C480 483.1 419.1 544 344 544L192 544C174.3 544 160 529.7 160 512C160 494.3 174.3 480 192 480L344 480C383.8 480 416 447.8 416 408C416 368.2 383.8 336 344 336L192 336C174.3 336 160 321.7 160 304L160 128z"/></svg>`,"number-6-solid-full":`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free 7.3.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M384 96C401.7 96 416 110.3 416 128C416 145.7 401.7 160 384 160L296 160C247.4 160 208 199.4 208 248L208 280.2C230.9 264.9 258.4 256 288 256L336 256C415.5 256 480 320.5 480 400C480 479.5 415.5 544 336 544L288 544C208.5 544 144 479.5 144 400L144 248C144 164.1 212.1 96 296 96L384 96zM208 400C208 444.2 243.8 480 288 480L336 480C380.2 480 416 444.2 416 400C416 355.8 380.2 320 336 320L288 320C243.8 320 208 355.8 208 400z"/></svg>`,"number-7-solid-full":`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free 7.3.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M160 128C160 110.3 174.3 96 192 96L448 96C459.5 96 470 102.1 475.7 112.1C481.4 122.1 481.4 134.3 475.6 144.2L251.6 528.2C242.7 543.5 223.1 548.6 207.8 539.7C192.5 530.8 187.4 511.2 196.3 495.9L392.3 160L192 160C174.3 160 160 145.7 160 128z"/></svg>`,"number-8-solid-full":`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free 7.3.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M464 224C464 153.3 406.7 96 336 96L304 96C233.3 96 176 153.3 176 224C176 258.6 189.7 290 212 313C180.5 336.3 160 373.8 160 416C160 486.7 217.3 544 288 544L352 544C422.7 544 480 486.7 480 416C480 373.8 459.5 336.3 428 313C450.3 290 464 258.6 464 224zM336.1 352L352 352C387.3 352 416 380.7 416 416C416 451.3 387.3 480 352 480L288 480C252.7 480 224 451.3 224 416C224 380.7 252.7 352 288 352L336.1 352zM336.1 288L304 288C268.7 288 240 259.3 240 224C240 188.7 268.7 160 304 160L336 160C371.3 160 400 188.7 400 224C400 259.3 371.4 288 336 288z"/></svg>`,"number-9-solid-full":`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free 7.3.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M336 384C365.6 384 393.1 375.1 416 359.8L416 392C416 440.6 376.6 480 328 480L224 480C206.3 480 192 494.3 192 512C192 529.7 206.3 544 224 544L328 544C411.9 544 480 475.9 480 392L480 239.9C479.9 160.4 415.5 96 336 96L288 96C208.5 96 144 160.5 144 240C144 319.5 208.5 384 288 384L336 384zM416 240C416 284.2 380.2 320 336 320L288 320C243.8 320 208 284.2 208 240C208 195.8 243.8 160 288 160L336 160C380.2 160 416 195.8 416 240z"/></svg>`,"palette-solid-full":`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free 7.3.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M576 320C576 320.9 576 321.8 576 322.7C575.6 359.2 542.4 384 505.9 384L408 384C381.5 384 360 405.5 360 432C360 435.4 360.4 438.7 361 441.9C363.1 452.1 367.5 461.9 371.8 471.8C377.9 485.6 383.9 499.3 383.9 513.8C383.9 545.6 362.3 574.5 330.5 575.8C327 575.9 323.5 576 319.9 576C178.5 576 63.9 461.4 63.9 320C63.9 178.6 178.6 64 320 64C461.4 64 576 178.6 576 320zM192 352C192 334.3 177.7 320 160 320C142.3 320 128 334.3 128 352C128 369.7 142.3 384 160 384C177.7 384 192 369.7 192 352zM192 256C209.7 256 224 241.7 224 224C224 206.3 209.7 192 192 192C174.3 192 160 206.3 160 224C160 241.7 174.3 256 192 256zM352 160C352 142.3 337.7 128 320 128C302.3 128 288 142.3 288 160C288 177.7 302.3 192 320 192C337.7 192 352 177.7 352 160zM448 256C465.7 256 480 241.7 480 224C480 206.3 465.7 192 448 192C430.3 192 416 206.3 416 224C416 241.7 430.3 256 448 256z"/></svg>`,"pen-to-square-solid-full":`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free 7.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M535.6 85.7C513.7 63.8 478.3 63.8 456.4 85.7L432 110.1L529.9 208L554.3 183.6C576.2 161.7 576.2 126.3 554.3 104.4L535.6 85.7zM236.4 305.7C230.3 311.8 225.6 319.3 222.9 327.6L193.3 416.4C190.4 425 192.7 434.5 199.1 441C205.5 447.5 215 449.7 223.7 446.8L312.5 417.2C320.7 414.5 328.2 409.8 334.4 403.7L496 241.9L398.1 144L236.4 305.7zM160 128C107 128 64 171 64 224L64 480C64 533 107 576 160 576L416 576C469 576 512 533 512 480L512 384C512 366.3 497.7 352 480 352C462.3 352 448 366.3 448 384L448 480C448 497.7 433.7 512 416 512L160 512C142.3 512 128 497.7 128 480L128 224C128 206.3 142.3 192 160 192L256 192C273.7 192 288 177.7 288 160C288 142.3 273.7 128 256 128L160 128z"/></svg>\r
`,"phone-solid-full":`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free 7.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M224.2 89C216.3 70.1 195.7 60.1 176.1 65.4L170.6 66.9C106 84.5 50.8 147.1 66.9 223.3C104 398.3 241.7 536 416.7 573.1C493 589.3 555.5 534 573.1 469.4L574.6 463.9C580 444.2 569.9 423.6 551.1 415.8L453.8 375.3C437.3 368.4 418.2 373.2 406.8 387.1L368.2 434.3C297.9 399.4 241.3 341 208.8 269.3L253 233.3C266.9 222 271.6 202.9 264.8 186.3L224.2 89z"/></svg>\r
`,"plus-solid-full":`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free 7.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M352 128C352 110.3 337.7 96 320 96C302.3 96 288 110.3 288 128L288 288L128 288C110.3 288 96 302.3 96 320C96 337.7 110.3 352 128 352L288 352L288 512C288 529.7 302.3 544 320 544C337.7 544 352 529.7 352 512L352 352L512 352C529.7 352 544 337.7 544 320C544 302.3 529.7 288 512 288L352 288L352 128z"/></svg>\r
`,"question-solid-full":`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free 7.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M224 224C224 171 267 128 320 128C373 128 416 171 416 224C416 266.7 388.1 302.9 349.5 315.4C321.1 324.6 288 350.7 288 392L288 416C288 433.7 302.3 448 320 448C337.7 448 352 433.7 352 416L352 392C352 390.3 352.6 387.9 355.5 384.7C358.5 381.4 363.4 378.2 369.2 376.3C433.5 355.6 480 295.3 480 224C480 135.6 408.4 64 320 64C231.6 64 160 135.6 160 224C160 241.7 174.3 256 192 256C209.7 256 224 241.7 224 224zM320 576C342.1 576 360 558.1 360 536C360 513.9 342.1 496 320 496C297.9 496 280 513.9 280 536C280 558.1 297.9 576 320 576z"/></svg>`,"sliders-solid-full":`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--! Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License) Copyright 2024 Fonticons, Inc. --><path d="M0 416c0 17.7 14.3 32 32 32l54.7 0c12.3 28.3 40.5 48 73.3 48s61-19.7 73.3-48L480 448c17.7 0 32-14.3 32-32s-14.3-32-32-32l-246.7 0c-12.3-28.3-40.5-48-73.3-48s-61 19.7-73.3 48L32 384c-17.7 0-32 14.3-32 32zm128 0a32 32 0 1 1 64 0 32 32 0 1 1 -64 0zM320 256a32 32 0 1 1 64 0 32 32 0 1 1 -64 0zm32-80c-32.8 0-61 19.7-73.3 48L32 224c-17.7 0-32 14.3-32 32s14.3 32 32 32l246.7 0c12.3 28.3 40.5 48 73.3 48s61-19.7 73.3-48l54.7 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-54.7 0c-12.3-28.3-40.5-48-73.3-48zM192 128a32 32 0 1 1 0-64 32 32 0 1 1 0 64zm73.3-64C253 35.7 224.8 16 192 16s-61 19.7-73.3 48L32 64C14.3 64 0 78.3 0 96s14.3 32 32 32l86.7 0c12.3 28.3 40.5 48 73.3 48s61-19.7 73.3-48L480 128c17.7 0 32-14.3 32-32s-14.3-32-32-32L265.3 64z"/></svg>\r
`,"sun-solid-full":`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--! Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License) Copyright 2024 Fonticons, Inc. --><path d="M361.5 1.2c5 2.1 8.6 6.6 9.6 11.9L391 121l107.9 19.8c5.3 1 9.8 4.6 11.9 9.6s1.5 10.7-1.6 15.2L446.9 256l62.3 90.3c3.1 4.5 3.7 10.2 1.6 15.2s-6.6 8.6-11.9 9.6L391 391 371.1 498.9c-1 5.3-4.6 9.8-9.6 11.9s-10.7 1.5-15.2-1.6L256 446.9l-90.3 62.3c-4.5 3.1-10.2 3.7-15.2 1.6s-8.6-6.6-9.6-11.9L121 391 13.1 371.1c-5.3-1-9.8-4.6-11.9-9.6s-1.5-10.7 1.6-15.2L65.1 256 2.8 165.7c-3.1-4.5-3.7-10.2-1.6-15.2s6.6-8.6 11.9-9.6L121 121 140.9 13.1c1-5.3 4.6-9.8 9.6-11.9s10.7-1.5 15.2 1.6L256 65.1 346.3 2.8c4.5-3.1 10.2-3.7 15.2-1.6zM160 256a96 96 0 1 1 192 0 96 96 0 1 1 -192 0zm224 0a128 128 0 1 0 -256 0 128 128 0 1 0 256 0z"/></svg>`,"table-columns-solid-full":`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--! Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc. --><path d="M0 96C0 60.7 28.7 32 64 32l384 0c35.3 0 64 28.7 64 64l0 320c0 35.3-28.7 64-64 64L64 480c-35.3 0-64-28.7-64-64L0 96zm64 64l0 256 160 0 0-256L64 160zm384 0l-160 0 0 256 160 0 0-256z"/></svg>\r
`,"table-solid-full":`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free 7.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M480 96C515.3 96 544 124.7 544 160L544 480C544 515.3 515.3 544 480 544L160 544L153.5 543.7C121.2 540.4 96 513.1 96 480L96 160C96 124.7 124.7 96 160 96L480 96zM160 384L160 480L288 480L288 384L160 384zM352 384L352 480L480 480L480 384L352 384zM160 320L288 320L288 224L160 224L160 320zM352 320L480 320L480 224L352 224L352 320z"/></svg>`,"tag-solid-full":`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free 7.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M96.5 160L96.5 309.5C96.5 326.5 103.2 342.8 115.2 354.8L307.2 546.8C332.2 571.8 372.7 571.8 397.7 546.8L547.2 397.3C572.2 372.3 572.2 331.8 547.2 306.8L355.2 114.8C343.2 102.7 327 96 310 96L160.5 96C125.2 96 96.5 124.7 96.5 160zM208.5 176C226.2 176 240.5 190.3 240.5 208C240.5 225.7 226.2 240 208.5 240C190.8 240 176.5 225.7 176.5 208C176.5 190.3 190.8 176 208.5 176z"/></svg>\r
`,"tags-solid-full":`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free 7.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M433.2 103.1L581.4 253.4C609.1 281.5 609.1 326.5 581.4 354.6L425 512.9C415.7 522.3 400.5 522.4 391.1 513.1C381.7 503.8 381.6 488.6 390.9 479.2L547.3 320.8C556.5 311.5 556.5 296.4 547.3 287.1L399 136.9C389.7 127.5 389.8 112.3 399.2 103C408.6 93.7 423.8 93.8 433.1 103.2zM64.1 293.5L64.1 160C64.1 124.7 92.8 96 128.1 96L261.6 96C278.6 96 294.9 102.7 306.9 114.7L450.9 258.7C475.9 283.7 475.9 324.2 450.9 349.2L317.4 482.7C292.4 507.7 251.9 507.7 226.9 482.7L82.9 338.7C70.9 326.7 64.2 310.4 64.2 293.4zM208.1 208C208.1 190.3 193.8 176 176.1 176C158.4 176 144.1 190.3 144.1 208C144.1 225.7 158.4 240 176.1 240C193.8 240 208.1 225.7 208.1 208z"/></svg>\r
`,"terminal-solid-full":`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free 7.3.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M73.4 182.6C60.9 170.1 60.9 149.8 73.4 137.3C85.9 124.8 106.2 124.8 118.7 137.3L278.7 297.3C291.2 309.8 291.2 330.1 278.7 342.6L118.7 502.6C106.2 515.1 85.9 515.1 73.4 502.6C60.9 490.1 60.9 469.8 73.4 457.3L210.7 320L73.4 182.6zM288 448L544 448C561.7 448 576 462.3 576 480C576 497.7 561.7 512 544 512L288 512C270.3 512 256 497.7 256 480C256 462.3 270.3 448 288 448z"/></svg>`,"trash-solid-full":`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free 7.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M232.7 69.9L224 96L128 96C110.3 96 96 110.3 96 128C96 145.7 110.3 160 128 160L512 160C529.7 160 544 145.7 544 128C544 110.3 529.7 96 512 96L416 96L407.3 69.9C402.9 56.8 390.7 48 376.9 48L263.1 48C249.3 48 237.1 56.8 232.7 69.9zM512 208L128 208L149.1 531.1C150.7 556.4 171.7 576 197 576L443 576C468.3 576 489.3 556.4 490.9 531.1L512 208z"/></svg>\r
`,"triangle-exclamation-solid-full":`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free 7.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M320 64C334.7 64 348.2 72.1 355.2 85L571.2 485C577.9 497.4 577.6 512.4 570.4 524.5C563.2 536.6 550.1 544 536 544L104 544C89.9 544 76.8 536.6 69.6 524.5C62.4 512.4 62.1 497.4 68.8 485L284.8 85C291.8 72.1 305.3 64 320 64zM320 416C302.3 416 288 430.3 288 448C288 465.7 302.3 480 320 480C337.7 480 352 465.7 352 448C352 430.3 337.7 416 320 416zM320 224C301.8 224 287.3 239.5 288.6 257.7L296 361.7C296.9 374.2 307.4 384 319.9 384C332.5 384 342.9 374.3 343.8 361.7L351.2 257.7C352.5 239.5 338.1 224 319.8 224z"/></svg>`,"upload-solid-full":`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free 7.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M352 173.3L352 384C352 401.7 337.7 416 320 416C302.3 416 288 401.7 288 384L288 173.3L246.6 214.7C234.1 227.2 213.8 227.2 201.3 214.7C188.8 202.2 188.8 181.9 201.3 169.4L297.3 73.4C309.8 60.9 330.1 60.9 342.6 73.4L438.6 169.4C451.1 181.9 451.1 202.2 438.6 214.7C426.1 227.2 405.8 227.2 393.3 214.7L352 173.3zM320 464C364.2 464 400 428.2 400 384L480 384C515.3 384 544 412.7 544 448L544 480C544 515.3 515.3 544 480 544L160 544C124.7 544 96 515.3 96 480L96 448C96 412.7 124.7 384 160 384L240 384C240 428.2 275.8 464 320 464zM464 488C477.3 488 488 477.3 488 464C488 450.7 477.3 440 464 440C450.7 440 440 450.7 440 464C440 477.3 450.7 488 464 488z"/></svg>\r
`,"user-solid-full":`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><!--!Font Awesome Free 7.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M224 256A128 128 0 1 0 224 0a128 128 0 1 0 0 256zm-45.7 48C79.8 304 0 383.8 0 482.3C0 498.7 13.3 512 29.7 512l388.6 0c16.4 0 29.7-13.3 29.7-29.7C448 383.8 368.2 304 269.7 304l-91.4 0z"/></svg>\r
`,"wand-magic-sparkles-solid-full":`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free 7.3.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M295.4 37L310.2 73.8L347 88.6C350 89.8 352 92.8 352 96C352 99.2 350 102.2 347 103.4L310.2 118.2L295.4 155C294.2 158 291.2 160 288 160C284.8 160 281.8 158 280.6 155L265.8 118.2L229 103.4C226 102.2 224 99.2 224 96C224 92.8 226 89.8 229 88.6L265.8 73.8L280.6 37C281.8 34 284.8 32 288 32C291.2 32 294.2 34 295.4 37zM142.7 105.7L164.2 155.8L214.3 177.3C220.2 179.8 224 185.6 224 192C224 198.4 220.2 204.2 214.3 206.7L164.2 228.2L142.7 278.3C140.2 284.2 134.4 288 128 288C121.6 288 115.8 284.2 113.3 278.3L91.8 228.2L41.7 206.7C35.8 204.2 32 198.4 32 192C32 185.6 35.8 179.8 41.7 177.3L91.8 155.8L113.3 105.7C115.8 99.8 121.6 96 128 96C134.4 96 140.2 99.8 142.7 105.7zM496 368C502.4 368 508.2 371.8 510.7 377.7L532.2 427.8L582.3 449.3C588.2 451.8 592 457.6 592 464C592 470.4 588.2 476.2 582.3 478.7L532.2 500.2L510.7 550.3C508.2 556.2 502.4 560 496 560C489.6 560 483.8 556.2 481.3 550.3L459.8 500.2L409.7 478.7C403.8 476.2 400 470.4 400 464C400 457.6 403.8 451.8 409.7 449.3L459.8 427.8L481.3 377.7C483.8 371.8 489.6 368 496 368zM492 64C503 64 513.6 68.4 521.5 76.2L563.8 118.5C571.6 126.4 576 137 576 148C576 159 571.6 169.6 563.8 177.5L475.6 265.7L374.3 164.4L462.5 76.2C470.4 68.4 481 64 492 64zM76.2 462.5L340.4 198.3L441.7 299.6L177.5 563.8C169.6 571.6 159 576 148 576C137 576 126.4 571.6 118.5 563.8L76.2 521.5C68.4 513.6 64 503 64 492C64 481 68.4 470.4 76.2 462.5z"/></svg>`,"xmark-solid-full":`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><!--! Font Awesome Free 7.0.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc. --><path d="M55.1 73.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L147.2 256 9.9 393.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192.5 301.3 329.9 438.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.8 256 375.1 118.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192.5 210.7 55.1 73.4z"/></svg>\r
`};function Po(e){return t=>t in e?`data:image/svg+xml;utf8,${encodeURIComponent(e[t])}`:``}function Fo(e){let t=e?.libraryName??`my-icons`,n=e?.mutator??(e=>{e.setAttribute(`fill`,`currentColor`)});nn(t,{resolver:Po(No),mutator:n})}function Io(){Fo(),Fo({libraryName:`default`})}Io();var Lo=`hubaddress-sidepanel`;function Ro(e){let t=globalThis.chrome;return{connect:e?.connect??t?.runtime?.connect?.bind(t.runtime),getCurrentWindow:e?.getCurrentWindow??t?.windows?.getCurrent?.bind(t.windows),closeWindow:e?.closeWindow??(()=>{globalThis.window!==void 0&&globalThis.window.close()})}}function zo(e){return typeof e!=`object`||!e?!1:e.type===`close`}function Bo(e){let t=Ro(e);if(!t.connect)return()=>{};let n=!1,r=t.connect({name:Lo});return r.onMessage.addListener(e=>{!n&&zo(e)&&t.closeWindow?.()}),t.getCurrentWindow&&t.getCurrentWindow().then(e=>{!n&&typeof e?.id==`number`&&r.postMessage({type:`register`,windowId:e.id})}).catch(()=>{}),()=>{n=!0;try{r.disconnect()}catch{}}}var Vo=`:host{background-color:var(--wa-color-surface-default);width:100%;height:100%;color:var(--wa-color-text-normal);flex-direction:column;display:flex}.hubaddress-shell__tabs{gap:var(--wa-space-xs);padding:var(--wa-space-xs) var(--wa-space-s);border-bottom:var(--wa-border-width-s) solid var(--wa-color-surface-border);display:flex}.hubaddress-shell__tab-btn{flex:1}.hubaddress-shell__body{min-height:0;padding:var(--wa-space-s);flex:1;overflow-y:auto}.hubaddress-shell__split-grid{gap:var(--wa-space-s);flex-direction:column;display:flex}.hubaddress-shell__column{min-width:0;display:none}.hubaddress-shell__column[data-active=true]{display:block}.hubaddress-shell__column-toolbar{gap:var(--wa-space-xs);margin-bottom:var(--wa-space-s);flex-direction:column;display:flex}.hubaddress-shell__column-bar{justify-content:space-between;align-items:center;gap:var(--wa-space-xs);display:flex}.hubaddress-shell__column-heading{font-size:var(--wa-font-size-m);font-weight:var(--wa-font-weight-semibold);color:var(--wa-color-text-normal);margin:0}.hubaddress-shell__hidden-input{display:none}.hubaddress-shell__empty{padding:var(--wa-space-m);text-align:center;font-size:var(--wa-font-size-s);color:var(--wa-color-text-quiet)}.hubaddress-shell__toast{left:var(--wa-space-s);right:var(--wa-space-s);bottom:var(--wa-space-s);z-index:100;padding:var(--wa-space-xs) var(--wa-space-s);border-radius:var(--wa-border-radius-m);border:var(--wa-border-width-s) solid var(--wa-color-brand-border-normal);background-color:var(--wa-color-surface-raised);color:var(--wa-color-text-normal);font-size:var(--wa-font-size-s);box-shadow:var(--wa-shadow-m);position:fixed}@media (min-width:680px){.hubaddress-shell__split-grid{align-items:start;gap:var(--wa-space-m);grid-template-columns:1fr 1fr;display:grid}.hubaddress-shell__column{display:block}.hubaddress-shell__tab-btn--directory{display:none}}`,Ho=`.directory-card-list{gap:var(--wa-space-s);flex-direction:column;display:flex}.directory-card{gap:var(--wa-space-xs);padding:var(--wa-space-s) var(--wa-space-m);border:var(--wa-border-width-s) solid var(--wa-color-surface-border);border-radius:var(--wa-border-radius-m);background-color:var(--wa-color-surface-default);flex-direction:column;display:flex}.directory-card:hover{background-color:var(--wa-color-surface-lowered);border-color:var(--wa-color-brand-border-normal)}.directory-card__header{justify-content:space-between;align-items:center;gap:var(--wa-space-xs);min-height:28px;display:flex}.directory-card__actions{align-items:center;gap:var(--wa-space-3xs);flex-shrink:0;display:inline-flex}.directory-card__action-btn{border-radius:var(--wa-border-radius-s);width:28px;height:28px;color:var(--wa-color-text-quiet);font-size:var(--wa-font-size-s);cursor:pointer;background:0 0;border:none;justify-content:center;align-items:center;padding:0;display:inline-flex}.directory-card__action-btn:hover{background-color:var(--wa-color-neutral-fill-quiet);color:var(--wa-color-text-normal)}.directory-card__title-group{align-items:center;gap:var(--wa-space-xs);flex-wrap:wrap;min-width:0;display:flex}.directory-card__title-group--staff{flex-wrap:nowrap;align-items:stretch}.directory-card__name{font-size:var(--wa-font-size-m);line-height:1.4;font-weight:var(--wa-font-weight-semibold);color:var(--wa-color-text-normal);margin:0}.directory-card__staff-id{box-sizing:border-box;height:100%;font-size:var(--wa-font-size-s);font-variant-numeric:tabular-nums}.directory-card__inline-copy-btn{border-radius:var(--wa-border-radius-s);cursor:pointer;background:0 0;border:none;flex-shrink:0;align-self:stretch;align-items:stretch;padding:0;display:inline-flex}.directory-card__inline-copy-btn:hover{box-shadow:0 0 0 var(--wa-border-width-s) var(--wa-color-brand-border-normal)}.directory-card__name-copy-btn{color:inherit;font:inherit;line-height:inherit;text-align:left;cursor:pointer;background:0 0;border:none;padding:0}.directory-card__name-copy-btn:hover{color:var(--wa-color-brand-on-quiet);text-decoration:underline}.directory-card__name-stack{flex-direction:column;gap:1px;min-width:0;display:inline-flex}.directory-card__furigana{font-size:var(--wa-font-size-xs);color:var(--wa-color-text-quiet);line-height:1.2}.directory-card__name-row{align-items:baseline;gap:var(--wa-space-xs);flex-wrap:wrap;min-width:0;display:flex}.directory-card__sub{font-size:var(--wa-font-size-s);color:var(--wa-color-text-quiet);line-height:1.4}.directory-card__meta-row{justify-content:space-between;align-items:center;gap:var(--wa-space-xs);flex-wrap:wrap;display:flex}.directory-card__dept-btn{align-items:center;gap:var(--wa-space-2xs);color:var(--wa-color-text-normal);font:inherit;font-size:var(--wa-font-size-s);text-align:left;cursor:pointer;background:0 0;border:none;padding:0;line-height:1.4;display:inline-flex}.directory-card__dept-btn:hover{text-decoration:underline}.directory-card__toggle-btn{align-items:center;gap:var(--wa-space-3xs);padding:var(--wa-space-2xs) var(--wa-space-xs);border:var(--wa-border-width-s) solid var(--wa-color-surface-border);border-radius:var(--wa-border-radius-s);background-color:var(--wa-color-surface-raised);color:var(--wa-color-text-quiet);font:inherit;font-size:var(--wa-font-size-s);cursor:pointer;display:inline-flex}.directory-card__toggle-btn:hover{border-color:var(--wa-color-brand-border-normal);color:var(--wa-color-text-normal)}.directory-card__contacts{gap:var(--wa-space-xs);flex-wrap:wrap;display:flex}.directory-card__copy-btn{align-items:center;gap:var(--wa-space-2xs);padding:var(--wa-space-2xs) var(--wa-space-xs);border:var(--wa-border-width-s) solid var(--wa-color-surface-border);border-radius:var(--wa-border-radius-s);background-color:var(--wa-color-surface-raised);color:var(--wa-color-text-normal);font:inherit;font-size:var(--wa-font-size-s);cursor:pointer;max-width:100%;line-height:1.4;display:inline-flex}.directory-card__copy-btn:hover{border-color:var(--wa-color-brand-border-normal)}.directory-card__copy-btn wa-icon{color:var(--wa-color-text-quiet);flex-shrink:0}.directory-card__copy-value{text-overflow:ellipsis;white-space:nowrap;overflow:hidden}.directory-card__place{align-items:center;gap:var(--wa-space-2xs);font-size:var(--wa-font-size-s);color:var(--wa-color-text-quiet);line-height:1.4;display:flex}.directory-card__notes{font-size:var(--wa-font-size-s);color:var(--wa-color-text-quiet);margin:0;line-height:1.4}`,Uo=`.settings-view{gap:var(--wa-space-s);flex-direction:column;display:flex}.settings-view__section{gap:var(--wa-space-xs);padding:var(--wa-space-m);border:var(--wa-border-width-s) solid var(--wa-color-surface-border);border-radius:var(--wa-border-radius-m);background-color:var(--wa-color-surface-default);flex-direction:column;display:flex}.settings-view__theme-row{justify-content:space-between;align-items:center;gap:var(--wa-space-s);display:flex}.settings-view__heading{font-size:var(--wa-font-size-m);font-weight:var(--wa-font-weight-semibold);color:var(--wa-color-text-normal);margin:0}.settings-view__description{font-size:var(--wa-font-size-s);color:var(--wa-color-text-quiet);margin:0;line-height:1.5}.settings-view__stats{gap:var(--wa-space-xs);flex-wrap:wrap;display:flex}.settings-view__btn-grid{gap:var(--wa-space-xs);grid-template-columns:1fr;display:grid}.settings-view__shortcut-code{padding:var(--wa-space-3xs) var(--wa-space-xs);border-radius:var(--wa-border-radius-s);border:var(--wa-border-width-s) solid var(--wa-color-surface-border);background-color:var(--wa-color-surface-lowered);font-family:monospace;font-size:var(--wa-font-size-s);display:inline-block}`,Wo=`.editor-dialog__form{gap:var(--wa-space-s);flex-direction:column;display:flex}.editor-dialog__error{font-size:var(--wa-font-size-s);color:var(--wa-color-danger-text-normal);margin:0}.editor-dialog__summary{font-size:var(--wa-font-size-m);color:var(--wa-color-text-normal);margin:0;line-height:1.5}.editor-dialog__meta{font-size:var(--wa-font-size-s);color:var(--wa-color-text-quiet);margin:0;line-height:1.5}.editor-dialog__footer{justify-content:flex-end;gap:var(--wa-space-xs);display:flex}`,Go=c(o(((e,t)=>{((n,r)=>{typeof e==`object`&&t!==void 0?t.exports=r():typeof define==`function`&&define.amd?define(r):(n=typeof globalThis<`u`?globalThis:n||self).Dexie=r()})(e,function(){var e=function(t,n){return(e=Object.setPrototypeOf||({__proto__:[]}instanceof Array?function(e,t){e.__proto__=t}:function(e,t){for(var n in t)Object.prototype.hasOwnProperty.call(t,n)&&(e[n]=t[n])}))(t,n)},t=function(){return(t=Object.assign||function(e){for(var t,n=1,r=arguments.length;n<r;n++)for(var i in t=arguments[n])Object.prototype.hasOwnProperty.call(t,i)&&(e[i]=t[i]);return e}).apply(this,arguments)};function n(e,t,n){if(n||arguments.length===2)for(var r,i=0,a=t.length;i<a;i++)!r&&i in t||((r||=Array.prototype.slice.call(t,0,i))[i]=t[i]);return e.concat(r||Array.prototype.slice.call(t))}var r=typeof globalThis<`u`?globalThis:typeof self<`u`?self:typeof window<`u`?window:global,i=Object.keys,a=Array.isArray;function o(e,t){return typeof t==`object`&&i(t).forEach(function(n){e[n]=t[n]}),e}typeof Promise>`u`||r.Promise||(r.Promise=Promise);var s=Object.getPrototypeOf,c={}.hasOwnProperty;function l(e,t){return c.call(e,t)}function u(e,t){typeof t==`function`&&(t=t(s(e))),(typeof Reflect>`u`?i:Reflect.ownKeys)(t).forEach(function(n){f(e,n,t[n])})}var d=Object.defineProperty;function f(e,t,n,r){d(e,t,o(n&&l(n,`get`)&&typeof n.get==`function`?{get:n.get,set:n.set,configurable:!0}:{value:n,configurable:!0,writable:!0},r))}function p(e){return{from:function(t){return e.prototype=Object.create(t.prototype),f(e.prototype,`constructor`,e),{extend:u.bind(null,e.prototype)}}}}var m=Object.getOwnPropertyDescriptor,h=[].slice;function g(e,t,n){return h.call(e,t,n)}function _(e,t){return t(e)}function v(e){if(!e)throw Error(`Assertion Failed`)}function y(e){r.setImmediate?setImmediate(e):setTimeout(e,0)}function b(e,t){if(typeof t==`string`&&l(e,t))return e[t];if(!t)return e;if(typeof t!=`string`){for(var n=[],r=0,i=t.length;r<i;++r){var a=b(e,t[r]);n.push(a)}return n}var o,s=t.indexOf(`.`);return s===-1||(o=e[t.substr(0,s)])==null?void 0:b(o,t.substr(s+1))}function x(e,t,n){if(e&&t!==void 0&&!(`isFrozen`in Object&&Object.isFrozen(e))){if(typeof t!=`string`&&`length`in t){v(typeof n!=`string`&&`length`in n);for(var r=0,i=t.length;r<i;++r)x(e,t[r],n[r])}else{var o=t.indexOf(`.`);if(o!==-1){var s=t.substr(0,o),o=t.substr(o+1);if(o===``)n===void 0?a(e)&&!isNaN(parseInt(s))?e.splice(s,1):delete e[s]:e[s]=n;else{var c=e[s];if(!c||!l(e,s)){if(n===void 0)return;c=e[s]={}}x(c,o,n)}}else n===void 0?a(e)&&!isNaN(parseInt(t))?e.splice(t,1):delete e[t]:e[t]=n}}}function S(e){var t,n={};for(t in e)l(e,t)&&(n[t]=e[t]);return n}var C=[].concat;function w(e){return C.apply([],e)}var T=`BigUint64Array,BigInt64Array,Array,Boolean,String,Date,RegExp,Blob,File,FileList,FileSystemFileHandle,FileSystemDirectoryHandle,ArrayBuffer,DataView,Uint8ClampedArray,ImageBitmap,ImageData,Map,Set,CryptoKey`.split(`,`).concat(w([8,16,32,64].map(function(e){return[`Int`,`Uint`,`Float`].map(function(t){return t+e+`Array`})}))).filter(function(e){return r[e]}),E=new Set(T.map(function(e){return r[e]})),ee=null;function te(e){return ee=new WeakMap,e=function e(t){if(!t||typeof t!=`object`)return t;var n=ee.get(t);if(n)return n;if(a(t)){n=[],ee.set(t,n);for(var r=0,i=t.length;r<i;++r)n.push(e(t[r]))}else if(E.has(t.constructor))n=t;else{var o,c=s(t);for(o in n=c===Object.prototype?{}:Object.create(c),ee.set(t,n),t)l(t,o)&&(n[o]=e(t[o]))}return n}(e),ee=null,e}var ne={}.toString;function re(e){return ne.call(e).slice(8,-1)}var D=typeof Symbol<`u`?Symbol.iterator:`@@iterator`,ie=typeof D==`symbol`?function(e){var t;return e!=null&&(t=e[D])&&t.apply(e)}:function(){return null};function O(e,t){t=e.indexOf(t),0<=t&&e.splice(t,1)}var ae={};function oe(e){var t,n,r,i;if(arguments.length===1){if(a(e))return e.slice();if(this===ae&&typeof e==`string`)return[e];if(i=ie(e))for(n=[];!(r=i.next()).done;)n.push(r.value);else{if(e==null||typeof(t=e.length)!=`number`)return[e];for(n=Array(t);t--;)n[t]=e[t]}}else for(t=arguments.length,n=Array(t);t--;)n[t]=arguments[t];return n}var se=typeof Symbol<`u`?function(e){return e[Symbol.toStringTag]===`AsyncFunction`}:function(){return!1},T=[`Unknown`,`Constraint`,`Data`,`TransactionInactive`,`ReadOnly`,`Version`,`NotFound`,`InvalidState`,`InvalidAccess`,`Abort`,`Timeout`,`QuotaExceeded`,`Syntax`,`DataClone`],ce=[`Modify`,`Bulk`,`OpenFailed`,`VersionChange`,`Schema`,`Upgrade`,`InvalidTable`,`MissingAPI`,`NoSuchDatabase`,`InvalidArgument`,`SubTransaction`,`Unsupported`,`Internal`,`DatabaseClosed`,`PrematureCommit`,`ForeignAwait`].concat(T),le={VersionChanged:`Database version changed by other database connection`,DatabaseClosed:`Database has been closed`,Abort:`Transaction aborted`,TransactionInactive:`Transaction has already completed or failed`,MissingAPI:`IndexedDB API missing. Please visit https://tinyurl.com/y2uuvskb`};function ue(e,t){this.name=e,this.message=t}function de(e,t){return e+`. Errors: `+Object.keys(t).map(function(e){return t[e].toString()}).filter(function(e,t,n){return n.indexOf(e)===t}).join(`
`)}function fe(e,t,n,r){this.failures=t,this.failedKeys=r,this.successCount=n,this.message=de(e,t)}function pe(e,t){this.name=`BulkError`,this.failures=Object.keys(t).map(function(e){return t[e]}),this.failuresByPos=t,this.message=de(e,this.failures)}p(ue).from(Error).extend({toString:function(){return this.name+`: `+this.message}}),p(fe).from(ue),p(pe).from(ue);var me=ce.reduce(function(e,t){return e[t]=t+`Error`,e},{}),he=ue,k=ce.reduce(function(e,t){var n=t+`Error`;function r(e,r){this.name=n,e?typeof e==`string`?(this.message=`${e}${r?`
 `+r:``}`,this.inner=r||null):typeof e==`object`&&(this.message=`${e.name} ${e.message}`,this.inner=e):(this.message=le[t]||n,this.inner=null)}return p(r).from(he),e[t]=r,e},{}),ge=(k.Syntax=SyntaxError,k.Type=TypeError,k.Range=RangeError,T.reduce(function(e,t){return e[t+`Error`]=k[t],e},{}));T=ce.reduce(function(e,t){return[`Syntax`,`Type`,`Range`].indexOf(t)===-1&&(e[t+`Error`]=k[t]),e},{});function A(){}function _e(e){return e}function ve(e,t){return e==null||e===_e?t:function(n){return t(e(n))}}function ye(e,t){return function(){e.apply(this,arguments),t.apply(this,arguments)}}function be(e,t){return e===A?t:function(){var n=e.apply(this,arguments),r=(n!==void 0&&(arguments[0]=n),this.onsuccess),i=this.onerror,a=(this.onsuccess=null,this.onerror=null,t.apply(this,arguments));return r&&(this.onsuccess=this.onsuccess?ye(r,this.onsuccess):r),i&&(this.onerror=this.onerror?ye(i,this.onerror):i),a===void 0?n:a}}function xe(e,t){return e===A?t:function(){e.apply(this,arguments);var n=this.onsuccess,r=this.onerror;this.onsuccess=this.onerror=null,t.apply(this,arguments),n&&(this.onsuccess=this.onsuccess?ye(n,this.onsuccess):n),r&&(this.onerror=this.onerror?ye(r,this.onerror):r)}}function Se(e,t){return e===A?t:function(n){var r=e.apply(this,arguments),n=(o(n,r),this.onsuccess),i=this.onerror,a=(this.onsuccess=null,this.onerror=null,t.apply(this,arguments));return n&&(this.onsuccess=this.onsuccess?ye(n,this.onsuccess):n),i&&(this.onerror=this.onerror?ye(i,this.onerror):i),r===void 0?a===void 0?void 0:a:o(r,a)}}function j(e,t){return e===A?t:function(){return!1!==t.apply(this,arguments)&&e.apply(this,arguments)}}function Ce(e,t){return e===A?t:function(){var n=e.apply(this,arguments);if(n&&typeof n.then==`function`){for(var r=this,i=arguments.length,a=Array(i);i--;)a[i]=arguments[i];return n.then(function(){return t.apply(r,a)})}return t.apply(this,arguments)}}T.ModifyError=fe,T.DexieError=ue,T.BulkError=pe;var M=typeof location<`u`&&/^(http|https):\/\/(localhost|127\.0\.0\.1)/.test(location.href);function we(e){M=e}var Te={},Ee=100,De=typeof Promise>`u`?[]:(ce=Promise.resolve(),typeof crypto<`u`&&crypto.subtle?[De=crypto.subtle.digest(`SHA-512`,new Uint8Array([0])),s(De),ce]:[ce,s(ce),ce]),ce=De[0],Oe=De[1],Oe=Oe&&Oe.then,ke=ce&&ce.constructor,Ae=!!De[2],je=function(e,t){Re.push([e,t]),Ne&&=(queueMicrotask(Ke),!1)},Me=!0,Ne=!0,Pe=[],Fe=[],Ie=_e,Le={id:`global`,global:!0,ref:0,unhandleds:[],onunhandled:A,pgp:!1,env:{},finalize:A},N=Le,Re=[],ze=0,Be=[];function P(e){if(typeof this!=`object`)throw TypeError(`Promises must be constructed via new`);this._listeners=[],this._lib=!1;var t=this._PSD=N;if(typeof e!=`function`){if(e!==Te)throw TypeError(`Not a function`);this._state=arguments[1],this._value=arguments[2],!1===this._state&&Ue(this,this._value)}else this._state=null,this._value=null,++t.ref,function e(t,n){try{n(function(n){if(t._state===null){if(n===t)throw TypeError(`A promise cannot be resolved with itself.`);var r=t._lib&&qe();n&&typeof n.then==`function`?e(t,function(e,t){n instanceof P?n._then(e,t):n.then(e,t)}):(t._state=!0,t._value=n,We(t)),r&&Je()}},Ue.bind(null,t))}catch(e){Ue(t,e)}}(this,e)}var Ve={get:function(){var e=N,t=B;function n(n,r){var i=this,a=!e.global&&(e!==N||t!==B),o=a&&!tt(),s=new P(function(t,s){Ge(i,new He(ot(n,e,a,o),ot(r,e,a,o),t,s,e))});return this._consoleTask&&(s._consoleTask=this._consoleTask),s}return n.prototype=Te,n},set:function(e){f(this,`then`,e&&e.prototype===Te?Ve:{get:function(){return e},set:Ve.set})}};function He(e,t,n,r,i){this.onFulfilled=typeof e==`function`?e:null,this.onRejected=typeof t==`function`?t:null,this.resolve=n,this.reject=r,this.psd=i}function Ue(e,t){var n,r;Fe.push(t),e._state===null&&(n=e._lib&&qe(),t=Ie(t),e._state=!1,e._value=t,r=e,Pe.some(function(e){return e._value===r._value})||Pe.push(r),We(e),n)&&Je()}function We(e){var t=e._listeners;e._listeners=[];for(var n=0,r=t.length;n<r;++n)Ge(e,t[n]);var i=e._PSD;--i.ref||i.finalize(),ze===0&&(++ze,je(function(){--ze==0&&Ye()},[]))}function Ge(e,t){if(e._state===null)e._listeners.push(t);else{var n=e._state?t.onFulfilled:t.onRejected;if(n===null)return(e._state?t.resolve:t.reject)(e._value);++t.psd.ref,++ze,je(F,[n,e,t])}}function F(e,t,n){try{var r,i=t._value;!t._state&&Fe.length&&(Fe=[]),r=M&&t._consoleTask?t._consoleTask.run(function(){return e(i)}):e(i),t._state||Fe.indexOf(i)!==-1||(e=>{for(var t=Pe.length;t;)if(Pe[--t]._value===e._value)return Pe.splice(t,1)})(t),n.resolve(r)}catch(e){n.reject(e)}finally{--ze==0&&Ye(),--n.psd.ref||n.psd.finalize()}}function Ke(){at(Le,function(){qe()&&Je()})}function qe(){var e=Me;return Ne=Me=!1,e}function Je(){var e,t,n;do for(;0<Re.length;)for(e=Re,Re=[],n=e.length,t=0;t<n;++t){var r=e[t];r[0].apply(null,r[1])}while(0<Re.length);Ne=Me=!0}function Ye(){for(var e=Pe,t=(Pe=[],e.forEach(function(e){e._PSD.onunhandled.call(null,e._value,e)}),Be.slice(0)),n=t.length;n;)t[--n]()}function I(e){return new P(Te,!1,e)}function L(e,t){var n=N;return function(){var r=qe(),i=N;try{return rt(n,!0),e.apply(this,arguments)}catch(e){t&&t(e)}finally{rt(i,!1),r&&Je()}}}u(P.prototype,{then:Ve,_then:function(e,t){Ge(this,new He(null,null,e,t,N))},catch:function(e){var t,n;return arguments.length===1?this.then(null,e):(t=e,n=arguments[1],typeof t==`function`?this.then(null,function(e){return(e instanceof t?n:I)(e)}):this.then(null,function(e){return(e&&e.name===t?n:I)(e)}))},finally:function(e){return this.then(function(t){return P.resolve(e()).then(function(){return t})},function(t){return P.resolve(e()).then(function(){return I(t)})})},timeout:function(e,t){var n=this;return e<1/0?new P(function(r,i){var a=setTimeout(function(){return i(new k.Timeout(t))},e);n.then(r,i).finally(clearTimeout.bind(null,a))}):this}}),typeof Symbol<`u`&&Symbol.toStringTag&&f(P.prototype,Symbol.toStringTag,`Dexie.Promise`),Le.env=it(),u(P,{all:function(){var e=oe.apply(null,arguments).map(nt);return new P(function(t,n){e.length===0&&t([]);var r=e.length;e.forEach(function(i,a){return P.resolve(i).then(function(n){e[a]=n,--r||t(e)},n)})})},resolve:function(e){return e instanceof P?e:e&&typeof e.then==`function`?new P(function(t,n){e.then(t,n)}):new P(Te,!0,e)},reject:I,race:function(){var e=oe.apply(null,arguments).map(nt);return new P(function(t,n){e.map(function(e){return P.resolve(e).then(t,n)})})},PSD:{get:function(){return N},set:function(e){return N=e}},totalEchoes:{get:function(){return B}},newPSD:$e,usePSD:at,scheduler:{get:function(){return je},set:function(e){je=e}},rejectionMapper:{get:function(){return Ie},set:function(e){Ie=e}},follow:function(e,t){return new P(function(n,r){return $e(function(t,n){var r=N;r.unhandleds=[],r.onunhandled=n,r.finalize=ye(function(){var e,r=this;e=function(){r.unhandleds.length===0?t():n(r.unhandleds[0])},Be.push(function t(){e(),Be.splice(Be.indexOf(t),1)}),++ze,je(function(){--ze==0&&Ye()},[])},r.finalize),e()},t,n,r)})}}),ke&&(ke.allSettled&&f(P,`allSettled`,function(){var e=oe.apply(null,arguments).map(nt);return new P(function(t){e.length===0&&t([]);var n=e.length,r=Array(n);e.forEach(function(e,i){return P.resolve(e).then(function(e){return r[i]={status:`fulfilled`,value:e}},function(e){return r[i]={status:`rejected`,reason:e}}).then(function(){return--n||t(r)})})})}),ke.any&&typeof AggregateError<`u`&&f(P,`any`,function(){var e=oe.apply(null,arguments).map(nt);return new P(function(t,n){e.length===0&&n(AggregateError([]));var r=e.length,i=Array(r);e.forEach(function(e,a){return P.resolve(e).then(function(e){return t(e)},function(e){i[a]=e,--r||n(AggregateError(i))})})})}),ke.withResolvers)&&(P.withResolvers=ke.withResolvers);var Xe={awaits:0,echoes:0,id:0},R=0,z=[],Ze=0,B=0,Qe=0;function $e(e,t,n,r){var i=N,a=Object.create(i),t=(a.parent=i,a.ref=0,a.global=!1,a.id=++Qe,Le.env,a.env=Ae?{Promise:P,PromiseProp:{value:P,configurable:!0,writable:!0},all:P.all,race:P.race,allSettled:P.allSettled,any:P.any,resolve:P.resolve,reject:P.reject}:{},t&&o(a,t),++i.ref,a.finalize=function(){--this.parent.ref||this.parent.finalize()},at(a,e,n,r));return a.ref===0&&a.finalize(),t}function et(){return Xe.id||=++R,++Xe.awaits,Xe.echoes+=Ee,Xe.id}function tt(){return!!Xe.awaits&&(--Xe.awaits==0&&(Xe.id=0),Xe.echoes=Xe.awaits*Ee,!0)}function nt(e){return Xe.echoes&&e&&e.constructor===ke?(et(),e.then(function(e){return tt(),e},function(e){return tt(),H(e)})):e}function V(){var e=z[z.length-1];z.pop(),rt(e,!1)}function rt(e,t){var n,i,a=N;(t?!Xe.echoes||Ze++&&e===N:!Ze||--Ze&&e===N)||queueMicrotask(t?function(e){++B,Xe.echoes&&--Xe.echoes!=0||(Xe.echoes=Xe.awaits=Xe.id=0),z.push(N),rt(e,!0)}.bind(null,e):V),e!==N&&(N=e,a===Le&&(Le.env=it()),Ae)&&(n=Le.env.Promise,i=e.env,a.global||e.global)&&(Object.defineProperty(r,"Promise",i.PromiseProp),n.all=i.all,n.race=i.race,n.resolve=i.resolve,n.reject=i.reject,i.allSettled&&(n.allSettled=i.allSettled),i.any)&&(n.any=i.any)}function it(){var e=r.Promise;return Ae?{Promise:e,PromiseProp:Object.getOwnPropertyDescriptor(r,`Promise`),all:e.all,race:e.race,allSettled:e.allSettled,any:e.any,resolve:e.resolve,reject:e.reject}:{}}function at(e,t,n,r,i){var a=N;try{return rt(e,!0),t(n,r,i)}finally{rt(a,!1)}}function ot(e,t,n,r){return typeof e==`function`?function(){var i=N;n&&et(),rt(t,!0);try{return e.apply(this,arguments)}finally{rt(i,!1),r&&queueMicrotask(tt)}}:e}function st(e){Promise===ke&&Xe.echoes===0?Ze===0?e():enqueueNativeMicroTask(e):setTimeout(e,0)}(``+Oe).indexOf(`[native code]`)===-1&&(et=tt=A);var H=P.reject,ct=`￿`,lt=`Invalid key provided. Keys must be of type string, number, Date or Array<string | number | Date>.`,ut=`String expected.`,dt=`__dbnames`,ft=`readonly`,U=`readwrite`;function pt(e,t){return e?t?function(){return e.apply(this,arguments)&&t.apply(this,arguments)}:e:t}var mt={type:3,lower:-1/0,lowerOpen:!1,upper:[[]],upperOpen:!1};function ht(e){return typeof e!=`string`||/\./.test(e)?function(e){return e}:function(t){return t[e]===void 0&&e in t&&delete(t=te(t))[e],t}}function gt(){throw k.Type(`Entity instances must never be new:ed. Instances are generated by the framework bypassing the constructor.`)}function W(e,t){try{var n=_t(e),r=_t(t);if(n!==r)return n===`Array`?1:r===`Array`?-1:n===`binary`?1:r===`binary`?-1:n===`string`?1:r===`string`?-1:n===`Date`?1:r===`Date`?-1:NaN;switch(n){case`number`:case`Date`:case`string`:return t<e?1:e<t?-1:0;case`binary`:for(var i=vt(e),a=vt(t),o=i.length,s=a.length,c=o<s?o:s,l=0;l<c;++l)if(i[l]!==a[l])return i[l]<a[l]?-1:1;return o===s?0:o<s?-1:1;case`Array`:for(var u=e,d=t,f=u.length,p=d.length,m=f<p?f:p,h=0;h<m;++h){var g=W(u[h],d[h]);if(g!==0)return g}return f===p?0:f<p?-1:1}}catch{}return NaN}function _t(e){var t=typeof e;return t==`object`&&(ArrayBuffer.isView(e)||(t=re(e))===`ArrayBuffer`)?`binary`:t}function vt(e){return e instanceof Uint8Array?e:ArrayBuffer.isView(e)?new Uint8Array(e.buffer,e.byteOffset,e.byteLength):new Uint8Array(e)}function yt(e,t,n){var r=e.schema.yProps;return r?(t&&0<n.numFailures&&(t=t.filter(function(e,t){return!n.failures[t]})),Promise.all(r.map(function(n){return n=n.updatesTable,t?e.db.table(n).where(`k`).anyOf(t).delete():e.db.table(n).clear()})).then(function(){return n})):n}xt.prototype.execute=function(e){var t=this[`@@propmod`];if(t.add!==void 0){var r=t.add;if(a(r))return n(n([],a(e)?e:[],!0),r,!0).sort();if(typeof r==`number`)return(Number(e)||0)+r;if(typeof r==`bigint`)try{return BigInt(e)+r}catch{return BigInt(0)+r}throw TypeError(`Invalid term ${r}`)}if(t.remove!==void 0){var i=t.remove;if(a(i))return a(e)?e.filter(function(e){return!i.includes(e)}).sort():[];if(typeof i==`number`)return Number(e)-i;if(typeof i==`bigint`)try{return BigInt(e)-i}catch{return BigInt(0)-i}throw TypeError(`Invalid subtrahend ${i}`)}return r=(r=t.replacePrefix)?.[0],r&&typeof e==`string`&&e.startsWith(r)?t.replacePrefix[1]+e.substring(r.length):e};var bt=xt;function xt(e){this[`@@propmod`]=e}function St(e,t){for(var n=i(t),r=n.length,a=!1,o=0;o<r;++o){var s=n[o],c=t[s],l=b(e,s);c instanceof bt?(x(e,s,c.execute(l)),a=!0):l!==c&&(x(e,s,c),a=!0)}return a}G.prototype._trans=function(e,t,n){var r=this._tx||N.trans,i=this.name,a=M&&typeof console<`u`&&console.createTask&&console.createTask(`Dexie: ${e===`readonly`?`read`:`write`} ${this.name}`);function o(e,n,r){if(r.schema[i])return t(r.idbtrans,r);throw new k.NotFound(`Table `+i+` not part of transaction`)}var s=qe();try{var c=r&&r.db._novip===this.db._novip?r===N.trans?r._promise(e,o,n):$e(function(){return r._promise(e,o,n)},{trans:r,transless:N.transless||N}):function e(t,n,r,i){if(t.idbdb&&(t._state.openComplete||N.letThrough||t._vip)){var a=t._createTransaction(n,r,t._dbSchema);try{a.create(),t._state.PR1398_maxLoop=3}catch(a){return a.name===me.InvalidState&&t.isOpen()&&0<--t._state.PR1398_maxLoop?(console.warn(`Dexie: Need to reopen db`),t.close({disableAutoOpen:!1}),t.open().then(function(){return e(t,n,r,i)})):H(a)}return a._promise(n,function(e,t){return $e(function(){return N.trans=a,i(e,t,a)})}).then(function(e){if(n===`readwrite`)try{a.idbtrans.commit()}catch{}return n===`readonly`?e:a._completion.then(function(){return e})})}if(t._state.openComplete)return H(new k.DatabaseClosed(t._state.dbOpenError));if(!t._state.isBeingOpened){if(!t._state.autoOpen)return H(new k.DatabaseClosed);t.open().catch(A)}return t._state.dbReadyPromise.then(function(){return e(t,n,r,i)})}(this.db,e,[this.name],o);return a&&(c._consoleTask=a,c=c.catch(function(e){return console.trace(e),H(e)})),c}finally{s&&Je()}},G.prototype.get=function(e,t){var n=this;return e&&e.constructor===Object?this.where(e).first(t):e==null?H(new k.Type(`Invalid argument to Table.get()`)):this._trans(`readonly`,function(t){return n.core.get({trans:t,key:e}).then(function(e){return n.hook.reading.fire(e)})}).then(t)},G.prototype.where=function(e){if(typeof e==`string`)return new this.db.WhereClause(this,e);if(a(e))return new this.db.WhereClause(this,`[${e.join(`+`)}]`);var t=i(e);if(t.length===1)return this.where(t[0]).equals(e[t[0]]);var n=this.schema.indexes.concat(this.schema.primKey).filter(function(e){if(e.compound&&t.every(function(t){return 0<=e.keyPath.indexOf(t)})){for(var n=0;n<t.length;++n)if(t.indexOf(e.keyPath[n])===-1)return!1;return!0}return!1}).sort(function(e,t){return e.keyPath.length-t.keyPath.length})[0];if(n&&this.db._maxKey!==ct)return s=n.keyPath.slice(0,t.length),this.where(s).equals(s.map(function(t){return e[t]}));!n&&M&&console.warn(`The query ${JSON.stringify(e)} on ${this.name} would benefit from a compound index [${t.join(`+`)}]`);var r=this.schema.idxByName;function o(e,t){return W(e,t)===0}var s=t.reduce(function(t,n){var i=t[0],t=t[1],s=r[n],c=e[n];return[i||s,i||!s?pt(t,s&&s.multi?function(e){return e=b(e,n),a(e)&&e.some(function(e){return o(c,e)})}:function(e){return o(c,b(e,n))}):t]},[null,null]),c=s[0],s=s[1];return c?this.where(c.name).equals(e[c.keyPath]).filter(s):n?this.filter(s):this.where(t).equals(``)},G.prototype.filter=function(e){return this.toCollection().and(e)},G.prototype.count=function(e){return this.toCollection().count(e)},G.prototype.offset=function(e){return this.toCollection().offset(e)},G.prototype.limit=function(e){return this.toCollection().limit(e)},G.prototype.each=function(e){return this.toCollection().each(e)},G.prototype.toArray=function(e){return this.toCollection().toArray(e)},G.prototype.toCollection=function(){return new this.db.Collection(new this.db.WhereClause(this))},G.prototype.orderBy=function(e){return new this.db.Collection(new this.db.WhereClause(this,a(e)?`[${e.join(`+`)}]`:e))},G.prototype.reverse=function(){return this.toCollection().reverse()},G.prototype.mapToClass=function(t){for(var n=this.db,r=this.name,i=((this.schema.mappedClass=t).prototype instanceof gt&&(t=(t=>{var i=s,a=t;if(typeof a!=`function`&&a!==null)throw TypeError(`Class extends value `+String(a)+` is not a constructor or null`);function o(){this.constructor=i}function s(){return t!==null&&t.apply(this,arguments)||this}return e(i,a),i.prototype=a===null?Object.create(a):(o.prototype=a.prototype,new o),Object.defineProperty(s.prototype,"db",{get:function(){return n},enumerable:!1,configurable:!0}),s.prototype.table=function(){return r},s})(t)),new Set),a=t.prototype;a;a=s(a))Object.getOwnPropertyNames(a).forEach(function(e){return i.add(e)});function o(e){if(!e)return e;var n,r=Object.create(t.prototype);for(n in e)if(!i.has(n))try{r[n]=e[n]}catch{}return r}return this.schema.readHook&&this.hook.reading.unsubscribe(this.schema.readHook),this.schema.readHook=o,this.hook(`reading`,o),t},G.prototype.defineClass=function(){return this.mapToClass(function(e){o(this,e)})},G.prototype.add=function(e,t){var n=this,r=this.schema.primKey,i=r.auto,a=r.keyPath,o=e;return a&&i&&(o=ht(a)(e)),this._trans(`readwrite`,function(e){return n.core.mutate({trans:e,type:`add`,keys:t==null?null:[t],values:[o]})}).then(function(e){return e.numFailures?P.reject(e.failures[0]):e.lastResult}).then(function(t){if(a)try{x(e,a,t)}catch{}return t})},G.prototype.upsert=function(e,t){var n=this,r=this.schema.primKey.keyPath;return this._trans(`readwrite`,function(i){return n.core.get({trans:i,key:e}).then(function(a){var o=a??{};return St(o,t),r&&x(o,r,e),n.core.mutate({trans:i,type:`put`,values:[o],keys:[e],upsert:!0,updates:{keys:[e],changeSpecs:[t]}}).then(function(e){return e.numFailures?P.reject(e.failures[0]):!!a})})})},G.prototype.update=function(e,t){return typeof e!=`object`||a(e)?this.where(`:id`).equals(e).modify(t):(e=b(e,this.schema.primKey.keyPath))===void 0?H(new k.InvalidArgument(`Given object does not contain its primary key`)):this.where(`:id`).equals(e).modify(t)},G.prototype.put=function(e,t){var n=this,r=this.schema.primKey,i=r.auto,a=r.keyPath,o=e;return a&&i&&(o=ht(a)(e)),this._trans(`readwrite`,function(e){return n.core.mutate({trans:e,type:`put`,values:[o],keys:t==null?null:[t]})}).then(function(e){return e.numFailures?P.reject(e.failures[0]):e.lastResult}).then(function(t){if(a)try{x(e,a,t)}catch{}return t})},G.prototype.delete=function(e){var t=this;return this._trans(`readwrite`,function(n){return t.core.mutate({trans:n,type:`delete`,keys:[e]}).then(function(n){return yt(t,[e],n)}).then(function(e){return e.numFailures?P.reject(e.failures[0]):void 0})})},G.prototype.clear=function(){var e=this;return this._trans(`readwrite`,function(t){return e.core.mutate({trans:t,type:`deleteRange`,range:mt}).then(function(t){return yt(e,null,t)})}).then(function(e){return e.numFailures?P.reject(e.failures[0]):void 0})},G.prototype.bulkGet=function(e){var t=this;return this._trans(`readonly`,function(n){return t.core.getMany({keys:e,trans:n}).then(function(e){return e.map(function(e){return t.hook.reading.fire(e)})})})},G.prototype.bulkAdd=function(e,t,n){var r=this,i=Array.isArray(t)?t:void 0,a=(n||=i?void 0:t)?n.allKeys:void 0;return this._trans(`readwrite`,function(t){var n=r.schema.primKey,o=n.auto,n=n.keyPath;if(n&&i)throw new k.InvalidArgument(`bulkAdd(): keys argument invalid on tables with inbound keys`);if(i&&i.length!==e.length)throw new k.InvalidArgument(`Arguments objects and keys must have the same length`);var s=e.length,o=n&&o?e.map(ht(n)):e;return r.core.mutate({trans:t,type:`add`,keys:i,values:o,wantResults:a}).then(function(e){var t=e.numFailures,n=e.failures;if(t===0)return a?e.results:e.lastResult;throw new pe(`${r.name}.bulkAdd(): ${t} of ${s} operations failed`,n)})})},G.prototype.bulkPut=function(e,t,n){var r=this,i=Array.isArray(t)?t:void 0,a=(n||=i?void 0:t)?n.allKeys:void 0;return this._trans(`readwrite`,function(t){var n=r.schema.primKey,o=n.auto,n=n.keyPath;if(n&&i)throw new k.InvalidArgument(`bulkPut(): keys argument invalid on tables with inbound keys`);if(i&&i.length!==e.length)throw new k.InvalidArgument(`Arguments objects and keys must have the same length`);var s=e.length,o=n&&o?e.map(ht(n)):e;return r.core.mutate({trans:t,type:`put`,keys:i,values:o,wantResults:a}).then(function(e){var t=e.numFailures,n=e.failures;if(t===0)return a?e.results:e.lastResult;throw new pe(`${r.name}.bulkPut(): ${t} of ${s} operations failed`,n)})})},G.prototype.bulkUpdate=function(e){var t=this,n=this.core,r=e.map(function(e){return e.key}),i=e.map(function(e){return e.changes}),a=[];return this._trans(`readwrite`,function(o){return n.getMany({trans:o,keys:r,cache:`clone`}).then(function(s){var c=[],l=[],u=(e.forEach(function(e,n){var r=e.key,i=e.changes,o=s[n];if(o){for(var u=0,d=Object.keys(i);u<d.length;u++){var f=d[u],p=i[f];if(f===t.schema.primKey.keyPath){if(W(p,r)!==0)throw new k.Constraint(`Cannot update primary key in bulkUpdate()`)}else x(o,f,p)}a.push(n),c.push(r),l.push(o)}}),c.length);return n.mutate({trans:o,type:`put`,keys:c,values:l,updates:{keys:r,changeSpecs:i}}).then(function(e){var n=e.numFailures,r=e.failures;if(n===0)return u;for(var i=0,o=Object.keys(r);i<o.length;i++){var s,c=o[i],l=a[Number(c)];l!=null&&(s=r[c],delete r[c],r[l]=s)}throw new pe(`${t.name}.bulkUpdate(): ${n} of ${u} operations failed`,r)})})})},G.prototype.bulkDelete=function(e){var t=this,n=e.length;return this._trans(`readwrite`,function(n){return t.core.mutate({trans:n,type:`delete`,keys:e}).then(function(n){return yt(t,e,n)})}).then(function(e){var r=e.numFailures,i=e.failures;if(r===0)return e.lastResult;throw new pe(`${t.name}.bulkDelete(): ${r} of ${n} operations failed`,i)})};var Ct=G;function G(){}function wt(e){function t(t,r){if(r){for(var i=arguments.length,a=Array(i-1);--i;)a[i-1]=arguments[i];return n[t].subscribe.apply(null,a),e}if(typeof t==`string`)return n[t]}var n={};t.addEventType=s;for(var r=1,o=arguments.length;r<o;++r)s(arguments[r]);return t;function s(e,r,o){var c,l;if(typeof e!=`object`)return r||=j,l={subscribers:[],fire:o||=A,subscribe:function(e){l.subscribers.indexOf(e)===-1&&(l.subscribers.push(e),l.fire=r(l.fire,e))},unsubscribe:function(e){l.subscribers=l.subscribers.filter(function(t){return t!==e}),l.fire=l.subscribers.reduce(r,o)}},n[e]=t[e]=l;i(c=e).forEach(function(e){var t=c[e];if(a(t))s(e,c[e][0],c[e][1]);else{if(t!==`asap`)throw new k.InvalidArgument(`Invalid event config`);var n=s(e,_e,function(){for(var e=arguments.length,t=Array(e);e--;)t[e]=arguments[e];n.subscribers.forEach(function(e){y(function(){e.apply(null,t)})})})}})}}function Tt(e,t){return p(t).from({prototype:e}),t}function K(e,t){return!(e.filter||e.algorithm||e.or)&&(t?e.justLimit:!e.replayFilter)}function q(e,t){e.filter=pt(e.filter,t)}function Et(e,t,n){var r=e.replayFilter;e.replayFilter=r?function(){return pt(r(),t())}:t,e.justLimit=n&&!r}function Dt(e,t){if(e.isPrimKey)return t.primaryKey;var n=t.getIndexByKeyPath(e.index);if(n)return n;throw new k.Schema(`KeyPath `+e.index+` on object store `+t.name+` is not indexed`)}function Ot(e,t,n){var r=Dt(e,t.schema);return t.openCursor({trans:n,values:!e.keysOnly,reverse:e.dir===`prev`,unique:!!e.unique,query:{index:r,range:e.range}})}function kt(e,t,n,r){var i,a,o=e.replayFilter?pt(e.filter,e.replayFilter()):e.filter;return e.or?(i={},a=function(e,n,r){var a,s;o&&!o(n,r,function(e){return n.stop(e)},function(e){return n.fail(e)})||((s=``+(a=n.primaryKey))==`[object ArrayBuffer]`&&(s=``+new Uint8Array(a)),l(i,s))||(i[s]=!0,t(e,n,r))},Promise.all([e.or._iterate(a,n),At(Ot(e,r,n),e.algorithm,a,!e.keysOnly&&e.valueMapper)])):At(Ot(e,r,n),pt(e.algorithm,o),t,!e.keysOnly&&e.valueMapper)}function At(e,t,n,r){var i=L(r?function(e,t,i){return n(r(e),t,i)}:n);return e.then(function(e){if(e)return e.start(function(){var n=function(){return e.continue()};t&&!t(e,function(e){return n=e},function(t){e.stop(t),n=A},function(t){e.fail(t),n=A})||i(e.value,e,function(e){return n=e}),n()})})}Y.prototype._read=function(e,t){var n=this._ctx;return n.error?n.table._trans(null,H.bind(null,n.error)):n.table._trans(`readonly`,e).then(t)},Y.prototype._write=function(e){var t=this._ctx;return t.error?t.table._trans(null,H.bind(null,t.error)):t.table._trans(`readwrite`,e,`locked`)},Y.prototype._addAlgorithm=function(e){var t=this._ctx;t.algorithm=pt(t.algorithm,e)},Y.prototype._iterate=function(e,t){return kt(this._ctx,e,t,this._ctx.table.core)},Y.prototype.clone=function(e){var t=Object.create(this.constructor.prototype),n=Object.create(this._ctx);return e&&o(n,e),t._ctx=n,t},Y.prototype.raw=function(){return this._ctx.valueMapper=null,this},Y.prototype.each=function(e){var t=this._ctx;return this._read(function(n){return kt(t,e,n,t.table.core)})},Y.prototype.count=function(e){var t=this;return this._read(function(e){var n,r=t._ctx,i=r.table.core;return K(r,!0)?i.count({trans:e,query:{index:Dt(r,i.schema),range:r.range}}).then(function(e){return Math.min(e,r.limit)}):(n=0,kt(r,function(){return++n,!1},e,i).then(function(){return n}))}).then(e)},Y.prototype.sortBy=function(e,t){var n=e.split(`.`).reverse(),r=n[0],i=n.length-1;function a(e,t){return t?a(e[n[t]],t-1):e[r]}var o=this._ctx.dir===`next`?1:-1;function s(e,t){return W(a(e,i),a(t,i))*o}return this.toArray(function(e){return e.slice().sort(s)}).then(t)},Y.prototype.toArray=function(e){var t=this;return this._read(function(e){var n,r,i,a=t._ctx;return K(a,!0)&&0<a.limit?(n=a.valueMapper,r=Dt(a,a.table.core.schema),a.table.core.query({trans:e,limit:a.limit,values:!0,direction:a.dir===`prev`?`prev`:void 0,query:{index:r,range:a.range}}).then(function(e){return e=e.result,n?e.map(n):e})):(i=[],kt(a,function(e){return i.push(e)},e,a.table.core).then(function(){return i}))},e)},Y.prototype.offset=function(e){var t=this._ctx;return e<=0||(t.offset+=e,K(t)?Et(t,function(){var t=e;return function(e,n){return t===0||(t===1?--t:n(function(){e.advance(t),t=0}),!1)}}):Et(t,function(){var t=e;return function(){return--t<0}})),this},Y.prototype.limit=function(e){return this._ctx.limit=Math.min(this._ctx.limit,e),Et(this._ctx,function(){var t=e;return function(e,n,r){return--t<=0&&n(r),0<=t}},!0),this},Y.prototype.until=function(e,t){return q(this._ctx,function(n,r,i){return!e(n.value)||(r(i),t)}),this},Y.prototype.first=function(e){return this.limit(1).toArray(function(e){return e[0]}).then(e)},Y.prototype.last=function(e){return this.reverse().first(e)},Y.prototype.filter=function(e){var t;return q(this._ctx,function(t){return e(t.value)}),(t=this._ctx).isMatch=pt(t.isMatch,e),this},Y.prototype.and=function(e){return this.filter(e)},Y.prototype.or=function(e){return new this.db.WhereClause(this._ctx.table,e,this)},Y.prototype.reverse=function(){return this._ctx.dir=this._ctx.dir===`prev`?`next`:`prev`,this._ondirectionchange&&this._ondirectionchange(this._ctx.dir),this},Y.prototype.desc=function(){return this.reverse()},Y.prototype.eachKey=function(e){var t=this._ctx;return t.keysOnly=!t.isMatch,this.each(function(t,n){e(n.key,n)})},Y.prototype.eachUniqueKey=function(e){return this._ctx.unique=`unique`,this.eachKey(e)},Y.prototype.eachPrimaryKey=function(e){var t=this._ctx;return t.keysOnly=!t.isMatch,this.each(function(t,n){e(n.primaryKey,n)})},Y.prototype.keys=function(e){var t=this._ctx,n=(t.keysOnly=!t.isMatch,[]);return this.each(function(e,t){n.push(t.key)}).then(function(){return n}).then(e)},Y.prototype.primaryKeys=function(e){var t=this._ctx;if(K(t,!0)&&0<t.limit)return this._read(function(e){var n=Dt(t,t.table.core.schema);return t.table.core.query({trans:e,values:!1,limit:t.limit,direction:t.dir===`prev`?`prev`:void 0,query:{index:n,range:t.range}})}).then(function(e){return e.result}).then(e);t.keysOnly=!t.isMatch;var n=[];return this.each(function(e,t){n.push(t.primaryKey)}).then(function(){return n}).then(e)},Y.prototype.uniqueKeys=function(e){return this._ctx.unique=`unique`,this.keys(e)},Y.prototype.firstKey=function(e){return this.limit(1).keys(function(e){return e[0]}).then(e)},Y.prototype.lastKey=function(e){return this.reverse().firstKey(e)},Y.prototype.distinct=function(){var e,t=this._ctx,t=t.index&&t.table.schema.idxByName[t.index];return t&&t.multi&&(e={},q(this._ctx,function(t){var t=t.primaryKey.toString(),n=l(e,t);return e[t]=!0,!n})),this},Y.prototype.modify=function(e){var t=this,n=this._ctx;return this._write(function(r){function a(e,t){var n=t.failures;p+=e-t.numFailures;for(var r=0,a=i(n);r<a.length;r++){var o=a[r];f.push(n[o])}}var o=typeof e==`function`?e:function(t){return St(t,e)},s=n.table.core,c=s.schema.primaryKey,l=c.outbound,u=c.extractKey,d=200,c=t.db._options.modifyChunkSize,f=(c&&(d=typeof c==`object`?c[s.name]||c[`*`]||200:c),[]),p=0,m=[],h=e===jt;return t.clone().primaryKeys().then(function(t){function i(f){var p=Math.min(d,t.length-f),m=t.slice(f,f+p);return(h?Promise.resolve([]):s.getMany({trans:r,keys:m,cache:`immutable`})).then(function(g){var _=[],v=[],y=l?[]:null,b=h?m:[];if(!h)for(var x=0;x<p;++x){var S=g[x],C={value:te(S),primKey:t[f+x]};!1!==o.call(C,C.value,C)&&(C.value==null?b.push(t[f+x]):l||W(u(S),u(C.value))===0?(v.push(C.value),l&&y.push(t[f+x])):(b.push(t[f+x]),_.push(C.value)))}return Promise.resolve(0<_.length&&s.mutate({trans:r,type:`add`,values:_}).then(function(e){for(var t in e.failures)b.splice(parseInt(t),1);a(_.length,e)})).then(function(){return(0<v.length||c&&typeof e==`object`)&&s.mutate({trans:r,type:`put`,keys:y,values:v,criteria:c,changeSpec:typeof e!=`function`&&e,isAdditionalChunk:0<f}).then(function(e){return a(v.length,e)})}).then(function(){return(0<b.length||c&&h)&&s.mutate({trans:r,type:`delete`,keys:b,criteria:c,isAdditionalChunk:0<f}).then(function(e){return yt(n.table,b,e)}).then(function(e){return a(b.length,e)})}).then(function(){return t.length>f+p&&i(f+d)})})}var c=K(n)&&n.limit===1/0&&(typeof e!=`function`||h)&&{index:n.index,range:n.range};return i(0).then(function(){if(0<f.length)throw new fe(`Error modifying one or more objects`,f,p,m);return t.length})})})},Y.prototype.delete=function(){var e=this._ctx,t=e.range;return!K(e)||e.table.schema.yProps||!e.isPrimKey&&t.type!==3?this.modify(jt):this._write(function(n){var r=e.table.core.schema.primaryKey,i=t;return e.table.core.count({trans:n,query:{index:r,range:i}}).then(function(t){return e.table.core.mutate({trans:n,type:`deleteRange`,range:i}).then(function(e){var n=e.failures,e=e.numFailures;if(e)throw new fe(`Could not delete some values`,Object.keys(n).map(function(e){return n[e]}),t-e);return t-e})})})};var J=Y;function Y(){}var jt=function(e,t){return t.value=null};function Mt(e,t){return e<t?-1:e===t?0:1}function Nt(e,t){return t<e?-1:e===t?0:1}function Pt(e,t,n){return e=e instanceof zt?new e.Collection(e):e,e._ctx.error=new(n||TypeError)(t),e}function Ft(e){return new e.Collection(e,function(){return Rt(``)}).limit(0)}function It(e,t,n,r){var i,a,o,s,c,l,u,d=n.length;if(!n.every(function(e){return typeof e==`string`}))return Pt(e,ut);function f(e){i=e===`next`?function(e){return e.toUpperCase()}:function(e){return e.toLowerCase()},a=e===`next`?function(e){return e.toLowerCase()}:function(e){return e.toUpperCase()},o=e===`next`?Mt:Nt;var t=n.map(function(e){return{lower:a(e),upper:i(e)}}).sort(function(e,t){return o(e.lower,t.lower)});s=t.map(function(e){return e.upper}),c=t.map(function(e){return e.lower}),u=(l=e)===`next`?``:r}f(`next`);var e=new e.Collection(e,function(){return Lt(s[0],c[d-1]+r)}),p=(e._ondirectionchange=function(e){f(e)},0);return e._addAlgorithm(function(e,n,r){var i=e.key;if(typeof i==`string`){var f=a(i);if(t(f,c,p))return!0;for(var m=null,h=p;h<d;++h){var g=((e,t,n,r,i,a)=>{for(var o=Math.min(e.length,r.length),s=-1,c=0;c<o;++c){var l=t[c];if(l!==r[c])return i(e[c],n[c])<0?e.substr(0,c)+n[c]+n.substr(c+1):i(e[c],r[c])<0?e.substr(0,c)+r[c]+n.substr(c+1):0<=s?e.substr(0,s)+t[s]+n.substr(s+1):null;i(e[c],l)<0&&(s=c)}return o<r.length&&a===`next`?e+n.substr(e.length):o<e.length&&a===`prev`?e.substr(0,n.length):s<0?null:e.substr(0,s)+r[s]+n.substr(s+1)})(i,f,s[h],c[h],o,l);g===null&&m===null?p=h+1:(m===null||0<o(m,g))&&(m=g)}n(m===null?r:function(){e.continue(m+u)})}return!1}),e}function Lt(e,t,n,r){return{type:2,lower:e,upper:t,lowerOpen:n,upperOpen:r}}function Rt(e){return{type:1,lower:e,upper:e}}Object.defineProperty(Bt.prototype,"Collection",{get:function(){return this._ctx.table.db.Collection},enumerable:!1,configurable:!0}),Bt.prototype.between=function(e,t,n,r){n=!1!==n,r=!0===r;try{return 0<this._cmp(e,t)||this._cmp(e,t)===0&&(n||r)&&(!n||!r)?Ft(this):new this.Collection(this,function(){return Lt(e,t,!n,!r)})}catch{return Pt(this,lt)}},Bt.prototype.equals=function(e){return e==null?Pt(this,lt):new this.Collection(this,function(){return Rt(e)})},Bt.prototype.above=function(e){return e==null?Pt(this,lt):new this.Collection(this,function(){return Lt(e,void 0,!0)})},Bt.prototype.aboveOrEqual=function(e){return e==null?Pt(this,lt):new this.Collection(this,function(){return Lt(e,void 0,!1)})},Bt.prototype.below=function(e){return e==null?Pt(this,lt):new this.Collection(this,function(){return Lt(void 0,e,!1,!0)})},Bt.prototype.belowOrEqual=function(e){return e==null?Pt(this,lt):new this.Collection(this,function(){return Lt(void 0,e)})},Bt.prototype.startsWith=function(e){return typeof e==`string`?this.between(e,e+ct,!0,!0):Pt(this,ut)},Bt.prototype.startsWithIgnoreCase=function(e){return e===``?this.startsWith(e):It(this,function(e,t){return e.indexOf(t[0])===0},[e],ct)},Bt.prototype.equalsIgnoreCase=function(e){return It(this,function(e,t){return e===t[0]},[e],``)},Bt.prototype.anyOfIgnoreCase=function(){var e=oe.apply(ae,arguments);return e.length===0?Ft(this):It(this,function(e,t){return t.indexOf(e)!==-1},e,``)},Bt.prototype.startsWithAnyOfIgnoreCase=function(){var e=oe.apply(ae,arguments);return e.length===0?Ft(this):It(this,function(e,t){return t.some(function(t){return e.indexOf(t)===0})},e,ct)},Bt.prototype.anyOf=function(){var e,t,n=this,r=oe.apply(ae,arguments),i=this._cmp;try{r.sort(i)}catch{return Pt(this,lt)}return r.length===0?Ft(this):((e=new this.Collection(this,function(){return Lt(r[0],r[r.length-1])}))._ondirectionchange=function(e){i=e===`next`?n._ascending:n._descending,r.sort(i)},t=0,e._addAlgorithm(function(e,n,a){for(var o=e.key;0<i(o,r[t]);)if(++t===r.length)return n(a),!1;return i(o,r[t])===0||(n(function(){e.continue(r[t])}),!1)}),e)},Bt.prototype.notEqual=function(e){return this.inAnyRange([[-1/0,e],[e,this.db._maxKey]],{includeLowers:!1,includeUppers:!1})},Bt.prototype.noneOf=function(){var e=oe.apply(ae,arguments);if(e.length===0)return new this.Collection(this);try{e.sort(this._ascending)}catch{return Pt(this,lt)}var t=e.reduce(function(e,t){return e?e.concat([[e[e.length-1][1],t]]):[[-1/0,t]]},null);return t.push([e[e.length-1],this.db._maxKey]),this.inAnyRange(t,{includeLowers:!1,includeUppers:!1})},Bt.prototype.inAnyRange=function(e,t){var n=this,r=this._cmp,i=this._ascending,a=this._descending,o=this._min,s=this._max;if(e.length===0)return Ft(this);if(!e.every(function(e){return e[0]!==void 0&&e[1]!==void 0&&i(e[0],e[1])<=0}))return Pt(this,`First argument to inAnyRange() must be an Array of two-value Arrays [lower,upper] where upper must not be lower than lower`,k.InvalidArgument);var c=!t||!1!==t.includeLowers,l=t&&!0===t.includeUppers,u,d=i;function f(e,t){return d(e[0],t[0])}try{(u=e.reduce(function(e,t){for(var n=0,i=e.length;n<i;++n){var a=e[n];if(r(t[0],a[1])<0&&0<r(t[1],a[0])){a[0]=o(a[0],t[0]),a[1]=s(a[1],t[1]);break}}return n===i&&e.push(t),e},[])).sort(f)}catch{return Pt(this,lt)}var p=0,m=l?function(e){return 0<i(e,u[p][1])}:function(e){return 0<=i(e,u[p][1])},h=c?function(e){return 0<a(e,u[p][0])}:function(e){return 0<=a(e,u[p][0])},g=m,t=new this.Collection(this,function(){return Lt(u[0][0],u[u.length-1][1],!c,!l)});return t._ondirectionchange=function(e){d=e===`next`?(g=m,i):(g=h,a),u.sort(f)},t._addAlgorithm(function(e,t,r){for(var a,o=e.key;g(o);)if(++p===u.length)return t(r),!1;return!m(a=o)&&!h(a)||(n._cmp(o,u[p][1])===0||n._cmp(o,u[p][0])===0||t(function(){d===i?e.continue(u[p][0]):e.continue(u[p][1])}),!1)}),t},Bt.prototype.startsWithAnyOf=function(){var e=oe.apply(ae,arguments);return e.every(function(e){return typeof e==`string`})?e.length===0?Ft(this):this.inAnyRange(e.map(function(e){return[e,e+ct]})):Pt(this,`startsWithAnyOf() only works with strings`)};var zt=Bt;function Bt(){}function Vt(e){return L(function(t){return Ht(t),e(t.target.error),!1})}function Ht(e){e.stopPropagation&&e.stopPropagation(),e.preventDefault&&e.preventDefault()}var Ut=`storagemutated`,Wt=`x-storagemutated-1`,Gt=wt(null,Ut),Kt=(qt.prototype._lock=function(){return v(!N.global),++this._reculock,this._reculock!==1||N.global||(N.lockOwnerFor=this),this},qt.prototype._unlock=function(){if(v(!N.global),--this._reculock==0)for(N.global||(N.lockOwnerFor=null);0<this._blockedFuncs.length&&!this._locked();){var e=this._blockedFuncs.shift();try{at(e[1],e[0])}catch{}}return this},qt.prototype._locked=function(){return this._reculock&&N.lockOwnerFor!==this},qt.prototype.create=function(e){var t=this;if(this.mode){var n=this.db.idbdb,r=this.db._state.dbOpenError;if(v(!this.idbtrans),!e&&!n)switch(r&&r.name){case`DatabaseClosedError`:throw new k.DatabaseClosed(r);case`MissingAPIError`:throw new k.MissingAPI(r.message,r);default:throw new k.OpenFailed(r)}if(!this.active)throw new k.TransactionInactive;v(this._completion._state===null),(e=this.idbtrans=e||(this.db.core||n).transaction(this.storeNames,this.mode,{durability:this.chromeTransactionDurability})).onerror=L(function(n){Ht(n),t._reject(e.error)}),e.onabort=L(function(n){Ht(n),t.active&&t._reject(new k.Abort(e.error)),t.active=!1,t.on(`abort`).fire(n)}),e.oncomplete=L(function(){t.active=!1,t._resolve(),`mutatedParts`in e&&Gt.storagemutated.fire(e.mutatedParts)})}return this},qt.prototype._promise=function(e,t,n){var r,i=this;return e===`readwrite`&&this.mode!==`readwrite`?H(new k.ReadOnly(`Transaction is readonly`)):this.active?this._locked()?new P(function(r,a){i._blockedFuncs.push([function(){i._promise(e,t,n).then(r,a)},N])}):n?$e(function(){var e=new P(function(e,n){i._lock();var r=t(e,n,i);r&&r.then&&r.then(e,n)});return e.finally(function(){return i._unlock()}),e._lib=!0,e}):((r=new P(function(e,n){var r=t(e,n,i);r&&r.then&&r.then(e,n)}))._lib=!0,r):H(new k.TransactionInactive)},qt.prototype._root=function(){return this.parent?this.parent._root():this},qt.prototype.waitFor=function(e){var t,n=this._root(),r=P.resolve(e),i=(n._waitingFor?n._waitingFor=n._waitingFor.then(function(){return r}):(n._waitingFor=r,n._waitingQueue=[],t=n.idbtrans.objectStore(n.storeNames[0]),function e(){for(++n._spinCount;n._waitingQueue.length;)n._waitingQueue.shift()();n._waitingFor&&(t.get(-1/0).onsuccess=e)}()),n._waitingFor);return new P(function(e,t){r.then(function(t){return n._waitingQueue.push(L(e.bind(null,t)))},function(e){return n._waitingQueue.push(L(t.bind(null,e)))}).finally(function(){n._waitingFor===i&&(n._waitingFor=null)})})},qt.prototype.abort=function(){this.active&&(this.active=!1,this.idbtrans&&this.idbtrans.abort(),this._reject(new k.Abort))},qt.prototype.table=function(e){var t=this._memoizedTables||={};if(l(t,e))return t[e];var n=this.schema[e];if(n)return(n=new this.db.Table(e,n,this)).core=this.db.core.table(e),t[e]=n;throw new k.NotFound(`Table `+e+` not part of transaction`)},qt);function qt(){}function Jt(e,t,n,r,i,a,o,s){return{name:e,keyPath:t,unique:n,multi:r,auto:i,compound:a,src:(n&&!o?`&`:``)+(r?`*`:``)+(i?`++`:``)+Yt(t),type:s}}function Yt(e){return typeof e==`string`?e:e?`[`+[].join.call(e,`+`)+`]`:``}function Xt(e,t,n){return{name:e,primKey:t,indexes:n,mappedClass:null,idxByName:(r=function(e){return[e.name,e]},n.reduce(function(e,t,n){return t=r(t,n),t&&(e[t[0]]=t[1]),e},{}))};var r}var Zt=function(e){try{return e.only([[]]),Zt=function(){return[[]]},[[]]}catch{return Zt=function(){return ct},ct}};function Qt(e){return e==null?function(){}:typeof e==`string`?(t=e).split(`.`).length===1?function(e){return e[t]}:function(e){return b(e,t)}:function(t){return b(t,e)};var t}function $t(e){return[].slice.call(e)}var en=0;function tn(e){return e==null?`:id`:typeof e==`string`?e:`[${e.join(`+`)}]`}function nn(e,t,n){function r(e){if(e.type===3)return null;if(e.type===4)throw Error(`Cannot convert never type to IDBKeyRange`);var n=e.lower,r=e.upper,i=e.lowerOpen,e=e.upperOpen;return n===void 0?r===void 0?null:t.upperBound(r,!!e):r===void 0?t.lowerBound(n,!!i):t.bound(n,r,!!i,!!e)}function i(e){var t,n,i=e.name;return{name:i,schema:e,mutate:function(e){var t=e.trans,n=e.type,a=e.keys,o=e.values,s=e.range;return new Promise(function(e,c){e=L(e);var l=t.objectStore(i),u=l.keyPath==null,d=n===`put`||n===`add`;if(!d&&n!==`delete`&&n!==`deleteRange`)throw Error(`Invalid operation type: `+n);var f,p=(a||o||{length:1}).length;if(a&&o&&a.length!==o.length)throw Error(`Given keys array must have same length as given values array.`);if(p===0)return e({numFailures:0,failures:{},results:[],lastResult:void 0});function m(e){++_,Ht(e)}var h=[],g=[],_=0;if(n===`deleteRange`){if(s.type===4)return e({numFailures:_,failures:g,results:[],lastResult:void 0});s.type===3?h.push(f=l.clear()):h.push(f=l.delete(r(s)))}else{var u=d?u?[o,a]:[o,null]:[a,null],v=u[0],y=u[1];if(d)for(var b=0;b<p;++b)h.push(f=y&&y[b]!==void 0?l[n](v[b],y[b]):l[n](v[b])),f.onerror=m;else for(b=0;b<p;++b)h.push(f=l[n](v[b])),f.onerror=m}function x(t){t=t.target.result,h.forEach(function(e,t){return e.error!=null&&(g[t]=e.error)}),e({numFailures:_,failures:g,results:n===`delete`?a:h.map(function(e){return e.result}),lastResult:t})}f.onerror=function(e){m(e),x(e)},f.onsuccess=x})},getMany:function(e){var t=e.trans,n=e.keys;return new Promise(function(e,r){e=L(e);for(var a,o=t.objectStore(i),s=n.length,c=Array(s),l=0,u=0,d=function(t){t=t.target,c[t._pos]=t.result,++u===l&&e(c)},f=Vt(r),p=0;p<s;++p)n[p]!=null&&((a=o.get(n[p]))._pos=p,a.onsuccess=d,a.onerror=f,++l);l===0&&e(c)})},get:function(e){var t=e.trans,n=e.key;return new Promise(function(e,r){e=L(e);var a=t.objectStore(i).get(n);a.onsuccess=function(t){return e(t.target.result)},a.onerror=Vt(r)})},query:(t=c,n=l,function(e){return new Promise(function(a,o){a=L(a);var s,c,l,u,d=e.trans,f=e.values,p=e.limit,m=e.query,h=(h=e.direction)??`next`,g=p===1/0?void 0:p,_=m.index,m=m.range,d=d.objectStore(i),d=_.isPrimaryKey?d:d.index(_.name),_=r(m);if(p===0)return a({result:[]});n?(m={query:_,count:g,direction:h},(s=f?d.getAll(m):d.getAllKeys(m)).onsuccess=function(e){return a({result:e.target.result})},s.onerror=Vt(o)):t&&h===`next`?((s=f?d.getAll(_,g):d.getAllKeys(_,g)).onsuccess=function(e){return a({result:e.target.result})},s.onerror=Vt(o)):(c=0,l=!f&&`openKeyCursor`in d?d.openKeyCursor(_,h):d.openCursor(_,h),u=[],l.onsuccess=function(){var e=l.result;return!e||(u.push(f?e.value:e.primaryKey),++c===p)?a({result:u}):void e.continue()},l.onerror=Vt(o))})}),openCursor:function(e){var t=e.trans,n=e.values,a=e.query,o=e.reverse,s=e.unique;return new Promise(function(e,c){e=L(e);var l=a.index,u=a.range,d=t.objectStore(i),d=l.isPrimaryKey?d:d.index(l.name),l=o?s?`prevunique`:`prev`:s?`nextunique`:`next`,f=!n&&`openKeyCursor`in d?d.openKeyCursor(r(u),l):d.openCursor(r(u),l);f.onerror=Vt(c),f.onsuccess=L(function(n){var r,i,a,o,s=f.result;s?(s.___id=++en,s.done=!1,r=s.continue.bind(s),i=(i=s.continuePrimaryKey)&&i.bind(s),a=s.advance.bind(s),o=function(){throw Error(`Cursor not stopped`)},s.trans=t,s.stop=s.continue=s.continuePrimaryKey=s.advance=function(){throw Error(`Cursor not started`)},s.fail=L(c),s.next=function(){var e=this,t=1;return this.start(function(){return t--?e.continue():e.stop()}).then(function(){return e})},s.start=function(e){function t(){if(f.result)try{e()}catch(e){s.fail(e)}else s.done=!0,s.start=function(){throw Error(`Cursor behind last entry`)},s.stop()}var n=new Promise(function(e,t){e=L(e),f.onerror=Vt(t),s.fail=t,s.stop=function(t){s.stop=s.continue=s.continuePrimaryKey=s.advance=o,e(t)}});return f.onsuccess=L(function(e){f.onsuccess=t,t()}),s.continue=r,s.continuePrimaryKey=i,s.advance=a,t(),n},e(s)):e(null)},c)})},count:function(e){var t=e.query,n=e.trans,a=t.index,o=t.range;return new Promise(function(e,t){var s=n.objectStore(i),s=a.isPrimaryKey?s:s.index(a.name),c=r(o),c=c?s.count(c):s.count();c.onsuccess=L(function(t){return e(t.target.result)}),c.onerror=Vt(t)})}}}o=n,s=$t((n=e).objectStoreNames),u=0<s.length?o.objectStore(s[0]):{};var o,n={schema:{name:n.name,tables:s.map(function(e){return o.objectStore(e)}).map(function(e){var t=e.keyPath,n=e.autoIncrement,r=a(t),i={},r={name:e.name,primaryKey:{name:null,isPrimaryKey:!0,outbound:t==null,compound:r,keyPath:t,autoIncrement:n,unique:!0,extractKey:Qt(t)},indexes:$t(e.indexNames).map(function(t){return e.index(t)}).map(function(e){var t=e.name,n=e.unique,r=e.multiEntry,e=e.keyPath,t={name:t,compound:a(e),keyPath:e,unique:n,multiEntry:r,extractKey:Qt(e)};return i[tn(e)]=t}),getIndexByKeyPath:function(e){return i[tn(e)]}};return i[`:id`]=r.primaryKey,t!=null&&(i[tn(t)]=r.primaryKey),r})},hasGetAll:0<s.length&&`getAll`in u&&!(typeof navigator<`u`&&/Safari/.test(navigator.userAgent)&&!/(Chrome\/|Edge\/)/.test(navigator.userAgent)&&[].concat(navigator.userAgent.match(/Safari\/(\d*)/))[1]<604),hasIdb3Features:`getAllRecords`in u},s=n.schema,c=n.hasGetAll,l=n.hasIdb3Features,u=s.tables.map(i),d={};return u.forEach(function(e){return d[e.name]=e}),{stack:`dbcore`,transaction:e.transaction.bind(e),table:function(e){if(d[e])return d[e];throw Error(`Table '${e}' not found`)},MIN_KEY:-1/0,MAX_KEY:Zt(t),schema:s}}function rn(e,n,r,i){return r=r.IDBKeyRange,n=nn(n,r,i),{dbcore:e.dbcore.reduce(function(e,n){return n=n.create,t(t({},e),n(e))},n)}}function an(e,t){var n=t.db,n=rn(e._middlewares,n,e._deps,t);e.core=n.dbcore,e.tables.forEach(function(t){var n=t.name;e.core.schema.tables.some(function(e){return e.name===n})&&(t.core=e.core.table(n),e[n]instanceof e.Table)&&(e[n].core=t.core)})}function on(e,t,n,r){n.forEach(function(n){var i=r[n];t.forEach(function(t){var r=function e(t,n){return m(t,n)||(t=s(t))&&e(t,n)}(t,n);(!r||`value`in r&&r.value===void 0)&&(t===e.Transaction.prototype||t instanceof e.Transaction?f(t,n,{get:function(){return this.table(n)},set:function(e){d(this,n,{value:e,writable:!0,configurable:!0,enumerable:!0})}}):t[n]=new e.Table(n,i))})})}function sn(e,t){t.forEach(function(t){for(var n in t)t[n]instanceof e.Table&&delete t[n]})}function cn(e,t){return e._cfg.version-t._cfg.version}function ln(e,t,n,r){var a=e._dbSchema,o=(n.objectStoreNames.contains(`$meta`)&&!a.$meta&&(a.$meta=Xt(`$meta`,_n(``)[0],[]),e._storeNames.push(`$meta`)),e._createTransaction(`readwrite`,e._storeNames,a)),s=(o.create(n),o._completion.catch(r),o._reject.bind(o)),c=N.transless||N;$e(function(){if(N.trans=o,N.transless=c,t!==0)return an(e,n),l=t,((r=o).storeNames.includes(`$meta`)?r.table(`$meta`).get(`version`).then(function(e){return e??l}):P.resolve(l)).then(function(t){var r=e,a=t,s=o,c=n,l=[],t=r._versions,u=r._dbSchema=hn(0,r.idbdb,c);return(t=t.filter(function(e){return e._cfg.version>=a})).length===0?P.resolve():(t.forEach(function(e){l.push(function(){var t,n,o,l=u,d=e._cfg.dbschema,f=(gn(r,l,c),gn(r,d,c),u=r._dbSchema=d,dn(l,d)),p=(f.add.forEach(function(e){fn(c,e[0],e[1].primKey,e[1].indexes)}),f.change.forEach(function(e){if(e.recreate)throw new k.Upgrade(`Not yet support for changing primary key`);var t=c.objectStore(e.name);e.add.forEach(function(e){return mn(t,e)}),e.change.forEach(function(e){t.deleteIndex(e.name),mn(t,e)}),e.del.forEach(function(e){return t.deleteIndex(e)})}),e._cfg.contentUpgrade);if(p&&e._cfg.version>a)return an(r,c),s._memoizedTables={},t=S(d),f.del.forEach(function(e){t[e]=l[e]}),sn(r,[r.Transaction.prototype]),on(r,[r.Transaction.prototype],i(t),t),s.schema=t,(n=se(p))&&et(),d=P.follow(function(){var e;(o=p(s))&&n&&(e=tt.bind(null,null),o.then(e,e))}),o&&typeof o.then==`function`?P.resolve(o):d.then(function(){return o})}),l.push(function(t){var n=e._cfg.dbschema,i=t;[].slice.call(i.db.objectStoreNames).forEach(function(e){return n[e]==null&&i.db.deleteObjectStore(e)}),sn(r,[r.Transaction.prototype]),on(r,[r.Transaction.prototype],r._storeNames,r._dbSchema),s.schema=r._dbSchema}),l.push(function(t){r.idbdb.objectStoreNames.contains(`$meta`)&&(Math.ceil(r.idbdb.version/10)===e._cfg.version?(r.idbdb.deleteObjectStore(`$meta`),delete r._dbSchema.$meta,r._storeNames=r._storeNames.filter(function(e){return e!==`$meta`})):t.objectStore(`$meta`).put(e._cfg.version,`version`))})}),function e(){return l.length?P.resolve(l.shift()(s.idbtrans)).then(e):P.resolve()}().then(function(){pn(u,c)}))}).catch(s);var r,l;i(a).forEach(function(e){fn(n,e,a[e].primKey,a[e].indexes)}),an(e,n),P.follow(function(){return e.on.populate.fire(o)}).catch(s)})}function un(e,t){pn(e._dbSchema,t),t.db.version%10!=0||t.objectStoreNames.contains(`$meta`)||t.db.createObjectStore(`$meta`).add(Math.ceil(t.db.version/10-1),`version`);var n=hn(0,e.idbdb,t);gn(e,e._dbSchema,t);for(var r=0,i=dn(n,e._dbSchema).change;r<i.length;r++){var a=(e=>{if(e.change.length||e.recreate)return console.warn(`Unable to patch indexes of table ${e.name} because it has changes on the type of index or primary key.`),{value:void 0};var n=t.objectStore(e.name);e.add.forEach(function(t){M&&console.debug(`Dexie upgrade patch: Creating missing index ${e.name}.${t.src}`),mn(n,t)})})(i[r]);if(typeof a==`object`)return a.value}}function dn(e,t){var n,r={del:[],add:[],change:[]};for(n in e)t[n]||r.del.push(n);for(n in t){var i=e[n],a=t[n];if(i){var o={name:n,def:a,recreate:!1,del:[],add:[],change:[]};if(``+(i.primKey.keyPath||``)!=``+(a.primKey.keyPath||``)||i.primKey.auto!==a.primKey.auto)o.recreate=!0,r.change.push(o);else{var s=i.idxByName,c=a.idxByName,l=void 0;for(l in s)c[l]||o.del.push(l);for(l in c){var u=s[l],d=c[l];u?u.src!==d.src&&o.change.push(d):o.add.push(d)}(0<o.del.length||0<o.add.length||0<o.change.length)&&r.change.push(o)}}else r.add.push([n,a])}return r}function fn(e,t,n,r){var i=e.db.createObjectStore(t,n.keyPath?{keyPath:n.keyPath,autoIncrement:n.auto}:{autoIncrement:n.auto});r.forEach(function(e){return mn(i,e)})}function pn(e,t){i(e).forEach(function(n){t.db.objectStoreNames.contains(n)||(M&&console.debug(`Dexie: Creating missing table`,n),fn(t,n,e[n].primKey,e[n].indexes))})}function mn(e,t){e.createIndex(t.name,t.keyPath,{unique:t.unique,multiEntry:t.multi})}function hn(e,t,n){var r={};return g(t.objectStoreNames,0).forEach(function(e){for(var t=n.objectStore(e),i=Jt(Yt(c=t.keyPath),c||``,!0,!1,!!t.autoIncrement,c&&typeof c!=`string`,!0),a=[],o=0;o<t.indexNames.length;++o){var s=t.index(t.indexNames[o]),c=s.keyPath,s=Jt(s.name,c,!!s.unique,!!s.multiEntry,!1,c&&typeof c!=`string`,!1);a.push(s)}r[e]=Xt(e,i,a)}),r}function gn(e,t,n){for(var i=n.db.objectStoreNames,a=0;a<i.length;++a){var o=i[a],s=n.objectStore(o);e._hasGetAll=`getAll`in s;for(var c=0;c<s.indexNames.length;++c){var l,u=s.indexNames[c],d=s.index(u).keyPath,d=typeof d==`string`?d:`[`+g(d).join(`+`)+`]`;t[o]&&(l=t[o].idxByName[d])&&(l.name=u,delete t[o].idxByName[d],t[o].idxByName[u]=l)}}typeof navigator<`u`&&/Safari/.test(navigator.userAgent)&&!/(Chrome\/|Edge\/)/.test(navigator.userAgent)&&r.WorkerGlobalScope&&r instanceof r.WorkerGlobalScope&&[].concat(navigator.userAgent.match(/Safari\/(\d*)/))[1]<604&&(e._hasGetAll=!1)}function _n(e){return e.split(`,`).map(function(e,t){var n=e.split(`:`),r=(r=n[1])?.trim(),n=(e=n[0].trim()).replace(/([&*]|\+\+)/g,``),i=/^\[/.test(n)?n.match(/^\[(.*)\]$/)[1].split(`+`):n;return Jt(n,i||null,/\&/.test(e),/\*/.test(e),/\+\+/.test(e),a(i),t===0,r)})}yn.prototype._createTableSchema=Xt,yn.prototype._parseIndexSyntax=_n,yn.prototype._parseStoresSpec=function(e,t){var n=this;i(e).forEach(function(r){if(e[r]!==null){var i=n._parseIndexSyntax(e[r]),a=i.shift();if(!a)throw new k.Schema(`Invalid schema for table `+r+`: `+e[r]);if(a.unique=!0,a.multi)throw new k.Schema(`Primary key cannot be multiEntry*`);i.forEach(function(e){if(e.auto)throw new k.Schema(`Only primary key can be marked as autoIncrement (++)`);if(!e.keyPath)throw new k.Schema(`Index must have a name and cannot be an empty string`)}),a=n._createTableSchema(r,a,i),t[r]=a}})},yn.prototype.stores=function(e){var t=this.db,e=(this._cfg.storesSource=this._cfg.storesSource?o(this._cfg.storesSource,e):e,t._versions),n={},r={};return e.forEach(function(e){o(n,e._cfg.storesSource),r=e._cfg.dbschema={},e._parseStoresSpec(n,r)}),t._dbSchema=r,sn(t,[t._allTables,t,t.Transaction.prototype]),on(t,[t._allTables,t,t.Transaction.prototype,this._cfg.tables],i(r),r),t._storeNames=i(r),this},yn.prototype.upgrade=function(e){return this._cfg.contentUpgrade=Ce(this._cfg.contentUpgrade||A,e),this};var vn=yn;function yn(){}var bn=(()=>{var e,t,n;return typeof FinalizationRegistry<`u`&&typeof WeakRef<`u`?(e=new Set,t=new FinalizationRegistry(function(t){e.delete(t)}),{toArray:function(){return Array.from(e).map(function(e){return e.deref()}).filter(function(e){return e!==void 0})},add:function(n){var r=new WeakRef(n._novip);e.add(r),t.register(n._novip,r,r),e.size>n._options.maxConnections&&(r=e.values().next().value,e.delete(r),t.unregister(r))},remove:function(n){if(n)for(var r=e.values(),i=r.next();!i.done;){var a=i.value;if(a.deref()===n._novip)return e.delete(a),void t.unregister(a);i=r.next()}}}):(n=[],{toArray:function(){return n},add:function(e){n.push(e._novip)},remove:function(e){e&&(e=n.indexOf(e._novip))!==-1&&n.splice(e,1)}})})();function xn(e,t){var n=e._dbNamesDB;return n||(n=e._dbNamesDB=new Z(dt,{addons:[],indexedDB:e,IDBKeyRange:t})).version(1).stores({dbnames:`name`}),n.table(`dbnames`)}function Sn(e){return e&&typeof e.databases==`function`}function Cn(e){return $e(function(){return N.letThrough=!0,e()})}function wn(e){return!(`from`in e)}var Tn=function(e,t){var n;if(!this)return n=new Tn,e&&`d`in e&&o(n,e),n;o(this,arguments.length?{d:1,from:e,to:1<arguments.length?t:e}:{d:0})};function En(e,t,n){var r=W(t,n);if(!isNaN(r)){if(0<r)throw RangeError();if(wn(e))return o(e,{from:t,to:n,d:1});var r=e.l,i=e.r;if(W(n,e.from)<0)return r?En(r,t,n):e.l={from:t,to:n,d:1,l:null,r:null},An(e);if(0<W(t,e.to))return i?En(i,t,n):e.r={from:t,to:n,d:1,l:null,r:null},An(e);W(t,e.from)<0&&(e.from=t,e.l=null,e.d=i?i.d+1:1),0<W(n,e.to)&&(e.to=n,e.r=null,e.d=e.l?e.l.d+1:1),t=!e.r,r&&!e.l&&Dn(e,r),i&&t&&Dn(e,i)}}function Dn(e,t){wn(t)||function e(t,n){var r=n.from,i=n.l,a=n.r;En(t,r,n.to),i&&e(t,i),a&&e(t,a)}(e,t)}function On(e,t){var n=kn(t),r=n.next();if(!r.done)for(var i=r.value,a=kn(e),o=a.next(i.from),s=o.value;!r.done&&!o.done;){if(W(s.from,i.to)<=0&&0<=W(s.to,i.from))return!0;W(i.from,s.from)<0?i=(r=n.next(s.from)).value:s=(o=a.next(i.from)).value}return!1}function kn(e){var t=wn(e)?null:{s:0,n:e};return{next:function(e){for(var n=0<arguments.length;t;)switch(t.s){case 0:if(t.s=1,n)for(;t.n.l&&W(e,t.n.from)<0;)t={up:t,n:t.n.l,s:1};else for(;t.n.l;)t={up:t,n:t.n.l,s:1};case 1:if(t.s=2,!n||W(e,t.n.to)<=0)return{value:t.n,done:!1};case 2:if(t.n.r){t.s=3,t={up:t,n:t.n.r,s:0};continue}case 3:t=t.up}return{done:!0}}}}function An(e){var n,r,i,a=((a=e.r)?.d||0)-((a=e.l)?.d||0),a=1<a?`r`:a<-1?`l`:``;a&&(n=a==`r`?`l`:`r`,r=t({},e),i=e[a],e.from=i.from,e.to=i.to,e[a]=i[a],r[a]=i[n],(e[n]=r).d=jn(r)),e.d=jn(e)}function jn(e){var t=e.r,e=e.l;return(t?e?Math.max(t.d,e.d):t.d:e?e.d:0)+1}function Mn(e,t){return i(t).forEach(function(n){e[n]?Dn(e[n],t[n]):e[n]=function e(t){var n,r,i={};for(n in t)l(t,n)&&(r=t[n],i[n]=!r||typeof r!=`object`||E.has(r.constructor)?r:e(r));return i}(t[n])}),e}function Nn(e,t){return e.all||t.all||Object.keys(e).some(function(n){return t[n]&&On(t[n],e[n])})}u(Tn.prototype,((ce={add:function(e){return Dn(this,e),this},addKey:function(e){return En(this,e,e),this},addKeys:function(e){var t=this;return e.forEach(function(e){return En(t,e,e)}),this},hasKey:function(e){var t=kn(this).next(e).value;return t&&W(t.from,e)<=0&&0<=W(t.to,e)}})[D]=function(){return kn(this)},ce));var Pn={},Fn={},In=!1;function Ln(e){Mn(Fn,e),In||(In=!0,setTimeout(function(){In=!1,Rn(Fn,!(Fn={}))},0))}function Rn(e,t){t===void 0&&(t=!1);var n=new Set;if(e.all)for(var r=0,i=Object.values(Pn);r<i.length;r++)zn(s=i[r],e,n,t);else for(var a in e){var o,s,a=/^idb\:\/\/(.*)\/(.*)\//.exec(a);a&&(o=a[1],a=a[2],s=Pn[`idb://${o}/${a}`])&&zn(s,e,n,t)}n.forEach(function(e){return e()})}function zn(e,t,n,r){for(var i=[],a=0,o=Object.entries(e.queries.query);a<o.length;a++){for(var s=o[a],c=s[0],l=[],u=0,d=s[1];u<d.length;u++){var f=d[u];Nn(t,f.obsSet)?f.subscribers.forEach(function(e){return n.add(e)}):r&&l.push(f)}r&&i.push([c,l])}if(r)for(var p=0,m=i;p<m.length;p++){var h=m[p],c=h[0],l=h[1];e.queries.query[c]=l}}function Bn(e){var t=e._state,n=e._deps.indexedDB;if(t.isBeingOpened||e.idbdb)return t.dbReadyPromise.then(function(){return t.dbOpenError?H(t.dbOpenError):e});t.isBeingOpened=!0,t.dbOpenError=null,t.openComplete=!1;var r=t.openCanceller,a=Math.round(10*e.verno),o=!1;function s(){if(t.openCanceller!==r)throw new k.DatabaseClosed(`db.open() was cancelled`)}function c(){return new P(function(r,l){if(s(),!n)throw new k.MissingAPI;var u=e.name,p=t.autoSchema||!a?n.open(u):n.open(u,a);if(!p)throw new k.MissingAPI;p.onerror=Vt(l),p.onblocked=L(e._fireOnBlocked),p.onupgradeneeded=L(function(r){var i;d=p.transaction,t.autoSchema&&!e._options.allowEmptyDB?(p.onerror=Ht,d.abort(),p.result.close(),(i=n.deleteDatabase(u)).onsuccess=i.onerror=L(function(){l(new k.NoSuchDatabase(`Database ${u} doesnt exist`))})):(d.onerror=Vt(l),i=r.oldVersion>2**62?0:r.oldVersion,f=i<1,e.idbdb=p.result,o&&un(e,d),ln(e,i/10,d,l))},l),p.onsuccess=L(function(){d=null;var n,s,l,m,h,_,v=e.idbdb=p.result,y=g(v.objectStoreNames);if(0<y.length)try{var b=v.transaction((h=y).length===1?h[0]:h,`readonly`);if(t.autoSchema)_=v,m=b,(l=e).verno=_.version/10,m=l._dbSchema=hn(0,_,m),l._storeNames=g(_.objectStoreNames,0),on(l,[l._allTables],i(m),m);else if(gn(e,e._dbSchema,b),s=b,((s=dn(hn(0,(n=e).idbdb,s),n._dbSchema)).add.length||s.change.some(function(e){return e.add.length||e.change.length}))&&!o)return console.warn(`Dexie SchemaDiff: Schema was extended without increasing the number passed to db.version(). Dexie will add missing parts and increment native version number to workaround this.`),v.close(),a=v.version+1,o=!0,r(c());an(e,b)}catch{}bn.add(e),v.onversionchange=L(function(n){t.vcFired=!0,e.on(`versionchange`).fire(n)}),v.onclose=L(function(){e.close({disableAutoOpen:!1})}),f&&(y=e._deps,h=u,Sn(_=y.indexedDB)||h===dt||xn(_,y.IDBKeyRange).put({name:h}).catch(A)),r()},l)}).catch(function(e){switch(e?.name){case`UnknownError`:if(0<t.PR1398_maxLoop)return t.PR1398_maxLoop--,console.warn(`Dexie: Workaround for Chrome UnknownError on open()`),c();break;case`VersionError`:if(0<a)return a=0,c()}return P.reject(e)})}var l,u=t.dbReadyResolve,d=null,f=!1;return P.race([r,(typeof navigator>`u`?P.resolve():!navigator.userAgentData&&/Safari\//.test(navigator.userAgent)&&!/Chrom(e|ium)\//.test(navigator.userAgent)&&indexedDB.databases?new Promise(function(e){function t(){return indexedDB.databases().finally(e)}l=setInterval(t,100),t()}).finally(function(){return clearInterval(l)}):Promise.resolve()).then(c)]).then(function(){return s(),t.onReadyBeingFired=[],P.resolve(Cn(function(){return e.on.ready.fire(e.vip)})).then(function n(){var r;if(0<t.onReadyBeingFired.length)return r=t.onReadyBeingFired.reduce(Ce,A),t.onReadyBeingFired=[],P.resolve(Cn(function(){return r(e.vip)})).then(n)})}).finally(function(){t.openCanceller===r&&(t.onReadyBeingFired=null,t.isBeingOpened=!1)}).catch(function(n){t.dbOpenError=n;try{d&&d.abort()}catch{}return r===t.openCanceller&&e._close(),H(n)}).finally(function(){t.openComplete=!0,u()}).then(function(){var t;return f&&(t={},e.tables.forEach(function(n){n.schema.indexes.forEach(function(r){r.name&&(t[`idb://${e.name}/${n.name}/${r.name}`]=new Tn(-1/0,[[[]]]))}),t[`idb://${e.name}/${n.name}/`]=t[`idb://${e.name}/${n.name}/:dels`]=new Tn(-1/0,[[[]]])}),Gt(Ut).fire(t),Rn(t,!0)),e})}function Vn(e){function t(t){return e.next(t)}var n=i(t),r=i(function(t){return e.throw(t)});function i(e){return function(t){var t=e(t),i=t.value;return t.done?i:i&&typeof i.then==`function`?i.then(n,r):a(i)?Promise.all(i).then(n,r):n(i)}}return i(t)()}function Hn(e,t,n){for(var r=a(e)?e.slice():[e],i=0;i<n;++i)r.push(t);return r}var Un={stack:`dbcore`,name:`VirtualIndexMiddleware`,level:1,create:function(e){return t(t({},e),{table:function(n){var r=e.table(n),n=r.schema,i=Object.create(null),a=[];function o(e,n,r){var s=tn(e),c=i[s]=i[s]||[],l=e==null?0:typeof e==`string`?1:e.length,u=0<n,s=t(t({},r),{name:u?`${s}(virtual-from:${r.name})`:r.name,lowLevelIndex:r,isVirtual:u,keyTail:n,keyLength:l,extractKey:Qt(e),unique:!u&&r.unique});return c.push(s),s.isPrimaryKey||a.push(s),1<l&&o(l===2?e[0]:e.slice(0,l-1),n+1,r),c.sort(function(e,t){return e.keyTail-t.keyTail}),s}var s=o(n.primaryKey.keyPath,0,n.primaryKey);i[`:id`]=[s];for(var c=0,l=n.indexes;c<l.length;c++){var u=l[c];o(u.keyPath,0,u)}function d(n){var r,i=n.query.index;return i.isVirtual?t(t({},n),{query:{index:i.lowLevelIndex,range:(r=n.query.range,i=i.keyTail,{type:r.type===1?2:r.type,lower:Hn(r.lower,r.lowerOpen?e.MAX_KEY:e.MIN_KEY,i),lowerOpen:!0,upper:Hn(r.upper,r.upperOpen?e.MIN_KEY:e.MAX_KEY,i),upperOpen:!0})}}):n}return t(t({},r),{schema:t(t({},n),{primaryKey:s,indexes:a,getIndexByKeyPath:function(e){return(e=i[tn(e)])&&e[0]}}),count:function(e){return r.count(d(e))},query:function(e){return r.query(d(e))},openCursor:function(t){var n=t.query.index,i=n.keyTail,a=n.keyLength;return n.isVirtual?r.openCursor(d(t)).then(function(e){return e&&o(e)}):r.openCursor(t);function o(n){return Object.create(n,{continue:{value:function(r){r==null?t.unique?n.continue(n.key.slice(0,a).concat(t.reverse?e.MIN_KEY:e.MAX_KEY,i)):n.continue():n.continue(Hn(r,t.reverse?e.MAX_KEY:e.MIN_KEY,i))}},continuePrimaryKey:{value:function(t,r){n.continuePrimaryKey(Hn(t,e.MAX_KEY,i),r)}},primaryKey:{get:function(){return n.primaryKey}},key:{get:function(){var e=n.key;return a===1?e[0]:e.slice(0,a)}},value:{get:function(){return n.value}}})}}})}})}};function Wn(e,t,n,r){return n||={},r||=``,i(e).forEach(function(i){var a,o,s;l(t,i)?(a=e[i],o=t[i],typeof a==`object`&&typeof o==`object`&&a&&o?(s=re(a))===re(o)?s===`Object`?Wn(a,o,n,r+i+`.`):a!==o&&(n[r+i]=t[i]):n[r+i]=t[i]:a!==o&&(n[r+i]=t[i])):n[r+i]=void 0}),i(t).forEach(function(i){l(e,i)||(n[r+i]=t[i])}),n}function Gn(e,t){return t.type===`delete`?t.keys:t.keys||t.values.map(e.extractKey)}var Kn={stack:`dbcore`,name:`HooksMiddleware`,level:2,create:function(e){return t(t({},e),{table:function(r){var i=e.table(r),a=i.schema.primaryKey;return t(t({},i),{mutate:function(e){var o=N.trans,s=o.table(r).hook,c=s.deleting,u=s.creating,d=s.updating;switch(e.type){case`add`:if(u.fire===A)break;return o._promise(`readwrite`,function(){return f(e)},!0);case`put`:if(u.fire===A&&d.fire===A)break;return o._promise(`readwrite`,function(){return f(e)},!0);case`delete`:if(c.fire===A)break;return o._promise(`readwrite`,function(){return f(e)},!0);case`deleteRange`:if(c.fire===A)break;return o._promise(`readwrite`,function(){return function e(n,r,o){return i.query({trans:n,values:!1,query:{index:a,range:r},limit:o}).then(function(i){var a=i.result;return f({type:`delete`,keys:a,trans:n}).then(function(i){return 0<i.numFailures?Promise.reject(i.failures[0]):a.length<o?{failures:[],numFailures:0,lastResult:void 0}:e(n,t(t({},r),{lower:a[a.length-1],lowerOpen:!0}),o)})})}(e.trans,e.range,1e4)},!0)}return i.mutate(e);function f(e){var r,o,s,f=N.trans,p=e.keys||Gn(a,e);if(p)return(e=e.type===`add`||e.type===`put`?t(t({},e),{keys:p}):t({},e)).type!==`delete`&&(e.values=n([],e.values,!0)),e.keys&&(e.keys=n([],e.keys,!0)),r=i,s=p,((o=e).type===`add`?Promise.resolve([]):r.getMany({trans:o.trans,keys:s,cache:`immutable`})).then(function(t){var n=p.map(function(n,r){var i,o,s,p=t[r],m={onerror:null,onsuccess:null};return e.type===`delete`?c.fire.call(m,n,p,f):e.type===`add`||p===void 0?(i=u.fire.call(m,n,e.values[r],f),n==null&&i!=null&&(e.keys[r]=n=i,a.outbound||x(e.values[r],a.keyPath,n))):(i=Wn(p,e.values[r]),(o=d.fire.call(m,i,n,p,f))&&(s=e.values[r],Object.keys(o).forEach(function(e){l(s,e)?s[e]=o[e]:x(s,e,o[e])}))),m});return i.mutate(e).then(function(r){for(var i=r.failures,a=r.results,o=r.numFailures,r=r.lastResult,s=0;s<p.length;++s){var c=(a||p)[s],l=n[s];c==null?l.onerror&&l.onerror(i[s]):l.onsuccess&&l.onsuccess(e.type===`put`&&t[s]?e.values[s]:c)}return{failures:i,results:a,numFailures:o,lastResult:r}}).catch(function(e){return n.forEach(function(t){return t.onerror&&t.onerror(e)}),Promise.reject(e)})});throw Error(`Keys missing`)}}})}})}};function qn(e,t,n){try{if(!t||t.keys.length<e.length)return null;for(var r=[],i=0,a=0;i<t.keys.length&&a<e.length;++i)W(t.keys[i],e[a])===0&&(r.push(n?te(t.values[i]):t.values[i]),++a);return r.length===e.length?r:null}catch{return null}}var Jn={stack:`dbcore`,level:-1,create:function(e){return{table:function(n){var r=e.table(n);return t(t({},r),{getMany:function(e){var t;return e.cache?(t=qn(e.keys,e.trans._cache,e.cache===`clone`))?P.resolve(t):r.getMany(e).then(function(t){return e.trans._cache={keys:e.keys,values:e.cache===`clone`?te(t):t},t}):r.getMany(e)},mutate:function(e){return e.type!==`add`&&(e.trans._cache=null),r.mutate(e)}})}}}};function Yn(e,t){return e.trans.mode===`readonly`&&!!e.subscr&&!e.trans.explicit&&e.trans.db._options.cache!==`disabled`&&!t.schema.primaryKey.outbound}function Xn(e,t){switch(e){case`query`:return t.values&&!t.unique;case`get`:case`getMany`:case`count`:case`openCursor`:return!1}}var X={stack:`dbcore`,level:0,name:`Observability`,create:function(e){var n=e.schema.name,r=new Tn(e.MIN_KEY,e.MAX_KEY);return t(t({},e),{transaction:function(t,n,r){if(N.subscr&&n!==`readonly`)throw new k.ReadOnly(`Readwrite transaction in liveQuery context. Querier source: ${N.querier}`);return e.transaction(t,n,r)},table:function(o){function s(t){var t=t.query;return[t.index,new Tn((t=t.range).lower??e.MIN_KEY,t.upper??e.MAX_KEY)]}var c=e.table(o),l=c.schema,u=l.primaryKey,d=l.indexes,f=u.extractKey,p=u.outbound,m=u.autoIncrement&&d.filter(function(e){return e.compound&&e.keyPath.includes(u.keyPath)}),h=t(t({},c),{mutate:function(t){function i(e){return e=`idb://${n}/${o}/${e}`,h[e]||(h[e]=new Tn)}var s,d,f,p=t.trans,h=t.mutatedParts||={},g=i(``),_=i(`:dels`),v=t.type,y=t.type===`deleteRange`?[t.range]:t.type===`delete`?[t.keys]:t.values.length<50?[Gn(u,t).filter(function(e){return e}),t.values]:[],b=y[0],y=y[1],x=t.trans._cache;return a(b)?(g.addKeys(b),(v=v===`delete`||b.length===y.length?qn(b,x):null)||_.addKeys(b),(v||y)&&(s=i,d=v,f=y,l.indexes.forEach(function(e){var t=s(e.name||``);function n(t){return t==null?null:e.extractKey(t)}function r(n){e.multiEntry&&a(n)?n.forEach(function(e){return t.addKey(e)}):t.addKey(n)}(d||f).forEach(function(e,t){var i=d&&n(d[t]),t=f&&n(f[t]);W(i,t)!==0&&(i!=null&&r(i),t!=null)&&r(t)})}))):b?(y={from:(x=b.lower)??e.MIN_KEY,to:(v=b.upper)??e.MAX_KEY},_.add(y),g.add(y)):(g.add(r),_.add(r),l.indexes.forEach(function(e){return i(e.name).add(r)})),c.mutate(t).then(function(e){return!b||t.type!==`add`&&t.type!==`put`||(g.addKeys(e.results),m&&m.forEach(function(n){for(var r=t.values.map(function(e){return n.extractKey(e)}),a=n.keyPath.findIndex(function(e){return e===u.keyPath}),o=0,s=e.results.length;o<s;++o)r[o][a]=e.results[o];i(n.name).addKeys(r)})),p.mutatedParts=Mn(p.mutatedParts||{},h),e})}}),g={get:function(e){return[u,new Tn(e.key)]},getMany:function(e){return[u,new Tn().addKeys(e.keys)]},count:s,query:s,openCursor:s};return i(g).forEach(function(e){h[e]=function(i){var a=N.subscr,s=!!a,l=Yn(N,c)&&Xn(e,i)?i.obsSet={}:a;if(s){var u,a=function(e){return e=`idb://${n}/${o}/${e}`,l[e]||(l[e]=new Tn)},d=a(``),m=a(`:dels`),s=g[e](i),h=s[0],s=s[1];if((e===`query`&&h.isPrimaryKey&&!i.values?m:a(h.name||``)).add(s),!h.isPrimaryKey){if(e!==`count`)return u=e===`query`&&p&&i.values&&c.query(t(t({},i),{values:!1})),c[e].apply(this,arguments).then(function(t){if(e===`query`){if(p&&i.values)return u.then(function(e){return e=e.result,d.addKeys(e),t});var n=i.values?t.result.map(f):t.result;(i.values?d:m).addKeys(n)}else{var r,a;if(e===`openCursor`)return a=i.values,(r=t)&&Object.create(r,{key:{get:function(){return m.addKey(r.primaryKey),r.key}},primaryKey:{get:function(){var e=r.primaryKey;return m.addKey(e),e}},value:{get:function(){return a&&d.addKey(r.primaryKey),r.value}}})}return t});m.add(r)}}return c[e].apply(this,arguments)}}),h}})}};function Zn(e,n,r){var i;return r.numFailures===0?n:n.type===`deleteRange`||(i=n.keys?n.keys.length:`values`in n&&n.values?n.values.length:1,r.numFailures===i)?null:(i=t({},n),a(i.keys)&&(i.keys=i.keys.filter(function(e,t){return!(t in r.failures)})),`values`in i&&a(i.values)&&(i.values=i.values.filter(function(e,t){return!(t in r.failures)})),i)}function Qn(e,t){return n=e,((r=t).lower===void 0||(r.lowerOpen?0<W(n,r.lower):0<=W(n,r.lower)))&&(n=e,(r=t).upper===void 0||(r.upperOpen?W(n,r.upper)<0:W(n,r.upper)<=0));var n,r}function $n(e,t,n,r,i,o){var s,c,l,u,d,f,p;return!n||n.length===0||(s=t.query.index,c=s.multiEntry,l=t.query.range,u=r.schema.primaryKey.extractKey,d=s.extractKey,f=(s.lowLevelIndex||s).extractKey,(r=n.reduce(function(e,n){var r=e,i=[];if(n.type===`add`||n.type===`put`)for(var o=new Tn,s=n.values.length-1;0<=s;--s){var f,p=n.values[s],m=u(p);!o.hasKey(m)&&(f=d(p),c&&a(f)?f.some(function(e){return Qn(e,l)}):Qn(f,l))&&(o.addKey(m),i.push(p))}switch(n.type){case`add`:var h=new Tn().addKeys(t.values?e.map(function(e){return u(e)}):e),r=e.concat(t.values?i.filter(function(e){return e=u(e),!h.hasKey(e)&&(h.addKey(e),!0)}):i.map(function(e){return u(e)}).filter(function(e){return!h.hasKey(e)&&(h.addKey(e),!0)}));break;case`put`:var g=new Tn().addKeys(n.values.map(function(e){return u(e)}));r=e.filter(function(e){return!g.hasKey(t.values?u(e):e)}).concat(t.values?i:i.map(function(e){return u(e)}));break;case`delete`:var _=new Tn().addKeys(n.keys);r=e.filter(function(e){return!_.hasKey(t.values?u(e):e)});break;case`deleteRange`:var v=n.range;r=e.filter(function(e){return!Qn(u(e),v)})}return r},e))===e)?e:(p=function(e,t){return W(f(e),f(t))||W(u(e),u(t))},r.sort(t.direction===`prev`||t.direction===`prevunique`?function(e,t){return p(t,e)}:p),t.limit&&t.limit<1/0&&(r.length>t.limit?r.length=t.limit:e.length===t.limit&&r.length<t.limit&&(i.dirty=!0)),o?Object.freeze(r):r)}function er(e,t){return W(e.lower,t.lower)===0&&W(e.upper,t.upper)===0&&!!e.lowerOpen==!!t.lowerOpen&&!!e.upperOpen==!!t.upperOpen}function tr(e,t){return((e,t,n,r)=>{if(e===void 0)return t===void 0?0:-1;if(t===void 0)return 1;if((e=W(e,t))===0){if(n&&r)return 0;if(n)return 1;if(r)return-1}return e})(e.lower,t.lower,e.lowerOpen,t.lowerOpen)<=0&&0<=((e,t,n,r)=>{if(e===void 0)return t===void 0?0:1;if(t===void 0)return-1;if((e=W(e,t))===0){if(n&&r)return 0;if(n)return-1;if(r)return 1}return e})(e.upper,t.upper,e.upperOpen,t.upperOpen)}function nr(e,t,n,r){e.subscribers.add(n),r.addEventListener(`abort`,function(){var r,i;e.subscribers.delete(n),e.subscribers.size===0&&(r=e,i=t,setTimeout(function(){r.subscribers.size===0&&O(i,r)},3e3))})}var rr={stack:`dbcore`,level:0,name:`Cache`,create:function(e){var n=e.schema.name;return t(t({},e),{transaction:function(t,r,i){var a,o,s=e.transaction(t,r,i);return r===`readwrite`&&(i=(a=new AbortController).signal,s.addEventListener(`abort`,(o=function(i){return function(){if(a.abort(),r===`readwrite`){for(var o=new Set,c=0,l=t;c<l.length;c++){var u=l[c],d=Pn[`idb://${n}/${u}`];if(d){var f=e.table(u),p=d.optimisticOps.filter(function(e){return e.trans===s});if(s._explicit&&i&&s.mutatedParts)for(var m=0,h=Object.values(d.queries.query);m<h.length;m++)for(var g=0,_=(b=h[m]).slice();g<_.length;g++)Nn((x=_[g]).obsSet,s.mutatedParts)&&(O(b,x),x.subscribers.forEach(function(e){return o.add(e)}));else if(0<p.length){d.optimisticOps=d.optimisticOps.filter(function(e){return e.trans!==s});for(var v=0,y=Object.values(d.queries.query);v<y.length;v++)for(var b,x,S,C=0,w=(b=y[v]).slice();C<w.length;C++)(x=w[C]).res!=null&&s.mutatedParts&&(i&&!x.dirty?(S=Object.isFrozen(x.res),S=$n(x.res,x.req,p,f,x,S),x.dirty?(O(b,x),x.subscribers.forEach(function(e){return o.add(e)})):S!==x.res&&(x.res=S,x.promise=P.resolve({result:S}))):(x.dirty&&O(b,x),x.subscribers.forEach(function(e){return o.add(e)})))}}}o.forEach(function(e){return e()})}}})(!1),{signal:i}),s.addEventListener(`error`,o(!1),{signal:i}),s.addEventListener(`complete`,o(!0),{signal:i})),s},table:function(r){var i=e.table(r),a=i.schema.primaryKey;return t(t({},i),{mutate:function(e){var o,s=N.trans;return!a.outbound&&s.db._options.cache!==`disabled`&&!s.explicit&&s.idbtrans.mode===`readwrite`&&(o=Pn[`idb://${n}/${r}`])?(s=i.mutate(e),e.type!==`add`&&e.type!==`put`||!(50<=e.values.length||Gn(a,e).some(function(e){return e==null}))?(o.optimisticOps.push(e),e.mutatedParts&&Ln(e.mutatedParts),s.then(function(t){0<t.numFailures&&(O(o.optimisticOps,e),(t=Zn(0,e,t))&&o.optimisticOps.push(t),e.mutatedParts)&&Ln(e.mutatedParts)}),s.catch(function(){O(o.optimisticOps,e),e.mutatedParts&&Ln(e.mutatedParts)})):s.then(function(n){var r=Zn(0,t(t({},e),{values:e.values.map(function(e,r){var i;return n.failures[r]?e:(x(i=(i=a.keyPath)!=null&&i.includes(`.`)?te(e):t({},e),a.keyPath,n.results[r]),i)})}),n);o.optimisticOps.push(r),queueMicrotask(function(){return e.mutatedParts&&Ln(e.mutatedParts)})}),s):i.mutate(e)},query:function(e){var t,a,o,s,c,l,u;return Yn(N,i)&&Xn(`query`,e)?(t=(o=N.trans)?.db._options.cache===`immutable`,a=(o=N).requery,o=o.signal,l=((e,t,n,r)=>{var i=Pn[`idb://${e}/${t}`];if(!i)return[];if(!(e=i.queries[n]))return[null,!1,i,null];var a=e[(r.query?r.query.index.name:null)||``];if(!a)return[null,!1,i,null];switch(n){case`query`:var o=(s=r.direction)??`next`,s=a.find(function(e){return e.req.limit===r.limit&&e.req.values===r.values&&(e.req.direction??`next`)===o&&er(e.req.query.range,r.query.range)});return s?[s,!0,i,a]:[a.find(function(e){return(`limit`in e.req?e.req.limit:1/0)>=r.limit&&(e.req.direction??`next`)===o&&(!r.values||e.req.values)&&tr(e.req.query.range,r.query.range)}),!1,i,a];case`count`:return s=a.find(function(e){return er(e.req.query.range,r.query.range)}),[s,!!s,i,a]}})(n,r,`query`,e),u=l[0],s=l[2],c=l[3],u&&l[1]?u.obsSet=e.obsSet:(l=i.query(e).then(function(e){var n=e.result;if(u&&(u.res=n),t){for(var r=0,i=n.length;r<i;++r)Object.freeze(n[r]);Object.freeze(n)}return e}).catch(function(e){return c&&u&&O(c,u),Promise.reject(e)}),u={obsSet:e.obsSet,promise:l,subscribers:new Set,type:`query`,req:e,dirty:!1},c?c.push(u):(c=[u],(s||=Pn[`idb://${n}/${r}`]={queries:{query:{},count:{}},objs:new Map,optimisticOps:[],unsignaledParts:{}}).queries.query[e.query.index.name||``]=c)),nr(u,c,a,o),u.promise.then(function(n){return n=$n(n.result,e,s?.optimisticOps,i,u,t),{result:t?n:te(n)}})):i.query(e)}})}})}};function ir(e,t){return new Proxy(e,{get:function(e,n,r){return n===`db`?t:Reflect.get(e,n,r)}})}ar.prototype.version=function(e){if(isNaN(e)||e<.1)throw new k.Type(`Given version is not a positive number`);if(e=Math.round(10*e)/10,this.idbdb||this._state.isBeingOpened)throw new k.Schema(`Cannot add version when database is open`);this.verno=Math.max(this.verno,e);var t=this._versions,n=t.filter(function(t){return t._cfg.version===e})[0];return n||(n=new this.Version(e),t.push(n),t.sort(cn),n.stores({}),this._state.autoSchema=!1),n},ar.prototype._whenReady=function(e){var t=this;return this.idbdb&&(this._state.openComplete||N.letThrough||this._vip)?e():new P(function(e,n){if(t._state.openComplete)return n(new k.DatabaseClosed(t._state.dbOpenError));if(!t._state.isBeingOpened){if(!t._state.autoOpen)return void n(new k.DatabaseClosed);t.open().catch(A)}t._state.dbReadyPromise.then(e,n)}).then(e)},ar.prototype.use=function(e){var t=e.stack,n=e.create,r=e.level,e=e.name,i=(e&&this.unuse({stack:t,name:e}),this._middlewares[t]||(this._middlewares[t]=[]));return i.push({stack:t,create:n,level:r??10,name:e}),i.sort(function(e,t){return e.level-t.level}),this},ar.prototype.unuse=function(e){var t=e.stack,n=e.name,r=e.create;return t&&this._middlewares[t]&&(this._middlewares[t]=this._middlewares[t].filter(function(e){return r?e.create!==r:!!n&&e.name!==n})),this},ar.prototype.open=function(){var e=this;return at(Le,function(){return Bn(e)})},ar.prototype._close=function(){this.on.close.fire(new CustomEvent(`close`));var e=this._state;if(bn.remove(this),this.idbdb){try{this.idbdb.close()}catch{}this.idbdb=null}e.isBeingOpened||(e.dbReadyPromise=new P(function(t){e.dbReadyResolve=t}),e.openCanceller=new P(function(t,n){e.cancelOpen=n}))},ar.prototype.close=function(e){var e=(e===void 0?{disableAutoOpen:!0}:e).disableAutoOpen,t=this._state;e?(t.isBeingOpened&&t.cancelOpen(new k.DatabaseClosed),this._close(),t.autoOpen=!1,t.dbOpenError=new k.DatabaseClosed):(this._close(),t.autoOpen=this._options.autoOpen||t.isBeingOpened,t.openComplete=!1,t.dbOpenError=null)},ar.prototype.delete=function(e){var t=this,n=(e===void 0&&(e={disableAutoOpen:!0}),0<arguments.length&&typeof arguments[0]!=`object`),r=this._state;return new P(function(i,a){function o(){t.close(e);var n=t._deps.indexedDB.deleteDatabase(t.name);n.onsuccess=L(function(){var e=t._deps,n=t.name,r;Sn(r=e.indexedDB)||n===dt||xn(r,e.IDBKeyRange).delete(n).catch(A),i()}),n.onerror=Vt(a),n.onblocked=t._fireOnBlocked}if(n)throw new k.InvalidArgument(`Invalid closeOptions argument to db.delete()`);r.isBeingOpened?r.dbReadyPromise.then(o):o()})},ar.prototype.backendDB=function(){return this.idbdb},ar.prototype.isOpen=function(){return this.idbdb!==null},ar.prototype.hasBeenClosed=function(){var e=this._state.dbOpenError;return e&&e.name===`DatabaseClosed`},ar.prototype.hasFailed=function(){return this._state.dbOpenError!==null},ar.prototype.dynamicallyOpened=function(){return this._state.autoSchema},Object.defineProperty(ar.prototype,"tables",{get:function(){var e=this;return i(this._allTables).map(function(t){return e._allTables[t]})},enumerable:!1,configurable:!0}),ar.prototype.transaction=function(){var e=function(e,t,n){var r=arguments.length;if(r<2)throw new k.InvalidArgument(`Too few arguments`);for(var i=Array(r-1);--r;)i[r-1]=arguments[r];return n=i.pop(),[e,w(i),n]}.apply(this,arguments);return this._transaction.apply(this,e)},ar.prototype._transaction=function(e,t,n){var r,i,a=this,o=N.trans,s=(o&&o.db===this&&e.indexOf(`!`)===-1||(o=null),e.indexOf(`?`)!==-1);e=e.replace(`!`,``).replace(`?`,``);try{if(i=t.map(function(e){if(e=e instanceof a.Table?e.name:e,typeof e!=`string`)throw TypeError(`Invalid table argument to Dexie.transaction(). Only Table or String are allowed`);return e}),e==`r`||e===ft)r=ft;else{if(e!=`rw`&&e!=U)throw new k.InvalidArgument(`Invalid transaction mode: `+e);r=U}if(o){if(o.mode===ft&&r===U){if(!s)throw new k.SubTransaction(`Cannot enter a sub-transaction with READWRITE mode when parent transaction is READONLY`);o=null}o&&i.forEach(function(e){if(o&&o.storeNames.indexOf(e)===-1){if(!s)throw new k.SubTransaction(`Table `+e+` not included in parent transaction.`);o=null}}),s&&o&&!o.active&&(o=null)}}catch(e){return o?o._promise(null,function(t,n){n(e)}):H(e)}var c=function e(t,n,r,i,a){return P.resolve().then(function(){var o=N.transless||N,s=t._createTransaction(n,r,t._dbSchema,i),o=(s.explicit=!0,{trans:s,transless:o});if(i)s.idbtrans=i.idbtrans;else try{s.create(),s.idbtrans._explicit=!0,t._state.PR1398_maxLoop=3}catch(i){return i.name===me.InvalidState&&t.isOpen()&&0<--t._state.PR1398_maxLoop?(console.warn(`Dexie: Need to reopen db`),t.close({disableAutoOpen:!1}),t.open().then(function(){return e(t,n,r,null,a)})):H(i)}var c,l=se(a),o=(l&&et(),P.follow(function(){var e;(c=a.call(s,s))&&(l?(e=tt.bind(null,null),c.then(e,e)):typeof c.next==`function`&&typeof c.throw==`function`&&(c=Vn(c)))},o));return(c&&typeof c.then==`function`?P.resolve(c).then(function(e){return s.active?e:H(new k.PrematureCommit(`Transaction committed too early. See http://bit.ly/2kdckMn`))}):o.then(function(){return c})).then(function(e){return i&&s._resolve(),s._completion.then(function(){return e})}).catch(function(e){return s._reject(e),H(e)})})}.bind(null,this,r,i,o,n);return o?o._promise(r,c,`lock`):N.trans?at(N.transless,function(){return a._whenReady(c)}):this._whenReady(c)},ar.prototype.table=function(e){if(l(this._allTables,e))return this._allTables[e];throw new k.InvalidTable(`Table ${e} does not exist`)};var Z=ar;function ar(e,n){var r,i,a,o,s,c=this,l=(this._middlewares={},this.verno=0,ar.dependencies),l=(this._options=n=t({addons:ar.addons,autoOpen:!0,indexedDB:l.indexedDB,IDBKeyRange:l.IDBKeyRange,cache:`cloned`,maxConnections:1e3},n),this._deps={indexedDB:n.indexedDB,IDBKeyRange:n.IDBKeyRange},n.addons),u=(this._dbSchema={},this._versions=[],this._storeNames=[],this._allTables={},this.idbdb=null,this._novip=this,{dbOpenError:null,isBeingOpened:!1,onReadyBeingFired:null,openComplete:!1,dbReadyResolve:A,dbReadyPromise:null,cancelOpen:A,openCanceller:null,autoSchema:!0,PR1398_maxLoop:3,autoOpen:n.autoOpen}),d=(u.dbReadyPromise=new P(function(e){u.dbReadyResolve=e}),u.openCanceller=new P(function(e,t){u.cancelOpen=t}),this._state=u,this.name=e,this.on=wt(this,`populate`,`blocked`,`versionchange`,`close`,{ready:[Ce,A]}),this.once=function(e,t){var n=function(){var r=[...arguments];c.on(e).unsubscribe(n),t.apply(c,r)};return c.on(e,n)},this.on.ready.subscribe=_(this.on.ready.subscribe,function(e){return function(t,n){ar.vip(function(){var r,i=c._state;i.openComplete?(i.dbOpenError||P.resolve().then(t),n&&e(t)):i.onReadyBeingFired?(i.onReadyBeingFired.push(t),n&&e(t)):(e(t),r=c,n||e(function e(){r.on.ready.unsubscribe(t),r.on.ready.unsubscribe(e)}))})}}),this.Collection=(r=this,Tt(J.prototype,function(e,t){this.db=r;var n=mt,i=null;if(t)try{n=t()}catch(e){i=e}var t=e._ctx,e=t.table,a=e.hook.reading.fire;this._ctx={table:e,index:t.index,isPrimKey:!t.index||e.schema.primKey.keyPath&&t.index===e.schema.primKey.name,range:n,keysOnly:!1,dir:`next`,unique:``,algorithm:null,filter:null,replayFilter:null,justLimit:!0,isMatch:null,offset:0,limit:1/0,error:i,or:t.or,valueMapper:a===_e?null:a}})),this.Table=(i=this,Tt(Ct.prototype,function(e,t,n){this.db=i,this._tx=n,this.name=e,this.schema=t,this.hook=i._allTables[e]?i._allTables[e].hook:wt(null,{creating:[be,A],reading:[ve,_e],updating:[Se,A],deleting:[xe,A]})})),this.Transaction=(a=this,Tt(Kt.prototype,function(e,t,n,r,i){var o=this;e!==`readonly`&&t.forEach(function(e){e=(e=n[e])?.yProps,e&&(t=t.concat(e.map(function(e){return e.updatesTable})))}),this.db=a,this.mode=e,this.storeNames=t,this.schema=n,this.chromeTransactionDurability=r,this.idbtrans=null,this.on=wt(this,`complete`,`error`,`abort`),this.parent=i||null,this.active=!0,this._reculock=0,this._blockedFuncs=[],this._resolve=null,this._reject=null,this._waitingFor=null,this._waitingQueue=null,this._spinCount=0,this._completion=new P(function(e,t){o._resolve=e,o._reject=t}),this._completion.then(function(){o.active=!1,o.on.complete.fire()},function(e){var t=o.active;return o.active=!1,o.on.error.fire(e),o.parent?o.parent._reject(e):t&&o.idbtrans&&o.idbtrans.abort(),H(e)})})),this.Version=(o=this,Tt(vn.prototype,function(e){this.db=o,this._cfg={version:e,storesSource:null,dbschema:{},tables:{},contentUpgrade:null}})),this.WhereClause=(s=this,Tt(zt.prototype,function(e,t,n){if(this.db=s,this._ctx={table:e,index:t===`:id`?null:t,or:n},this._cmp=this._ascending=W,this._descending=function(e,t){return W(t,e)},this._max=function(e,t){return 0<W(e,t)?e:t},this._min=function(e,t){return W(e,t)<0?e:t},this._IDBKeyRange=s._deps.IDBKeyRange,!this._IDBKeyRange)throw new k.MissingAPI})),this.on(`versionchange`,function(e){0<e.newVersion?console.warn(`Another connection wants to upgrade database '${c.name}'. Closing db now to resume the upgrade.`):console.warn(`Another connection wants to delete database '${c.name}'. Closing db now to resume the delete request.`),c.close({disableAutoOpen:!1})}),this.on(`blocked`,function(e){!e.newVersion||e.newVersion<e.oldVersion?console.warn(`Dexie.delete('${c.name}') was blocked`):console.warn(`Upgrade '${c.name}' blocked by other connection holding version ${e.oldVersion/10}`)}),this._maxKey=Zt(n.IDBKeyRange),this._createTransaction=function(e,t,n,r){return new c.Transaction(e,t,n,c._options.chromeTransactionDurability,r)},this._fireOnBlocked=function(e){c.on(`blocked`).fire(e),bn.toArray().filter(function(e){return e.name===c.name&&e!==c&&!e._state.vcFired}).map(function(t){return t.on(`versionchange`).fire(e)})},this.use(Jn),this.use(rr),this.use(X),this.use(Un),this.use(Kn),new Proxy(this,{get:function(e,t,n){var r;return t===`_vip`||(t===`table`?function(e){return ir(c.table(e),d)}:(r=Reflect.get(e,t,n))instanceof Ct?ir(r,d):t===`tables`?r.map(function(e){return ir(e,d)}):t===`_createTransaction`?function(){return ir(r.apply(this,arguments),d)}:r)}}));this.vip=d,l.forEach(function(e){return e(c)})}var or,Oe=typeof Symbol<`u`&&`observable`in Symbol?Symbol.observable:`@@observable`,sr=(cr.prototype.subscribe=function(e,t,n){return this._subscribe(e&&typeof e!=`function`?e:{next:e,error:t,complete:n})},cr.prototype[Oe]=function(){return this},cr);function cr(e){this._subscribe=e}try{or={indexedDB:r.indexedDB||r.mozIndexedDB||r.webkitIndexedDB||r.msIndexedDB,IDBKeyRange:r.IDBKeyRange||r.webkitIDBKeyRange}}catch{or={indexedDB:null,IDBKeyRange:null}}function lr(e){var t,n=!1,r=new sr(function(r){var i=se(e),a,o=!1,s={},c={},l={get closed(){return o},unsubscribe:function(){o||(o=!0,a&&a.abort(),u&&Gt.storagemutated.unsubscribe(p))}},u=(r.start&&r.start(l),!1),d=function(){return st(m)};function f(){return Nn(c,s)}var p=function(e){Mn(s,e),f()&&d()},m=function(){var l,m,h;!o&&or.indexedDB&&(s={},l={},a&&a.abort(),a=new AbortController,h=(t=>{var n=qe();try{i&&et();var r=$e(e,t);return r=i?r.finally(tt):r}finally{n&&Je()}})(m={subscr:l,signal:a.signal,requery:d,querier:e,trans:null}),u||=(Gt.storagemutated.subscribe(p),!0),Promise.resolve(h).then(function(e){n=!0,t=e,o||m.signal.aborted||(f()||(c=l,f())?d():(s={},st(function(){return!o&&r.next&&r.next(e)})))},function(e){n=!1,[`DatabaseClosedError`,`AbortError`].includes(e?.name)||o||st(function(){o||r.error&&r.error(e)})}))};return setTimeout(d,0),l});return r.hasValue=function(){return n},r.getValue=function(){return t},r}var ur=Z;function dr(e){var t=pr;try{pr=!0,Gt.storagemutated.fire(e),Rn(e,!0)}finally{pr=t}}u(ur,t(t({},T),{delete:function(e){return new ur(e,{addons:[]}).delete()},exists:function(e){return new ur(e,{addons:[]}).open().then(function(e){return e.close(),!0}).catch(`NoSuchDatabaseError`,function(){return!1})},getDatabaseNames:function(e){try{return t=ur.dependencies,n=t.indexedDB,t=t.IDBKeyRange,(Sn(n)?Promise.resolve(n.databases()).then(function(e){return e.map(function(e){return e.name}).filter(function(e){return e!==dt})}):xn(n,t).toCollection().primaryKeys()).then(e)}catch{return H(new k.MissingAPI)}var t,n},defineClass:function(){return function(e){o(this,e)}},ignoreTransaction:function(e){return N.trans?at(N.transless||Le,e):e()},vip:Cn,async:function(e){return function(){try{var t=Vn(e.apply(this,arguments));return t&&typeof t.then==`function`?t:P.resolve(t)}catch(e){return H(e)}}},spawn:function(e,t,n){try{var r=Vn(e.apply(n,t||[]));return r&&typeof r.then==`function`?r:P.resolve(r)}catch(e){return H(e)}},currentTransaction:{get:function(){return N.trans||null}},waitFor:function(e,t){return e=P.resolve(typeof e==`function`?ur.ignoreTransaction(e):e).timeout(t||6e4),N.trans?N.trans.waitFor(e):e},Promise:P,debug:{get:function(){return M},set:function(e){we(e)}},derive:p,extend:o,props:u,override:_,Events:wt,on:Gt,liveQuery:lr,extendObservabilitySet:Mn,getByKeyPath:b,setByKeyPath:x,delByKeyPath:function(e,t){typeof t==`string`?x(e,t,void 0):`length`in t&&[].map.call(t,function(t){x(e,t,void 0)})},shallowClone:S,deepClone:te,getObjectDiff:Wn,cmp:W,asap:y,minKey:-1/0,addons:[],connections:{get:bn.toArray},errnames:me,dependencies:or,cache:Pn,semVer:`4.4.5`,version:`4.4.5`.split(`.`).map(function(e){return parseInt(e)}).reduce(function(e,t,n){return e+t/10**(2*n)})})),ur.maxKey=Zt(ur.dependencies.IDBKeyRange),typeof dispatchEvent<`u`&&typeof addEventListener<`u`&&(Gt(Ut,function(e){pr||=(e=new CustomEvent(Wt,{detail:e}),pr=!0,dispatchEvent(e),!1)}),addEventListener(Wt,function(e){e=e.detail,pr||dr(e)}));var fr,pr=!1,mr=function(){};return typeof BroadcastChannel<`u`&&((mr=function(){(fr=new BroadcastChannel(Wt)).onmessage=function(e){return e.data&&dr(e.data)}})(),typeof fr.unref==`function`&&fr.unref(),Gt(Ut,function(e){pr||fr.postMessage(e)})),typeof addEventListener<`u`&&(addEventListener(`pagehide`,function(e){if(!Z.disableBfCache&&e.persisted){M&&console.debug(`Dexie: handling persisted pagehide`),fr?.close();for(var t=0,n=bn.toArray();t<n.length;t++)n[t].close({disableAutoOpen:!1})}}),addEventListener(`pageshow`,function(e){!Z.disableBfCache&&e.persisted&&(M&&console.debug(`Dexie: handling persisted pageshow`),mr(),dr({all:new Tn(-1/0,[[]])}))})),P.rejectionMapper=function(e,t){return!e||e instanceof ue||e instanceof TypeError||e instanceof SyntaxError||!e.name||!ge[e.name]?e:(t=new ge[e.name](t||e.message,e),`stack`in e&&f(t,`stack`,{get:function(){return this.inner.stack}}),t)},we(M),t(Z,Object.freeze({__proto__:null,DEFAULT_MAX_CONNECTIONS:1e3,Dexie:Z,Entity:gt,PropModification:bt,RangeSet:Tn,add:function(e){return new bt({add:e})},cmp:W,default:Z,liveQuery:lr,mergeRanges:Dn,rangesOverlap:On,remove:function(e){return new bt({remove:e})},replacePrefix:function(e,t){return new bt({replacePrefix:[e,t]})}}),{default:Z}),Z})}))(),1),Ko=Symbol.for(`Dexie`),qo=globalThis[Ko]||(globalThis[Ko]=Go.default);if(Go.default.semVer!==qo.semVer)throw Error(`Two different versions of Dexie loaded in the same app: ${Go.default.semVer} and ${qo.semVer}`);var{liveQuery:Jo,mergeRanges:Yo,rangesOverlap:Xo,RangeSet:Zo,cmp:Qo,Entity:$o,PropModification:es,replacePrefix:ts,add:ns,remove:rs,DexieYProvider:is}=qo,as=new class extends qo{constructor(){super(`HubAddressDirectoryDB`),this.version(1).stores({staff:`++id, staffId, name, department`,organizations:`++id, department, extensionNumber, phoneNumber`})}async getAllStaff(){return this.staff.toArray()}async getAllOrganizations(){return this.organizations.toArray()}async addStaff(e){return this.staff.add(e)}async updateStaff(e,t){return this.staff.update(e,t)}async deleteStaff(e){return this.staff.delete(e)}async addOrganization(e){return this.organizations.add(e)}async updateOrganization(e,t){return this.organizations.update(e,t)}async deleteOrganization(e){return this.organizations.delete(e)}async bulkReplaceStaff(e){await this.transaction(`rw`,this.staff,async()=>{await this.staff.clear(),e.length>0&&await this.staff.bulkAdd(e)})}async bulkReplaceOrganizations(e){await this.transaction(`rw`,this.organizations,async()=>{await this.organizations.clear(),e.length>0&&await this.organizations.bulkAdd(e)})}async bulkReplaceAll(e,t){await this.transaction(`rw`,this.staff,this.organizations,async()=>{await this.staff.clear(),await this.organizations.clear(),e.length>0&&await this.staff.bulkAdd(e),t.length>0&&await this.organizations.bulkAdd(t)})}async clearAll(){await this.transaction(`rw`,this.staff,this.organizations,async()=>{await this.staff.clear(),await this.organizations.clear()})}},os=`hubaddress_theme`;function ss(e){if(e)return e;let t=globalThis.chrome?.storage?.local;if(t)return t;if(globalThis.localStorage!==void 0)return{get:async e=>{let t=globalThis.localStorage.getItem(e);return t?{[e]:JSON.parse(t)}:{}},set:async e=>{for(let[t,n]of Object.entries(e))globalThis.localStorage.setItem(t,JSON.stringify(n))}}}function cs(e){return e===`light`||e===`dark`||e===`system`}async function ls(e){let t=ss(e);if(!t)return`system`;try{let e=(await t.get(os))[os];return cs(e)?e:`system`}catch{return`system`}}async function us(e,t){let n=ss(t);n&&await n.set({[os]:e})}function ds(e,t){return e===`system`?t?`dark`:`light`:e}function fs(){return globalThis.window===void 0||typeof globalThis.window.matchMedia!=`function`?!1:globalThis.window.matchMedia(`(prefers-color-scheme: dark)`).matches}function ps(e,t=typeof document<`u`?document.documentElement:void 0,n=fs()){if(t){if(ds(e,n)===`dark`){t.classList.remove(`wa-light`),t.classList.add(`wa-dark`),t.setAttribute(`data-theme`,`dark`);return}t.classList.remove(`wa-dark`),t.classList.add(`wa-light`),t.setAttribute(`data-theme`,`light`)}}function ms(e){if(e)return e;if(globalThis.navigator!==void 0&&globalThis.navigator.clipboard)return globalThis.navigator.clipboard}async function hs(e,t){let n=e.trim();if(n.length===0)return!1;let r=ms(t);if(!r)return!1;try{return await r.writeText(n),!0}catch{return!1}}var gs=c(o(((e,t)=>{((n,r)=>{typeof define==`function`&&define.amd?define([],r):typeof t==`object`&&e!==void 0?t.exports=r():n.Papa=r()})(e,function e(){var t=typeof self<`u`?self:typeof window<`u`?window:t===void 0?{}:t,n=!t.document&&!!t.postMessage,r=t.IS_PAPA_WORKER||!1,i={},a=0,o={};function s(e){return e.charCodeAt(0)===65279?e.slice(1):e}function c(e){this._handle=null,this._finished=!1,this._completed=!1,this._halted=!1,this._input=null,this._baseIndex=0,this._partialLine=``,this._rowCount=0,this._start=0,this._nextChunk=null,this.isFirstChunk=!0,this._completeResults={data:[],errors:[],meta:{}},function(e){var t=y(e);t.chunkSize=parseInt(t.chunkSize),e.step||e.chunk||(t.chunkSize=null),this._handle=new p(t),(this._handle.streamer=this)._config=t}.call(this,e),this.parseChunk=function(e,n){var i=parseInt(this._config.skipFirstNLines)||0;if(this.isFirstChunk&&0<i){let t=this._config.newline;t||=(a=this._config.quoteChar||`"`,this._handle.guessLineEndings(e,a)),e=[...e.split(t).slice(i)].join(t)}this.isFirstChunk&&x(this._config.beforeFirstChunk)&&(a=this._config.beforeFirstChunk(e))!==void 0&&(e=a),this.isFirstChunk=!1,this._halted=!1;var i=this._partialLine+e,a=(this._partialLine=``,this._handle.parse(i,this._baseIndex,!this._finished));if(!this._handle.paused()&&!this._handle.aborted()){if(e=a.meta.cursor,i=(this._finished||(this._partialLine=i.substring(e-this._baseIndex),this._baseIndex=e),a&&a.data&&(this._rowCount+=a.data.length),this._finished||this._config.preview&&this._rowCount>=this._config.preview),r)t.postMessage({results:a,workerId:o.WORKER_ID,finished:i});else if(x(this._config.chunk)&&!n){if(this._config.chunk(a,this._handle),this._handle.paused()||this._handle.aborted())return void(this._halted=!0);this._completeResults=a=void 0}return this._config.step||this._config.chunk||(this._completeResults.data=this._completeResults.data.concat(a.data),this._completeResults.errors=this._completeResults.errors.concat(a.errors),this._completeResults.meta=a.meta),this._completed||!i||!x(this._config.complete)||a&&a.meta.aborted||(this._config.complete(this._completeResults,this._input),this._completed=!0),i||a&&a.meta.paused||this._nextChunk(),a}this._halted=!0},this._sendError=function(e){x(this._config.error)?this._config.error(e):r&&this._config.error&&t.postMessage({workerId:o.WORKER_ID,error:e,finished:!1})}}function l(e){var t;(e||={}).chunkSize||(e.chunkSize=o.RemoteChunkSize),c.call(this,e),this._nextChunk=n?function(){this._readChunk(),this._chunkLoaded()}:function(){this._readChunk()},this.stream=function(e){this._input=e,this._nextChunk()},this._readChunk=function(){if(this._finished)this._chunkLoaded();else{if(t=new XMLHttpRequest,this._config.withCredentials&&(t.withCredentials=this._config.withCredentials),n||(t.onload=b(this._chunkLoaded,this),t.onerror=b(this._chunkError,this)),t.ontimeout=b(this._chunkTimeout,this),t.open(this._config.downloadRequestBody?`POST`:`GET`,this._input,!n),this._config.downloadTimeout&&!n&&(t.timeout=this._config.downloadTimeout),this._config.downloadRequestHeaders){var e,r=this._config.downloadRequestHeaders;for(e in r)t.setRequestHeader(e,r[e])}var i;this._config.chunkSize&&(i=this._start+this._config.chunkSize-1,t.setRequestHeader(`Range`,`bytes=`+this._start+`-`+i));try{t.send(this._config.downloadRequestBody)}catch(e){this._chunkError(e.message)}n&&t.status===0&&this._chunkError()}},this._chunkLoaded=function(){t.readyState===4&&(t.status<200||400<=t.status?this._chunkError():(this._start+=this._config.chunkSize||t.responseText.length,this._finished=!this._config.chunkSize||this._start>=(e=>(e=e.getResponseHeader(`Content-Range`))===null?-1:parseInt(e.substring(e.lastIndexOf(`/`)+1)))(t),this.parseChunk(t.responseText)))},this._chunkError=function(e){e=t.statusText||e,this._sendError(Error(e))},this._chunkTimeout=function(){this._chunkError(`Request timed out after `+this._config.downloadTimeout+`ms`)}}function u(e){(e||={}).chunkSize||(e.chunkSize=o.LocalChunkSize),c.call(this,e);var t,n,r=typeof FileReader<`u`;this.stream=function(e){this._input=e,n=e.slice||e.webkitSlice||e.mozSlice,r?((t=new FileReader).onload=b(this._chunkLoaded,this),t.onerror=b(this._chunkError,this)):t=new FileReaderSync,this._nextChunk()},this._nextChunk=function(){this._finished||this._config.preview&&!(this._rowCount<this._config.preview)||this._readChunk()},this._readChunk=function(){var e=this._input,i=(this._config.chunkSize&&(i=Math.min(this._start+this._config.chunkSize,this._input.size),e=n.call(e,this._start,i)),t.readAsText(e,this._config.encoding));r||this._chunkLoaded({target:{result:i}})},this._chunkLoaded=function(e){this._start+=this._config.chunkSize,this._finished=!this._config.chunkSize||this._start>=this._input.size,this.parseChunk(e.target.result)},this._chunkError=function(){this._sendError(t.error)}}function d(e){var t;c.call(this,e||={}),this.stream=function(e){return t=e,this._nextChunk()},this._nextChunk=function(){var e,n;if(!this._finished)return e=this._config.chunkSize,t=e?(n=t.substring(0,e),t.substring(e)):(n=t,``),this._finished=!t,this.parseChunk(n)}}function f(e){c.call(this,e||={});var t=[],n=!0,r=!1;this.pause=function(){c.prototype.pause.apply(this,arguments),this._input.pause()},this.resume=function(){c.prototype.resume.apply(this,arguments),this._input.resume()},this.stream=function(e){this._input=e,this._input.on(`data`,this._streamData),this._input.on(`end`,this._streamEnd),this._input.on(`error`,this._streamError)},this._checkIsFinished=function(){r&&t.length===1&&(this._finished=!0)},this._nextChunk=function(){this._checkIsFinished(),t.length?this.parseChunk(t.shift()):n=!0},this._streamData=b(function(e){try{t.push(typeof e==`string`?e:e.toString(this._config.encoding)),n&&(n=!1,this._checkIsFinished(),this.parseChunk(t.shift()))}catch(e){this._streamError(e)}},this),this._streamError=b(function(e){this._streamCleanUp(),this._sendError(e)},this),this._streamEnd=b(function(){this._streamCleanUp(),r=!0,this._streamData(``)},this),this._streamCleanUp=b(function(){this._input.removeListener(`data`,this._streamData),this._input.removeListener(`end`,this._streamEnd),this._input.removeListener(`error`,this._streamError)},this)}function p(e){var t,n,r,i,a=2**53,s=-a,c=/^\s*-?(\d+\.?|\.\d+|\d+\.\d+)([eE][-+]?\d+)?\s*$/,l=/^((\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z)))$/,u=this,d=0,f=0,p=!1,g=!1,_=[],v={data:[],errors:[],meta:{}};function b(t){return e.skipEmptyLines===`greedy`?t.join(``).trim()===``:t.length===1&&t[0].length===0}function S(){if(v&&r&&(w(`Delimiter`,`UndetectableDelimiter`,`Unable to auto-detect delimiting character; defaulted to '`+o.DefaultDelimiter+`'`),r=!1),e.skipEmptyLines&&(v.data=v.data.filter(function(e){return!b(e)})),C()){if(v){if(Array.isArray(v.data[0])){for(var t=0;C()&&t<v.data.length;t++)v.data[t].forEach(e);v.data.splice(0,1)}else v.data.forEach(e)}function e(e){_.push(e)}}function n(t,n){for(var r=e.header?{}:[],i=0;i<t.length;i++){var o=i,u=t[i],u=((t,n)=>(t=>(e.dynamicTypingFunction&&e.dynamicTyping[t]===void 0&&(e.dynamicTyping[t]=e.dynamicTypingFunction(t)),!0===(e.dynamicTyping[t]||e.dynamicTyping)))(t)?n===`true`||n===`TRUE`||n!==`false`&&n!==`FALSE`&&((e=>{if(c.test(e)&&(e=parseFloat(e),s<e&&e<a))return 1})(n)?parseFloat(n):l.test(n)?new Date(n):n===``?null:n):n)(o=e.header?i>=_.length?`__parsed_extra`:_[i]:o,u=e.transform?e.transform(u,o):u);o===`__parsed_extra`?(r[o]=r[o]||[],r[o].push(u)):r[o]=u}return e.header&&(i>_.length?w(`FieldMismatch`,`TooManyFields`,`Too many fields: expected `+_.length+` fields but parsed `+i,f+n):i<_.length&&w(`FieldMismatch`,`TooFewFields`,`Too few fields: expected `+_.length+` fields but parsed `+i,f+n)),r}var i;v&&(e.header||e.dynamicTyping||e.transform)&&(i=1,!v.data.length||Array.isArray(v.data[0])?(v.data=v.data.map(n),i=v.data.length):v.data=n(v.data,0),e.header&&v.meta&&(v.meta.fields=_),f+=i)}function C(){return e.header&&_.length===0}function w(e,t,n,r){e={type:e,code:t,message:n},r!==void 0&&(e.row=r),v.errors.push(e)}x(e.step)&&(i=e.step,e.step=function(t){v=t,C()?S():(S(),v.data.length!==0&&(d+=t.data.length,e.preview&&d>e.preview?n.abort():(v.data=v.data[0],i(v,u))))}),this.parse=function(i,a,s){var c=e.quoteChar||`"`,c=(e.newline||=this.guessLineEndings(i,c),r=!1,e.delimiter?x(e.delimiter)&&(e.delimiter=e.delimiter(i),v.meta.delimiter=e.delimiter):((c=((t,n,r,i,a)=>{var s,c,l,u;a||=[`,`,`	`,`|`,`;`,o.RECORD_SEP,o.UNIT_SEP];for(var d=0;d<a.length;d++){for(var f,p=a[d],m=0,g=0,_=0,v=(l=void 0,new h({comments:i,delimiter:p,newline:n,preview:10}).parse(t)),y=0;y<v.data.length;y++)r&&b(v.data[y])?_++:(f=v.data[y].length,g+=f,l===void 0?l=f:0<f&&(m+=Math.abs(f-l),l=f));0<v.data.length&&(g/=v.data.length-_),1.99<g&&(c===void 0||m<c||m===c&&u<g)&&(c=m,s=p,u=g)}return{successful:!!(e.delimiter=s),bestDelimiter:s}})(i,e.newline,e.skipEmptyLines,e.comments,e.delimitersToGuess)).successful?e.delimiter=c.bestDelimiter:(r=!0,e.delimiter=o.DefaultDelimiter),v.meta.delimiter=e.delimiter),y(e));return c.header=C(),e.preview&&e.header&&c.preview++,t=i,n=new h(c),v=n.parse(t,a,s),S(),p?{meta:{paused:!0}}:v||{meta:{paused:!1}}},this.paused=function(){return p},this.pause=function(){p=!0,n.abort(),t=x(e.chunk)?``:t.substring(n.getCharIndex())},this.resume=function(){u.streamer._halted?(p=!1,u.streamer.parseChunk(t,!0)):setTimeout(u.resume,3)},this.aborted=function(){return g},this.abort=function(){g=!0,n.abort(),v.meta.aborted=!0,x(e.complete)&&e.complete(v),t=``},this.guessLineEndings=function(e,t){e=e.substring(0,1048576);var t=RegExp(m(t)+`([^]*?)`+m(t),`gm`),n=(e=e.replace(t,``)).split(`\r`),t=e.split(`
`),e=1<t.length&&t[0].length<n[0].length;if(n.length===1||e)return`
`;for(var r=0,i=0;i<n.length;i++)n[i][0]===`
`&&r++;return r>=n.length/2?`\r
`:`\r`}}function m(e){return e.replace(/[.*+?^${}()|[\]\\]/g,`\\$&`)}function h(e){var t=(e||={}).delimiter,n=e.newline,r=e.comments,i=e.step,a=e.preview,c=e.fastMode,l=null,u=!1,d=e.quoteChar==null?`"`:e.quoteChar,f=d;if(e.escapeChar!==void 0&&(f=e.escapeChar),(typeof t!=`string`||-1<o.BAD_DELIMITERS.indexOf(t))&&(t=`,`),r===t)throw Error(`Comment character same as delimiter`);!0===r?r=`#`:(typeof r!=`string`||-1<o.BAD_DELIMITERS.indexOf(r))&&(r=!1),n!==`
`&&n!==`\r`&&n!==`\r
`&&(n=`
`);var p=0,h=!1;this.parse=function(o,g,_){if(typeof o!=`string`)throw Error(`Input must be a string`);var v=o.length,y=t.length,b=n.length,S=r.length,C=x(i),w=[],T=[],E=[],ee=p=0;if(!o)return ue();if(c||!1!==c&&o.indexOf(d)===-1){for(var te=o.split(n),ne=0;ne<te.length;ne++){if(E=te[ne],p+=E.length,ne!==te.length-1)p+=n.length;else if(_)return ue();if(!r||E.substring(0,S)!==r){if(C){if(w=[],oe(E.split(t)),de(),h)return ue()}else oe(E.split(t));if(a&&a<=ne)return w=w.slice(0,a),ue(!0)}}return ue()}for(var re=o.indexOf(t,p),D=o.indexOf(n,p),ie=new RegExp(m(f)+m(d),`g`),O=o.indexOf(d,p);;)if(o[p]===d)for(O=p,p++;;){if((O=o.indexOf(d,O+1))===-1)return _||T.push({type:`Quotes`,code:`MissingQuotes`,message:`Quoted field unterminated`,row:w.length,index:p}),ce();if(O===v-1)return ce(o.substring(p,O).replace(ie,d));if(d===f&&o[O+1]===f)O++;else if(d===f||O===0||o[O-1]!==f){re!==-1&&re<O+1&&(re=o.indexOf(t,O+1));var ae=se((D=D!==-1&&D<O+1?o.indexOf(n,O+1):D)===-1?re:Math.min(re,D));if(o.substr(O+1+ae,y)===t){E.push(o.substring(p,O).replace(ie,d)),o[p=O+1+ae+y]!==d&&(O=o.indexOf(d,p)),re=o.indexOf(t,p),D=o.indexOf(n,p);break}if(ae=se(D),o.substring(O+1+ae,O+1+ae+b)===n){if(E.push(o.substring(p,O).replace(ie,d)),le(O+1+ae+b),re=o.indexOf(t,p),O=o.indexOf(d,p),C&&(de(),h))return ue();if(a&&w.length>=a)return ue(!0);break}T.push({type:`Quotes`,code:`InvalidQuotes`,message:`Trailing quote on quoted field is malformed`,row:w.length,index:p}),O++}}else if(r&&E.length===0&&o.substring(p,p+S)===r){if(D===-1)return ue();p=D+b,D=o.indexOf(n,p),re=o.indexOf(t,p)}else if(re!==-1&&(re<D||D===-1))E.push(o.substring(p,re)),p=re+y,re=o.indexOf(t,p);else{if(D===-1)break;if(E.push(o.substring(p,D)),le(D+b),C&&(de(),h))return ue();if(a&&w.length>=a)return ue(!0)}return ce();function oe(e){w.push(e),ee=p}function se(e){var t=0;return t=e!==-1&&(e=o.substring(O+1,e))&&e.trim()===``?e.length:t}function ce(e){return _||(e===void 0&&(e=o.substring(p)),E.push(e),p=v,oe(E),C&&de()),ue()}function le(e){p=e,oe(E),E=[],D=o.indexOf(n,p)}function ue(r){if(e.header&&!g&&w.length&&!u){var i=w[0],a=Object.create(null),o=new Set(i);let t=!1;for(let n=0;n<i.length;n++){let r=s(i[n]);if(a[r=x(e.transformHeader)?e.transformHeader(r,n):r]){let e,s=a[r];for(;e=r+`_`+s,s++,o.has(e););o.add(e),i[n]=e,a[r]++,t=!0,(l=l===null?{}:l)[e]=r}else a[r]=1,i[n]=r;o.add(r)}t&&console.warn(`Duplicate headers found and renamed.`),u=!0}return{data:w,errors:T,meta:{delimiter:t,linebreak:n,aborted:h,truncated:!!r,cursor:ee+(g||0),renamedHeaders:l}}}function de(){i(ue()),w=[],T=[]}},this.abort=function(){h=!0},this.getCharIndex=function(){return p}}function g(e){var t=e.data,n=i[t.workerId],r=!1;if(t.error)n.userError(t.error,t.file);else if(t.results&&t.results.data){var a={abort:function(){r=!0,_(t.workerId,{data:[],errors:[],meta:{aborted:!0}})},pause:v,resume:v};if(x(n.userStep)){for(var o=0;o<t.results.data.length&&(n.userStep({data:t.results.data[o],errors:t.results.errors,meta:t.results.meta},a),!r);o++);delete t.results}else x(n.userChunk)&&(n.userChunk(t.results,a,t.file),delete t.results)}t.finished&&!r&&_(t.workerId,t.results)}function _(e,t){var n=i[e];x(n.userComplete)&&n.userComplete(t),n.terminate(),delete i[e]}function v(){throw Error(`Not implemented.`)}function y(e){if(typeof e!=`object`||!e)return e;var t,n=Array.isArray(e)?[]:{};for(t in e)n[t]=y(e[t]);return n}function b(e,t){return function(){e.apply(t,arguments)}}function x(e){return typeof e==`function`}return o.parse=function(n,r){var c=(r||={}).dynamicTyping||!1;if(x(c)&&(r.dynamicTypingFunction=c,c={}),r.dynamicTyping=c,r.transform=!!x(r.transform)&&r.transform,r.downloadTimeout!==void 0){var c=parseInt(r.downloadTimeout);if(isNaN(c))throw Error(`Config downloadTimeout value (`+r.downloadTimeout+`) not parsable by parseInt(val).`);r.downloadTimeout=c}if(!r.worker||!o.WORKERS_SUPPORTED)return c=null,o.NODE_STREAM_INPUT,typeof n==`string`?(n=s(n),c=new(r.download?l:d)(r)):!0===n.readable&&x(n.read)&&x(n.on)?c=new f(r):(t.File&&n instanceof File||n instanceof Object)&&(c=new u(r)),c.stream(n);(c=(()=>{var n;return!!o.WORKERS_SUPPORTED&&(n=(()=>{var n=t.URL||t.webkitURL||null,r=e.toString();return o.BLOB_URL||=n.createObjectURL(new Blob([`var global = (function() { if (typeof self !== 'undefined') { return self; } if (typeof window !== 'undefined') { return window; } if (typeof global !== 'undefined') { return global; } return {}; })(); global.IS_PAPA_WORKER=true; `,`(`,r,`)();`],{type:`text/javascript`}))})(),(n=new t.Worker(n)).onmessage=g,n.id=a++,i[n.id]=n)})()).userStep=r.step,c.userChunk=r.chunk,c.userComplete=r.complete,c.userError=r.error,r.step=x(r.step),r.chunk=x(r.chunk),r.complete=x(r.complete),r.error=x(r.error),delete r.worker,c.postMessage({input:n,config:r,workerId:c.id})},o.unparse=function(e,t){var n=!1,r=!0,i=`,`,a=`\r
`,s=`"`,c=s+s,l=!1,u=null,d=!1,f=((()=>{if(typeof t==`object`){if(typeof t.delimiter!=`string`||o.BAD_DELIMITERS.filter(function(e){return t.delimiter.indexOf(e)!==-1}).length||(i=t.delimiter),typeof t.quotes!=`boolean`&&typeof t.quotes!=`function`&&!Array.isArray(t.quotes)||(n=t.quotes),typeof t.skipEmptyLines!=`boolean`&&typeof t.skipEmptyLines!=`string`||(l=t.skipEmptyLines),typeof t.newline==`string`&&(a=t.newline),typeof t.quoteChar==`string`&&(s=t.quoteChar,c=s+s),typeof t.header==`boolean`&&(r=t.header),Array.isArray(t.columns)){if(t.columns.length===0)throw Error(`Option columns is empty`);u=t.columns}t.escapeChar!==void 0&&(c=t.escapeChar+s),t.escapeFormulae instanceof RegExp?d=t.escapeFormulae:typeof t.escapeFormulae==`boolean`&&t.escapeFormulae&&(d=/^[=+\-@\t\r].*$/)}})(),new RegExp(m(s),`g`));if(typeof e==`string`&&(e=JSON.parse(e)),Array.isArray(e)){if(!e.length||Array.isArray(e[0]))return p(null,e,l);if(typeof e[0]==`object`)return p(u||Object.keys(e[0]),e,l)}else if(typeof e==`object`)return typeof e.data==`string`&&(e.data=JSON.parse(e.data)),Array.isArray(e.data)&&(e.fields||(e.fields=e.meta&&e.meta.fields||u),e.fields||(e.fields=Array.isArray(e.data[0])?e.fields:typeof e.data[0]==`object`?Object.keys(e.data[0]):[]),Array.isArray(e.data[0])||typeof e.data[0]==`object`||(e.data=[e.data])),p(e.fields||[],e.data||[],l);throw Error(`Unable to serialize unrecognized input`);function p(e,t,n){var o=``,s=(typeof e==`string`&&(e=JSON.parse(e)),typeof t==`string`&&(t=JSON.parse(t)),Array.isArray(e)&&0<e.length),c=!Array.isArray(t[0]);if(s&&r){for(var l=0;l<e.length;l++)0<l&&(o+=i),o+=h(e[l],l);0<t.length&&(o+=a)}for(var u=0;u<t.length;u++){var d=(s?e:t[u]).length,f=!1,p=s?Object.keys(t[u]).length===0:t[u].length===0;if(n&&!s&&(f=n===`greedy`?t[u].join(``).trim()===``:t[u].length===1&&t[u][0].length===0),n===`greedy`&&s){for(var m=[],g=0;g<d;g++){var _=c?e[g]:g;m.push(t[u][_])}f=m.join(``).trim()===``}if(!f){for(var v=0;v<d;v++){0<v&&!p&&(o+=i);var y=s&&c?e[v]:v;o+=h(t[u][y],v)}u<t.length-1&&(!n||0<d&&!p)&&(o+=a)}}return o}function h(e,t){var r,a,l;return e==null?``:e.constructor===Date?isNaN(e.getTime())?``:e.toISOString():(l=!1,d&&typeof e==`string`&&d.test(e)&&(e=`'`+e,l=!0),a=(r=e.toString()).replace(f,c),(l=l||!0===n||typeof n==`function`&&n(e,t)||Array.isArray(n)&&n[t]||((e,t)=>{for(var n=0;n<t.length;n++)if(-1<e.indexOf(t[n]))return!0;return!1})(a,o.BAD_DELIMITERS)||-1<a.indexOf(i)||-1<r.indexOf(s)||a.charAt(0)===` `||a.charAt(a.length-1)===` `)?s+a+s:a)}},o.RECORD_SEP=``,o.UNIT_SEP=``,o.BYTE_ORDER_MARK=`﻿`,o.BAD_DELIMITERS=[`\r`,`
`,`"`,o.BYTE_ORDER_MARK],o.WORKERS_SUPPORTED=!n&&!!t.Worker,o.NODE_STREAM_INPUT=1,o.LocalChunkSize=10485760,o.RemoteChunkSize=5242880,o.DefaultDelimiter=`,`,o.Parser=h,o.ParserHandle=p,o.NetworkStreamer=l,o.FileStreamer=u,o.StringStreamer=d,o.ReadableStreamStreamer=f,r&&(t.onmessage=function(e){e=e.data,o.WORKER_ID===void 0&&e&&(o.WORKER_ID=e.workerId),typeof e.input==`string`?t.postMessage({workerId:o.WORKER_ID,results:o.parse(e.input,e.config),finished:!0}):(t.File&&e.input instanceof File||e.input instanceof Object)&&(e=o.parse(e.input,e.config))&&t.postMessage({workerId:o.WORKER_ID,results:e,finished:!0})}),(l.prototype=Object.create(c.prototype)).constructor=l,(u.prototype=Object.create(c.prototype)).constructor=u,(d.prototype=Object.create(d.prototype)).constructor=d,(f.prototype=Object.create(c.prototype)).constructor=f,o})}))(),1),_s=[`職員番号`,`氏名`,`フリガナ`,`所属`,`役職`,`メールアドレス`],vs=[`所属`,`その他`,`場所`,`役職`,`内線番号`,`外線番号`,`FAX番号`,`備考`];function ys(e){let t=e.trim();return t?gs.default.parse(t,{header:!0,skipEmptyLines:!0,transformHeader:e=>e.trim()}).data:[]}function bs(e){return e?.trim()??``}function xs(e){let t=bs(e);return t?t.split(/[,;\s]+/).map(e=>e.trim()).filter(e=>e.length>0):[]}function Ss(e){return ys(e).map(e=>({staffId:bs(e.職員番号),name:bs(e.氏名),furigana:bs(e.フリガナ??e.ふりがな),department:bs(e.所属),title:bs(e.役職),emails:xs(e.メールアドレス)}))}function Cs(e){return ys(e).map(e=>({department:bs(e.所属),extra:bs(e.その他),location:bs(e.場所),title:bs(e.役職),extensionNumber:bs(e.内線番号),phoneNumber:bs(e.外線番号),faxNumber:bs(e.FAX番号),notes:bs(e.備考)}))}function ws(e){let t=e.map(e=>[e.staffId,e.name,e.furigana??``,e.department,e.title,e.emails.join(`, `)]);return gs.default.unparse({fields:[..._s],data:t})}function Ts(e){let t=e.map(e=>[e.department,e.extra,e.location,e.title,e.extensionNumber,e.phoneNumber,e.faxNumber,e.notes]);return gs.default.unparse({fields:[...vs],data:t})}function Es(e){let t=e.trim();return t.length===0?``:t.length<5?t.padStart(5,`0`):t.length>5?t.slice(-5):t}function Ds(e){let t=e.staffId.trim();return t.length>0?`staff:${t}`:`staff:${e.name.trim()}::${e.department.trim()}`}function Os(e){return`org:${e.department.trim()}::${e.title.trim()}`}function ks(e){return e.toLowerCase().replace(/[\u30a1-\u30f6]/g,e=>String.fromCharCode(e.charCodeAt(0)-96))}function As(e){return ks(e).trim().split(/\s+/).filter(e=>e.length>0)}function js(e,t){if(t.length===0)return!0;let n=ks(e.join(` `));return t.every(e=>n.includes(e))}function Ms(e,t){let n=As(t);return n.length===0?e:e.filter(e=>js([e.staffId,Es(e.staffId),e.name,e.furigana??``,e.department,e.title,...e.emails],n))}function Ns(e,t){let n=As(t);return n.length===0?e:e.filter(e=>js([e.department,e.extra,e.location,e.title,e.extensionNumber,e.phoneNumber,e.faxNumber,e.notes],n))}function Ps(e){let t=e.trim();return t.length===0?[]:t.split(/[,;\s]+/).map(e=>e.trim()).filter(e=>e.length>0)}function Fs(e){return{staffId:e.staffId.trim(),name:e.name.trim(),furigana:(e.furigana??``).trim(),department:e.department.trim(),title:e.title.trim(),emails:e.emails.map(e=>e.trim()).filter(e=>e.length>0)}}function Is(e){return{department:e.department.trim(),extra:e.extra.trim(),location:e.location.trim(),title:e.title.trim(),extensionNumber:e.extensionNumber.trim(),phoneNumber:e.phoneNumber.trim(),faxNumber:e.faxNumber.trim(),notes:e.notes.trim()}}function Ls(e){let t=Fs(e),n=[];return t.name.length===0&&n.push(`氏名は必須です。`),n}function Rs(e){let t=Is(e),n=[];return t.department.length===0&&n.push(`所属は必須です。`),n}var zs=[239,187,191];function Bs(e){return e.length>=3&&e[0]===zs[0]&&e[1]===zs[1]&&e[2]===zs[2]}function Vs(e){if(Bs(e))return{text:new TextDecoder(`utf-8`,{fatal:!0}).decode(e.subarray(3)),encoding:`utf-8`};try{return{text:new TextDecoder(`utf-8`,{fatal:!0}).decode(e),encoding:`utf-8`}}catch{return{text:new TextDecoder(`shift_jis`).decode(e),encoding:`shift_jis`}}}function Hs(e){let t=new TextEncoder().encode(e),n=new Uint8Array(zs.length+t.length);return n.set(zs,0),n.set(t,zs.length),n}function Us(e){return typeof e==`object`&&!!e&&!Array.isArray(e)}function Ws(e,t){let n=e[t];return typeof n==`string`?n.trim():``}function Gs(e){let t=e.emails;return Array.isArray(t)?t.filter(e=>typeof e==`string`).map(e=>e.trim()).filter(e=>e.length>0):[]}function Ks(e){return{staffId:e.staffId.trim(),name:e.name.trim(),furigana:(e.furigana??``).trim(),department:e.department.trim(),title:e.title.trim(),emails:e.emails.map(e=>e.trim()).filter(e=>e.length>0)}}function qs(e){return{department:e.department.trim(),extra:e.extra.trim(),location:e.location.trim(),title:e.title.trim(),extensionNumber:e.extensionNumber.trim(),phoneNumber:e.phoneNumber.trim(),faxNumber:e.faxNumber.trim(),notes:e.notes.trim()}}function Js(e,t){if(!Us(e))throw Error(`staff[${t}] の形式が不正です。`);return{staffId:Ws(e,`staffId`),name:Ws(e,`name`),furigana:Ws(e,`furigana`),department:Ws(e,`department`),title:Ws(e,`title`),emails:Gs(e)}}function Ys(e,t){if(!Us(e))throw Error(`organizations[${t}] の形式が不正です。`);return{department:Ws(e,`department`),extra:Ws(e,`extra`),location:Ws(e,`location`),title:Ws(e,`title`),extensionNumber:Ws(e,`extensionNumber`),phoneNumber:Ws(e,`phoneNumber`),faxNumber:Ws(e,`faxNumber`),notes:Ws(e,`notes`)}}function Xs(e,t,n=new Date().toISOString()){let r={version:1,exportedAt:n,staff:e.map(Ks),organizations:t.map(qs)};return JSON.stringify(r,null,2)}function Zs(e){let t;try{t=JSON.parse(e)}catch{throw Error(`JSON の構文が不正です。`)}if(!Us(t))throw Error(`JSON のルートはオブジェクトである必要があります。`);if(!Array.isArray(t.staff)||!Array.isArray(t.organizations))throw Error(`JSON には staff および organizations の配列が含まれている必要があります。`);return{staff:t.staff.map(Js),organizations:t.organizations.map(Ys)}}function Qs(e,t,n){let r=Vs(t),i=Ss(r.text);if(i.length===0)throw Error(`職員 CSV にインポート可能なレコードが含まれていません。`);return{kind:`staff-csv`,fileName:e,encoding:r.encoding,staffRecords:i,staffCount:i.length,organizationCount:0,currentStaffCount:n.staff,currentOrganizationCount:n.organizations}}function $s(e,t,n){let r=Vs(t),i=Cs(r.text);if(i.length===0)throw Error(`組織 CSV にインポート可能なレコードが含まれていません。`);return{kind:`org-csv`,fileName:e,encoding:r.encoding,organizationRecords:i,staffCount:0,organizationCount:i.length,currentStaffCount:n.staff,currentOrganizationCount:n.organizations}}function ec(e,t,n){let r=Zs(new TextDecoder(`utf-8`,{fatal:!0}).decode(t));return{kind:`json`,fileName:e,staffRecords:r.staff,organizationRecords:r.organizations,staffCount:r.staff.length,organizationCount:r.organizations.length,currentStaffCount:n.staff,currentOrganizationCount:n.organizations}}function tc(e,t,n,r){return n===`staff-csv`?Qs(e,t,r):n===`org-csv`?$s(e,t,r):ec(e,t,r)}var nc=class{constructor(e,t={}){this.handleSystemThemeChange=()=>{this.themeMode===`system`&&ps(`system`)},this.staff=[],this.organizations=[],this.activeTab=`staff`,this.lastDirectoryTab=`staff`,this.staffSearchQuery=``,this.organizationSearchQuery=``,this.expandedStaffKeys=new Set,this.toastMessage=null,this.themeMode=`system`,this.pendingImport=null,this.isLoading=!1,this.host=e,this.deps=t,this.host.addController(this)}hostConnected(){this.attachThemeListener(),this.loadInitialData()}hostDisconnected(){this.toastTimerId!==void 0&&clearTimeout(this.toastTimerId),this.mediaQuery?.removeEventListener(`change`,this.handleSystemThemeChange)}attachThemeListener(){globalThis.window!==void 0&&typeof globalThis.window.matchMedia==`function`&&(this.mediaQuery=globalThis.window.matchMedia(`(prefers-color-scheme: dark)`),this.mediaQuery.addEventListener(`change`,this.handleSystemThemeChange))}async loadInitialData(){this.isLoading=!0,this.host.requestUpdate();try{let[e,t,n]=await Promise.all([as.getAllStaff(),as.getAllOrganizations(),ls(this.deps.storage)]);this.staff=e,this.organizations=t,this.themeMode=n,ps(n)}finally{this.isLoading=!1,this.host.requestUpdate()}}async reloadRecords(){let[e,t]=await Promise.all([as.getAllStaff(),as.getAllOrganizations()]);this.staff=e,this.organizations=t,this.host.requestUpdate()}get filteredStaff(){return Ms(this.staff,this.staffSearchQuery)}get filteredOrganizations(){return Ns(this.organizations,this.organizationSearchQuery)}setActiveTab(e){e!==`settings`&&(this.lastDirectoryTab=e),this.activeTab=e,this.host.requestUpdate()}toggleSettingsTab(){this.activeTab===`settings`?this.activeTab=this.lastDirectoryTab:(this.lastDirectoryTab=this.activeTab,this.activeTab=`settings`),this.host.requestUpdate()}setStaffSearchQuery(e){this.staffSearchQuery=e,this.host.requestUpdate()}setOrganizationSearchQuery(e){this.organizationSearchQuery=e,this.host.requestUpdate()}isStaffEmailsExpanded(e){return this.expandedStaffKeys.has(Ds(e))}toggleStaffEmails(e){let t=Ds(e);this.expandedStaffKeys.has(t)?this.expandedStaffKeys.delete(t):this.expandedStaffKeys.add(t),this.host.requestUpdate()}async saveStaff(e,t){let n=Ls(e);if(n.length>0)throw Error(n.join(` `));let r=Fs(e);typeof t==`number`?(await as.updateStaff(t,r),this.showToast(`職員「${r.name}」を更新しました`)):(await as.addStaff(r),this.showToast(`職員「${r.name}」を追加しました`)),await this.reloadRecords()}async removeStaff(e){await as.deleteStaff(e),await this.reloadRecords(),this.showToast(`職員レコードを削除しました`)}async saveOrganization(e,t){let n=Rs(e);if(n.length>0)throw Error(n.join(` `));let r=Is(e);typeof t==`number`?(await as.updateOrganization(t,r),this.showToast(`組織「${r.department}」を更新しました`)):(await as.addOrganization(r),this.showToast(`組織「${r.department}」を追加しました`)),await this.reloadRecords()}async removeOrganization(e){await as.deleteOrganization(e),await this.reloadRecords(),this.showToast(`組織レコードを削除しました`)}prepareImport(e,t,n){this.pendingImport=tc(t,n,e,{staff:this.staff.length,organizations:this.organizations.length}),this.host.requestUpdate()}cancelImport(){this.pendingImport=null,this.host.requestUpdate()}async confirmImport(){let e=this.pendingImport;e&&(e.kind===`staff-csv`&&e.staffRecords?(await as.bulkReplaceStaff(e.staffRecords),this.showToast(`職員データを ${e.staffCount} 件インポートしました`)):e.kind===`org-csv`&&e.organizationRecords?(await as.bulkReplaceOrganizations(e.organizationRecords),this.showToast(`組織データを ${e.organizationCount} 件インポートしました`)):e.kind===`json`&&(await as.bulkReplaceAll(e.staffRecords??[],e.organizationRecords??[]),this.showToast(`JSON（職員 ${e.staffCount} 件・組織 ${e.organizationCount} 件）をインポートしました`)),this.pendingImport=null,await this.reloadRecords())}exportStaffCsvBytes(){return{filename:`hubaddress-staff.csv`,bytes:Hs(ws(this.staff))}}exportOrganizationCsvBytes(){return{filename:`hubaddress-organizations.csv`,bytes:Hs(Ts(this.organizations))}}exportDirectoryJsonText(){return{filename:`hubaddress-directory.json`,text:Xs(this.staff,this.organizations)}}async clearAllDirectoryData(){await as.clearAll(),await this.reloadRecords(),this.showToast(`すべての職員・組織データを削除しました`)}async setThemeMode(e){this.themeMode=e,ps(e),this.host.requestUpdate(),await us(e,this.deps.storage)}jumpToOrganization(e){let t=e.trim();t.length!==0&&(this.lastDirectoryTab=`organizations`,this.activeTab=`organizations`,this.organizationSearchQuery=t,this.host.requestUpdate())}async copyField(e,t){let n=await hs(t,this.deps.clipboard);return n?this.showToast(`${e}をコピーしました: ${t.trim()}`):this.showToast(`${e}のコピーに失敗しました`),n}showToast(e){this.toastMessage=e,this.toastTimerId!==void 0&&clearTimeout(this.toastTimerId),this.toastTimerId=setTimeout(()=>{this.toastMessage=null,this.host.requestUpdate()},2600),this.host.requestUpdate()}};function rc(e,t,n,r,i){return r.trim().length===0?M:j`
    <button
      id=${e}
      type="button"
      class="directory-card__copy-btn"
      aria-label=${`${n} ${r} をコピー`}
      @click=${()=>i(n,r)}
    >
      <wa-icon name=${t}></wa-icon>
      <span class="directory-card__copy-value">${r}</span>
    </button>
    <wa-tooltip for=${e} trigger="hover">${n}をコピー</wa-tooltip>
  `}function ic(e,t,n,r){return j`
    <button
      id=${e}
      type="button"
      class="directory-card__action-btn"
      aria-label=${n}
      @click=${r}
    >
      <wa-icon name=${t}></wa-icon>
    </button>
    <wa-tooltip for=${e} trigger="hover">${n}</wa-tooltip>
  `}function ac(e,t,n){return!t&&!n?M:j`
    <div class="directory-card__actions">
      ${t?ic(`${e}-edit`,`pen-to-square-solid-full`,`編集`,t):M}
      ${n?ic(`${e}-delete`,`trash-solid-full`,`削除`,n):M}
    </div>
  `}function oc(e,t,n){if(e.emails.length===0)return M;let r=`staff-mail-toggle-${t}`,i=n.isEmailsExpanded?`メールを隠す`:`メールを表示 (${e.emails.length})`;return j`
    <div>
      <button
        id=${r}
        type="button"
        class="directory-card__toggle-btn"
        aria-label=${i}
        aria-expanded=${String(n.isEmailsExpanded)}
        @click=${()=>n.onToggleEmails(e)}
      >
        <wa-icon name="envelope-solid-full"></wa-icon>
        <wa-icon
          name=${n.isEmailsExpanded?`angle-up-solid-full`:`angle-down-solid-full`}
        ></wa-icon>
      </button>
      <wa-tooltip for=${r} trigger="hover">${i}</wa-tooltip>
    </div>
  `}function sc(e,t,n){let r=e.department.trim().length>0;if(!r&&e.emails.length===0)return M;let i=`staff-dept-${t}`;return j`
    <div class="directory-card__meta-row">
      ${r?j`
              <div>
                <button
                  id=${i}
                  type="button"
                  class="directory-card__dept-btn"
                  @click=${()=>n.onJumpToDepartment(e.department)}
                >
                  <wa-icon name="building-solid-full"></wa-icon>
                  <span>${e.department}</span>
                </button>
                <wa-tooltip for=${i} trigger="hover">
                  組織を検索
                </wa-tooltip>
              </div>
            `:j`<span></span>`}
      ${oc(e,t,n)}
    </div>
  `}function cc(e,t,n,r){return!n||e.length===0?M:j`
    <div class="directory-card__contacts">
      ${e.map((e,n)=>rc(`staff-email-${t}-${n}`,`envelope-solid-full`,`メール`,e,r))}
    </div>
  `}function lc(e,t,n){return j`
    <div class="directory-card__contacts">
      ${rc(`org-ext-${t}`,`hashtag-solid-full`,`内線`,e.extensionNumber,n)}
      ${rc(`org-tel-${t}`,`phone-solid-full`,`外線`,e.phoneNumber,n)}
      ${rc(`org-fax-${t}`,`fax-solid-full`,`FAX`,e.faxNumber,n)}
    </div>
  `}function uc(e,t,n){if(!e)return M;let r=`staff-id-${t}`;return j`
    <button
      id=${r}
      type="button"
      class="directory-card__inline-copy-btn"
      aria-label=${`職員番号 ${e} をコピー`}
      @click=${()=>n(`職員番号`,e)}
    >
      <wa-badge class="directory-card__staff-id" variant="neutral"
        >${e}</wa-badge
      >
    </button>
    <wa-tooltip for=${r} trigger="hover">
      職員番号をコピー
    </wa-tooltip>
  `}function dc(e,t,n){if(!e)return j`<h3 class="directory-card__name">（氏名未設定）</h3>`;let r=`staff-name-${t}`;return j`
    <h3 class="directory-card__name">
      <button
        id=${r}
        type="button"
        class="directory-card__name-copy-btn"
        @click=${()=>n(`氏名`,e)}
      >
        ${e}
      </button>
      <wa-tooltip for=${r} trigger="hover">氏名をコピー</wa-tooltip>
    </h3>
  `}function fc(e,t,n){let r=e.name.trim(),i=(e.furigana??``).trim();return j`
    <div class="directory-card__name-stack">
      ${i?j`<span class="directory-card__furigana"
              >${i}</span
            >`:M}
      <div class="directory-card__name-row">
        ${dc(r,t,n)}
        ${e.title?j`<span class="directory-card__sub">${e.title}</span>`:M}
      </div>
    </div>
  `}function pc(e,t,n){let r=`${Ds(e).replace(/[^a-zA-Z0-9_-]/g,`_`)}-${t}`,i=Es(e.staffId),a=n.onEdit?()=>n.onEdit?.(e):void 0,o=n.onDelete?()=>n.onDelete?.(e):void 0;return j`
    <article class="directory-card">
      <div class="directory-card__header">
        <div
          class="directory-card__title-group directory-card__title-group--staff"
        >
          ${uc(i,r,n.onCopy)}
          ${fc(e,r,n.onCopy)}
        </div>
        ${ac(`staff-${r}`,a,o)}
      </div>
      ${sc(e,r,n)}
      ${cc(e.emails,r,n.isEmailsExpanded,n.onCopy)}
    </article>
  `}function mc(e,t,n){let r=e.trim();if(!r)return j`<h3 class="directory-card__name">（所属未設定）</h3>`;let i=`org-name-${t}`;return j`
    <h3 class="directory-card__name">
      <button
        id=${i}
        type="button"
        class="directory-card__name-copy-btn"
        @click=${()=>n(`組織名`,r)}
      >
        ${r}
      </button>
      <wa-tooltip for=${i} trigger="hover">
        組織名をコピー
      </wa-tooltip>
    </h3>
  `}function hc(e,t,n){let r=n.onEdit?()=>n.onEdit?.(e):void 0,i=n.onDelete?()=>n.onDelete?.(e):void 0;return j`
    <div class="directory-card__header">
      <div class="directory-card__title-group">
        ${mc(e.department,t,n.onCopy)}
        ${e.title?j`<wa-tag size="s">${e.title}</wa-tag>`:M}
      </div>
      ${ac(`org-${t}`,r,i)}
    </div>
  `}function gc(e,t,n){let r=Os(e),i=`${r.replace(/[^a-zA-Z0-9_-]/g,`_`)}-${t}`,a=[e.extra,e.location].filter(Boolean).join(` / `);return j`
    <article class="directory-card" data-org-key=${r}>
      ${hc(e,i,n)}
      ${lc(e,i,n.onCopy)}
      ${a?j`
              <div class="directory-card__place">
                <wa-icon name="location-dot-solid-full"></wa-icon>
                <span>${a}</span>
              </div>
            `:M}
      ${e.notes?j`<p class="directory-card__notes">${e.notes}</p>`:M}
    </article>
  `}var _c=[{value:`light`,id:`theme-btn-light`,label:`ライト`,icon:`sun-solid-full`},{value:`dark`,id:`theme-btn-dark`,label:`ダーク`,icon:`moon-solid-full`},{value:`system`,id:`theme-btn-system`,label:`システム`,icon:`display-solid-full`}];function vc(e,t,n){let r=t===e.value;return j`
    <wa-button
      id=${e.id}
      size="s"
      variant="neutral"
      appearance=${r?`filled`:`plain`}
      aria-label=${e.label}
      aria-pressed=${r?`true`:`false`}
      @click=${()=>n(e.value)}
    >
      <wa-icon name=${e.icon}></wa-icon>
    </wa-button>
  `}function yc(e,t){return j`
    <section class="settings-view__section">
      <div class="settings-view__theme-row">
        <h2 class="settings-view__heading">カラーテーマ</h2>
        <wa-button-group label="テーマ切り替え">
          ${_c.map(n=>vc(n,e,t))}
        </wa-button-group>
      </div>
      ${_c.map(e=>j`
          <wa-tooltip for=${e.id} trigger="hover">
            ${e.label}
          </wa-tooltip>
        `)}
    </section>
  `}function bc(e){return j`
    <div class="settings-view__btn-grid">
      <wa-button
        size="s"
        variant="neutral"
        appearance="outlined"
        @click=${()=>e(`staff-csv`)}
      >
        <wa-icon slot="start" name="upload-solid-full"></wa-icon>
        職員 CSV をインポート
      </wa-button>
      <wa-button
        size="s"
        variant="neutral"
        appearance="outlined"
        @click=${()=>e(`org-csv`)}
      >
        <wa-icon slot="start" name="upload-solid-full"></wa-icon>
        組織 CSV をインポート
      </wa-button>
      <wa-button
        size="s"
        variant="brand"
        appearance="outlined"
        @click=${()=>e(`json`)}
      >
        <wa-icon slot="start" name="upload-solid-full"></wa-icon>
        一括 JSON をインポート
      </wa-button>
    </div>
  `}function xc(e){return j`
    <div class="settings-view__btn-grid">
      <wa-button
        size="s"
        variant="neutral"
        appearance="outlined"
        @click=${e.onExportStaffCsv}
      >
        <wa-icon slot="start" name="download-solid-full"></wa-icon>
        職員 CSV をエクスポート（BOM付 UTF-8）
      </wa-button>
      <wa-button
        size="s"
        variant="neutral"
        appearance="outlined"
        @click=${e.onExportOrgCsv}
      >
        <wa-icon slot="start" name="download-solid-full"></wa-icon>
        組織 CSV をエクスポート（BOM付 UTF-8）
      </wa-button>
      <wa-button
        size="s"
        variant="neutral"
        appearance="outlined"
        @click=${e.onExportJson}
      >
        <wa-icon slot="start" name="download-solid-full"></wa-icon>
        一括 JSON をエクスポート
      </wa-button>
      <wa-button
        size="s"
        variant="danger"
        appearance="outlined"
        @click=${e.onRequestClearAll}
      >
        <wa-icon slot="start" name="trash-solid-full"></wa-icon>
        すべての登録データを削除
      </wa-button>
    </div>
  `}function Sc(e){return j`
    <section class="settings-view__section">
      <h2 class="settings-view__heading">データ管理（CSV / JSON）</h2>
      <div class="settings-view__stats">
        <wa-tag size="s">職員: ${e.staffCount} 件</wa-tag>
        <wa-tag size="s">組織: ${e.organizationCount} 件</wa-tag>
      </div>
      <p class="settings-view__description">
        CSV（UTF-8 / Shift_JIS 自動判別）または一括 JSON
        からインポート（確認後に全件洗い替え）できます。
      </p>
      ${bc(e.onRequestImport)}
      <wa-divider></wa-divider>
      ${xc(e)}
    </section>
  `}function Cc(){return j`
    <section class="settings-view__section">
      <h2 class="settings-view__heading">キーボードショートカット</h2>
      <p class="settings-view__description">
        既定のショートカット
        <span class="settings-view__shortcut-code">Alt+Shift+H</span>
        でどのタブからでも HubAddress サイドパネルを開閉できます。
      </p>
      <p class="settings-view__description">
        キー変更や未割り当て時の確認は
        Chrome（chrome://extensions/shortcuts）または
        Edge（edge://extensions/shortcuts）から設定できます。
      </p>
    </section>
  `}function wc(e){return j`
    <div class="settings-view">
      ${yc(e.themeMode,e.onChangeTheme)}
      ${Sc(e)} ${Cc()}
    </div>
  `}function Tc(e){return{editingId:e?.id,staffId:e?.staffId??``,name:e?.name??``,furigana:e?.furigana??``,department:e?.department??``,title:e?.title??``,emailsText:e?e.emails.join(`, `):``,error:null}}function Ec(e){return{editingId:e?.id,department:e?.department??``,extra:e?.extra??``,location:e?.location??``,title:e?.title??``,extensionNumber:e?.extensionNumber??``,phoneNumber:e?.phoneNumber??``,faxNumber:e?.faxNumber??``,notes:e?.notes??``,error:null}}function Dc(e){return e.target.value??``}function Oc(e,t){return j`
    <wa-input
      label="氏名 *"
      size="s"
      .value=${e.name}
      @input=${e=>t({name:Dc(e),error:null})}
    ></wa-input>
    <wa-input
      label="フリガナ"
      size="s"
      .value=${e.furigana}
      @input=${e=>t({furigana:Dc(e)})}
    ></wa-input>
    <wa-input
      label="職員番号"
      size="s"
      .value=${e.staffId}
      @input=${e=>t({staffId:Dc(e)})}
    ></wa-input>
    <wa-input
      label="所属"
      size="s"
      .value=${e.department}
      @input=${e=>t({department:Dc(e)})}
    ></wa-input>
    <wa-input
      label="役職"
      size="s"
      .value=${e.title}
      @input=${e=>t({title:Dc(e)})}
    ></wa-input>
    <wa-textarea
      label="メールアドレス（カンマ区切りで複数入力可）"
      size="s"
      rows="2"
      .value=${e.emailsText}
      @input=${e=>t({emailsText:Dc(e)})}
    ></wa-textarea>
  `}function kc(e){let t=e.staffForm;return t?j`
    <wa-dialog
      label=${typeof t.editingId==`number`?`職員情報を編集`:`職員を追加`}
      open
      @wa-after-hide=${e.onCloseStaffForm}
    >
      <div class="editor-dialog__form">
        ${Oc(t,e.onUpdateStaffForm)}
        ${t.error?j`<p class="editor-dialog__error">${t.error}</p>`:M}
      </div>
      <div slot="footer" class="editor-dialog__footer">
        <wa-button size="s" @click=${e.onCloseStaffForm}>
          キャンセル
        </wa-button>
        <wa-button size="s" variant="brand" @click=${e.onSaveStaffForm}>
          保存
        </wa-button>
      </div>
    </wa-dialog>
  `:M}function Ac(e,t){return j`
    <wa-input
      label="所属 *"
      size="s"
      .value=${e.department}
      @input=${e=>t({department:Dc(e),error:null})}
    ></wa-input>
    <wa-input
      label="その他（建物・階など）"
      size="s"
      .value=${e.extra}
      @input=${e=>t({extra:Dc(e)})}
    ></wa-input>
    <wa-input
      label="場所"
      size="s"
      .value=${e.location}
      @input=${e=>t({location:Dc(e)})}
    ></wa-input>
    <wa-input
      label="役職・席"
      size="s"
      .value=${e.title}
      @input=${e=>t({title:Dc(e)})}
    ></wa-input>
  `}function jc(e,t){return j`
    <wa-input
      label="内線番号"
      size="s"
      .value=${e.extensionNumber}
      @input=${e=>t({extensionNumber:Dc(e)})}
    ></wa-input>
    <wa-input
      label="外線番号"
      size="s"
      .value=${e.phoneNumber}
      @input=${e=>t({phoneNumber:Dc(e)})}
    ></wa-input>
    <wa-input
      label="FAX番号"
      size="s"
      .value=${e.faxNumber}
      @input=${e=>t({faxNumber:Dc(e)})}
    ></wa-input>
    <wa-textarea
      label="備考"
      size="s"
      rows="2"
      .value=${e.notes}
      @input=${e=>t({notes:Dc(e)})}
    ></wa-textarea>
  `}function Mc(e,t){return j`
    ${Ac(e,t)}
    ${jc(e,t)}
  `}function Nc(e){let t=e.orgForm;return t?j`
    <wa-dialog label=${typeof t.editingId==`number`?`組織情報を編集`:`組織を追加`} open @wa-after-hide=${e.onCloseOrgForm}>
      <div class="editor-dialog__form">
        ${Mc(t,e.onUpdateOrgForm)}
        ${t.error?j`<p class="editor-dialog__error">${t.error}</p>`:M}
      </div>
      <div slot="footer" class="editor-dialog__footer">
        <wa-button size="s" @click=${e.onCloseOrgForm}>
          キャンセル
        </wa-button>
        <wa-button size="s" variant="brand" @click=${e.onSaveOrgForm}>
          保存
        </wa-button>
      </div>
    </wa-dialog>
  `:M}function Pc(e){let t=e.deleteTarget;return t?j`
    <wa-dialog label="削除の確認" open @wa-after-hide=${e.onCancelDelete}>
      <p class="editor-dialog__summary">
        「${t.label}」を削除しますか？この操作は元に戻せません。
      </p>
      <div slot="footer" class="editor-dialog__footer">
        <wa-button size="s" @click=${e.onCancelDelete}>
          キャンセル
        </wa-button>
        <wa-button size="s" variant="danger" @click=${e.onConfirmDelete}>
          削除する
        </wa-button>
      </div>
    </wa-dialog>
  `:M}function Fc(e){return j`
    <div class="editor-dialog__form">
      <p class="editor-dialog__summary">
        ファイル「${e.fileName}」を取り込み、既存データを置き換えます。
      </p>
      ${e.encoding?j`<p class="editor-dialog__meta">
              判定文字コード: ${e.encoding.toUpperCase()}
            </p>`:M}
      ${e.kind===`org-csv`?M:j`<p class="editor-dialog__meta">
              職員データ: 現在 ${e.currentStaffCount} 件 → 取込後
              ${e.staffCount} 件
            </p>`}
      ${e.kind===`staff-csv`?M:j`<p class="editor-dialog__meta">
              組織データ: 現在 ${e.currentOrganizationCount} 件 → 取込後
              ${e.organizationCount} 件
            </p>`}
    </div>
  `}function Ic(e){let t=e.pendingImport;return t?j`
    <wa-dialog
      label="インポートの確認（全件洗い替え）"
      open
      @wa-after-hide=${e.onCancelImport}
    >
      ${Fc(t)}
      <div slot="footer" class="editor-dialog__footer">
        <wa-button size="s" @click=${e.onCancelImport}>
          キャンセル
        </wa-button>
        <wa-button size="s" variant="brand" @click=${e.onConfirmImport}>
          インポートを実行
        </wa-button>
      </div>
    </wa-dialog>
  `:M}function Lc(e){return e.isClearAllConfirmOpen?j`
    <wa-dialog
      label="全データ削除の確認"
      open
      @wa-after-hide=${e.onCancelClearAll}
    >
      <p class="editor-dialog__summary">
        登録されているすべての職員・組織データを削除しますか？この操作は元に戻せません。
      </p>
      <div slot="footer" class="editor-dialog__footer">
        <wa-button size="s" @click=${e.onCancelClearAll}>
          キャンセル
        </wa-button>
        <wa-button size="s" variant="danger" @click=${e.onConfirmClearAll}>
          すべて削除
        </wa-button>
      </div>
    </wa-dialog>
  `:M}function Rc(e){return j`
    ${kc(e)} ${Nc(e)}
    ${Pc(e)} ${Ic(e)}
    ${Lc(e)}
  `}function zc(e,t,n){let r=typeof t==`string`?t:new Uint8Array(t),i=new Blob([r],{type:n}),a=URL.createObjectURL(i),o=document.createElement(`a`);o.href=a,o.download=e,document.body.appendChild(o),o.click(),document.body.removeChild(o),URL.revokeObjectURL(a)}function Bc(e,t,n,r){var i=arguments.length,a=i<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,n):r,o;if(typeof Reflect==`object`&&typeof Reflect.decorate==`function`)a=Reflect.decorate(e,t,n,r);else for(var s=e.length-1;s>=0;s--)(o=e[s])&&(a=(i<3?o(a):i>3?o(t,n,a):o(t,n))||a);return i>3&&a&&Object.defineProperty(t,n,a),a}var Vc=class extends Be{constructor(...e){super(...e),this.controller=new nc(this),this.staffForm=null,this.orgForm=null,this.deleteTarget=null,this.isClearAllConfirmOpen=!1,this.pendingFileKind=`json`}static{this.styles=[m(Vo),m(Ho),m(Uo),m(Wo)]}renderTabButtons(){let{activeTab:e,filteredStaff:t,filteredOrganizations:n}=this.controller,r=t=>e===t?`brand`:`neutral`,i=t=>e===t?`filled`:`outlined`;return j`
      <nav class="hubaddress-shell__tabs" aria-label="表示切り替え">
        <wa-button
          class="hubaddress-shell__tab-btn hubaddress-shell__tab-btn--directory"
          size="s"
          variant=${r(`staff`)}
          appearance=${i(`staff`)}
          @click=${()=>this.controller.setActiveTab(`staff`)}
        >
          <wa-icon slot="start" name="user-solid-full"></wa-icon>
          職員 (${t.length})
        </wa-button>
        <wa-button
          class="hubaddress-shell__tab-btn hubaddress-shell__tab-btn--directory"
          size="s"
          variant=${r(`organizations`)}
          appearance=${i(`organizations`)}
          @click=${()=>this.controller.setActiveTab(`organizations`)}
        >
          <wa-icon slot="start" name="building-solid-full"></wa-icon>
          組織 (${n.length})
        </wa-button>
        <wa-button
          class="hubaddress-shell__tab-btn"
          size="s"
          variant=${r(`settings`)}
          appearance=${i(`settings`)}
          aria-pressed=${String(e===`settings`)}
          @click=${()=>this.controller.toggleSettingsTab()}
        >
          <wa-icon slot="start" name="gear-solid-full"></wa-icon>
          設定
        </wa-button>
      </nav>
    `}renderSearchInput(e,t,n){return j`
      <wa-input
        size="m"
        placeholder=${e}
        .value=${t}
        with-clear
        @input=${e=>{let t=e.target;n(t.value)}}
        @wa-clear=${()=>n(``)}
      >
        <wa-icon slot="start" name="magnifying-glass-solid-full"></wa-icon>
      </wa-input>
    `}openDeleteStaff(e){typeof e.id==`number`&&(this.deleteTarget={kind:`staff`,id:e.id,label:e.name||e.staffId||`職員`})}openDeleteOrganization(e){typeof e.id==`number`&&(this.deleteTarget={kind:`organization`,id:e.id,label:e.department||`組織`})}renderStaffColumn(){let e=this.controller.filteredStaff,t=this.controller.activeTab===`staff`;return j`
      <section class="hubaddress-shell__column" data-active=${String(t)}>
        <div class="hubaddress-shell__column-toolbar">
          <div class="hubaddress-shell__column-bar">
            <h2 class="hubaddress-shell__column-heading">
              職員一覧 (${e.length})
            </h2>
            <wa-button
              id="add-staff-btn"
              size="s"
              variant="brand"
              appearance="outlined"
              aria-label="職員を追加"
              @click=${()=>{this.staffForm=Tc()}}
            >
              <wa-icon name="plus-solid-full"></wa-icon>
            </wa-button>
            <wa-tooltip for="add-staff-btn" trigger="hover"
              >職員を追加</wa-tooltip
            >
          </div>
          ${this.renderSearchInput(`職員番号・氏名・所属・役職を検索...`,this.controller.staffSearchQuery,e=>this.controller.setStaffSearchQuery(e))}
        </div>
        ${this.renderStaffList(e)}
      </section>
    `}renderStaffList(e){return e.length===0?j`<p class="hubaddress-shell__empty">
        該当する職員データがありません。
      </p>`:j`
      <div class="directory-card-list">
        ${e.map((e,t)=>pc(e,t,{isEmailsExpanded:this.controller.isStaffEmailsExpanded(e),onToggleEmails:e=>this.controller.toggleStaffEmails(e),onJumpToDepartment:e=>this.controller.jumpToOrganization(e),onCopy:(e,t)=>void this.controller.copyField(e,t),onEdit:e=>{this.staffForm=Tc(e)},onDelete:e=>this.openDeleteStaff(e)}))}
      </div>
    `}renderOrganizationColumn(){let e=this.controller.filteredOrganizations,t=this.controller.activeTab===`organizations`;return j`
      <section class="hubaddress-shell__column" data-active=${String(t)}>
        <div class="hubaddress-shell__column-toolbar">
          <div class="hubaddress-shell__column-bar">
            <h2 class="hubaddress-shell__column-heading">
              組織一覧 (${e.length})
            </h2>
            <wa-button
              id="add-organization-btn"
              size="s"
              variant="brand"
              appearance="outlined"
              aria-label="組織を追加"
              @click=${()=>{this.orgForm=Ec()}}
            >
              <wa-icon name="plus-solid-full"></wa-icon>
            </wa-button>
            <wa-tooltip for="add-organization-btn" trigger="hover"
              >組織を追加</wa-tooltip
            >
          </div>
          ${this.renderSearchInput(`所属・内線・外線・場所・備考を検索...`,this.controller.organizationSearchQuery,e=>this.controller.setOrganizationSearchQuery(e))}
        </div>
        ${this.renderOrganizationList(e)}
      </section>
    `}renderOrganizationList(e){return e.length===0?j`<p class="hubaddress-shell__empty">
        該当する組織データがありません。
      </p>`:j`
      <div class="directory-card-list">
        ${e.map((e,t)=>gc(e,t,{onCopy:(e,t)=>void this.controller.copyField(e,t),onEdit:e=>{this.orgForm=Ec(e)},onDelete:e=>this.openDeleteOrganization(e)}))}
      </div>
    `}openFilePicker(e){this.pendingFileKind=e;let t=this.shadowRoot?.querySelector(`#hubaddress-file-input`);t&&(t.value=``,t.accept=e===`json`?`.json,application/json`:`.csv,text/csv`,t.click())}async handleFileSelected(e){let t=e.target.files?.[0];if(t)try{let e=await t.arrayBuffer();this.controller.prepareImport(this.pendingFileKind,t.name,new Uint8Array(e))}catch(e){let t=e instanceof Error?e.message:`読み込み失敗`;this.controller.showToast(`インポートエラー: ${t}`)}}async handleSaveStaffForm(){let e=this.staffForm;if(e)try{await this.controller.saveStaff({staffId:e.staffId,name:e.name,furigana:e.furigana,department:e.department,title:e.title,emails:Ps(e.emailsText)},e.editingId),this.staffForm=null}catch(t){this.staffForm={...e,error:t instanceof Error?t.message:`保存に失敗しました。`}}}async handleSaveOrgForm(){let e=this.orgForm;if(e)try{await this.controller.saveOrganization({department:e.department,extra:e.extra,location:e.location,title:e.title,extensionNumber:e.extensionNumber,phoneNumber:e.phoneNumber,faxNumber:e.faxNumber,notes:e.notes},e.editingId),this.orgForm=null}catch(t){this.orgForm={...e,error:t instanceof Error?t.message:`保存に失敗しました。`}}}async handleConfirmDelete(){let e=this.deleteTarget;e&&(this.deleteTarget=null,e.kind===`staff`?await this.controller.removeStaff(e.id):await this.controller.removeOrganization(e.id))}renderBody(){return this.controller.activeTab===`settings`?j`
        <main class="hubaddress-shell__body">
          ${wc({staffCount:this.controller.staff.length,organizationCount:this.controller.organizations.length,themeMode:this.controller.themeMode,onChangeTheme:e=>void this.controller.setThemeMode(e),onRequestImport:e=>this.openFilePicker(e),onExportStaffCsv:()=>{let e=this.controller.exportStaffCsvBytes();zc(e.filename,e.bytes,`text/csv;charset=utf-8`)},onExportOrgCsv:()=>{let e=this.controller.exportOrganizationCsvBytes();zc(e.filename,e.bytes,`text/csv;charset=utf-8`)},onExportJson:()=>{let e=this.controller.exportDirectoryJsonText();zc(e.filename,e.text,`application/json`)},onRequestClearAll:()=>{this.isClearAllConfirmOpen=!0}})}
        </main>
      `:j`
      <main class="hubaddress-shell__body">
        <div class="hubaddress-shell__split-grid">
          ${this.renderStaffColumn()} ${this.renderOrganizationColumn()}
        </div>
      </main>
    `}renderDialogs(){return Rc({staffForm:this.staffForm,orgForm:this.orgForm,deleteTarget:this.deleteTarget,pendingImport:this.controller.pendingImport,isClearAllConfirmOpen:this.isClearAllConfirmOpen,onUpdateStaffForm:e=>{this.staffForm&&={...this.staffForm,...e}},onSaveStaffForm:()=>void this.handleSaveStaffForm(),onCloseStaffForm:()=>{this.staffForm=null},onUpdateOrgForm:e=>{this.orgForm&&={...this.orgForm,...e}},onSaveOrgForm:()=>void this.handleSaveOrgForm(),onCloseOrgForm:()=>{this.orgForm=null},onConfirmDelete:()=>void this.handleConfirmDelete(),onCancelDelete:()=>{this.deleteTarget=null},onConfirmImport:()=>void this.controller.confirmImport(),onCancelImport:()=>this.controller.cancelImport(),onConfirmClearAll:()=>{this.isClearAllConfirmOpen=!1,this.controller.clearAllDirectoryData()},onCancelClearAll:()=>{this.isClearAllConfirmOpen=!1}})}render(){let{toastMessage:e}=this.controller;return j`
      <input
        id="hubaddress-file-input"
        class="hubaddress-shell__hidden-input"
        type="file"
        @change=${e=>void this.handleFileSelected(e)}
      />
      ${this.renderTabButtons()} ${this.renderBody()} ${this.renderDialogs()}
      ${e?j`<div class="hubaddress-shell__toast" role="status">
              ${e}
            </div>`:M}
    `}};Bc([z()],Vc.prototype,`staffForm`,void 0),Bc([z()],Vc.prototype,`orgForm`,void 0),Bc([z()],Vc.prototype,`deleteTarget`,void 0),Bc([z()],Vc.prototype,`isClearAllConfirmOpen`,void 0),Bc([z()],Vc.prototype,`pendingFileKind`,void 0),Vc=Bc([I(`hubaddress-app`)],Vc);var Hc=Bo();typeof window<`u`&&window.addEventListener(`pagehide`,()=>{Hc()});