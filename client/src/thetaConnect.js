const getWebsiteInfo = function(){
    const shortcutIcon = window.document.querySelector('head > link[rel="shortcut icon"]');
    const icon = shortcutIcon || Array.from(window.document.querySelectorAll('head > link[rel="icon"]')).find((icon) => Boolean(icon.href));
    const siteName = document.querySelector('head > meta[property="og:site_name"]');
    const title = siteName || document.querySelector('head > meta[name="title"]');

    return {
        title: title ? title.content : document.title,
        iconUrl: (icon && icon.href) || `${window.location.origin}/favicon.ico`
    };
};

const IFRAME_ID = '__THETA_WALLET_CONNECT__';

class ThetaWalletConnect {
    constructor() {
        this._onLoad = null;
        this._isConnected = false;

        this._callbacks = [];

        this._bridge_iframe = null;

        this._r = null;
        this._requester = null;

        this._publicConfig = null;
    }

    connect = () => {
        const promise = new Promise((resolve, reject) => {
            if(this._isConnected){
                resolve(true);
                return;
            }

            const requester = Object.assign({}, getWebsiteInfo(),{
                origin: window.location.origin,
            });
            this._requester = requester;
            this._r = encodeURIComponent(btoa(JSON.stringify(requester)));

            let iframe = document.getElementById(IFRAME_ID);
            if(!iframe){
                // We already have injected our frame
                iframe = document.createElement('iframe');
                iframe.id = IFRAME_ID;
                iframe.style.display = 'none';
                iframe.onload = function(){
                    this._isConnected = true;
                    this._bridge_iframe = iframe;

                    resolve(true);
                }.bind(this);
                iframe.onerror = function(){
                    reject(new Error('Failed to connect to Theta Wallet.'));
                }
                iframe.src = `https://wallet.thetatoken.org/theta-wallet-connect.html`;
                document.body.appendChild(iframe);

                this.setUpMessageListener();
            }
            else{
                resolve(true);
            }
        });
        this._initPromise = promise;
        return promise;
    }

    disconnect(){
        const promise = new Promise((resolve, reject) => {
            let iframe = document.getElementById(IFRAME_ID);
            if(iframe){
                iframe.parentNode.removeChild(iframe);

                this._isConnected = false;
                this._bridge_iframe = null;
                this._publicConfig = null;
            }
            this.removeMessageListener();

            resolve(true);
        });
        return promise;
    }

    isConnected(){
        return (this._isConnected && this._publicConfig !== null);
    }

    requestAccounts(callback = null){
        return this.sendRPCRequestToContentScriptBridge('requestAccounts',[], callback);
    }

    sendTransaction(transaction){
        if(!transaction){
            throw new Error('transaction must be a thetajs Transaction.');
        }
        if(!transaction.toJson){
            throw new Error('transaction must be a thetajs Transaction.');
        }

        const transactionRequest = transaction.toJson();
        return this.sendRPCRequestToContentScriptBridge('sendTransaction',[{transactionRequest: transactionRequest}], null);
    }

    getChainId = () => {
        if (this._publicConfig) {
            return this._publicConfig['chainId'];
        }
    }

    isUnlocked(){
        return this._publicConfig['isUnlocked'];
    }

    registerCallback(id, cb){
        this._callbacks[id] = cb;
    }

    buildRPCRequest(method, params){
        return {
            jsonrpc: '2.0',
            method: method,
            params: params,
            id: Date.now()
        };
    }

    buildDefaultRPCCallback(resolve, reject) {
        return (error, result) => {
            if (error) {
                reject(new Error(error));
                return;
            }

            resolve(result);
        };
    };

    sendRPCRequestToContentScriptBridge(method, params, callback = null){
        return new Promise((resolve, reject) => {
            const cb = (callback ? callback : this.buildDefaultRPCCallback(resolve, reject));
            const request = this.buildRPCRequest(method, params);
            request.metadata = {
                requester: this._requester
            };

            this.registerCallback(request.id, cb);

            this._bridge_iframe.contentWindow.postMessage({
                target: 'theta-wallet.contentscript-forwarder',
                data: request
            }, '*');
        });
    };

    handleMessage(event) {
        // We always pass an object
        if(!event.data || (typeof event.data !== 'object')){
            return;
        }

        // We always pass target
        if(!event.data.target){
            return;
        }

        if(event.data.target === 'theta-wallet.connect'){
            const {id, error, result, method, params} = event.data.data;

            if(method === 'updateThetaWalletPublicConfig'){
                const newConfig = params[0]['publicConfig'];
                const chainID = this.getChainId();
                if((newConfig && this._publicConfig) && (newConfig.chainId !== chainID)){
                    // TODO dispatch event here...
                }
                this._publicConfig = params[0]['publicConfig'];

                return;
            }

            if(id !== undefined && (result || error) && this._callbacks){
                // This is a response from a previous request
                const cb = this._callbacks[id];

                if(cb && typeof cb === "function"){
                    // RPC spec has an error as an object
                    const errorMsg = (error ? error.message : null);

                    cb(errorMsg, result);
                }
            }
        }
    }

    setUpMessageListener(){
        window.addEventListener('message', this.handleMessage.bind(this), false);
    }

    removeMessageListener(){
        window.removeEventListener('message', this.handleMessage.bind(this), false);
    }
}

export default new ThetaWalletConnect();
