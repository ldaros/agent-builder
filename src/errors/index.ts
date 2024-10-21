class BaseError extends Error {
    constructor(message: string, name: string) {
        super(message);
        this.name = name;
    }
}

export class ClientError extends BaseError {
    constructor(message: string) {
        super(message, "ClientError");
    }
}

export class InternalError extends BaseError {
    constructor(message: string) {
        super(message, "InternalError");
    }
}

export class APIConnectionError extends BaseError {
    constructor(message: string) {
        super(message, "APIConnectionError");
    }
}

export class MalformedResponseError extends BaseError {
    constructor(message: string) {
        super(message, "MalformedResponseError");
    }
}

export class RateLimitError extends BaseError {
    constructor(message: string) {
        super(message, "RateLimitError");
    }
}

export class TimeoutError extends BaseError {
    constructor(message: string) {
        super(message, "TimeoutError");
    }
}

export class InvalidCredentialsError extends BaseError {
    constructor(message: string) {
        super(message, "InvalidCredentialsError");
    }
}

export class ParserError extends BaseError {
    constructor(message: string) {
        super(message, "ParserError");
    }
}

export class ValidationError extends BaseError {
    constructor(message: string) {
        super(message, "ValidationError");
    }
}

export class SchemaCompilationError extends BaseError {
    constructor(message: string) {
        super(message, "SchemaCompilationError");
    }
}