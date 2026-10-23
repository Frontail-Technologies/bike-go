export const LOCALE_KEY = "rgo.locale.v1";

export const PENDING_ATTRIBUTE = "data-locale-pending";

export const pendingLocaleScript = `try{var r=localStorage.getItem("${LOCALE_KEY}"),l=r?JSON.parse(r):null;if(!l){var a=navigator.languages||[navigator.language];for(var i=0;i<a.length;i++){var b=String(a[i]).toLowerCase().split("-")[0];if(["km","zh","ko","en"].indexOf(b)>-1){l=b;break}}}if(l&&l!=="en"){var d=document.documentElement;d.setAttribute("${PENDING_ATTRIBUTE}","");setTimeout(function(){d.removeAttribute("${PENDING_ATTRIBUTE}")},2500)}}catch(e){}`;
