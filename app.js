'use strict';

// Init server
const koa = require('koa');
const app = module.exports = new koa();
const routes = require('./routes.js');

const User = require('./models/user.model');
require('./db');

// Dependencies
const bodyParser = require('koa-bodyparser');
const compress = require('koa-compress');
const cors = require('kcors');
const logger = require('koa-logger');
const cache = require('koa-redis-cache');

// Logger
app.use(logger());
app.use(cors());
app.use(bodyParser());

app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    ctx.body = undefined;
    switch (ctx.status) {
    case 401:
      ctx.app.emit('error', err, this);
      break;
    default:
      if (err.message) {
        ctx.body = {errors:[err.message]};
      }
      ctx.app.emit('error', err, this);
    }
  }
});

app.use(async (ctx, next) => {
  if(!ctx.headers['authorization']) return await next();
  let token = ctx.headers['authorization'].split(' ').pop();

  if (!token) return await next();
  ctx.user = await User.findOne({token});

  return await next();
});

routes(app);

// Compress
app.use(compress());

// Run server
if (!module.parent) {
  const ip = process.env.ip || 'localhost';
  const port = process.env.port || 3000;
  app.listen(port);
  console.log(`Orbits server running at http://${ip}:${port}`);
}
