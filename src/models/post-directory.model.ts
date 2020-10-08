import {Model, model, property} from '@loopback/repository';

@model()
export class PostDirectory extends Model {
  @property({
    type: 'string',
    required: true,
  })
  label: string;

  @property({
    type: 'string',
  })
  parentId?: string;

  @property({
    type: 'string',
    required: true,
  })
  tenantId: string;

  constructor(data?: Partial<PostDirectory>) {
    super(data);
  }
}

export interface PostDirectoryRelations {
  // describe navigational properties here
}

export type PostDirectoryWithRelations = PostDirectory & PostDirectoryRelations;
