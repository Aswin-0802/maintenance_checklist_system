const swaggerUi = require("swagger-ui-express");

const swaggerDocument = {
  openapi: "3.0.0",
  info: {
    title: "Maintenance Checklist API",
    version: "1.0.0",
    description:
      "Role-based API for station maintenance checklist operations with admin, staff, and supervisor modules.",
  },
  servers: [{ url: "http://localhost:5000/api", description: "Local server" }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    "/auth/login": {
      post: {
        summary: "Login and receive JWT token",
      },
    },
    "/auth/me": {
      get: {
        summary: "Get current authenticated user",
      },
    },
    "/admin/stations": {
      get: { summary: "List stations" },
      post: { summary: "Create station" },
    },
    "/admin/users": {
      get: { summary: "List users" },
      post: { summary: "Create user" },
    },
    "/admin/shifts": {
      get: { summary: "List shifts" },
      post: { summary: "Create shift" },
    },
    "/admin/templates": {
      get: { summary: "List checklist templates" },
      post: { summary: "Create checklist template" },
    },
    "/admin/reports/checklists": {
      get: { summary: "Get checklist status report" },
    },
    "/staff/my-shifts/today": {
      get: { summary: "Get current staff shifts" },
    },
    "/staff/checklists/{shiftId}": {
      get: { summary: "Get checklist for a shift" },
    },
    "/staff/checklists/{shiftId}/submit": {
      post: { summary: "Submit completed checklist" },
    },
    "/supervisor/submissions": {
      get: { summary: "Get submissions for verification" },
    },
    "/supervisor/submissions/{id}/approve": {
      post: { summary: "Approve a submitted checklist" },
    },
    "/supervisor/submissions/{id}/reject": {
      post: { summary: "Reject a submitted checklist" },
    },
    "/supervisor/history": {
      get: { summary: "Get shift-wise checklist history" },
    },
  },
};

function setupSwagger(app) {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
}

module.exports = setupSwagger;
