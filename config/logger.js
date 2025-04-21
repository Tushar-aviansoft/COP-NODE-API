const winston = require("winston");
const path = require("path");
const DailyRotateFile = require("winston-daily-rotate-file");

const logger = winston.createLogger({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.printf(
      ({ timestamp, method, url, status, responseTime }) => {
        return `${timestamp} ${method} ${url} ${status} ${responseTime}ms`;
      }
    )
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message }) => {
          return `${timestamp} [${level}] ${message} `;
        })
      ),
      level: "debug",
    }),
    new DailyRotateFile({
      // filename: path.join(__dirname, "../logs/app-%DATE%.log"),
      filename: path.join("/tmp/logs/app-%DATE%.log"),
      datePattern: "YYYY-MM-DD",
      maxSize: "20m",
      maxFiles: "14d",
      level: "debug",
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(
          ({ timestamp, level, message, additionalInfo, stack }) => {
            return `${timestamp} [${level}] ${message} | ${JSON.stringify(additionalInfo) ?? 'No additional info'} ${stack ?? 'No stack'}`;
          }
        )
      ),
    }),
  ],
});

module.exports = logger;
