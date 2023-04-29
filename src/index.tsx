import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import Browser from 'webextension-polyfill';
import * as cheerio from 'cheerio';
import { SocialLinks } from 'social-links'; 

const socialLinks = new SocialLinks();

Browser.tabs
  .query({ currentWindow: true, active: true })
  .then(tabs => tabs[0].url)
  .then(url => {
    console.log("URL 2: " + url);

    return url;
  })
  .then(url => {
    if (url === undefined) {
      throw new Error("URL is undefined");
    }

    console.log("Fetch: " + url);

    return fetch(new URL(url));
  })
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
  })
  .catch(err => console.error(err));

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();