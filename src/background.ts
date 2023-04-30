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
const storageInitialized = Browser.storage.local.get().then(storage => {
    currentStorage = storage as Storage;

    console.log("Storage initialized: " + JSON.stringify(currentStorage));
});

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
    await storageInitialized;
    filteredToSocialLinks.forEach(url => {
        if (currentStorage.trustedSocialUrls === undefined) {
            currentStorage.trustedSocialUrls = {};
        }

        currentStorage.trustedSocialUrls[url] = {};
    });
});

// Wait for all the promises to finish
Promise.all(promises)
    .then(() => Browser.storage.local.set(currentStorage))
    .then(() => console.log("Storage set"));