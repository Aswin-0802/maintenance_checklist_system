const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const routes = require("./routes");
const env = require("./config/env");
const errorHandler = require("./middlewares/errorHandler");
const setupSwagger = require("./config/swagger");

const app = express();

app.use(
  cors({
    origin(origin, cb) {
      if (!origin || env.clientUrls.includes(origin)) return cb(null, true);
      return cb(new Error(`CORS blocked: ${origin}`));
    },
    credentials: true,
  })
);
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());

setupSwagger(app);
app.use("/api", routes);

app.use(errorHandler);

module.exports = app;
