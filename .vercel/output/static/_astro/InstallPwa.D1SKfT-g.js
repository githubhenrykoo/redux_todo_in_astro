import{j as e}from"./jsx-dev-runtime.ndqpvE2b.js";import{r as o}from"./index.DKKB-h0h.js";const h=()=>{const[t,i]=o.useState(null),[d,s]=o.useState(!1),[l,c]=o.useState(!1),[u,m]=o.useState(!1);if(o.useEffect(()=>{m(!0);const r=()=>{if(typeof window>"u")return!1;const n=window.navigator.userAgent,x=!!n.match(/iPad/i)||!!n.match(/iPhone/i),f=!!n.match(/WebKit/i),N=x&&f&&!n.match(/CriOS/i)&&!n.match(/OPiOS/i)&&!n.match(/FxiOS/i);c(N)},a=n=>{n.preventDefault(),i(n),s(!0),console.log("BeforeInstallPrompt event fired and captured")};if(typeof window<"u")return r(),window.addEventListener("beforeinstallprompt",a),(window.matchMedia("(display-mode: standalone)").matches||window.navigator.standalone===!0)&&(console.log("App is already installed"),s(!1)),()=>{window.removeEventListener("beforeinstallprompt",a)}},[]),!u)return null;const p=async()=>{if(!t){console.log("No installation prompt available");return}t.prompt();const{outcome:r}=await t.userChoice;console.log(`User response to the install prompt: ${r}`),i(null),s(!1)};return!d&&!l?null:e.jsxDEV("div",{className:"install-pwa-prompt",children:[e.jsxDEV("div",{className:"install-pwa-content",children:[e.jsxDEV("div",{className:"install-pwa-header",children:[e.jsxDEV("img",{src:"/pwa-192x192.png",alt:"App Icon",className:"install-pwa-icon"},void 0,!1,{fileName:"/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/InstallPwa.jsx",lineNumber:90,columnNumber:11},void 0),e.jsxDEV("div",{className:"install-pwa-text",children:[e.jsxDEV("h3",{children:"Install Redux Todo App"},void 0,!1,{fileName:"/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/InstallPwa.jsx",lineNumber:96,columnNumber:13},void 0),e.jsxDEV("p",{children:"Get quick access and work offline"},void 0,!1,{fileName:"/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/InstallPwa.jsx",lineNumber:97,columnNumber:13},void 0)]},void 0,!0,{fileName:"/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/InstallPwa.jsx",lineNumber:95,columnNumber:11},void 0)]},void 0,!0,{fileName:"/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/InstallPwa.jsx",lineNumber:89,columnNumber:9},void 0),l?e.jsxDEV("div",{className:"ios-instructions",children:[e.jsxDEV("p",{children:"To install this app on your iOS device:"},void 0,!1,{fileName:"/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/InstallPwa.jsx",lineNumber:103,columnNumber:13},void 0),e.jsxDEV("ol",{children:[e.jsxDEV("li",{children:["Tap the share icon ",e.jsxDEV("span",{className:"share-icon",children:"⎅"},void 0,!1,{fileName:"/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/InstallPwa.jsx",lineNumber:105,columnNumber:38},void 0)," at the bottom of the screen"]},void 0,!0,{fileName:"/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/InstallPwa.jsx",lineNumber:105,columnNumber:15},void 0),e.jsxDEV("li",{children:'Scroll and tap "Add to Home Screen"'},void 0,!1,{fileName:"/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/InstallPwa.jsx",lineNumber:106,columnNumber:15},void 0),e.jsxDEV("li",{children:'Tap "Add" in the top right'},void 0,!1,{fileName:"/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/InstallPwa.jsx",lineNumber:107,columnNumber:15},void 0)]},void 0,!0,{fileName:"/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/InstallPwa.jsx",lineNumber:104,columnNumber:13},void 0)]},void 0,!0,{fileName:"/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/InstallPwa.jsx",lineNumber:102,columnNumber:11},void 0):e.jsxDEV("button",{onClick:p,className:"install-button",children:"Install App"},void 0,!1,{fileName:"/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/InstallPwa.jsx",lineNumber:111,columnNumber:11},void 0),e.jsxDEV("button",{onClick:()=>s(!1),className:"dismiss-button",children:"Not now"},void 0,!1,{fileName:"/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/InstallPwa.jsx",lineNumber:116,columnNumber:9},void 0)]},void 0,!0,{fileName:"/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/InstallPwa.jsx",lineNumber:88,columnNumber:7},void 0),e.jsxDEV("style",{jsx:!0,children:`
        .install-pwa-prompt {
          position: fixed;
          bottom: 20px;
          left: 20px;
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          padding: 16px;
          max-width: 350px;
          z-index: 1000;
        }
        
        .install-pwa-content {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        
        .install-pwa-header {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .install-pwa-icon {
          width: 40px;
          height: 40px;
          border-radius: 8px;
        }
        
        .install-pwa-text h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
        }
        
        .install-pwa-text p {
          margin: 4px 0 0 0;
          font-size: 14px;
          color: #666;
        }
        
        .ios-instructions {
          font-size: 14px;
          background-color: #f5f5f5;
          padding: 12px;
          border-radius: 6px;
        }
        
        .ios-instructions ol {
          margin: 8px 0 0 20px;
          padding: 0;
        }
        
        .share-icon {
          font-size: 18px;
        }
        
        .install-button {
          background-color: #4f46e5;
          color: white;
          border: none;
          border-radius: 6px;
          padding: 10px;
          font-weight: 500;
          cursor: pointer;
        }
        
        .dismiss-button {
          background-color: transparent;
          border: none;
          color: #666;
          padding: 8px;
          cursor: pointer;
          align-self: center;
          font-size: 14px;
        }
      `},void 0,!1,{fileName:"/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/InstallPwa.jsx",lineNumber:124,columnNumber:7},void 0)]},void 0,!0,{fileName:"/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/InstallPwa.jsx",lineNumber:87,columnNumber:5},void 0)};export{h as default};
