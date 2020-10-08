import {
  bind,
  Interceptor,
  InvocationContext,
  InvocationResult,
  Provider,
  ValueOrPromise,
} from '@loopback/context';
import {ERR_STRS} from './error-mapping';
import {HttpErrors} from '@loopback/rest';

/**
 * This class will be bound to the application as an `Interceptor` during
 * `boot`
 */
@bind({tags: {key: TransformErrorInterceptor.BINDING_KEY}})
export class TransformErrorInterceptor implements Provider<Interceptor> {
  static readonly BINDING_KEY = `interceptors.${TransformErrorInterceptor.name}`;

  /*
  constructor() {}
  */

  /**
   * This method is used by LoopBack context to produce an interceptor function
   * for the binding.
   *
   * @returns An interceptor function
   */
  value() {
    return this.intercept.bind(this);
  }

  /**
   * The logic to intercept an invocation
   * @param invocationCtx - Invocation context
   * @param next - A function to invoke next interceptor or the target method
   */
  async intercept(
    invocationCtx: InvocationContext,
    next: () => ValueOrPromise<InvocationResult>,
  ) {
    try {
      const result = await next();
      return result;
    } catch (err) {
      switch (err.message) {
        case ERR_STRS.UNAUTHORIZED:
          throw new HttpErrors.Unauthorized(err.message);

        case ERR_STRS.NOT_FOUND:
          throw new HttpErrors.NotFound(err.message);

        case ERR_STRS.UNPROCESSABLE_ENTITY:
          throw new HttpErrors.UnprocessableEntity(err.message);

        default:
          throw err;
      }
    }
  }
}
