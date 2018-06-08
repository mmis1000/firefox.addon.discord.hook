const client_id = "453849553913774082";
console.log('redirect url belong to this extension is ' + browser.identity.getRedirectURL())

async function main() {
    let access_token;
    let save = await browser.storage.sync.get()
    // https://128aeaf02f1e6332c197edd23cc4648b90261f84.extensions.allizom.org
    // https://discordapp.com/api/oauth2/authorize?client_id=453849553913774082&redirect_uri=https%3A%2F%2F128aeaf02f1e6332c197edd23cc4648b90261f84.extensions.allizom.org&response_type=code&scope=rpc%20rpc.api%20identify
    console.log(save);
    if (save.access_token) {
        try {
            await fetch(
                `https://discordapp.com/api/users/@me?acccess_token=${save.access_token}&client_id=${client_id}`
            )

            access_token = save.access_token;
        } catch (err) {
            console.log(err);

            const temp = await browser.identity.launchWebAuthFlow({
                url: "https://discordapp.com/api/oauth2/authorize?client_id=453849553913774082&redirect_uri=https%3A%2F%2F128aeaf02f1e6332c197edd23cc4648b90261f84.extensions.allizom.org&response_type=token&scope=rpc%20rpc.api%20identify",
                interactive: true
            })
    
            access_token = /access_token=([^&]+)/.exec(temp)[1];
    
            await browser.storage.sync.set({access_token: access_token})
        }
    } else {
        const temp = await browser.identity.launchWebAuthFlow({
            url: "https://discordapp.com/api/oauth2/authorize?client_id=453849553913774082&redirect_uri=https%3A%2F%2F128aeaf02f1e6332c197edd23cc4648b90261f84.extensions.allizom.org&response_type=token&scope=rpc%20rpc.api%20identify",
            interactive: true
        })

        access_token = /access_token=([^&]+)/.exec(temp)[1];

        await browser.storage.sync.set({access_token: access_token})
    }
    
    console.log(access_token);

    function connectBroker() {
        const sock = new WebSocket(
            `ws://127.0.0.1:6473/?client_id=${client_id}&access_token=${access_token}`
        );

        sock.onmessage = async function(e) {
            console.log(e);
            try {
                var data = JSON.parse(e.data);

                if (data.cmd === "AUTHENTICATE") {
                    browser.tabs.onActivated.addListener(async function ({tabId}) {

                        const tab = await browser.tabs.get(tabId);
                        sock.send(JSON.stringify({
                            "nonce": "6bb10a43-1fdc-4391-9512-0c8f4aa203d4",
                            "args": {
                                "pid": 9999,
                                "activity": {
                                    "state": tab.audible ? "觀看影音中": "發呆中",
                                    "details": tab.title,
                                    "assets": {
                                        "large_text": "Wow such firefox",
                                        "large_image": "largeicon",
                                    }
                                }
                            },
                            "cmd": "SET_ACTIVITY"
                        }))
                    })

                    setInterval(async ()=>{
                        let tab = await browser.tabs.query({active: true});
                        tab = tab ? tab[0]: null;
                        if (!tab) return;

                        console.log(tab);

                        sock.send(JSON.stringify({
                            "nonce": "6bb10a43-1fdc-4391-9512-0c8f4aa203d4",
                            "args": {
                                "pid": 9999,
                                "activity": {
                                    "state": tab.audible ? "觀看影音中": "發呆中",
                                    "details": tab.title,
                                    "assets": {
                                        "large_text": "Wow such firefox",
                                        "large_image": "largeicon",
                                    }
                                }
                            },
                            "cmd": "SET_ACTIVITY"
                        }))
                    }, 5000);
                    
                    var tab = await browser.tabs.query({active: true});
                    tab = tab ? tab[0]: null;
                    console.log(tab);

                    var state = tab? (tab.audible? "觀看影音中": "發呆中"): "發呆中";
                    var details = tab? tab.title: "猜猜我在幹嘛？";

                    sock.send(JSON.stringify({
                        "nonce": "6bb10a43-1fdc-4391-9512-0c8f4aa203d4",
                        "args": {
                            "pid": 9999,
                            "activity": {
                                state,
                                details,
                                "assets": {
                                    "large_text": "Wow such firefox",
                                    "large_image": "largeicon",
                                }
                            }
                        },
                        "cmd": "SET_ACTIVITY"
                    }))
                }
            } catch (e) {
                console.error(e)
            }
        }

        sock.onerror = function(e) {
            console.error(e);
        }

        sock.onclose = function(e) {
            console.error(e);
            setTimeout(function () {
                connectBroker()
            }, 10000)
        }

        sock.onopen = function () {
            console.log('opened');
        }
    }

    connectBroker();
}

main();