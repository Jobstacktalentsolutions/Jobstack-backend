import { Provider } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { GenericResponseInterceptor } from '../interceptors';
// import { GenericExceptionFilter } from '../filters/exception.filter';

export const appProviders = (serviceName: string): Provider[] => [
  {
    provide: APP_INTERCEPTOR,
    useFactory: () => new GenericResponseInterceptor(serviceName),
  },
  // {
  //   provide: APP_FILTER,
  //   useFactory: () => new GenericExceptionFilter(serviceName),
  // },
];
