import Request from "axios";
import Cookies from "./cookies";

export default class Config {
    constructor () {
        this._api = CLIENT_CONFIG.client.api;

        if (!Array.isArray(this._api)) {
            this.api = [this._api];
        }

        this._index = 0;

        this._configuration = {};
        this._ui = {};

        this._names = [];
    }

    get system() {
        return (CLIENT_CONFIG.system || "hoobs").toLowerCase();
    }

    get socket() {
        return (CLIENT_CONFIG.client || {}).socket || `http://${CLIENT_CONFIG.system || "hoobs"}.local`;
    }

    get control() {
        return CLIENT_CONFIG.client.config;
    }

    get server() {
        return this._configuration.server || {};
    }

    get client() {
        return this._ui || {};
    }

    get bridge() {
        return this._configuration.bridge || {};
    }

    get description() {
        return this._configuration.description || "";
    }

    get ports() {
        return this._configuration.ports || {};
    }

    get accessories() {
        return this._configuration.accessories || [];
    }

    get platforms() {
        return this._configuration.platforms || [];
    }

    get instance() {
        return this._api[this._index];
    }

    get count() {
        return this._api.length;
    }

    list() {
        return new Promise((resolve) => {
            if (this._names.length > 0) {
                return resolve(this._names);
            }

            Request.defaults.headers.get["Authorization"] = Cookies.get("token");
   
            const queue = [];

            for (let i = 0; i < this._api.length; i++) {
                queue.push(true);

                Request.get(`${this._api[i]}/api/config`).then((response) => {
                    this._names.push((response.data.bridge || {}).name || "Unavailable");
                }).catch(() => {
                    this._names.push("Unavailable");
                }).finally(() => {
                    queue.pop();

                    if (queue.length === 0) {
                        resolve(this._names);
                    }
                });
            }

            if (queue.length === 0) {
                resolve(this._names);
            }
        });
    }

    async active(index) {
        if (!index || index === undefined) {
            index = 0;
        }

        if (index < 0) {
            index = 0;
        }

        if (index >= this._api.length) {
            index = this._api.length - 1;
        }

        this._index = index;

        await this.configure();
    }

    async configure() {
        Request.defaults.headers.get["Authorization"] = Cookies.get("token");

        try {
            this._ui = (await Request.get(`${this._api}/api/config`)).data.client;
        } catch {
            this._ui = CLIENT_CONFIG.client;
        }

        try {
            this._configuration = (await Request.get(`${this.instance}/api/config`)).data;
        } catch {
            this._configuration = CLIENT_CONFIG;
        }
    }
}
