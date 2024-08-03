import { Elysia, t } from 'elysia'
import { swagger } from '@elysiajs/swagger'
import { WebSocketServer } from 'ws';
import os from 'os';
import chalk from 'chalk';
import { format } from 'date-fns';
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient() 
const log = console.log;
const wss = new WebSocketServer({ port: 8080 });
let count = 0;

wss.on('connection', (ws) => {
  log(chalk.green('WebSocket connection established'));

  const intervalId = setInterval(() => {
    const uptime = (os.uptime() / 60).toFixed(2) + ' minutes';
    const cpuUsage = (os.loadavg()[0] * 100).toFixed(2) + '%'; // Simplified CPU usage
    const memoryUsage = ((os.totalmem() - os.freemem()) / os.totalmem() * 100).toFixed(2) + '%';
    const loadAverage = os.loadavg().map(avg => avg.toFixed(2)).join(', ');

    const healthStatus = {
      uptime,
      cpuUsage,
      memoryUsage,
      loadAverage
    };

    ws.send(JSON.stringify(healthStatus));
  }, 2500);

  ws.on('close', () => {
    clearInterval(intervalId);
    log(chalk.red('WebSocket connection closed'));
  });
});

const users = new Elysia({ prefix: '/user' })
    .get('/' , () => 'home user')
    .get('/sign-in/:id', ({ params }) => params, {
        params: t.Object({
            id: t.Number()
        })
    })
    .get('cat/:id', async ({ params }) => {
      const userId = params.id

      if (isNaN(userId)) { return { error: 'Invalid ID' }; }
    
      const user = await prisma.user.findUnique({
        where: {
          id: userId
        }
      });
    
      if (user) { log(chalk.green(count++)); } else { return { error: 'User not found' }; }
    
      return user;
    }, {
      params: t.Object({
        id: t.Number()
      })
    })
    .post('/profile', () => 'Profile')

new Elysia()
	  .onError(({ code, error }) => {
        if (code === 'VALIDATION')
            return error.validator.Errors(error.value).First().message
    })
    .use(swagger())
    .use(users)
    .get('/019117a3x0b1c.js', () => Bun.file('public/chart.js'))
    .get('/', () =>  Bun.file('public/index.html'))
    .listen(3000)