"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const proxies_config_1 = require("../config/proxies.config");
const router = (0, express_1.Router)();
// Middleware para log de todas as requisições
router.use((req, res, next) => {
    console.log(`[Gateway] ${req.method} ${req.originalUrl} from ${req.ip}`);
    next();
});
// Função de proxy genérica
const createProxyHandler = (service) => async (req, res) => {
    const startTime = Date.now();
    const path = req.originalUrl.replace(/^\/api\/[^/]+\//, '/');
    try {
        const response = await service({
            method: req.method,
            url: path,
            data: req.body,
            params: req.query,
            headers: {
                ...req.headers,
                host: undefined,
                'x-forwarded-for': req.ip,
                'x-request-id': req.headers['x-request-id'] || `req_${Date.now()}`
            }
        });
        res.status(response.status)
            .set(response.headers)
            .json(response.data);
    }
    catch (error) {
        const status = error.status === 'NO_RESPONSE' ? 504 : error.status || 502;
        console.error('[Proxy Error Details]', {
            timestamp: new Date().toISOString(),
            service: service.defaults.baseURL,
            path,
            errorCode: error.code,
            originalError: error.message,
            duration: `${Date.now() - startTime}ms`
        });
        res.status(status).json({
            error: "Service Communication Error",
            message: (0, proxies_config_1.getErrorMessage)(error.code),
            details: {
                service: service.defaults.baseURL,
                endpoint: path,
                errorCode: error.code
            },
            timestamp: new Date().toISOString()
        });
    }
};
// Rotas de proxy
router.use("/auth", createProxyHandler(proxies_config_1.proxies.auth));
router.use("/users", createProxyHandler(proxies_config_1.proxies.user));
router.use("/bookings", createProxyHandler(proxies_config_1.proxies.booking));
router.use("/salons", createProxyHandler(proxies_config_1.proxies.salon));
router.use("/notifications", createProxyHandler(proxies_config_1.proxies.notification));
// Rota especial para atualização de URLs de imagens
router.patch("/images/update-urls", async (req, res) => {
    try {
        const { urls, entityType, entityId } = req.body;
        if (!urls || !Array.isArray(urls)) {
            return res.status(400).json({
                error: "Invalid Request",
                message: "URLs array is required",
                timestamp: new Date().toISOString()
            });
        }
        if (!entityType || !entityId) {
            return res.status(400).json({
                error: "Invalid Request",
                message: "entityType and entityId are required",
                timestamp: new Date().toISOString()
            });
        }
        const response = await proxies_config_1.proxies.images.patch("/update-urls", {
            urls,
            entityType,
            entityId
        });
        res.status(response.status).json(response.data);
    }
    catch (error) {
        res.status(500).json({
            error: "Image Update Failed",
            message: (0, proxies_config_1.getErrorMessage)(error.code),
            details: error.message,
            timestamp: new Date().toISOString()
        });
    }
});
// Health check
router.get("/health", async (req, res) => {
    try {
        const services = await (0, proxies_config_1.checkServicesHealth)();
        res.json({
            status: "Gateway is healthy",
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            services
        });
    }
    catch (error) {
        res.status(500).json({
            status: "Gateway is unhealthy",
            error: (0, proxies_config_1.getErrorMessage)(error.code),
            details: error.message,
            timestamp: new Date().toISOString()
        });
    }
});
exports.default = router;
