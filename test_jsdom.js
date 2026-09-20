const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');
const script = fs.readFileSync('script.js', 'utf8');

const dom = new JSDOM(html, { runScripts: "dangerously" });
const document = dom.window.document;
const window = dom.window;

// simulate some API
window.navigator.mediaDevices = { enumerateDevices: () => Promise.resolve([]) };

try {
  dom.window.eval(script);
  dom.window.document.dispatchEvent(new dom.window.Event('DOMContentLoaded'));
} catch (e) {
  console.log("JS Error:", e);
}

setTimeout(() => {
  console.log("State-landing is-active:", document.getElementById('state-landing').classList.contains('is-active'));
  console.log("Hero exists:", document.querySelector('.hero') !== null);
  console.log("App children:", document.getElementById('app').children.length);
  
  // print out the display property of state-landing if any
  const landing = document.getElementById('state-landing');
  console.log("Landing style:", landing.style.display);
}, 100);
