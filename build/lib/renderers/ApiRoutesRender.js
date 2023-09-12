"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderRoutes = void 0;
const mustache_1 = require("mustache");
const renderRoutes = (api) => {
    const rows = Object.keys(api)
        .map((e) => {
        const view = {
            prop: e,
            value: api[e],
        };
        return (0, mustache_1.render)(`{{ prop }}: "{{{ value }}}"`, view);
    })
        .join(",\n\t");
    const view = (0, mustache_1.render)(`export const API_ROUTES = { \n\t{{{ rows }}}\n}\n`, {
        rows,
    });
    return view;
};
exports.renderRoutes = renderRoutes;
