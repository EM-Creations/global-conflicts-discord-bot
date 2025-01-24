import * as gamedig from 'gamedig';

export default class ArmA3Server {
  public query?: gamedig.QueryResult;

  private ip: string;
  private port: number;
  private type: string;

  constructor(ip: string, port: number, type: string) {
    this.ip = ip;
    this.port = port;
    this.type = type;
  }

  public queryServer(): Promise<gamedig.QueryResult | undefined> {
    return new Promise((resolve) => {
      gamedig
        .query({
          host: this.ip,
          port: this.port,
          type: this.type,
        })
        .then((query) => {
          this.query = query;
          resolve(query);
        })
        .catch((error) => {
          console.warn(error);
          resolve(undefined);
        });
    });
  }
}
