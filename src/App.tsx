import React, { useState } from 'react';
import logo from './logo.svg';
import './App.css';
import Browser from 'webextension-polyfill';
import * as cheerio from 'cheerio';
import { SocialLinks } from 'social-links';

const socialLinks = new SocialLinks();
const trustedUrl = "https://www.npr.org/sections/money/"

interface Storage {
  // trustedSocialUrls object, where keys are social URLs
  trustedSocialUrls?: { [key: string]: {} };
}

let currentStorage: Storage = {};
const storageInitialized = Browser.storage.local.get().then(storage => {
  currentStorage = storage as Storage;

  console.log("Storage initialized: " + JSON.stringify(currentStorage));
});

function App() {
  const [verified, setVerified] = useState<boolean | undefined>(undefined);

  storageInitialized.then(async () => {
    // Check if the active tab's url is in the trustedSocialUrls object
    const tabs = await Browser.tabs.query({ active: true, currentWindow: true });
    let currentTab = tabs[0];
    let currentTabUrl = currentTab.url;

    console.log("Current Tab URL: " + currentTabUrl);

    if (currentTabUrl === undefined) {
      throw new Error("Current tab URL is undefined");
    }

    setVerified(currentStorage.trustedSocialUrls?.hasOwnProperty(currentTabUrl));
  });

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
