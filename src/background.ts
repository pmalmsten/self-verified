import Browser from 'webextension-polyfill';
import * as cheerio from 'cheerio';
import { SocialLinks } from 'social-links';

const socialLinks = new SocialLinks();
const trustedUrls = ["https://www.npr.org/sections/money/"]

interface Storage {
    // trustedSocialUrls object, where keys are social URLs
    trustedSocialUrls?: { [key: string]: {} };
}

let currentStorage: Storage = {};
const storageInitialized = Browser.storage.local.get()
    .then(async storage => {
        currentStorage = storage as Storage;

        console.log("Storage initialized: " + JSON.stringify(currentStorage));

        if (currentStorage.trustedSocialUrls === undefined) {
            let promises = trustedUrls.map(async trustedUrl => {
                let bodyText = await fetch(new URL(trustedUrl))
                    .then(response => response.text());

                let $ = cheerio.load(bodyText);
                let aTags = $("a").get();

                // Get all the links on the page
                let linkUrls = aTags
                    .map(a => a.attribs.href)
                    .filter(url => url !== undefined && url.length > 0);

                let uniqueLinkUrls = Array.from(new Set(linkUrls));

                console.log("Links: " + uniqueLinkUrls);

                // Filter the links to only social links
                let filteredToSocialLinks = uniqueLinkUrls.filter(url => socialLinks.detectProfile(url).length > 0);
                console.log("Social Links: " + filteredToSocialLinks);

                // Add all the social links to the trusted set
                filteredToSocialLinks.forEach(url => {
                    if (currentStorage.trustedSocialUrls === undefined) {
                        currentStorage.trustedSocialUrls = {};
                    }

                    currentStorage.trustedSocialUrls[url] = {};
                });
            });

            // Wait for all the promises to finish
            await Promise.all(promises)

            await Browser.storage.local.set(currentStorage)
            console.log("Storage set");
        } else {
            console.log("Storage already set");
        }

        // Check if the current tab is a trusted social url
        let currentTab = await Browser.tabs.query({ active: true, currentWindow: true });
        let currentTabUrl = currentTab[0].url;
        if (currentStorage.trustedSocialUrls !== undefined &&
            currentTabUrl !== undefined &&
            currentStorage.trustedSocialUrls[currentTabUrl] !== undefined) {
            console.log("Current tab is trusted social url");
            await Browser.action.setIcon({ path: "icon-locked-192.png" });
        } else {
            console.log("Current tab is not trusted social url");
            await Browser.action.setIcon({ path: "icon-192.png" });
        }
    })
    .catch(error => {
        console.error(error);
    });

// Listen for changes to the active tab url. If the url is a trusted social url,
// then change the browser action icon to icon-locked-192.png. Otherwise, change
// it to icon-192.png.
Browser.tabs.onActivated.addListener(async activeInfo => {
    await storageInitialized;

    let currentTab = await Browser.tabs.get(activeInfo.tabId);
    let currentTabUrl = currentTab.url;
    if (currentStorage.trustedSocialUrls !== undefined &&
        currentTabUrl !== undefined &&
        currentStorage.trustedSocialUrls[currentTabUrl] !== undefined) {
        console.log("Current tab is trusted social url");
        await Browser.action.setIcon({ path: "icon-locked-192.png" });
    } else {
        console.log("Current tab is not trusted social url");
        await Browser.action.setIcon({ path: "icon-192.png" });
    }
});

// Listen for changes to the active window. If the url of the active tab is a
// trusted social url, then change the browser action icon to
// icon-locked-192.png. Otherwise, change it to icon-192.png.
Browser.windows.onFocusChanged.addListener(async windowId => {
    await storageInitialized;

    let currentTab = await Browser.tabs.query({ active: true, currentWindow: true });
    let currentTabUrl = currentTab[0].url;
    if (currentStorage.trustedSocialUrls !== undefined &&
        currentTabUrl !== undefined &&
        currentStorage.trustedSocialUrls[currentTabUrl] !== undefined) {
        console.log("Current tab is trusted social url");
        await Browser.action.setIcon({ path: "icon-locked-192.png" });
    } else {
        console.log("Current tab is not trusted social url");
        await Browser.action.setIcon({ path: "icon-192.png" });
    }
});
