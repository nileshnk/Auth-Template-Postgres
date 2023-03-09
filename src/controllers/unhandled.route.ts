import { RequestHandler, Request, Response } from "express";
import { ResponseConstants } from "../constants/ResponseConstants";
export const unhandledRequest: RequestHandler = (
  req: Request,
  res: Response
) => {
  res.status(404).send(ResponseConstants.RES_ERR_PAGE_NOT_FOUND);
};
