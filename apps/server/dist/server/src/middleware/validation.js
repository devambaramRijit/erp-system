"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateQuery = exports.validateRequest = void 0;
const zod_1 = require("zod");
/**
 * Middleware to validate request bodies against a Zod schema
 */
const validateRequest = (schema) => {
    return (req, res, next) => {
        try {
            // For POST/PUT requests, validate the body
            if (req.body) {
                const validatedBody = schema.parse(req.body);
                req.body = validatedBody;
            }
            next();
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                res.status(400).json({
                    message: 'Validation failed',
                    errors: error.issues.map(err => ({
                        field: err.path.join('.'),
                        message: err.message
                    }))
                });
            }
            else {
                res.status(500).json({
                    message: 'Internal server error'
                });
            }
        }
    };
};
exports.validateRequest = validateRequest;
/**
 * Middleware to validate query parameters
 */
const validateQuery = (schema) => {
    return (req, res, next) => {
        try {
            if (req.query) {
                const validatedQuery = schema.parse(req.query);
                req.query = validatedQuery;
            }
            next();
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                res.status(400).json({
                    message: 'Query validation failed',
                    errors: error.issues.map(err => ({
                        field: err.path.join('.'),
                        message: err.message
                    }))
                });
            }
            else {
                res.status(500).json({
                    message: 'Internal server error'
                });
            }
        }
    };
};
exports.validateQuery = validateQuery;
