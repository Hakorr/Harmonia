// ==UserScript==
// @name        Harmonia (Mobile-Friendly Spotify)
// @namespace   HKR
// @match       https://open.spotify.com/*
// @grant       GM_addStyle
// @version     0.1
// @author      HKR
// @description Makes Spotify's desktop layout more user-friendly on mobile. Tablets might not be supported.
// @run-at      document-start
// ==/UserScript==

const meta = document.querySelector('meta[name="viewport"]');
if(meta) meta.content = meta.content.replace(/,?\s*maximum-scale=1(\.0+)?/g, '');

const harmoniaElem = document.createElement('a');
      harmoniaElem.innerText = 'Running Harmonia Beta (╹◡╹)';
      harmoniaElem.href = 'https://github.com/Hakorr/Harmonia';
      harmoniaElem.target = '_about';
      harmoniaElem.classList.add('harmonia');
      document.body.prepend(harmoniaElem);

function waitForElement(selector, callback) {
    const observer = new MutationObserver((_, observer) => {
        const element = document.querySelector(selector);
        if (element) {
            console.log(`Element found: ${selector}`);
            observer.disconnect();
            callback(element);
        } else {
            console.log(`Waiting for element: ${selector}`);
        }
    });

    console.log(`Starting to observe for element: ${selector}`);
    observer.observe(document.body, { childList: true, subtree: true });
}

function monitorStyleChange(element, property, condition, onTrue, onFalse) {
    const observer = new MutationObserver(() => {
        const currentValue = parseFloat(element.style.getPropertyValue(property));
        console.log(`Current value of ${property}: ${currentValue}`);

        if (condition(currentValue)) {
            console.log(`Condition met for ${property} (${currentValue})`);
            onTrue();
        } else {
            console.log(`Condition not met for ${property} (${currentValue})`);
            onFalse();
        }
    });

    console.log(`Observing style changes for property: ${property}`);
    observer.observe(element, { attributes: true, attributeFilter: ['style'] });
}

// When user clicks on song element, play it instead of opening its page
// The song element contains links to the song, artists and such which are annoying on mobile
function monitorTrackLinks() {
    const isTrackLink = node => node.tagName === 'A' && node.href && node.href.includes('/track/');

    const findTracklistRowParent = node => {
        let parent = node.parentElement;

        while(parent && parent.getAttribute('data-testid') !== 'tracklist-row') {
            if(parent === document.body) return null;
            parent = parent.parentElement;
        }

        return parent;
    };

    const handleLinkClick = parent => {
        const playBtn = parent.querySelector('button');

        playBtn.click();
    };

    const processAddedNode = node => {
        console.log(node, isTrackLink(node));

        if(isTrackLink(node)) {
            const parent = findTracklistRowParent(node);

            if(parent) {
                parent.querySelectorAll('a').forEach(link => {
                    link.removeAttribute('href');
                    link.addEventListener('click', e => {
                        e.preventDefault();
                        handleLinkClick(parent);
                    });
                });

                parent.querySelectorAll('img').forEach(link => {
                    link.addEventListener('click', e => {
                        e.preventDefault();
                        handleLinkClick(parent);
                    });
                });
            }
        }
    };

    const onRender = () => {
        document.querySelectorAll('a').forEach((node) => {
            if (isTrackLink(node)) {
                processAddedNode(node);
            }
        });

        requestAnimationFrame(onRender);
    };

    onRender();
}

async function scaleStyling(url, variables, scaleFactor) {
    const response = await fetch(url);
    const cssText = await response.text();

    let css = cssText;

    for (const [variableName, value] of Object.entries(variables)) {
        const currentValue = parseFloat(value);
        const unit = value.replace(currentValue, '');

        const newValue = (currentValue * scaleFactor).toFixed(4) + unit;

        const regex = new RegExp(`(--${variableName}):\\s*[^;]+;`, 'g');
        css = css.replace(regex, `--${variableName}: ${newValue};`);
    }

    GM_addStyle(css);
}

