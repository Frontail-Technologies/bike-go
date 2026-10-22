import { Elysia } from "elysia";
import { customerErrors, ok } from "@/libs/api";
import { authPlugin } from "@/plugins/auth";
import * as DocumentModel from "./model";
import { deleteDocument, downloadOwnDocument, listDocuments, uploadDocument } from "./service";

const security = [{ sessionCookie: [] }];

export const documentRoutes = new Elysia({ name: "RideGo.Document", prefix: "/api/v1/loans", tags: ["Loan documents"] })
  .use(authPlugin)
  .get(
    "/:reference/documents",
    { auth: true, params: DocumentModel.DocumentsGet.Params, response: { 200: DocumentModel.DocumentsGet.Response, ...customerErrors }, detail: { summary: "Documents on my application", description: "Storage keys are never returned.", security } },
    async ({ user, params }) => ok(await listDocuments(user.id, params.reference)),
  )
  .post(
    "/:reference/documents",
    {
      auth: true,
      params: DocumentModel.DocumentPost.Params,
      body: DocumentModel.DocumentPost.Body,
      response: { 201: DocumentModel.DocumentPost.Response, ...customerErrors },
      detail: {
        summary: "Upload a document (multipart/form-data)",
        description:
          "Fields: `file` (PDF, JPG or PNG, max 5 MB; the content is inspected, not the extension) and `type`. Allowed while the application is a draft or staff asked for more documents. The file is stored privately and its internal key is never exposed.",
        security,
      },
    },
    async ({ user, params, body, status }) => status(201, ok(await uploadDocument(user.id, params.reference, body))),
  )
  .get(
    "/:reference/documents/:documentId/file",
    { auth: true, params: DocumentModel.DocumentByIdParams, detail: { summary: "Download one of my documents", description: "Sent as an attachment, private and uncacheable.", security } },
    async ({ user, params }) => downloadOwnDocument(user.id, params.reference, params.documentId),
  )
  .delete(
    "/:reference/documents/:documentId",
    { auth: true, params: DocumentModel.DocumentDelete.Params, response: { 200: DocumentModel.DocumentDelete.Response, ...customerErrors }, detail: { summary: "Remove one of my documents", description: "Not allowed once a document is verified.", security } },
    async ({ user, params }) => ok(await deleteDocument(user.id, params.reference, params.documentId)),
  );
