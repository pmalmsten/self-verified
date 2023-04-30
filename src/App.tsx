import React, { useState } from 'react';
import logo from './logo.svg';
import './App.css';
import Browser from 'webextension-polyfill';
import * as cheerio from 'cheerio';
import { SocialLinks } from 'social-links'; 
import { tab } from '@testing-library/user-event/dist/tab';

const socialLinks = new SocialLinks();
const trustedUrl = "https://www.npr.org/sections/money/"

function App() {
  const [verified, setVerified] = useState<boolean | undefined>(undefined);

 fetch(new URL(trustedUrl))
  .then(response => response.text())
  .then(bodyText => {
    let $ = cheerio.load(bodyText);
    let aTags = $("a").get();

    let linkUrls = aTags
      .map(a => a.attribs.href)
      .filter(url => url !== undefined && url.length > 0);

    let uniqueLinkUrls = Array.from(new Set(linkUrls));

    console.log("Links: " + uniqueLinkUrls);

    let filteredToSocialLinks = uniqueLinkUrls.filter(url => socialLinks.detectProfile(url).length > 0);
    console.log("Social Links: " + filteredToSocialLinks);

    // If current browser tab URL matches a filtered social link, then set the
    // state of verified to true. Otherwise, set it to false.
    return Browser.tabs.query({active: true, currentWindow: true})
      .then(tabs => {
          let currentTab = tabs[0];
          let currentTabUrl = currentTab.url;
          console.log("Current Tab URL: " + currentTabUrl);

          if (currentTabUrl === undefined) {
            throw new Error("Current tab URL is undefined");
          }

          setVerified(filteredToSocialLinks.includes(currentTabUrl));
        })
  })
  .catch(err => console.error(err));

  return (
    <div className="App">
      <header className="App-header">
        <p>
          {verified === undefined ? 'Loading...' : verified ? 'Verified' : 'Not Verified'}
        </p>
      </header>
    </div>
  );
}

export default App;