waitForElement('#Desktop_LeftSidebar_Id', sidebar => {
    console.log('Sidebar element is now available');
    monitorStyleChange(sidebar, '--left-sidebar-width',
        width => width > 150,
        () => {
            console.log('Width greater than 150px');
            sidebar.classList.add('harmonia-left-sidebar-open');
        },
        () => {
            console.log('Width less than or equal to 150px');
            sidebar.classList.remove('harmonia-left-sidebar-open');
        }
    );
});

scaleStyling(document.querySelector('link[rel="stylesheet"]').href, {
    'encore-text-size-smaller-2': '0.8rem',
    'encore-text-size-smaller': '1rem',
    'encore-text-size-base': '1.3rem',
    'encore-text-size-larger': '1.4rem',
    'encore-text-size-larger-2': '1.7rem',
    'encore-text-size-larger-3': '2.2rem',
    'encore-text-size-larger-4': '2.7rem',
    'encore-text-size-larger-5': '3.2rem',
    'item-height': '4.8vw'
}, 1.1);

monitorTrackLinks();

GM_addStyle(`
    .harmonia {
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 5px;
        background-color: black;
        color: grey !important;
        font-size: 3vw;
        width: 100vw !important;
    }
    .contentSpacing {
        padding: 2vw !important;
    }
    /* Main Grid Container */
    div:has(> div[id="global-nav-bar"]) {
        display: grid !important;
        gap: 0 !important;
        grid-template-areas:
            "global-nav"
            "left-sidebar"
            "main-view"
            "right-sidebar"
            "now-playing-bar" !important;
        grid-template-columns: 1fr !important;
        grid-template-rows: auto !important;
        width: 100vw !important;
        max-width: 100% !important;
        overflow-x: hidden !important;
        margin: 0 !important;
        padding: 0 !important;
        overflow: hidden !important;
    }
    .harmonia-left-sidebar-open {
        width: 100vw !important;
        height: 100vh !important;
        right: 0 !important;
        border-radius: 0 !important;
        top: 0 !important;
        padding-bottom: 36vh !important;
    }
    * {
        max-width: 100vw !important;
    }
    video {
        border-radius: 0 !important;
    }
    .main-view-container__scroll-node-child {
        overflow-x: hidden !important;
    }
    div[data-testid="tracklist-row"] {
        grid-template-columns: [index] 70vw !important;
        grid-gap: 0 !important;
        height: fit-content !important;
    }
    div:has(> .main-view-container) {
        border-radius: 0 !important;
    }
    nav[data-testid="footer-div"] {
        padding-bottom: 80vw !important;
    }
    div[data-testid="tracklist-row"] img {
        width: 15vw !important;
        height: 15vw  !important;
    }
    div[data-testid="tracklist-row"] a {
        font-size: 3.5vw !important;
    }
    div[data-testid="tracklist-row"] div {
        font-size: 4vw !important;
    }
    div[data-testid="tracklist-row"] div.encore-internal-color-text-subdued {
        font-size: 3vw !important;
    }
    div[data-testid="tracklist-row"] div[aria-colindex="1"] {
        display: none;
    }
    div[data-testid="tracklist-row"] div[aria-colindex="5"] .encore-internal-color-text-subdued {
        font-size: 3vw !important;
        position: absolute !important;
        top: 0 !important;
        right: 0 !important;
    }
    button span .e-9640-icon {
        width: 7vw !important;
        height: 7vw !important;
    }
    .encore-text-body-small-bold {
        font-size: 4vw !important;
    }
    div[data-testid="player-controls"] .e-9640-baseline {
        width: 13vw !important;
        height: 13vw !important;
    }
    a[href="/download"] {
        display: none !important;
    }
    *[data-testid="home-button"] {
        display: none !important;
    }
    #Desktop_LeftSidebar_Id {
        width: fit-content;
        height: 15vw; /* Not important to allow the sidebar to open and collapse */
        position: fixed !important;
        top: 21vw;
        right: -1vw;
        bottom: 37vw !important;
    }
    #Desktop_LeftSidebar_Id header {
        padding: 1.2vh !important;
        background: rgba(255, 255, 255, 0.1) !important;
        backdrop-filter: blur(1vw) !important;
        border-bottom: 0.1vw solid rgba(255, 255, 255, 0.2) !important;
        overflow: hidden;
    }
    #Desktop_LeftSidebar_Id header * {
        flex-direction: row !important;
    }
    #main {
        width: 100vw !important;
    }
    #global-nav-bar {
        margin: 0 !important;
        padding: 0 !important;
        background: rgba(255, 255, 255, 0.1) !important;
        backdrop-filter: blur(1vw) !important;
        border-top: 0.1vw solid rgba(255, 255, 255, 0.2) !important;
    }
    /* RIGHT CONTAINER */
    div:has(> #Desktop_PanelContainer_Id) {
        position: fixed !important;
        top: 0 !important;
        z-index: 50 !important;
        width: 100vw !important;
        padding-bottom: 35.9vh !important;
    }
    div[class*="YourLibraryX"] header {
        align-items: center !important;
        padding: 5vw !important;
    }
    li[role="listitem"] {
        height: 10vw !important;
        margin-bottom: 5vw;
    }
    div[class*="Areas__HeaderSideAreaFlexContainer"] div div {
        width: 13vw !important;
        height: 13vw !important;
    }
    section[data-testid="home-page"]:first-child {
        padding-inline: 0 !important;
    }
    footer[data-testid="now-playing-bar"] {
        height: 36vh !important;
        display: grid !important;
        grid-template-rows: 10fr !important;
        z-index: 500 !important;
        position: fixed !important;
        bottom: -0.1vh !important;
        background-color: rgb(0 0 0 / 90%) !important;
    }
    footer[data-testid="now-playing-bar"] > div:first-child {
        flex-direction: column !important;
        height: 100% !important;
        width: 100vw !important;
        justify-content: space-around !important;
        background: rgba(255, 255, 255, 0.1) !important;
        backdrop-filter: blur(1vw) !important;
        border-top: 0.1vw solid rgba(255, 255, 255, 0.2) !important;
    }
    footer[data-testid="now-playing-bar"] > div:last-of-type:has(> svg) {
        flex-direction: row !important;
        justify-content: center !important;
        background-color: var(--background-base) !important;
    }
    footer[data-testid="now-playing-bar"] > div > div {
        width: 100% !important;
    }
    div[data-testid="playlist-tracklist"] div[role="row"] {
        --row-height: 10vw !important;
    }
    span[class*="Type__TypeElement"] {
        font-size: 4vw !important;
    }
    ul[role="menu"] button, ul[role="menu"] a {
        height: 7vh !important;
    }
    input {
        font-size: 2.3vw !important;
    }
    div[data-tippy-root] input {
        padding-left: 8vw !important;
    }
    input[role="searchbox"] {
        font-size: 4vw !important;
        padding: 3vw !important;
        padding-left: 7vw !important;
    }
    div[aria-label="Duration"] {
        display: none !important;
    }
    div[role="row"]:has(div[data-testid="tracklist-row"]) {
          height: 16vw !important;
    }
    div[data-testid="now-playing-widget"] {
        justify-content: space-between;
        margin-bottom: 2vw;
        display: grid;
        grid-template-columns: 17% 1fr 13%;
        padding: 0 1vw;
        align-items: center;
        margin-bottom: 2vw;
    }
    div:has(> div[data-testid="volume-bar"]) {
        justify-content: space-evenly !important;
        margin-top: 4vw !important;
        margin-bottom: 4vw;
    }
    div[data-testid="volume-bar"] {
        gap: 1vw;
        --slider-width: 20vw !important;
    }
    div[data-testid="progress-bar-background"], div[data-testid="progress-bar-background"] div {
        height: 3vw !important;
        border-radius: 2vw !important;
    }
    div[data-testid="fullscreen-lyric"] {
        font-size: 6vw !important;
        margin-bottom: 2vw !important;
    }
    div:has(> *[data-testid="fullscreen-lyric"]) {
        margin-bottom: 80vw !important;
    }
    *[data-testid="fullscreen-mode-button"], *[data-testid="pip-toggle-button"] {
        display: none !important;
    }
    body {
        min-width: 0 !important;
    }
    .os-scrollbar.os-scrollbar-handle-interactive .os-scrollbar-handle, .os-scrollbar.os-scrollbar-track-interactive .os-scrollbar-track {
        display: none !important;
    }
`);
