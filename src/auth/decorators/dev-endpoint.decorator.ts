import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { DevEndpointGuard } from '../guards/dev-endpoint.guard';
import { ENDPOINT_IS_DEV_ENDPOINT_METADATA_KEY } from '../metadata';

// Indicate that an endpoint is a dev endpoint
export const DevEndpoint = (): MethodDecorator => {
  return applyDecorators(
    SetMetadata(ENDPOINT_IS_DEV_ENDPOINT_METADATA_KEY, true),
    UseGuards(DevEndpointGuard),
  );
};
