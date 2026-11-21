// Controller болон middleware-ээс шидэх алдаа.
// errorHandler үүнийг { message, field } хэлбэрийн JSON болгоно.
export class HttpError extends Error {
  constructor(status, message, field) {
    super(message);
    this.status = status;
    this.field = field; // зөвхөн талбартай холбоотой алдаанд
  }
}

export const badRequest = (message, field) => new HttpError(400, message, field);
export const notFound = (message) => new HttpError(404, message);
export const conflict = (message, field) => new HttpError(409, message, field);
