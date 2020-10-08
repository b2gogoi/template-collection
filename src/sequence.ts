import {inject} from '@loopback/context';
import {
  FindRoute,
  InvokeMethod,
  ParseParams,
  Reject,
  RequestContext,
  RestBindings,
  Send,
  SequenceHandler,
} from '@loopback/rest';
import {IncomingHttpHeaders} from 'http';
import {AuthenticationBindings, AuthenticateFn} from '@loopback/authentication';

const SequenceActions = RestBindings.SequenceActions;

export class MySequence implements SequenceHandler {
  constructor(
    @inject(SequenceActions.FIND_ROUTE) protected findRoute: FindRoute,
    @inject(SequenceActions.PARSE_PARAMS) protected parseParams: ParseParams,
    @inject(SequenceActions.INVOKE_METHOD) protected invoke: InvokeMethod,
    @inject(SequenceActions.SEND) public send: Send,
    @inject(SequenceActions.REJECT) public reject: Reject,
    @inject(AuthenticationBindings.AUTH_ACTION)
    protected authenticateRequest: AuthenticateFn,
  ) {}

  //Set response header
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setResponseHeader = (request: any, response: any) => {
    const headers = (request.headers as IncomingHttpHeaders) || {};
    const contentType = headers.accept ?? 'application/json';
    response.setHeader('Content-Type', contentType);
    response.setHeader('Cache-Control', ['no-cache', 'no-store']);
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (headers.origin) {
      response.setHeader('Access-Control-Allow-Origin', headers.origin);
      response.setHeader('Vary', 'Origin');
    }
  };

  async handle(context: RequestContext) {
    try {
      const {request, response} = context;
      this.setResponseHeader(request, response);
      const route = this.findRoute(request);
      await this.authenticateRequest(request);

      const args = await this.parseParams(request, route);
      const result = await this.invoke(route, args);

      this.send(response, result);
    } catch (err) {
      this.reject(context, err);
    }
  }
}
