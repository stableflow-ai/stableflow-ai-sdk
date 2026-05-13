import { OpenAPI } from "../../core/OpenAPI";
import { request } from "../../core/request";

export async function quoteSignature(params: any) {
  const response: any = await request(OpenAPI, {
    method: 'POST',
    url: "/v0/cctp/sign",
    body: params,
    headers: {
      "Content-Type": "application/json"
    },
    errors: {
      400: `Bad Request - Invalid input data`,
      401: `Unauthorized - JWT token is invalid`,
    },
  });
  return response.data ?? {};
}
