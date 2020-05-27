// ==UserScript==
// @name Gfycat AutoHD
// @author Invertex
// @description Automatically sets Gfycat/RedGifs video to HD mode and other improvements
// @icon https://github.com/Invertex/Gfycat-AutoHD/raw/master/logo.png
// @namespace https://greasyfork.org/users/137547
// @license GPL-3.0-or-later; http://www.gnu.org/licenses/gpl-3.0.txt
// @homepageURL https://github.com/Invertex/Gfycat-AutoHD
// @supportURL https://github.com/Invertex/Gfycat-AutoHD
// @version 1.51
// @match *://*.gifdeliverynetwork.com/*
// @match *://cdn.embedly.com/widgets/media.html?src=*://*.gfycat.com/*
// @match *://cdn.embedly.com/widgets/media.html?src=*://*.redgifs.com/*
// @match *://*.gfycat.com/*
// @match *://*.redgifs.com/*
// @require https://ajax.googleapis.com/ajax/libs/jquery/2.1.0/jquery.min.js
// @grant none
// @run-at document-start

// ==/UserScript==
var isAdultSite;
const thumbsStr = '//thumbs.';
const giantStr = '//giant.';
const mobileStr = '-mobile.';
const iframeVideoClass = 'video.media';
const settingsButtonClass = '.settings-button';
const progressControlClass = '.progress-control';
const proUpgradeClass = '.pro-cta';
const proUpgradeNotificationClass = '.toast-notification--pro-cta';
const topSlotAdClass = '.top-slot';
const sideSlotAdClass = '.side-slot';
const trackingPixel = 'img.tracking-pixel';

(function()
{
    var url = window.location.href;
    isAdultSite = url.includes("redgifs.");

    if (url.includes(thumbsStr))
    {
        setHDURL(url);
    }
    else if(url.includes('embedly') || url.includes('gifdeliverynetwork'))
    {
        waitForKeyElements(iframeVideoClass, removeMobileQualityVideos);
        waitForKeyElements('span.hosted-by-text', removeUglyHostedByText);
        waitForKeyElements(progressControlClass, customizeProgressBar, true);
    }
    else
    {
        waitForKeyElements(settingsButtonClass, changeSettings);
        waitForKeyElements(proUpgradeClass, hideElem);
        waitForKeyElements(proUpgradeNotificationClass, hideElem);
        //Delete the third-party advertisements in case adblockers aren't able to catch them.
        waitForKeyElements(topSlotAdClass, hideElem);
        waitForKeyElements(sideSlotAdClass, hideElem);
    }
    //C'mon gfycat, don't be doing that cross-site tracking
    waitForKeyElements(trackingPixel, removeTracker);
})();

function setHDURL(url)
{
    url = url.replace(thumbsStr, giantStr);
    if(url.includes(mobileStr))
    {
        url = url.replace(mobileStr, '.');
    }
    window.location = url;
};

function removeMobileQualityVideos(video)
{
    //For some reason video returns null... but this will work
    video = document.querySelector(iframeVideoClass);
    let sources = video.getElementsByTagName("SOURCE");

    for(let i = sources.length - 1; i >= 0; i--)
    {
        if(sources[i].src.includes(mobileStr)) { sources[i].remove(); }
    }

    video.load();
};

function removeUglyHostedByText(hostedTextElem)
{
    if(hostedTextElem != null) { hostedTextElem.remove(); }
};

function removeTracker(tracker)
{
    if(tracker != null) { tracker.remove(); }
};

function changeSettings(settingsButton)
{
    if(settingsButton)
    {
        //In case some webpage uses same class name for something, check for data-tooltip to reduce any chance of false positive
        if(settingsButton.attr("data-tooltip") === "Quality")
        {
            settingsButton.click();
        }
    }
    waitForKeyElements(progressControlClass, customizeProgressBar, true);
};

function hideElem(elem)
{
    if(elem) { elem.hide(); }
};

function customizeProgressBar(progressBar)
{
    if(progressBar)
    {
        if(isAdultSite) { progressBar.attr('style', "height:2.4mm;"); }
        else
        {
            progressBar.attr('style', "height:2.4mm; background-color: hsla(0,0%,100%,.1);");
            progressBar.find('.hover-progress').attr('style', "background-color: hsla(0,0%,100%,.2);");
            progressBar.find('.play-progress').attr('style', "background-image: linear-gradient(90deg,rgba(58,168,255,0.3),rgba(36,117,255,0.3));");
        }
        progressBar.find('.progress-knob').attr('style', "margin-top: 0.6em;");
    }
};

//Had to directly include waitForKeyElements.js since Greasyfork hasn't approved the include...
//Following function by https://gist.github.com/BrockA
function waitForKeyElements (
    selectorTxt,    /* Required: The jQuery selector string that specifies the desired element(s). */
    actionFunction, /* Required: The code to run when elements are found. It is passed a jNode to the matched element. */
    bWaitOnce,      /* Optional: If false, will continue to scan for new elements even after the first match is found. */
    iframeSelector  /* Optional: If set, identifies the iframe to search. */
) {
    var targetNodes, btargetsFound;

    if (typeof iframeSelector == "undefined")
        targetNodes = $(selectorTxt);
    else
        targetNodes = $(iframeSelector).contents().find (selectorTxt);

    if (targetNodes && targetNodes.length > 0)
    {
        btargetsFound = true;
        /*--- Found target node(s).  Go through each and act if they
            are new.
        */
        targetNodes.each( function()
        {
            var jThis        = $(this);
            var alreadyFound = jThis.data ('alreadyFound') || false;

            if (!alreadyFound)
            {
                //--- Call the payload function.
                var cancelFound = actionFunction (jThis);
                if (cancelFound) { btargetsFound = false; }
                else { jThis.data ('alreadyFound', true); }
            }
        } );
    }
    else { btargetsFound = false; }

    //--- Get the timer-control variable for this selector.
    var controlObj      = waitForKeyElements.controlObj  ||  {};
    var controlKey      = selectorTxt.replace (/[^\w]/g, "_");
    var timeControl     = controlObj [controlKey];

    //--- Now set or clear the timer as appropriate.
    if (btargetsFound && bWaitOnce && timeControl) {
        //--- The only condition where we need to clear the timer.
        clearInterval (timeControl);
        delete controlObj [controlKey]
    }
    else {
        //--- Set a timer, if needed.
        if ( ! timeControl) {
            timeControl = setInterval (function(){ waitForKeyElements(selectorTxt, actionFunction, bWaitOnce, iframeSelector); }, 300);
            controlObj [controlKey] = timeControl;
        }
    }
    waitForKeyElements.controlObj = controlObj;
}
