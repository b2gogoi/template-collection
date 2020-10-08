import {Entity, model, property} from '@loopback/repository';

@model({
  name: 'Directory',
  settings: {
    dynamodb: {
      tableName: 'Directories',
      partitionKey: 'tenantId',
    },
  },
})
export class Directory extends Entity {
  @property({
    type: 'string',
    id: true,
    generated: false,
    required: true,
  })
  id: string;

  @property({
    type: 'string',
  })
  label: string;

  @property({
    type: 'string',
  })
  parentId: string;

  @property({
    type: 'boolean',
    default: false,
  })
  deleted: boolean;

  @property({
    type: 'string',
  })
  tenantId: string;

  @property({
    type: 'string',
  })
  createdBy: string;

  @property({
    type: 'string',
  })
  createdAt: string;

  @property({
    type: 'string',
  })
  modifiedBy: string;

  @property({
    type: 'string',
  })
  modifiedAt: string;

  constructor(data?: Partial<Directory>) {
    super(data);
  }
}

export interface DirectoryRelations {
  // describe navigational properties here
}

export type DirectoryWithRelations = Directory & DirectoryRelations;
