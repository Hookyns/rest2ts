"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.configureApiCalls = void 0;
const ava_1 = __importDefault(require("ava"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const express_1 = __importStar(require("express"));
const http_1 = __importDefault(require("http"));
const test_listen_1 = __importDefault(require("test-listen"));
global.Headers = node_fetch_1.default.Headers;
let CONFIG = {
    jwtKey: undefined,
    onResponse: () => { },
};
function configureApiCalls(configuration) {
    CONFIG = { ...CONFIG, ...configuration };
}
exports.configureApiCalls = configureApiCalls;
async function fetchJson(...args) {
    const res = await node_fetch_1.default(...args);
    const json = await res.json();
    const response = { json: json, status: res.status };
    CONFIG.onResponse && CONFIG.onResponse(response);
    return response;
}
const updateHeaders = (headers) => {
    if (!headers.has("Content-Type")) {
        headers.append("Content-Type", "application/json");
    }
    const token = CONFIG.jwtKey
        ? localStorage.getItem(CONFIG.jwtKey)
        : undefined;
    if (!headers.has("Authorization") && token) {
        headers.append("Authorization", token);
    }
};
function apiPost(url, request, headers) {
    var raw = JSON.stringify(request);
    updateHeaders(headers);
    var requestOptions = {
        method: "POST",
        headers,
        body: raw,
        redirect: "follow",
    };
    return fetchJson(url, requestOptions);
}
function apiGet(url, headers, paramsObject = {}) {
    updateHeaders(headers);
    const queryString = Object.entries(paramsObject)
        .map(([key, val]) => `${key}=${val}`)
        .join("&");
    const maybeQueryString = queryString.length > 0 ? `?${queryString}` : "";
    const requestOptions = {
        method: "GET",
        headers,
        redirect: "follow",
    };
    return fetchJson(`${url}${maybeQueryString}`, requestOptions);
}
function apiPut(url, request, headers) {
    updateHeaders(headers);
    var raw = JSON.stringify(request);
    var requestOptions = {
        method: "PUT",
        headers,
        body: raw,
        redirect: "follow",
    };
    return fetchJson(url, requestOptions);
}
function apiPatch(url, request, headers) {
    updateHeaders(headers);
    var raw = JSON.stringify(request);
    var requestOptions = {
        method: "PATCH",
        headers,
        body: raw,
        redirect: "follow",
    };
    return fetchJson(url, requestOptions);
}
function apiDelete(url, headers, paramsObject = {}) {
    updateHeaders(headers);
    const queryString = Object.entries(paramsObject)
        .map(([key, val]) => `${key}=${val}`)
        .join("&");
    const maybeQueryString = queryString.length > 0 ? `?${queryString}` : "";
    const requestOptions = {
        method: "DELETE",
        headers,
        redirect: "follow",
    };
    return fetchJson(`${url}${maybeQueryString}`, requestOptions);
}
const runExpress = (port) => {
    const app = (0, express_1.default)();
    app.use((0, express_1.default)());
    app.use((0, express_1.json)());
    app.get("/language/", (req, res) => {
        const languageCode = req.query.languageCode;
        if (languageCode === "cs") {
            res.status(200);
            return res.json({
                language: "Czech",
            });
        }
        res.status(500);
        return res.json({ error: new Error("Language not found") });
    });
    app.get("/todos/:id", (req, res) => res.json({
        userId: 1,
    }));
    app.delete("/todos/:id", (req, res) => res.json({
        userId: 0,
    }));
    app.put("/todo/", (req, res) => {
        const { userId, title } = req.body;
        return res.json({
            userId,
            title: `${title}++`,
        });
    });
    app.post("/todo/", (req, res) => {
        const { userId, title } = req.body;
        res.status(201);
        return res.json({
            userId,
            title,
        });
    });
    app.patch("/todo/", (req, res) => {
        const { userId, title } = req.body;
        res.status(200);
        return res.json({
            userId,
            title: `${title}_patch`,
        });
    });
    app.listen(port);
    return app;
};
(0, ava_1.default)("get to web api", async (t) => {
    const url = await (0, test_listen_1.default)(http_1.default.createServer(runExpress(3000)));
    const response = await apiGet(`${url}/todos/1`, new Headers(), {});
    t.deepEqual(response.status, 200);
    t.deepEqual(response.json.userId, 1);
});
(0, ava_1.default)("get with query to web api", async (t) => {
    const url = await (0, test_listen_1.default)(http_1.default.createServer(runExpress(3001)));
    t.log(url);
    const response = await apiGet(`${url}/language`, new Headers(), { languageCode: "cs" });
    t.deepEqual(response.status, 200);
    t.deepEqual(response.json.language, "Czech");
});
(0, ava_1.default)("post to web api", async (t) => {
    const url = await (0, test_listen_1.default)(http_1.default.createServer(runExpress(3002)));
    var response = await apiPost(`${url}/todo`, {
        title: "test",
        userId: 666,
    }, new Headers());
    t.deepEqual(response.status, 201);
    t.deepEqual(response.json.userId, 666);
    t.deepEqual(response.json.title, "test");
});
(0, ava_1.default)("put to web api", async (t) => {
    const url = await (0, test_listen_1.default)(http_1.default.createServer(runExpress(3003)));
    var response = await apiPut(`${url}/todo`, {
        title: "test",
        userId: 666,
    }, new Headers());
    t.deepEqual(response.status, 200);
    t.deepEqual(response.json.userId, 666);
    t.deepEqual(response.json.title, "test++");
});
(0, ava_1.default)("delete with query to web api", async (t) => {
    const url = await (0, test_listen_1.default)(http_1.default.createServer(runExpress(3004)));
    const response = await apiDelete(`${url}/todos/1`, new Headers(), {});
    t.deepEqual(response.status, 200);
    t.deepEqual(response.json.userId, 0);
});
(0, ava_1.default)("patch to web api", async (t) => {
    const url = await (0, test_listen_1.default)(http_1.default.createServer(runExpress(3005)));
    var response = await apiPatch(`${url}/todo`, {
        title: "test",
        userId: 666,
    }, new Headers());
    t.deepEqual(response.status, 200);
    t.deepEqual(response.json.userId, 666);
    t.deepEqual(response.json.title, "test_patch");
});
