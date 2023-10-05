import { Controller, Get } from '@nestjs/common'
import { QueryResult } from 'gamedig'
import Server from '../helpers/server'

@Controller('server')
export class ServerController {

  private server = new Server(process.env.IP, parseInt(process.env.PORT));

  @Get()
  async queryServer(): Promise<QueryResult | undefined> {
    return new Promise((resolve) => {
      this.server
        .queryServer()
        .then((query: QueryResult | PromiseLike<QueryResult>) => {
          if (query) {
            resolve(query);
          } else {
            console.error('Failed to refresh server info, emitting error.');
            resolve(undefined);
          }
        })
        .catch(() => {
          resolve(undefined);
          console.log('Server is offline');
        });
    });
  }
}
